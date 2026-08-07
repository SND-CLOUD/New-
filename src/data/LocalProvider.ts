import { IDataProvider } from './IDataProvider';
import { localDb } from '../lib/local-db';
import { generateUUID } from './utils';
import { parseDate } from '../lib/dateUtils';
import { ProviderFactory } from './ProviderFactory';

export class LocalProvider implements IDataProvider {
  async getDoc(collectionName: string, id: string): Promise<any> {
    if (collectionName === 'settings') {
      const res = await localDb.query('SELECT * FROM settings WHERE id = ?', [id]);
      if (res.values && res.values.length > 0) {
        return {
          exists: () => true,
          id,
          data: () => JSON.parse(res.values[0].data)
        };
      }
      return { id, exists: () => false, data: () => undefined };
    }

    const res = await localDb.query(`SELECT * FROM ${collectionName} WHERE id = ?`, [id]);
    if (res.values && res.values.length > 0) {
      const data = { ...res.values[0] };
      this.wrapDatesInObject(data);
      return {
        exists: () => true,
        id,
        data: () => data
      };
    }
    return { id, exists: () => false, data: () => undefined };
  }

  async getDocs(collectionName: string, constraints?: any[]): Promise<any> {
    let sql = `SELECT * FROM ${collectionName}`;
    const params: any[] = [];

    const wheres = constraints?.filter((c: any) => c.type === 'where') || [];
    if (wheres.length > 0) {
      sql += ' WHERE ' + wheres.map((w: any) => {
        params.push(w.value);
        const op = w.op === '==' ? '=' : w.op;
        return `${w.field} ${op} ?`;
      }).join(' AND ');
    }

    const orders = constraints?.filter((c: any) => c.type === 'orderBy') || [];
    if (orders.length > 0) {
      sql += ' ORDER BY ' + orders.map((o: any) => `${o.field} ${o.dir}`).join(', ');
    }

    const lim = constraints?.find((c: any) => c.type === 'limit');
    if (lim) {
      sql += ` LIMIT ${lim.value}`;
    }

    const res = await localDb.query(sql, params);
    const docs = (res.values || []).map(rawDoc => {
      const docData = { ...rawDoc };
      if (docData.updates && typeof docData.updates === 'string') {
        try { docData.updates = JSON.parse(docData.updates); } catch (e) {}
      }
      if (docData.permissions && typeof docData.permissions === 'string') {
        try { docData.permissions = JSON.parse(docData.permissions); } catch (e) {}
      }
      this.wrapDatesInObject(docData);
      return {
        id: docData.id,
        ref: { name: collectionName, id: docData.id, path: `${collectionName}/${docData.id}` },
        data: () => docData
      };
    });

    return {
      docs,
      empty: docs.length === 0,
      size: docs.length,
      forEach: (cb: any) => docs.forEach(cb)
    };
  }

  private async queueInOutbox(
    tableName: string,
    recordId: string,
    action: 'SET' | 'UPDATE' | 'DELETE',
    payload: any,
    transactionGroupId?: string
  ): Promise<void> {
    const mode = ProviderFactory.getMode();
    if (mode !== 'AUTO' || transactionGroupId === 'BYPASS_OUTBOX') return;

    const outboxId = 'out-' + generateUUID();
    const timestamp = new Date().toISOString();
    const payloadStr = payload ? JSON.stringify(payload) : null;

    try {
      await localDb.run(
        `INSERT INTO outbox (id, tableName, recordId, action, payload, timestamp, status, retryCount, transactionGroupId) 
         VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 0, ?)`,
        [outboxId, tableName, recordId, action, payloadStr, timestamp, transactionGroupId || null]
      );
      console.log(`Outbox queued: ${action} on ${tableName}/${recordId} (Tx: ${transactionGroupId || 'none'})`);

      // Trigger sync in background if online
      if (true) {
        import('./SyncEngine').then(({ SyncEngine }) => {
          SyncEngine.syncAll().catch(e => console.error('Failed to run auto-sync on queue:', e));
        });
      }
    } catch (e) {
      console.error('Failed to insert into outbox table:', e);
    }
  }

