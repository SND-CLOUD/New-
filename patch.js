const fs = require('fs');
let content = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const defaultTables = `const DEFAULT_HYBRID_TABLES = [
  'company_details', 'customers', 'invoices', 'invoice_items', 'vault_transactions',
  'maintenance_actions', 'device_categories', 'device_models', 'approval_actions',
  'settings', 'users', 'engineers', 'inventory_items', 'fin_transaction_types',
  'fin_funds', 'fin_currencies', 'fin_payment_methods', 'document_outputs',
  'user_devices', 'job_titles'
];

export default function Settings`;
content = content.replace('export default function Settings', defaultTables);

content = content.replace(
  /const \[hybridCustomMode, setHybridCustomMode\] = useState<boolean>\(false\);\n  const \[hybridSelectedTables, setHybridSelectedTables\] = useState<string\[\]>\(\[\]\);\n  const \[hybridAllTables, setHybridAllTables\] = useState<string\[\]>\(\[\]\);\n  const \[showHybridCustomModal, setShowHybridCustomModal\] = useState<boolean>\(false\);/,
  "const [hybridSelectedTables, setHybridSelectedTables] = useState<string[]>(DEFAULT_HYBRID_TABLES);"
);

content = content.replace(
  /const allTables = hybridCustomMode \? hybridSelectedTables : \[\.\.\.mainTables, \.\.\.categoryTables, \.\.\.engineerTables, \.\.\.shopTables, \.\.\.financialTables\];/,
  "const allTables = hybridSelectedTables;"
);

content = content.replace(
  /const tables = hybridCustomMode \? hybridSelectedTables : defaultTables;/,
  "const tables = hybridSelectedTables;"
);

const selectUI = `                {/* Select Database */}
                <div className="p-4 md:p-5 bg-white/5 rounded-2xl space-y-3 text-right">
                  <label className="text-xs font-bold text-gray-300 block">حدد نوع قاعدة البيانات المستهدفة كـ (القاعدة 1):</label>
                  <select
                    value={hybridDbType}
                    onChange={(e) => {
                      setHybridDbType(e.target.value as 'none' | 'CLOUD' | 'LOCAL');
                      setHybridResult({ type: null, message: '' });
                    }}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-orange-500 outline-none transition-all font-cairo text-right"
                  >
                    <option value="none">حدد نوع القاعدة المستهدفة كقاعدة 1</option>
                    <option value="CLOUD">قاعدة بيانات سحابية (CLOUD)</option>
                    <option value="LOCAL">قاعدة بيانات محلية (LOCAL)</option>
                  </select>
                </div>

                {/* Table Customization List */}
                <div className="mt-4 bg-black/30 border border-white/5 rounded-2xl p-4 text-right">
                  <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between mb-4 pb-4 border-b border-white/5 gap-3">
                    <div>
                      <span className="text-sm font-bold text-white block">الجداول المشمولة في الإجراء</span>
                      <span className="text-xs text-gray-400">حدد الجداول المطلوبة من القائمة ({hybridSelectedTables.length} محدد)</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all">
                      <span className="text-xs font-bold text-white">تحديد الكل</span>
                      <input
                        type="checkbox"
                        checked={hybridSelectedTables.length === DEFAULT_HYBRID_TABLES.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setHybridSelectedTables([...DEFAULT_HYBRID_TABLES]);
                          } else {
                            setHybridSelectedTables([]);
                          }
                        }}
                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-black/50 border-white/20 cursor-pointer"
                      />
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {DEFAULT_HYBRID_TABLES.map(tableName => (
                      <label key={tableName} className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/5 transition-all cursor-pointer group">
                        <span className="text-[11px] font-mono font-bold text-gray-300 group-hover:text-white transition-colors">{tableName}</span>
                        <input
                          type="checkbox"
                          checked={hybridSelectedTables.includes(tableName)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setHybridSelectedTables(prev => [...prev, tableName]);
                            } else {
                              setHybridSelectedTables(prev => prev.filter(t => t !== tableName));
                            }
                          }}
                          className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 bg-black/50 border-white/20 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions Grid */}`;

const oldUI = `                {/* Select Database */}
                <div className="p-4 md:p-5 bg-white/5 rounded-2xl space-y-3 text-right">
                  <label className="text-xs font-bold text-gray-300 block">حدد نوع قاعدة البيانات المستهدفة كـ (القاعدة 1):</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const allTables = [
                            'company_details', 'customers', 'invoices', 'invoice_items', 'vault_transactions',
                            'maintenance_actions', 'device_categories', 'device_models', 'approval_actions',
                            'settings', 'users', 'engineers', 'inventory_items', 'fin_transaction_types',
                            'fin_funds', 'fin_currencies', 'fin_payment_methods', 'document_outputs',
                            'user_devices', 'job_titles'
                          ];
                          setHybridAllTables(allTables);
                          setHybridSelectedTables(allTables);
                          setShowHybridCustomModal(true);
                        } catch (err) {
                           alert('حدث خطأ');
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center min-w-[70px]"
                    >
                      مخصص
                    </button>
                    <select
                      value={hybridDbType}
                      onChange={(e) => {
                        setHybridDbType(e.target.value as 'none' | 'CLOUD' | 'LOCAL');
                        setHybridResult({ type: null, message: '' });
                      }}
                      className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-orange-500 outline-none transition-all font-cairo text-right"
                    >
                      <option value="none">حدد نوع القاعدة المستهدفة كقاعدة 1</option>
                      <option value="CLOUD">قاعدة بيانات سحابية (CLOUD)</option>
                      <option value="LOCAL">قاعدة بيانات محلية (LOCAL)</option>
                    </select>
                  </div>
                  {hybridCustomMode && (
                    <div className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                      الوضع المخصص مفعل ({hybridSelectedTables.length} جداول محددة)
                      <button onClick={() => setHybridCustomMode(false)} className="text-white hover:text-rose-400 mr-2 underline">إلغاء الوضع المخصص</button>
                    </div>
                  )}
                </div>

                {/* Actions Grid */}`;

content = content.replace(oldUI, selectUI);

// We need to also remove the Modal for Hybrid Custom
const modalRegex = /\{\/\* Hybrid Custom Tables Modal \*\/\}.*?\{\/\* END Hybrid Custom Tables Modal \*\/\}/s;
content = content.replace(modalRegex, '');

fs.writeFileSync('src/components/Settings.tsx', content);
console.log('Patched Settings.tsx successfully');
