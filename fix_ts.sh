sed -i 's/updatedConfig.logoUrl = "";/(updatedConfig as any).logoUrl = "";/g' src/components/Settings.tsx
sed -i 's/updatedConfig.logo = "";/(updatedConfig as any).logo = "";/g' src/components/Settings.tsx

sed -i 's/fullDetails.logoUrl = "";/(fullDetails as any).logoUrl = "";/g' src/components/SetupWizard.tsx
sed -i 's/fullDetails.logo = "";/(fullDetails as any).logo = "";/g' src/components/SetupWizard.tsx
