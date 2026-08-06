sed -i '/deviceType TEXT DEFAULT "عام",/d' src/lib/local-db.ts
sed -i 's/deviceType TEXT DEFAULT .عام.,/deviceType TEXT DEFAULT "عام",/g' src/lib/local-db.ts
