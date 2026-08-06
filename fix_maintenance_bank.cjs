const fs = require('fs');

let maintenance = fs.readFileSync('src/components/MaintenanceActionForm.tsx', 'utf8');

const bankDetailsBlock = `
        {/* Bank Accounts */}
        {(shopConfig?.bankYerAccount || shopConfig?.bankSarAccount || shopConfig?.bankUsdAccount) && (
          <div className="mt-4 pt-4 border-t-2 border-black/20 text-center">
            {shopConfig?.bankHolderName && (
              <p className="text-xs mb-2">
                باسم: <span className="font-bold">{shopConfig.bankHolderName}</span>
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              {shopConfig?.bankYerAccount && (
                <div className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <span className="font-bold text-gray-700">YER:</span>
                  <span dir="ltr" className="text-gray-900 font-mono">{shopConfig.bankYerAccount}</span>
                  {shopConfig?.bankYerName && <span className="text-gray-500 font-normal">({shopConfig.bankYerName})</span>}
                </div>
              )}
              {shopConfig?.bankSarAccount && (
                <div className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <span className="font-bold text-gray-700">SAR:</span>
                  <span dir="ltr" className="text-gray-900 font-mono">{shopConfig.bankSarAccount}</span>
                  {shopConfig?.bankSarName && <span className="text-gray-500 font-normal">({shopConfig.bankSarName})</span>}
                </div>
              )}
              {shopConfig?.bankUsdAccount && (
                <div className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                  <span className="font-bold text-gray-700">USD:</span>
                  <span dir="ltr" className="text-gray-900 font-mono">{shopConfig.bankUsdAccount}</span>
                  {shopConfig?.bankUsdName && <span className="text-gray-500 font-normal">({shopConfig.bankUsdName})</span>}
                </div>
              )}
            </div>
          </div>
        )}
`;

// Insert it right after Facebook url
maintenance = maintenance.replace(
  /\{shopConfig\?\.facebookUrl && \(\s*<div className="flex items-center gap-1">\s*<Globe size=\{14\} className="text-gray-500 shrink-0" \/>\s*<span dir="ltr" className="text-gray-900">\{shopConfig\.facebookUrl\}<\/span>\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>/,
  `{shopConfig?.facebookUrl && (
                        <div className="flex items-center gap-1">
                          <Globe size={14} className="text-gray-500 shrink-0" />
                          <span dir="ltr" className="text-gray-900">{shopConfig.facebookUrl}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                ${bankDetailsBlock}
              </div>`
);

fs.writeFileSync('src/components/MaintenanceActionForm.tsx', maintenance);
