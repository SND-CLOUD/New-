const fs = require('fs');

let vault = fs.readFileSync('src/components/Vault.tsx', 'utf8');

// Replace the category select. We found it using value={selectedCategory}
// Let's replace the whole block by finding value={selectedCategory}
vault = vault.replace(/<select\s*\n\s*value=\{selectedCategory\}\s*\n\s*onChange=\{e => setSelectedCategory\(e.target.value\)\}\s*\n\s*className="[^"]+"\s*\n\s*>\s*\n\s*<option value="" disabled>.*?\n([\s\S]*?)<\/select>/,
`<select
                          value={selectedCategory}
                          onChange={e => setSelectedCategory(e.target.value)}
                          className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                          required
                        >
                          <option value="" disabled>-- حدد نوع العملية --</option>
                          {Array.from(new Set(types.filter(t => isReceiptForm ? t.isReceipt : !t.isReceipt).map(t => t.name))).map((name, index) => (
                            <option key={index} value={name}>{name}</option>
                          ))}
                        </select>`);

// Fix actual cost to subtract discount in Vault.tsx (Already replaced inside the file manually? Let's check)

fs.writeFileSync('src/components/Vault.tsx', vault);
