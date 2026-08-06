import { localDb } from './local-db';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Device } from '@capacitor/device';
import { collection, getDocs, setDoc, deleteDoc, db, doc, query, where } from '../firebase';
import { parseDate } from './dateUtils';

const TABLES_TO_BACKUP = [
  'users',
  'settings',
  'company_details',
  'customers',
  'invoices',
  'invoice_items',
  'vault_transactions',
  'maintenance_actions',
  'inventory_items',
  'device_categories',
  'device_models',
  'engineers',
  'approval_actions',
  'fin_transaction_types',
  'fin_funds',
  'fin_currencies',
  'fin_payment_methods',
  'user_devices',
  'document_outputs',
  'job_titles'
];

function normalizeRowDates(row: any): any {
  if (!row) return row;
  if (Array.isArray(row)) {
    return row.map(normalizeRowDates);
  }
  if (typeof row !== 'object') return row;

  const cleaned: Record<string, any> = { ...row };
  const knownDateFields = [
    'createdAt', 'updatedAt', 'timestamp', 'actionDate', 'deliveredAt',
    'output_datetime', 'date', 'blockDate', 'lastLogin', 'lastLogout',
    'created_at', 'updated_at', 'last_login', 'last_logout',
    'exitDate', 'entryDate', 'issueDate', 'deliveryDate'
  ];

  for (const key of Object.keys(cleaned)) {
    const val = cleaned[key];
    if (val === null || val === undefined) continue;

    const lowerKey = key.toLowerCase();
    const isDateField = knownDateFields.includes(key) || lowerKey.includes('date') || lowerKey.includes('time') || lowerKey.includes('timestamp') || lowerKey.includes('created') || lowerKey.includes('updated') || lowerKey.endsWith('at');

    if (isDateField) {
      const parsed = parseDate(val);
      if (parsed && !isNaN(parsed.getTime())) {
        cleaned[key] = parsed.toISOString();
      }
    } else if (typeof val === 'object') {
      const parsed = parseDate(val);
      if (parsed && !isNaN(parsed.getTime())) {
        cleaned[key] = parsed.toISOString();
      } else {
        cleaned[key] = normalizeRowDates(val);
      }
    }
  }
  return cleaned;
}

export async function generateBackupData(): Promise<string> {
  const backup: Record<string, any[]> = {};
  const provider = (await import('../data/ProviderFactory')).ProviderFactory.getProvider();
  
  for (const table of TABLES_TO_BACKUP) {
    try {
      const snap = await provider.getDocs(table);
      backup[table] = snap.docs.map((d: any) => normalizeRowDates({ ...d.data(), id: d.id }));
    } catch (e) {
      console.error(`Error backing up table ${table}:`, e);
      backup[table] = [];
    }
  }

  const exportData = {
    version: 1,
    timestamp: new Date().toISOString(),
    data: backup
  };

  return JSON.stringify(exportData);
}