  async setDoc(collectionName: string, id: string, data: any, options?: any, transactionGroupId?: string): Promise<void> {
    if (collectionName === "company_details") { id = "main_details"; data.id = "main_details"; }
    const cleanedData = { ...data };
    Object.keys(cleanedData).forEach(field => {
      const val = cleanedData[field];
      if (val && typeof val === 'object' && typeof val.toISOString === 'function') {
        try {
          cleanedData[field] = val.toISOString();
        } catch (e) {}
      }
    });

    if (collectionName === 'settings') {
      const existing = await localDb.query('SELECT * FROM settings WHERE id = ?', [id]);
      if (existing.values && existing.values.length > 0) {
        const merged = options?.merge ? { ...JSON.parse(existing.values[0].data), ...cleanedData } : cleanedData;
        await localDb.run('UPDATE settings SET data = ? WHERE id = ?', [JSON.stringify(merged), id]);
      } else {
        await localDb.run('INSERT INTO settings (id, data) VALUES (?, ?)', [id, JSON.stringify(cleanedData)]);
      }
    } else {
      const existing = await localDb.query(`SELECT * FROM ${collectionName} WHERE id = ?`, [id]);
      const mergedData = (options?.merge && existing.values && existing.values.length > 0)
        ? { ...existing.values[0], ...cleanedData }
        : cleanedData;

      const validColumns = await localDb.getTableColumns(collectionName);
      const validColumnsSet = new Set(validColumns);
      
      const finalData: Record<string, any> = {};
      Object.keys(mergedData).forEach(key => {
        if (validColumnsSet.has(key)) {
          finalData[key] = mergedData[key];
          if (finalData[key] && typeof finalData[key] === 'object' && !finalData[key].toISOString) {
            finalData[key] = JSON.stringify(finalData[key]);
          }
        } else {
          console.warn(`[LocalProvider] Ignoring field "${key}" not found in local table "${collectionName}"`);
        }
      });

      const fields = Object.keys(finalData);
      
      if (fields.length > 0) {
        const placeholders = fields.map(() => '?').join(', ');
        const updatePlaceholders = fields.map(f => `${f} = ?`).join(', ');

        if (existing.values && existing.values.length > 0) {
          await localDb.run(`UPDATE ${collectionName} SET ${updatePlaceholders} WHERE id = ?`, [...Object.values(finalData), id]);
        } else {
          await localDb.run(`INSERT OR REPLACE INTO ${collectionName} (id, ${fields.join(', ')}) VALUES (?, ${placeholders})`, [id, ...Object.values(finalData)]);
        }
      } else if (!existing.values || existing.values.length === 0) {
        // Just insert ID if no other valid fields exist
        await localDb.run(`INSERT OR REPLACE INTO ${collectionName} (id) VALUES (?)`, [id]);
      }
    }

    // Queue in Outbox
    await this.queueInOutbox(collectionName, id, 'SET', { data, options }, transactionGroupId);

    // Trigger notification
    const res = await localDb.query(`SELECT * FROM ${collectionName}`);
    localDb.notify(collectionName, res.values || []);
  }

  async addDoc(collectionName: string, data: any): Promise<{ id: string }> {
    const id = data.id || generateUUID();
    await this.setDoc(collectionName, id, { ...data, id });
    return { id };
  }

