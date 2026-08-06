const fs = require('fs');
let content = fs.readFileSync('src/components/SearchInvoice.tsx', 'utf8');
content = content.replace(/getInvoiceActualCost\(invItems, undefined \/\* REVERTED \*\/\)/g, 'getInvoiceActualCost(invItems, inv)');
fs.writeFileSync('src/components/SearchInvoice.tsx', content);
