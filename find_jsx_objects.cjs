const fs = require('fs');
const glob = require('glob');

// Simple regex to find JSX interpolations { ... }
const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    // Look for JSX children like <span>{expr}</span> or <td>{expr}</td>
    const matches = line.match(/\{([^}]+)\}/g);
    if (!matches) return;
    matches.forEach(m => {
      const inner = m.slice(1, -1).trim();
      // check if inner has terms like timestamp, date, createdAt, updatedAt, deliveredAt without formatting, parseDate, formatDate, toLocale, etc.
      if (/\b(timestamp|date|createdAt|updatedAt|deliveredAt|actionDate)\b/i.test(inner)) {
        if (!/format|parse|toLocale|typeof|String|\|\||&&|\.id|\.number|\.name|\.toLocaleString|\.length|\.getItem|\.getFullYear|\.getTime/i.test(inner)) {
          console.log(`${file}:${idx + 1}: ${line.trim()}`);
        }
      }
    }
    );
  });
});
