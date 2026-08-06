const fs = require('fs');

let content = fs.readFileSync('src/components/Customers.tsx', 'utf8');

content = content.replace(/getInvoiceActualCost\(invItems, undefined \/\* REVERTED \*\/\)/g, 'getInvoiceActualCost(invItems, inv)');

content = content.replace(/getInvoiceActualCost\(items\.filter\(it => it\.invoiceNumber === selectedLogInvoice\.invoiceNumber, undefined \/\* REVERTED \*\/\)\)/g, 'getInvoiceActualCost(items.filter(it => it.invoiceNumber === selectedLogInvoice.invoiceNumber), selectedLogInvoice)');

fs.writeFileSync('src/components/Customers.tsx', content);
