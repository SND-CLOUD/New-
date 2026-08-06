const fs = require('fs');
const content = fs.readFileSync('temp_customers.js', 'utf-8');
const match = content.match(/sourceMappingURL=data:application\/json;base64,(.*)$/);
if (match) {
  const json = Buffer.from(match[1], 'base64').toString('utf-8');
  const parsed = JSON.parse(json);
  fs.writeFileSync('restored_Customers.tsx', parsed.sourcesContent[0]);
  console.log("Restored successfully!");
} else {
  console.log("No sourcemap found.");
}
