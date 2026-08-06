import { localDb } from './src/lib/local-db.ts';
import { parseTxDate } from './src/lib/dateUtils.ts';
async function test() {
  try {
    const res = await localDb.query("SELECT * FROM vault_transactions LIMIT 5");
    console.log("Found:", res.values?.length || 0);
    res.values?.forEach(tx => {
       console.log(tx.id, tx.timestamp, '=>', parseTxDate(tx)?.toISOString());
    });
  } catch(e) {
    console.error(e);
  }
}
test();
