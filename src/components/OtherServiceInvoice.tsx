import React, { useState, useEffect, useRef } from 'react';
import { CustomerAutocomplete } from './CustomerAutocomplete';
import AddCustomerModal from './AddCustomerModal';
import { db, collection, doc, query, onSnapshot, serverTimestamp, writeBatch, runTransaction, getDocs, getDoc, increment } from '../firebase';
import { Customer, ShopConfig } from '../types';
import type { User } from '../types';
import { Tag, Wrench, Cpu, CheckCircle, Plus, Trash2, ArrowRight, Save, CircleDollarSign, AlertTriangle, Eye, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PrintPreviewOverlay from './PrintPreviewOverlay';

type ServiceType = 'software' | 'maintenance' | 'parts';

export default function OtherServiceInvoice({ type, onBack, shopConfig, user }: { type: ServiceType, onBack: () => void, shopConfig: ShopConfig | null, user: User | null }) {
  const { t } = useTranslation();
  
  const title = type === 'software' ? 'خدمات برمجية' : (type === 'maintenance' ? 'صيانة خارجية' : 'بيع قطع غيار');
  const icon = type === 'software' ? <Cpu size={24} className="text-cyan-400" /> : (type === 'maintenance' ? <Wrench size={24} className="text-amber-400" /> : <Tag size={24} className="text-emerald-400" />);
  
  const [customer, setCustomer] = useState({ name: '', phone1: '', phone2: '', notes: '' });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [noPhone, setNoPhone] = useState(false);
  
  const [currency, setCurrency] = useState<'USD' | 'SAR' | 'YER'>(shopConfig?.liabilityCurrency as any || 'USD');
  const [items, setItems] = useState<{ id: string, name: string, quantity: number, unitCost: number, notes: string }[]>([]);
  
  // Current Item
  const initialItem = { id: '', name: '', quantity: 1, unitCost: 0, notes: '' };
  const [currentItem, setCurrentItem] = useState(initialItem);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  
  // Payment Method & Fund Selection for Other Services
  const [funds, setFunds] = useState<any[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'cash' | 'bank'>('cash');
  const [depositorName, setDepositorName] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ invoiceNumber: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentOutput, setCurrentOutput] = useState<any>(null);

  // Load Funds from ProviderFactory and Firestore
  useEffect(() => {
    let isMounted = true;
    const fetchFunds = async () => {
      try {
        const { ProviderFactory } = await import('../data/ProviderFactory');
        const docs = await ProviderFactory.getProvider().getDocs('fin_funds');
        if (isMounted && Array.isArray(docs)) {
          const activeFunds = docs.filter((f: any) => f.status !== 'inactive');
          setFunds(activeFunds);
        }
      } catch (err) {
        console.warn("Could not load fin_funds in OtherServiceInvoice:", err);
      }
    };
    fetchFunds();

    const qFunds = query(collection(db, 'fin_funds'));
    const unsub = onSnapshot(qFunds, (snapshot) => {
      if (snapshot.docs.length > 0) {
        const fList = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter((f: any) => f.status !== 'inactive');
        setFunds(fList);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  // Auto-select matching fund when currency or paymentType changes
  useEffect(() => {
    if (funds.length > 0) {
      const filtered = funds.filter(f => (paymentType === 'bank' ? f.type === 'bank' : f.type === 'cash'));
      const matched = filtered.find(f => (f.currency || 'USD') === currency) || filtered[0] || funds[0];
      if (matched && (!selectedFundId || !funds.some(f => f.id === selectedFundId && (paymentType === 'bank' ? f.type === 'bank' : f.type === 'cash')))) {
        setSelectedFundId(matched.id);
      }
    }
  }, [currency, paymentType, funds]);

  useEffect(() => {
    let matchedCustomer = null;
    if (selectedCustomerId) {
      matchedCustomer = existingCustomers.find(c => c.id === selectedCustomerId);
    } else if (customer.name.trim()) {
      matchedCustomer = existingCustomers.find(c => c.name.trim() === customer.name.trim());
    }

    if (matchedCustomer && matchedCustomer.liabilityCurrency) {
      const uCurrency = matchedCustomer.liabilityCurrency.trim().toUpperCase();
      if (['SAR', 'ريال سعودي'].includes(uCurrency)) {
        setCurrency('SAR');
      } else if (['YER', 'ريال يمني'].includes(uCurrency)) {
        setCurrency('YER');
      } else if (['USD', 'دولار'].includes(uCurrency)) {
        setCurrency('USD');
      } else {
        setCurrency('USD');
      }
    } else {
      setCurrency(shopConfig?.liabilityCurrency as 'USD' | 'SAR' | 'YER' || 'USD');
    }
  }, [customer.name, selectedCustomerId, existingCustomers, shopConfig]);

  useEffect(() => {
    const q = query(collection(db, 'customers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const custs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
      setExistingCustomers(custs);
    });
    return () => unsubscribe();
  }, []);

  const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  const paid = amountPaid === '' ? 0 : Number(amountPaid);
  const remainingAmount = totalCost - paid;

  const handleAddItem = () => {
    if (!currentItem.name.trim() || currentItem.quantity < 1 || currentItem.unitCost < 0) return;
    
    if (editingIndex !== null) {
      setItems(curr => {
        const next = [...curr];
        next[editingIndex] = { ...currentItem };
        return next;
      });
      setEditingIndex(null);
    } else {
      setItems([...items, { ...currentItem, id: Date.now().toString() }]);
    }
    setCurrentItem(initialItem);
  };

  const handleEditItem = (idx: number) => {
    setEditingIndex(idx);
    setCurrentItem(items[idx]);
  };

  const handleRemoveItem = (idx: number) => {
    if (editingIndex === idx) {
      setEditingIndex(null);
      setCurrentItem(initialItem);
    }
    setItems(items.filter((_, i) => i !== idx));
  };

  const generateOutputData = async () => {
    if (!customer.name.trim()) {
      setError("الرجاء إدخال اسم العميل");
      return null;
    }
    if (!noPhone && !customer.phone1.trim()) {
      setError("الرجاء إدخال رقم هاتف العميل أو تحديد خيار (بدون)");
      return null;
    }
    if (items.length === 0) {
      setError("الرجاء إضافة صنف واحد على الأقل");
      return null;
    }

    let finalCustomerId = selectedCustomerId;
    let customerNumberForUpdate: number | null = null;
    if (!selectedCustomerId) {
      const settingsRef = doc(db, 'settings', 'app');
      try {
        const nextCustomerNumber = await runTransaction(db, async (transaction) => {
          const sfDoc = await transaction.get(settingsRef);
          let currentNum = 1;
          if (sfDoc.exists()) {
            currentNum = (sfDoc.data().lastCustomerNumber || 0) + 1;
          }
          return currentNum;
        });
        customerNumberForUpdate = nextCustomerNumber;
        finalCustomerId = 'new_temp'; 
      } catch (e) {
         console.warn(e);
      }
    }

    const finalInvoiceNumber = 'PREVIEW'; // Will be real on save

    return {
      invoice: {
        invoiceNumber: finalInvoiceNumber,
        customerName: customer.name,
        currency: currency,
        totalCost: totalCost,
        amountPaid: paid,
        status: 'delivered', // It's immediately closed
        notes: invoiceNotes,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      items: items.map(item => ({
        ...item,
        deviceType: item.name,
        deviceName: '',
        faultType: item.notes,
        cost: item.quantity * item.unitCost
      })),
      templateType: `sale_${type}`,
      customerNumberForUpdate
    };
  };

  const handlePreviewInit = async () => {
    const data = await generateOutputData();
    if (data) {
      setCurrentOutput(data);
      setShowPreview(true);
      setError(null);
    }
  };

  const handleSaveFinal = async (action: 'save' | 'print' | 'whatsapp') => {
    setIsSubmitting(true);
    setError(null);

    try {
      const batch = writeBatch(db);
      
      let finalCustomerId = selectedCustomerId;
      let customerNumberForUpdate: number | null = null;
      if (!selectedCustomerId) {
        const settingsRef = doc(db, 'settings', 'app');
        const nextCustomerNumber = await runTransaction(db, async (transaction) => {
          const sfDoc = await transaction.get(settingsRef);
          let currentNum = 1;
          if (sfDoc.exists()) {
            currentNum = (sfDoc.data().lastCustomerNumber || 0) + 1;
          }
          return currentNum;
        });
        customerNumberForUpdate = nextCustomerNumber;
        const customerRef = doc(collection(db, 'customers'));
        batch.set(customerRef, {
          id: customerRef.id,
          customerNumber: nextCustomerNumber,
          name: customer.name.trim(),
          phone1: noPhone ? 'لا يوجد' : customer.phone1.trim(),
          phone2: customer.phone2?.trim() || '',
          notes: customer.notes?.trim() || '',
          createdAt: serverTimestamp(),
          hasWhatsapp: false
        });
        finalCustomerId = customerRef.id;
      }

      // Robust max invoice number calculation for O- prefix
      let maxOtherNum = 0;
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
        if (settingsDoc.exists() && settingsDoc.data().lastOtherInvoiceNumber) {
          maxOtherNum = Number(settingsDoc.data().lastOtherInvoiceNumber) || 0;
        }
      } catch (e) {
        console.warn("Could not read settings doc for lastOtherInvoiceNumber:", e);
      }

      try {
        const { localDb } = await import('../lib/local-db');
        const resNum = await localDb.query("SELECT invoiceNumber FROM invoices WHERE invoiceNumber LIKE 'O-%'");
        if (resNum.values && resNum.values.length > 0) {
          for (const row of resNum.values) {
            const str = String(row.invoiceNumber || '');
            const num = Number(str.replace(/[^0-9]/g, ''));
            if (!isNaN(num) && num > maxOtherNum) {
              maxOtherNum = num;
            }
          }
        }
      } catch (e) {
        console.warn("Could not query localDb for O- invoices:", e);
      }

      try {
        const { ProviderFactory } = await import('../data/ProviderFactory');
        const providerInvs = await ProviderFactory.getProvider().getDocs('invoices');
        if (providerInvs && Array.isArray(providerInvs)) {
          for (const inv of providerInvs) {
            if (inv.invoiceNumber && String(inv.invoiceNumber).includes('O-')) {
              const num = Number(String(inv.invoiceNumber).replace(/[^0-9]/g, ''));
              if (!isNaN(num) && num > maxOtherNum) {
                maxOtherNum = num;
              }
            }
          }
        }
      } catch (e) {
        console.warn("Could not query ProviderFactory for O- invoices:", e);
      }

      const nextOtherNum = maxOtherNum + 1;
      const finalAssignedInvoiceNumber = `O-${nextOtherNum}`;

      const settingsRef = doc(db, 'settings', 'app');
      const settingsUpdates: any = { lastOtherInvoiceNumber: nextOtherNum };
      if (customerNumberForUpdate !== null) {
        settingsUpdates.lastCustomerNumber = customerNumberForUpdate;
      }
      batch.set(settingsRef, settingsUpdates, { merge: true });

      const timestampIsoStr = new Date().toISOString();
      const invoiceRef = doc(collection(db, 'invoices'));
      const invoiceDataToSave = {
        id: invoiceRef.id,
        invoiceNumber: finalAssignedInvoiceNumber,
        customerId: finalCustomerId,
        customerName: customer.name,
        currency: currency,
        totalCost: totalCost,
        amountPaid: paid,
        status: 'delivered', 
        invoiceType: `sale_${type}`,
        notes: invoiceNotes,
        createdAt: timestampIsoStr,
        updatedAt: timestampIsoStr,
        printCount: action === 'print' || action === 'whatsapp' ? 1 : 0
      };

      batch.set(invoiceRef, {
        ...invoiceDataToSave,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const itemsToSync: any[] = [];
      for (const item of items) {
        const itemRef = doc(collection(db, 'invoice_items'));
        const itemDataToSave = {
          id: itemRef.id,
          invoiceId: invoiceRef.id,
          invoiceNumber: finalAssignedInvoiceNumber,
          customerId: finalCustomerId,
          customerName: customer.name,
          deviceType: item.name,
          deviceName: item.name,
          quantity: item.quantity,
          cost: item.quantity * item.unitCost,
          unitCost: item.unitCost,
          status: 'delivered',
          source: `sale_${type}`,
          deviceNotes: item.notes,
          createdAt: timestampIsoStr,
          createdBy: user?.name || 'System'
        };
        itemsToSync.push(itemDataToSave);
        batch.set(itemRef, {
          ...itemDataToSave,
          createdAt: serverTimestamp()
        });
      }

      let txIdToSync: string | null = null;
      let txDataToSync: any = null;
      let fundToSync: any = null;

      if (paid > 0) {
        let nextNum = 1000;
        try {
          const { localDb } = await import('../lib/local-db');
          const resNum = await localDb.query("SELECT COALESCE(MAX(voucherNumber), 1000) as maxNum FROM vault_transactions");
          nextNum = (resNum.values?.[0]?.maxNum || 1000) + 1;
        } catch (e) {
          nextNum = 1001;
        }

        let chosenFund: any = funds.find(f => f.id === selectedFundId);
        if (!chosenFund) {
          chosenFund = funds.find(f => (paymentType === 'bank' ? f.type === 'bank' : f.type === 'cash') && (f.currency || 'USD') === currency)
            || funds.find(f => (f.currency || 'USD') === currency)
            || funds[0];
        }

        if (!chosenFund) {
          try {
            const { ProviderFactory } = await import('../data/ProviderFactory');
            const allFunds = await ProviderFactory.getProvider().getDocs('fin_funds');
            if (Array.isArray(allFunds)) {
              chosenFund = allFunds.find((f: any) => (paymentType === 'bank' ? f.type === 'bank' : f.type === 'cash') && (f.currency || 'USD') === currency)
                || allFunds.find((f: any) => f.type === 'cash')
                || allFunds[0];
            }
          } catch (e) {
            console.warn("Could not fetch fin_funds:", e);
          }
        }

        const bankDetailsObj = paymentType === 'bank' ? {
          depositorName: depositorName.trim(),
          referenceNumber: referenceNumber.trim()
        } : null;
        const bankDetailsStr = bankDetailsObj ? JSON.stringify(bankDetailsObj) : '';

        const targetFundId = chosenFund ? chosenFund.id : '';
        const targetFundName = chosenFund ? chosenFund.name : (paymentType === 'bank' ? 'حساب بنكي' : 'الخزينة الرئيسية');

        const txId = `vtx-${Math.random().toString(36).substring(2, 8)}`;
        const timestampIso = new Date().toISOString();

        txDataToSync = {
          id: txId,
          currency: currency || 'USD',
          amount: paid,
          customerName: customer.name || 'عميل نقدي',
          invoiceNumber: String(finalAssignedInvoiceNumber),
          userName: user?.name || user?.username || 'مدير النظام',
          userNumber: 1,
          userId: user?.id || 'admin',
          timestamp: timestampIso,
          type: 'receipt',
          notes: `سداد في الفاتورة رقم ${finalAssignedInvoiceNumber} (${title})`,
          updatedAt: timestampIso,
          voucherNumber: nextNum,
          transactionCategory: 'دفعة أجهزة',
          fundId: targetFundId,
          fundName: targetFundName,
          customerId: finalCustomerId || '',
          isReversed: 0,
          isReversal: 0,
          reversalOf: '',
          paymentType: paymentType === 'bank' ? 2 : 1,
          liabilityCurrency: currency || 'USD',
          liabilityAmount: paid,
          receiptCurrency: currency || 'USD',
          receiptAmount: paid,
          bankDetails: bankDetailsStr
        };
        txIdToSync = txId;
        fundToSync = chosenFund;

        const txRef = doc(collection(db, 'vault_transactions'), txId);
        batch.set(txRef, {
          ...txDataToSync,
          timestamp: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        if (chosenFund) {
          const fundRef = doc(db, 'fin_funds', chosenFund.id);
          batch.update(fundRef, {
            balance: increment(paid)
          });
        }
      }

      await batch.commit();

      try {
        const { ProviderFactory } = await import('../data/ProviderFactory');
        const provider = ProviderFactory.getProvider();
        await provider.setDoc('invoices', invoiceRef.id, invoiceDataToSave);
        for (const itemData of itemsToSync) {
          await provider.setDoc('invoice_items', itemData.id, itemData);
        }
        await provider.setDoc('settings', 'app', { lastOtherInvoiceNumber: nextOtherNum });

        if (txIdToSync && txDataToSync) {
          await provider.setDoc('vault_transactions', txIdToSync, txDataToSync);
          if (fundToSync) {
            await provider.updateDoc('fin_funds', fundToSync.id, {
              balance: { type: 'increment', value: paid }
            });
          }
        }
      } catch (e) {
        console.warn("Failed syncing invoice and transactions to ProviderFactory:", e);
      }
      
      setSuccessInfo({ invoiceNumber: finalAssignedInvoiceNumber });

      if (action === 'save') {
        setShowPreview(false);
      } else if (action === 'print') {
        const printBtn = document.getElementById('internal-print-btn');
        if (printBtn) printBtn.click();
        setTimeout(() => setShowPreview(false), 2000);
      } else if (action === 'whatsapp') {
        const waBtn = document.getElementById('internal-wa-btn');
        if (waBtn) waBtn.click();
        setTimeout(() => setShowPreview(false), 2000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessInfo(null);
    setShowPreview(false);
    setCustomer({ name: '', phone1: '', phone2: '', notes: '' });
    setSelectedCustomerId(null);
    setItems([]);
    setAmountPaid('');
    setInvoiceNotes('');
    setCurrentItem(initialItem);
    setEditingIndex(null);
  };

  if (successInfo && !showPreview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={48} className="text-emerald-500" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2 font-cairo">تم الحفظ والترحيل بنجاح</h2>
        <p className="text-gray-400 mb-8">تم تسجيل الفاتورة بنجاح وإضافتها للقيود المحاسبية</p>
        <div className="bg-[#1a1a1a] border border-white/5 p-8 rounded-2xl flex flex-col items-center gap-2 mb-8 shadow-2xl">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">رقم الفاتورة</span>
          <p className="text-5xl font-mono font-black text-orange-500">{successInfo.invoiceNumber}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
          >
            <Plus size={20} />
            إضافة عملية جديدة
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/5 rounded-full transition-colors group"
          >
            <ArrowRight size={24} className="text-gray-400 group-hover:text-white transition-colors" />
          </button>
          <div className="flex items-center gap-3">
            {icon}
            <h1 className="text-2xl font-black text-white font-cairo">{title}</h1>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertTriangle size={20} />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
        <div className="space-y-4">
          
          {/* Customer Info */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl shadow-xl overflow-visible">
            <div className="p-4 border-b border-white/5 bg-white/5 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <UserIcon size={16} />
                </div>
                <h3 className="font-bold text-white">بيانات العميل</h3>
              </div>
              <div className="flex flex-row items-center justify-end gap-3 shrink-0 flex-wrap pointer-events-none opacity-85" title="تتغير العملة تلقائياً حسب عملة حساب العميل">
                <label className="flex items-center gap-1 cursor-pointer group">
                  <input type="radio" value="USD" checked={currency === 'USD'} readOnly className="w-3.5 h-3.5 accent-orange-500 cursor-pointer mb-0.5" />
                  <span className={`text-[10px] font-bold transition-colors ${currency === 'USD' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>دولار</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer group">
                  <input type="radio" value="SAR" checked={currency === 'SAR'} readOnly className="w-3.5 h-3.5 accent-orange-500 cursor-pointer mb-0.5" />
                  <span className={`text-[10px] font-bold transition-colors ${currency === 'SAR' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>سعودي</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer group">
                  <input type="radio" value="YER" checked={currency === 'YER'} readOnly className="w-3.5 h-3.5 accent-orange-500 cursor-pointer mb-0.5" />
                  <span className={`text-[10px] font-bold transition-colors ${currency === 'YER' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>ريال</span>
                </label>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <CustomerAutocomplete
                    customers={existingCustomers}
                    onSelect={(c) => {
                      setCustomer({ name: c.name, phone1: c.phone1, phone2: c.phone2 || '', notes: c.notes || '' });
                      setSelectedCustomerId(c.id || null);
                    }}
                    onInputChange={(val) => {
                      setCustomer(prev => ({ ...prev, name: val }));
                      if (selectedCustomerId) setSelectedCustomerId(null);
                    }}
                    onAddNew={() => setShowAddCustomerModal(true)}
                    label="الاسم الكامل"
                    placeholder="ابحث او ادخل اسم العميل"
                    initialValue={customer.name}
                    type="name"
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-between w-24 shrink-0">
                    <label className="text-xs text-gray-500 uppercase font-black tracking-widest text-right">رقم الهاتف</label>
                    <button
                      type="button"
                      onClick={() => {
                        setNoPhone(!noPhone);
                        if (!noPhone) setCustomer({ ...customer, phone1: '' });
                      }}
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border transition-all ${noPhone ? 'bg-orange-600 border-orange-500 text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                    >
                      بدون
                    </button>
                  </div>
                  <div className={`relative flex-1 ${noPhone ? 'opacity-30 pointer-events-none' : ''}`}>
                    <CustomerAutocomplete
                      customers={existingCustomers}
                      onSelect={(c) => {
                        setCustomer({ name: c.name, phone1: c.phone1, phone2: c.phone2 || '', notes: c.notes || '' });
                        setSelectedCustomerId(c.id || null);
                      }}
                      onInputChange={(val) => {
                        setCustomer(prev => ({ ...prev, phone1: val }));
                        if (selectedCustomerId) setSelectedCustomerId(null);
                      }}
                      placeholder="7xxxxxxxx"
                      initialValue={customer.phone1}
                      type="phone"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Items Box */}
          <div className="bg-[#111111] border border-white/5 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Plus size={16} />
              </div>
              <h3 className="font-bold text-white">إضافة الأصناف / الخدمات</h3>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] text-gray-500 font-bold mb-1 px-1">البيان / الوصف</label>
                  <input
                    type="text"
                    value={currentItem.name}
                    onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                    placeholder="ادخل الوصف هنا..."
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                  />
                </div>
                <div className="w-full md:w-20 shrink-0">
                  <label className="block text-[10px] text-gray-500 font-bold mb-1 px-1 text-center">الكمية</label>
                  <input
                    type="number"
                    min="1"
                    value={Number.isNaN(Number(currentItem.quantity)) ? '' : currentItem.quantity}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setCurrentItem({...currentItem, quantity: val === '' ? 1 : Math.max(1, parseInt(val))});
                    }}
                    className="w-full bg-black border border-white/10 rounded-xl px-2 py-2 text-sm text-center font-mono text-white focus:border-orange-500 outline-none"
                  />
                </div>
                <div className="w-full md:w-32 shrink-0">
                  <label className="block text-[10px] text-gray-500 font-bold mb-1 px-1 text-center">سعر الوحدة</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentItem.unitCost === 0 ? '' : currentItem.unitCost}
                      onChange={(e) => setCurrentItem({...currentItem, unitCost: parseFloat(e.target.value) || 0})}
                      className="w-full bg-black border border-white/10 rounded-xl px-2 py-2 pl-8 text-sm font-mono text-white focus:border-orange-500 outline-none"
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-500 font-bold">{currency}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[10px] text-gray-500 font-bold mb-1 px-1">ملاحظات (اختياري)</label>
                  <input
                    type="text"
                    value={currentItem.notes}
                    onChange={(e) => setCurrentItem({...currentItem, notes: e.target.value})}
                    placeholder="ملاحظات..."
                    className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-orange-500 outline-none"
                  />
                </div>
                <div className="flex items-end shrink-0">
                  <button
                    onClick={handleAddItem}
                    disabled={!currentItem.name.trim() || currentItem.quantity < 1 || currentItem.unitCost < 0}
                    className={`h-[38px] px-6 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                      !currentItem.name.trim() || currentItem.quantity < 1 || currentItem.unitCost < 0
                        ? 'bg-orange-600/30 text-white/50 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg'
                    }`}
                  >
                    {editingIndex !== null ? 'تعديل' : 'إضافة'}
                    {editingIndex !== null ? undefined : <Plus size={14}/>}
                  </button>
                </div>
              </div>

              {/* Items Table */}
              {items.length > 0 && (
                <div className="mt-4 border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-white" dir="rtl">
                    <thead className="bg-black/40 border-b border-white/10">
                      <tr>
                        <th className="py-2 px-3 text-[10px] uppercase tracking-widest text-gray-500 w-10 text-center">#</th>
                        <th className="py-2 px-3 text-[10px] uppercase tracking-widest text-gray-500 text-right">البيان</th>
                        <th className="py-2 px-3 text-[10px] uppercase tracking-widest text-gray-500 w-20 text-center">الكمية</th>
                        <th className="py-2 px-3 text-[10px] uppercase tracking-widest text-gray-500 w-28 text-center">السعر</th>
                        <th className="py-2 px-3 text-[10px] uppercase tracking-widest text-gray-500 w-28 text-center">الإجمالي</th>
                        <th className="py-2 px-3 text-[10px] uppercase tracking-widest text-gray-500 w-32 text-right">ملاحظات</th>
                        <th className="py-2 px-3 text-[10px] uppercase tracking-widest text-gray-500 w-24 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors bg-black/20">
                          <td className="py-2 px-3 text-sm font-black text-gray-600 text-center">{idx + 1}</td>
                          <td className="py-2 px-3 text-sm font-bold text-white">
                            <div className="truncate" title={item.name}>{item.name}</div>
                          </td>
                          <td className="py-2 px-3 text-sm font-mono text-center">{item.quantity}</td>
                          <td className="py-2 px-3 text-sm font-mono text-center">
                            {item.unitCost} <span className="text-[9px] text-gray-500">{currency}</span>
                          </td>
                          <td className="py-2 px-3 text-sm font-mono font-bold text-emerald-400 text-center">
                            {item.quantity * item.unitCost} <span className="text-[9px] text-gray-500">{currency}</span>
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-400">
                            <div className="truncate max-w-[120px]" title={item.notes}>{item.notes || '-'}</div>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditItem(idx)}
                                className={`p-1.5 rounded-lg transition-all ${editingIndex === idx ? 'bg-orange-500 text-white' : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white'}`}
                              >
                                <span className="text-[10px] font-bold">تعديل</span>
                              </button>
                              <button
                                onClick={() => handleRemoveItem(idx)}
                                className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {/* Action Bar */}
            <div className="p-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="ملاحظات الفاتورة الأساسية (اختياري)..."
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-orange-500 outline-none"
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="bg-white/5 text-gray-400 font-bold px-3 py-2 rounded-xl text-xs font-mono border border-white/10 shrink-0">
                  {items.length} صنف
                </div>
                <button 
                  onClick={handlePreviewInit}
                  disabled={items.length === 0 || !customer.name.trim()}
                  className="px-6 py-2 rounded-xl font-black text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  معاينة الفاتورة
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar for Checkout / Summary */}
        <div className="bg-[#111111] border border-white/5 rounded-2xl shadow-xl overflow-hidden sticky top-4">
          <div className="p-4 border-b border-white/5 bg-white/5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <CircleDollarSign size={18} className="text-emerald-400" />
              الخلاصة المالية
            </h3>
          </div>
          <div className="p-5 space-y-5">
            <div>
              <div className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">إجمالي التكلفة</div>
              <div className="text-3xl font-black font-mono text-white">
                {totalCost.toLocaleString('en-US')} <span className="text-sm text-gray-500 font-sans">{currency}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">المدفوع من العميل</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaid}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setAmountPaid(Number.isNaN(val) ? '' : val);
                  }}
                  className="w-full bg-black border-2 border-orange-500/30 focus:border-orange-500 rounded-xl px-4 py-3 text-xl font-black font-mono text-orange-400 outline-none transition-all"
                  placeholder="0.00"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-bold">{currency}</div>
              </div>
            </div>

            {paid > 0 && (
              <div className="space-y-3 pt-3 border-t border-white/10 bg-white/5 p-3 rounded-xl">
                <div>
                  <label className="text-xs text-gray-400 font-bold mb-1 block">طريقة الدفع</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentType('cash')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                        paymentType === 'cash'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'bg-black/50 text-gray-400 hover:text-white border border-white/10'
                      }`}
                    >
                      نقدي (خزينة)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('bank')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                        paymentType === 'bank'
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-black/50 text-gray-400 hover:text-white border border-white/10'
                      }`}
                    >
                      تحويل بنكي / شبكة
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-bold mb-1 block">
                    {paymentType === 'bank' ? 'اختر الحساب البنكي' : 'اختر الخزينة / الصندوق'}
                  </label>
                  <select
                    value={selectedFundId}
                    onChange={(e) => setSelectedFundId(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-orange-500"
                  >
                    {funds
                      .filter(f => (paymentType === 'bank' ? f.type === 'bank' : f.type === 'cash'))
                      .map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.currency || 'USD'})
                        </option>
                      ))}
                    {funds.filter(f => (paymentType === 'bank' ? f.type === 'bank' : f.type === 'cash')).length === 0 && (
                      funds.map(f => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.type === 'cash' ? 'نقدي' : 'بنكي'} - {f.currency || 'USD'})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {paymentType === 'bank' && (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[11px] text-gray-400 font-bold block mb-1">اسم المحول / العميل (اختياري)</label>
                      <input
                        type="text"
                        value={depositorName}
                        onChange={(e) => setDepositorName(e.target.value)}
                        placeholder="اسم صاحب الحساب..."
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 font-bold block mb-1">رقم مرجع التحويل / السند</label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="Ref #..."
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">المتبقي للحساب</div>
              <div className={`text-xl font-black font-mono ${remainingAmount > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {remainingAmount.toLocaleString('en-US')} <span className="text-xs text-gray-500">{currency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddCustomerModal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onSuccess={(c) => {
          setCustomer({ name: c.name, phone1: c.phone1, phone2: c.phone2 || '', notes: c.notes || '' });
          setSelectedCustomerId(c.id || null);
          setShowAddCustomerModal(false);
        }}
        customers={existingCustomers}
        user={user}
        initialName={customer.name}
        initialPhone={customer.phone1}
      />

      {showPreview && currentOutput && (
        <PrintPreviewOverlay
          type="invoice"
          data={currentOutput}
          onClose={() => setShowPreview(false)}
          shopConfig={shopConfig}
          user={user}
          onPrint={() => handleSaveFinal('print')}
          onWhatsApp={() => handleSaveFinal('whatsapp')}
          onSave={() => handleSaveFinal('save')}
          isSaving={isSubmitting}
        />
      )}
    </div>
  );
}
