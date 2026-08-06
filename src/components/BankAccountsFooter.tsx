import React from 'react';
import { ShopConfig } from '../types';

export default function BankAccountsFooter({ shopConfig, currentOutput }: { shopConfig?: ShopConfig | any, currentOutput?: any }) {
  const hasBanks = shopConfig?.bankYerName || shopConfig?.bankYerAccount || 
                   shopConfig?.bankSarName || shopConfig?.bankSarAccount || 
                   shopConfig?.bankUsdName || shopConfig?.bankUsdAccount ||
                   shopConfig?.bankHolderName;
  
  if (!hasBanks && !currentOutput) return null;

  return (
    <div className="w-full mt-3 text-[10px] font-cairo flex flex-col gap-2 border-t border-gray-300 pt-2.5 pb-2 overflow-visible" dir="rtl">
      {/* Row 1: Bank Accounts */}
      {hasBanks && (
        <div className="flex flex-row items-center justify-start gap-y-1 w-full overflow-visible py-0.5 flex-wrap">
          {shopConfig?.bankHolderName && (
            <div className="font-bold text-gray-900 ml-1.5 shrink-0">
              {shopConfig.bankHolderName}
            </div>
          )}
          
          {(shopConfig?.bankYerName || shopConfig?.bankYerAccount) && (
            <div className="flex items-center gap-1 shrink-0">
              {shopConfig?.bankHolderName && <span className="text-gray-400 mx-1">|</span>}
              <span className="text-gray-800 font-bold">{shopConfig.bankYerName}</span>
              <span className="text-gray-400">/</span>
              <span className="font-mono text-gray-950 font-black tracking-wider" dir="ltr">{shopConfig.bankYerAccount}</span>
            </div>
          )}
          
          {(shopConfig?.bankSarName || shopConfig?.bankSarAccount) && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-gray-400 mx-1">|</span>
              <span className="text-gray-800 font-bold">{shopConfig.bankSarName}</span>
              <span className="text-gray-400">/</span>
              <span className="font-mono text-gray-950 font-black tracking-wider" dir="ltr">{shopConfig.bankSarAccount}</span>
            </div>
          )}
          
          {(shopConfig?.bankUsdName || shopConfig?.bankUsdAccount) && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-gray-400 mx-1">|</span>
              <span className="text-gray-800 font-bold">{shopConfig.bankUsdName}</span>
              <span className="text-gray-400">/</span>
              <span className="font-mono text-gray-950 font-black tracking-wider" dir="ltr">{shopConfig.bankUsdAccount}</span>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
