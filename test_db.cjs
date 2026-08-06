const { localDb } = require('./src/lib/local-db');

async function test() {
  try {
    const res = await localDb.query("SELECT * FROM invoices LIMIT 5");
    console.log(res);
  } catch(e) {
    console.log(e);
  }
}
test();
