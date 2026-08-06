const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Find all JSX interpolations {...}
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // skip import lines or comments
    if (line.trim().startsWith('import') || line.trim().startsWith('//') || line.trim().startsWith('/*')) return;
    const matches = line.match(/\{([^}]+)\}/g);
    if (!matches) return;
    matches.forEach(m => {
      const expr = m.slice(1, -1).trim();
      // Look for any date/timestamp related variable or field
      if (/\b(createdAt|updatedAt|timestamp|deliveredAt|actionDate|date|startDate|blockDate|lastLogin|created_at|updated_at|output_datetime)\b/i.test(expr)) {
        // filter out string inputs like onChange, e.target, name=, id=, className=
        if (!/onChange|onClick|set[A-Z]|className|style|type=|placeholder=|name=/i.test(line)) {
          console.log(`${file}:${idx + 1}: {${expr}} --> FULL LINE: ${line.trim()}`);
        }
      }
    });
  });
});
