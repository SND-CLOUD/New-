sed -i '/const parsedPayload = payload ? JSON.parse(payload) : null;/a \
                if (payload && payload.length > 900000 && parsedPayload) {\n\
                  if (parsedPayload.data) {\n\
                    if (parsedPayload.data.logoUrl) parsedPayload.data.logoUrl = "";\n\
                    if (parsedPayload.data.logo) parsedPayload.data.logo = "";\n\
                  }\n\
                  if (parsedPayload.logoUrl) parsedPayload.logoUrl = "";\n\
                  if (parsedPayload.logo) parsedPayload.logo = "";\n\
                }' src/data/SyncEngine.ts
