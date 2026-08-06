import React, { useEffect, useState } from 'react';
import { localDb } from '../lib/local-db';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Coins, 
  Wallet, 
  CreditCard, 
  Check, 
  X, 
  Settings, 
  AlertCircle,
  Hash,
  Activity,
  Award
} from 'lucide-react';

interface FinTransactionType {
  id: string;
  name: string;
  type: 'receipt' | 'payment';
}

interface FinFund {
  id: string;
  name: string;
  type: 'cash' | 'bank';
  currency: string;
  description: string;
  status: 'active' | 'suspended';
  balance: number;
  bankAccount?: string;
}

interface FinCurrency {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  status: 'active' | 'suspended';
}

interface FinPaymentMethod {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'suspended';
}

export default function AccountingInputs() {
  const [subTab, setSubTab] = useState<'types' | 'funds' | 'currencies' | 'methods' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States for lists
  const [txTypes, setTxTypes] = useState<FinTransactionType[]>([]);
  const [funds, setFunds] = useState<FinFund[]>([]);
  const [currencies, setCurrencies] = useState<FinCurrency[]>([]);
  const [methods, setMethods] = useState<FinPaymentMethod[]>([]);

  // Form states - Types
  const [typeForm, setTypeForm] = useState<{ id?: string; name: string; type: 'receipt' | 'payment' }>({
    name: '',
    type: 'receipt'
  });
  const [showTypeForm, setShowTypeForm] = useState(false);

  // Form states - Funds
  const [fundForm, setFundForm] = useState<{
    id?: string;
    name: string;
    type: 'cash' | 'bank';
    currency: string;
    description: string;
    status: 'active' | 'suspended';
    bankAccount?: string;
  }>({
    name: '',
    type: 'cash',
    currency: 'دولار',
    description: '',
    status: 'active',
    bankAccount: ''
  });
  const [showFundForm, setShowFundForm] = useState(false);

  // Form states - Currencies
  const [currencyForm, setCurrencyForm] = useState<{
    id?: string;
    name: string;
    symbol: string;
    decimals: number;
    status: 'active' | 'suspended';
  }>({
    name: '',
    symbol: '',
    decimals: 2,
    status: 'active'
  });
  const [showCurrencyForm, setShowCurrencyForm] = useState(false);

  // Form states - Methods
  const [methodForm, setMethodForm] = useState<{
    id?: string;
    name: string;
    description: string;
    status: 'active' | 'suspended';
  }>({
    name: '',
    description: '',
    status: 'active'
  });
  const [showMethodForm, setShowMethodForm] = useState(false);

  // Load Data Helper
  const loadAllData = async () => {
    setLoading(true);
    try {
      const typesRes = await localDb.query('SELECT * FROM fin_transaction_types');
      setTxTypes((typesRes.values || []) as FinTransactionType[]);

      const fundsRes = await localDb.query('SELECT * FROM fin_funds');
      setFunds((fundsRes.values || []) as FinFund[]);

      const currRes = await localDb.query('SELECT * FROM fin_currencies');
      setCurrencies((currRes.values || []) as FinCurrency[]);

      const methRes = await localDb.query('SELECT * FROM fin_payment_methods');
      setMethods((methRes.values || []) as FinPaymentMethod[]);
    } catch (err: any) {
      setError(err?.message || 'خطأ في تحميل البيانات المالية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const triggerNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // ----- SUBMIT HANDLERS -----

  // 1. Transaction Type Submit
  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name.trim()) return;

    try {
      if (typeForm.id) {
        // Edit
        await localDb.run(
          'UPDATE fin_transaction_types SET name = ?, type = ? WHERE id = ?',
          [typeForm.name.trim(), typeForm.type, typeForm.id]
        );
        triggerNotification('تم تحديث نوع العملية المالية بنجاح');
      } else {
        // Add
        const newId = `rec-${Math.random().toString(36).substring(2, 8)}`;
        await localDb.run(
          'INSERT INTO fin_transaction_types (id, name, type) VALUES (?, ?, ?)',
          [newId, typeForm.name.trim(), typeForm.type]
        );
        triggerNotification('تم إضافة نوع العملية المالية بنجاح');
      }
      setTypeForm({ name: '', type: 'receipt' });
      setShowTypeForm(false);
      loadAllData();
    } catch (err: any) {
      setError(err?.message || 'فشلت العملية');
    }
  };

  // Delete Type
  const [deleteTypeConfirmId, setDeleteTypeConfirmId] = useState<string | null>(null);

  const handleDeleteType = async (id: string) => {
    if (deleteTypeConfirmId === id) {
      try {
        await localDb.run('DELETE FROM fin_transaction_types WHERE id = ?', [id]);
        triggerNotification('تم حذف البند بنجاح');
        setDeleteTypeConfirmId(null);
        loadAllData();
      } catch (err: any) {
        setError(err.message || 'فشلت عملية الحذف');
      }
    } else {
      setDeleteTypeConfirmId(id);
      setTimeout(() => setDeleteTypeConfirmId(null), 3000);
    }
  };

  // 2. Fund Submit
  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundForm.name.trim()) return;

    try {
      if (fundForm.id) {
        // Edit path
        await localDb.run(
          'UPDATE fin_funds SET name = ?, type = ?, currency = ?, description = ?, status = ?, bankAccount = ? WHERE id = ?',
          [
            fundForm.name.trim(),
            fundForm.type,
            fundForm.currency,
            fundForm.description.trim(),
            fundForm.status,
            fundForm.type === 'bank' ? fundForm.bankAccount?.trim() : '',
            fundForm.id
          ]
        );
        triggerNotification('تم تحديث الصندوق بنجاح');
      } else {
        // Add path
        const newId = `fund-${Math.random().toString(36).substring(2, 8)}`;
        await localDb.run(
          'INSERT INTO fin_funds (id, name, type, currency, description, status, balance, bankAccount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            newId,
            fundForm.name.trim(),
            fundForm.type,
            fundForm.currency,
            fundForm.description.trim(),
            fundForm.status,
            0.0, // Default balance
            fundForm.type === 'bank' ? fundForm.bankAccount?.trim() : ''
          ]
        );
        triggerNotification('تم إضافة الصندوق الجديد بنجاح');
      }
      setFundForm({
        name: '',
        type: 'cash',
        currency: currencies[0]?.name || 'دولار',
        description: '',
        status: 'active',
        bankAccount: ''
      });
      setShowFundForm(false);
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ الصندوق');
    }
  };

  const handleToggleFundStatus = async (fund: FinFund) => {
    try {
      const newStatus = fund.status === 'active' ? 'suspended' : 'active';
      await localDb.run(
        'UPDATE fin_funds SET status = ? WHERE id = ?',
        [newStatus, fund.id]
      );
      triggerNotification(`تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} الصندوق بنجاح`);
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'فشل تحديث حالة الصندوق');
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteFund = async (fund: FinFund) => {
    if (deleteConfirmId === fund.id) {
      try {
        await localDb.run(
          'DELETE FROM fin_funds WHERE id = ?',
          [fund.id]
        );
        triggerNotification('تم حذف الصندوق بنجاح');
        setDeleteConfirmId(null);
        loadAllData();
      } catch (err: any) {
        setError(err.message || 'فشل حذف الصندوق');
      }
    } else {
      setDeleteConfirmId(fund.id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  // 3. Currency Submit
  const handleCurrencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currencyForm.name.trim() || !currencyForm.symbol.trim()) return;

    try {
      if (currencyForm.id) {
        await localDb.run(
          'UPDATE fin_currencies SET name = ?, symbol = ?, decimals = ?, status = ? WHERE id = ?',
          [
            currencyForm.name.trim(),
            currencyForm.symbol.trim(),
            Number(currencyForm.decimals),
            currencyForm.status,
            currencyForm.id
          ]
        );
        triggerNotification('تم تحديث العملة بنجاح');
      } else {
        const newId = currencyForm.symbol.trim().toUpperCase();
        await localDb.run(
          'INSERT INTO fin_currencies (id, name, symbol, decimals, status) VALUES (?, ?, ?, ?, ?)',
          [
            newId,
            currencyForm.name.trim(),
            currencyForm.symbol.trim(),
            Number(currencyForm.decimals),
            currencyForm.status
          ]
        );
        triggerNotification('تم إضافة العملة بنجاح');
      }
      setCurrencyForm({
        name: '',
        symbol: '',
        decimals: 2,
        status: 'active'
      });
      setShowCurrencyForm(false);
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'فشل تشغيل العملة');
    }
  };

  // 4. Payment Method Submit
  const handleMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodForm.name.trim()) return;

    try {
      if (methodForm.id) {
        await localDb.run(
          'UPDATE fin_payment_methods SET name = ?, description = ?, status = ? WHERE id = ?',
          [
            methodForm.name.trim(),
            methodForm.description.trim(),
            methodForm.status,
            methodForm.id
          ]
        );
        triggerNotification('تم تحديث طريقة الدفع بنجاح');
      } else {
        const newId = `pay-${Math.random().toString(36).substring(2, 8)}`;
        await localDb.run(
          'INSERT INTO fin_payment_methods (id, name, description, status) VALUES (?, ?, ?, ?)',
          [
            newId,
            methodForm.name.trim(),
            methodForm.description.trim(),
            methodForm.status
          ]
        );
        triggerNotification('تم إضافة طريقة الدفع الجديدة بنجاح');
      }
      setMethodForm({
        name: '',
        description: '',
        status: 'active'
      });
      setShowMethodForm(false);
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ طريقة الدفع');
    }
  };

  return (
    <div className="bg-[#141414] border border-white/5 rounded-3xl p-4 sm:p-6 w-full text-right" dir="rtl">
      
      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl flex items-center gap-2 text-sm justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-white/5 rounded-full"><X size={16} /></button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-2 text-sm">
          <Check size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {subTab !== null && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 font-cairo">
          <button
            onClick={() => { setSubTab(null); setError(null); }}
            className="p-2.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-white/5 cursor-pointer"
            title="الخروج للنافذة السابقة"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400 font-black bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              {subTab === 'types' && 'أنواع العمليات المالية'}
              {subTab === 'funds' && 'إدارة الصناديق'}
              {subTab === 'currencies' && 'إدارة العملات'}
              {subTab === 'methods' && 'إدارة طرق الدفع'}
            </span>
          </div>
        </div>
      )}

      {subTab === null && (
        <div className="space-y-6 max-w-xl mx-auto py-6 font-cairo animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-center mb-8">
            <h2 className="text-base font-black text-white">مدخلات العمليات الحسابية والتهيئة</h2>
            <p className="text-xs text-gray-400 mt-1">يرجى اختيار أحد الخيارات التالية لإدارة المدخلات والتهيئة المالية للبرنامج.</p>
          </div>

          <div className="space-y-3">
            {/* Button 1 */}
            <button
              onClick={() => { setSubTab('types'); setError(null); }}
              className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-[#1a1a1a] border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all group text-right cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Activity size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors">أنواع وتصنيفات العمليات المالية</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">تهيئة شجرة تصنيف المقبوضات والنفقات والمصروفات المتنوعة.</p>
                </div>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg text-gray-500 group-hover:text-white transition-colors">
                <Plus size={16} />
              </div>
            </button>

            {/* Button 2 */}
            <button
              onClick={() => { setSubTab('funds'); setError(null); }}
              className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-[#1a1a1a] border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all group text-right cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Wallet size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors">إدارة الصناديق والحسابات البنكية</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">إعداد الخزائن النقدية، الكاش، وحسابات الورشة البنكية النشطة.</p>
                </div>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg text-gray-500 group-hover:text-white transition-colors">
                <Plus size={16} />
              </div>
            </button>

            {/* Button 3 */}
            <button
              onClick={() => { setSubTab('currencies'); setError(null); }}
              className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-[#1a1a1a] border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all group text-right cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Coins size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors">إدارة عملات الورشة</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">تحديد العملات المتاحة للمعاملات وأسعار الصرف المقترنة بها.</p>
                </div>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg text-gray-500 group-hover:text-white transition-colors">
                <Plus size={16} />
              </div>
            </button>

            {/* Button 4 */}
            <button
              onClick={() => { setSubTab('methods'); setError(null); }}
              className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-[#1a1a1a] border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all group text-right cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors">إدارة طرق ووسائل الدفع</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">ضبط خيارات الدفع المتاحة للزبائن (نقداً، شبكة، تحويل بنكي).</p>
                </div>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg text-gray-500 group-hover:text-white transition-colors">
                <Plus size={16} />
              </div>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500 font-cairo">جاري تحميل البيانات...</div>
      ) : (
        <>
          {/* ==================================== TYPES TAB ========================== */}
          {subTab === 'types' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-2xl border border-white/5">
                <div>
                  <h3 className="text-sm font-black text-white font-cairo">شجرة تصنيف العمليات المالية</h3>
                  <p className="text-[11px] text-gray-500 font-cairo">تحديد مسميات عمليات القبض والتوريد وكذلك عمليات صرف النفقات.</p>
                </div>
                {!showTypeForm && (
                  <button 
                    onClick={() => {
                      setTypeForm({ name: '', type: 'receipt' });
                      setShowTypeForm(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl transition-all font-cairo"
                  >
                    <Plus size={16} />
                    إضافة عنصر جديد
                  </button>
                )}
              </div>

              {showTypeForm && (
                <form onSubmit={handleTypeSubmit} className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">نوع الحركة الأساسي</label>
                      <select 
                        value={typeForm.type}
                        onChange={(e) => setTypeForm({ ...typeForm, type: e.target.value as any })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                      >
                        <option value="receipt">سند القبض / إيراد</option>
                        <option value="payment">سند الصرف / مصروف</option>
                      </select>
                    </div>

                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">اسم البند أو الحركة</label>
                      <input 
                        type="text"
                        placeholder="مثال: دفعة تحت الحساب"
                        value={typeForm.name}
                        onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowTypeForm(false)}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      حفظ
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Receipts */}
                <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="bg-green-600/10 border-b border-green-500/15 px-4 py-3">
                    <h4 className="text-xs font-black text-green-400 font-cairo">بنود سندات القبض (التوريد)</h4>
                  </div>
                  <div className="p-3 divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                    {txTypes.filter(t => t.type === 'receipt').map((item, idx) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-200 font-cairo font-medium">{item.name}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={() => {
                              setTypeForm({ id: item.id, name: item.name, type: 'receipt' });
                              setShowTypeForm(true);
                            }}
                            className="p-1 hover:bg-white/5 text-amber-500 rounded"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteType(item.id)}
                            className={`p-1 rounded transition-colors ${
                              deleteTypeConfirmId === item.id
                                ? 'bg-red-600 text-white animate-pulse'
                                : 'hover:bg-white/5 text-red-500'
                            }`}
                            title="حذف البند"
                          >
                            {deleteTypeConfirmId === item.id ? (
                              <span className="text-[10px] px-1 font-bold">متأكد؟</span>
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    {txTypes.filter(t => t.type === 'receipt').length === 0 && (
                      <div className="text-center py-6 text-gray-600 text-[11px] font-cairo">لا توجد بنود متاحة.</div>
                    )}
                  </div>
                </div>

                {/* Payments */}
                <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="bg-red-600/10 border-b border-red-500/15 px-4 py-3">
                    <h4 className="text-xs font-black text-red-400 font-cairo">بنود سندات الصرف (المصروفات)</h4>
                  </div>
                  <div className="p-3 divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                    {txTypes.filter(t => t.type === 'payment').map((item, idx) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-200 font-cairo font-medium">{item.name}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={() => {
                              setTypeForm({ id: item.id, name: item.name, type: 'payment' });
                              setShowTypeForm(true);
                            }}
                            className="p-1 hover:bg-white/5 text-amber-500 rounded"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteType(item.id)}
                            className={`p-1 rounded transition-colors ${
                              deleteTypeConfirmId === item.id
                                ? 'bg-red-600 text-white animate-pulse'
                                : 'hover:bg-white/5 text-red-500'
                            }`}
                            title="حذف البند"
                          >
                            {deleteTypeConfirmId === item.id ? (
                              <span className="text-[10px] px-1 font-bold">متأكد؟</span>
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    {txTypes.filter(t => t.type === 'payment').length === 0 && (
                      <div className="text-center py-6 text-gray-600 text-[11px] font-cairo">لا توجد بنود متاحة.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================== FUNDS TAB ========================== */}
          {subTab === 'funds' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-2xl border border-white/5">
                <div>
                  <h3 className="text-sm font-black text-white font-cairo">إدارة الصناديق والخزائن</h3>
                  <p className="text-[11px] text-gray-500 font-cairo font-mono">الرقم | الاسم | النوع | العملة | المبلغ</p>
                </div>
                {!showFundForm && (
                  <button 
                    onClick={() => {
                      setFundForm({
                        name: '',
                        type: 'cash',
                        currency: currencies[0]?.name || 'دولار',
                        description: '',
                        status: 'active'
                      });
                      setShowFundForm(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl transition-all font-cairo"
                  >
                    <Plus size={16} />
                    إضافة صندوق جديد
                  </button>
                )}
              </div>

              {showFundForm && (
                <form onSubmit={handleFundSubmit} className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. نوع الصندوق */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">نوع الصندوق</label>
                      <div className="flex items-center gap-6 py-2">
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="fundType" 
                            checked={fundForm.type === 'cash'} 
                            onChange={() => setFundForm({ ...fundForm, type: 'cash', bankAccount: '' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>نقدي</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="fundType" 
                            checked={fundForm.type === 'bank'} 
                            onChange={() => setFundForm({ ...fundForm, type: 'bank' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>بنك</span>
                        </label>
                      </div>
                    </div>

                    {/* 3. العملة الأساسية للصندوق */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">العملة الأساسية للصندوق</label>
                      <select 
                        value={fundForm.currency}
                        onChange={(e) => setFundForm({ ...fundForm, currency: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                      >
                        {currencies.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* 4. اسم الصندوق */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">اسم الصندوق</label>
                      <input 
                        type="text"
                        placeholder="مثال: الصندوق اليمني"
                        value={fundForm.name}
                        onChange={(e) => setFundForm({ ...fundForm, name: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    {/* 5. رقم الحساب البنكي */}
                    <div className="space-y-1">
                      <label className={`text-xs font-bold block font-cairo mr-1 ${fundForm.type === 'bank' ? 'text-gray-400' : 'text-gray-600'}`}>رقم الحساب البنكي</label>
                      <input 
                        type="tel"
                        inputMode="tel"
                        placeholder="أدخل رقم الحساب إذا كان الصندوق بنكي"
                        value={fundForm.bankAccount || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9\- ]/g, '');
                          setFundForm({ ...fundForm, bankAccount: val });
                        }}
                        disabled={fundForm.type !== 'bank'}
                        className={`w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo outline-none transition-all ${fundForm.type === 'bank' ? 'text-white focus:border-amber-500' : 'text-gray-600 cursor-not-allowed opacity-50'}`}
                      />
                    </div>

                    {/* الحالة */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">الحالة</label>
                      <div className="flex items-center gap-6 py-2">
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="fundStatus" 
                            checked={fundForm.status === 'active'} 
                            onChange={() => setFundForm({ ...fundForm, status: 'active' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>فعال</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="fundStatus" 
                            checked={fundForm.status === 'suspended'} 
                            onChange={() => setFundForm({ ...fundForm, status: 'suspended' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>موقوف</span>
                        </label>
                      </div>
                    </div>

                    {/* 6. الوصف */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">الوصف</label>
                      <textarea 
                        rows={2}
                        placeholder="..."
                        value={fundForm.description}
                        onChange={(e) => setFundForm({ ...fundForm, description: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowFundForm(false)}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      حفظ
                    </button>
                  </div>
                </form>
              )}

              {/* Funds List Table */}
              <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5 text-xs text-gray-400 font-cairo font-bold">
                      <th className="py-3 px-4 text-center">الرقم</th>
                      <th className="py-3 px-4">الاسم</th>
                      <th className="py-3 px-4">النوع</th>
                      <th className="py-3 px-4">العملة</th>
                      <th className="py-3 px-4">الرصيد المتوفر</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {funds.map((f, index) => (
                      <tr key={f.id} className="hover:bg-white/5 transition-colors text-xs text-gray-200">
                        <td className="py-3 px-4 text-center font-mono text-[11px] text-gray-400">{index + 1}</td>
                        <td className="py-3 px-4 font-bold font-cairo">{f.name}</td>
                        <td className="py-3 px-4 font-cairo">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${f.type === 'cash' ? 'bg-amber-500/15 text-amber-500' : 'bg-blue-500/15 text-blue-400'}`}>
                            {f.type === 'cash' ? 'نقدي' : 'بنك'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-cairo">{f.currency}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">{f.balance?.toLocaleString('en-US')}</td>
                        <td className="py-3 px-4 font-cairo">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${f.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {f.status === 'active' ? 'فعال' : 'موقوف'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              type="button"
                              onClick={() => {
                                setFundForm({
                                  id: f.id,
                                  name: f.name,
                                  type: f.type,
                                  currency: f.currency,
                                  description: f.description || '',
                                  status: f.status,
                                  bankAccount: f.bankAccount || ''
                                });
                                setShowFundForm(true);
                                setError(null);
                              }}
                              className="p-1.5 px-3 bg-amber-500/10 hover:bg-amber-500 hover:text-black rounded-lg text-amber-500 text-[10px] font-bold font-cairo transition-all flex items-center justify-center"
                              title="تعديل بيانات الصندوق"
                            >
                              <Edit2 size={12} className="ml-1.5" />
                              تعديل
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleToggleFundStatus(f)}
                              className={`p-1.5 px-3 rounded-lg text-[10px] font-bold font-cairo transition-all flex items-center justify-center ${f.status === 'active' ? 'bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white' : 'bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white'}`}
                              title={f.status === 'active' ? "إيقاف الصندوق" : "تفعيل الصندوق"}
                            >
                              {f.status === 'active' ? (
                                <>
                                  <X size={12} className="ml-1" />
                                  إيقاف
                                </>
                              ) : (
                                <>
                                  <Check size={12} className="ml-1" />
                                  تفعيل
                                </>
                              )}
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteFund(f)}
                              className={`p-1.5 px-3 rounded-lg text-[10px] font-bold font-cairo transition-all flex items-center justify-center ${
                                deleteConfirmId === f.id 
                                  ? 'bg-red-600 text-white animate-pulse' 
                                  : 'bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white'
                              }`}
                              title="حذف الصندوق"
                            >
                              <Trash2 size={12} className="ml-1.5" />
                              {deleteConfirmId === f.id ? 'متأكد؟' : 'حذف'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {funds.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-gray-500 font-cairo">لم يتم العثور على أي صناديق مالية.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================== CURRENCIES TAB ========================== */}
          {subTab === 'currencies' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-2xl border border-white/5">
                <div>
                  <h3 className="text-sm font-black text-white font-cairo">إدارة العملات والكسور</h3>
                  <p className="text-[11px] text-gray-500 font-cairo">العملة والرمز والكسر العشري التلقائي المعين لتوفير دقة الحسابات.</p>
                </div>
                {!showCurrencyForm && (
                  <button 
                    onClick={() => {
                      setCurrencyForm({
                        name: '',
                        symbol: '',
                        decimals: 2,
                        status: 'active'
                      });
                      setShowCurrencyForm(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl transition-all font-cairo"
                  >
                    <Plus size={16} />
                    إضافة عملة جديدة
                  </button>
                )}
              </div>

              {showCurrencyForm && (
                <form onSubmit={handleCurrencySubmit} className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">اسم العملة</label>
                      <input 
                        type="text"
                        placeholder="مثال: دولار أمريكي"
                        value={currencyForm.name}
                        onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">الرمز المالي</label>
                      <input 
                        type="text"
                        placeholder="مثال: USD, $, YER"
                        value={currencyForm.symbol}
                        onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">عدد الكسور العشرية</label>
                      <input 
                        type="number"
                        min="0"
                        max="5"
                        dir="ltr"
                        lang="en"
                        onFocus={e => e.target.select()}
                        value={currencyForm.decimals}
                        onChange={(e) => setCurrencyForm({ ...currencyForm, decimals: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500/30"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">الحالة</label>
                      <div className="flex items-center gap-6 py-2">
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="currStatus" 
                            checked={currencyForm.status === 'active'} 
                            onChange={() => setCurrencyForm({ ...currencyForm, status: 'active' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>نشط ومفعل</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="currStatus" 
                            checked={currencyForm.status === 'suspended'} 
                            onChange={() => setCurrencyForm({ ...currencyForm, status: 'suspended' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>موقوف</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowCurrencyForm(false)}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      حفظ
                    </button>
                  </div>
                </form>
              )}

              {/* Currencies List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currencies.map(c => (
                  <div key={c.id} className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-cairo">{c.name}</span>
                        <span className="text-[10px] bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded font-mono font-bold">{c.symbol}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-cairo">كسور عشرية: {c.decimals}</p>
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${c.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {c.status === 'active' ? 'مفعل' : 'موقوف'}
                      </span>
                    </div>

                    <button 
                      onClick={() => {
                        setCurrencyForm({
                          id: c.id,
                          name: c.name,
                          symbol: c.symbol,
                          decimals: c.decimals,
                          status: c.status
                        });
                        setShowCurrencyForm(true);
                        setError(null);
                      }}
                      className="p-2 bg-white/5 hover:bg-amber-500 hover:text-black rounded-xl text-gray-400 transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================== PAYMENT METHODS TAB ========================== */}
          {subTab === 'methods' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-2xl border border-white/5">
                <div>
                  <h3 className="text-sm font-black text-white font-cairo">طرق وسندات الدفع</h3>
                  <p className="text-[11px] text-gray-500 font-cairo">تحديد أساليب السداد المقبولة (نقدي، تحويل بنكي) للبرنامج.</p>
                </div>
                {!showMethodForm && (
                  <button 
                    onClick={() => {
                      setMethodForm({
                        name: '',
                        description: '',
                        status: 'active'
                      });
                      setShowMethodForm(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl transition-all font-cairo"
                  >
                    <Plus size={16} />
                    طريقة دفع جديدة
                  </button>
                )}
              </div>

              {showMethodForm && (
                <form onSubmit={handleMethodSubmit} className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">اسم طريقة الدفع</label>
                      <input 
                        type="text"
                        placeholder="مثال: تحويل بنكي مباشر"
                        value={methodForm.name}
                        onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">الحالة</label>
                      <div className="flex items-center gap-6 py-2">
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="methStatus" 
                            checked={methodForm.status === 'active'} 
                            onChange={() => setMethodForm({ ...methodForm, status: 'active' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>فعالة ونشطة</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="methStatus" 
                            checked={methodForm.status === 'suspended'} 
                            onChange={() => setMethodForm({ ...methodForm, status: 'suspended' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>موقوفة</span>
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">الوصف</label>
                      <input 
                        type="text"
                        placeholder="..."
                        value={methodForm.description}
                        onChange={(e) => setMethodForm({ ...methodForm, description: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowMethodForm(false)}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      حفظ
                    </button>
                  </div>
                </form>
              )}

              {/* Methods list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {methods.map(m => (
                  <div key={m.id} className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-white font-cairo">{m.name}</h4>
                      <p className="text-[10px] text-gray-400 font-cairo mt-1">{m.description || 'لا يوجد وصف'}</p>
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-2 ${m.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {m.status === 'active' ? 'نشطة' : 'موقوفة'}
                      </span>
                    </div>

                    <button 
                      onClick={() => {
                        setMethodForm({
                          id: m.id,
                          name: m.name,
                          description: m.description || '',
                          status: m.status
                        });
                        setShowMethodForm(true);
                        setError(null);
                      }}
                      className="p-2 bg-[#242424] hover:bg-amber-500 hover:text-black rounded-xl text-gray-400 transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
