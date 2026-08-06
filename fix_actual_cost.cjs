const fs = require('fs');

const files = ['src/components/Vault.tsx', 'src/components/Customers.tsx', 'src/components/SearchInvoice.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Change signature
  content = content.replace(/const getInvoiceActualCost = \((.*?)\) => \{/g, 'const getInvoiceActualCost = ($1, invoice?: any) => {');
  
  // Replace the return sum + ...
  content = content.replace(/return sum \+ \(Number\(item\.cost\) \|\| 0\);\n\s*\}, 0\);/g, 
  'return sum + (Number(item.cost) || 0);\n    }, 0) - (invoice ? Number(invoice.discount || 0) : 0) + (invoice ? Number(invoice.tax || 0) : 0);');

  // Find all getInvoiceActualCost calls and pass `inv` if they don't already
  content = content.replace(/getInvoiceActualCost\(([^,)]+)\)/g, 'getInvoiceActualCost($1, typeof inv !== "undefined" ? inv : (typeof selectedLogInvoice !== "undefined" ? selectedLogInvoice : undefined))');

  fs.writeFileSync(file, content);
});