  async updateDoc(collectionName: string, id: string, data: any, transactionGroupId?: string): Promise<void> {
    const validColumns = await localDb.getTableColumns(collectionName);
    const validColumnsSet = new Set(validColumns);

    const cleanedData: Record<string, any> = {};
    const increments: { key: string, value: number }[] = [];

    Object.keys(data).forEach(key => {
      if (!validColumnsSet.has(key)) {
        console.warn(`[LocalProvider] Ignoring field "${key}" not found in local table "${collectionName}" during update`);
        return;
      }
      const val = data[key];
      if (val && typeof val === 'object') {
        if (val.type === 'increment') {
          increments.push({ key, value: val.value });
          return;
        }
        if (!val.toISOString) {
          cleanedData[key] = JSON.stringify(val);
        } else {
          try {
            cleanedData[key] = val.toISOString();
          } catch (e) {}
        }
      } else {
        cleanedData[key] = val;
      }
    });

    const fields = Object.keys(cleanedData);
    const updateParts = fields.map(f => `${f} = ?`);
    increments.forEach(inc => {
      updateParts.push(`${inc.key} = COALESCE(${inc.key}, 0) + ${inc.value}`);
    });

    if (updateParts.length > 0) {
      const sql = `UPDATE ${collectionName} SET ${updateParts.join(', ')} WHERE id = ?`;
      await localDb.run(sql, [...Object.values(cleanedData), id]);
    }

    // Queue in Outbox
    await this.queueInOutbox(collectionName, id, 'UPDATE', data, transactionGroupId);

    // Trigger notification
    const res = await localDb.query(`SELECT * FROM ${collectionName}`);
    localDb.notify(collectionName, res.values || []);
  }

  async deleteDoc(collectionName: string, id: string, transactionGroupId?: string): Promise<void> {
    await localDb.run(`DELETE FROM ${collectionName} WHERE id = ?`, [id]);

    // Queue in Outbox
    await this.queueInOutbox(collectionName, id, 'DELETE', null, transactionGroupId);

    const res = await localDb.query(`SELECT * FROM ${collectionName}`);
    localDb.notify(collectionName, res.values || []);
  }

  onSnapshot(
    collectionName: string,
    constraints: any[] | undefined,
    callback: (snapshot: any) => void,
    errorCallback?: any
  ): () => void {
    const unsubscribe = localDb.subscribe(collectionName, (data) => {
      try {
        let filtered = [...data];
        const wheres = constraints?.filter((c: any) => c.type === 'where') || [];
        wheres.forEach((w: any) => {
          filtered = filtered.filter(item => {
            if (w.op === '==' || w.op === '=') return item[w.field] === w.value;
            if (w.op === '>') return item[w.field] > w.value;
            if (w.op === '<') return item[w.field] < w.value;
            if (w.op === '>=') return item[w.field] >= w.value;
            if (w.op === '<=') return item[w.field] <= w.value;
            return true;
          });
        });

        const orders = constraints?.filter((c: any) => c.type === 'orderBy') || [];
        orders.forEach((o: any) => {
          filtered.sort((a, b) => {
            if (o.dir === 'desc') return b[o.field] > a[o.field] ? 1 : -1;
            return a[o.field] > b[o.field] ? 1 : -1;
          });
        });

        const docs = filtered.map(doc => {
          const docData = { ...doc };
          if (docData.updates && typeof docData.updates === 'string') {
            try { docData.updates = JSON.parse(docData.updates); } catch (e) {}
          }
          if (docData.permissions && typeof docData.permissions === 'string') {
            try { docData.permissions = JSON.parse(docData.permissions); } catch (e) {}
          }
          this.wrapDatesInObject(docData);
          return {
            id: docData.id,
            ref: { name: collectionName, id: docData.id, path: `${collectionName}/${docData.id}` },
            data: () => docData
          };
        });

        callback({
          docs,
          empty: filtered.length === 0,
          size: filtered.length,
          forEach: (cb: any) => docs.forEach(cb)
        });
      } catch (err) {
        if (errorCallback) errorCallback(err);
      }
    });

    return unsubscribe;
  }

  onSnapshotDoc(
    collectionName: string,
    id: string,
    callback: (snapshot: any) => void,
    errorCallback?: any
  ): () => void {
    const unsubscribe = localDb.subscribe(collectionName, (data) => {
      try {
        const rawDoc = data.find((d: any) => d.id === id);
        if (rawDoc) {
          const docData = { ...rawDoc };
          if (collectionName === 'settings' && docData.data) {
            try {
              const parsed = JSON.parse(docData.data);
              Object.assign(docData, parsed);
            } catch (e) {}
          }
          if (docData.permissions && typeof docData.permissions === 'string') {
            try { docData.permissions = JSON.parse(docData.permissions); } catch (e) {}
          }
          this.wrapDatesInObject(docData);
          callback({
            exists: () => true,
            id,
            data: () => docData
          });
        } else {
          callback({
            exists: () => false,
            id,
            data: () => undefined
          });
        }
      } catch (err) {
        if (errorCallback) errorCallback(err);
      }
    });

    return unsubscribe;
  }

