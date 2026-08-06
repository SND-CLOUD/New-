
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Device } from '@capacitor/device';

export function sanitizeSqliteParam(val: any): any {
  if (val === undefined || val === null) {
    return null;
  }
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (typeof val === 'boolean') {
    return val ? 1 : 0;
  }
  if (typeof val === 'string') {
    return val;
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') {
      try {
        return val.toDate().toISOString();
      } catch (e) {}
    }
    if (typeof val.seconds === 'number') {
      try {
        return new Date(val.seconds * 1000).toISOString();
      } catch (e) {}
    }
    try {
      return JSON.stringify(val);
    } catch (e) {
      return String(val);
    }
  }
  return String(val);
}

class LocalDatabase {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private observers: Map<string, Set<(data: any[]) => void>> = new Map();
  private initializingPromise: Promise<void> | null = null;
  private queue: Promise<any> = Promise.resolve();

  private async enqueue<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  private getSqlite(): SQLiteConnection {
    if (!this.sqlite) {
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }
    return this.sqlite;
  }

  async initialize(): Promise<void> {
    if (this.db) {
      try {
        const isOpen = await this.db.isDBOpen();
        if (isOpen.result) {
          return;
        }
        await this.db.open();
        return;
      } catch (err) {
        console.warn('Database connection check/open failed, resetting connection...', err);
        this.db = null;
      }
    }
    if (this.initializingPromise) return this.initializingPromise;

    this.initializingPromise = (async () => {
      const info = await Device.getInfo();
      const platform = info.platform;
      const sqlite = this.getSqlite();

    try {
      if (platform === 'web') {
        const waitForJeepSqlite = async () => {
          const check = () => document.querySelector('jeep-sqlite');
          if (check()) return;
          
          return new Promise<void>((resolve) => {
            const observer = new MutationObserver(() => {
              if (check()) {
                observer.disconnect();
                resolve();
              }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            // Timeout after 2 seconds
            setTimeout(() => {
              observer.disconnect();
              resolve();
            }, 2000);
          });
        };

        await waitForJeepSqlite();
        await sqlite.initWebStore();
      }

      try {
        this.db = await sqlite.createConnection('snd_system', false, 'no-encryption', 1, false);
      } catch (connErr: any) {
        if (connErr?.message?.includes('already exists') || String(connErr).includes('already exists')) {
          try {
            this.db = await sqlite.retrieveConnection('snd_system', false);
          } catch (retrievalErr) {
            console.error('Failed to retrieve existing connection, attempting to close and retry', retrievalErr);
            try {
              await sqlite.closeConnection('snd_system', false);
            } catch (closeErr) {}
            this.db = await sqlite.createConnection('snd_system', false, 'no-encryption', 1, false);
          }
        } else {
          throw connErr;
        }
      }
      await this.db.open();
      
      // Schema Check for Users - drop if old schema
      try {
        await this.db.query("SELECT job_title_id FROM users LIMIT 1");
      } catch {
        await this.db.execute("DROP TABLE IF EXISTS users");
      }

      // Schema Check for Devices - drop if old schema
      try {
        await this.db.query("SELECT deviceType FROM user_devices LIMIT 1");
      } catch {
        await this.db.execute("DROP TABLE IF EXISTS user_devices");
      }

      // Create Tables
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS job_titles (
          id TEXT PRIMARY KEY,
          job_number INTEGER,
          title TEXT,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE,
          password TEXT,
          name TEXT,
          job_title_id TEXT,
          phone TEXT,
          email TEXT,
          account_status TEXT DEFAULT 'نشط',
          network_status TEXT DEFAULT 'غير متصل',
          linked_device_id TEXT,
          device_access_type TEXT DEFAULT 'عام',
          last_device_id TEXT,
          created_at TEXT,
          updated_at TEXT,
          last_login TEXT,
          last_logout TEXT,
          created_by_user_id TEXT,
          notes TEXT,
          role TEXT,
          isPrimary INTEGER,
          userNumber INTEGER,
          isActive INTEGER,
          permissions TEXT
        );

        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          data TEXT
        );

        CREATE TABLE IF NOT EXISTS company_details (
          id TEXT PRIMARY KEY,
          shopName TEXT,
          name TEXT,
          countryCode TEXT,
          phone1 TEXT,
          phone2 TEXT,
          landline TEXT,
          phone1Call INTEGER,
          phone1Whatsapp INTEGER,
          phone2Call INTEGER,
          phone2Whatsapp INTEGER,
          landlineCall INTEGER,
          landlineWhatsapp INTEGER,
          facebookUrl TEXT,
          mapUrl TEXT,
          email TEXT,
          liabilityCurrency TEXT,
          bio TEXT,
          logoUrl TEXT,
          logo TEXT,
          address TEXT,
          receiptNotes TEXT,
          managerName TEXT,
          commercialRecord TEXT,
          taxNumber TEXT,
          updatedAt TEXT,
          bankYerName TEXT,
          bankYerAccount TEXT,
          bankSarName TEXT,
          bankSarAccount TEXT,
          bankUsdName TEXT,
          bankUsdAccount TEXT,
          bankHolderName TEXT,
          fiscalYear TEXT,
          startDate TEXT
        );

        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          customerNumber INTEGER,
          name TEXT,
          phone1 TEXT,
          phone2 TEXT,
          companyName TEXT,
          email TEXT,
          liabilityCurrency TEXT,
          notes TEXT,
          hasWhatsapp INTEGER,
          createdAt TEXT,
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          invoiceNumber TEXT,
          customerId TEXT,
          customerName TEXT,
          currency TEXT,
          totalCost REAL,
          amountPaid REAL,
          discount REAL,
          tax REAL,
          status TEXT,
          createdAt TEXT,
          updatedAt TEXT,
          notes TEXT,
          cancelReason TEXT,
          printCount INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS invoice_items (
          id TEXT PRIMARY KEY,
          invoiceId TEXT,
          categoryId TEXT,
          deviceName TEXT,
          deviceType TEXT DEFAULT "عام",
          invoiceNumber TEXT,
          quantity INTEGER,
          faultType TEXT,
          deviceNotes TEXT,
          technicalNotes TEXT,
          cost REAL,
          status TEXT,
          subStatus TEXT,
          source TEXT,
          customerProblem TEXT,
          engineerReport TEXT,
          failureReason TEXT,
          unitCost REAL,
          deliveredAt TEXT,
          recipientName TEXT,
          createdBy TEXT,
          technician TEXT,
          createdAt TEXT,
          updatedAt TEXT,
          updatedBy TEXT,
          customerId TEXT,
          customerName TEXT
        );

        CREATE TABLE IF NOT EXISTS vault_transactions (
          id TEXT PRIMARY KEY,
          linkedTxId TEXT,
          currency TEXT,
          amount REAL,
          customerName TEXT,
          invoiceNumber TEXT,
          userName TEXT,
          userNumber INTEGER,
          userId TEXT,
          timestamp TEXT,
          type TEXT,
          notes TEXT,
          updatedAt TEXT,
          isReversed INTEGER DEFAULT 0,
          isReversal INTEGER DEFAULT 0,
          reversalOf TEXT,
          paymentType INTEGER,
          liabilityCurrency TEXT,
          liabilityAmount REAL,
          receiptCurrency TEXT,
          receiptAmount REAL,
          statementNote TEXT,
          bankDetails TEXT
        );

        CREATE TABLE IF NOT EXISTS maintenance_actions (
          id TEXT PRIMARY KEY,
          engineerName TEXT,
          actionDate TEXT,
          type TEXT,
          notes TEXT,
          updates TEXT, -- JSON string
          createdAt TEXT,
          updatedAt TEXT,
          userId TEXT,
          userName TEXT
        );

        CREATE TABLE IF NOT EXISTS inventory_items (
          id TEXT PRIMARY KEY,
          name TEXT,
          quantity INTEGER,
          minQuantity INTEGER,
          category TEXT,
          price REAL,
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS device_categories (
          id TEXT PRIMARY KEY,
          name TEXT,
          createdAt TEXT,
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS device_models (
          id TEXT PRIMARY KEY,
          categoryId TEXT,
          categoryName TEXT,
          name TEXT,
          createdAt TEXT,
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS engineers (
          id TEXT PRIMARY KEY,
          name TEXT,
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS approval_actions (
          id TEXT PRIMARY KEY,
          invoiceNumber TEXT,
          customerName TEXT,
          decision TEXT,
          date INTEGER,
          userId TEXT,
          userName TEXT,
          engineerName TEXT,
          actionDate INTEGER,
          type TEXT,
          updates TEXT,
          createdAt TEXT,
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS fin_transaction_types (
          id TEXT PRIMARY KEY,
          name TEXT,
          type TEXT
        );

        CREATE TABLE IF NOT EXISTS user_devices (
          id TEXT PRIMARY KEY,
          deviceNumber INTEGER,
          serialImei TEXT,
          deviceName TEXT,
          deviceType TEXT DEFAULT "عام",
          linkedUserName TEXT,
          linkedUserId TEXT,
          status TEXT,
          networkStatus TEXT,
          createdAt TEXT,
          lastLogin TEXT,
          lastLogout TEXT,
          blockDate TEXT,
          createdByUserId TEXT,
          createdByUserName TEXT,
          notes TEXT,
          isFrozen INTEGER DEFAULT 0,
          updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS fin_funds (
          id TEXT PRIMARY KEY,
          name TEXT,
          type TEXT,
          currency TEXT,
          description TEXT,
          status TEXT,
          balance REAL,
          bankAccount TEXT
        );

        CREATE TABLE IF NOT EXISTS fin_currencies (
          id TEXT PRIMARY KEY,
          name TEXT,
          symbol TEXT,
          decimals INTEGER,
          status TEXT
        );

        CREATE TABLE IF NOT EXISTS fin_payment_methods (
          id TEXT PRIMARY KEY,
          name TEXT,
          description TEXT,
          status TEXT
        );

        CREATE TABLE IF NOT EXISTS document_outputs (
          id TEXT PRIMARY KEY,
          document_id TEXT,
          document_number TEXT,
          output_type TEXT,
          output_datetime TEXT,
          user_id TEXT
        );
      `);

      // Ensure user_devices table is created for existing databases
      try {
        await this.db.run(`
          CREATE TABLE IF NOT EXISTS user_devices (
            id TEXT PRIMARY KEY,
            deviceNumber INTEGER,
            serialImei TEXT,
            deviceName TEXT,
            deviceType TEXT DEFAULT "عام",
            linkedUserName TEXT,
            linkedUserId TEXT,
            status TEXT,
            networkStatus TEXT,
            createdAt TEXT,
            lastLogin TEXT,
            lastLogout TEXT,
            blockDate TEXT,
            createdByUserId TEXT,
            createdByUserName TEXT,
            notes TEXT,
            isFrozen INTEGER DEFAULT 0,
            updatedAt TEXT
          );
        `);
      } catch (err) {}

      // Ensure all user_devices columns exist on existing databases
      const devCols = [
        'deviceNumber INTEGER',
        'serialImei TEXT',
        'deviceName TEXT',
        'deviceType TEXT',
        'linkedUserName TEXT',
        'linkedUserId TEXT',
        'status TEXT',
        'networkStatus TEXT',
        'createdAt TEXT',
        'lastLogin TEXT',
        'lastLogout TEXT',
        'blockDate TEXT',
        'createdByUserId TEXT',
        'createdByUserName TEXT',
        'notes TEXT',
        'isFrozen INTEGER DEFAULT 0',
        'updatedAt TEXT'
      ];
      for (const col of devCols) {
        try {
          await this.db.run(`ALTER TABLE user_devices ADD COLUMN ${col}`);
        } catch (e) {}
      }

      // Ensure document_outputs table is created for existing databases as well
      try {
        await this.db.run(`
          CREATE TABLE IF NOT EXISTS document_outputs (
            id TEXT PRIMARY KEY,
            document_id TEXT,
            document_number TEXT,
            output_type TEXT,
            output_datetime TEXT,
            user_id TEXT
          );
        `);
      } catch (err) {}

      // Ensure outbox table is created for existing databases as well
      try {
        await this.db.run(`
          CREATE TABLE IF NOT EXISTS outbox (
            id TEXT PRIMARY KEY,
            tableName TEXT,
            recordId TEXT,
            action TEXT,
            payload TEXT,
            timestamp TEXT,
            status TEXT DEFAULT 'PENDING',
            retryCount INTEGER DEFAULT 0,
            transactionGroupId TEXT
          );
        `);
      } catch (err) {
        console.error('Failed to create outbox table', err);
      }

      
      // Ensure financial tables are created for existing databases
      try {
        await this.db.run(`
          CREATE TABLE IF NOT EXISTS fin_transaction_types (
            id TEXT PRIMARY KEY,
            name TEXT,
            type TEXT
          );
        `);
      } catch (err) {}
      
      try {
        await this.db.run(`
          CREATE TABLE IF NOT EXISTS fin_funds (
            id TEXT PRIMARY KEY,
            name TEXT,
            type TEXT,
            currency TEXT,
            description TEXT,
            status TEXT,
            balance REAL,
            bankAccount TEXT
          );
        `);
      } catch (err) {}
      
      try {
        await this.db.run(`
          CREATE TABLE IF NOT EXISTS fin_currencies (
            id TEXT PRIMARY KEY,
            name TEXT,
            symbol TEXT,
            decimals INTEGER,
            status TEXT
          );
        `);
      } catch (err) {}
      
      try {
        await this.db.run(`
          CREATE TABLE IF NOT EXISTS fin_payment_methods (
            id TEXT PRIMARY KEY,
            name TEXT,
            description TEXT,
            status TEXT
          );
        `);
      } catch (err) {}

      // Attempt to add extra financial columns to existing vault_transactions table if needed
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN voucherNumber INTEGER');
      } catch (err) {}
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN transactionCategory TEXT');
      } catch (err) {}
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN fundId TEXT');
      } catch (err) {}
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN fundName TEXT');
      } catch (err) {}
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN paymentMethod TEXT');
      } catch (err) {}
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN customerId TEXT');
      } catch (err) {}

      // Attempt to add bank details columns to existing company_details table if needed
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN countryCode TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN bankYerName TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN bankYerAccount TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN bankSarName TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN bankSarAccount TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN bankUsdName TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN bankUsdAccount TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN bankHolderName TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN liabilityCurrency TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN updatedAt TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN fiscalYear TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN startDate TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN name TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN logo TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN receiptNotes TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN managerName TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN commercialRecord TEXT'); } catch (err) {}
      try { await this.db.run('ALTER TABLE company_details ADD COLUMN taxNumber TEXT'); } catch (err) {}

      // Attempt to add notes column to existing invoices table if needed
      try {
        await this.db.run('ALTER TABLE invoices ADD COLUMN notes TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add discount column to existing invoices table if needed
      try {
        await this.db.run('ALTER TABLE invoices ADD COLUMN discount REAL');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add tax column to existing invoices table if needed
      try {
        await this.db.run('ALTER TABLE invoices ADD COLUMN tax REAL');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add cancelReason column to existing invoices table if needed
      try {
        await this.db.run('ALTER TABLE invoices ADD COLUMN cancelReason TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add categoryName column to existing device_models table if needed
      try {
        await this.db.run('ALTER TABLE device_models ADD COLUMN categoryName TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add customerId column to existing invoice_items table if needed
      try {
        await this.db.run('ALTER TABLE invoice_items ADD COLUMN customerId TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add customerName column to existing invoice_items table if needed
      try {
        await this.db.run('ALTER TABLE invoice_items ADD COLUMN customerName TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add createdAt column to existing invoice_items table if needed
      try {
        await this.db.run('ALTER TABLE invoice_items ADD COLUMN createdAt TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }
      
      // Attempt to add categoryId column to existing invoice_items table if needed
      try {
        await this.db.run('ALTER TABLE invoice_items ADD COLUMN categoryId TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add deviceName column to existing invoice_items table if needed
      try {
        await this.db.run('ALTER TABLE invoice_items ADD COLUMN deviceName TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add deviceNotes column to existing invoice_items table if needed
      try {
        await this.db.run('ALTER TABLE invoice_items ADD COLUMN deviceNotes TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add permissions column to existing users table if needed
      try {
        await this.db.run('ALTER TABLE users ADD COLUMN permissions TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add isActive column to existing users table if needed
      try {
        await this.db.run('ALTER TABLE users ADD COLUMN isActive INTEGER');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add type column to existing maintenance_actions table if needed
      try {
        await this.db.run('ALTER TABLE maintenance_actions ADD COLUMN type TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add updatedAt column to existing maintenance_actions table if needed
      try {
        await this.db.run('ALTER TABLE maintenance_actions ADD COLUMN updatedAt TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add updatedAt column to existing inventory_items table if needed
      try {
        await this.db.run('ALTER TABLE inventory_items ADD COLUMN updatedAt TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add updatedAt column to existing engineers table if needed
      try {
        await this.db.run('ALTER TABLE engineers ADD COLUMN updatedAt TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add updatedAt column to existing customers table if needed
      try {
        await this.db.run('ALTER TABLE customers ADD COLUMN updatedAt TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add companyName column to existing customers table if needed
      try {
        await this.db.run('ALTER TABLE customers ADD COLUMN companyName TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add email column to existing customers table if needed
      try {
        await this.db.run('ALTER TABLE customers ADD COLUMN email TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add notes column to existing customers table if needed
      try {
        await this.db.run('ALTER TABLE customers ADD COLUMN notes TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      try {
        await this.db.run('ALTER TABLE customers ADD COLUMN hasWhatsapp INTEGER');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add liabilityCurrency column to existing customers table if needed
      try {
        await this.db.run('ALTER TABLE customers ADD COLUMN liabilityCurrency TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add customerNumber column to existing customers table if needed
      try {
        await this.db.run('ALTER TABLE customers ADD COLUMN customerNumber INTEGER');
      // Attempt to add linkedTxId column to existing vault_transactions table if needed
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN linkedTxId TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add updatedAt column to existing invoice_items table if needed
      try {
        await this.db.run('ALTER TABLE invoice_items ADD COLUMN updatedAt TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add updatedBy column to existing invoice_items table if needed
      try {
        await this.db.run('ALTER TABLE invoice_items ADD COLUMN updatedBy TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add subStatus column to existing invoice_items table if needed
      try {
        await this.db.run('ALTER TABLE invoice_items ADD COLUMN subStatus TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add source column to existing invoice_items table if needed
      try {
        await this.db.run('ALTER TABLE invoice_items ADD COLUMN source TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }
      
      // Attempt to add updatedAt column to existing vault_transactions table if needed
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN updatedAt TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add isReversed column to existing vault_transactions table if needed
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN isReversed INTEGER DEFAULT 0');
      } catch (err) {}

      // Attempt to add isReversal column to existing vault_transactions table if needed
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN isReversal INTEGER DEFAULT 0');
      } catch (err) {}

      // Attempt to add reversalOf column to existing vault_transactions table if needed
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN reversalOf TEXT');
      } catch (err) {}

      // Attempt to add paymentType column to existing vault_transactions table if needed
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN paymentType INTEGER');
      } catch (err) {}

      // Attempt to add liabilityCurrency column to existing vault_transactions table if needed
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN liabilityCurrency TEXT');
      } catch (err) {}

      // Attempt to add liabilityAmount column to existing vault_transactions table if needed
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN liabilityAmount REAL');
      } catch (err) {}

      // Attempt to add receiptCurrency column to existing vault_transactions table if needed
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN receiptCurrency TEXT');
      } catch (err) {}

      // Attempt to add receiptAmount column to existing vault_transactions table if needed
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN receiptAmount REAL');
      } catch (err) {}

      // Attempt to add bankDetails column to existing vault_transactions table if needed
      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN bankDetails TEXT');
      } catch (err) {}

      // Attempt to add updatedAt column to existing device_categories table if needed
      try {
        await this.db.run('ALTER TABLE device_categories ADD COLUMN updatedAt TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add bankAccount column to existing fin_funds table if needed
      try {
        await this.db.run('ALTER TABLE fin_funds ADD COLUMN bankAccount TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add engineerName column to existing approval_actions table if needed
      try {
        await this.db.run('ALTER TABLE approval_actions ADD COLUMN engineerName TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add actionDate column to existing approval_actions table if needed
      try {
        await this.db.run('ALTER TABLE approval_actions ADD COLUMN actionDate INTEGER');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add type column to existing approval_actions table if needed
      try {
        await this.db.run('ALTER TABLE approval_actions ADD COLUMN type TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add updates column to existing approval_actions table if needed
      try {
        await this.db.run('ALTER TABLE approval_actions ADD COLUMN updates TEXT');
      } catch (err) {
        // Column probably already exists, which is fine
      }

      // Attempt to add printCount column to existing invoices table if needed
      try {
        await this.db.run('ALTER TABLE invoices ADD COLUMN printCount INTEGER DEFAULT 0');
      } catch (err) {
        // Column probably already exists
      }

      try {
        await this.db.run('ALTER TABLE vault_transactions ADD COLUMN statementNote TEXT');
      } catch (err) {
        // console.warn("Column statementNote might already exist", err);
      }


      // One-time factory reset requested by user
      if (localStorage.getItem('snd_wipe_v1') !== 'done') {
        console.log('Executing one-time factory reset...');
        const tablesToClear = [
          'invoices', 'invoice_items', 'customers', 'maintenance_actions', 
          'approval_actions', 'engineers', 'vault_transactions', 
          'inventory_items', 'device_categories', 'device_models',
          'company_details', 'settings', 'document_outputs',
          'fin_transaction_types', 'fin_funds', 'fin_currencies',
          'fin_payment_methods'
        ];
        for (const table of tablesToClear) {
          try {
            await this.db.run(`DELETE FROM ${table}`);
          } catch (e) {
            console.error(`Error clearing table ${table}`, e);
          }
        }
        localStorage.setItem('snd_wipe_v1', 'done');
        localStorage.setItem('snd_db_seeded', 'true');
        localStorage.removeItem('snd_settings');
        localStorage.removeItem('snd_country_code');
        sessionStorage.removeItem('alertsClosed');
        console.log('Factory reset completed.');
      }

      // Seed default admin if empty
      const users = await this.db.query('SELECT * FROM users WHERE username = ?', ['admin']);
      if (users.values && users.values.length === 0) {
        await this.db.run('INSERT INTO users (id, username, password, name, role, isPrimary, userNumber, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
          ['primary-admin', 'admin', 'admin', 'المدير العام', 'admin', 1, 100, 1]);
      }

      // Seed accounting defaults: Currencies
      const currs = await this.db.query('SELECT * FROM fin_currencies');
      if (currs.values && currs.values.length === 0) {
        await this.db.run('INSERT INTO fin_currencies (id, name, symbol, decimals, status) VALUES (?, ?, ?, ?, ?)',
          ['USD', 'دولار', '$', 2, 'active']);
        await this.db.run('INSERT INTO fin_currencies (id, name, symbol, decimals, status) VALUES (?, ?, ?, ?, ?)',
          ['YER', 'ريال يمني', 'ر.ي', 0, 'active']);
        await this.db.run('INSERT INTO fin_currencies (id, name, symbol, decimals, status) VALUES (?, ?, ?, ?, ?)',
          ['SAR', 'ريال سعودي', 'ر.س', 0, 'active']);
      }

      // Seed accounting defaults: Funds
      const fundsTable = await this.db.query('SELECT * FROM fin_funds');
      if (fundsTable.values && fundsTable.values.length === 0) {
        await this.db.run('INSERT INTO fin_funds (id, name, type, currency, description, status, balance) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['fund-1', 'صندوق الدولار الرئيسي', 'cash', 'دولار', 'الصندوق الرئيسي للعملات الأجنبية بالدولار', 'active', 0.0]);
        await this.db.run('INSERT INTO fin_funds (id, name, type, currency, description, status, balance) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['fund-2', 'صندوق الريال اليمني', 'cash', 'ريال يمني', 'الصندوق الرئيسي للعملة المحلية بالريال اليمني', 'active', 0.0]);
        await this.db.run('INSERT INTO fin_funds (id, name, type, currency, description, status, balance) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['fund-3', 'صندوق الريال السعودي', 'cash', 'ريال سعودي', 'صندوق احتياطي بالريال السعودي', 'active', 0.0]);
      }

      // Seed accounting defaults: Payment Methods
      const payMethods = await this.db.query('SELECT * FROM fin_payment_methods');
      if (payMethods.values && payMethods.values.length === 0) {
        await this.db.run('INSERT INTO fin_payment_methods (id, name, description, status) VALUES (?, ?, ?, ?)',
          ['pay-cash', 'نقداً', 'الدفع نقداً التلقائي', 'active']);
        await this.db.run('INSERT INTO fin_payment_methods (id, name, description, status) VALUES (?, ?, ?, ?)',
          ['pay-bank', 'إيداع بنكي', 'الإيداع بنكي التلقائي', 'active']);
      }

      // Seed accounting defaults: Transaction Types
      const txTypes = await this.db.query('SELECT * FROM fin_transaction_types');
      if (txTypes.values && txTypes.values.length === 0) {
        const defaultReceipts = ['دفعة تحت الحساب', 'خدمات برمجية', 'بيع قطع غيار', 'ايرادات أخرى'];
        for (const item of defaultReceipts) {
          await this.db.run('INSERT INTO fin_transaction_types (id, name, type) VALUES (?, ?, ?)',
            [`rec-${Math.random().toString(36).substring(2, 8)}`, item, 'receipt']);
        }
        const defaultPayments = [
          'راتب موظف',
          'شراء قطع غيار',
          'شراء معدات صيانه',
          'مصاريف تشغيل',
          'مصاريف نقل',
          'مصاريف كهرباء',
          'مصاريف إنترنت',
          'مصاريف ضيافة',
          'مصروفات أخرى'
        ];
        for (const item of defaultPayments) {
          await this.db.run('INSERT INTO fin_transaction_types (id, name, type) VALUES (?, ?, ?)',
            [`pay-${Math.random().toString(36).substring(2, 8)}`, item, 'payment']);
        }
      }

      // Seed company details if empty
      try {
        const mainComp = await this.db.query("SELECT * FROM company_details WHERE id = 'main_details'");
        if (mainComp.values && mainComp.values.length > 0) {
          // Clean up legacy 'default-company' record to avoid duplicate or stale config
          await this.db.run("DELETE FROM company_details WHERE id = 'default-company'");
        } else {
          const company = await this.db.query('SELECT * FROM company_details');
          if (company.values && company.values.length === 0) {
            await this.db.run(`
              INSERT INTO company_details (
                id, shopName, name, phone1, phone2, landline, 
                phone1Call, phone1Whatsapp, phone2Call, phone2Whatsapp, landlineCall, landlineWhatsapp, 
                facebookUrl, mapUrl, email, bio, logoUrl, address, updatedAt,
                bankYerName, bankYerAccount, bankSarName, bankSarAccount, bankUsdName, bankUsdAccount, bankHolderName
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              'main_details', 'اسم المؤسسة / المركز', 'اسم المؤسسة / المركز', '', '', '',
              1, 1, 1, 1, 1, 0,
              '', '', '', '', '', '', new Date().toISOString(),
              '', '', '', '', '', '', ''
            ]);
          } else {
            // Migrate any existing 'default-company' row to 'main_details'
            await this.db.run("UPDATE company_details SET id = 'main_details' WHERE id = 'default-company'");
          }
        }
      } catch (cErr) {
        console.warn("Company details initialization error:", cErr);
      }

      // ----------------------------------------------------
      // No dummy data seeding. The system starts completely clean.
      // ----------------------------------------------------

      if (platform === 'web') {
        await sqlite.saveToStore('snd_system');
      }

    } catch (err) {
      console.error('SQLite initialization failed', err);
      this.db = null;
      this.initializingPromise = null;
    }
    })();

    return this.initializingPromise;
  }

  // Generic Query
  async query(sql: string, params: any[] = []) {
    return this.enqueue(async () => {
      if (!this.db) {
        if (this.initializingPromise) {
          console.log('Database is currently initializing, waiting for connection...');
        } else {
          console.warn('Database connection not active. Initializing database...');
        }
        await this.initialize();
      } else {
        try {
          const isOpen = await this.db.isDBOpen();
          if (!isOpen.result) {
            console.warn('Database exists but is closed. Re-opening...');
            await this.db.open();
          }
        } catch (err) {
          console.warn('Failed to verify/open database inside query:', err);
        }
      }
      if (!this.db) throw new Error('Failed to initialize local database connection.');
      const cleanParams = (params || []).map(sanitizeSqliteParam);
      return this.db.query(sql, cleanParams);
    });
  }

  // Generic Execute
  async run(sql: string, params: any[] = []) {
    return this.enqueue(async () => {
      if (!this.db) {
        if (this.initializingPromise) {
          console.log('Database is currently initializing, waiting for connection...');
        } else {
          console.warn('Database connection not active. Initializing database...');
        }
        await this.initialize();
      } else {
        try {
          const isOpen = await this.db.isDBOpen();
          if (!isOpen.result) {
            console.warn('Database exists but is closed. Re-opening...');
            await this.db.open();
          }
        } catch (err) {
          console.warn('Failed to verify/open database inside run:', err);
        }
      }
      if (!this.db) throw new Error('Failed to initialize local database connection.');
      const cleanParams = (params || []).map(sanitizeSqliteParam);
      const result = await this.db.run(sql, cleanParams);
      
      const info = await Device.getInfo();
      if (info.platform === 'web') {
        await this.getSqlite().saveToStore('snd_system');
      }
      
      return result;
    });
  }

  async getAllTableSchemas(): Promise<Record<string, string[]>> {
    return this.enqueue(async () => {
      if (!this.db) {
        await this.initialize();
      } else {
        try {
          const isOpen = await this.db.isDBOpen();
          if (!isOpen.result) {
            await this.db.open();
          }
        } catch (err) {}
      }
      if (!this.db) throw new Error('Failed to initialize local database connection.');
      
      const tablesRes = await this.db.query(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`);
      const schemas: Record<string, string[]> = {};
      
      if (tablesRes.values) {
        for (const row of tablesRes.values) {
          const tableName = row.name;
          const colRes = await this.db.query(`PRAGMA table_info(${tableName})`);
          if (colRes.values) {
            schemas[tableName] = colRes.values.map(c => c.name);
          }
        }
      }
      return schemas;
    });
  }

  async getTableColumns(tableName: string): Promise<string[]> {
    return this.enqueue(async () => {
      if (!this.db) {
        await this.initialize();
      } else {
        try {
          const isOpen = await this.db.isDBOpen();
          if (!isOpen.result) {
            await this.db.open();
          }
        } catch (err) {}
      }
      if (!this.db) throw new Error('Failed to initialize local database connection.');
      const res = await this.db.query(`PRAGMA table_info(${tableName})`);
      if (res.values) {
        return res.values.map(row => row.name);
      }
      return [];
    });
  }

  // Notify observers
  notify(table: string, data: any[]) {
    const tableObservers = this.observers.get(table);
    if (tableObservers) {
      tableObservers.forEach(callback => callback(data));
    }
  }

  subscribe(table: string, callback: (data: any[]) => void) {
    if (!this.observers.has(table)) {
      this.observers.set(table, new Set());
    }
    this.observers.get(table)!.add(callback);
    
    // Initial fetch
    this.query(`SELECT * FROM ${table}`).then(res => {
      callback(res.values || []);
    });

    return () => {
      this.observers.get(table)?.delete(callback);
    };
  }
}

export const localDb = new LocalDatabase();
