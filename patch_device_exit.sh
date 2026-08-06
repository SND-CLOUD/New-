sed -i 's/disabled={selectedItemIds.size === 0 || exitPaidAmount > total}/disabled={selectedItemIds.size === 0 || exitPaidAmount > total || (otherPayment?.isActive \&\& (Number(exitPaidAmount) + Number(exitDiscountAmount)) === 0)}/g' src/components/entry-exit/DeviceExit.tsx

sed -i 's/{f.name} ({f.currency}) - الرصيد: {f.balance?.toLocaleString()}/{f.name} ({f.currency})/g' src/components/entry-exit/DeviceExit.tsx

sed -i 's/className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs font-cairo transition-all shadow-lg shadow-purple-600\/25 cursor-pointer"/disabled={Number(modalAmount) === 0 || !modalSelectedFundId}\n                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs font-cairo transition-all shadow-lg shadow-purple-600\/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"/g' src/components/entry-exit/DeviceExit.tsx
