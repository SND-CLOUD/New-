const fs = require('fs');

let vault = fs.readFileSync('src/components/Vault.tsx', 'utf8');

// Transaction Categories uniqueness and default option
vault = vault.replace(/<select\s+value=\{newTransaction\.transactionCategory\|\|''\}\s+onChange=\{\(e\)/g, 
`<select value={newTransaction.transactionCategory||''} required onChange={(e)`);

vault = vault.replace(/<option value="">اختر نوع العملية...<\/option>/g, 
`<option value="" disabled>-- حدد نوع العملية --</option>`);

// Fix actual cost to subtract discount in Vault.tsx
vault = vault.replace(/const getInvoiceActualCost = \(([^)]+)\) => \{/g, 'const getInvoiceActualCost = ($1, invoice?: any) => {');
vault = vault.replace(/return itemsList\.reduce\(\(sum, item\) => \{/g, 'return itemsList.reduce((sum, item) => {');
vault = vault.replace(/return sum \+ \(Number\(item.cost\) \|\| 0\);\n\s*\}, 0\);/g, 'return sum + (Number(item.cost) || 0);\n    }, 0) - (invoice ? Number(invoice.discount || 0) : 0) + (invoice ? Number(invoice.tax || 0) : 0);');

vault = vault.replace(/getInvoiceActualCost\(invItems\)/g, 'getInvoiceActualCost(invItems, inv)');

// Wait, the parameter might be different, let's just do a regex replace on the return value of getInvoiceActualCost.

fs.writeFileSync('src/components/Vault.tsx', vault);
