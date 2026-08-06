import re

with open('src/components/AddCustomerModal.tsx', 'r') as f:
    content = f.read()

block = """      const settingsRef = doc(db, 'settings', 'app');
      const settingsDoc = await getDoc(settingsRef);

      let sysNextNum = nextNum;
      if (settingsDoc.exists()) {
        const lastCustNum = Number(settingsDoc.data()?.lastCustomerNumber) || 0;
        sysNextNum = Math.max(nextNum, lastCustNum + 1);
      }"""

replacement = """      const settingsRef = doc(db, 'settings', 'app');
      const settingsDoc = await getDoc(settingsRef);

      let sysNextNum = nextNum;
      if (settingsDoc.exists()) {
        const lastCustNum = Number(settingsDoc.data()?.lastCustomerNumber) || 0;
        sysNextNum = Math.max(nextNum, lastCustNum + 1);
      }

      try {
        const { localDb } = await import('../lib/local-db');
        const resNum = await localDb.query("SELECT COALESCE(MAX(customerNumber), 0) as maxNum FROM customers");
        if (resNum.values?.[0]?.maxNum) {
          const localCustMax = Number(resNum.values[0].maxNum);
          if (localCustMax >= sysNextNum) {
            sysNextNum = localCustMax + 1;
          }
        }
      } catch (err) {
        console.warn("Failed to get local max customer number", err);
      }"""

content = content.replace(block, replacement)

with open('src/components/AddCustomerModal.tsx', 'w') as f:
    f.write(content)
