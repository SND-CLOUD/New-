const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx');

let count = 0;
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Match any JSX element child containing {...}
  const matches = content.matchAll(/>\s*\{([^}]+)\}\s*</g);
  for (const match of matches) {
    const expr = match[1].trim();
    // Check if expr contains any date/timestamp related variable or property access
    if (/\b(createdAt|updatedAt|timestamp|deliveredAt|actionDate|date|startDate|blockDate|lastLogin|created_at|updated_at|output_datetime)\b/.test(expr)) {
      console.log(`${file}: {${expr}}`);
      count++;
    }
  }
});
console.log(`Total found: ${count}`);
