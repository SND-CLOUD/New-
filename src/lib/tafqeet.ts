// Basic Tafqeet (number to Arabic words) implementation for 1 to 999999
const units = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const teens = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

function tafqeetHundreds(num) {
  if (num === 0) return "";
  let res = "";
  const h = Math.floor(num / 100);
  const rem = num % 100;
  if (h > 0) res = hundreds[h];
  
  if (rem > 0) {
    if (res !== "") res += " و";
    if (rem < 10) {
      res += units[rem];
    } else if (rem < 20) {
      res += teens[rem - 10];
    } else {
      const t = Math.floor(rem / 10);
      const u = rem % 10;
      if (u > 0) res += units[u] + " و";
      res += tens[t];
    }
  }
  return res;
}

export function tafqeet(number) {
  if (number === 0) return "صفر";
  if (isNaN(number)) return "";
  const num = Math.floor(number); // ignoring decimals for simplicity
  
  if (num < 1000) return tafqeetHundreds(num);
  
  let res = "";
  const thousands = Math.floor(num / 1000) % 1000;
  const rem = num % 1000;
  
  if (thousands > 0) {
    if (thousands === 1) res = "ألف";
    else if (thousands === 2) res = "ألفان";
    else if (thousands > 2 && thousands < 11) res = tafqeetHundreds(thousands) + " آلاف";
    else res = tafqeetHundreds(thousands) + " ألف";
  }
  
  if (rem > 0) {
    if (res !== "") res += " و";
    res += tafqeetHundreds(rem);
  }
  
  return res;
}
