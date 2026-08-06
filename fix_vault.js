const fs = require('fs');

let vault = fs.readFileSync('src/components/Vault.tsx', 'utf8');

// 1. Transaction Categories uniqueness and default option
// Let's find the select for transactionCategory
vault = vault.replace(/<select\s+value=\{newTransaction\.transactionCategory\}\s+onChange=\{e => setNewTransaction\(\{\s*\.\.\.newTransaction,\s*transactionCategory:\s*e\.target\.value\s*\}\)\}/g, 
`<select value={newTransaction.transactionCategory} onChange={e => setNewTransaction({...newTransaction, transactionCategory: e.target.value})} required>
  <option value="" disabled>-- حدد نوع العملية --</option>`);

// Fix the map to ensure uniqueness if it's iterating types
// "types.map(t => ..."
vault = vault.replace(/\{types\.map\(t => \(\s*<option key=\{t\.id\} value=\{t\.name\}>\s*\{t\.name\}\s*<\/option>\s*\)\)\}/g, 
`{Array.from(new Set(types.map(t => t.name))).map(name => {
  const t = types.find(type => type.name === name);
  return <option key={t?.id || name} value={name}>{name}</option>;
})}`);

fs.writeFileSync('src/components/Vault.tsx', vault);
