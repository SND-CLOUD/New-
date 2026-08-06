const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.tsx');

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  // Match JSX children between tags, e.g. > { expression } < or >{ expression }<
  const regex = />\s*\{([^}]+)\}\s*</g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    const expr = match[1].trim();
    
    // Check if expr is just an object property access, like `voucher.date` or `item.createdAt` or `shopConfig.startDate`
    // e.g. matching simple expressions like foo.bar or foo?.bar
    if (/^[a-zA-Z0-9_?.]+\.(createdAt|updatedAt|timestamp|date|actionDate|deliveredAt|output_datetime|startDate|blockDate|lastLogin|created_at|updated_at)$/.test(expr)) {
      console.log(`[EXACT FIELD MATCH] ${file}: {${expr}}`);
    } else if (/\b(createdAt|updatedAt|timestamp|actionDate|deliveredAt|startDate|blockDate)\b/.test(expr)) {
      if (!/format|parse|toLocale|typeof|String|\|\||&&|\.id|\.number|\.name|\.toLocaleString|\.length/i.test(expr)) {
        console.log(`[SUSPECT FIELD] ${file}: {${expr}}`);
      }
    }
  }
});
