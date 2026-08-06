const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx');

files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    // Look for JSX expression containers
    const matches = line.match(/\{([^}]+)\}/g);
    if (!matches) return;
    matches.forEach(m => {
      const expr = m.slice(1, -1).trim();
      // Look for object property renderings without formatting
      if (/^[a-zA-Z0-9_$?.]+(\?\.)?[a-zA-Z0-9_$]+$/.test(expr)) {
        // filter out common string/number variables or props
        if (!/^(props|state|children|className|style|id|key|title|name|label|type|status|count|total|price|amount|cost|paid|phone|notes|address|currency|code|index|idx|i|num|id\?\.substring|e\.target|t|t\.[a-zA-Z0-9_]+)$/.test(expr)) {
          // Check if it could be an object
          if (/date|time|timestamp|created|updated|config|data|item|entry|tx|inv|voucher|user|customer|shop/i.test(expr)) {
            console.log(`${file}:${idx + 1}: {${expr}}  --> LINE: ${line.trim()}`);
          }
        }
      }
    });
  });
});
