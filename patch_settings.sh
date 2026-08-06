sed -i '/await setDoc(doc(db, .company_details., .main_details.), updatedConfig, { merge: true });/i \
                                  if (JSON.stringify(updatedConfig).length > 900000) {\n\
                                    updatedConfig.logoUrl = "";\n\
                                    updatedConfig.logo = "";\n\
                                  }' src/components/Settings.tsx
