const fs = require('fs');

let vault = fs.readFileSync('src/components/Vault.tsx', 'utf8');

const replacement = `// 3. Update SQLite fund balance
          if (t.fundId) {
            await ProviderFactory.getProvider().updateDoc('fin_funds', t.fundId, { balance: { type: 'increment', value: reverseAmount } });
          }

          // 3b. Update invoice if linked
          if (t.invoiceNumber) {
            // Find invoice
            const invs = await localDb.query("SELECT id FROM invoices WHERE invoiceNumber = ?", [t.invoiceNumber]);
            if (invs.values && invs.values.length > 0) {
              const invId = invs.values[0].id;
              // If it's a receipt being reversed, we decrease amountPaid. (reverseAmount is negative)
              // Wait, reverseAmount logic:
              // If original was receipt (amount > 0), reverseAmount = -t.amount
              // To update amountPaid, we add reverseAmount
              await ProviderFactory.getProvider().updateDoc('invoices', invId, { amountPaid: { type: 'increment', value: reverseAmount } });
            }
          }`;

vault = vault.replace(/\/\/ 3\. Update SQLite fund balance\s*if \(t\.fundId\) \{\s*await ProviderFactory\.getProvider\(\)\.updateDoc\('fin_funds', t\.fundId, \{ balance: \{ type: 'increment', value: reverseAmount \} \}\);\s*\}/, replacement);

fs.writeFileSync('src/components/Vault.tsx', vault);
