import { CustomerAutocomplete } from '../CustomerAutocomplete';
import AddCustomerModal from '../AddCustomerModal';
import { sharePdfFile, openWhatsApp } from '../../lib/shareHelper';
import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight,
  Save, 
  CircleDollarSign,
  User,
  Phone,
  HardDrive,
  AlertTriangle,
  Info,
  CheckCircle,
  Loader2,
  ChevronRight,
  X,
  MapPin,
  Facebook,
  Smartphone,
  SlidersHorizontal,
  MessageCircle
} from 'lucide-react';
import ReportActions from '../ReportActions';
import PrintPreviewOverlay from '../PrintPreviewOverlay';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { sanitizeDocumentStyles, sanitizeElementInlineStyles, cleanOklchInStyleText, applyPrintStylesAndGetRestoreFn } from '../../lib/html2canvasHelper';
import BankAccountsFooter from '../BankAccountsFooter';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  runTransaction,
  writeBatch,
  onSnapshot
} from '../../firebase';
import { db } from '../../firebase';
import { Customer, Invoice, InvoiceItem, User as SystemUser, VaultTransaction } from '../../types';
import { handleFirestoreError } from '../../lib/error-handler';
import { OperationType } from '../../types';
import { useTranslation } from 'react-i18next';
import { localDb } from '../../lib/local-db';

