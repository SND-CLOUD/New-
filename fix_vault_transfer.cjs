const fs = require('fs');

let vault = fs.readFileSync('src/components/Vault.tsx', 'utf8');

vault = vault.replace(/notes: `تحويل وارد من الصندوق: \$\{sourceFund.name\}\$\{finalTransferNotesDest\}`, updatedAt: timestampIso, voucherNumber: nextVoucherNum, transactionCategory: 'تحويل بين الصناديق',/g, 
"notes: `تحويل وارد من الصندوق: ${sourceFund.name}${finalTransferNotesDest}`, updatedAt: timestampIso, voucherNumber: Number(nextVoucherNum) + 1, transactionCategory: 'تحويل بين الصناديق',");

fs.writeFileSync('src/components/Vault.tsx', vault);
