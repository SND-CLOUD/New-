import re

with open('src/data/SyncEngine.ts', 'r') as f:
    content = f.read()

helper = """
const parseToMs = (val: any): number => {
  if (!val) return 0;
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (typeof val.toMillis === 'function') return val.toMillis();
  const d = new Date(val);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};
"""

if "const parseToMs" not in content:
    content = content.replace("export class SyncEngine {", helper + "\nexport class SyncEngine {")

# Replace first block (real-time)
block1 = """            const localUpdatedStr = localItem?.updatedAt?.toISOString?.() || localItem?.updatedAt || '';
            const cloudUpdatedStr = cloudItem.updatedAt?.toISOString?.() || cloudItem.updatedAt || '';

            const needsDownload = !localItem ||
              (cloudUpdatedStr && (!localUpdatedStr || new Date(cloudUpdatedStr) > new Date(localUpdatedStr)));"""

replacement1 = """            const localUpdatedMs = parseToMs(localItem?.updatedAt);
            const cloudUpdatedMs = parseToMs(cloudItem.updatedAt);
            
            let needsDownload = false;
            if (!localItem) {
              needsDownload = true;
            } else if (cloudUpdatedMs > 0 && cloudUpdatedMs > localUpdatedMs) {
              needsDownload = true;
            } else if (cloudUpdatedMs === 0) {
              // For tables like settings without updatedAt, compare stringified JSON
              const cStr = JSON.stringify(cloudItem);
              const lStr = JSON.stringify(localItem);
              if (cStr !== lStr) {
                needsDownload = true;
              }
            }"""

content = content.replace(block1, replacement1)

# Replace second block (initial sync)
block2 = """          const localUpdatedStr = localItem?.updatedAt?.toISOString?.() || localItem?.updatedAt || '';
          const cloudUpdatedStr = cloudItem.updatedAt?.toISOString?.() || cloudItem.updatedAt || '';

          const needsDownload = !localItem ||
            (cloudUpdatedStr && (!localUpdatedStr || new Date(cloudUpdatedStr) > new Date(localUpdatedStr)));"""

replacement2 = """          const localUpdatedMs = parseToMs(localItem?.updatedAt);
          const cloudUpdatedMs = parseToMs(cloudItem.updatedAt);

          let needsDownload = false;
          if (!localItem) {
            needsDownload = true;
          } else if (cloudUpdatedMs > 0 && cloudUpdatedMs > localUpdatedMs) {
            needsDownload = true;
          } else if (cloudUpdatedMs === 0) {
            // For tables like settings without updatedAt, compare stringified JSON
            const cStr = JSON.stringify(cloudItem);
            const lStr = JSON.stringify(localItem);
            if (cStr !== lStr) {
              needsDownload = true;
            }
          }"""

content = content.replace(block2, replacement2)

with open('src/data/SyncEngine.ts', 'w') as f:
    f.write(content)
