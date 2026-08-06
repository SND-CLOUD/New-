sed -i 's/deviceName: string;/deviceName: string;\n    deviceType: "مخصص" | "عام";/g' src/components/AccountingInputs.tsx
sed -i 's/deviceName: .جهاز الورشة الرئيسية - POS-01.,/deviceName: "جهاز الورشة الرئيسية - POS-01",\n    deviceType: "عام",/g' src/components/AccountingInputs.tsx