export default function DeviceEntry({ onBack, user }: { onBack: () => void, user: SystemUser }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [deviceCategories, setDeviceCategories] = useState<{ id: string; name: string }[]>([]);
  const [deviceModels, setDeviceModels] = useState<{ id: string; name: string; categoryName?: string }[]>([]);
  const [noPhone, setNoPhone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ invoiceNumber: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [shopConfig, setShopConfig] = useState<any>(null);
  const [currentOutput, setCurrentOutput] = useState<any>(null);

  // Form State
  const [customer, setCustomer] = useState({ name: '', phone1: '', phone2: '', notes: '' });
  const [keyboardMode, setKeyboardMode] = useState<Record<string, 'none' | 'text'>>({});
  const isRefocusing = useRef<Record<string, boolean>>({});
  const focusInitiated = useRef<Record<string, boolean>>({});
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  
  const [activeAutocomplete, setActiveAutocomplete] = useState<{index: number, type: 'deviceType' | 'deviceName'} | null>(null);

  const [notes, setNotes] = useState('لا يوجد');
  const [currency, setCurrency] = useState<'USD' | 'SAR' | 'YER'>('USD');
  const [items, setItems] = useState<(Partial<InvoiceItem> & { unitCost?: number | '' })[]>([]);
  
  const initialDeviceState = { deviceType: '', deviceName: '', quantity: 1, faultType: 'صيانة', deviceNotes: 'بدون ملحقات', technicalNotes: '', status: '10', cost: 0, technician: '' };
  const [currentDevice, setCurrentDevice] = useState<Partial<InvoiceItem> & { unitCost?: number | '' }>(initialDeviceState);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('entry_visible_columns');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return {
      deviceType: true,
      deviceName: true,
      quantity: true,
      faultType: true,
      deviceNotes: true,
    };
  });
  
  useEffect(() => {
    localStorage.setItem('entry_visible_columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const calculateNextInvoiceNumber = async (settingsData?: any) => {
    let last = 0;
    if (settingsData) {
      last = Number(settingsData.lastInvoiceNumber) || 0;
    } else {
      try {
        const docSnap = await Promise.race([
          getDoc(doc(db, 'settings', 'app')),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]) as any;
        if (docSnap && docSnap.exists && docSnap.exists()) {
          last = Number(docSnap.data()?.lastInvoiceNumber) || 0;
        }
      } catch (err) {
        console.warn("Could not fetch settings/app for baseline", err);
      }
    }

    try {
      const { localDb } = await import('../../lib/local-db');
      const resNum = await localDb.query("SELECT COALESCE(MAX(CAST(invoiceNumber AS INTEGER)), 0) as maxNum FROM invoices WHERE invoiceNumber GLOB '*[0-9]*'");
      if (resNum.values?.[0]?.maxNum) {
         const localMax = Number(resNum.values[0].maxNum);
         if (localMax > last) {
           last = localMax;
         }
      }
    } catch (err) {
      console.warn("Failed to query local max invoice number", err);
    }
    
    setInvoiceNumber(`${last + 1}`);
  };

  useEffect(() => {
    // Calculate on mount
    calculateNextInvoiceNumber();

    // 1. App settings for real-time baseline invoice number
    const unsubscribeAppSettings = onSnapshot(doc(db, 'settings', 'app'), (docSnap) => {
      if (docSnap.exists()) {
        calculateNextInvoiceNumber(docSnap.data());
      }
    });

    // 1b. Real-time updates when new invoices are added locally (synced from other devices)
    const unsubscribeInvoices = onSnapshot(collection(db, 'invoices'), () => {
      calculateNextInvoiceNumber();
    });

    // 2. Shop settings for company details (logo, name, phones, etc)
    const loadShopConfig = async () => {
      try {
        // Try Firebase first
        const docSnap = await getDoc(doc(db, 'company_details', 'main_details'));
        if (docSnap.exists()) {
          setShopConfig(docSnap.data());
          return;
        }

        // Fallback to SQLite company_details
        const localRes = await localDb.query("SELECT * FROM company_details LIMIT 1");
        if (localRes.values && localRes.values.length > 0) {
          setShopConfig(localRes.values[0]);
        }
      } catch (err) {
        console.error("Error loading shop config:", err);
      }
    };

    const unsubscribeShopSettings = onSnapshot(doc(db, 'company_details', 'main_details'), (docSnap) => {
      if (docSnap.exists()) {
        setShopConfig(docSnap.data());
      }
    });

    loadShopConfig();

    // Fetch customers for search
    const fetchCustomers = async () => {
      const s = await getDocs(collection(db, 'customers'));
      setExistingCustomers(s.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
    };
    fetchCustomers();

    // Fetch categories
    const unsubscribeCats = onSnapshot(collection(db, 'device_categories'), (snapshot) => {
      const cats = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setDeviceCategories(cats);
    });

    // Fetch models
    const unsubscribeModels = onSnapshot(collection(db, 'device_models'), (snapshot) => {
      setDeviceModels(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    return () => {
      unsubscribeAppSettings();
      unsubscribeInvoices();
      unsubscribeShopSettings();
      unsubscribeCats();
      unsubscribeModels();
    };
  }, []);

  useEffect(() => {
    let matchedCustomer: Customer | undefined;
    if (selectedCustomerId) {
      matchedCustomer = existingCustomers.find(c => c.id === selectedCustomerId);
    } else if (customer.name.trim()) {
      matchedCustomer = existingCustomers.find(c => c.name.trim().toLowerCase() === customer.name.trim().toLowerCase());
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
        // If it's a known currency not handled, maybe default to USD
        setCurrency('USD');
      }
    } else {
      setCurrency('USD');
    }
  }, [customer.name, selectedCustomerId, existingCustomers]);

  const [pendingNewDevices, setPendingNewDevices] = useState<{categories: string[], models: string[]} | null>(null);

  const handlePreAddDeviceToTable = () => {
    if (!currentDevice.deviceType?.trim() || !currentDevice.deviceName?.trim() || !currentDevice.faultType?.trim() || !currentDevice.quantity || currentDevice.quantity < 1) return;

    const cat = currentDevice.deviceType?.trim();
    const mod = currentDevice.deviceName?.trim();
    
    let isNewCat = cat && !deviceCategories.some(c => c.name === cat);
    let isNewMod = mod && !deviceModels.some(m => m.name === mod);

    if (isNewCat || isNewMod) {
      setPendingNewDevices({ 
        categories: isNewCat ? [cat] : [], 
        models: isNewMod ? [mod] : [] 
      });
      return;
    }
    
    addDeviceToTable();
  };

  const addDeviceToTable = () => {
    if (!currentDevice.deviceType?.trim() || !currentDevice.deviceName?.trim() || !currentDevice.faultType?.trim() || !currentDevice.quantity || currentDevice.quantity < 1) return;
    
    if (editingIndex !== null) {
      setItems(currentItems => {
        const newItems = [...currentItems];
        newItems[editingIndex] = { ...currentDevice };
        return newItems;
      });
      setEditingIndex(null);
    } else {
      setItems([...items, { ...currentDevice }]);
    }
    setCurrentDevice(initialDeviceState);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setCurrentDevice(initialDeviceState);
    }
  };

  const editItem = (index: number) => {
    setEditingIndex(index);
    setCurrentDevice({ ...items[index] });
  };

  const handlePreviewInit = () => {
    if (!customer.name) {
      setErrorMsg(t('addInvoice.errorNameReq'));
      return;
    }
    
    if (!noPhone && !customer.phone1) {
      setErrorMsg(t('addInvoice.errorPhoneReq'));
      return;
    }

    if (items.length === 0 || items.some(i => !i.deviceType || !i.faultType)) {
      setErrorMsg(t('addInvoice.errorItemsReq'));
      return;
    }

    setShowPreview(true);
  };

  const handleSaveFinal = async (action: 'commit' | 'print' | 'whatsapp') => {
    setPendingNewDevices(null);
    setLoading(true);
    let finalAssignedInvoiceNumber = invoiceNumber;

    try {
      const settingsRef = doc(db, 'settings', 'app');
      let settingsDoc: any = null;
      try {
        settingsDoc = await Promise.race([
          getDoc(settingsRef),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
        ]);
      } catch (err) {
        console.warn("getDoc settingsRef timed out:", err);
      }
      
      let lastInvoiceNumber = 0;
      if (settingsDoc && settingsDoc.exists && settingsDoc.exists()) {
        lastInvoiceNumber = Number(settingsDoc.data()?.lastInvoiceNumber) || 0;
      }
      
      try {
        const { localDb } = await import('../../lib/local-db');
        const resNum = await localDb.query("SELECT COALESCE(MAX(CAST(invoiceNumber AS INTEGER)), 0) as maxNum FROM invoices WHERE invoiceNumber GLOB '*[0-9]*'");
        if (resNum.values?.[0]?.maxNum) {
           const localMax = Number(resNum.values[0].maxNum);
           if (localMax > lastInvoiceNumber) {
             lastInvoiceNumber = localMax;
           }
        }
      } catch (err) {
        console.warn("Failed to get local max invoice number", err);
      }

      finalAssignedInvoiceNumber = `${lastInvoiceNumber + 1}`;

      const batch = writeBatch(db);

      // 1. Handle Customer
      let finalCustomerId = selectedCustomerId;
      let customerNumberForUpdate: number | null = null;
      if (!finalCustomerId) {
        let lastCustomerNumber = 0;
        if (settingsDoc.exists()) {
          lastCustomerNumber = Number(settingsDoc.data()?.lastCustomerNumber) || 0;
        }
        try {
          const { localDb } = await import('../../lib/local-db');
          const resNum = await localDb.query("SELECT COALESCE(MAX(customerNumber), 0) as maxNum FROM customers");
          if (resNum.values?.[0]?.maxNum) {
            const localCustMax = Number(resNum.values[0].maxNum);
            if (localCustMax > lastCustomerNumber) {
              lastCustomerNumber = localCustMax;
            }
          }
        } catch (err) {
          console.warn("Failed to get local max customer number", err);
        }

        const finalCustomerNumber = lastCustomerNumber + 1;
        customerNumberForUpdate = finalCustomerNumber;
        const customerRef = doc(collection(db, 'customers'));
        batch.set(customerRef, {
          id: customerRef.id,
          customerNumber: finalCustomerNumber,
          name: customer.name,
          phone1: noPhone ? 'لا يوجد' : customer.phone1,
          phone2: customer.phone2,
          hasWhatsapp: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        finalCustomerId = customerRef.id;
      }

      // Update settings with lastInvoiceNumber and optionally lastCustomerNumber
      const settingsUpdates: any = { lastInvoiceNumber: Number(finalAssignedInvoiceNumber) };
      if (!selectedCustomerId && customerNumberForUpdate !== null) {
        settingsUpdates.lastCustomerNumber = customerNumberForUpdate;
      }
      batch.set(doc(db, 'settings', 'app'), settingsUpdates, { merge: true });

      // 2. Handle Invoice
      const invoiceTotal = 0;
      const invoiceRef = doc(collection(db, 'invoices'));
      batch.set(invoiceRef, {
        id: invoiceRef.id,
        invoiceNumber: finalAssignedInvoiceNumber,
        customerId: finalCustomerId,
        customerName: customer.name,
        currency: currency,
        totalCost: invoiceTotal,
        amountPaid: 0,
        status: '10',
        notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        printCount: (action === 'print' || action === 'whatsapp') ? 1 : 0
      });

      // 3. Handle Items
      for (const item of items) {
        let currentCatName = item.deviceType?.trim() || 'مجهول';
        let catId = currentCatName ? currentCatName.replace(/\//g, '_') : '';

        const itemRef = doc(collection(db, 'invoice_items'));
        const cleanItem = {
          id: itemRef.id,
          invoiceId: invoiceRef.id,
          invoiceNumber: finalAssignedInvoiceNumber,
          customerId: finalCustomerId,
          customerName: customer.name,
          categoryId: catId,
          deviceType: currentCatName,
          deviceName: item.deviceName || '',
          quantity: Number(item.quantity) || 1,
          faultType: item.faultType || 'صيانة',
          customerProblem: item.faultType || 'صيانة',
          deviceNotes: item.deviceNotes || 'بدون ملحقات',
          cost: 0,
          status: '10',
          technician: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: user?.name || 'System'
        };
        batch.set(itemRef, cleanItem);

        // Auto-add new category
        if (currentCatName) {
           const catRef = doc(db, 'device_categories', catId);
           batch.set(catRef, { id: catId, name: currentCatName, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
        }

        // Auto-add new model under the category
        let currentModelName = item.deviceName?.trim();
        if (currentModelName && catId) {
           const modelId = `${catId}_${currentModelName.replace(/\//g, '_')}`;
           const modelRef = doc(db, 'device_models', modelId);
           batch.set(modelRef, { 
             id: modelId,
             categoryId: catId, 
             categoryName: currentCatName, 
             name: currentModelName, 
             createdAt: serverTimestamp(),
             updatedAt: serverTimestamp()
           }, { merge: true });
        }
      }

      // 4. Update Settings - Removed to avoid conflicts on central settings/app document

      await batch.commit();

      // Update the local invoiceNumber temporarily so PDF captures the correct number
      setInvoiceNumber(finalAssignedInvoiceNumber);

      // Wait a moment for React to render the new invoice number
      await new Promise(resolve => setTimeout(resolve, 0));

      if (action === 'print' || action === 'whatsapp') {
        const outputRef = await addDoc(collection(db, 'document_outputs'), {
          document_id: invoiceRef.id,
          document_number: finalAssignedInvoiceNumber,
          output_type: action === 'print' ? 'PRINT' : 'Share',
          output_datetime: serverTimestamp(),
          user_id: user?.id || 'System' // Assumes user has an id or use name if id is not robust
        });

        setCurrentOutput({
          id: outputRef.id,
          user_id: (user as any)?.uid || user?.id || user?.name || 'System',
          output_datetime: new Date()
        });

        // Wait a moment for React to render the output block
        await new Promise(resolve => setTimeout(resolve, 100));

        const originalStyle = document.createElement('style');
        originalStyle.innerHTML = `
          @media print {
        @page { size: auto; margin: 0; }
            body * { visibility: hidden !important; }
            #print-preview-area, #print-preview-area * { visibility: visible !important; }
            #print-preview-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
          margin: 0 !important;
          padding: 10mm !important;
              color: #000000 !important;
              background-color: #ffffff !important;
            }
          }
        `;

        if (action === 'print') {
          document.head.appendChild(originalStyle);
          window.print();
          document.head.removeChild(originalStyle);
        } else if (action === 'whatsapp') {
          const element = document.getElementById('print-preview-area');
          if (element) {
            try {
              // Temporarily remove transform to ensure clean capture
              const parentElement = element.parentElement;
              let originalTransform = '';
              if (parentElement) {
                originalTransform = parentElement.style.transform;
                parentElement.style.transform = 'none';
              }

              const canvas = await htmlToImage.toCanvas(element, {
                pixelRatio: 2,
                backgroundColor: '#ffffff',
              });

              if (parentElement) {
                parentElement.style.transform = originalTransform;
              }

              const imgData = canvas.toDataURL('image/jpeg', 0.95);
              
              const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
              });

              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
              let heightLeft = pdfHeight;
              let position = 0;

              pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
              heightLeft -= pdf.internal.pageSize.getHeight();

              while (heightLeft > 0.5) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
                heightLeft -= pdf.internal.pageSize.getHeight();
              }
              
              const formattedDate = new Date().toISOString().split('T')[0];
              const filename = `سند إستلام أجهزة للصيانة_${customer.name}_${formattedDate}.pdf`;
              pdf.save(filename);

              let message = `*فاتورة دخول أجهزة* 📄\n\n`;
              message += `عزيزي العميل *${customer.name}* المحترم،\n`;
              message += `تجد أدناه الفاتورة الخاصة باستلام أجهزتكم رقم *${finalAssignedInvoiceNumber}*:\n\n`;
              message += `- *رقم الفاتورة:* ${finalAssignedInvoiceNumber}\n\n`;
              message += `*الأجهزة المستلمة:*\n`;
              items.forEach((item, index) => {
                message += `\n_${index + 1}. *${item.deviceType} - ${item.deviceName || ''}*_\n`;
                message += `   • المشكلة: ${item.faultType || '-'}\n`;
              });
              message += `\nيسعدنا خدمتكم دائمًا. شكرًا لتعاملكم معنا!`;

              let sharedNatively = false;
              try {
        const pdfBlob = pdf.output('blob');
        sharedNatively = await sharePdfFile(pdfBlob, filename, message, 'invoice');
      } catch (shareErr) {
                console.warn('Native sharing failed, falling back to WhatsApp redirect', shareErr);
              }

              if (!sharedNatively) {
                const cleanPhone = customer.phone1 && /^[0-9+]+$/.test(customer.phone1.replace(/\s+/g, ''))
                  ? customer.phone1.replace(/\s+/g, '')
                  : '';
                openWhatsApp(message, cleanPhone);
              }
            } catch (err) {
              console.error('Failed to generate or share PDF', err);
            }
          }
        }
      }

      // Success Handling
      setSuccessInfo({ invoiceNumber: finalAssignedInvoiceNumber });

      // Reset form on success
      setCustomer({ name: '', phone1: '', phone2: '', notes: '' });
      setItems([]);
      setCurrentDevice(initialDeviceState);
      setEditingIndex(null);
      setNotes('');
      setNoPhone(false);
      setShowPreview(false);
      setInvoiceNumber((Number(finalAssignedInvoiceNumber) + 1).toString());
      
    } catch (error: any) {
      setErrorMsg(`Error saving: ${error.message || error}`);
      handleFirestoreError(error, OperationType.WRITE, 'invoices/items');
    } finally {
      setLoading(false);
    }
  };

  const canSave = customer.name.trim() !== '' && 
    (noPhone || customer.phone1.trim() !== '') && 
    items.length > 0 && 
    items.every(i => 
      i.deviceType?.trim() !== '' && 
      i.faultType?.trim() !== '' &&
      i.quantity !== '' && i.quantity !== undefined && Number(i.quantity) >= 1
    );

  const handleOpenAddCustomer = () => {
    setShowAddCustomerModal(true);
  };

  const onCustomerAdded = (newCust: Customer) => {
    setCustomer({
      name: newCust.name,
      phone1: newCust.phone1,
      phone2: newCust.phone2 || '',
      notes: newCust.notes || ''
    });
    setSelectedCustomerId(newCust.id || null);
    setExistingCustomers(prev => [...prev, newCust]);
    setShowAddCustomerModal(false);
  };

  return (
    <div className="w-full pb-32">
      <AddCustomerModal 
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onSuccess={onCustomerAdded}
        customers={existingCustomers}
        user={user}
        initialName={customer.name}
        initialPhone={customer.phone1}
      />
      {/* Error Modal */}
      {errorMsg && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setErrorMsg(null)}></div>
          <div className="relative bg-[#1a1a1a] p-8 w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6 text-center">
             <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={40} />
             </div>
             <div className="space-y-2">
                <h3 className="text-2xl font-black">{t('addInvoice.errorTitle')}</h3>
                <p className="text-gray-400 text-sm">{errorMsg}</p>
             </div>
             <button onClick={() => setErrorMsg(null)} className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl transition-all border border-white/10">
               {t('addInvoice.cancel')}
             </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successInfo && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSuccessInfo(null)}></div>
          <div className="relative bg-[#1a1a1a] p-8 w-full max-w-sm rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6 text-center">
             <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto border-4 border-green-500/20">
                <CheckCircle size={48} className="stroke-[3]" />
             </div>
             <div className="space-y-4">
                <h3 className="text-2xl font-black">تم حفظ الفاتورة بنجاح</h3>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-gray-400 text-sm mb-1">{t('addInvoice.ticketNumber')}</p>
                  <p className="text-5xl font-mono font-black text-orange-500">{successInfo.invoiceNumber}</p>
                </div>
             </div>
             <div className="pt-2">
                <button 
                  onClick={() => setSuccessInfo(null)} 
                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center"
                  title="إغلاق ومتابعة"
                >
                  <X size={24} />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {pendingNewDevices && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 pointer-events-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPendingNewDevices(null)}></div>
          <div className="relative bg-[#1a1a1a] p-6 w-full max-w-sm rounded-[2rem] border border-orange-500/30 font-sans flex flex-col text-right">
             <h3 className="text-xl font-black text-white mb-2">تأكيد الإضافة</h3>
             <p className="text-gray-400 text-sm font-bold mb-4">هذه البيانات غير مسجلة مسبقاً، هل أنت متأكد أنك تريد إضافتها للنظام؟</p>
             
             {pendingNewDevices.categories.length > 0 && (
               <div className="mb-4">
                 <h4 className="text-orange-500 text-xs font-black mb-1">الأنواع الجديدة:</h4>
                 <div className="flex flex-wrap gap-2">
                    {pendingNewDevices.categories.map(c => <span key={c} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-xs text-white">{c}</span>)}
                 </div>
               </div>
             )}

             {pendingNewDevices.models.length > 0 && (
               <div className="mb-4">
                 <h4 className="text-orange-500 text-xs font-black mb-1">الموديلات/الأجهزة الجديدة:</h4>
                 <div className="flex flex-wrap gap-2">
                    {pendingNewDevices.models.map(m => <span key={m} className="bg-white/5 border border-white/10 px-2 py-1 rounded text-xs text-white">{m}</span>)}
                 </div>
               </div>
             )}

             <div className="flex gap-3 mt-2">
               <button onClick={() => { addDeviceToTable(); setPendingNewDevices(null); }} className="flex-1 bg-orange-600 hover:bg-orange-700 font-bold py-3 text-white rounded-xl">نعم، إضافة للجدول</button>
               <button onClick={() => setPendingNewDevices(null)} className="flex-1 bg-white/10 hover:bg-white/20 font-bold py-3 text-white rounded-xl">إلغاء التعديل</button>
             </div>
          </div>
        </div>
      )}

      {showPreview && (
        <PrintPreviewOverlay
          type="invoice"
          data={{
            invoice: {
              invoiceNumber: invoiceNumber,
              createdAt: new Date(),
              customerName: customer.name,
              customerPhone: customer.phone1,
              printCount: 0,
              notes: notes,
              status: 'entry'
            },
            items: items.map(item => ({
              ...item,
              customerProblem: item.faultType,
            })),
            templateType: 'entry'
          }}
          onClose={() => setShowPreview(false)}
          shopConfig={shopConfig}
          user={user}
          onPrint={() => handleSaveFinal('print')}
          onWhatsApp={() => handleSaveFinal('whatsapp')}
          onSave={() => handleSaveFinal('commit')}
          isSaving={loading}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        {/* Unified Header */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 bg-black/20" dir="rtl">
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all">
                <ArrowRight size={18} />
              </button>
            )}
            <h2 className="text-lg font-black text-white flex items-center gap-2 m-0 p-0">
               {t('addInvoice.title')}
               <span className="text-[10px] bg-orange-600/10 text-orange-500 font-bold px-2 py-0.5 rounded border border-orange-500/20">#{invoiceNumber || '...'}</span>
            </h2>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-3xl border border-white/5 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex-1 p-0 space-y-0">
            {/* Unified Form Block */}
            <section className="p-4 md:p-5 space-y-4" dir="rtl">
                
                {/* Customer and Notes Section combined rows */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Customer Section */}
                <div className="col-span-1 lg:col-span-2 space-y-3">
                  <div className="flex flex-row items-center justify-between pb-2 border-b border-white/5 mb-3 gap-2">
                     <h3 className="font-bold text-white text-sm flex items-center gap-2 shrink-0">
                       <User size={16} className="text-orange-500" />
                       تفاصيل العميل
                     </h3>
                     
                     <div className="flex flex-row items-center justify-end gap-3 shrink-0 flex-wrap pointer-events-none opacity-85" title="تتغير العملة تلقائياً حسب عملة حساب العميل">
                      <label className="flex items-center gap-1 cursor-pointer group">
                        <input type="radio" value="USD" checked={currency === 'USD'} onChange={(e) => setCurrency(e.target.value as 'USD' | 'SAR' | 'YER')} className="w-3.5 h-3.5 accent-orange-500 cursor-pointer mb-0.5" />
                        <span className={`text-[10px] font-bold transition-colors ${currency === 'USD' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>دولار </span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer group">
                        <input type="radio" value="SAR" checked={currency === 'SAR'} onChange={(e) => setCurrency(e.target.value as 'USD' | 'SAR' | 'YER')} className="w-3.5 h-3.5 accent-orange-500 cursor-pointer mb-0.5" />
                        <span className={`text-[10px] font-bold transition-colors ${currency === 'SAR' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>سعودي </span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer group">
                        <input type="radio" value="YER" checked={currency === 'YER'} onChange={(e) => setCurrency(e.target.value as 'USD' | 'SAR' | 'YER')} className="w-3.5 h-3.5 accent-orange-500 cursor-pointer mb-0.5" />
                        <span className={`text-[10px] font-bold transition-colors ${currency === 'YER' ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>ريال </span>
                      </label>
                    </div>
                  </div>
                  
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
                        onAddNew={handleOpenAddCustomer}
                        label={t('addInvoice.fullName')}
                        placeholder={t('addInvoice.enterOrSearch')}
                        initialValue={customer.name}
                        type="name"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-between w-24 shrink-0">
                        <label className="text-xs text-gray-500 uppercase font-black tracking-widest text-right">{t('addInvoice.primaryPhone')}</label>
                        <button 
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

                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-500 uppercase font-black tracking-widest w-24 shrink-0 text-right">{t('addInvoice.secondaryPhone')}</label>
                      <input 
                        type="tel" 
                        inputMode="tel"
                        dir="ltr"
                        value={customer.phone2}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9+*#]/g, '');
                          setCustomer({ ...customer, phone2: val });
                        }}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 flex-1 focus:border-orange-500 outline-none text-sm font-mono text-white text-right"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-500 uppercase font-black tracking-widest w-24 shrink-0 text-right flex items-center gap-1">
                        الملاحظات
                      </label>
                      <input 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 flex-1 focus:border-orange-500 outline-none text-white text-sm text-right"
                        placeholder="لا يوجد..."
                      />
                    </div>
                  </div>
                  {customer.notes && selectedCustomerId && (
                    <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 w-full">
                       <p className="text-[10px] text-gray-500 uppercase font-black block text-right">ملاحظات و تفاصيل العميل السابقة</p>
                       <p className="text-sm text-gray-300 font-bold mt-1 text-right">{customer.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Devices Section embedded in the same block */}
              <div className="space-y-4 pt-4 border-t border-white/5">
                 <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <HardDrive size={18} className="text-orange-500" />
                      إضافة جهاز جديد للفاتورة
                    </h3>
                 </div>

                 {/* Adding/Editing Device Form */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-black/20 rounded-2xl border border-white/5 text-right">
                    <div className="relative flex items-center gap-3">
                       <label className="text-xs text-gray-500 uppercase font-black tracking-widest text-right w-20 shrink-0">نوع الجهاز *</label>
                       <div className="relative flex-1">
                         <input 
                           inputMode={keyboardMode.deviceType || 'none'}
                           value={currentDevice.deviceType || ''}
                           onChange={(e) => {
                             setCurrentDevice({ ...currentDevice, deviceType: e.target.value, deviceName: '' });
                             setActiveAutocomplete({ index: 0, type: 'deviceType' });
                           }}
                           onClick={(e) => {
                             setActiveAutocomplete({ index: 0, type: 'deviceType' });
                             if (focusInitiated.current.deviceType) {
                                focusInitiated.current.deviceType = false;
                              } else if (keyboardMode.deviceType !== 'text') {
                               isRefocusing.current.deviceType = true;
                               setKeyboardMode(p => ({...p, deviceType: 'text'}));
                               const target = e.currentTarget;
                               target.blur();
                               setTimeout(() => {
                                 target.focus();
                                 isRefocusing.current.deviceType = false;
                               }, 50);
                             }
                           }}
                           onFocus={(e) => {
                              setActiveAutocomplete({ index: 0, type: 'deviceType' });
                              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              focusInitiated.current.deviceType = true;
                            }}
                           onBlur={() => {
                             if (isRefocusing.current.deviceType) return;
                             setTimeout(() => {
                                setActiveAutocomplete(prev => prev?.type === 'deviceType' ? null : prev);
                                focusInitiated.current.deviceType = false;
                              }, 200);
                             setTimeout(() => setKeyboardMode(p => ({...p, deviceType: 'none'})), 200);
                           }}
                           className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 focus:border-orange-500 outline-none text-sm font-bold text-white text-right"
                           placeholder="اكتب أو ابحث..."
                         />
                         {activeAutocomplete?.type === 'deviceType' && (() => {
                            const currentVal = currentDevice.deviceType || '';
                            const isExact = deviceCategories.some(c => c.name === currentVal);
                            const list = (isExact && currentVal !== '') ? deviceCategories : deviceCategories.filter(cat => cat.name.toLowerCase().includes(currentVal.toLowerCase()));
                            
                            return (
                              <div className="absolute top-[calc(100%+0.25rem)] right-0 w-full bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-40 overflow-y-auto">
                                {list.length > 0 ? list.map(cat => (
                                  <button
                                   key={cat.id}
                                   className="w-full text-right px-4 py-2 hover:bg-white/5 text-xs text-white"
                                   onMouseDown={(e) => {
                                     e.preventDefault();
                                     setCurrentDevice({ ...currentDevice, deviceType: cat.name, deviceName: '' });
                                     setActiveAutocomplete(null);
                                   }}
                                  >
                                     {cat.name}
                                  </button>
                                )) : (
                                  <div className="w-full text-right px-4 py-3 bg-orange-600/10 text-orange-500 font-bold text-[10px] flex items-center gap-2">
                                     <Plus size={14} /> {currentVal ? `النوع "${currentVal}" يضاف كجديد` : 'اكتب نوع جديد لاضافته...'}
                                  </div>
                                )}
                              </div>
                            );
                         })()}
                       </div>
                    </div>

                    <div className="relative flex items-center gap-3">
                       <label className="text-xs text-gray-500 uppercase font-black tracking-widest text-right w-20 shrink-0">اسم الجهاز</label>
                       <div className="relative flex-1">
                         <input 
                           inputMode={keyboardMode.deviceName || 'none'}
                           value={currentDevice.deviceName || ''}
                           onChange={(e) => {
                             setCurrentDevice({ ...currentDevice, deviceName: e.target.value });
                             setActiveAutocomplete({ index: 0, type: 'deviceName' });
                           }}
                           onClick={(e) => {
                             setActiveAutocomplete({ index: 0, type: 'deviceName' });
                             if (focusInitiated.current.deviceName) {
                                focusInitiated.current.deviceName = false;
                              } else if (keyboardMode.deviceName !== 'text') {
                               isRefocusing.current.deviceName = true;
                               setKeyboardMode(p => ({...p, deviceName: 'text'}));
                               const target = e.currentTarget;
                               target.blur();
                               setTimeout(() => {
                                 target.focus();
                                 isRefocusing.current.deviceName = false;
                               }, 50);
                             }
                           }}
                           onFocus={(e) => {
                              setActiveAutocomplete({ index: 0, type: 'deviceName' });
                              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              focusInitiated.current.deviceName = true;
                            }}
                           onBlur={() => {
                             if (isRefocusing.current.deviceName) return;
                             setTimeout(() => {
                                setActiveAutocomplete(prev => prev?.type === 'deviceName' ? null : prev);
                                focusInitiated.current.deviceName = false;
                              }, 200);
                             setTimeout(() => setKeyboardMode(p => ({...p, deviceName: 'none'})), 200);
                           }}
                           className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 focus:border-orange-500 outline-none text-sm text-white text-right"
                           placeholder="ابحث او اكتب..."
                         />
                         {activeAutocomplete?.type === 'deviceName' && (() => {
                            const currentVal = currentDevice.deviceName || '';
                            const availableModels = currentDevice.deviceType ? deviceModels.filter(m => m.categoryName === currentDevice.deviceType || m.categoryId === currentDevice.deviceType.replace(/\//g, '_')) : [];
                            const isExact = availableModels.some(m => m.name === currentVal);
                            const list = (isExact && currentVal !== '') ? availableModels : availableModels.filter(m => m.name.toLowerCase().includes(currentVal.toLowerCase()));
                            
                            return (
                              <div className="absolute top-[calc(100%+0.25rem)] right-0 w-full bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-40 overflow-y-auto">
                                {list.length > 0 ? list.map(model => (
                                  <button
                                   key={model.id}
                                   className="w-full text-right px-4 py-2 hover:bg-white/5 text-xs text-white flex flex-col"
                                   onMouseDown={(e) => {
                                     e.preventDefault();
                                     const updates: Record<string, any> = { deviceName: model.name };
                                     if(model.categoryName && !currentDevice.deviceType) updates.deviceType = model.categoryName;
                                     setCurrentDevice({ ...currentDevice, ...updates });
                                     setActiveAutocomplete(null);
                                   }}
                                  >
                                     <span>{model.name}</span>
                                     {!currentDevice.deviceType && <span className="text-[10px] text-orange-500">{model.categoryName}</span>}
                                  </button>
                                )) : (
                                  <div className="w-full text-right px-4 py-3 bg-orange-600/10 text-orange-500 font-bold text-[10px] flex items-center gap-2">
                                     <Plus size={14} /> {currentVal && currentDevice.deviceType ? `الموديل "${currentVal}" يضاف كجديد` : !currentDevice.deviceType ? 'يرجى اختيار نوع الجهاز أولاً...' : 'اكتب اسم جهاز جديد لاضافته...'}
                                  </div>
                                )}
                              </div>
                            );
                         })()}
                       </div>
                    </div>

                    <div className="flex items-center gap-3">
                       <label className="text-xs text-gray-500 uppercase font-black tracking-widest text-right w-16 shrink-0 lg:w-16">العدد</label>
                       <input 
                         type="text"
                         inputMode="numeric"
                         pattern="[0-9]*"
                         dir="ltr"
                         lang="en"
                         onFocus={(e) => e.target.select()}
                         value={Number.isNaN(Number(currentDevice.quantity)) ? '' : currentDevice.quantity}
                         onChange={(e) => {
                           const val = e.target.value.replace(/[^0-9]/g, '');
                           setCurrentDevice({...currentDevice, quantity: val === '' ? '' : Math.max(1, parseInt(val)) });
                         }}
                         className="w-full bg-black border border-white/10 rounded-xl px-2 py-2 focus:border-orange-500 outline-none text-center font-mono font-black text-white text-sm flex-1"
                       />
                    </div>

                    <div className="flex items-center gap-3 lg:col-span-2">
                       <label className="text-xs text-gray-500 uppercase font-black tracking-widest text-right w-20 shrink-0">شكوى العميل *</label>
                       <input 
                         value={currentDevice.faultType || ''}
                         onChange={(e) => setCurrentDevice({...currentDevice, faultType: e.target.value })}
                         onFocus={(e) => {
                            e.target.select();
                            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                         }}
                         className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 focus:border-orange-500 outline-none text-sm text-white text-right flex-1"
                         placeholder="صيانة..."
                       />
                    </div>

                    <div className="flex items-center gap-3 lg:col-span-3">
                       <label className="text-xs text-gray-500 uppercase font-black tracking-widest text-right w-20 shrink-0">تفاصيل</label>
                       <input 
                         value={currentDevice.deviceNotes || ''}
                         onChange={(e) => setCurrentDevice({...currentDevice, deviceNotes: e.target.value })}
                         onFocus={(e) => {
                            e.target.select();
                            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                         }}
                         className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 focus:border-orange-500 outline-none text-sm text-white text-right flex-1"
                         placeholder="مثال: ريموت كنترول، كابل طاقة، خدوش في الشاشة"
                       />
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-row justify-end gap-3 mt-2 border-t border-white/5 pt-3">
                       <button
                         onClick={() => {
                           setCurrentDevice(initialDeviceState);
                           setEditingIndex(null);
                         }}
                         className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-colors"
                       >
                         إلغاء / تفريغ
                       </button>
                       <button
                         onClick={handlePreAddDeviceToTable}
                         disabled={!currentDevice.deviceType?.trim() || !currentDevice.deviceName?.trim() || !currentDevice.faultType?.trim() || !currentDevice.quantity || currentDevice.quantity < 1}
                         className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${(!currentDevice.deviceType?.trim() || !currentDevice.deviceName?.trim() || !currentDevice.faultType?.trim() || !currentDevice.quantity || currentDevice.quantity < 1) ? 'bg-orange-600/30 text-white/50 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20'}`}
                       >
                         {editingIndex !== null ? 'تعديل' : 'إضافة الجهاز'}
                         {editingIndex !== null ? undefined : <Plus size={14}/>}
                       </button>
                    </div>
                 </div>

                 {/* Temporary Table (Items List) */}
                 {items.length > 0 && (
                   <div className="mt-6 border border-white/10 rounded-2xl overflow-hidden">
                     <div className="bg-orange-600/10 px-4 py-3 text-sm font-bold text-orange-500 border-b border-white/5 flex items-center justify-between">
                       <span>الأجهزة المضافة للجدول ({items.length})</span>
                       
                       {/* Column settings button */}
                       <div className="relative">
                         <button
                           onClick={() => setShowColumnSettings(!showColumnSettings)}
                           className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all border border-white/5 flex items-center justify-center gap-1.5 text-xs font-bold whitespace-nowrap cursor-pointer"
                           title="تخصيص الأعمدة"
                         >
                           <SlidersHorizontal size={14} className={showColumnSettings ? 'text-orange-500' : ''} />
                           <span>تخصيص الأعمدة</span>
                         </button>
                         
                         {showColumnSettings && (
                           <>
                             <div className="fixed inset-0 z-40" onClick={() => setShowColumnSettings(false)} />
                             <div className="absolute left-0 mt-2 w-56 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-xl p-4 z-50 text-right space-y-3 font-sans" dir="rtl">
                               <div className="text-xs font-black text-orange-500 border-b border-white/5 pb-2 mb-2 flex items-center justify-between">
                                 <span>إظهار/إخفاء الأعمدة</span>
                                 <button 
                                   onClick={() => setVisibleColumns({
                                     deviceType: true,
                                     deviceName: true,
                                     quantity: true,
                                     faultType: true,
                                     deviceNotes: true,
                                   })}
                                   className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer font-bold"
                                 >
                                   إعادة تعيين
                                 </button>
                               </div>
                               
                               <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                                 <label className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white cursor-pointer select-none">
                                   <input 
                                     type="checkbox" 
                                     checked={visibleColumns.deviceType} 
                                     onChange={e => setVisibleColumns(prev => ({...prev, deviceType: e.target.checked}))}
                                     className="rounded border-white/10 text-orange-600 focus:ring-orange-500"
                                   />
                                   <span>نوع الجهاز</span>
                                 </label>
                                 <label className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white cursor-pointer select-none">
                                   <input 
                                     type="checkbox" 
                                     checked={visibleColumns.deviceName} 
                                     onChange={e => setVisibleColumns(prev => ({...prev, deviceName: e.target.checked}))}
                                     className="rounded border-white/10 text-orange-600 focus:ring-orange-500"
                                   />
                                   <span>اسم الجهاز</span>
                                 </label>
                                 <label className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white cursor-pointer select-none">
                                   <input 
                                     type="checkbox" 
                                     checked={visibleColumns.quantity} 
                                     onChange={e => setVisibleColumns(prev => ({...prev, quantity: e.target.checked}))}
                                     className="rounded border-white/10 text-orange-600 focus:ring-orange-500"
                                   />
                                   <span>العدد</span>
                                 </label>
                                 <label className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white cursor-pointer select-none">
                                   <input 
                                     type="checkbox" 
                                     checked={visibleColumns.faultType} 
                                     onChange={e => setVisibleColumns(prev => ({...prev, faultType: e.target.checked}))}
                                     className="rounded border-white/10 text-orange-600 focus:ring-orange-500"
                                   />
                                   <span>المشكلة من وجهة نظر العميل</span>
                                 </label>
                                 <label className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white cursor-pointer select-none">
                                   <input 
                                     type="checkbox" 
                                     checked={visibleColumns.deviceNotes} 
                                     onChange={e => setVisibleColumns(prev => ({...prev, deviceNotes: e.target.checked}))}
                                     className="rounded border-white/10 text-orange-600 focus:ring-orange-500"
                                   />
                                   <span>ملاحظات</span>
                                 </label>
                               </div>
                             </div>
                           </>
                         )}
                       </div>
                     </div>
                     <div className="w-full overflow-x-auto">
                        <table className="w-full text-right text-white" dir="rtl">
                          <thead className="bg-black/40 border-b border-white/10">
                            <tr>
                              <th className="py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 w-12 text-center">#</th>
                              {visibleColumns.deviceType && <th className="py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 w-48 text-right">نوع الجهاز</th>}
                              {visibleColumns.deviceName && <th className="py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 w-48 text-right">اسم الجهاز</th>}
                              {visibleColumns.quantity && <th className="py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 w-20 text-center">العدد</th>}
                              {visibleColumns.faultType && <th className="py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 min-w-[200px] text-right">المشكلة من وجهة نظر العميل</th>}
                              {visibleColumns.deviceNotes && <th className="py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 min-w-[200px] text-right">ملاحظات</th>}
                              <th className="py-3 px-4 text-[10px] uppercase tracking-widest text-gray-500 w-24 text-center">اجراء</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {items.map((item, index) => (
                              <tr key={index} className="hover:bg-white/5 transition-colors group bg-black/20">
                                <td className="py-3 px-4 text-sm font-black text-gray-600 text-center">{index + 1}</td>
                                {visibleColumns.deviceType && <td className="py-3 px-4 text-sm font-bold text-white whitespace-nowrap"><div className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 inline-block">{item.deviceType || '-'}</div></td>}
                                {visibleColumns.deviceName && <td className="py-3 px-4 text-sm text-gray-300 whitespace-nowrap"><div className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 inline-block">{item.deviceName || '-'}</div></td>}
                                {visibleColumns.quantity && <td className="py-3 px-4 text-sm font-mono text-white text-center font-bold"><div className="px-2 py-1 bg-white/5 rounded-lg border border-white/5 inline-block w-full">{item.quantity}</div></td>}
                                {visibleColumns.faultType && <td className="py-3 px-4 text-sm text-gray-300 max-w-[200px] whitespace-nowrap"><div className="truncate py-1 inline-block w-full" title={item.faultType}>{item.faultType || '-'}</div></td>}
                                {visibleColumns.deviceNotes && <td className="py-3 px-4 text-sm text-gray-400 max-w-[200px] whitespace-nowrap"><div className="truncate py-1 inline-block w-full" title={item.deviceNotes}>{item.deviceNotes || '-'}</div></td>}
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button 
                                      onClick={() => editItem(index)}
                                      className={`p-2 rounded-xl transition-all ${editingIndex === index ? 'bg-orange-500 text-white' : 'bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white'}`}
                                      title="تعديل هذا الجهاز"
                                    >
                                      <span className="text-xs font-bold">تعديل</span>
                                    </button>
                                    <button 
                                      onClick={() => removeItem(index)}
                                      className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                                      title="حذف هذا الجهاز"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                     </div>
                   </div>
                 )}
              </div>

               {/* Action Bar */}
               <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3" dir="rtl">
                   <div className="flex items-center gap-3">
                      <div className="bg-white/5 text-gray-400 font-bold px-3 py-2 rounded-xl text-xs font-mono border border-white/10 shrink-0">
                        {Array.from(new Set(items.map(i => i.deviceType).filter(Boolean))).length} نوع
                      </div>
                      <div className="bg-white/5 text-gray-400 font-bold px-3 py-2 rounded-xl text-xs font-mono border border-white/10 shrink-0">
                        {items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} جهاز
                      </div>
                      <button 
                        onClick={handlePreviewInit}
                        disabled={!canSave || loading || items.length === 0}
                        className="px-8 py-3 rounded-xl font-black text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Save size={16} />
                        <span>عرض الفاتورة للمراجعة</span>
                      </button>
                   </div>
               </div>
          </section>
        </div>

      </div>
    </div>
    </div>
  );
}