export async function restoreBackupData(jsonString: string): Promise<boolean> {
  let SE: any = null;
  try {
    SE = (await import("../data/SyncEngine")).SyncEngine;
    if (SE && typeof SE.acquireGlobalLock === 'function') {
      await SE.acquireGlobalLock('BACKUP_RESTORE');
    } else if (SE && typeof SE.pauseSync === 'function') {
      SE.pauseSync();
    }
  } catch (e) {}

  try {
    const importData = JSON.parse(jsonString);
    if (!importData) {
      throw new Error('Invalid backup file format');
    }

    const data = importData.data ? importData.data : importData;
    const allTables = Array.from(new Set([...TABLES_TO_BACKUP, ...Object.keys(data)]));

    const ProviderFactory = (await import('../data/ProviderFactory')).ProviderFactory;
    const dbMode = ProviderFactory.getMode();

    let targetProvider: any;
    if (dbMode === 'LOCAL') {
      targetProvider = (await import('../data/LocalProvider')).LocalProviderInstance;
    } else if (dbMode === 'CLOUD') {
      targetProvider = (await import('../data/FirebaseProvider')).FirebaseProviderInstance;
    } else {
      targetProvider = ProviderFactory.getProvider();
    }

    for (const table of allTables) {
      if (data[table] && Array.isArray(data[table])) {
        // Clear existing data from target provider
        try {
          if (dbMode === 'LOCAL') {
            await localDb.run(`DELETE FROM ${table}`);
          } else {
            const existingSnap = await targetProvider.getDocs(table);
            for (const existingDoc of existingSnap.docs) {
              await targetProvider.deleteDoc(table, existingDoc.id, 'BYPASS_OUTBOX');
            }
          }
        } catch (e) {
          console.warn(`Could not clear table/collection ${table}:`, e);
        }
        
        // Insert new data
        for (const row of data[table]) {
          const id = row.id || row._id;
          if (id) {
            const normalizedRow = normalizeRowDates({ ...row, id });
            await targetProvider.setDoc(table, id, normalizedRow, undefined, 'BYPASS_OUTBOX');
          }
        }
      }
    }
    
    // Auto-calibrate counters in settings/app after backup restore
    try {
      const invoicesSnap = await targetProvider.getDocs('invoices');
      let maxInvoice = 0;
      invoicesSnap.docs.forEach((d: any) => {
        const num = parseInt(d.data()?.invoiceNumber, 10);
        if (!isNaN(num) && num > maxInvoice) maxInvoice = num;
      });

      const customersSnap = await targetProvider.getDocs('customers');
      let maxCustomer = 0;
      customersSnap.docs.forEach((d: any) => {
        const num = parseInt(d.data()?.customerNumber, 10);
        if (!isNaN(num) && num > maxCustomer) maxCustomer = num;
      });

      // Update counters in settings/app document
      let existingSettings = await targetProvider.getDoc('settings', 'app');
      if (existingSettings.exists()) {
        await targetProvider.updateDoc('settings', 'app', {
          lastInvoiceNumber: maxInvoice,
          lastCustomerNumber: maxCustomer
        }, 'BYPASS_OUTBOX');
      } else {
        await targetProvider.setDoc('settings', 'app', {
          lastInvoiceNumber: maxInvoice,
          lastCustomerNumber: maxCustomer
        }, undefined, 'BYPASS_OUTBOX');
      }
    } catch (err) {
      console.warn('Failed to recalibrate settings counters after restore:', err);
    }

    // Attempt to persist local storage triggers if needed
    localStorage.setItem('snd_wipe_v1', 'done'); // avoid triggering wipe
    return true;
  } catch (e) {
    console.error('Error during restore:', e);
    throw e;
  } finally {
    if (SE) {
      try {
        if (typeof SE.releaseGlobalLock === 'function') {
          await SE.releaseGlobalLock();
        } else if (typeof SE.resumeSync === 'function') {
          SE.resumeSync();
        }
      } catch (err) {}
    }
  }
}

export function getFormattedBackupTimestamp(): string {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${YYYY}${MM}${DD}${HH}${mm}`;
}

export async function exportBackupFile(customName?: string, customPath?: string) {
  try {
    const jsonData = await generateBackupData();
    
    let rawName = (customName || '').trim();
    rawName = rawName.replace(/^snd_backup_/, '').replace(/\.json$/i, '').replace(/\.js$/i, '').trim();
    
    if (!rawName) {
      rawName = getFormattedBackupTimestamp();
    }
    
    const fileName = `snd_backup_${rawName}.json`;
    
    const info = await Device.getInfo();
    if (info.platform === 'web') {
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true, message: `تم التصدير بنجاح باسم (${fileName})` };
    } else {
      // Save to device
      const savePath = customPath ? `${customPath.replace(/\/$/, '')}/${fileName}` : fileName;
      const result = await Filesystem.writeFile({
        path: savePath,
        data: jsonData,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true
      });
      
      // Share it so user can save it elsewhere
      await Share.share({
        title: 'نسخة احتياطية للبيانات',
        text: 'نسخة احتياطية من برنامج إدارة الصيانة',
        url: result.uri,
        dialogTitle: 'حفظ النسخة الاحتياطية'
      });
      
      return { success: true, message: `تم حفظ النسخة الاحتياطية بنجاح باسم (${fileName})` };
    }
  } catch (error: any) {
    console.error('Export failed:', error);
    return { success: false, message: 'فشل التصدير: ' + (error?.message || error) };
  }
}

export async function archiveOldData(monthsToKeep: number = 12) {
  try {
    // Determine cutoff date
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);
    const cutoffISO = cutoffDate.toISOString();
    
    // We only delete invoices, invoice_items, and transactions older than cutoffDate
    // and where status is completed/delivered (e.g., 'delivered', 'returned', '60', '70')
    const completedStatuses = ['delivered', 'returned', '60', '70'];
    
    // Delete invoice items
    for (const status of completedStatuses) {
      const q = query(collection(db, 'invoice_items'), where('status', '==', status), where('createdAt', '<', cutoffISO));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'invoice_items', d.id));
      }
    }
    
    // Delete invoices
    for (const status of completedStatuses) {
      const q = query(collection(db, 'invoices'), where('status', '==', status), where('createdAt', '<', cutoffISO));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'invoices', d.id));
      }
    }
    
    return { success: true, message: 'تم الأرشفة والحذف بنجاح' };
  } catch (error) {
    console.error('Archive failed:', error);
    return { success: false, message: 'فشل الأرشفة' };
  }
}
