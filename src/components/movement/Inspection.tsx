import { CustomerAutocomplete } from '../CustomerAutocomplete';
import { parseDate } from '../../lib/dateUtils';
import { sharePdfFile, openWhatsApp } from '../../lib/shareHelper';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, writeBatch, serverTimestamp, getDoc } from '../../firebase';
import { db } from '../../firebase';
import { Invoice, InvoiceItem, User, Customer } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { useTranslation } from 'react-i18next';
import { Search, ArrowLeft, ArrowUpRight, ArrowRight, LogOut, Search as SearchIcon, ClipboardCheck, HardDrive, User as UserIcon, Settings, Plus, Save, Loader2, DollarSign, X, Check, AlertTriangle, Printer, Phone, Smartphone, MessageCircle, MapPin, Facebook } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BankAccountsFooter from '../BankAccountsFooter';
import PrintPreviewOverlay from '../PrintPreviewOverlay';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { sanitizeDocumentStyles, sanitizeElementInlineStyles, cleanOklchInStyleText } from '../../lib/html2canvasHelper';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.501-5.734-1.451L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.018-5.11-2.871-6.968C16.592 1.96 14.118.94 11.482.94c-5.438 0-9.863 4.42-9.866 9.861-.001 1.761.468 3.481 1.357 5.02L1.97 21.03l5.311-1.392c.312.163.626.326.96.48zm11.365-7.6c-.302-.151-1.78-.879-2.057-.98-.277-.101-.48-.151-.68.151-.2.3-.777.979-.952 1.18-.176.201-.351.226-.654.076-.302-.151-1.277-.47-2.434-1.502-.9-.803-1.507-1.795-1.683-2.096-.176-.301-.019-.464.132-.614.136-.135.302-.35.453-.526.151-.176.201-.301.302-.503.101-.201.05-.377-.025-.527-.076-.151-.68-1.637-.932-2.247-.246-.59-.497-.51-.68-.52-.176-.01-.377-.01-.579-.01-.201 0-.528.075-.804.377-.277.301-1.057 1.031-1.057 2.515 0 1.485 1.082 2.918 1.232 3.119.15.2 2.13 3.25 5.16 4.561.721.311 1.284.498 1.72.639.724.23 1.382.197 1.902.12.58-.088 1.78-.728 2.031-.1.431.25.1.48.1.68.01.2.148z"/>
  </svg>
);

function parseEngineerReport(reportStr: string, isEditing: boolean = false) {
  const s = reportStr || '';
  const idx = s.indexOf(' | ');
  if (idx !== -1) {
    const technical = s.substring(0, idx);
    const outcome = s.substring(idx + 3);
    return {
      technical: isEditing ? technical : technical.trim(),
      outcome: isEditing ? outcome : outcome.trim()
    };
  }
  return {
    technical: isEditing ? s : s.trim(),
    outcome: ''
  };
}

