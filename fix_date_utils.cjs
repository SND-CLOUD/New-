const fs = require('fs');

let dateUtils = fs.readFileSync('src/lib/dateUtils.ts', 'utf8');

// Add a fallback for "[object Object]"
dateUtils = dateUtils.replace(
  "if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NaN' || trimmed === '---') {",
  "if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NaN' || trimmed === '---' || trimmed === '[object Object]') {"
);

// We can improve formatTxDate
dateUtils = dateUtils.replace(
  "return d ? formatDateTime(d) : (tx?.timestamp ? String(tx.timestamp) : (tx?.createdAt ? String(tx.createdAt) : fallbackText));",
  "if (d) return formatDateTime(d);\n  const backupRaw = String(tx?.timestamp || tx?.updatedAt || tx?.createdAt || tx?.date || fallbackText);\n  return backupRaw === '[object Object]' ? fallbackText : backupRaw;"
);

fs.writeFileSync('src/lib/dateUtils.ts', dateUtils);
