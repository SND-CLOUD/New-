const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite'); // The user runs app in browser, so sqlite is in browser not node.js.
