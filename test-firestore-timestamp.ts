class Timestamp {
  seconds: number;
  nanoseconds: number;
  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }
  toDate() { return new Date(this.seconds * 1000 + this.nanoseconds / 1000000); }
}
const ts = new Timestamp(1715000000, 0);
console.log(typeof ts.toISOString === 'function');
