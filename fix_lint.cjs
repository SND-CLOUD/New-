const fs = require('fs');

const files = ['src/components/Customers.tsx', 'src/components/SearchInvoice.tsx', 'src/components/Vault.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // We revert the bad replacement:
  content = content.replace(/typeof inv !== "undefined"\s*\?\s*inv\s*:\s*\(\s*typeof selectedLogInvoice !== "undefined"\s*\?\s*selectedLogInvoice\s*:\s*undefined\s*\)/g, 
  "undefined /* REVERTED */");
  
  // Now carefully fix it where `inv` is available.
  // Generally, if it's inside `inv =>` or `invoice =>`, we want to pass it.
  
  fs.writeFileSync(file, content);
});
