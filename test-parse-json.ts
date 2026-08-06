import { parseDate } from './src/lib/dateUtils.ts';
const val = '{"type":"firestore/timestamp/1.0","seconds":1715000000,"nanoseconds":0}';
const parsed = parseDate(val);
console.log(parsed ? parsed.toISOString() : 'null');