export default function Inspection({ user, onBack, initialInvoice }: { user: User, onBack: () => void, initialInvoice?: Invoice | null }) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions(user, 'inventory');

  if (!hasPermission('view')) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
          <ClipboardCheck size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">عذراً، ليس لديك صلاحية الوصول</h2>
        <p className="text-gray-400 max-w-md">يرجى التواصل مع المسؤول للحصول على الصلاحيات اللازمة للوصول لقسم الفحص.</p>
        <button 
          onClick={onBack} 
          className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 flex items-center justify-center"
          title="خروج للرئيسية"
        >
          <LogOut size={20} className="rotate-180" />
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
  const [actionItems, setActionItems] = useState<{ id: string, count: number, report: string, unitCost: number, cost: number, decision: 'repairing' | 'intact' | 'unrepairable' }[]>([]);
  const [currentOutput, setCurrentOutput] = useState<any>(null);

  // Double Purpose tabs
  const [subTab, setSubTab] = useState<'new_devices' | 'under_inspection' | 'phased_inspection'>('new_devices');
  const [phasedStage, setPhasedStage] = useState<'phase1' | 'phase2'>('phase1');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, 'action1' | 'action2' | 'action3'>>({});
  const [selectedInvoiceForCancel, setSelectedInvoiceForCancel] = useState<Invoice | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelNotes, setCancelNotes] = useState('');
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (initialInvoice && items.length > 0 && !selectedInvoice) {
      if (initialInvoice.status === '10' || initialInvoice.status === 'new') {
        setSubTab('new_devices');
      } else if (initialInvoice.status === '20' || initialInvoice.status === '25') {
        setSubTab('under_inspection');
        openInvoice(initialInvoice);
      } else if (initialInvoice.status === '21') {
        setSubTab('phased_inspection');
        setPhasedStage('phase1');
        openInvoice(initialInvoice);
      } else if (initialInvoice.status === '22') {
        setSubTab('phased_inspection');
        setPhasedStage('phase2');
        openInvoice(initialInvoice);
      }
    }
  }, [initialInvoice, items, selectedInvoice]);

  useEffect(() => {
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (s) => setInvoices(s.docs.map(d => ({ id: d.id, ...d.data() } as Invoice))));
    const unsubItems = onSnapshot(collection(db, 'invoice_items'), (s) => setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as InvoiceItem))));
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (s) => setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() } as Customer))));
    const unsubEngineers = onSnapshot(collection(db, 'engineers'), (s) => setEngineersList(s.docs.map(d => d.data().name).filter(Boolean)));
    return () => { unsubInvoices(); unsubItems(); unsubCustomers(); unsubEngineers(); };
  }, []);

  // Initialize selectedOptions on load of invoices
  useEffect(() => {
    const newOptions = { ...selectedOptions };
    let changed = false;
    invoices.forEach(inv => {
      if (!newOptions[inv.id!]) {
        newOptions[inv.id!] = 'action1';
        changed = true;
      }
    });
    if (changed) {
      setSelectedOptions(newOptions);
    }
  }, [invoices]);

  useEffect(() => {
    setCurrentPage(1);
  }, [subTab, phasedStage, search]);

  const countNewDevices = items.filter(i => i.status === '10' || i.status === 'new').reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const countPhase1Devices = items.filter(i => i.status === '21').reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const countPhase2Devices = items.filter(i => i.status === '22').reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const countPhasedDevices = countPhase1Devices + countPhase2Devices;

  const countInspectionDevices = items.filter(i => i.status === '20' || i.status === '25' || i.status === 'testing' || i.status === 'inspected').reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) + countPhasedDevices;

  const newInvoicesFiltered = invoices.filter(inv => {
    return items.some(item => item.invoiceNumber === inv.invoiceNumber && (item.status === '10' || item.status === 'new') && item.quantity > 0);
  }).filter(inv => 
    (inv.customerName || '').toLowerCase().includes(search.toLowerCase()) || 
    (inv.invoiceNumber || '').includes(search)
  ).sort((a, b) => Number(b.invoiceNumber) - Number(a.invoiceNumber));

  const pendingInvoicesFiltered = invoices.filter(inv => {
    return items.some(item => item.invoiceNumber === inv.invoiceNumber && (item.status === '20' || item.status === '25') && item.quantity > 0);
  }).filter(inv => 
    (inv.customerName || '').toLowerCase().includes(search.toLowerCase()) || 
    (inv.invoiceNumber || '').includes(search)
  ).sort((a, b) => Number(b.invoiceNumber) - Number(a.invoiceNumber));

  const phase1InvoicesFiltered = invoices.filter(inv => {
    return items.some(item => item.invoiceNumber === inv.invoiceNumber && item.status === '21' && item.quantity > 0);
  }).filter(inv => 
    (inv.customerName || '').toLowerCase().includes(search.toLowerCase()) || 
    (inv.invoiceNumber || '').includes(search)
  ).sort((a, b) => Number(b.invoiceNumber) - Number(a.invoiceNumber));

  const phase2InvoicesFiltered = invoices.filter(inv => {
    return items.some(item => item.invoiceNumber === inv.invoiceNumber && item.status === '22' && item.quantity > 0);
  }).filter(inv => 
    (inv.customerName || '').toLowerCase().includes(search.toLowerCase()) || 
    (inv.invoiceNumber || '').includes(search)
  ).sort((a, b) => Number(b.invoiceNumber) - Number(a.invoiceNumber));

  const activeInvoices = subTab === 'new_devices' 
    ? newInvoicesFiltered 
    : subTab === 'under_inspection' 
    ? pendingInvoicesFiltered 
    : (phasedStage === 'phase1' ? phase1InvoicesFiltered : phase2InvoicesFiltered);

  const totalPages = Math.max(1, Math.ceil(activeInvoices.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentInvoices = activeInvoices.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  const getNewDevicesCount = (invoiceNumber: string) => {
    return items.filter(item => item.invoiceNumber === invoiceNumber && (item.status === '10' || item.status === 'new')).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  };

  const getInspectionDevicesCount = (invoiceNumber: string) => {
    return items.filter(item => item.invoiceNumber === invoiceNumber && item.status === '20').reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  };

  const countPhasedInvoicesCount = (invoiceNumber: string, statusToCheck: string) => {
    return items.filter(item => item.invoiceNumber === invoiceNumber && item.status === statusToCheck).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  };

  const handleExecuteAction = async (invoice: Invoice) => {
    const choice = selectedOptions[invoice.id!] || 'action1';
    
    if (choice === 'action2') {
      setSelectedInvoiceForCancel(invoice);
      setCancelNotes('');
      setShowCancelModal(true);
      return;
    }

    if (subTab === 'new_devices') {
      // Entry to Inspection: Transition status to '20'
      try {
        const batch = writeBatch(db);
        const invRef = doc(db, 'invoices', invoice.id!);
        batch.update(invRef, {
          status: '20',
          updatedAt: serverTimestamp()
        });

        const invoiceItems = items.filter(i => i.invoiceNumber === invoice.invoiceNumber && (i.status === '10' || i.status === 'new'));
        invoiceItems.forEach(item => {
          batch.update(doc(db, 'invoice_items', item.id!), {
            status: '20',
            technician: item.technician || user?.name || user?.username || 'System',
            updatedAt: serverTimestamp()
          });
        });

        await batch.commit();
        showToast(`تم تغيير حالة الفاتورة #${invoice.invoiceNumber} وأجهزتها بنجاح إلى قيد الفحص.`);
        setSubTab('under_inspection');
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء محاولة تسجيل دخول فحص.');
      }
    } else if (subTab === 'under_inspection') {
      if (choice === 'action3') {
        // Transition from '20' to '21' (Phased Inspection Phase 1)
        try {
          const batch = writeBatch(db);
          const invRef = doc(db, 'invoices', invoice.id!);
          batch.update(invRef, {
            status: '21',
            updatedAt: serverTimestamp()
          });

          const invoiceItems = items.filter(i => i.invoiceNumber === invoice.invoiceNumber && i.status === '20');
          invoiceItems.forEach(item => {
            batch.update(doc(db, 'invoice_items', item.id!), {
              status: '21',
              updatedAt: serverTimestamp()
            });
          });

          await batch.commit();
          showToast(`تم تحويل الفاتورة #${invoice.invoiceNumber} بنجاح إلى الفحص المرحلي.`);
          setSubTab('phased_inspection');
          setPhasedStage('phase1');
        } catch (err) {
          console.error(err);
          alert('حدث خطأ أثناء محاولة تسجيل تحويل للفحص المرحلي.');
        }
      } else {
        // Diagnose step for status '20'
        openInvoice(invoice);
      }
    } else {
      // Diagnose step for status '21' or '22'
      openInvoice(invoice);
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedInvoiceForCancel) return;
    if (!cancelNotes.trim()) {
      alert('الرجاء كتابة سبب إلغاء العملية والانسحاب لتسجيل الإجراء.');
      return;
    }

    setLoadingCancel(true);
    try {
      const batch = writeBatch(db);
      
      // Update invoice as Cancelled '70' with reason
      batch.update(doc(db, 'invoices', selectedInvoiceForCancel.id!), {
        status: '70',
        cancelReason: cancelNotes,
        updatedAt: serverTimestamp()
      });

      // Update all items of this invoice to status 70/cancelled with cancel notes stored in failureReason
      const invoiceItemsToCancel = items.filter(i => i.invoiceNumber === selectedInvoiceForCancel.invoiceNumber);
      invoiceItemsToCancel.forEach(item => {
        batch.update(doc(db, 'invoice_items', item.id!), {
          status: '70',
          subStatus: 'cancelled',
          failureReason: cancelNotes,
          engineerReport: cancelNotes,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      setShowCancelModal(false);
      setSelectedInvoiceForCancel(null);
      showToast(`تم إلغاء عملية الفاتورة #${selectedInvoiceForCancel.invoiceNumber} بنجاح وتحويلها لصفحة الخروج.`);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء محاولة إلغاء العملية.');
    } finally {
      setLoadingCancel(false);
    }
  };

  const getCustomerPhone = (customerId: string) => {
    const c = customers.find(c => c.id === customerId);
    return c ? (c.phone1 || c.phone2 || '') : '';
  };
  const getCustomerNumber = (customerId: string) => {
    const c = customers.find(c => c.id === customerId);
    return c ? c.customerNumber : '---';
  };

  const getCustomerName = (customerId: string) => {
    const c = customers.find(c => c.id === customerId);
    return c ? (c.name || c.companyName) : '---';
  };

  const [currentActionItem, setCurrentActionItem] = useState<{
    id: string,
    count: number | '',
    report: string,
    technical: string,
    outcome: string,
    unitCost: number,
    cost: number,
    decision: 'repairing' | 'intact' | 'unrepairable'
  }>({
    id: '',
    count: 1,
    report: 'الجهاز بحاجة إلى صيانة | تشغيل كامل للجهاز',
    technical: 'الجهاز بحاجة إلى صيانة',
    outcome: 'تشغيل كامل للجهاز',
    unitCost: 0,
    cost: 0,
    decision: 'repairing'
  });

  const setSyncedCurrentActionItem = (item: any) => {
    const reportVal = item.report || '';
    const parsed = parseEngineerReport(reportVal, true);
    
    const technical = item.technical !== undefined ? item.technical : parsed.technical;
    const outcome = item.outcome !== undefined ? item.outcome : (parsed.outcome || (item.decision === 'repairing' ? 'تشغيل كامل للجهاز' : ''));
    const finalReport = item.report !== undefined ? item.report : (technical + " | " + outcome);

    setCurrentActionItem({
      ...item,
      report: finalReport,
      technical,
      outcome
    });
  };

  const getLatestItemData = (itemId: string, currentActionList: any[]) => {
    // First, check if there is an item in the current temporary actions list
    const actionItem = currentActionList.find(a => a.id === itemId);
    if (actionItem) {
      return {
        decision: actionItem.decision,
        report: actionItem.report,
        unitCost: actionItem.unitCost,
        cost: actionItem.cost
      };
    }
    // Second, check the original invoiceItems list
    const originalItem = invoiceItems.find(i => i.id === itemId);
    if (originalItem) {
      const initialDecision = (originalItem.subStatus === 'intact' || originalItem.subStatus === 'unrepairable' || originalItem.subStatus === 'repairing') 
        ? originalItem.subStatus 
        : 'repairing';
      return {
        decision: initialDecision,
        report: originalItem.engineerReport || (initialDecision === 'repairing' ? 'الجهاز بحاجة إلى صيانة | تشغيل كامل للجهاز' : initialDecision === 'intact' ? 'سليم' : 'لايصلح'),
        unitCost: originalItem.cost || 0,
        cost: originalItem.cost || 0
      };
    }
    return null;
  };
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);

  const openInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const targetStatus = invoice.status === '21' ? '21' : invoice.status === '22' ? '22' : '20';
    const avItems = items.filter(i => i.invoiceNumber === invoice.invoiceNumber && i.status === targetStatus);
    
    setInvoiceItems(avItems);
    const existingTech = avItems.find(i => i.technician)?.technician || "";
    setEngineerName(existingTech || user?.name || "");
    
    
    setActionItems([]);
    setEditingActionIndex(null);

    if (avItems.length > 0) {
      const firstItem = avItems[0];
      if (invoice.status === '22') {
        // Phase 2: pre-fill first item's report & decision from Phase 1 inputs!
        const initialDecision = (firstItem.subStatus === 'intact' || firstItem.subStatus === 'unrepairable' || firstItem.subStatus === 'repairing') 
          ? firstItem.subStatus 
          : 'repairing';
        setSyncedCurrentActionItem({
          id: firstItem.id!,
          count: firstItem.quantity,
          report: firstItem.engineerReport || (initialDecision === 'repairing' ? 'الجهاز بحاجة إلى صيانة | تشغيل كامل للجهاز' : initialDecision === 'intact' ? 'سليم' : 'لايصلح'),
          unitCost: firstItem.cost || 0,
          cost: (firstItem.cost || 0) * firstItem.quantity,
          decision: initialDecision as 'repairing' | 'intact' | 'unrepairable'
        });
      } else {
        // Phase 1 or normal: Reset and initialize one entry form
        setSyncedCurrentActionItem({
          id: firstItem.id!,
          count: firstItem.quantity,
          report: 'الجهاز بحاجة إلى صيانة | تشغيل كامل للجهاز',
          unitCost: 0,
          cost: 0,
          decision: 'repairing'
        });
      }
    }
  };

  const handleUpdateCurrentField = (field: string, value: any) => {
    let item = { ...currentActionItem, [field]: value };
    if (selectedInvoice && selectedInvoice.status === '21') {
      item.unitCost = 0;
      item.cost = 0;
    }
    if (field === 'id') {
      const maxCount = getAvailableQuantity(value, -1);
      // Show total available quantity of the selected device by default
      item.count = maxCount;

      if (selectedInvoice && selectedInvoice.status === '22') {
        const latestData = getLatestItemData(value, actionItems);
        if (latestData) {
          const parsed = parseEngineerReport(latestData.report, true);
          item.decision = latestData.decision;
          item.report = latestData.report;
          item.technical = parsed.technical;
          item.outcome = parsed.outcome;
          item.unitCost = latestData.unitCost;
          item.cost = latestData.unitCost * Number(maxCount || 0);
        }
      } else {
        item.decision = 'repairing';
        item.report = 'الجهاز بحاجة إلى صيانة | تشغيل كامل للجهاز';
        item.technical = 'الجهاز بحاجة إلى صيانة';
        item.outcome = 'تشغيل كامل للجهاز';
        item.unitCost = 0;
        item.cost = 0;
      }
    }
    if (field === 'decision') {
      if (value !== 'repairing') {
         item.unitCost = 0;
         item.cost = 0;
      }
      if (value === 'repairing') {
        item.technical = 'الجهاز بحاجة إلى صيانة';
        item.outcome = 'تشغيل كامل للجهاز';
        item.report = 'الجهاز بحاجة إلى صيانة | تشغيل كامل للجهاز';
      }
      else if (value === 'intact') {
        item.technical = 'سليم';
        item.outcome = '';
        item.report = 'سليم | ';
      }
      else if (value === 'unrepairable') {
        item.technical = 'لا يصلح';
        item.outcome = '';
        item.report = 'لا يصلح | ';
      }
    } else if (field === 'count' || field === 'unitCost') {
      if (selectedInvoice && selectedInvoice.status !== '21') {
        item.cost = Number(item.count || 0) * Number(item.unitCost || 0);
      } else {
        item.cost = 0;
      }
    }

    if (field === 'technical') {
      const outcomeVal = item.outcome !== undefined ? item.outcome : 'تشغيل كامل للجهاز';
      item.report = value + " | " + outcomeVal;
    } else if (field === 'outcome') {
      const technicalVal = item.technical !== undefined ? item.technical : 'الجهاز بحاجة إلى صيانة';
      item.report = technicalVal + " | " + value;
    }

    setSyncedCurrentActionItem(item as any);
  };

  const handleSaveCurrentItem = () => {
    if (!currentActionItem.id) return;
    
    const nextItems = [...actionItems];
    if (editingActionIndex !== null) {
      nextItems[editingActionIndex] = currentActionItem as any;
    } else {
      nextItems.push(currentActionItem as any);
    }
    
    setActionItems(nextItems);
    setEditingActionIndex(null);
    
    // Reset form to next available
    const nextAvailableItem = invoiceItems.find(it => {
      const usedQuantity = nextItems.reduce((acc, row) => {
        if (row.id === it.id) return acc + row.count;
        return acc;
      }, 0);
      return it.quantity - usedQuantity > 0;
    });

    if (nextAvailableItem) {
      const usedQty = nextItems.reduce((sum, row) => row.id === nextAvailableItem.id ? sum + row.count : sum, 0);
      const remQty = Math.max(0, nextAvailableItem.quantity - usedQty);

      if (selectedInvoice && selectedInvoice.status === '22') {
        const latestData = getLatestItemData(nextAvailableItem.id!, nextItems);
        if (latestData) {
          setSyncedCurrentActionItem({
            id: nextAvailableItem.id!,
            count: remQty,
            report: latestData.report,
            unitCost: latestData.unitCost,
            cost: latestData.unitCost * remQty,
            decision: latestData.decision
          });
        }
      } else {
        setSyncedCurrentActionItem({
          id: nextAvailableItem.id!,
          count: remQty,
          report: 'الجهاز بحاجة إلى صيانة | تشغيل كامل للجهاز',
          unitCost: 0,
          cost: 0,
          decision: 'repairing'
        });
      }
    } else {
      setSyncedCurrentActionItem({
        id: '',
        count: '',
        report: 'الجهاز بحاجة إلى صيانة | تشغيل كامل للجهاز',
        unitCost: 0,
        cost: 0,
        decision: 'repairing'
      });
    }
  };

  const handleEditRow = (index: number) => {
    setSyncedCurrentActionItem(actionItems[index]);
    setEditingActionIndex(index);
  };

  const handleCancelEdit = () => {
    setEditingActionIndex(null);
    const availableItem = invoiceItems.find(it => {
      const usedQuantity = actionItems.reduce((acc, row) => {
        if (row.id === it.id) return acc + row.count;
        return acc;
      }, 0);
      return it.quantity - usedQuantity > 0;
    });
    if (availableItem) {
      const usedQty = actionItems.reduce((sum, row) => row.id === availableItem.id ? sum + row.count : sum, 0);
      const remQty = Math.max(0, availableItem.quantity - usedQty);

      if (selectedInvoice && selectedInvoice.status === '22') {
        const latestData = getLatestItemData(availableItem.id!, actionItems);
        if (latestData) {
          setSyncedCurrentActionItem({
            id: availableItem.id!,
            count: remQty,
            report: latestData.report,
            unitCost: latestData.unitCost,
            cost: latestData.unitCost * remQty,
            decision: latestData.decision
          });
        }
      } else {
        setSyncedCurrentActionItem({
          id: availableItem.id!,
          count: remQty,
          report: 'الجهاز بحاجة إلى صيانة | تشغيل كامل للجهاز',
          unitCost: 0,
          cost: 0,
          decision: 'repairing'
        });
      }
    } else {
      setSyncedCurrentActionItem({
        id: '',
        count: '',
        report: 'الجهاز بحاجة إلى صيانة | تشغيل كامل للجهاز',
        unitCost: 0,
        cost: 0,
        decision: 'repairing'
      });
    }
  };

  const handleRemoveRow = (index: number) => {
    const nextItems = actionItems.filter((_, i) => i !== index);
    setActionItems(nextItems);
    
    // Reset editing state if we delete the row we are editing
    if (editingActionIndex === index) {
      setEditingActionIndex(null);
    }

    // Reset the input form fields to the first available item status after deletion
    const availableItem = invoiceItems.find(it => {
      const usedQuantity = nextItems.reduce((acc, row) => {
        if (row.id === it.id) return acc + row.count;
        return acc;
      }, 0);
      return it.quantity - usedQuantity > 0;
    });

    if (availableItem) {
      const usedQty = nextItems.reduce((sum, row) => row.id === availableItem.id ? sum + row.count : sum, 0);
      const remQty = Math.max(0, availableItem.quantity - usedQty);

      if (selectedInvoice && selectedInvoice.status === '22') {
        const latestData = getLatestItemData(availableItem.id!, nextItems);
        if (latestData) {
          setSyncedCurrentActionItem({
            id: availableItem.id!,
            count: remQty,
            report: latestData.report,
            unitCost: latestData.unitCost,
            cost: latestData.unitCost * remQty,
            decision: latestData.decision
          });
        }
      } else {
        setSyncedCurrentActionItem({
          id: availableItem.id!,
          count: remQty,
          report: 'الجهاز بحاجة إلى صيانة | تشغيل كامل للجهاز',
          unitCost: 0,
          cost: 0,
          decision: 'repairing'
        });
      }
    } else {
      setSyncedCurrentActionItem({
        id: '',
        count: '',
        report: 'الجهاز بحاجة إلى صيانة | تشغيل كامل للجهاز',
        unitCost: 0,
        cost: 0,
        decision: 'repairing'
      });
    }
  };

  const getAvailableQuantity = (itemId: string, currentRowIndex: number) => {
    const originalItem = invoiceItems.find(i => i.id === itemId);
    if (!originalItem) return 0;
    
    let usedQuantity = actionItems.reduce((acc, row, idx) => {
      if (idx !== currentRowIndex && row.id === itemId) return acc + row.count;
      return acc;
    }, 0);
    
    if (currentRowIndex === -1 && editingActionIndex !== null && currentActionItem.id === itemId) {
      // If we are evaluating available quantity in the form, and we are editing an existing item
      // We shouldn't double count the item we are editing
      usedQuantity -= actionItems[editingActionIndex].count;
    }

    return Math.max(0, originalItem.quantity - usedQuantity);
  };

  const [loading, setLoading] = useState(false);
  const [showPreviewReport, setShowPreviewReport] = useState(false);
  const [shopConfig, setShopConfig] = useState<any>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch shop config
  useEffect(() => {
    getDoc(doc(db, 'company_details', 'main_details')).then((snap) => {
      if (snap.exists()) {
        setShopConfig(snap.data());
      }
    }).catch(err => {
      console.warn("Could not fetch shop settings during inspection:", err);
    });
  }, []);

  const getCustomerCompany = (customerId: string) => {
    const c = customers.find(c => c.id === customerId);
    return c ? (c.companyName || '---') : '---';
  };

  const getPreviewItems = () => {
    const result: any[] = [];
    
    // Create a copy of the quantities so we can track remaining in-memory
    const remainingQtyMap = new Map<string, number>();
    invoiceItems.forEach(item => {
      remainingQtyMap.set(item.id!, Number(item.quantity) || 0);
    });

    // Add the row updates from actionItems
    actionItems.forEach((row, index) => {
      const orig = invoiceItems.find(i => i.id === row.id);
      if (!orig) return;

      const rowCount = Number(row.count) || 1;
      const currentRem = remainingQtyMap.get(orig.id!) || 0;
      
      // Add the inspected portion
      result.push({
        id: `inspected-${index}`,
        deviceType: orig.deviceType,
        deviceName: orig.deviceName,
        quantity: rowCount,
        engineerReport: row.report,
        cost: row.decision === 'repairing' ? (Number(row.cost) || 0) : 0,
        unitCost: row.decision === 'repairing' ? (Number(row.unitCost) || 0) : 0,
        subStatus: row.decision === 'intact' ? 'intact' : row.decision === 'unrepairable' ? 'unrepairable' : 'maintenance',
        status: row.decision === 'intact' ? '50' : row.decision === 'unrepairable' ? '50' : '30'
      });

      remainingQtyMap.set(orig.id!, Math.max(0, currentRem - rowCount));
    });

    // Add the uninspected remaining portions
    invoiceItems.forEach(orig => {
      const left = remainingQtyMap.get(orig.id!) || 0;
      if (left > 0) {
        result.push({
          ...orig,
          quantity: left,
          engineerReport: orig.engineerReport || 'قيد المعاينة والمراجعة',
          cost: Number(orig.cost) || 0,
          unitCost: Number(orig.unitCost) || 0,
          subStatus: orig.subStatus || ''
        });
      }
    });

    // Sort result by deviceType, then deviceName, then subStatus (maintenance -> intact -> unrepairable)
    result.sort((a, b) => {
      const typeA = a.deviceType || '';
      const typeB = b.deviceType || '';
      const compType = typeA.localeCompare(typeB, 'ar');
      if (compType !== 0) return compType;

      const nameA = a.deviceName || '';
      const nameB = b.deviceName || '';
      const compName = nameA.localeCompare(nameB, 'ar');
      if (compName !== 0) return compName;

      const rank = (item: any) => {
        const s = item.subStatus || '';
        if (s === 'intact') return 2;
        if (s === 'unrepairable') return 3;
        return 1; // Default is 'maintenance' or any other string (which corresponds to 'صيانة')
      };
      return rank(a) - rank(b);
    });

    return result;
  };

  const handlePrintDirect = () => {
    const originalStyle = document.createElement('style');
    originalStyle.innerHTML = `
      @media print {
        @page { size: auto; margin: 0; }
        body * {
          visibility: hidden !important;
        }
        #print-preview-area, #print-preview-area * {
          visibility: visible !important;
        }
        #print-preview-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          direction: rtl;
        }
      }
    `;
    document.head.appendChild(originalStyle);
    window.print();
    document.head.removeChild(originalStyle);
  };

  const handleExportPDFAndWhatsApp = async (invoice: Invoice) => {
    const previewItems = getPreviewItems();
    const totalInvoiceCost = previewItems.reduce((sum, item) => sum + Number(item.cost || (Number(item.unitCost || 0) * Number(item.quantity || 1))), 0);
    const currency = invoice.currency || 'USD';

    setIsGeneratingPDF(true);
    let restore: (() => void) | null = null;

    try {
      const element = document.getElementById('print-preview-area');
      if (!element) {
        setIsGeneratingPDF(false);
        return;
      }

      // Sanitize Tailwind CSS styles for html-to-image compatibility
      restore = await sanitizeDocumentStyles();
      sanitizeElementInlineStyles(element);

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
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      const imgWidth = 210;
      const pageHeight = 297;
      
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const formattedDate = new Date().toISOString().split('T')[0];
      const filename = `تقرير الفحص_${invoice.customerName}_${formattedDate}.pdf`;

      pdf.save(filename);

      // WhatsApp text composition
      let message = `*كشف تقرير ومعاينة فحص أجهزة* 🔍📄\n\n`;
      message += `عزيزي العميل *${invoice.customerName}* المحترم،\n`;
      message += `تجد أدناه ملخص تقرير الفحص والتكلفة التقديرية صيانة أجهزتكم الفاتورة رقم *${invoice.invoiceNumber}*:\n\n`;
      message += `- *رقم الفاتورة:* ${invoice.invoiceNumber}\n`;
      message += `- *القيمة الإجمالية المقدرة:* ${totalInvoiceCost.toLocaleString('en-US')} ${currency}\n\n`;
      message += `*جدول الأجهزة وتفاصيل الفحص:*\n`;
      previewItems.forEach((item, index) => {
        const parsed = parseEngineerReport(item.engineerReport || '');
        const displayReport = parsed.outcome || parsed.technical || 'قيد المراجعة';
        message += `\n_${index + 1}. *${item.deviceType} - ${item.deviceName || ''}*_\n`;
        message += `   • تقرير الفحص: ${displayReport}\n`;
        message += `   • التكلفة: ${(item.cost || item.unitCost || 0).toLocaleString('en-US')} ${currency}\n`;
      });
      message += `\nيسعدنا تواصلكم الراقي معنا! وبانتظار ردكم للمتابعة.`;

      let sharedNatively = false;
      try {
        const pdfBlob = pdf.output('blob');
        sharedNatively = await sharePdfFile(pdfBlob, filename, message, 'report');
      } catch (shareErr) {
        console.warn('Native share was skipped:', shareErr);
      }

      if (!sharedNatively) {
        const targetPhone = (invoice as any).customerPhone || getCustomerPhone(invoice.customerId);
        openWhatsApp(message, targetPhone);
      }

    } catch (e) {
      console.error('Failed to export PDF & share WhatsApp:', e);
    } finally {
      if (restore) {
        try {
          restore();
        } catch (restoreErr) {
          console.warn('Failed to restore document styles:', restoreErr);
        }
      }
      setIsGeneratingPDF(false);
    }
  };

  const saveInspectionData = async (actionType: 'none' | 'print' | 'whatsapp') => {
    if (!selectedInvoice || actionItems.length === 0 || !engineerName) return;
    
    // Validation: if repairing, cost must be > 0.
    const isPhase1 = selectedInvoice.status === '21';
    const hasInvalidCost = !isPhase1 && actionItems.some(row => row.decision === 'repairing' && (Number(row.cost) <= 0 || isNaN(Number(row.cost))));
    if (hasInvalidCost) {
      alert('يجب إدخال تكلفة صيانة أكبر من الصفر للأجهزة التي تحتاج إلى صيانة.');
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      let totalCostAdjustment = 0;
      
      // Calculate remaining quantities properly for multiple splits of the same id
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

        const updatedStatus = isPhase1 
          ? '22' 
          : (row.decision === 'intact' ? '50' : row.decision === 'unrepairable' ? '50' : '30');

        const itemSubStatus = isPhase1 
          ? row.decision 
          : (row.decision === 'intact' ? 'intact' : row.decision === 'unrepairable' ? 'unrepairable' : 'maintenance');

        const rowCount = Number(row.count) || 1;
        let rem = itemRemaining.get(originalItem.id!) || 0;

        if (rem > rowCount) {
          // split
          const splitItemRef = doc(collection(db, 'invoice_items'));
          batch.set(splitItemRef, {
            ...originalItem,
            id: splitItemRef.id,
            quantity: rowCount,
            status: updatedStatus,
            subStatus: itemSubStatus,
            source: 'inspection',
            engineerReport: row.report,
            cost: row.decision === 'repairing' ? (Number(row.cost) || 0) : 0,
            technician: engineerName
          });
          
          rem -= rowCount;
          itemRemaining.set(originalItem.id!, rem);
          
          batch.update(doc(db, 'invoice_items', originalItem.id!), {
            quantity: rem,
            updatedAt: serverTimestamp()
          });
          if (row.decision === 'repairing') totalCostAdjustment += Number(row.cost) || 0;
        } else {
          // update fully
          batch.update(doc(db, 'invoice_items', originalItem.id!), {
            status: updatedStatus,
            subStatus: itemSubStatus,
            source: 'inspection',
            quantity: rem,
            engineerReport: row.report,
            cost: row.decision === 'repairing' ? (Number(row.cost) || 0) : 0,
            technician: engineerName,
            updatedAt: serverTimestamp()
          });
          if (row.decision === 'repairing') totalCostAdjustment += Number(row.cost) || 0;
        }
      }

      // Calculate final statuses of all items in this invoice
      const finalItemStatuses: string[] = [];
      for (const row of actionItems) {
        if (!row.id || Number(row.count) <= 0) continue;
        const originalItem = invoiceItems.find(i => i.id === row.id);
        if (!originalItem) continue;
        const updatedStatus = isPhase1 
          ? '22' 
          : (row.decision === 'intact' ? '50' : row.decision === 'unrepairable' ? '50' : '30');
        finalItemStatuses.push(updatedStatus);
      }
      
      const processedItemIds = new Set(actionItems.map(row => row.id));
      const unmodifiedItems = items.filter(it => it.invoiceNumber === selectedInvoice.invoiceNumber && !processedItemIds.has(it.id!));
      unmodifiedItems.forEach(it => {
        finalItemStatuses.push(it.status);
      });

      // Determine overall invoice status
      let finalInvoiceStatus = '50';
      if (selectedInvoice.status === '21') {
        finalInvoiceStatus = '22';
      } else {
        if (finalItemStatuses.some(s => s === '70' || s === 'cancelled')) {
          finalInvoiceStatus = '70';
        } else if (finalItemStatuses.some(s => s === '10' || s === 'new')) {
          finalInvoiceStatus = '10';
        } else if (finalItemStatuses.some(s => s === '20')) {
          finalInvoiceStatus = '20';
        } else if (finalItemStatuses.some(s => s === '21')) {
          finalInvoiceStatus = '21';
        } else if (finalItemStatuses.some(s => s === '22')) {
          finalInvoiceStatus = '22';
        } else if (finalItemStatuses.some(s => s === '30' || s === '35' || s === 'awaiting_approval' || s === 'awaiting_parts')) {
          finalInvoiceStatus = '30';
        } else if (finalItemStatuses.some(s => s === '40' || s === 'repairing')) {
          finalInvoiceStatus = '40';
        }
      }

      batch.update(doc(db, 'invoices', selectedInvoice.id!), {
        status: finalInvoiceStatus,
        totalCost: isPhase1 ? 0 : (selectedInvoice.totalCost || 0) + totalCostAdjustment,
        updatedAt: serverTimestamp()
      });

      // Record maintenance action
      const actionRef = doc(collection(db, 'maintenance_actions'));
      batch.set(actionRef, {
        engineerName,
        actionDate: new Date().getTime(),
        type: 'inspection',
        updates: actionItems.map(r => ({
          itemId: r.id,
          count: r.count,
          cost: r.cost,
          report: r.report
        })),
        userId: user.id || 'unknown',
        userName: user.name || 'System',
        createdAt: serverTimestamp()
      });

      const sanitizedEngName = engineerName.trim().replace(/[\/]/g, '_');
      const engineerRef = doc(db, 'engineers', sanitizedEngName);
      batch.set(engineerRef, { name: engineerName.trim(), updatedAt: serverTimestamp() }, { merge: true });

      await batch.commit();

      if (actionType === 'print') {
        handlePrintDirect();
      } else if (actionType === 'whatsapp') {
        await handleExportPDFAndWhatsApp(selectedInvoice);
      }

      if (selectedInvoice.status === '21') {
        showToast('تم حفظ تقرير فحص المهندس (المرحلة الأولى) بنجاح وتحويل الفاتورة إلى المرحلة الثانية للتعميد والتسعير.');
        setSubTab('phased_inspection');
        setPhasedStage('phase2');
      } else if (selectedInvoice.status === '22') {
        showToast('تم اعتماد الفحص والتسعير (المرحلة الثانية) للمشرف بنجاح للفاتورة.');
        setSubTab('phased_inspection');
        setPhasedStage('phase2');
      } else {
        showToast('تم حفظ وترحيل نتيجة الفحص الفني للتقرير بنجاح.');
        setSubTab('under_inspection');
      }
      setShowPreviewReport(false);
      setSelectedInvoice(null);
    } catch(err) {
      console.error(err);
      alert('حدث خطأ أثناء محاولة حفظ التعديل.');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = actionItems.reduce((acc, it) => acc + (Number(it.cost) || 0), 0);

  if (selectedInvoice) {
    if (showPreviewReport) {
      return (
        <PrintPreviewOverlay
          type="invoice"
          data={{
            invoice: selectedInvoice,
            items: getPreviewItems().map(item => ({
              ...item,
              technicalNotes: item.engineerReport,
              faultType: item.customerProblem || item.faultType,
            })),
            templateType: 'inspection'
          }}
          onClose={() => setShowPreviewReport(false)}
          shopConfig={shopConfig}
          user={user}
          onPrint={() => saveInspectionData('print')}
          onWhatsApp={() => saveInspectionData('whatsapp')}
          onSave={() => saveInspectionData('none')}
          isSaving={loading}
        />
      );
    }

    if (false && showPreviewReport) {
      const previewItems = getPreviewItems();
      const totalInvoiceCost = previewItems.reduce((sum, item) => sum + Number(item.cost || (Number(item.unitCost || 0) * Number(item.quantity || 1))), 0);
      const currencyVal = selectedInvoice.currency || 'USD';
      const customerPhone = getCustomerPhone(selectedInvoice.customerId) || 'غير متوفر';
      const customerCompany = getCustomerCompany(selectedInvoice.customerId) || 'غير متوفر';

      return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999] overflow-y-auto flex items-start justify-center p-2 sm:p-6 md:p-8 font-sans print:p-0 print:bg-white print:relative" dir="rtl">
          <div className="bg-[#141414] border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col my-4 print:border-0 print:my-0 print:shadow-none print:bg-white">
            
            {/* Buttons / Controls hidden during print */}
            <div className="flex items-center justify-between p-4 bg-black/50 border-b border-white/5 print:hidden flex-wrap gap-4 select-none col-span-full">
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setShowPreviewReport(false)}
                  className="p-2.5 rounded-xl bg-slate-200 border border-slate-300 hover:bg-slate-300 text-slate-900 flex items-center transition-all cursor-pointer shadow-md"
                  title="العودة للخلف للمراجعة"
                >
                  <ArrowRight size={20} />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => saveInspectionData('none')}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-[0_0_15px_rgba(5,150,105,0.3)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  <span>حفظ وترحيل</span>
                </button>

                <button 
                  type="button"
                  disabled={loading}
                  onClick={() => saveInspectionData('print')}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16} />}
                  <span>حفظ وطباعة مباشرة</span>
                </button>

                <button 
                  type="button"
                  disabled={loading || isGeneratingPDF}
                  onClick={() => saveInspectionData('whatsapp')}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingPDF ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      جاري تصدير PDF...
                    </>
                  ) : (
                    <>
                      <WhatsAppIcon className="w-5 h-5 text-white" />
                      <span>حفظ وارسال واتس</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Printable Section Box */}
            <div className="overflow-x-auto w-full pb-4 bg-white">
              <div id="print-report-area" className="p-8 bg-white text-gray-900 print:p-0 print:bg-white print:text-black w-[794px] min-h-fit mx-auto">
                  {/* Header Layout */}
                  <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4 mb-4">
                    {/* Right Corner: Shop Name */}
                    <div className="text-right flex-1 pt-1">
                      <h2 className="text-xl font-black text-gray-900 tracking-tight leading-tight font-cairo whitespace-nowrap">{shopConfig?.shopName || 'عالم الصيانة والتجارة'}</h2>
                      <div className="text-sm font-black text-gray-900 tracking-tight leading-tight mt-1.5 font-cairo whitespace-nowrap">قسم الصيانة والتعديل</div>
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
                        <img src={shopConfig.logoUrl} alt="Logo" className="h-16 max-w-[150px] object-contain mb-1.5" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 border border-dashed border-gray-300 rounded-xl mb-1.5 flex items-center justify-center text-gray-400 text-[10px] font-bold font-sans">شعار المحل</div>
                      )}
                      <h1 className="text-lg font-black text-gray-900 tracking-tight border-2 border-gray-900 px-4 py-1.5 rounded-lg inline-block bg-gray-50/50">تقرير فحص</h1>
                    </div>

                    {/* Left Corner: Invoice Info */}
                    <div className="text-left flex-1 space-y-1 pt-1 bg-gray-50/50 p-3 rounded-lg border border-gray-200">
                      <div className="text-sm font-bold text-gray-700 flex justify-between gap-4">
                        <span>رقم الفاتورة:</span>
                        <span className="font-mono text-gray-900">{selectedInvoice.invoiceNumber}</span>
                      </div>
                      <div className="text-sm font-bold text-gray-700 flex justify-between gap-4">
                        <span>التاريخ:</span>
                        <span className="font-mono text-gray-900">
                          {selectedInvoice.createdAt ? (function(){ 
                            const d = parseDate(selectedInvoice.createdAt); 
                            return !d ? '---' : d.toISOString().slice(0,10).replace(/-/g, '/'); 
                          })() : '---'}
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

                  {/* Customer Info Single Line */}
                  <div className="bg-gray-100 p-3 rounded-lg mb-4 border border-gray-300 flex flex-row items-center justify-start gap-6 px-6 text-sm font-black text-gray-900 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-600 ml-2 whitespace-nowrap">إسم العميل:</span>
                      <span className="text-gray-900 font-black">{selectedInvoice.customerName}</span>
                    </div>
                    {customerCompany && customerCompany !== '---' && (
                      <div className="border-r border-gray-300 pr-6 flex items-center">
                        <span className="text-xs text-gray-600 ml-2 whitespace-nowrap">الجهة:</span>
                        <span className="text-gray-900 font-black">{customerCompany}</span>
                      </div>
                    )}
                    {customerPhone && customerPhone !== '---' && (
                      <div className="border-r border-gray-300 pr-6 flex items-center">
                        <span className="text-xs text-gray-600 ml-2 whitespace-nowrap">الجوال:</span>
                        <span className="font-mono text-gray-900" dir="ltr">{customerPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Device Detailed Items Table */}
                  <div className="border border-gray-400 overflow-hidden mb-4 rounded-md">
                    <table className="w-full text-right border-collapse text-sm">
                      <thead className="bg-gray-100 text-gray-800 font-bold border-b-2 border-gray-400">
                        <tr>
                          <th className="px-3 py-3 text-center w-12 border-l border-gray-400 bg-gray-200/50">مسلسل</th>
                          <th className="px-3 py-3 border-l border-gray-400">النوع/الجهاز</th>
                          <th className="px-3 py-3 border-l border-gray-400">تقرير الفحص والمعاينة الفنية</th>
                          <th className="px-3 py-3 text-center border-l border-gray-400">تكلفة الصيانة التقديرية</th>
                          <th className="px-3 py-3 text-center border-l border-gray-400">العدد</th>
                          <th className="px-3 py-3 text-center font-black bg-gray-200/50">اجمالي التكلفة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300">
                        {previewItems.map((item, idx) => {
                          const itemQty = Number(item.quantity || 1);
                          const totalItemCost = Number(item.cost || 0);
                          const unitItemCost = item.unitCost || (itemQty > 0 ? totalItemCost / itemQty : 0);
                          
                          return (
                            <tr key={`${item.id || 'item'}-${idx}`} className="even:bg-gray-50/50">
                              <td className="px-3 py-3 text-center font-mono font-bold border-l border-gray-400 bg-gray-50">{idx + 1}</td>
                              <td className="px-3 py-3 font-bold text-gray-900 border-l border-gray-400 leading-relaxed">
                                {item.deviceType} {item.deviceName ? `- ${item.deviceName}` : ''}
                              </td>
                              <td className="px-3 py-3 text-gray-800 leading-relaxed border-l border-gray-400 whitespace-nowrap overflow-hidden max-w-[200px] text-ellipsis">
                                {item.engineerReport}
                              </td>
                              <td className="px-3 py-3 text-center font-mono text-gray-900 border-l border-gray-400">
                                {unitItemCost.toLocaleString('en-US')}
                              </td>
                              <td className="px-3 py-3 text-center font-mono text-gray-900 border-l border-gray-400">
                                {itemQty}
                              </td>
                              <td className="px-3 py-3 text-center font-mono font-black text-gray-900 bg-gray-50">
                                {totalItemCost.toLocaleString('en-US')}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Last row for totals */}
                        <tr className="bg-gray-200/60 font-bold border-t-2 border-gray-400">
                          <td colSpan={4} className="px-3 py-4 text-left font-black border-l border-gray-400 text-base">الإجمالي</td>
                          <td className="px-3 py-4 text-center font-mono font-black border-l border-gray-400 text-lg">
                            {previewItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0)}
                          </td>
                          <td className="px-3 py-4 text-center font-mono font-black text-xl text-gray-900">
                            {totalInvoiceCost.toLocaleString('en-US')} <span className="text-sm font-sans mr-1">{currencyVal}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Devices Status */}
                  {(() => {
                    const counters = [
                      {
                        key: 'maintenance',
                        label: 'صيانة',
                        value: previewItems.filter(i => i.subStatus !== 'unrepairable' && i.subStatus !== 'intact' && i.subStatus !== 'refused' && i.subStatus !== 'no_parts' && i.subStatus !== 'parts_not_available').reduce((sum, i) => sum + Number(i.quantity || 1), 0),
                        textColor: 'text-gray-900',
                      },
                      {
                        key: 'unrepairable',
                        label: 'لايصلح',
                        value: previewItems.filter(i => i.subStatus === 'unrepairable').reduce((sum, i) => sum + Number(i.quantity || 1), 0),
                        textColor: 'text-rose-600',
                      },
                      {
                        key: 'intact',
                        label: 'سليم',
                        value: previewItems.filter(i => i.subStatus === 'intact').reduce((sum, i) => sum + Number(i.quantity || 1), 0),
                        textColor: 'text-emerald-600',
                      },
                      {
                        key: 'refused',
                        label: 'لم يوافق العميل',
                        value: previewItems.filter(i => i.subStatus === 'refused').reduce((sum, i) => sum + Number(i.quantity || 1), 0),
                        textColor: 'text-orange-600',
                      },
                      {
                        key: 'no_parts',
                        label: 'عدم توفر قطع',
                        value: previewItems.filter(i => i.subStatus === 'no_parts' || i.subStatus === 'parts_not_available').reduce((sum, i) => sum + Number(i.quantity || 1), 0),
                        textColor: 'text-red-700',
                      }
                    ];

                    const activeCounters = counters.filter(c => c.value > 0);
                    if (activeCounters.length === 0) return null;

                    return (
                      <div className="block mt-6 mb-4 text-sm font-bold text-gray-900 text-right overflow-visible">
                        {activeCounters.map((counter, index) => (
                          <div key={counter.key} className="inline-flex items-center gap-2 ml-6 mb-2">
                            {index > 0 && <span className="text-gray-400 font-normal ml-2">|</span>}
                            <div className="inline-flex items-center gap-2">
                              <div className={`w-12 h-8 border-2 border-gray-400 bg-gray-50 rounded flex items-center justify-center font-mono font-black text-base ${counter.textColor}`}>
                                {counter.value}
                              </div>
                              <span>{counter.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="border-t-2 border-gray-900 my-8"></div>

                  {/* Footer Notes & Signatures */}
                  <div className="flex justify-between items-start text-xs font-bold text-gray-900 leading-loose mb-6 px-4">
                    <div className="text-right space-y-1">
                        <p>نرجو منكم الرد خلال 24 ساعة كحد أقصى للمتابعة</p>
                        <p className="pt-6 font-black">توقيع العميل بالموافقة / ........................................</p>
                    </div>

                    <div className="text-left space-y-1">
                        <p className="pt-8">اسم المهندس المختص/.............. التوقيع /.............</p>
                    </div>
                  </div>

                  <div className="border-t-[3px] border-black mt-2 mb-1 border-solid"></div>
                  
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

    const isQuantityInvalid = !currentActionItem.count || 
                              isNaN(Number(currentActionItem.count)) || 
                              Number(currentActionItem.count) <= 0 || 
                              (currentActionItem.id ? Number(currentActionItem.count) > getAvailableQuantity(currentActionItem.id, -1) : true);

    const isSaveDisabled = !currentActionItem.id || 
                           isQuantityInvalid || 
                           !currentActionItem.report.trim() || 
                           (selectedInvoice.status !== '21' && currentActionItem.decision === 'repairing' && (Number(currentActionItem.unitCost) <= 0 || isNaN(Number(currentActionItem.unitCost))));

    return (
      <div className="w-full max-w-full overflow-x-hidden space-y-0 pb-32 md:pb-8" dir="rtl">
        {/* Unified Header */}
        <div className="flex items-center px-4 py-4 border-b border-white/10 bg-[#0a0a0a]/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedInvoice(null)} className="p-1.5 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white border border-purple-500/20 rounded-xl transition-all shadow-md">
              <ArrowRight size={18} />
            </button>
            <h1 className="text-lg font-black text-white m-0 p-0 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-purple-500" />
              فحص - #{selectedInvoice.invoiceNumber}
            </h1>
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-5 border-b border-white/5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-10 -translate-x-10"></div>
          
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
                <UserIcon size={24} />
             </div>
             <div>
               <h3 className="text-xl font-bold">{selectedInvoice.customerName}</h3>
               <p className="text-sm text-gray-500 font-mono">{getCustomerPhone(selectedInvoice.customerId)}</p>
             </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-white/5 relative z-10">
            <div className="flex flex-row items-center gap-4">
              <label className="text-xs text-gray-500 whitespace-nowrap w-24">اسم المهندس</label>
              <input 
                type="text" 
                value={engineerName}
                list="engineers-list"
                onChange={e => setEngineerName(e.target.value)}
                onFocus={(e) => {
                  e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="flex-1 bg-black/40 border border-white/10 px-4 py-3 focus:border-purple-500 outline-none transition-all text-right rounded-xl"
              />
              <datalist id="engineers-list">
                {engineersList.map((eng, idx) => (
                  <option key={idx} value={eng} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-0 sm:px-4 py-4">
          <div className="bg-[#1a1a1a] p-5 sm:p-6 border-y sm:border border-white/5 rounded-none sm:rounded-3xl relative shadow-xl">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
               <h3 className="font-bold text-gray-400">إضافة بيانات الفحص للجهاز</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
                <div className="flex items-center gap-3 flex-1 w-full">
                  <label className="text-xs text-gray-500 whitespace-nowrap w-20">الجهاز</label>
                  <select 
                    value={currentActionItem.id}
                    onChange={e => handleUpdateCurrentField('id', e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 px-4 py-3 focus:border-purple-500 outline-none transition-all rounded-xl"
                  >
                    {invoiceItems.map(it => {
                      const availableForThisRow = getAvailableQuantity(it.id!, -1);
                      if (availableForThisRow <= 0 && currentActionItem.id !== it.id) return null;
                      return <option key={it.id} value={it.id}>{it.deviceType} - {it.deviceName} - متوفر: {availableForThisRow}</option>;
                    })}
                  </select>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <label className="text-xs text-gray-500 whitespace-nowrap w-20 md:w-auto">الكمية المختارة</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={currentActionItem.count}
                    onFocus={e => e.target.select()}
                    onKeyDown={e => {
                      if (['-', '+', '.', 'e', 'E', ',', '`'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={e => {
                      let cleanValStr = e.target.value.replace(/[^0-9]/g, '');
                      if (cleanValStr === '') {
                        handleUpdateCurrentField('count', '');
                        return;
                      }
                      let val = parseInt(cleanValStr, 10);
                      if (isNaN(val)) {
                        handleUpdateCurrentField('count', '');
                        return;
                      }
                      const max = currentActionItem.id ? getAvailableQuantity(currentActionItem.id, -1) : 1;
                      if (val > max) {
                        val = max;
                      }
                      if (val < 1) {
                        val = 1;
                      }
                      handleUpdateCurrentField('count', val);
                    }}
                    onBlur={() => {
                      let val = currentActionItem.count;
                      const max = currentActionItem.id ? getAvailableQuantity(currentActionItem.id, -1) : 1;
                      if (val === '' || isNaN(Number(val)) || Number(val) < 1) {
                        val = Math.max(1, max);
                      } else {
                        val = Math.floor(Number(val));
                        if (val > max) {
                          val = max;
                        }
                        if (val < 1) {
                          val = 1;
                        }
                      }
                      handleUpdateCurrentField('count', val);
                    }}
                    className="w-full md:w-24 bg-black/40 border border-white/10 px-4 py-3 focus:border-purple-500 outline-none transition-all rounded-xl text-center font-bold"
                  />
                </div>
              </div>

              {currentActionItem.id && (() => {
                 const selectedItem = invoiceItems.find(i => i.id === currentActionItem.id);
                 if (!selectedItem) return null;
                 return (
                   <div className="flex flex-col gap-2 bg-black/20 p-3 border border-white/5 rounded-xl">
                     <div className="flex items-start gap-2">
                       <span className="text-[10px] text-gray-500 uppercase font-black ml-2 w-20 shrink-0">شكوى العميل:</span>
                       <span className="text-sm font-bold text-white leading-relaxed">{selectedItem.customerProblem}</span>
                     </div>
                     <div className="flex items-start gap-2 pt-2 border-t border-white/5">
                       <span className="text-[10px] text-gray-500 uppercase font-black ml-2 w-20 shrink-0">ملاحظات:</span>
                       <span className="text-sm font-bold text-gray-300 leading-relaxed">{selectedItem.deviceNotes || 'لا يوجد'}</span>
                     </div>
                   </div>
                 );
              })()}

              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
                 <div className="flex items-center gap-3 flex-1 w-full">
                   <label className="text-xs text-gray-500 whitespace-nowrap w-20">القرار الفني</label>
                   <div className="flex-1 flex bg-black/40 border border-white/5 p-1 rounded-xl gap-1">
                     <button 
                       onClick={() => handleUpdateCurrentField('decision', 'repairing')}
                       className={`flex-1 py-1.5 text-xs font-bold transition-all rounded-lg ${currentActionItem.decision === 'repairing' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
                     >
                       صيانة
                     </button>
                     <button 
                       onClick={() => handleUpdateCurrentField('decision', 'intact')}
                       className={`flex-1 py-1.5 text-xs font-bold transition-all rounded-lg ${currentActionItem.decision === 'intact' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
                     >
                       سليم
                     </button>
                     <button 
                       onClick={() => handleUpdateCurrentField('decision', 'unrepairable')}
                       className={`flex-1 py-1.5 text-xs font-bold transition-all rounded-lg ${currentActionItem.decision === 'unrepairable' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
                     >
                       لا يصلح
                     </button>
                   </div>
                 </div>

                 <div className={`flex-row items-center gap-4 transition-opacity ${currentActionItem.decision !== 'repairing' ? 'opacity-50 pointer-events-none' : ''} w-full ${selectedInvoice?.status === '21' ? 'hidden' : 'flex'} md:w-auto`}>
                   <div className="flex items-center gap-2 flex-1 md:flex-none">
                     <label className="text-xs text-gray-500 whitespace-nowrap">التكلفة للوحدة</label>
                      <input 
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        lang="en"
                        value={Number.isNaN(Number(currentActionItem.unitCost)) ? '' : currentActionItem.unitCost} 
                        onFocus={e => e.target.select()}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          const sanitized = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
                          handleUpdateCurrentField('unitCost', sanitized === '' ? '' : parseFloat(sanitized));
                        }}
                        className="w-full md:w-24 bg-black/40 border border-white/10 px-3 py-2 focus:border-purple-500 outline-none transition-all rounded-xl font-mono text-center"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 flex-1 md:flex-none">
                      <label className="text-xs text-gray-500 whitespace-nowrap">الإجمالي</label>
                      <input 
                        type="text"
                        disabled
                        readOnly
                        dir="ltr"
                        lang="en"
                        value={currentActionItem.cost || 0}
                        className="w-full md:w-24 bg-black/20 border border-white/5 px-3 py-2 text-purple-400 font-bold outline-none cursor-not-allowed rounded-xl font-mono text-center"
                      />
                    </div>
                  </div>
               </div>
                <div className="space-y-4 w-full">
                  <div className="flex items-start gap-3 w-full">
                    <label className="text-xs text-gray-500 whitespace-nowrap w-20 mt-3">التقرير الفني</label>
                    <textarea 
                      value={currentActionItem.technical || ''}
                      onChange={e => {
                        handleUpdateCurrentField('technical', e.target.value);
                      }}
                      onFocus={(e) => {
                        e.target.select();
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      onClick={(e) => {
                        (e.target as HTMLTextAreaElement).select();
                      }}
                      className="flex-1 bg-black/40 border border-white/10 px-4 py-2 focus:border-purple-500 outline-none transition-all h-12 resize-none rounded-xl text-right leading-relaxed"
                      placeholder="أدخل التقرير الفني..."
                    />
                  </div>
                  <div className="flex items-start gap-3 w-full">
                    <label className="text-xs text-gray-500 whitespace-nowrap w-20 mt-3">نتيجة الصيانة</label>
                    <textarea 
                      value={currentActionItem.outcome || ''}
                      onChange={e => {
                        handleUpdateCurrentField('outcome', e.target.value);
                      }}
                      onFocus={(e) => {
                        e.target.select();
                        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      onClick={(e) => {
                        (e.target as HTMLTextAreaElement).select();
                      }}
                      className="flex-1 bg-black/40 border border-white/10 px-4 py-2 focus:border-purple-500 outline-none transition-all h-12 resize-none rounded-xl text-right leading-relaxed"
                      placeholder="أدخل نتيجة الصيانة للعميل..."
                    />
                  </div>
                </div>

              <div className="flex gap-4 mt-4 justify-end border-t border-white/5 pt-4">
                 {editingActionIndex !== null ? (
                   <>
                     <button 
                       onClick={handleCancelEdit}
                       className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl font-bold transition-all text-sm whitespace-nowrap"
                     >
                       إلغاء التعديل
                     </button>
                     <button 
                       onClick={handleSaveCurrentItem}
                       disabled={isSaveDisabled}
                       className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2 rounded-xl font-bold transition-all text-sm shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        تعديل الجهاز
                     </button>
                   </>
                 ) : (
                   <>
                     <button
                       onClick={() => {
                          const availableItem = invoiceItems.find(it => getAvailableQuantity(it.id!, -1) > 0);
                          if (availableItem) {
                            const usedQty = actionItems.reduce((sum, row) => row.id === availableItem.id ? sum + row.count : sum, 0);
                            const remQty = Math.max(0, availableItem.quantity - usedQty);
                            if (selectedInvoice && selectedInvoice.status === '22') {
                              const latestData = getLatestItemData(availableItem.id!, actionItems);
                              if (latestData) {
                                setSyncedCurrentActionItem({
                                  id: availableItem.id!,
                                  count: remQty,
                                  report: latestData.report,
                                  unitCost: latestData.unitCost,
                                  cost: latestData.unitCost * remQty,
                                  decision: latestData.decision
                                });
                              }
                            } else {
                              setSyncedCurrentActionItem({
                                id: availableItem.id!,
                                count: remQty,
                                report: 'الجهاز بحاجة إلى صيانة | تشغيل كامل للجهاز',
                                unitCost: 0,
                                cost: 0,
                                decision: 'repairing'
                              });
                            }
                          }
                       }}
                       className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl font-bold transition-all text-sm whitespace-nowrap"
                     >
                       إلغاء
                     </button>
                     <button 
                       onClick={handleSaveCurrentItem}
                       disabled={isSaveDisabled}
                       className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 rounded-xl font-bold transition-all text-sm shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        إضافة الجهاز
                     </button>
                   </>
                 )}
              </div>
            </div>
          </div>

          {actionItems.length > 0 && (
            <div className="overflow-x-auto border-y sm:border border-white/10 rounded-none sm:rounded-xl mt-6 bg-black/20">
              <table className="w-full text-right text-sm">
                 <thead className="bg-[#1a1a1a] text-gray-400 border-b border-white/10">
                   <tr className="whitespace-nowrap">
                      <th className="px-4 py-4 pr-6 whitespace-nowrap">النوع</th>
                      <th className="px-4 py-4 whitespace-nowrap">إسم الجهاز</th>
                      <th className="px-4 py-4 text-center whitespace-nowrap">الكمية</th>
                      <th className="px-4 py-4 text-center whitespace-nowrap">القرار</th>
                      <th className="px-4 py-4 whitespace-nowrap">تقرير الفحص</th>
                      {selectedInvoice?.status !== '21' && <th className="px-4 py-4 text-center whitespace-nowrap">التكلفة</th>}
                      <th className="px-4 py-4 pl-6 text-center whitespace-nowrap">الإجراءات</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {actionItems.map((item, idx) => {
                     const original = invoiceItems.find(i => i.id === item.id);
                     return (
                       <tr key={idx} className={`hover:bg-white/5 transition-colors whitespace-nowrap ${editingActionIndex === idx ? 'bg-orange-500/10' : ''}`}>
                         <td className="px-4 py-3 pr-6 font-bold whitespace-nowrap">{original?.deviceType || '---'}</td>
                         <td className="px-4 py-3 font-medium whitespace-nowrap">{original?.deviceName || '---'}</td>
                         <td className="px-4 py-3 text-gray-300 text-center whitespace-nowrap">{item.count}</td>
                         <td className="px-4 py-3 text-center whitespace-nowrap">
                           {item.decision === 'repairing' && <span className="text-orange-500 bg-orange-500/10 px-2 py-1 rounded text-[10px] font-bold">صيانة</span>}
                           {item.decision === 'intact' && <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded text-[10px] font-bold">سليم</span>}
                           {item.decision === 'unrepairable' && <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded text-[10px] font-bold">لا يصلح</span>}
                         </td>
                         <td className="px-4 py-3 text-gray-300 max-w-[250px] truncate whitespace-nowrap text-right" title={item.report}>
                            {(() => {
                              const { technical, outcome } = parseEngineerReport(item.report);
                              return (
                                <div className="flex flex-col">
                                  <span className="text-gray-200 text-xs truncate max-w-[250px]">{technical}</span>
                                  {outcome && <span className="text-purple-400 text-[10px] font-bold truncate max-w-[250px]">النتيجة: {outcome}</span>}
                                </div>
                              );
                            })()}
                          </td>
                         {selectedInvoice?.status !== '21' && <td className="px-4 py-3 text-purple-400 font-bold text-center whitespace-nowrap font-mono">{item.cost > 0 ? `${item.cost.toLocaleString('en-US')} ${selectedInvoice.currency || 'USD'}` : '-'}</td>}
                         <td className="px-4 py-3 pl-6 flex items-center justify-center gap-2 whitespace-nowrap">
                           <button onClick={() => handleEditRow(idx)} className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors whitespace-nowrap">
                             تعديل
                           </button>
                           <button onClick={() => handleRemoveRow(idx)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors whitespace-nowrap">
                             حذف
                           </button>
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
              </table>
            </div>
          )}

          {selectedInvoice?.status !== '21' && (
            <div className="flex bg-purple-600/10 border-y sm:border border-purple-600/30 p-5 sm:p-8 rounded-none sm:rounded-[2.5rem] items-center justify-between shadow-2xl mt-6">
              <div>
                <p className="text-purple-500 text-sm font-black uppercase tracking-widest">إجمالي التكلفة التقديرية</p>
              </div>
              <div>
                <p className="text-4xl font-black font-mono text-white">
                  {totalCost} <span className="text-base font-sans text-purple-500 rtl:ml-2">{selectedInvoice?.currency || 'USD'}</span>
                </p>
              </div>
            </div>
          )}

          <div className="px-4 sm:px-0 py-4 mb-8" dir="rtl">
             <button 
               onClick={() => {
                 if (!engineerName.trim()) {
                   alert('الرجاء كتابة أو اختيار اسم المهندس الفاحص أوللاً لتوليد ومعاينة التقرير.');
                   return;
                 }
                 setShowPreviewReport(true);
               }}
               disabled={loading || !engineerName.trim() || actionItems.length === 0 || actionItems.some((r, idx) => r.count <= 0 || r.unitCost < 0 || r.count > getAvailableQuantity(r.id, idx))}
               className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-4 font-black transition-all flex items-center justify-center gap-2 rounded-2xl shadow-xl"
             >
               <Search size={20} />
               المعاينة للتعديل
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6 pb-20 relative" dir="rtl">
      {/* Toast Alert Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -track-x-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4 text-right"
          >
            <div className="bg-emerald-600 border border-emerald-500 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <Check size={20} className="shrink-0" />
                <span className="text-sm font-bold">{toastMessage}</span>
              </div>
              <button onClick={() => setToastMessage(null)} className="w-6 h-6 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all border border-red-500/20 group">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Large Purple Dual Stats Counter Card */}
      <div className="px-0">
        <div className="w-full bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white p-6 rounded-none sm:rounded-[2rem] shadow-lg relative overflow-hidden">
          {/* Faint Background Icon */}
          <div className="absolute top-1/2 left-6 -translate-y-1/2 opacity-10 pointer-events-none">
            <SearchIcon size={160} />
          </div>

          <div className="relative z-10 grid grid-cols-3 divide-x divide-white/15 rtl:divide-x-reverse">
            {/* Clickable section 1: New Devices */}
            <button
              onClick={() => {
                setSubTab('new_devices');
                setSelectedInvoice(null);
              }}
              className={`flex flex-col items-center justify-center py-4 px-2 transition-all rounded-2xl relative cursor-pointer ${
                subTab === 'new_devices' 
                  ? 'bg-white/15 shadow-inner scale-[1.02]' 
                  : 'hover:bg-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              {subTab === 'new_devices' && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              )}
              <span className="text-3xl sm:text-5xl font-black font-mono tracking-wider drop-shadow-md">{countNewDevices}</span>
              <span className="text-xs sm:text-sm font-bold font-cairo mt-2 text-purple-100">أجهزة جديدة</span>
              <span className="text-[10px] text-purple-200 mt-1 opacity-70">بانتظار الفحص</span>
            </button>

            {/* Clickable section 2: Under Inspection Devices */}
            <button
              onClick={() => {
                setSubTab('under_inspection');
                setSelectedInvoice(null);
              }}
              className={`flex flex-col items-center justify-center py-4 px-2 transition-all rounded-2xl relative cursor-pointer ${
                subTab === 'under_inspection' 
                  ? 'bg-white/15 shadow-inner scale-[1.02]' 
                  : 'hover:bg-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              {subTab === 'under_inspection' && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              )}
              <span className="text-3xl sm:text-5xl font-black font-mono tracking-wider drop-shadow-md">{countInspectionDevices}</span>
              <span className="text-xs sm:text-sm font-bold font-cairo mt-2 text-purple-100">أجهزة قيد الفحص</span>
              <span className="text-[10px] text-purple-200 mt-1 opacity-70">المرحلة الواحدة</span>
            </button>

            {/* Clickable section 3: Phased Inspection Devices */}
            <button
              onClick={() => {
                setSubTab('phased_inspection');
                setSelectedInvoice(null);
              }}
              className={`flex flex-col items-center justify-center py-4 px-2 transition-all rounded-2xl relative cursor-pointer ${
                subTab === 'phased_inspection' 
                  ? 'bg-white/15 shadow-inner scale-[1.02]' 
                  : 'hover:bg-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              {subTab === 'phased_inspection' && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              )}
              <span className="text-3xl sm:text-5xl font-black font-mono tracking-wider drop-shadow-md">{countPhasedDevices}</span>
              <span className="text-xs sm:text-sm font-bold font-cairo mt-2 text-purple-100">أجهزة قيد فحص مرحلي</span>
              <span className="text-[10px] text-purple-200 mt-1 opacity-70">فحص وتعميد على مرحلتين</span>
            </button>
          </div>
        </div>
      </div>



      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-2">
        <div className="w-full sm:w-80">
          <CustomerAutocomplete
            customers={customers}
            onSelect={(c) => setSearch(c.name)}
            placeholder={t('common.search', 'Search...')}
            initialValue={search}
          />
        </div>
      </div>

      {subTab === 'phased_inspection' && (
        <div className="grid grid-cols-2 gap-4 px-2">
          {/* Phase 1 card */}
          <button
            onClick={() => setPhasedStage('phase1')}
            className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
              phasedStage === 'phase1'
                ? 'bg-purple-600/10 border-purple-500 text-purple-400'
                : 'bg-[#1a1a1a] border-white/5 text-gray-400 hover:border-white/10'
            }`}
          >
            <div>
              <p className="text-xs text-gray-500 font-bold">فحص مرحلة أولى</p>
              <h3 className="text-sm font-black font-cairo mt-1">تقرير المهندس (بدون سعر)</h3>
            </div>
            <div className="text-2xl font-black font-mono">{countPhase1Devices}</div>
          </button>

          {/* Phase 2 card */}
          <button
            onClick={() => setPhasedStage('phase2')}
            className={`p-4 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
              phasedStage === 'phase2'
                ? 'bg-purple-600/10 border-purple-500 text-purple-400'
                : 'bg-[#1a1a1a] border-white/5 text-gray-400 hover:border-white/10'
            }`}
          >
            <div>
              <p className="text-xs text-gray-500 font-bold">مرحلة ثانية</p>
              <h3 className="text-sm font-black font-cairo mt-1">التعميد والتسعير من المشرف</h3>
            </div>
            <div className="text-2xl font-black font-mono">{countPhase2Devices}</div>
          </button>
        </div>
      )}

      <div className="bg-[#1a1a1a] border-y border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right select-none">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 text-[9px] sm:text-[10px]">
              <tr>
                <th className="px-2 py-2 font-bold text-center whitespace-nowrap"># الفاتورة</th>
                <th className="px-2 py-2 font-bold text-right">اسم العميل</th>
                <th className="px-2 py-2 font-bold text-center whitespace-nowrap">عدد الأجهزة</th>
                <th className="px-2 py-2 font-bold text-center whitespace-nowrap">اختيار الإجراء</th>
                <th className="px-2 py-2 font-bold text-center whitespace-nowrap">العملية والتقديم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[10px] sm:text-xs">
              {currentInvoices.map(invoice => {
                const currentChoice = selectedOptions[invoice.id!] || 'action1';
                return (
                  <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-2 py-2 font-mono text-white text-center whitespace-nowrap">{invoice.invoiceNumber}</td>
                    <td className="px-2 py-2 font-bold truncate">{invoice.customerName || getCustomerName(invoice.customerId)}</td>
                    <td className="px-2 py-2 font-mono text-purple-400 font-bold text-center whitespace-nowrap">
                      {subTab === 'new_devices' 
                        ? getNewDevicesCount(invoice.invoiceNumber) 
                        : subTab === 'under_inspection' 
                        ? getInspectionDevicesCount(invoice.invoiceNumber)
                        : countPhasedInvoicesCount(invoice.invoiceNumber, phasedStage === 'phase1' ? '21' : '22')}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300">
                          <input
                            type="radio"
                            name={`action-${invoice.id}`}
                            checked={currentChoice === 'action1'}
                            onChange={() => setSelectedOptions(prev => ({ ...prev, [invoice.id!]: 'action1' }))}
                            className="accent-purple-600 w-4 h-4 sm:w-5 sm:h-5 cursor-pointer ring-1 ring-purple-300 dark:ring-purple-700 rounded-full"
                          />
                          <span>{subTab === 'new_devices' ? 'دخول فحص' : subTab === 'phased_inspection' ? 'معاينة واعتماد' : 'إجراء فحص'}</span>
                        </label>
                        {subTab === 'under_inspection' && (
                          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] sm:text-xs font-bold text-amber-500 dark:text-amber-400">
                            <input
                              type="radio"
                              name={`action-${invoice.id}`}
                              checked={currentChoice === 'action3'}
                              onChange={() => setSelectedOptions(prev => ({ ...prev, [invoice.id!]: 'action3' }))}
                              className="accent-amber-500 w-4 h-4 sm:w-5 sm:h-5 cursor-pointer ring-1 ring-amber-300 dark:ring-amber-700 rounded-full"
                            />
                            <span>تحويل لفحص مرحلي</span>
                          </label>
                        )}
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-[10px] sm:text-xs font-bold text-red-600 dark:text-red-400">
                          <input
                            type="radio"
                            name={`action-${invoice.id}`}
                            checked={currentChoice === 'action2'}
                            onChange={() => setSelectedOptions(prev => ({ ...prev, [invoice.id!]: 'action2' }))}
                            className="accent-red-600 w-4 h-4 sm:w-5 sm:h-5 cursor-pointer ring-1 ring-red-300 dark:ring-red-700 rounded-full"
                          />
                          <span>إلغاء</span>
                        </label>
                      </div>
                    </td>
                    <td className="px-1 py-1.5 text-center whitespace-nowrap">
                      <button 
                        onClick={() => handleExecuteAction(invoice)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all inline-flex items-center justify-center gap-1 ${
                          currentChoice === 'action2' 
                            ? 'bg-rose-600/15 hover:bg-rose-600 text-rose-500 hover:text-white' 
                            : currentChoice === 'action3'
                            ? 'bg-amber-600/15 hover:bg-amber-600 text-amber-500 hover:text-white'
                            : 'bg-purple-600/15 hover:bg-purple-600 text-purple-500 hover:text-white'
                        }`}
                      >
                        تنفيذ <ArrowUpRight size={10} className="rtl:-scale-x-100" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Empty States */}
              {activeInvoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-8 text-center text-[10px] text-gray-500 font-bold">
                    {subTab === 'new_devices' 
                      ? 'لا يوجد أجهزة جديدة بانتظار دخول الفحص.' 
                      : subTab === 'under_inspection' 
                      ? 'لا توجد أجهزة قيد الفحص حالياً.' 
                      : 'لا توجد أجهزة قيد فحص مرحلي في هذه المرحلة حالياً.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-black/20">
            <span className="text-xs text-gray-500 font-bold font-cairo">
              عرض {((safeCurrentPage - 1) * itemsPerPage) + 1} إلى {Math.min(safeCurrentPage * itemsPerPage, activeInvoices.length)} من أصل {activeInvoices.length} فاتورة
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
                        ? 'bg-purple-500 text-black shadow-lg shadow-purple-500/20' 
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

      {/* Cancel operation Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && selectedInvoiceForCancel && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={() => {
                setShowCancelModal(false);
                setSelectedInvoiceForCancel(null);
              }}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-[#1a1a1a] border border-white/10 p-6 w-full max-w-lg rounded-[2rem] shadow-2xl space-y-6 text-right"
              dir="rtl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-3 font-semibold text-rose-500" dir="rtl">
                <div className="flex items-center gap-2 font-black">
                  <AlertTriangle size={20} />
                  <span>إجراء إلغاء العملية وسحب الأجهزة (كود 70)</span>
                </div>
                <button 
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedInvoiceForCancel(null);
                  }}
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Device Information Card */}
              <div className="bg-black/45 p-4 rounded-2xl border border-white/5 space-y-3 text-xs text-gray-300" dir="rtl">
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div>
                    <span className="text-gray-500 block mb-0.5">رقم الفاتورة</span>
                    <span className="text-sm font-bold text-white font-mono">#{selectedInvoiceForCancel.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">شفرة العميل</span>
                    <span className="text-sm font-bold text-white font-mono">{getCustomerNumber(selectedInvoiceForCancel.customerId)}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-white/5 text-right">
                    <span className="text-gray-500 block mb-0.5">اسم العميل</span>
                    <span className="text-sm font-bold text-rose-400">{selectedInvoiceForCancel.customerName}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-white/5 flex justify-between">
                    <div>
                      <span className="text-gray-500 block mb-0.5">هاتف العميل</span>
                      <span className="text-sm font-bold text-white font-mono">{getCustomerPhone(selectedInvoiceForCancel.customerId)}</span>
                    </div>
                    <div className="text-left font-sans">
                      <span className="text-gray-500 block mb-0.5">العدد الإجمالي للأجهزة</span>
                      <span className="text-sm font-black text-rose-400 font-mono">
                        {items.filter(it => it.invoiceNumber === selectedInvoiceForCancel.invoiceNumber).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)} أجهزة
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Area for Cause notes */}
              <div className="space-y-2" dir="rtl">
                <label className="text-xs font-bold text-gray-400 block text-right">سبب إلغاء العملية والانسحاب من الصيانة:</label>
                <textarea
                  rows={4}
                  value={cancelNotes}
                  onChange={e => setCancelNotes(e.target.value)}
                  placeholder="اكتب بالتفصيل سبب إلغاء الفاتورة من قبل مدخل البيانات أو رغبة العميل في الانسحاب وسحب الأجهزة..."
                  className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-right transition-all text-white placeholder-gray-600 leading-relaxed"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-2" dir="rtl">
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedInvoiceForCancel(null);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold border border-white/5 cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  disabled={loadingCancel}
                  onClick={handleConfirmCancel}
                  className="px-6 py-2 bg-gradient-to-l from-rose-600 to-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-500/10 hover:from-rose-500 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {loadingCancel ? 'جاري تنفيذ المسار...' : 'تنفيذ إجراء إلغاء الفاتورة وكود 70'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
