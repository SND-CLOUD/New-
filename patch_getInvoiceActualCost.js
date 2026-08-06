const fs = require('fs');
const files = ['src/components/Customers.tsx', 'src/components/SearchInvoice.tsx', 'src/components/Vault.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Update function signature
  content = content.replace(/const getInvoiceActualCost = \(invoiceItems: (InvoiceItem\[\]|any\[\])\) => \{/g, 'const getInvoiceActualCost = (invoiceItems: $1, invoice?: any) => {');
  content = content.replace(/const getInvoiceActualCost = \(itemsList: (InvoiceItem\[\]|any\[\])\) => \{/g, 'const getInvoiceActualCost = (itemsList: $1, invoice?: any) => {');

  // Update return statement to subtract invoice discount
  content = content.replace(/return sum \+ \(Number\(item.cost\) \|\| 0\);\n    \}, 0\);/g, 'return sum + (Number(item.cost) || 0);\n    }, 0) - (invoice ? Number(invoice.discount || 0) : 0);');

  // Also in Vault.tsx:
  content = content.replace(/return itemsList\.reduce\(\(sum, item\) => \{/g, 'return (itemsList.reduce((sum, item) => {');
  // I need to be careful with string replacements.
});
