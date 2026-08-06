import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Check, UserPlus } from 'lucide-react';
import { doc, getDoc, collection, writeBatch, serverTimestamp, db } from '../firebase';
import { Customer, User as SystemUser } from '../types';
import { CustomerAutocomplete } from './CustomerAutocomplete';
import { localDb } from '../lib/local-db';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
  initialName?: string;
  initialPhone?: string;
  user: SystemUser;
  customers: Customer[];
}

export default function AddCustomerModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialName = '', 
  initialPhone = '',
  user,
  customers 
}: AddCustomerModalProps) {
  const [addName, setAddName] = useState(initialName);
  const [addCompanyName, setAddCompanyName] = useState('');
  const [addLiabilityCurrency, setAddLiabilityCurrency] = useState('USD');
  const [addPhone1, setAddPhone1] = useState(initialPhone);
  const [addPhone2, setAddPhone2] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addHasWhatsapp, setAddHasWhatsapp] = useState(false);
  const [isAddingInProcess, setIsAddingInProcess] = useState(false);
  const [availableCurrencies, setAvailableCurrencies] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      setAddName(initialName);
      setAddPhone1(initialPhone);
      setAddHasWhatsapp(false);
      
      const fetchCurrencies = async () => {
        try {
          const res = await localDb.query("SELECT * FROM fin_currencies WHERE status = 'active' ORDER BY name ASC");
          if (res.values && res.values.length > 0) {
            setAvailableCurrencies(res.values as any[]);
            const hasUSD = res.values.some((c: any) => c.name === 'USD');
            if (hasUSD) {
              setAddLiabilityCurrency('USD');
            } else {
              setAddLiabilityCurrency(res.values[0].name || 'USD');
            }
          } else {
            setAvailableCurrencies([{ id: 'USD', name: 'USD' }]);
            setAddLiabilityCurrency('USD');
          }
        } catch (err) {
          console.error("Error loading currencies in modal:", err);
          setAvailableCurrencies([{ id: 'USD', name: 'USD' }]);
          setAddLiabilityCurrency('USD');
        }
      };
      fetchCurrencies();
    }
  }, [isOpen, initialName, initialPhone]);

  const nextCustomerNumber = Math.max(0, ...customers.map(c => Number(c.customerNumber) || 0)) + 1;
  const isAddFormValid = addName.trim() !== '' && addPhone1.trim() !== '';

  const handleAddCustomer = async () => {
    if (!isAddFormValid) return;

    const normalizedNewName = addName.replace(/\s+/g, '').toLowerCase();
    const isDuplicate = customers.some(c => (c.name || '').replace(/\s+/g, '').toLowerCase() === normalizedNewName);
    
    if (isDuplicate) {
      alert('العميل موجود مسبقاً في النظام. يرجى التأكد من اسم العميل.');
      return;
    }

    setIsAddingInProcess(true);
    try {
      const nextNum = Math.max(0, ...customers.map(c => Number(c.customerNumber) || 0)) + 1;
      const settingsRef = doc(db, 'settings', 'app');
      const settingsDoc = await getDoc(settingsRef);
      let sysNextNum = nextNum;
      if (settingsDoc.exists()) {
        const lastCustNum = Number(settingsDoc.data()?.lastCustomerNumber) || 0;
        sysNextNum = Math.max(nextNum, lastCustNum + 1);
      }

      const batch = writeBatch(db);
      const customerRef = doc(collection(db, 'customers'));
      
      const newCustomerData = {
        name: addName.trim(),
        companyName: addCompanyName.trim(),
          liabilityCurrency: addLiabilityCurrency,
        phone1: addPhone1.trim(),
        phone2: addPhone2.trim(),
        email: addEmail.trim(),
        notes: addNotes.trim(),
        hasWhatsapp: addHasWhatsapp,
        customerNumber: sysNextNum,
        createdAt: serverTimestamp()
      };

      batch.set(customerRef, newCustomerData);
      batch.set(doc(db, 'settings', 'app'), { lastCustomerNumber: sysNextNum }, { merge: true });

      await batch.commit();

      onSuccess({ id: customerRef.id, ...newCustomerData } as any);
      onClose();
      
      // Reset
      setAddName('');
      setAddCompanyName('');
      setAddLiabilityCurrency('USD');
      setAddPhone1('');
      setAddPhone2('');
      setAddEmail('');
      setAddNotes('');
      setAddHasWhatsapp(false);
    } catch (err) {
      console.error("Error adding customer:", err);
    } finally {
      setIsAddingInProcess(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#121212] border border-orange-500/20 rounded-[2.5rem] p-6 md:p-8 w-full max-w-2xl shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-orange-600/10 text-orange-500 rounded-xl border border-orange-500/15">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h2 className="text-sm font-black font-cairo text-white">إضافة عميل جديد في النظام</h2>
                  <p className="text-[10px] text-gray-400 font-bold mt-1">يرجى إدخال البيانات الأساسية للعميل الجديد</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-white/5 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 text-right">
                <label className="text-[11px] font-bold text-gray-400 block font-cairo">رقم العميل المولد تلقائياً:</label>
                <input
                  type="text"
                  value={`# ${nextCustomerNumber}`}
                  disabled
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-3 text-sm font-mono text-gray-500 text-right cursor-not-allowed font-bold"
                />
              </div>

              <div className="space-y-2 text-right">
                <CustomerAutocomplete
                  customers={customers}
                  onSelect={(c) => {
                    setAddName(c.name);
                    setAddPhone1(c.phone1);
                    setAddPhone2(c.phone2 || '');
                    setAddEmail(c.email || '');
                    setAddNotes(c.notes || '');
                    setAddHasWhatsapp(c.hasWhatsapp !== undefined ? c.hasWhatsapp : true);
                    setAddCompanyName(c.companyName || '');
                    setAddLiabilityCurrency(c.liabilityCurrency || 'USD');
                  }}
                  onInputChange={(val) => setAddName(val)}
                  label="اسم العميل * (إلزامي):"
                  placeholder="مثال: محمد أحمد علي..."
                  initialValue={addName}
                  type="name"
                />
              </div>

              <div className="space-y-2 text-right">
                <label className="text-[11px] font-bold text-gray-400 block font-cairo">اسم الجهة أو الشركة (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: شركة البرمجيات المتحدة..."
                  value={addCompanyName}
                  onChange={(e) => setAddCompanyName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-sm font-bold text-white text-right font-cairo"
                />
              </div>

              <div className="space-y-2 text-right">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-gray-400 block font-cairo">رقم الهاتف الرئيسي <span className="text-orange-500 font-extrabold">* (أساسي)</span>:</label>
                  <button
                    type="button"
                    onClick={() => setAddPhone1('لا يوجد')}
                    className="px-2 py-0.5 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 rounded-lg text-[9px] font-black font-cairo transition-all border border-orange-500/15"
                  >
                    تخطي لا يوجد
                  </button>
                </div>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="أدخل رقم الجوال أو الهاتف الرئيسي..."
                  value={addPhone1}
                  onChange={(e) => setAddPhone1(e.target.value.replace(/[^0-9+*#]/g, ''))}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-sm font-bold text-white text-right font-mono"
                />
              </div>

              <div className="space-y-2 text-right">
                <label className="text-[11px] font-bold text-gray-400 block font-cairo">رقم هاتف ثانوي (اختياري):</label>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="أدخل رقم الجوال الإضافي (إن وجد)..."
                  value={addPhone2}
                  onChange={(e) => setAddPhone2(e.target.value.replace(/[^0-9+*#]/g, ''))}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-sm font-bold text-white text-right font-mono"
                />
              </div>

              <div className="space-y-2 text-right">
                <label className="text-[11px] font-bold text-gray-400 block font-cairo">البريد الإلكتروني (اختياري):</label>
                <input
                  type="email"
                  placeholder="customer@domain.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-sm font-bold text-white text-right font-mono"
                />
              </div>
              <div className="space-y-2 text-right">
                <label className="text-[11px] font-bold text-gray-400 block font-cairo">عملة الذمة الافتراضية:</label>
                <select
                  value={addLiabilityCurrency}
                  onChange={(e) => setAddLiabilityCurrency(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-sm font-bold text-white text-right font-cairo appearance-none"
                >
                  {availableCurrencies.length > 0 ? (
                    availableCurrencies.map((curr) => (
                      <option key={curr.id} value={curr.name}>
                        {curr.name === 'USD' ? 'دولار (USD)' : curr.name === 'SAR' ? 'ريال سعودي (SAR)' : curr.name === 'YER' ? 'ريال يمني (YER)' : curr.name === 'EUR' ? 'يورو (EUR)' : curr.name}
                      </option>
                    ))
                  ) : (
                    <option value="USD">دولار (USD)</option>
                  )}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2 text-right">
                <label className="text-[11px] font-bold text-gray-400 block font-cairo">تفاصيل وملاحظات إضافية عن العميل (اختياري):</label>
                <textarea
                  placeholder="اكتب أية تفاصيل خاصة بالدفع، العنوان، أو شروحات إضافية..."
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-sm font-bold text-slate-200 text-right font-cairo resize-none"
                />
              </div>

              <div className="space-y-2 md:col-span-2 flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
                <div className="space-y-0.5 text-right">
                  <label className="text-xs font-bold text-white block font-cairo">يمتلك حساب واتساب؟</label>
                  <p className="text-[10px] text-gray-500 font-cairo">تحديد هذا الخيار يسمح بإرسال كشوفات الحساب والتقارير عبر الواتساب مباشرة.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddHasWhatsapp(!addHasWhatsapp)}
                  className={`w-12 h-6 rounded-full relative transition-all duration-300 ${addHasWhatsapp ? 'bg-emerald-600 shadow-[0_0_10px_rgba(5,150,105,0.3)]' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${addHasWhatsapp ? 'right-7' : 'right-1'}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gray-400 hover:text-white font-black font-cairo text-xs transition-all"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                disabled={!isAddFormValid || isAddingInProcess}
                onClick={handleAddCustomer}
                className={`px-8 py-3 font-black font-cairo text-xs rounded-xl transition-all shadow-lg flex items-center gap-2 border ${
                  isAddFormValid && !isAddingInProcess
                    ? 'bg-orange-600 hover:bg-orange-500 text-white border-orange-600 hover:shadow-orange-600/15'
                    : 'bg-white/[0.02] text-gray-500 border-white/5 cursor-not-allowed shadow-none'
                }`}
              >
                {isAddingInProcess ? (
                  <span>جاري الحفظ والتهيئة...</span>
                ) : (
                  <>
                    <Check size={14} />
                    <span>تنفيذ إضافة العميل</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
