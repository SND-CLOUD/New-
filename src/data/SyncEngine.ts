import { localDb } from '../lib/local-db';
import { LocalProviderInstance } from './LocalProvider';
import { FirebaseProviderInstance } from './FirebaseProvider';

function isPermissionError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  const code = String(err.code || '').toLowerCase();
  return (
    code === 'permission-denied' ||
    msg.includes('permission-denied') ||
    msg.includes('insufficient permissions') ||
    msg.includes('permission')
  );
}


const parseToMs = (val: any): number => {
  if (!val) return 0;
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (typeof val === 'number') return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

const getItemTimestamp = (item: any): number => {
  if (!item) return 0;
  return (
    parseToMs(item.updatedAt) ||
    parseToMs(item.timestamp) ||
    parseToMs(item.createdAt) ||
    parseToMs(item.deliveredAt) ||
    parseToMs(item.lastModified) ||
    0
  );
};

export class SyncEngine {
  private static syncing = false;
  private static paused = false;
  private static globalLockActive = false;
  private static lockUnsub: (() => void) | null = null;
  private static activeListeners: (() => void)[] = [];

  static pauseSync() { this.paused = true; console.log("Sync paused"); }
  static resumeSync() { this.paused = false; console.log("Sync resumed"); }
  static isPaused(): boolean { return this.paused || this.globalLockActive; }

  static getDeviceId(): string {
    let id = localStorage.getItem('snd_device_id');
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
      localStorage.setItem('snd_device_id', id);
    }
    return id;
  }

  static async acquireGlobalLock(reason: string = 'OPERATION'): Promise<boolean> {
    this.pauseSync();
    const mode = localStorage.getItem('snd_db_provider_mode') || 'AUTO';
    if (mode === 'LOCAL') return true;

    try {
      const deviceId = this.getDeviceId();
      await FirebaseProviderInstance.setDoc('system_locks', 'sync_lock', {
        isLocked: true,
        lockedBy: deviceId,
        reason,
        lockedAt: new Date().toISOString(),
        timestamp: Date.now()
      });
      console.log(`[SyncEngine] Acquired global cloud sync lock for ${reason}`);
      return true;
    } catch (e) {
      console.warn('[SyncEngine] Failed to acquire global cloud sync lock (offline or permission issue):', e);
      return false;
    }
  }

  static async releaseGlobalLock(): Promise<void> {
    this.resumeSync();
    const mode = localStorage.getItem('snd_db_provider_mode') || 'AUTO';
    if (mode === 'LOCAL') return;

    try {
      const deviceId = this.getDeviceId();
      await FirebaseProviderInstance.setDoc('system_locks', 'sync_lock', {
        isLocked: false,
        lockedBy: null,
        releasedBy: deviceId,
        releasedAt: new Date().toISOString(),
        timestamp: Date.now()
      });
      console.log('[SyncEngine] Released global cloud sync lock');
    } catch (e) {
      console.warn('[SyncEngine] Failed to release global cloud sync lock:', e);
    }
  }

  static startCloudLockListener() {
    const mode = localStorage.getItem('snd_db_provider_mode') || 'AUTO';
    if (mode === 'LOCAL') return;
    if (this.lockUnsub) return;

    try {
      this.lockUnsub = FirebaseProviderInstance.onSnapshotDoc('system_locks', 'sync_lock', (snap: any) => {
        if (!snap || !snap.exists()) {
          this.globalLockActive = false;
          return;
        }
        const data = snap.data();
        const myId = this.getDeviceId();

        if (data && data.isLocked && data.lockedBy !== myId) {
          const lockTime = data.timestamp || (data.lockedAt ? new Date(data.lockedAt).getTime() : 0);
          const now = Date.now();
          if (lockTime > 0 && (now - lockTime) > 10 * 60 * 1000) {
            console.warn('[SyncEngine] Global lock from another device expired (>10 mins). Ignoring lock.');
            this.globalLockActive = false;
          } else {
            console.log(`[SyncEngine] Global cloud sync lock is active by device ${data.lockedBy} (${data.reason || 'Operation'}). Pausing auto-sync on this device.`);
            this.globalLockActive = true;
          }
        } else {
          this.globalLockActive = false;
        }
      }, (err: any) => {
        console.warn('[SyncEngine] Lock listener error:', err);
      });
    } catch (e) {
      console.warn('[SyncEngine] Failed to start lock listener:', e);
    }
  }

  static stopCloudLockListener() {
    if (this.lockUnsub) {
      try { this.lockUnsub(); } catch (e) {}
      this.lockUnsub = null;
    }
  }

  static startCloudListener() {
    const mode = localStorage.getItem('snd_db_provider_mode') || 'AUTO';
    if (mode !== 'AUTO') return;

    this.startCloudLockListener();

    if (this.activeListeners.length > 0) {
      return;
    }

    console.log('SyncEngine: Initializing real-time Cloud -> Local sync listeners...');

    const tables = [
      'company_details',
      'customers',
      'invoices',
      'invoice_items',
      'vault_transactions',
      'maintenance_actions',
      'device_categories',
      'device_models',
      'approval_actions',
      'settings',
      'users',
      'engineers',
      'inventory_items',
      'fin_transaction_types',
      'fin_funds',
      'fin_currencies',
      'fin_payment_methods',
      'document_outputs',
      'job_titles',
      'user_devices'
    ];

    for (const table of tables) {
      try {
        const unsub = FirebaseProviderInstance.onSnapshot(table, undefined, async (snapshot: any) => {
          if (this.isPaused()) return;
          // Get IDs of documents currently pending local write in the outbox to avoid overwrite
          const pendingRes = await localDb.query(
            "SELECT recordId FROM outbox WHERE tableName = ? AND status IN ('PENDING', 'FAILED')",
            [table]
          );
          const pendingIds = new Set((pendingRes.values || []).map((r: any) => r.recordId));

          const processItems = snapshot.docChanges ? snapshot.docChanges() : snapshot.docs.map((doc: any) => ({ type: 'added', doc }));

          for (const change of processItems) {
            const doc = change.doc || change;
            const type = change.type || 'added';
            
            const cloudItem = doc.data ? doc.data() : doc;
            if (!cloudItem || !cloudItem.id) continue;
            if (pendingIds.has(cloudItem.id)) continue; // Skip pulling if there is a pending local write

            if (type === 'removed') {
              console.log(`SyncEngine [Realtime]: Deleting ${table}/${cloudItem.id} locally due to cloud removal.`);
              await LocalProviderInstance.deleteDoc(table, cloudItem.id);
              continue;
            }

            // Query only this single document locally to see if it needs update
            const localDocRes = await LocalProviderInstance.getDoc(table, cloudItem.id);
            const localItem = localDocRes.exists() ? localDocRes.data() : null;

            const localUpdatedMs = getItemTimestamp(localItem);
            const cloudUpdatedMs = getItemTimestamp(cloudItem);
            
            let needsDownload = false;
            if (!localItem) {
              needsDownload = true;
            } else if (cloudUpdatedMs > 0 && localUpdatedMs > 0) {
              if (cloudUpdatedMs > localUpdatedMs) {
                needsDownload = true;
              } else if (cloudUpdatedMs === localUpdatedMs) {
                if (JSON.stringify(cloudItem) !== JSON.stringify(localItem)) {
                  needsDownload = true;
                }
              }
            } else if (cloudUpdatedMs > 0 && localUpdatedMs === 0) {
              needsDownload = true;
            } else if (cloudUpdatedMs === 0 && localUpdatedMs === 0) {
              const cStr = JSON.stringify(cloudItem);
              const lStr = JSON.stringify(localItem);
              if (cStr !== lStr) {
                needsDownload = true;
              }
            }

            if (needsDownload) {
              console.log(`SyncEngine [Realtime]: Down-syncing ${table}/${cloudItem.id} from cloud.`);
              try {
                await LocalProviderInstance.setDoc(table, cloudItem.id, cloudItem, undefined, 'BYPASS_OUTBOX');
                if (table === 'company_details' && cloudItem.id === 'main_details') {
                  await localDb.run("DELETE FROM company_details WHERE id = 'default-company'").catch(() => {});
                }
              } catch (docErr) {
                console.error(`SyncEngine [Realtime]: Failed down-syncing ${table}/${cloudItem.id}:`, docErr);
              }
            }
          }
        }, (err: any) => {
          console.warn(`SyncEngine [Realtime]: Listener error on ${table}:`, err);
        });

        this.activeListeners.push(unsub);
      } catch (e) {
        console.error(`SyncEngine [Realtime]: Failed to setup listener for table ${table}:`, e);
      }
    }
  }

  static stopCloudListener() {
    this.stopCloudLockListener();
    this.activeListeners.forEach(unsub => {
      try { unsub(); } catch (e) {}
    });
    this.activeListeners = [];
    console.log('SyncEngine: Stopped real-time Cloud -> Local sync listeners.');
  }

  static isSyncing(): boolean {
    return this.syncing;
  }

  static async syncAll(force = false): Promise<{ success: boolean; message: string; syncedCount?: number }> {
    if (this.isPaused()) return { success: true, message: "Paused", syncedCount: 0 };
    if (this.syncing && !force) {
      return { success: false, message: 'عملية المزامنة قيد التشغيل حالياً.' };
    }

    this.syncing = true;
    let syncedCount = 0;

    try {
      // 1. Process Outbox (Local -> Cloud) in chronological order (FIFO)
      const outboxRes = await localDb.query(
        "SELECT * FROM outbox WHERE status IN ('PENDING', 'FAILED') ORDER BY timestamp ASC, id ASC"
      );

      const items = outboxRes.values || [];
      if (items.length > 0) {
        console.log(`SyncEngine: Found ${items.length} pending operations in outbox.`);
        const processedIds = new Set<string>();

        for (const item of items) {
          if (processedIds.has(item.id)) continue;

          const txGroupId = item.transactionGroupId;
          if (txGroupId) {
            // Group transactional operations together
            const groupItems = items.filter(it => it.transactionGroupId === txGroupId);
            groupItems.forEach(it => processedIds.add(it.id));

            console.log(`SyncEngine: Syncing transactional group ${txGroupId} with ${groupItems.length} operations.`);

            try {
              // We use Firestore writeBatch to guarantee atomic sync of related rows
              const batch = FirebaseProviderInstance.writeBatch();

              for (const gItem of groupItems) {
                const { tableName, recordId, action, payload } = gItem;
                const parsedPayload = payload ? JSON.parse(payload) : null;
                if (payload && payload.length > 900000 && parsedPayload) {

                  if (parsedPayload.data) {

                    if (parsedPayload.data.logoUrl) parsedPayload.data.logoUrl = "";

                    if (parsedPayload.data.logo) parsedPayload.data.logo = "";

                  }

                  if (parsedPayload.logoUrl) parsedPayload.logoUrl = "";

                  if (parsedPayload.logo) parsedPayload.logo = "";

                }
                const docRef = { name: tableName, id: recordId };

                if (action === 'SET') {
                  const { data, options } = parsedPayload || {};
                  batch.set(docRef, data, options);
                } else if (action === 'UPDATE') {
                  batch.update(docRef, parsedPayload);
                } else if (action === 'DELETE') {
                  batch.delete(docRef);
                }
              }

              // Commit atomically to Firestore
              await batch.commit();

              // Delete group from local Outbox
              const placeholders = groupItems.map(() => '?').join(', ');
              await localDb.run(
                `DELETE FROM outbox WHERE id IN (${placeholders})`,
                groupItems.map(it => it.id)
              );

              syncedCount += groupItems.length;
              console.log(`SyncEngine: Successfully synced group ${txGroupId}.`);

            } catch (err: any) {
              if (isPermissionError(err)) {
                console.warn(`SyncEngine: Permission denied for group ${txGroupId}. Marking group status as PERMISSION_DENIED to prevent queue block.`, err);
                for (const gItem of groupItems) {
                  await localDb.run(
                    "UPDATE outbox SET status = 'PERMISSION_DENIED', retryCount = retryCount + 1 WHERE id = ?",
                    [gItem.id]
                  );
                }
                continue;
              }
              console.error(`SyncEngine: Failed to sync group ${txGroupId}:`, err);
              // Mark group as FAILED and pause queue processing to preserve FIFO order
              for (const gItem of groupItems) {
                await localDb.run(
                  "UPDATE outbox SET status = 'FAILED', retryCount = retryCount + 1 WHERE id = ?",
                  [gItem.id]
                );
              }
              this.syncing = false;
              return { success: false, message: `فشلت مزامنة العمليات المترابطة: ${err.message || err}` };
            }

          } else {
            // Process single outbox item
            processedIds.add(item.id);
            const { id, tableName, recordId, action, payload } = item;
            const parsedPayload = payload ? JSON.parse(payload) : null;
                if (payload && payload.length > 900000 && parsedPayload) {

                  if (parsedPayload.data) {

                    if (parsedPayload.data.logoUrl) parsedPayload.data.logoUrl = "";

                    if (parsedPayload.data.logo) parsedPayload.data.logo = "";

                  }

                  if (parsedPayload.logoUrl) parsedPayload.logoUrl = "";

                  if (parsedPayload.logo) parsedPayload.logo = "";

                }

            console.log(`SyncEngine: Syncing single operation ${action} on ${tableName}/${recordId}.`);

            try {
              if (action === 'SET') {
                const { data, options } = parsedPayload || {};
                await FirebaseProviderInstance.setDoc(tableName, recordId, data, options);
              } else if (action === 'UPDATE') {
                await FirebaseProviderInstance.updateDoc(tableName, recordId, parsedPayload);
              } else if (action === 'DELETE') {
                await FirebaseProviderInstance.deleteDoc(tableName, recordId);
              }

              // Success: Delete from local outbox
              await localDb.run("DELETE FROM outbox WHERE id = ?", [id]);
              syncedCount++;
              console.log(`SyncEngine: Successfully synced item ${id}.`);

            } catch (err: any) {
              if (isPermissionError(err)) {
                console.warn(`SyncEngine: Permission denied for item ${id}. Marking status as PERMISSION_DENIED to prevent queue block.`, err);
                await localDb.run(
                  "UPDATE outbox SET status = 'PERMISSION_DENIED', retryCount = retryCount + 1 WHERE id = ?",
                  [id]
                );
                continue;
              }
              console.error(`SyncEngine: Failed to sync item ${id}:`, err);
              await localDb.run(
                "UPDATE outbox SET status = 'FAILED', retryCount = retryCount + 1 WHERE id = ?",
                [id]
              );
              // Pause queue processing to preserve chronological ordering
              this.syncing = false;
              return { success: false, message: `فشلت مزامنة العملية ${tableName}/${recordId}: ${err.message || err}` };
            }
          }
        }
      }

      // 2. Fetch updates from cloud (Cloud -> Local) - Only if forced, as real-time listener handles it
      if (force) {
        const tables = [
          'company_details',
          'customers',
          'invoices',
          'invoice_items',
          'vault_transactions',
          'maintenance_actions',
          'device_categories',
          'device_models',
          'approval_actions',
          'settings',
          'users',
          'engineers',
          'inventory_items',
          'fin_transaction_types',
          'fin_funds',
          'fin_currencies',
          'fin_payment_methods',
          'document_outputs',
          'job_titles',
          'user_devices'
        ];

        for (const table of tables) {
          // Find IDs of documents with pending local writes in the outbox
          const pendingRes = await localDb.query(
            "SELECT recordId FROM outbox WHERE tableName = ? AND status IN ('PENDING', 'FAILED')",
            [table]
          );
          const pendingIds = new Set((pendingRes.values || []).map(r => r.recordId));

          // Fetch cloud records
          let cloudItems: any[] = [];
          try {
            const cloudRes = await FirebaseProviderInstance.getDocs(table);
            cloudItems = cloudRes.docs.map((d: any) => ({ id: d.id, ...d.data() }));
          } catch (err) {
            console.warn(`SyncEngine: Could not fetch cloud records for table ${table}:`, err);
            continue; // Skip table if cloud fetch fails (e.g. offline)
          }

          // Fetch local records
          const localRes = await LocalProviderInstance.getDocs(table);
          const localItems = localRes.docs.map((d: any) => d.data());
          const localMap = new Map<string, any>();
          localItems.forEach(it => {
            if (it && it.id) localMap.set(it.id, it);
          });

          // Sync Cloud -> Local
          for (const cloudItem of cloudItems) {
            if (!cloudItem || !cloudItem.id) continue;
            if (pendingIds.has(cloudItem.id)) continue; // Skip pulling if there is a pending local write

            const localItem = localMap.get(cloudItem.id);
            const localUpdatedMs = getItemTimestamp(localItem);
            const cloudUpdatedMs = getItemTimestamp(cloudItem);

            let needsDownload = false;
            if (!localItem) {
              needsDownload = true;
            } else if (cloudUpdatedMs > 0 && localUpdatedMs > 0) {
              if (cloudUpdatedMs > localUpdatedMs) {
                needsDownload = true;
              } else if (cloudUpdatedMs === localUpdatedMs) {
                if (JSON.stringify(cloudItem) !== JSON.stringify(localItem)) {
                  needsDownload = true;
                }
              }
            } else if (cloudUpdatedMs > 0 && localUpdatedMs === 0) {
              needsDownload = true;
            } else if (cloudUpdatedMs === 0 && localUpdatedMs === 0) {
              const cStr = JSON.stringify(cloudItem);
              const lStr = JSON.stringify(localItem);
              if (cStr !== lStr) {
                needsDownload = true;
              }
            }

            if (needsDownload) {
              // Bypass outbox queuing during down-sync by using the 'BYPASS_OUTBOX' txGroupId
              try {
                await LocalProviderInstance.setDoc(table, cloudItem.id, cloudItem, undefined, 'BYPASS_OUTBOX');
                if (table === 'company_details' && cloudItem.id === 'main_details') {
                  await localDb.run("DELETE FROM company_details WHERE id = 'default-company'").catch(() => {});
                }
                syncedCount++;
              } catch (docErr) {
                console.error(`SyncEngine: Failed down-syncing ${table}/${cloudItem.id}:`, docErr);
              }
            }
          }
        }
      }

      return {
        success: true,
        message: syncedCount > 0 ? `تمت المزامنة بنجاح! تم نقل وتحديث ${syncedCount} سِجل.` : 'النظام متزامن بالكامل مع السحابة.',
        syncedCount
      };

    } catch (error: any) {
      console.error('SyncEngine: Data synchronization failed:', error);
      return { success: false, message: `فشلت المزامنة: ${error.message || error}` };
    } finally {
      this.syncing = false;
    }
  }
}