  async runTransaction(updateFunction: any): Promise<any> {
    const txGroupId = 'tx-' + generateUUID();
    const transaction = {
      get: async (docRef: any) => this.getDoc(docRef.name, docRef.id),
      set: async (docRef: any, data: any) => this.setDoc(docRef.name, docRef.id, data, undefined, txGroupId),
      update: async (docRef: any, data: any) => this.updateDoc(docRef.name, docRef.id, data, txGroupId),
      delete: async (docRef: any) => this.deleteDoc(docRef.name, docRef.id, txGroupId)
    };
    return await updateFunction(transaction);
  }

  writeBatch(): any {
    const operations: any[] = [];
    return {
      set: (docRef: any, data: any, options?: any) => operations.push({ type: 'set', ref: docRef, data, options }),
      update: (docRef: any, data: any, options?: any) => operations.push({ type: 'update', ref: docRef, data, options }),
      delete: (docRef: any) => operations.push({ type: 'delete', ref: docRef }),
      commit: async () => {
        const txGroupId = 'tx-' + generateUUID();
        for (const op of operations) {
          if (op.type === 'set') await this.setDoc(op.ref.name, op.ref.id, op.data, op.options, txGroupId);
          if (op.type === 'update') await this.updateDoc(op.ref.name, op.ref.id, op.data, txGroupId);
          if (op.type === 'delete') await this.deleteDoc(op.ref.name, op.ref.id, txGroupId);
        }
      }
    };
  }

  // --- Specific Domain Methods ---
  async addInvoice(invoice: any): Promise<{ id: string }> {
    const id = invoice.id || generateUUID();
    const finalInvoice = { ...invoice, id };
    await this.setDoc('invoices', id, finalInvoice);
    return { id };
  }

  async getInvoices(): Promise<any[]> {
    const result = await this.getDocs('invoices');
    return result.docs.map((doc: any) => doc.data());
  }

  async getCustomer(id: string): Promise<any> {
    const result = await this.getDoc('customers', id);
    return result.exists() ? result.data() : null;
  }

  async savePayment(payment: any): Promise<void> {
    const id = payment.id || generateUUID();
    const finalPayment = { ...payment, id };
    await this.setDoc('vault_transactions', id, finalPayment);
  }

  // --- Helper Methods ---
  private wrapDatesInObject(obj: any) {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(item => this.wrapDatesInObject(item));
      return;
    }
    if (typeof obj !== 'object') return;

    const knownFields = [
      'createdAt', 'updatedAt', 'timestamp', 'actionDate', 'deliveredAt',
      'output_datetime', 'date', 'blockDate', 'lastLogin', 'lastLogout',
      'created_at', 'updated_at', 'last_login', 'last_logout',
      'exitDate', 'entryDate', 'issueDate', 'deliveryDate'
    ];

    Object.keys(obj).forEach(field => {
      const val = obj[field];
      if (val === null || val === undefined) return;

      const lower = field.toLowerCase();
      const isDateField = knownFields.includes(field) || lower.includes('date') || lower.includes('time') || lower.includes('timestamp') || lower.includes('created') || lower.includes('updated') || lower.endsWith('at');

      if (isDateField) {
        const d = parseDate(val);
        if (d && !isNaN(d.getTime())) {
          obj[field] = {
            toDate: () => d,
            toMillis: () => d.getTime(),
            toISOString: () => d.toISOString(),
            _isTimestamp: true
          };
        }
      } else if (typeof val === 'object') {
        const d = parseDate(val);
        if (d && !isNaN(d.getTime())) {
          obj[field] = {
            toDate: () => d,
            toMillis: () => d.getTime(),
            toISOString: () => d.toISOString(),
            _isTimestamp: true
          };
        } else {
          this.wrapDatesInObject(val);
        }
      }
    });
  }
}

export const LocalProviderInstance = new LocalProvider();
