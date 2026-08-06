const parseToMs = (val) => {
  if (!val) return 0;
  if (typeof val.toDate === 'function') return val.toDate().getTime();
  if (typeof val.toMillis === 'function') return val.toMillis();
  const d = new Date(val);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}
console.log(parseToMs({ toDate: () => new Date('2023-01-01') }));
console.log(parseToMs(new Date('2023-01-02')));
console.log(parseToMs('2023-01-03T00:00:00Z'));
