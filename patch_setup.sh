sed -i '/await setDoc(doc(db, .company_details., .main_details.), fullDetails, { merge: true });/i \
      if (JSON.stringify(fullDetails).length > 900000) {\n\
        fullDetails.logoUrl = "";\n\
        fullDetails.logo = "";\n\
      }' src/components/SetupWizard.tsx
