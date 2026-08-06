const fs = require('fs');

let vault = fs.readFileSync('src/components/Vault.tsx', 'utf8');

vault = vault.replace(/ledgerCustomerInvoices\.reduce\(\(acc, curr\) => \{\s*const invItems = getInvoiceItemsForInvoice\(curr\.invoiceNumber\);\s*return acc \+ getInvoiceActualCost\(invItems, inv\);/g, 
`ledgerCustomerInvoices.reduce((acc, curr) => {
    const invItems = getInvoiceItemsForInvoice(curr.invoiceNumber);
    return acc + getInvoiceActualCost(invItems, curr);`);

vault = vault.replace(/const cost = custInvs\.reduce\(\(acc, curr\) => \{\s*const invItems = items\.filter\(it => it\.invoiceNumber === curr\.invoiceNumber\);\s*return acc \+ getInvoiceActualCost\(invItems, inv\);/g,
`const cost = custInvs.reduce((acc, curr) => {
      const invItems = items.filter(it => it.invoiceNumber === curr.invoiceNumber);
      return acc + getInvoiceActualCost(invItems, curr);`);

vault = vault.replace(/const custCost = invsForCurr\.reduce\(\(acc, curr\) => \{\s*const invItems = items\.filter\(it => it\.invoiceNumber === curr\.invoiceNumber\);\s*return acc \+ getInvoiceActualCost\(invItems, inv\);/g,
`const custCost = invsForCurr.reduce((acc, curr) => {
          const invItems = items.filter(it => it.invoiceNumber === curr.invoiceNumber);
          return acc + getInvoiceActualCost(invItems, curr);`);

vault = vault.replace(/const totalCost = custInvs\.reduce\(\(a, b\) => \{\s*const invItems = getInvoiceItemsForInvoice\(b\.invoiceNumber\);\s*return a \+ getInvoiceActualCost\(invItems, inv\);/g,
`const totalCost = custInvs.reduce((a, b) => {
                            const invItems = getInvoiceItemsForInvoice(b.invoiceNumber);
                            return a + getInvoiceActualCost(invItems, b);`);

fs.writeFileSync('src/components/Vault.tsx', vault);
