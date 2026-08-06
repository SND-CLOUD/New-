import { CustomerAutocomplete } from '../CustomerAutocomplete';
import { parseDate } from '../../lib/dateUtils';
import { useState, useEffect } from 'react';
import { sharePdfFile, openWhatsApp } from '../../lib/shareHelper';
import { collection, onSnapshot, doc, writeBatch, serverTimestamp, getDoc } from '../../firebase';
import { db } from '../../firebase';
import { Invoice, InvoiceItem, User, Customer } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from 'react-i18next';
import { Search, ArrowLeft, ArrowUpRight, ArrowRight, Search as SearchIcon, User as UserIcon, ArrowDownCircle, Wrench, Plus, Save, Loader2, Info, X, Printer, MessageCircle, MapPin, Facebook, Phone, Smartphone, Edit2, Trash2 } from 'lucide-react';
import BankAccountsFooter from '../BankAccountsFooter';
import PrintPreviewOverlay from '../PrintPreviewOverlay';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { sanitizeDocumentStyles, sanitizeElementInlineStyles, cleanOklchInStyleText } from '../../lib/html2canvasHelper';
import { localDb } from '../../lib/local-db';

export default function Maintenance({ user, onBack, initialInvoice }: { user: User, onBack: () => void, initialInvoice?: Invoice | null }) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions(user, 'inventory');

  if (!hasPermission('view')) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
          <Wrench size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">عذراً، ليس لديك صلاحية الوصول</h2>
        <p className="text-gray-400 max-w-md">يرجى التواصل مع المسؤول للحصول على الصلاحيات اللازمة للوصول لقسم الصيانة.</p>
        <button 
          onClick={onBack} 
          className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5"
          title="العودة للرئيسية"
        >
          <ArrowRight size={20} />
        </button>
      </div>
    );
  }
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [engineersList, setEngineersList] = useState<string[]>([]);
  
  // Selection
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  
  // Form State
  const [engineerName, setEngineerName] = useState('');
  const [actionItems, setActionItems] = useState<{ id: string, count: number, outcome: 'repaired'|'failed'|'refused', reason: string }[]>([]);
  const [currentFormRow, setCurrentFormRow] = useState<{ id: string, count: number, outcome: 'repaired'|'failed'|'refused', reason: string }>({ id: '', count: 1, outcome: 'repaired', reason: 'جاهز' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [shopConfig, setShopConfig] = useState<any>(null);
  const [currentOutput, setCurrentOutput] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (initialInvoice && items.length > 0 && !selectedInvoice) {
      const MAINTENANCE_ELIGIBLE_STATUSES = ['40', 'repairing'];
      const avItems = items.filter(i => i.invoiceNumber === initialInvoice.invoiceNumber && MAINTENANCE_ELIGIBLE_STATUSES.includes(i.status));
      
      if (avItems.length > 0) {
        setActionItems([{ id: avItems[0].id!, count: 1, outcome: 'repaired', reason: 'جاهز' }]);
      }
      setSelectedInvoice(initialInvoice);
    }
  }, [initialInvoice, items, selectedInvoice]);

  useEffect(() => {
    const loadShopConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'company_details', 'main_details'));
        if (docSnap.exists()) {
          setShopConfig(docSnap.data());
          return;
        }
        const localRes = await localDb.query("SELECT * FROM company_details LIMIT 1");
        if (localRes.values && localRes.values.length > 0) {
          setShopConfig(localRes.values[0]);
        }
      } catch (err) {
        console.error("Error loading shop config:", err);
      }
    };
    loadShopConfig();

    const unsubShopSettings = onSnapshot(doc(db, 'company_details', 'main_details'), (docSnap) => {
      if (docSnap.exists()) {
        setShopConfig(docSnap.data());
      }
    });

    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (s) => setInvoices(s.docs.map(d => ({ id: d.id, ...d.data() } as Invoice))));
    const unsubItems = onSnapshot(collection(db, 'invoice_items'), (s) => setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as InvoiceItem))));
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (s) => setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() } as Customer))));
    const unsubEngineers = onSnapshot(collection(db, 'engineers'), (s) => setEngineersList(s.docs.map(d => d.data().name).filter(Boolean)));
    return () => { unsubInvoices(); unsubItems(); unsubCustomers(); unsubEngineers(); unsubShopSettings(); };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const getCustomerNumber = (customerId: string) => {
    const c = customers.find(c => c.id === customerId);
    return c ? c.customerNumber : '---';
  };

  const getCustomerName = (customerId: string) => {
    const c = customers.find(c => c.id === customerId);
    return c ? (c.name || c.companyName) : '---';
  };

  const getCustomerPhone = (customerId: string) => {
    const c = customers.find(c => c.id === customerId);
    return c ? (c.phone1 || c.phone2 || '') : '';
  };

  const getCustomerCompany = (customerId: string) => {
    const c = customers.find(c => c.id === customerId);
    return c ? (c.companyName || '---') : '---';
  };

  const MAINTENANCE_ELIGIBLE_STATUSES = ['40', 'repairing'];

  const pendingInvoices = invoices.filter(inv => {
    return items.some(item => item.invoiceNumber === inv.invoiceNumber && MAINTENANCE_ELIGIBLE_STATUSES.includes(item.status) && item.quantity > 0);
  }).filter(inv => 
    inv.customerName.toLowerCase().includes(search.toLowerCase()) || 
    inv.invoiceNumber.includes(search)
  ).sort((a, b) => Number(b.invoiceNumber) - Number(a.invoiceNumber));

  const totalPages = Math.max(1, Math.ceil(pendingInvoices.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentInvoices = pendingInvoices.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  const pendingInvoicesTotalValue = pendingInvoices.reduce((acc, inv) => acc + (Number(inv.totalCost) || 0), 0);
  const totalInspectedDevices = items.filter(i => MAINTENANCE_ELIGIBLE_STATUSES.includes(i.status)).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const getInspectedCount = (invoiceNumber: string) => {
    return items.filter(i => i.invoiceNumber === invoiceNumber && MAINTENANCE_ELIGIBLE_STATUSES.includes(i.status) && i.quantity > 0).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  };

  const openInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const avItems = items.filter(i => i.invoiceNumber === invoice.invoiceNumber && MAINTENANCE_ELIGIBLE_STATUSES.includes(i.status));
    
    setInvoiceItems(avItems);
    const existingTech = avItems.find(i => i.technician)?.technician || "";
    setEngineerName(existingTech || user?.name || "");
    
    if (avItems.length > 0) {
      const firstId = avItems[0].id!;
      const availCount = avItems[0].quantity || 1;
      setCurrentFormRow({ id: firstId, count: availCount, outcome: 'repaired', reason: 'جاهز' });
      setActionItems([]);
    }
  };

  const getAvailableQuantity = (itemId: string, excludeIndex: number) => {
    const originalItem = invoiceItems.find(i => i.id === itemId);
    if (!originalItem) return 0;
    
    let usedQuantity = actionItems.reduce((acc, row, idx) => {
      if (idx !== excludeIndex && row.id === itemId) return acc + row.count;
      return acc;
    }, 0);
    
    if (excludeIndex === -1 && currentFormRow.id === itemId) {
      // Form edit logic
    }

    return originalItem.quantity - usedQuantity;
  };

  const handleUpdateCurrentForm = (field: string, value: any) => {
    const row = { ...currentFormRow, [field]: value };
    if (field === 'id') {
      const maxAllowed = getAvailableQuantity(value, editingIndex !== null ? editingIndex : -1);
      row.count = maxAllowed > 0 ? maxAllowed : 1;
    }
    if (field === 'outcome') {
      if (value === 'repaired') row.reason = 'جاهز';
      else if (value === 'failed') row.reason = 'لا يصلح';
      else if (value === 'refused') row.reason = 'لم يوافق العميل';
    }
    setCurrentFormRow(row);
  };

  const handleApplyFormToTable = () => {
    const qty = Number(currentFormRow.count);
    if (!currentFormRow.id || isNaN(qty) || qty < 1) return;
    const maxAllowed = getAvailableQuantity(currentFormRow.id, editingIndex !== null ? editingIndex : -1);
    if (qty > maxAllowed) return;

    const rowToSave = { ...currentFormRow, count: qty };

    if (editingIndex !== null) {
      const newItems = [...actionItems];
      newItems[editingIndex] = rowToSave;
      setActionItems(newItems);
      setEditingIndex(null);
    } else {
      setActionItems([...actionItems, rowToSave]);
    }
    
    const newActionItems = editingIndex !== null 
        ? actionItems.map((r, i) => i === editingIndex ? rowToSave : r)
        : [...actionItems, rowToSave];
        
    const availableItem = invoiceItems.find(it => {
        const used = newActionItems.reduce((acc, row) => row.id === it.id ? acc + row.count : acc, 0);
        return it.quantity - used > 0;
    });

    if (availableItem) {
        const used = newActionItems.reduce((acc, row) => row.id === availableItem.id ? acc + row.count : acc, 0);
        const availCount = availableItem.quantity - used;
        setCurrentFormRow({ id: availableItem.id!, count: availCount > 0 ? availCount : 1, outcome: 'repaired', reason: 'جاهز' });
    } else {
        setCurrentFormRow({ id: '', count: 1, outcome: 'repaired', reason: 'جاهز' });
    }
  };

  const handleCancelForm = () => {
      setEditingIndex(null);
      const availableItem = invoiceItems.find(it => getAvailableQuantity(it.id!, -1) > 0);
      if (availableItem) {
        const availCount = getAvailableQuantity(availableItem.id!, -1);
        setCurrentFormRow({ id: availableItem.id!, count: availCount > 0 ? availCount : 1, outcome: 'repaired', reason: 'جاهز' });
      } else {
        setCurrentFormRow({ id: '', count: 1, outcome: 'repaired', reason: 'جاهز' });
      }
  };

  const handleEditTableRow = (index: number) => {
      const target = actionItems[index];
      setCurrentFormRow(target);
      setEditingIndex(index);
  };

  const handleRemoveFormRow = (index: number) => {
      const updated = actionItems.filter((_, i) => i !== index);
      setActionItems(updated);
      if (editingIndex === index) {
          setEditingIndex(null);
          const availableItem = invoiceItems.find(it => {
            const used = updated.reduce((acc, r) => r.id === it.id ? acc + r.count : acc, 0);
            return it.quantity - used > 0;
          });
          if (availableItem) {
            const used = updated.reduce((acc, r) => r.id === availableItem.id ? acc + r.count : acc, 0);
            const availCount = availableItem.quantity - used;
            setCurrentFormRow({ id: availableItem.id!, count: availCount > 0 ? availCount : 1, outcome: 'repaired', reason: 'جاهز' });
          } else {
            setCurrentFormRow({ id: '', count: 1, outcome: 'repaired', reason: 'جاهز' });
          }
      } else {
          if (editingIndex === null && currentFormRow.id) {
            const used = updated.reduce((acc, r) => r.id === currentFormRow.id ? acc + r.count : acc, 0);
            const originalItem = invoiceItems.find(it => it.id === currentFormRow.id);
            if (originalItem) {
              const availCount = originalItem.quantity - used;
              setCurrentFormRow(prev => ({ ...prev, count: availCount > 0 ? availCount : 1 }));
            }
          }
      }
  };

  const [loading, setLoading] = useState(false);

  const handlePreviewInit = () => {
    setShowPreview(true);
  };

  const handleSaveFinal = async (action: 'commit' | 'print' | 'whatsapp') => {
    if (!selectedInvoice || actionItems.length === 0 || !engineerName) return;
    setLoading(true);
    let actionRecordDate = new Date().getTime();
    try {
      const batch = writeBatch(db);
      
      let deductedCost = 0;

      // Calculate remaining quantites properly for multiple splits of the same id
      const itemRemaining = new Map<string, number>();
      for (const row of actionItems) {
        if (!row.id || Number(row.count) <= 0) continue;
        const oItem = invoiceItems.find(i => i.id === row.id);
        if (!oItem) continue;
        if (!itemRemaining.has(oItem.id!)) {
           itemRemaining.set(oItem.id!, Number(oItem.quantity) || 0);
        }
      }

      for (const row of actionItems) {
        if (!row.id || Number(row.count) <= 0) continue;
        const originalItem = invoiceItems.find(i => i.id === row.id);
        if (!originalItem) continue;

        const updatedStatus = '50';
        const isFailedOrRefused = row.outcome === 'failed' || row.outcome === 'refused';
        const rowCount = Number(row.count) || 1;
        const subStatus = row.outcome === 'failed' ? 'unrepairable' : row.outcome === 'refused' ? 'refused' : 'ready';
        
        let rem = itemRemaining.get(originalItem.id!) || 0;
        
        let unitCost = originalItem.quantity > 0 ? (Number(originalItem.cost || 0) / originalItem.quantity) : 0;
        let splitItemCost = unitCost * rowCount;
        // Keep the cost field intact so accounts can calculate full list, whilst Customer filters on failure statuses.
        let deductedCostVal = 0; // do not deduct from base invoice

        if (rem > rowCount) {
          // split
          const splitItemRef = doc(collection(db, 'invoice_items'));
          batch.set(splitItemRef, {
            ...originalItem,
            id: splitItemRef.id,
            quantity: rowCount,
            status: updatedStatus,
            subStatus,
            source: 'maintenance',
            cost: splitItemCost,
            failureReason: isFailedOrRefused ? row.reason : null,
            engineerReport: originalItem.engineerReport,
            technician: engineerName,
            updatedAt: serverTimestamp()
          });
          
          rem -= rowCount;
          itemRemaining.set(originalItem.id!, rem);
          
          batch.update(doc(db, 'invoice_items', originalItem.id!), {
            quantity: rem,
            cost: (unitCost * rem),
            updatedAt: serverTimestamp()
          });
        } else {
          // update fully
          batch.update(doc(db, 'invoice_items', originalItem.id!), {
            status: updatedStatus,
            subStatus,
            source: 'maintenance',
            quantity: rem,
            cost: splitItemCost,
            failureReason: isFailedOrRefused ? row.reason : null,
            engineerReport: originalItem.engineerReport,
            technician: engineerName,
            updatedAt: serverTimestamp()
          });
          itemRemaining.set(originalItem.id!, 0);
        }
      }
      
      // Calculate final statuses of all items in this invoice
      const finalItemStatuses: string[] = [];
      for (const row of actionItems) {
        if (!row.id || Number(row.count) <= 0) continue;
        const originalItem = invoiceItems.find(i => i.id === row.id);
        if (!originalItem) continue;
        const updatedStatus = '50';
        finalItemStatuses.push(updatedStatus);
      }
      
      const processedItemIds = new Set(actionItems.map(row => row.id));
      const unmodifiedItems = items.filter(it => it.invoiceNumber === selectedInvoice.invoiceNumber && !processedItemIds.has(it.id!));
      unmodifiedItems.forEach(it => {
        finalItemStatuses.push(it.status);
      });

      // Determine overall invoice status
      let finalInvoiceStatus = '50';
      if (finalItemStatuses.some(s => s === '70' || s === 'cancelled')) {
        finalInvoiceStatus = '70';
      } else if (finalItemStatuses.some(s => s === '10' || s === 'new')) {
        finalInvoiceStatus = '10';
      } else if (finalItemStatuses.some(s => s === '20')) {
        finalInvoiceStatus = '20';
      } else if (finalItemStatuses.some(s => s === '30' || s === '35' || s === 'awaiting_approval' || s === 'awaiting_parts')) {
        finalInvoiceStatus = '30';
      } else if (finalItemStatuses.some(s => s === '40' || s === 'repairing')) {
        finalInvoiceStatus = '40';
      }

      batch.update(doc(db, 'invoices', selectedInvoice.id!), {
        status: finalInvoiceStatus,
        totalCost: Math.max(0, (selectedInvoice.totalCost || 0) - deductedCost),
        updatedAt: serverTimestamp()
      });

      // Record maintenance action
      const actionRef = doc(collection(db, 'maintenance_actions'));
      batch.set(actionRef, {
        engineerName,
        actionDate: actionRecordDate,
        type: 'maintenance',
        updates: actionItems.map(r => ({
          itemId: r.id,
          count: r.count,
          outcome: r.outcome,
          reason: r.reason
        })),
        userId: user.id || 'unknown',
        userName: user.name || 'System',
        createdAt: serverTimestamp()
      });

      const sanitizedEngName = engineerName.trim().replace(/[\/]/g, '_');
      const engineerRef = doc(db, 'engineers', sanitizedEngName);
      batch.set(engineerRef, { name: engineerName.trim(), updatedAt: serverTimestamp() }, { merge: true });

      await batch.commit();

      await new Promise(resolve => setTimeout(resolve, 0));

      if (action === 'print' || action === 'whatsapp') {
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
              const originalTransform = element.style.transform;
              element.style.transform = 'none';
              
              const canvas = await htmlToImage.toCanvas(element, {
                pixelRatio: 2,
                backgroundColor: '#ffffff',
              });

              // Restore transform
              element.style.transform = originalTransform;

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
              const filename = `تقرير الصيانة_${selectedInvoice.customerName}_${formattedDate}.pdf`;
              pdf.save(filename);

              let message = `*تقرير إجراء صيانة* 📄\n\n`;
              message += `إلى من يهمه الأمر، مرفق لكم تقرير تحديث حالة الأجهزة:\n\n`;
              message += `*الأجهزة المحدثة (فاتورة: ${selectedInvoice.invoiceNumber}):*\n`;
              actionItems.forEach((item, index) => {
                const dbItem = invoiceItems.find(i => i.id === item.id);
                message += `\n_${index + 1}. *${dbItem?.deviceType || '-'}*_\n`;
                if (item.outcome === 'repaired') {
                  message += `   • الحالة الجديدة: تم الإصلاح\n`;
                } else if (item.outcome === 'failed') {
                  message += `   • الحالة الجديدة: لم يتم الإصلاح\n`;
                } else if (item.outcome === 'refused') {
                  message += `   • الحالة الجديدة: لم يوافق العميل\n`;
                }
              });

              let sharedNatively = false;
              try {
                const pdfBlob = pdf.output('blob');
                sharedNatively = await sharePdfFile(pdfBlob, filename, message, 'report');
              } catch (err) {
                console.warn('Native sharing failed:', err);
              }
              if (!sharedNatively) {
                const targetPhone = selectedInvoice.customerPhone || getCustomerPhone(selectedInvoice.customerId);
                openWhatsApp(message, targetPhone);
              }
            } catch (err) {
              console.error('Failed to generate or share PDF', err);
            }
          }
        }
      }

      setShowPreview(false);
      setSelectedInvoice(null);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (selectedInvoice) {
    if (showPreview) {
      return (
        <PrintPreviewOverlay
          type="invoice"
          data={{
            invoice: selectedInvoice,
            items: actionItems.map((item) => {
              const dbItem = invoiceItems.find(i => i.id === item.id);
              return {
                ...dbItem,
                deviceType: dbItem?.deviceType || '-',
                deviceName: dbItem?.deviceName || '-',
                customerProblem: dbItem?.customerProblem || '-',
                technicalNotes: item.reason || dbItem?.engineerReport || '-',
                status: item.outcome === 'repaired' ? '50' : item.outcome === 'failed' ? '55' : item.outcome === 'refused' ? '70' : '40',
                quantity: item.count
              };
            }),
            templateType: 'maintenance'
          }}
          onClose={() => setShowPreview(false)}
          shopConfig={shopConfig}
          user={user}
          onPrint={() => handleSaveFinal('print')}
          onWhatsApp={() => handleSaveFinal('whatsapp')}
          onSave={() => handleSaveFinal('commit')}
          isSaving={loading}
        />
      );
    }

    if (false && showPreview) {
      return (
        <div className="fixed inset-0 z-[120] bg-black/95 flex flex-col pointer-events-auto" dir="rtl">
          {/* Top Actions Bar */}
          <div className="flex justify-between items-center bg-black/50 p-4 border-b border-white/10 shrink-0 flex-wrap gap-4 print:hidden">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(false)}
                className="p-2.5 bg-slate-200 border border-slate-300 rounded-xl text-slate-900 hover:bg-slate-300 transition-all flex items-center shadow-md"
                title="العودة للتعديل"
              >
                <ArrowRight size={20} />
              </button>
              <h2 className="text-white font-bold hidden sm:block">معاينة إجراء صيانة</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveFinal('commit')}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(5,150,105,0.3)]"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                حفظ وترحيل
              </button>
              <button
                onClick={() => handleSaveFinal('print')}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Printer size={16} />
                حفظ وطباعة مباشرة
              </button>
              <button
                onClick={() => handleSaveFinal('whatsapp')}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(5,150,105,0.3)] disabled:opacity-50"
              >
                <MessageCircle size={16} />
                حفظ وتصدير للواتس
              </button>
            </div>
          </div>

          {/* Printable A4 Container */}
          <div className="flex-1 overflow-x-auto bg-black p-4 md:p-8 pb-24 text-right w-full">
            <div id="print-action-area" className="p-8 bg-white text-gray-900 print:p-0 print:bg-white print:text-black w-[794px] min-h-fit mx-auto flex flex-col relative shrink-0 font-cairo text-right" dir="rtl">
              {/* Header Layout */}
              <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4 mb-4">
                {/* Right Corner: Shop Name */}
                <div className="text-right flex-1 pt-1">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight font-cairo whitespace-nowrap">{shopConfig?.shopName || 'عالم الصيانة والتجارة'}</h2>
                  <div className="text-sm font-black text-gray-900 tracking-tight leading-tight mt-1.5 font-cairo">قسم الصيانة</div>
                  <div className="mt-2 space-y-1">
                    {(shopConfig?.phone1 || shopConfig?.phone2) && (
                      <div className="text-[10px] font-bold text-gray-800 flex items-center justify-start gap-1.5 w-fit">
                        <span>تلفون :</span>
                        <span dir="ltr" className="font-mono">
                          {shopConfig?.phone1}
                          {shopConfig?.phone1 && shopConfig?.phone2 && ' - '}
                          {shopConfig?.phone2}
                        </span>
                        <div className="flex items-center gap-1 mr-1.5">
                          <Smartphone size={10} className="text-gray-700" />
                          {(shopConfig?.phone1Whatsapp || shopConfig?.phone2Whatsapp) && (
                            <MessageCircle size={10} className="text-green-600" />
                          )}
                        </div>
                      </div>
                    )}
                    {shopConfig?.landline && (
                      <div className="text-[10px] font-bold text-gray-800 flex items-center justify-start gap-1.5 w-fit">
                        <span>ثابت :</span>
                        <span dir="ltr" className="font-mono">{shopConfig.landline}</span>
                        <div className="flex items-center gap-1 mr-1.5">
                          <Phone size={10} className="text-gray-700" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Center: Title / Logo */}
                <div className="text-center flex-[1.2] flex flex-col items-center justify-center">
                  {shopConfig?.logoUrl ? (
                    <img 
                      src={shopConfig.logoUrl} 
                      alt="Logo" 
                      className="h-16 max-w-[150px] object-contain mb-1.5" 
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-12 h-12 border border-dashed border-gray-300 rounded-xl mb-1.5 flex items-center justify-center text-gray-400 text-[10px] font-bold">شعار المحل</div>
                  )}
                  <h1 className="text-lg font-black text-gray-900 tracking-tight border-2 border-gray-900 px-4 py-1.5 rounded-lg inline-block bg-gray-50/50">تقرير صيانة</h1>
                </div>

                {/* Left Corner: Action Info */}
                <div className="text-left flex-1 space-y-1 pt-1 bg-gray-50/50 p-3 rounded-lg border border-gray-200">
                  <div className="text-sm font-bold text-gray-700 flex justify-between gap-4">
                    <span>رقم تقرير الصيانة:</span>
                    <span className="font-mono text-gray-900">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="text-sm font-bold text-gray-700 flex justify-between gap-4">
                    <span>تاريخ الصدور:</span>
                    <span className="font-mono text-gray-900 text-xs">
                      {selectedInvoice.createdAt ? (function(){
                        const d = parseDate(selectedInvoice.createdAt);
                        return !d ? '---' : d.toISOString().slice(0,10).replace(/-/g, '/');
                      })() : new Date().toISOString().slice(0,10).replace(/-/g, '/')}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-700 flex justify-between gap-4">
                    <span>وقت الإصدار:</span>
                    <span className="font-mono text-gray-900">
                      {selectedInvoice.createdAt ? (function(){ 
                        const d = parseDate(selectedInvoice.createdAt); 
                        return !d ? '---' : d.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' }); 
                      })() : new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-700 flex justify-between gap-4 border-t border-gray-200 pt-1 mt-1 font-cairo">
                    <span>رقم المستخدم:</span>
                    <span className="font-mono text-gray-900">{user?.userNumber || '100'}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info Single Line (Standard style) */}
              <div className="bg-gray-100 p-3 rounded-lg mb-4 border border-gray-300 flex flex-row items-center justify-start gap-6 px-6 text-sm font-black text-gray-900 whitespace-nowrap">
                <div className="flex items-center">
                  <span className="text-xs text-gray-600 ml-2 whitespace-nowrap">اسم العميل:</span>
                  <span className="text-gray-900 font-black">{selectedInvoice.customerName}</span>
                </div>
                {getCustomerCompany(selectedInvoice.customerId) && getCustomerCompany(selectedInvoice.customerId) !== '---' && (
                  <div className="border-r border-gray-300 pr-6 flex items-center">
                    <span className="text-xs text-gray-600 ml-2 whitespace-nowrap">الجهة:</span>
                    <span className="text-gray-900 font-black">{getCustomerCompany(selectedInvoice.customerId)}</span>
                  </div>
                )}
                {getCustomerPhone(selectedInvoice.customerId) && getCustomerPhone(selectedInvoice.customerId) !== '---' && (
                  <div className="border-r border-gray-300 pr-6 flex items-center">
                    <span className="text-xs text-gray-600 ml-2 whitespace-nowrap">الجوال:</span>
                    <span className="font-mono text-gray-900" dir="ltr">{getCustomerPhone(selectedInvoice.customerId)}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full text-center border-2 border-black mb-2">
                <thead className="bg-gray-100 text-black border-b-2 border-black">
                  <tr>
                    <th className="py-2 px-3 border border-black text-sm font-black w-12 text-center">م</th>
                    <th className="py-2 px-3 border border-black text-sm font-black text-right">النوع / الجهاز</th>
                    <th className="py-2 px-3 border border-black text-sm font-black text-right">شكوى العميل</th>
                    <th className="py-2 px-3 border border-black text-sm font-black text-right">تقرير الفحص</th>
                    <th className="py-2 px-3 border border-black text-sm font-black text-right">حالة الجهاز</th>
                    <th className="py-2 px-3 border border-black text-sm font-black text-right">التفاصيل</th>
                    <th className="py-2 px-3 border border-black text-sm font-black text-center">الكمية</th>
                  </tr>
                </thead>
                <tbody className="text-black font-bold">
                  {actionItems.map((item, index) => {
                    const dbItem = invoiceItems.find(i => i.id === item.id);
                    return (
                      <tr key={index} className="border-b border-black">
                        <td className="py-3 px-3 border-l border-black text-xs">{index + 1}</td>
                        <td className="py-3 px-3 border-l border-black text-right text-sm font-black whitespace-nowrap">
                          {dbItem?.deviceType || '-'} - {dbItem?.deviceName || '-'}
                        </td>
                        <td className="py-3 px-3 border-l border-black text-right text-xs text-gray-700 min-w-[120px]">{dbItem?.customerProblem || '-'}</td>
                        <td className="py-3 px-3 border-l border-black text-right text-xs text-gray-700 min-w-[120px]">
                          {(() => {
                            const val = dbItem?.engineerReport || '';
                            const splitIdx = val.indexOf(' | ');
                            if (splitIdx !== -1) {
                              return (
                                <div className="flex flex-col gap-0.5">
                                  <span>{val.substring(0, splitIdx).trim()}</span>
                                  <span className="text-[10px] text-purple-600 font-black">النتيجة: {val.substring(splitIdx + 3).trim()}</span>
                                </div>
                              );
                            }
                            return val || '-';
                          })()}
                        </td>
                        <td className={`py-3 px-3 border-l border-black text-sm text-right font-black whitespace-nowrap ${
                          item.outcome === 'repaired' ? 'text-emerald-600' :
                          item.outcome === 'failed' ? 'text-rose-600' :
                          'text-orange-600'
                        }`}>
                          {item.outcome === 'repaired' ? 'تم الإصلاح' : item.outcome === 'failed' ? 'لم يتم الإصلاح' : 'لم يوافق العميل'}
                        </td>
                        <td className="py-3 px-3 border-l border-black text-xs text-right text-gray-700 max-w-[150px]">{item.reason || '-'}</td>
                        <td className="py-3 px-3 text-sm font-bold text-center">{item.count}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-gray-200/60 font-bold border-t-2 border-black">
                    <td colSpan={6} className="px-3 py-4 text-left font-black border-l border-black text-base">الإجمالي</td>
                    <td className="px-3 py-4 text-center font-mono font-black text-lg">
                      {actionItems.reduce((sum, item) => sum + Number(item.count || 1), 0)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Summary Maintenance Status */}
              {(() => {
                const counters = [
                  {
                    key: 'repaired',
                    label: 'جاهز',
                    value: actionItems.filter(i => i.outcome === 'repaired').reduce((sum, i) => sum + Number(i.count || 1), 0),
                    textColor: 'text-emerald-600',
                  },
                  {
                    key: 'failed',
                    label: 'لايصلح',
                    value: actionItems.filter(i => i.outcome === 'failed').reduce((sum, i) => sum + Number(i.count || 1), 0),
                    textColor: 'text-rose-600',
                  },
                  {
                    key: 'refused',
                    label: 'لم يوافق العميل',
                    value: actionItems.filter(i => i.outcome === 'refused').reduce((sum, i) => sum + Number(i.count || 1), 0),
                    textColor: 'text-orange-600',
                  }
                ];

                const activeCounters = counters.filter(c => c.value > 0);
                if (activeCounters.length === 0) return null;

                return (
                  <div className="flex items-center gap-4 mb-2 text-sm font-bold text-gray-900 mt-2 flex-wrap">
                    {activeCounters.map((counter, index) => (
                      <span key={counter.key} className="flex items-center gap-4">
                        {index > 0 && <span className="text-gray-400 font-normal">|</span>}
                        <div className="flex items-center gap-2">
                          <div className={`w-12 h-8 border-2 border-gray-400 bg-gray-50 rounded flex items-center justify-center font-mono font-black text-base ${counter.textColor}`}>
                            {counter.value}
                          </div>
                          <span>{counter.label}</span>
                        </div>
                      </span>
                    ))}
                  </div>
                );
              })()}

              <div className="mt-2">
                <div className="border-t border-black/20 my-2"></div>

                {/* Footer Notes & Signatures - New Layout */}
                <div className="flex justify-between items-start text-xs font-bold text-gray-900 leading-loose mb-2 px-4">
                  {/* Right Side */}
                  <div className="text-right space-y-1">
                      <p>المسؤول المباشر / المشرف</p>
                      <p className="pt-2 font-black">التوقيع / ........................................</p>
                  </div>

                  {/* Left Side */}
                  <div className="text-left space-y-1">
                      <p className="pt-4">اسم المهندس المختص /.............. التوقيع /.............</p>
                  </div>
                </div>

                <div className="border-t-[3px] border-black mt-1 mb-1 border-solid"></div>
                
                {/* Address and Facebook */}
                <div className="flex flex-row items-center justify-between text-[10px] font-bold text-black font-cairo py-1 mt-0">
                  {shopConfig?.address && (
                    <div className="flex items-center gap-1.5 justify-center flex-row-reverse text-center w-max">
                        <MapPin size={12} className="text-gray-600" />
                        <span>{shopConfig.address}</span>
                    </div>
                  )}

                  {shopConfig?.facebookUrl && (
                    <div className="flex items-center gap-1.5 justify-center flex-row-reverse text-center w-max">
                        <Facebook size={12} className="text-blue-600" />
                        <span dir="ltr">{shopConfig.facebookUrl}</span>
                    </div>
                  )}
                </div>

                <BankAccountsFooter shopConfig={shopConfig} currentOutput={currentOutput || { output_datetime: new Date() }} />
              </div>

            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-full overflow-x-hidden space-y-0 pb-32 md:pb-8" dir="rtl">
        {/* Unified Header */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 bg-[#0a0a0a]/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedInvoice(null)} className="p-1.5 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/20 rounded-xl transition-all shadow-md">
              <ArrowRight size={18} />
            </button>
            <h1 className="text-base font-black text-white m-0 p-0 flex items-center gap-2">
              <Wrench size={16} className="text-orange-500" />
              صيانة - #{selectedInvoice.invoiceNumber}
            </h1>
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-4 border-b border-white/5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -translate-y-10 -translate-x-10"></div>
          
          <div className="flex items-center gap-3 relative z-10">
             <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                <Wrench size={20} />
             </div>
             <div>
               <h3 className="text-lg font-bold">{selectedInvoice.customerName}</h3>
             </div>
          </div>

          <div className="pt-3 border-t border-white/5 relative z-10">
            <div className="flex flex-row items-center gap-3 w-full">
              <label className="text-xs text-gray-400 font-bold whitespace-nowrap w-24 shrink-0">اسم المهندس</label>
              <input 
                type="text" 
                value={engineerName}
                list="engineers-list"
                onChange={e => setEngineerName(e.target.value)}
                onFocus={(e) => {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:border-orange-500 outline-none transition-all text-xs text-right text-white box-border"
              />
              <datalist id="engineers-list">
                {engineersList.map((eng, idx) => (
                  <option key={idx} value={eng} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-0 sm:px-4 py-3">

          {/* Form input section */}
          <div className="bg-[#1a1a1a] p-4 sm:p-5 border-y sm:border border-white/5 rounded-none sm:rounded-2xl relative shadow-md">
             <div className="flex flex-col gap-3">
               {/* الجهاز */}
               <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
                 <label className="text-xs text-gray-400 font-bold whitespace-nowrap sm:w-24 sm:shrink-0">الجهاز</label>
                 <select 
                   value={currentFormRow.id}
                   onChange={e => handleUpdateCurrentForm('id', e.target.value)}
                   className="w-full sm:flex-1 bg-black/40 border border-white/10 px-3 py-2 focus:border-orange-500 outline-none transition-all rounded-lg text-xs text-right text-white box-border"
                 >
                   <option value="" disabled>اختر الجهاز</option>
                   {invoiceItems.map(it => {
                     const available = getAvailableQuantity(it.id!, editingIndex !== null ? editingIndex : -1);
                     if (available <= 0 && currentFormRow.id !== it.id) return null;
                     return <option key={it.id} value={it.id}>{it.deviceType} - {it.deviceName} - متوفر: {available}</option>;
                   })}
                 </select>
               </div>

               {/* الكمية */}
               <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
                 <label className="text-xs text-gray-400 font-bold whitespace-nowrap sm:w-24 sm:shrink-0">الكمية</label>
                 <input 
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    dir="ltr"
                    lang="en"
                    onFocus={e => e.target.select()}
                    value={Number.isNaN(Number(currentFormRow.count)) ? '' : currentFormRow.count}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9]/g, '');
                      let val = raw === '' ? '' : parseInt(raw);
                      if (typeof val === 'number') {
                        const max = currentFormRow.id ? getAvailableQuantity(currentFormRow.id, editingIndex !== null ? editingIndex : -1) : 1;
                        if (val < 1) val = 1;
                        if (val > max) val = max;
                      }
                      handleUpdateCurrentForm('count', val);
                    }}
                    className="w-full sm:flex-1 bg-black/40 border border-white/10 px-3 py-2 focus:border-orange-500 outline-none transition-all rounded-lg text-sm text-right text-white box-border font-mono font-bold"
                  />
               </div>

               {/* حالة الجهاز (القرار/النتيجة) */}
               <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
                 <label className="text-xs text-gray-400 font-bold whitespace-nowrap sm:w-24 sm:shrink-0">حالة الجهاز</label>
                 <div className="w-full sm:flex-1 flex bg-black/40 border border-white/5 p-1 rounded-xl gap-1 box-border">
                   <button 
                     onClick={() => handleUpdateCurrentForm('outcome', 'repaired')}
                     className={`flex-1 py-1.5 text-xs font-bold transition-all rounded-lg ${currentFormRow.outcome === 'repaired' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:bg-white/5'}`}
                   >
                     تم الإصلاح
                   </button>
                   <button 
                     onClick={() => handleUpdateCurrentForm('outcome', 'failed')}
                     className={`flex-1 py-1.5 text-xs font-bold transition-all rounded-lg ${currentFormRow.outcome === 'failed' ? 'bg-red-600/80 text-white shadow-md' : 'text-gray-400 hover:bg-white/5'}`}
                   >
                     لم يتم الإصلاح
                   </button>
                   <button 
                     onClick={() => handleUpdateCurrentForm('outcome', 'refused')}
                     className={`flex-1 py-1.5 text-xs font-bold transition-all rounded-lg ${currentFormRow.outcome === 'refused' ? 'bg-zinc-700 text-white shadow-md' : 'text-gray-400 hover:bg-white/5'}`}
                   >
                     عدم موافقة العميل
                   </button>
                 </div>
               </div>

               {/* تقرير الصيانة */}
               <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
                 <label className="text-xs text-gray-400 font-bold whitespace-nowrap sm:w-24 sm:shrink-0">تقرير الصيانة</label>
                 <input 
                   type="text"
                   value={currentFormRow.reason}
                   onChange={e => handleUpdateCurrentForm('reason', e.target.value)}
                   onFocus={(e) => {
                     e.target.select();
                     e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                   }}
                   onClick={(e) => {
                     e.currentTarget.select();
                   }}
                   className="w-full sm:flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus:border-orange-500 outline-none transition-all text-xs text-right text-white box-border"
                 />
               </div>

               {/* تقرير الفحص والمشكلة */}
               {(() => {
                 const selectedItem = invoiceItems.find(i => i.id === currentFormRow.id);
                 if (!selectedItem) return null;
                 return (
                    <div className="flex flex-col gap-2 w-full pt-1">
                      {/* شكوى العميل */}
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                        <label className="text-xs text-gray-400 font-bold whitespace-nowrap sm:w-24 sm:shrink-0 pt-1">شكوى العميل</label>
                        <div className="w-full sm:flex-1 bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs font-medium text-white break-words text-right">
                          {selectedItem.customerProblem || 'لا يوجد'}
                        </div>
                      </div>
                      {/* تقرير الفحص */}
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                        <label className="text-xs text-gray-400 font-bold whitespace-nowrap sm:w-24 sm:shrink-0 pt-1">تقرير الفحص</label>
                        <div className="w-full sm:flex-1 bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs font-medium text-orange-500 break-words text-right">
                          {(() => {
                            const val = selectedItem.engineerReport || '';
                            const splitIdx = val.indexOf(' | ');
                            if (splitIdx !== -1) {
                              return (
                                <div className="flex flex-col gap-1">
                                  <div><span className="text-gray-400">التقرير الفني: </span>{val.substring(0, splitIdx).trim()}</div>
                                  <div className="text-purple-400 font-bold"><span className="text-gray-400">نتيجة الصيانة: </span>{val.substring(splitIdx + 3).trim()}</div>
                                </div>
                              );
                            }
                            return val || 'لا يوجد';
                          })()}
                        </div>
                      </div>
                    </div>
                 );
               })()}
             </div>

             <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
               <button
                 onClick={handleCancelForm}
                 className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
               >
                 إلغاء
               </button>
               {editingIndex !== null ? (
                 <button
                   onClick={handleApplyFormToTable}
                   disabled={!currentFormRow.id || isNaN(Number(currentFormRow.count)) || Number(currentFormRow.count) < 1 || Number(currentFormRow.count) > getAvailableQuantity(currentFormRow.id, editingIndex)}
                   className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                 >
                   تعديل
                 </button>
               ) : (
                 <button
                   onClick={handleApplyFormToTable}
                   disabled={!currentFormRow.id || isNaN(Number(currentFormRow.count)) || Number(currentFormRow.count) < 1 || Number(currentFormRow.count) > getAvailableQuantity(currentFormRow.id, -1)}
                   className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                 >
                   <Plus size={14} />
                   إضافة 
                 </button>
               )}
             </div>
          </div>

          {/* Table display for actionItems */}
          {actionItems.length > 0 && (
             <div className="bg-[#1a1a1a] border-y sm:border border-white/5 rounded-none sm:rounded-xl overflow-hidden mt-4 shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-right min-w-[500px]">
                  <thead className="bg-[#111111] border-b border-white/5">
                    <tr className="text-[10px] text-gray-400 whitespace-nowrap">
                      <th className="py-2 px-3 font-bold">النوع</th>
                      <th className="py-2 px-3 font-bold">الموديل / الجهاز</th>
                      <th className="py-2 px-3 font-bold">العدد</th>
                      <th className="py-2 px-3 font-bold">حالة الجهاز</th>
                      <th className="py-2 px-3 font-bold">تقرير الصيانة</th>
                      <th className="py-2 px-3 font-bold w-16">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {actionItems.map((row, idx) => {
                      const it = invoiceItems.find(i => i.id === row.id);
                      return (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-2 px-3 font-bold text-[11px] whitespace-nowrap">
                            {it?.deviceType || '-'}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-[11px]">
                            {it?.deviceName || '-'}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-[11px] whitespace-nowrap">{row.count}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-[11px]">
                            {row.outcome === 'repaired' ? <span className="text-orange-400">تم الإصلاح</span> : 
                             row.outcome === 'failed' ? <span className="text-red-400">لم يتم الإصلاح</span> : 
                             <span className="text-red-400">عدم موافقة العميل</span>}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-[11px]">{row.reason || '-'}</td>
                          <td className="py-2 px-3 flex items-center gap-1.5 whitespace-nowrap">
                            <button onClick={() => handleEditTableRow(idx)} className="p-1 hover:bg-orange-500/20 text-orange-500 rounded transition-colors cursor-pointer" title="تعديل">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleRemoveFormRow(idx)} className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors cursor-pointer" title="حذف">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-0 py-3 mb-4" dir="rtl">
           <button 
             onClick={handlePreviewInit}
             disabled={loading || actionItems.length === 0 || !engineerName.trim() || actionItems.some((r, idx) => r.count <= 0 || r.count > getAvailableQuantity(r.id, idx))}
             className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 font-bold text-sm transition-all flex items-center justify-center gap-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
             معاينة للتعديل والترحيل
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4 pb-20 relative" dir="rtl">

      {/* Large Orange/Amber Dual Stats Counter Card */}
      <div className="px-2 py-3">
        <div className="w-full bg-gradient-to-br from-orange-600 via-red-500 to-amber-600 text-white p-5 rounded-none sm:rounded-2xl shadow-md relative overflow-hidden">
          {/* Faint Background Icon */}
          <div className="absolute top-1/2 left-6 -translate-y-1/2 opacity-10 pointer-events-none">
            <Wrench size={120} />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            {/* Section 1: Devices Waiting for Maintenance */}
            <div className="flex flex-col items-center justify-center py-3 px-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider drop-shadow-md">{totalInspectedDevices}</span>
              <span className="text-xs font-bold font-cairo mt-1.5 text-orange-100">أجهزة بانتظار الصيانة</span>
              <span className="text-[10px] text-orange-200 mt-1 opacity-70 hidden sm:block">إجمالي الأجهزة قيد الإصلاح</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between px-3 mb-2" dir="rtl">
        <div className="w-full sm:w-72">
          <CustomerAutocomplete
            customers={customers}
            onSelect={(c) => setSearch(c.name)}
            placeholder={t('common.search', 'Search...')}
            initialValue={search}
          />
        </div>
      </div>

      <div className="bg-[#1a1a1a] border sm:border-y border-white/5 overflow-hidden w-full sm:rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse select-none">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 text-[9px] sm:text-[10px]">
              <tr>
                <th className="px-2 py-2 font-bold text-center whitespace-nowrap">{t('movement.invoiceRef', 'Invoice #')}</th>
                <th className="px-2 py-2 font-bold text-center whitespace-nowrap">{t('movement.customerRef', 'Customer #')}</th>
                <th className="px-2 py-2 font-bold text-right">{t('movement.customerName', 'Name')}</th>
                <th className="px-2 py-2 font-bold text-center whitespace-nowrap">{t('movement.devicesCount', 'Devices Count')}</th>
                <th className="px-2 py-2 font-bold text-center whitespace-nowrap">{t('movement.actionBtn', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 text-[10px] sm:text-xs">
              {currentInvoices.map(invoice => (
                <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-2 py-2 font-mono text-white text-center whitespace-nowrap">{invoice.invoiceNumber}</td>
                  <td className="px-2 py-2 font-mono text-gray-400 text-center whitespace-nowrap">{getCustomerNumber(invoice.customerId)}</td>
                  <td className="px-2 py-2 font-bold truncate">{invoice.customerName || getCustomerName(invoice.customerId)}</td>
                  <td className="px-2 py-2 font-mono text-orange-400 font-bold text-center whitespace-nowrap">{getInspectedCount(invoice.invoiceNumber)}</td>
                  <td className="px-2 py-2 text-center whitespace-nowrap">
                    <button 
                      onClick={() => openInvoice(invoice)}
                      className="px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600 text-orange-500 hover:text-white rounded-lg text-[9px] sm:text-[10px] font-bold font-cairo transition-all inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {t('movement.maintain', 'Process')} <ArrowUpRight size={12} className="rtl:-scale-x-100" />
                    </button>
                  </td>
                </tr>
              ))}
              {pendingInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-8 text-center text-gray-500 font-bold font-cairo text-xs">{t('movement.noPendingMaintenance', 'No pending maintenance actions.')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-black/20">
            <span className="text-xs text-gray-500 font-bold font-cairo">
              عرض {((safeCurrentPage - 1) * itemsPerPage) + 1} إلى {Math.min(safeCurrentPage * itemsPerPage, pendingInvoices.length)} من أصل {pendingInvoices.length} فاتورة
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ArrowLeft size={16} className="rotate-180" />
              </button>
              
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${
                      safeCurrentPage === page 
                        ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ArrowLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
