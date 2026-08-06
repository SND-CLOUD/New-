import { parseDate } from './src/lib/dateUtils.ts';
const val = { "seconds": 16000000, "nanoseconds": 0 };
const parsed = parseDate(val);
console.log(parsed ? parsed.toISOString() : 'null');
