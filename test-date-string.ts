import { parseDate } from './src/lib/dateUtils.ts';
console.log(parseDate("2024-05-20T10:00:00.000Z")?.toISOString());
