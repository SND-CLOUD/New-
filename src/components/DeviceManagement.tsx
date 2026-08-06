import React, { useState, useEffect } from 'react';
import { parseDate } from '../lib/dateUtils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, ChevronLeft, Activity, CheckCircle, PackageCheck, 
  X, AlertTriangle, ArrowRight, LogOut, User as UserIcon, 
  Eye, Info, Calendar, DollarSign, Hash, Phone, Clock, Search as SearchIcon, ArrowLeft,
  Plus, Trash2, ArrowUpDown, RefreshCw, ShieldAlert, Check
} from 'lucide-react';
import { collection, onSnapshot, doc, writeBatch, serverTimestamp, setDoc, getDoc } from '../firebase';
import { db } from '../firebase';
import { Invoice, InvoiceItem, User, Customer, OperationType, ShopConfig } from '../types';
import { useTranslation } from 'react-i18next';
import { handleFirestoreError } from '../lib/error-handler';
import PrintPreviewOverlay from './PrintPreviewOverlay';
import { usePermissions } from '../hooks/usePermissions';
import { localDb } from '../lib/local-db';
import { ProviderFactory } from '../data/ProviderFactory';

import DeviceExit from './entry-exit/DeviceExit';
import Inspection from './movement/Inspection';
import ApprovalAndParts from './movement/ApprovalAndParts';
import Maintenance from './movement/Maintenance';
import { useBackHandler } from '../hooks/useBackHandler';

export default function DeviceManagement({ user, onBack, shopConfig }: { user: User; onBack: () => void; shopConfig: ShopConfig | null }) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions(user);
  
  // Navigation State
  const [subview, setSubview] = useState<'hub' | 'active_devices' | 'ready_exit' | 'delivered' | 'inspection_form' | 'approval_form' | 'maintenance_form' | 'admin_correction' | 'admin_correction_action'>('hub');

  useBackHandler(subview !== 'hub', () => {
    if (subview === 'admin_correction_action') setSubview('admin_correction');
    else if (['inspection_form', 'approval_form', 'maintenance_form'].includes(subview)) setSubview('active_devices');
    else setSubview('hub');
  });

  
  // Admin Correction States
  const [selectedInvoiceForAdmin, setSelectedInvoiceForAdmin] = useState<Invoice | null>(null);
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month' | 'custom' | 'all'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [adminInvoiceSearch, setAdminInvoiceSearch] = useState<string>('');
  
  // Custom columns and interaction governance states
  const [adminDetailedModes, setAdminDetailedModes] = useState<Record<string, boolean>>({});
  const [adminInvoiceStatuses, setAdminInvoiceStatuses] = useState<Record<string, string>>({});
  const [stagedChanges, setStagedChanges] = useState<Array<{
    id?: string;
    isNew: boolean;
    deviceType: string;
    deviceName: string;
    faultType: string;
    quantity: number;
    unitCost: number;
    status: string;
  }>>([]);
  const [reversalConfirmData, setReversalConfirmData] = useState<{
    invoice: Invoice;
    newStatus: string;
    transactionsToReverse: any[];
    isDetailed: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Detailed view form inputs state
  const [detailedSelectType, setDetailedSelectType] = useState<string>('NEW_DEVICE');
  const [detailedDeviceType, setDetailedDeviceType] = useState<string>('');
  const [detailedDeviceName, setDetailedDeviceName] = useState<string>('');
  const [detailedFaultType, setDetailedFaultType] = useState<string>('');
  const [detailedQuantity, setDetailedQuantity] = useState<number>(1);
  const [detailedPrice, setDetailedPrice] = useState<number>(0);
  const [detailedStatus, setDetailedStatus] = useState<string>('10');

  // Admin device update form states
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<InvoiceItem | null>(null);
  const [adminNewStatus, setAdminNewStatus] = useState<string>('');
  const [adminNewQuantity, setAdminNewQuantity] = useState<number>(1);
  const [adminNewPrice, setAdminNewPrice] = useState<number>(0);
  const [adminSaveLoading, setAdminSaveLoading] = useState<boolean>(false);
  const [adminCorrectionScope, setAdminCorrectionScope] = useState<'device' | 'invoice'>('device');

  const ALL_STATUSES = [
    { value: '10', label: 'دخول جديد (New Entry)' },
    { value: '20', label: 'قيد الفحص / التشخيص' },
    { value: '30', label: 'إنتظار موافقة العميل (Awaiting Approval)' },
    { value: 'approved', label: 'تمت موافقة العميل (Approved)' },
    { value: '35', label: 'بانتظار قطع الغيار (Awaiting Parts)' },
    { value: 'parts_available', label: 'تم توفير قطع الغيار (Parts Available)' },
    { value: 'parts_not_available', label: 'لم تتوفر قطع الغيار (Parts Unavailable)' },
    { value: '40', label: 'قيد الصيانة (Under Maintenance)' },
    { value: '50', label: 'جاهز للتسليم (Ready)' },
    { value: 'intact', label: 'سليم بدون صيانة (Intact)' },
    { value: 'unrepairable', label: 'غير قابل للإصلاح (Unrepairable)' },
    { value: 'refused', label: 'مرفوض من العميل (Refused)' },
    { value: '60', label: 'تم تسليمها ومغادرتها (Delivered)' },
    { value: '70', label: 'إلغاء العملية وسحب الأجهزة (Cancelled/Withdrawn)' }
  ];

  const EDIT_OPTIONS_STATUSES = [
    { value: '10', label: 'دخول جديد' },
    { value: '20', label: 'قيد الفحص والتشخيص' },
    { value: '30', label: 'إنتظار موافقة العميل' },
    { value: 'approved', label: 'تمت موافقة العميل (البدء في الصيانة)' },
    { value: '35', label: 'بانتظار قطع الغيار' },
    { value: 'parts_available', label: 'تم توفير قطع الغيار (البدء في الصيانة)' },
    { value: 'parts_not_available', label: 'لم تتوفر قطع الغيار (تحويل للتسليم)' },
    { value: '40', label: 'قيد الصيانة' },
    { value: '50', label: 'جاهز للتسليم (إصلاح كامل)' },
    { value: 'intact', label: 'سليم بدون صيانة' },
    { value: 'unrepairable', label: 'غير قابل للإصلاح' },
    { value: 'refused', label: 'مرفوض من العميل' },
    { value: '60', label: 'تم تسليمها ومغادرتها' },
    { value: '70', label: 'إلغاء العملية وسحب الأجهزة' }
  ];
  
  // DB State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Active Devices State
  const [selectedOptions, setSelectedOptions] = useState<Record<string, 'action1' | 'action2'>>({});
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeSearch, setActiveSearch] = useState('');
  
  // Cancel operation Form Modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelNotes, setCancelNotes] = useState('');
  const [loadingCancel, setLoadingCancel] = useState(false);

  // Delivered Invoice Preview Modal
  const [activePreviewInvoice, setActivePreviewInvoice] = useState<Invoice | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Real-time Listeners
  useEffect(() => {
    setCurrentPage(1);
  }, [subview, activeSearch]);

  useEffect(() => {
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (s) => {
      setInvoices(s.docs.map(d => ({ id: d.id, ...d.data() } as Invoice)));
    });
    const unsubItems = onSnapshot(collection(db, 'invoice_items'), (s) => {
      setItems(s.docs.map(d => ({ id: d.id, ...d.data() } as InvoiceItem)));
    });
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (s) => {
      setCustomers(s.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
    });
    return () => {
      unsubInvoices();
      unsubItems();
      unsubCustomers();
    };
  }, []);

  const getCustomerPhone = (customerId: string) => {
    const c = customers.find(cust => cust.id === customerId);
    return c ? c.phone1 : '---';
  };

  const getCustomerNum = (customerId: string) => {
    const c = customers.find(cust => cust.id === customerId);
    return c ? String(c.customerNumber || '---') : '---';
  };

  const getDevicesCount = (invoiceNumber: string) => {
    return items
      .filter(item => item.invoiceNumber === invoiceNumber)
      .reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Filter Active Devices (new/10, inspected/20, approval/30, parts/35, maintenance/40)
  const ACTIVE_STATUSES = ['10', 'new', '20', 'inspected', 'testing', '30', 'awaiting_approval', '35', 'awaiting_parts', '40', 'repairing'];
  const activeInvoicesFiltered = invoices
    .filter(inv => {
      const isStatusActive = ACTIVE_STATUSES.includes(inv.status);
      const isSearchMatch = 
        inv.customerName.toLowerCase().includes(activeSearch.toLowerCase()) ||
        inv.invoiceNumber.includes(activeSearch);
      return isStatusActive && isSearchMatch;
    })
    .sort((a, b) => Number(b.invoiceNumber) - Number(a.invoiceNumber));

  // 2. Filter Delivered Devices (60)
  const deliveredInvoicesFiltered = invoices
    .filter(inv => {
      const isDelivered = inv.status === '60';
      const isSearchMatch = 
        inv.customerName.toLowerCase().includes(activeSearch.toLowerCase()) ||
        inv.invoiceNumber.includes(activeSearch);
      return isDelivered && isSearchMatch;
    })
    .sort((a, b) => Number(b.invoiceNumber) - Number(a.invoiceNumber));

  const activeData = subview === 'delivered' ? deliveredInvoicesFiltered : activeInvoicesFiltered;
  const totalPages = Math.max(1, Math.ceil(activeData.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentInvoices = activeData.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  // Initialize Row Choices
  useEffect(() => {
    const newOptions = { ...selectedOptions };
    activeInvoicesFiltered.forEach(inv => {
      if (!newOptions[inv.id!]) {
        newOptions[inv.id!] = 'action1'; // Default action 1 is selected
      }
    });
    setSelectedOptions(newOptions);
  }, [invoices]);

  // Execute choice for a single row
  const handleExecuteAction = async (invoice: Invoice) => {
    const choice = selectedOptions[invoice.id!] || 'action1';
    
    if (choice === 'action2') {
      // cancel operation modal
      setSelectedInvoice(invoice);
      setCancelNotes('');
      setShowCancelModal(true);
      return;
    }

    // Process Action 1 pathways
    const currentStatus = invoice.status;
    
    if (currentStatus === '10' || currentStatus === 'new') {
      // Transition directly to Under Inspection '20'
      try {
        const batch = writeBatch(db);
        const invRef = doc(db, 'invoices', invoice.id!);
        batch.update(invRef, {
          status: '20',
          updatedAt: serverTimestamp()
        });

        // Also update items
        const invoiceItems = items.filter(i => i.invoiceNumber === invoice.invoiceNumber);
        invoiceItems.forEach(item => {
          batch.update(doc(db, 'invoice_items', item.id!), {
            status: '20',
            technician: item.technician || user?.name || user?.username || 'System',
            updatedAt: serverTimestamp()
          });
        });

        await batch.commit();
        showToast(`تم تحويل الفاتورة #${invoice.invoiceNumber} بنجاح إلى قيد الفحص.`);
      } catch (err) {
        console.error(err);
        showToast('فشل في تعديل حالة الأجهزة.');
      }
    } else if (currentStatus === '20' || currentStatus === 'inspected' || currentStatus === 'testing') {
      // Open traditional Inspection form matching status 20
      setSelectedInvoice(invoice);
      setSubview('inspection_form');
    } else if (currentStatus === '30' || currentStatus === 'awaiting_approval' || currentStatus === '35' || currentStatus === 'awaiting_parts') {
      // Open approvals & parts page for invoice status 30 / 35
      setSelectedInvoice(invoice);
      setSubview('approval_form');
    } else if (currentStatus === '40' || currentStatus === 'repairing') {
      // Open maintenance actions page for invoice status 40
      setSelectedInvoice(invoice);
      setSubview('maintenance_form');
    }
  };

  // Composing Cancel Operation Confirmation
  const handleConfirmCancel = async () => {
    if (!selectedInvoice) return;
    if (!cancelNotes.trim()) {
      alert('الرجاء كتابة سبب إلغاء العملية والانسحاب لتسجيل الإجراء.');
      return;
    }

    setLoadingCancel(true);
    try {
      const batch = writeBatch(db);
      
      // Update invoice as Cancelled '70' with reason
      batch.update(doc(db, 'invoices', selectedInvoice.id!), {
        status: '70',
        cancelReason: cancelNotes,
        updatedAt: serverTimestamp()
      });

      // Update all items of this invoice to status 70/cancelled with cancel notes stored in failureReason
      const invoiceItems = items.filter(i => i.invoiceNumber === selectedInvoice.invoiceNumber);
      invoiceItems.forEach(item => {
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
      showToast(`تم إلغاء فاتورة العميل بنجاح ونقله لصفحة الخروج.`);
      
      // Transition directly to Exit page as requested
      setSubview('ready_exit');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إجراء محاولة إلغاء وحفظ العملية.');
    } finally {
      setLoadingCancel(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case '10':
      case 'new':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case '20':
      case 'inspected':
      case 'testing':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case '30':
      case 'awaiting_approval':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'approved':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case '35':
      case 'awaiting_parts':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'parts_available':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'parts_not_available':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case '40':
      case 'repairing':
        return 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20';
      case '50':
      case 'ready':
      case 'intact':
      case 'unrepairable':
      case 'refused':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case '60':
      case 'delivered':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case '70':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-white/5';
    }
  };

  const getStatusTextArabic = (status: string) => {
    switch(status) {
      case '10':
      case 'new':
        return 'دخول جديد';
      case '20':
      case 'inspected':
      case 'testing':
        return 'قيد الفحص';
      case '30':
      case 'awaiting_approval':
        return 'إنتظار موافقة العميل';
      case 'approved':
        return 'تمت موافقة العميل';
      case '35':
      case 'awaiting_parts':
        return 'انتظار قطع الغيار';
      case 'parts_available':
        return 'تم توفير قطع الغيار';
      case 'parts_not_available':
        return 'لم تتوفر قطع الغيار';
      case '40':
      case 'repairing':
        return 'قيد الصيانة';
      case '50':
      case 'ready':
      case 'intact':
      case 'unrepairable':
      case 'refused':
        return 'جاهز للتسليم';
      case '60':
      case 'delivered':
        return 'تم التسليم والمغادرة';
      case '70':
        return 'إلغاء وسحب الجهاز';
      default:
        return 'غير محدد';
    }
  };

  const parseFirestoreDate = (val: any): Date | null => {
    return parseDate(val);
  };

  const getFilteredInvoicesForAdmin = () => {
    return invoices.filter(inv => {
      // 1. Filter by invoice search if provided
      if (adminInvoiceSearch.trim()) {
        const searchLower = adminInvoiceSearch.trim().toLowerCase();
        const matchesInvoiceNum = inv.invoiceNumber && inv.invoiceNumber.includes(searchLower);
        const matchesCustomer = inv.customerName && inv.customerName.toLowerCase().includes(searchLower);
        return matchesInvoiceNum || matchesCustomer;
      }
      
      if (timeFilter === 'all') {
        return true;
      }
      
      // 2. Otherwise apply date filter to invoice creation time
      if (!inv.createdAt) return false;
      const createdAtDate = parseFirestoreDate(inv.createdAt);
      if (!createdAtDate) return false;
      
      const now = new Date();
      
      if (timeFilter === 'day') {
        return (
          createdAtDate.getFullYear() === now.getFullYear() &&
          createdAtDate.getMonth() === now.getMonth() &&
          createdAtDate.getDate() === now.getDate()
        );
      } else if (timeFilter === 'week') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return createdAtDate >= sevenDaysAgo;
      } else if (timeFilter === 'month') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return createdAtDate >= thirtyDaysAgo;
      } else if (timeFilter === 'custom') {
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          return createdAtDate >= start && createdAtDate <= end;
        }
        return true; // if dates are empty in custom view, show all
      }
      return true;
    }).sort((a, b) => Number(b.invoiceNumber || 0) - Number(a.invoiceNumber || 0));
  };

  const handleAdminSaveDevice = async () => {
    if (!selectedInvoiceForAdmin) return;
    if (adminCorrectionScope === 'device' && !selectedItemForEdit) return;
    
    setAdminSaveLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Determine final Firestore status & subStatus & failureReason to store based on custom admin key
      let finalStatus = adminNewStatus;
      let finalSubStatus = '';
      let additionalFields: any = {};

      if (adminNewStatus === 'approved') {
        finalStatus = '40';
        finalSubStatus = 'repairing';
        additionalFields.source = 'admin_approved';
      } else if (adminNewStatus === 'parts_available') {
        finalStatus = '40';
        finalSubStatus = 'repairing';
        additionalFields.source = 'parts_available';
      } else if (adminNewStatus === 'parts_not_available') {
        finalStatus = '50';
        finalSubStatus = 'refused';
        additionalFields.failureReason = 'لم تتوفر قطع الغيار';
        additionalFields.source = 'parts_not_available';
      } else {
        // Handle common defaults cleanly
        if (['10', 'new'].includes(adminNewStatus)) {
          finalSubStatus = '';
        } else if (['20', 'inspected', 'testing'].includes(adminNewStatus)) {
          finalSubStatus = 'testing';
        } else if (['30', 'awaiting_approval'].includes(adminNewStatus)) {
          finalSubStatus = 'awaiting_approval';
        } else if (['35', 'awaiting_parts'].includes(adminNewStatus)) {
          finalSubStatus = 'awaiting_parts';
        } else if (['40', 'repairing'].includes(adminNewStatus)) {
          finalSubStatus = 'repairing';
        } else if (['50', 'ready', 'intact', 'unrepairable', 'refused'].includes(adminNewStatus)) {
          finalSubStatus = adminNewStatus === '50' ? 'ready' : adminNewStatus;
        } else if (['60', 'delivered'].includes(adminNewStatus)) {
          finalSubStatus = 'delivered';
        }
      }

      let totalCostOfInvoice = 0;
      let allItemStatuses: string[] = [];

      const currentInvoiceItems = items.filter(it => it.invoiceNumber === selectedInvoiceForAdmin.invoiceNumber);

      if (adminCorrectionScope === 'device' && selectedItemForEdit) {
        const itemCost = Number(adminNewQuantity) * Number(adminNewPrice);
        const itemRef = doc(db, 'invoice_items', selectedItemForEdit.id!);
        batch.update(itemRef, {
          quantity: adminNewQuantity,
          unitCost: adminNewPrice,
          cost: itemCost,
          status: finalStatus,
          subStatus: finalSubStatus,
          updatedAt: serverTimestamp(),
          updatedBy: user?.name || user?.username || 'مدير النظام',
          ...additionalFields
        });

        const otherItems = currentInvoiceItems.filter(it => it.id !== selectedItemForEdit.id);
        totalCostOfInvoice = otherItems.reduce((sum, it) => sum + (Number(it.cost) || 0), 0) + itemCost;
        allItemStatuses = [...otherItems.map(it => it.status), finalStatus];
      } else if (adminCorrectionScope === 'invoice') {
        currentInvoiceItems.forEach(it => {
          const itemRef = doc(db, 'invoice_items', it.id!);
          batch.update(itemRef, {
            status: finalStatus,
            subStatus: finalSubStatus,
            updatedAt: serverTimestamp(),
            updatedBy: user?.name || user?.username || 'مدير النظام',
            ...additionalFields
          });
        });
        totalCostOfInvoice = currentInvoiceItems.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
        allItemStatuses = currentInvoiceItems.map(() => finalStatus);
      }
      
      const invoiceRef = doc(db, 'invoices', selectedInvoiceForAdmin.id!);
      const updateData: any = {
        totalCost: totalCostOfInvoice,
        updatedAt: serverTimestamp()
      };

      // Determine invoice status (if all items 60 -> 60, if all items 50+ -> 50, else 10)
      const isAllDelivered = allItemStatuses.every(st => st === '60');
      const isAllReadyOrBeyond = allItemStatuses.every(st => Number(st) >= 50);

      if (isAllDelivered) {
        updateData.status = '60';
      } else if (isAllReadyOrBeyond) {
        updateData.status = '50';
      } else {
        updateData.status = '10'; // Keep active
      }

      batch.update(invoiceRef, updateData);

      await batch.commit();

      setSelectedItemForEdit(null);
      setAdminNewStatus('');
      setAdminNewQuantity(1);
      setSubview('admin_correction');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'DeviceManagement');
    } finally {
      setAdminSaveLoading(false);
    }
  };

  // Check if financial reversal entry (عكس قيد) is needed
  const checkReversalNeeded = async (invoiceNum: string, oldStatus: string, newStatus: string) => {
    if (oldStatus === '60' && newStatus !== '60') {
      const cleanNo = String(invoiceNum).replace('#', '').trim();
      const queryStr = `
        SELECT * FROM vault_transactions 
        WHERE (invoiceNumber = ? OR invoiceNumber = ? OR invoiceNumber = ?) 
          AND isReversed = 0 
          AND isReversal = 0
      `;
      const res = await localDb.query(queryStr, [cleanNo, `#${cleanNo}`, invoiceNum]);
      if (res.values && res.values.length > 0) {
        return res.values;
      }
    }
    return [];
  };

  // Perform financial reversals and record details in local SQLite + Firestore
  const processFinancialReversals = async (inv: Invoice, newStatus: string, txs: any[]) => {
    const timestampIso = new Date().toISOString();
    
    for (const tx of txs) {
      const reversalTxId = `vtx-${Math.random().toString(36).substring(2, 8)}`;
      
      // Get next voucher number
      const resNum = await localDb.query("SELECT COALESCE(MAX(voucherNumber), 1000) as maxNum FROM vault_transactions");
      const nextNum = (resNum.values?.[0]?.maxNum || 1000) + 1;

      const reverseAmount = -Number(tx.amount);
      const originalVoucherNotes = tx.notes || '';
      const updatedOriginalNotes = `${originalVoucherNotes} [تم عكس القيد تلقائياً لتغيير حالة الفاتورة بواسطة مستخدم رقم ${user.userNumber || 1}]`;
      const reversalNotes = `[عكس قيد مالي في الحوكمة] للمستند رقم ${tx.voucherNumber} - تغيير حالة الفاتورة #${inv.invoiceNumber} إلى ${newStatus} بواسطة ${user.name || user.username || 'المدير العام'}`;

      // Update original transaction in SQLite
      await ProviderFactory.getProvider().updateDoc('vault_transactions', tx.id, { 
        isReversed: 1, 
        notes: updatedOriginalNotes, 
        updatedAt: timestampIso 
      });

      // Insert reversal counter-transaction via ProviderFactory
      await ProviderFactory.getProvider().setDoc('vault_transactions', reversalTxId, {
          id: reversalTxId,
          currency: tx.currency || 'USD',
          amount: reverseAmount,
          customerName: tx.customerName || inv.customerName,
          invoiceNumber: tx.invoiceNumber || inv.invoiceNumber,
          userName: user.name || user.username || 'المدير العام',
          userNumber: user.userNumber || 1,
          userId: user.id || 'none',
          timestamp: timestampIso,
          type: tx.type === 'receipt' ? 'payment' : 'receipt',
          notes: reversalNotes,
          updatedAt: timestampIso,
          voucherNumber: nextNum,
          transactionCategory: 'عكس قيد مال',
          fundId: tx.fundId || '',
          fundName: tx.fundName || '',
          customerId: tx.customerId || inv.customerId || '',
          isReversed: 0,
          isReversal: 1,
          reversalOf: tx.id,
          status: 'reversal'
      });

      // Update fund balance
      if (tx.fundId) {
        await ProviderFactory.getProvider().updateDoc('fin_funds', tx.fundId, { balance: { type: 'increment', value: reverseAmount } });
      }
    }
  };
  const executeQuickStatusChange = async (inv: Invoice, targetStatus: string, txsToReverse: any[]) => {
    setAdminSaveLoading(true);
    try {
      if (txsToReverse.length > 0) {
        await processFinancialReversals(inv, targetStatus, txsToReverse);
      }

      let finalSubStatus = '';
      if (['10', 'new'].includes(targetStatus)) {
        finalSubStatus = '';
      } else if (['20', 'inspected', 'testing'].includes(targetStatus)) {
        finalSubStatus = 'testing';
      } else if (['30', 'awaiting_approval'].includes(targetStatus)) {
        finalSubStatus = 'awaiting_approval';
      } else if (['35', 'awaiting_parts'].includes(targetStatus)) {
        finalSubStatus = 'awaiting_parts';
      } else if (['40', 'repairing'].includes(targetStatus)) {
        finalSubStatus = 'repairing';
      } else if (['50', 'ready', 'intact', 'unrepairable', 'refused'].includes(targetStatus)) {
        finalSubStatus = targetStatus === '50' ? 'ready' : targetStatus;
      } else if (['60', 'delivered'].includes(targetStatus)) {
        finalSubStatus = 'delivered';
      }

      // Use ProviderFactory for offline capability
      const { ProviderFactory } = await import('../data/ProviderFactory');
      const provider = ProviderFactory.getProvider();
      
      // Update invoice
      await provider.updateDoc('invoices', inv.id!, {
        status: targetStatus,
        updatedAt: new Date().toISOString()
      });

      // Update all items of this invoice
      const invItems = items.filter(it => it.invoiceNumber === inv.invoiceNumber);
      for (const it of invItems) {
        await provider.updateDoc('invoice_items', it.id!, {
          status: targetStatus,
          subStatus: finalSubStatus,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.name || user?.username || 'مدير النظام'
        });
      }
      showToast('تم تحديث حالة الفاتورة وجميع الأجهزة المشمولة بها وعكس القيود المالية بنجاح');
      
      // Clear specific invoice status override after commit
      setAdminInvoiceStatuses(prev => {
        const copy = { ...prev };
        delete copy[inv.id!];
        return copy;
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'DeviceManagement');
    } finally {
      setAdminSaveLoading(false);
      setReversalConfirmData(null);
    }
  };

  // Handle dropdown selection inside detailed view form
  const handleDetailedSelectChange = (val: string) => {
    setDetailedSelectType(val);
    if (val === 'NEW_DEVICE') {
      setDetailedDeviceType('');
      setDetailedDeviceName('');
      setDetailedFaultType('');
      setDetailedQuantity(1);
      setDetailedPrice(0);
      setDetailedStatus('10');
    } else {
      const existing = items.find(it => it.id === val);
      if (existing) {
        setDetailedDeviceType(existing.deviceType || '');
        setDetailedDeviceName(existing.deviceName || '');
        setDetailedFaultType(existing.faultType || '');
        setDetailedQuantity(Number(existing.quantity) || 1);
        setDetailedPrice(Number(existing.unitCost) || 0);
        setDetailedStatus(existing.status || '10');
      }
    }
  };

  // Add device edit/creation to temporary table
  const handleAddStagedChange = () => {
    if (!detailedDeviceType.trim()) {
      showToast('يجب إدخال نوع الجهاز أولاً');
      return;
    }

    const idToUse = detailedSelectType === 'NEW_DEVICE' ? undefined : detailedSelectType;

    const newStaged = {
      id: idToUse,
      isNew: detailedSelectType === 'NEW_DEVICE',
      deviceType: detailedDeviceType.trim(),
      deviceName: detailedDeviceName.trim(),
      faultType: detailedFaultType.trim(),
      quantity: detailedQuantity,
      unitCost: detailedPrice,
      status: detailedStatus
    };

    setStagedChanges(prev => {
      // Remove any existing staged change for this same existing item ID
      const filtered = prev.filter(c => (idToUse ? c.id !== idToUse : true));
      return [...filtered, newStaged];
    });

    // Reset Form Fields
    setDetailedSelectType('NEW_DEVICE');
    setDetailedDeviceType('');
    setDetailedDeviceName('');
    setDetailedFaultType('');
    setDetailedQuantity(1);
    setDetailedPrice(0);
    setDetailedStatus('10');

    showToast('تمت إضافة التعديل إلى الجدول المؤقت بنجاح');
  };

  // Remove change entry from temporary table
  const handleRemoveStagedChange = (index: number) => {
    setStagedChanges(prev => prev.filter((_, idx) => idx !== index));
    showToast('تم حذف التعديل من الجدول المؤقت');
  };

  // Perform actual detailed modifications post & write
  const executeDetailedSave = async (
    finalItemsToSave: Array<{ id?: string; isNew: boolean; deviceType: string; deviceName: string; faultType: string; quantity: number; unitCost: number; status: string; }>,
    computedStatus: string,
    totalCost: number,
    txsToReverse: any[]
  ) => {
    setAdminSaveLoading(true);
    try {
      if (txsToReverse.length > 0) {
        await processFinancialReversals(selectedInvoiceForAdmin!, computedStatus, txsToReverse);
      }

      const batch = writeBatch(db);

      for (const item of finalItemsToSave) {
        let finalSubStatus = '';
        if (['10', 'new'].includes(item.status)) {
          finalSubStatus = '';
        } else if (['20', 'inspected', 'testing'].includes(item.status)) {
          finalSubStatus = 'testing';
        } else if (['30', 'awaiting_approval'].includes(item.status)) {
          finalSubStatus = 'awaiting_approval';
        } else if (['35', 'awaiting_parts'].includes(item.status)) {
          finalSubStatus = 'awaiting_parts';
        } else if (['40', 'repairing'].includes(item.status)) {
          finalSubStatus = 'repairing';
        } else if (['50', 'ready', 'intact', 'unrepairable', 'refused'].includes(item.status)) {
          finalSubStatus = item.status === '50' ? 'ready' : item.status;
        } else if (['60', 'delivered'].includes(item.status)) {
          finalSubStatus = 'delivered';
        }

        const itemCost = item.quantity * item.unitCost;

        if (item.isNew) {
          const newItemRef = doc(collection(db, 'invoice_items'));
          batch.set(newItemRef, {
            id: newItemRef.id,
            invoiceId: selectedInvoiceForAdmin!.id,
            invoiceNumber: selectedInvoiceForAdmin!.invoiceNumber,
            customerId: selectedInvoiceForAdmin!.customerId,
            customerName: selectedInvoiceForAdmin!.customerName,
            categoryId: item.deviceType ? item.deviceType.trim().replace(/\//g, '_') : '',
            deviceType: item.deviceType,
            deviceName: item.deviceName,
            faultType: item.faultType,
            customerProblem: item.faultType,
            quantity: item.quantity,
            unitCost: item.unitCost,
            cost: itemCost,
            status: item.status,
            subStatus: finalSubStatus,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            updatedBy: user?.name || user?.username || 'مدير النظام'
          });
        } else if (item.id) {
          const itemRef = doc(db, 'invoice_items', item.id);
          batch.update(itemRef, {
            deviceType: item.deviceType,
            deviceName: item.deviceName,
            categoryId: item.deviceType ? item.deviceType.trim().replace(/\//g, '_') : '',
            faultType: item.faultType,
            customerProblem: item.faultType,
            quantity: item.quantity,
            unitCost: item.unitCost,
            cost: itemCost,
            status: item.status,
            subStatus: finalSubStatus,
            updatedAt: serverTimestamp(),
            updatedBy: user?.name || user?.username || 'مدير النظام'
          });
        }
      }

      // Update parent invoice
      const invoiceRef = doc(db, 'invoices', selectedInvoiceForAdmin!.id!);
      batch.update(invoiceRef, {
        status: computedStatus,
        totalCost: totalCost,
        updatedAt: serverTimestamp()
      });

      await batch.commit();
      showToast('تم ترحيل التعديلات التفصيلية وعكس القيود المالية المرتبطة بنجاح');
      setStagedChanges([]);
      setSubview('admin_correction');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'DeviceManagement');
    } finally {
      setAdminSaveLoading(false);
      setReversalConfirmData(null);
    }
  };

  // Pre-process detailed changes before committing
  const handlePostDetailedCorrection = async () => {
    if (stagedChanges.length === 0) {
      showToast('الجدول المؤقت فارغ، يرجى إضافة تعديل أو جهاز واحد على الأقل');
      return;
    }

    const originalInvoiceItems = items.filter(it => it.invoiceNumber === selectedInvoiceForAdmin!.invoiceNumber);
    const finalItemsToSave: Array<{ id?: string; isNew: boolean; deviceType: string; deviceName: string; faultType: string; quantity: number; unitCost: number; status: string; }> = [];

    // Combine original untouched items + modifications
    originalInvoiceItems.forEach(orig => {
      const staged = stagedChanges.find(s => s.id === orig.id);
      if (staged) {
        finalItemsToSave.push(staged);
      } else {
        finalItemsToSave.push({
          id: orig.id,
          isNew: false,
          deviceType: orig.deviceType,
          deviceName: orig.deviceName || '',
          faultType: orig.faultType || '',
          quantity: Number(orig.quantity) || 1,
          unitCost: Number(orig.unitCost) || 0,
          status: orig.status || '10'
        });
      }
    });

    // Add completely new items
    stagedChanges.forEach(st => {
      if (st.isNew) {
        finalItemsToSave.push(st);
      }
    });

    const totalCost = finalItemsToSave.reduce((sum, it) => sum + (it.quantity * it.unitCost), 0);

    // Calculate computed status of the parent invoice
    let computedStatus = '10';
    const isAllDelivered = finalItemsToSave.every(st => st.status === '60');
    const isAllReadyOrBeyond = finalItemsToSave.every(st => {
      const val = Number(st.status);
      return !isNaN(val) ? val >= 50 : ['ready', 'intact', 'unrepairable', 'refused', '60', 'delivered', '70'].includes(st.status);
    });

    if (isAllDelivered) {
      computedStatus = '60';
    } else if (isAllReadyOrBeyond) {
      computedStatus = '50';
    } else {
      computedStatus = '10';
    }

    // Check if reversal is needed
    const txs = await checkReversalNeeded(selectedInvoiceForAdmin!.invoiceNumber, selectedInvoiceForAdmin!.status, computedStatus);
    if (txs.length > 0) {
      setReversalConfirmData({
        invoice: selectedInvoiceForAdmin!,
        newStatus: computedStatus,
        transactionsToReverse: txs,
        isDetailed: true,
        onConfirm: () => executeDetailedSave(finalItemsToSave, computedStatus, totalCost, txs)
      });
      return;
    }

    executeDetailedSave(finalItemsToSave, computedStatus, totalCost, []);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Cpu className="text-orange-500" size={28} />
            إدارة وحوكمة الأجهزة
          </h2>
          <p className="text-sm text-gray-400 mt-1 font-bold">إدارة مسارات الفحص، الصيانة، التسليم، والإجراءات الإدارية المتقدمة</p>
        </div>
        {subview !== 'hub' && (
          <button
            onClick={() => setSubview('hub')}
            className="w-full md:w-auto px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/5"
          >
            <ArrowRight size={18} />
            العودة للقائمة الرئيسية
          </button>
        )}
      </div>

      {/* SUBVIEW: Hub */}
      {subview === 'hub' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => setSubview('active_devices')} className="bg-[#1a1a1a] p-6 rounded-[2rem] border border-white/5 text-right hover:bg-white/5 transition-all group">
            <div className="bg-blue-500/10 text-blue-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Activity size={24} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">الأجهزة النشطة</h3>
            <p className="text-xs text-gray-400 font-bold leading-relaxed">إدارة أجهزة قيد الفحص والصيانة</p>
          </button>
          <button onClick={() => setSubview('ready_exit')} className="bg-[#1a1a1a] p-6 rounded-[2rem] border border-white/5 text-right hover:bg-white/5 transition-all group">
            <div className="bg-emerald-500/10 text-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">أجهزة جاهزة للتسليم</h3>
            <p className="text-xs text-gray-400 font-bold leading-relaxed">تسليم الأجهزة للعملاء وإنهاء الفواتير</p>
          </button>
          <button onClick={() => setSubview('delivered')} className="bg-[#1a1a1a] p-6 rounded-[2rem] border border-white/5 text-right hover:bg-white/5 transition-all group">
            <div className="bg-purple-500/10 text-purple-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PackageCheck size={24} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">الأجهزة المسلمة</h3>
            <p className="text-xs text-gray-400 font-bold leading-relaxed">سجل الأجهزة التي تم تسليمها</p>
          </button>
          {hasPermission('settings_advanced_mgmt', 'edit') && (
            <button onClick={() => setSubview('admin_correction')} className="bg-[#1a1a1a] p-6 rounded-[2rem] border border-white/5 text-right hover:bg-white/5 transition-all group">
              <div className="bg-orange-500/10 text-orange-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-black text-white mb-2">إجراءات إدارية</h3>
              <p className="text-xs text-gray-400 font-bold leading-relaxed">تصحيح وتعديل حالات الأجهزة</p>
            </button>
          )}
        </div>
      )}

      {/* SUBVIEW: Active Devices */}
      {subview === 'active_devices' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-white/5 space-y-4">
            <h3 className="text-lg font-black text-white">الأجهزة النشطة</h3>
            <div className="grid grid-cols-1 gap-4">
              {activeInvoicesFiltered.map(inv => (
                <div key={inv.id} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-bold text-white font-mono">#{inv.invoiceNumber}</span>
                    <h4 className="text-md font-bold text-gray-300">{inv.customerName}</h4>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedInvoice(inv); setSubview('inspection_form'); }} className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-xl text-xs font-bold hover:bg-blue-500 hover:text-white transition-all">فحص</button>
                    <button onClick={() => { setSelectedInvoice(inv); setSubview('approval_form'); }} className="px-4 py-2 bg-amber-500/10 text-amber-500 rounded-xl text-xs font-bold hover:bg-amber-500 hover:text-white transition-all">موافقة وقطع</button>
                    <button onClick={() => { setSelectedInvoice(inv); setSubview('maintenance_form'); }} className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all">صيانة</button>
                  </div>
                </div>
              ))}
              {activeInvoicesFiltered.length === 0 && (
                <div className="text-center py-8 text-gray-500 font-bold">لا توجد أجهزة نشطة حالياً</div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* SUBVIEW: Ready Exit */}
      {subview === 'ready_exit' && (
        <DeviceExit user={user} onBack={() => setSubview('hub')} />
      )}

      {/* SUBVIEW: Delivered */}
      {subview === 'delivered' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-white/5 space-y-4">
            <h3 className="text-lg font-black text-white">الأجهزة المسلمة</h3>
            <div className="grid grid-cols-1 gap-4">
              {deliveredInvoicesFiltered.map(inv => (
                <div key={inv.id} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-bold text-white font-mono">#{inv.invoiceNumber}</span>
                    <h4 className="text-md font-bold text-gray-300">{inv.customerName}</h4>
                  </div>
                  <button onClick={() => setActivePreviewInvoice(inv)} className="px-4 py-2 bg-white/5 text-white rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2">
                    <Eye size={16} />
                    عرض التفاصيل
                  </button>
                </div>
              ))}
              {deliveredInvoicesFiltered.length === 0 && (
                <div className="text-center py-8 text-gray-500 font-bold">لا توجد أجهزة مسلمة हालياً</div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* SUBVIEW: Forms */}
      {subview === 'inspection_form' && selectedInvoice && (
        <Inspection initialInvoice={selectedInvoice} onBack={() => setSubview('active_devices')} user={user} />
      )}
      {subview === 'approval_form' && selectedInvoice && (
        <ApprovalAndParts initialInvoice={selectedInvoice} onBack={() => setSubview('active_devices')} user={user} />
      )}
      {subview === 'maintenance_form' && selectedInvoice && (
        <Maintenance initialInvoice={selectedInvoice} onBack={() => setSubview('active_devices')} user={user} />
      )}

      {/* SUBVIEW: Admin Correction List */}
      {subview === 'admin_correction' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 animate-fade-in"
        >
          <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-white/5 shadow-2xl space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white">تصحيح وحوكمة الأجهزة</h3>
                <p className="text-xs text-gray-400 mt-1 font-bold">تعديل حالات الأجهزة استثنائياً من قبل الإدارة</p>
              </div>

              {/* Filters & Search UI */}
              <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 md:w-64">
                  <input
                    type="text"
                    value={adminInvoiceSearch}
                    onChange={(e) => setAdminInvoiceSearch(e.target.value)}
                    placeholder="ابحث برقم الفاتورة أو العميل..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl pr-10 pl-4 py-2 text-xs font-bold text-white focus:border-orange-500 outline-none transition-all placeholder:text-gray-500"
                  />
                  <SearchIcon className="absolute right-3 top-2.5 text-gray-500" size={16} />
                </div>

                {/* Date Filter Tabs */}
                <div className="flex gap-1 p-1 bg-black/40 border border-white/5 rounded-xl text-xs font-bold font-cairo">
                  <button
                    onClick={() => setTimeFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${timeFilter === 'all' ? 'bg-orange-500 text-black font-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    الكل
                  </button>
                  <button
                    onClick={() => setTimeFilter('day')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${timeFilter === 'day' ? 'bg-orange-500 text-black font-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    اليوم
                  </button>
                  <button
                    onClick={() => setTimeFilter('week')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${timeFilter === 'week' ? 'bg-orange-500 text-black font-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    الأسبوع
                  </button>
                  <button
                    onClick={() => setTimeFilter('month')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${timeFilter === 'month' ? 'bg-orange-500 text-black font-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    الشهر
                  </button>
                  <button
                    onClick={() => setTimeFilter('custom')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${timeFilter === 'custom' ? 'bg-orange-500 text-black font-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    مخصص
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Date Picker Inputs */}
            {timeFilter === 'custom' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-black/20 border border-white/5 rounded-2xl"
              >
                <div className="space-y-1 text-right">
                  <label className="text-[10px] text-gray-500 font-bold block">من تاريخ:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1 text-right">
                  <label className="text-[10px] text-gray-500 font-bold block">إلى تاريخ:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* List */}
            <div className="overflow-x-auto rounded-2xl border border-white/5">
              <table className="w-full text-right text-sm font-cairo">
                <thead className="bg-black/40 text-gray-400 font-bold">
                  <tr>
                    <th className="p-4 whitespace-nowrap">رقم الفاتورة</th>
                    <th className="p-4 whitespace-nowrap">العميل</th>
                    <th className="p-4 whitespace-nowrap">الأجهزة</th>
                    <th className="p-4 whitespace-nowrap text-center">إجراء تفصيلي</th>
                    <th className="p-4 whitespace-nowrap text-right">حالة الفاتورة</th>
                    <th className="p-4 whitespace-nowrap text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {getFilteredInvoicesForAdmin().map(inv => {
                    const isDetailed = adminDetailedModes[inv.id!] !== false;
                    const currentStatusVal = adminInvoiceStatuses[inv.id!] || inv.status;
                    
                    return (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors whitespace-nowrap">
                        <td className="p-4 font-mono text-white font-bold whitespace-nowrap">#{inv.invoiceNumber}</td>
                        <td className="p-4 font-bold text-rose-400 whitespace-nowrap">{inv.customerName}</td>
                        <td className="p-4 text-gray-400 font-mono whitespace-nowrap">{getDevicesCount(inv.invoiceNumber)}</td>
                        
                        {/* Column 1: Detailed Action Radio Selection */}
                        <td className="p-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminDetailedModes(prev => ({ ...prev, [inv.id!]: !isDetailed }));
                            }}
                            className="inline-flex items-center justify-center p-1 rounded-full hover:bg-white/5 transition-colors outline-none"
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isDetailed ? 'border-orange-500 bg-orange-500/10' : 'border-gray-600 bg-transparent'}`}>
                              {isDetailed && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                            </div>
                          </button>
                        </td>

                        {/* Column 2: Invoice Status Dropdown (Active only when detailed is disabled) */}
                        <td className="p-4 whitespace-nowrap">
                          <select
                            disabled={isDetailed}
                            value={currentStatusVal}
                            onChange={(e) => {
                              const newVal = e.target.value;
                              setAdminInvoiceStatuses(prev => ({ ...prev, [inv.id!]: newVal }));
                            }}
                            className={`bg-black/60 border rounded-xl px-3 py-1.5 text-xs font-bold text-white font-cairo outline-none transition-all ${isDetailed ? 'border-white/5 opacity-50 cursor-not-allowed' : 'border-white/20 focus:border-orange-500'}`}
                          >
                            {ALL_STATUSES.map(st => (
                              <option key={st.value} value={st.value} className="bg-[#121212] text-white">
                                {st.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="p-4 text-center whitespace-nowrap">
                          <button
                            onClick={async () => {
                              if (isDetailed) {
                                setSelectedInvoiceForAdmin(inv);
                                setStagedChanges([]);
                                // Pre-fill with first item or NEW_DEVICE
                                const invItems = items.filter(it => it.invoiceNumber === inv.invoiceNumber);
                                if (invItems.length > 0) {
                                  handleDetailedSelectChange(invItems[0].id!);
                                } else {
                                  handleDetailedSelectChange('NEW_DEVICE');
                                }
                                setSubview('admin_correction_action');
                              } else {
                                // Fast status change
                                if (currentStatusVal === inv.status) {
                                  showToast('يرجى اختيار حالة فاتورة مختلفة لتغييرها');
                                  return;
                                }
                                const txs = await checkReversalNeeded(inv.invoiceNumber, inv.status, currentStatusVal);
                                if (txs.length > 0) {
                                  setReversalConfirmData({
                                    invoice: inv,
                                    newStatus: currentStatusVal,
                                    transactionsToReverse: txs,
                                    isDetailed: false,
                                    onConfirm: () => executeQuickStatusChange(inv, currentStatusVal, txs)
                                  });
                                  return;
                                }
                                executeQuickStatusChange(inv, currentStatusVal, []);
                              }
                            }}
                            className="px-4.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-800/10 hover:shadow-orange-700/20 whitespace-nowrap"
                          >
                            {isDetailed ? 'إجراء تفصيلي' : 'تحديث سريع'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {getFilteredInvoicesForAdmin().length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500 font-bold">لا توجد نتائج</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}


      {/* SUBVIEW: Admin Correction Item Action Form */}
      {subview === 'admin_correction_action' && selectedInvoiceForAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 animate-fade-in font-cairo"
        >
          {/* Action view header */}
          <div className="bg-[#1a1a1a] rounded-3xl p-6 border border-white/5 shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] bg-orange-500/20 text-orange-500 font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider font-mono">
                  إجراء إداري تفصيلي - الفاتورة #{selectedInvoiceForAdmin.invoiceNumber}
                </span>
                <h2 className="text-2xl font-black text-white mt-1">العميل: {selectedInvoiceForAdmin.customerName}</h2>
              </div>

              <div className="text-right text-xs text-gray-400 space-y-1 bg-black/20 p-3 rounded-2xl border border-white/5">
                <div>مستند الحوكمة الفعال: <span className="text-white font-bold">{user?.name || user?.username || 'المشرف المسؤول'}</span></div>
                <div>تاريخ ووقت التعديل: <span className="text-white font-mono">{new Date().toLocaleString('ar-YE')}</span></div>
              </div>
            </div>

            <button
              onClick={() => setSubview('admin_correction')}
              className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 flex items-center gap-2 text-xs font-bold"
            >
              <ArrowRight size={16} />
              <span>العودة لجدول الفواتير</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Interactive Form (Left on large screen, 5 cols) */}
            <div className="lg:col-span-5 bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 space-y-5 shadow-xl">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Activity className="text-orange-500" size={20} />
                  إدارة وتعديل أجهزة الفاتورة
                </h3>
                <p className="text-xs text-gray-400 mt-1">تحديد جهاز للتعديل أو إضافة جهاز جديد بالكامل إلى الفاتورة</p>
              </div>

              {/* Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 block">الجهاز المستهدف:</label>
                <select
                  value={detailedSelectType}
                  onChange={(e) => handleDetailedSelectChange(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-xs focus:border-orange-500 outline-none transition-all text-white font-bold"
                >
                  <option value="NEW_DEVICE">🆕 إضافة جهاز جديد كلياً (New Device)</option>
                  {items
                    .filter(it => it.invoiceNumber === selectedInvoiceForAdmin.invoiceNumber)
                    .map(it => (
                      <option key={it.id} value={it.id}>
                        🛠️ {it.deviceType} {it.deviceName ? `- ${it.deviceName}` : ''} ({it.quantity} حبة)
                      </option>
                    ))}
                </select>
              </div>

              {/* Form parameters */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 block">نوع الجهاز:</label>
                    <input
                      type="text"
                      placeholder="مثال: آيفون 13"
                      value={detailedDeviceType}
                      onChange={(e) => setDetailedDeviceType(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 block">موديل/اسم الجهاز:</label>
                    <input
                      type="text"
                      placeholder="مثال: Pro Max"
                      value={detailedDeviceName}
                      onChange={(e) => setDetailedDeviceName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 block">نوع العطل والمشكلة:</label>
                  <input
                    type="text"
                    placeholder="شاشة مكسورة، مشكلة شحن، الخ"
                    value={detailedFaultType}
                    onChange={(e) => setDetailedFaultType(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 block">العدد / الكمية:</label>
                    <input
                      type="number"
                      min={1}
                      value={detailedQuantity}
                      onChange={(e) => setDetailedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:border-orange-500 outline-none text-center"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 block">سعر الوحدة ({selectedInvoiceForAdmin.currency || 'YER'}):</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={detailedPrice}
                      onChange={(e) => setDetailedPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:border-orange-500 outline-none text-center"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 block">الحالة التشغيلية للجهاز:</label>
                  <select
                    value={detailedStatus}
                    onChange={(e) => setDetailedStatus(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:border-orange-500 outline-none transition-all"
                  >
                    {ALL_STATUSES.map(st => (
                      <option key={st.value} value={st.value} className="bg-[#121212]">{st.label}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-500">التكلفة الفرعية المحسوبة:</span>
                  <span className="text-emerald-400 font-mono font-black">
                    {(detailedQuantity * detailedPrice).toLocaleString()} {selectedInvoiceForAdmin.currency || 'YER'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddStagedChange}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 mt-4"
                >
                  <Plus size={16} />
                  <span>إضافة للتعديلات المؤقتة</span>
                </button>
              </div>
            </div>

            {/* Live Review & Migration table (Right on large screen, 7 cols) */}
            <div className="lg:col-span-7 bg-[#1a1a1a] border border-white/5 rounded-3xl p-6 space-y-5 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" size={20} />
                    مراجعة الفاتورة النهائية قبل الحفظ
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">الجدول يدمج الأجهزة المعدلة، والمضافة حديثاً، والأصلية التي لم تلمس</p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/10">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-black/60 text-gray-400 font-bold">
                      <tr>
                        <th className="p-3">الجهاز</th>
                        <th className="p-3">العطل</th>
                        <th className="p-3 text-center">الكمية</th>
                        <th className="p-3 text-right">المجموع</th>
                        <th className="p-3">الحالة</th>
                        <th className="p-3">المصدر</th>
                        <th className="p-3 text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(() => {
                        const originalItems = items.filter(it => it.invoiceNumber === selectedInvoiceForAdmin.invoiceNumber);
                        const displayList: Array<{
                          stagedIndex?: number;
                          isNew: boolean;
                          isModified: boolean;
                          deviceType: string;
                          deviceName: string;
                          faultType: string;
                          quantity: number;
                          unitCost: number;
                          status: string;
                        }> = [];

                        // 1. Process original items (or their modifications)
                        originalItems.forEach(orig => {
                          const stagedIdx = stagedChanges.findIndex(s => s.id === orig.id);
                          if (stagedIdx !== -1) {
                            const staged = stagedChanges[stagedIdx];
                            displayList.push({
                              stagedIndex: stagedIdx,
                              isNew: false,
                              isModified: true,
                              deviceType: staged.deviceType,
                              deviceName: staged.deviceName,
                              faultType: staged.faultType,
                              quantity: staged.quantity,
                              unitCost: staged.unitCost,
                              status: staged.status
                            });
                          } else {
                            displayList.push({
                              isNew: false,
                              isModified: false,
                              deviceType: orig.deviceType,
                              deviceName: orig.deviceName || '',
                              faultType: orig.faultType || '',
                              quantity: Number(orig.quantity) || 1,
                              unitCost: Number(orig.unitCost) || 0,
                              status: orig.status || '10'
                            });
                          }
                        });

                        // 2. Add completely new devices from staged changes
                        stagedChanges.forEach((st, idx) => {
                          if (st.isNew) {
                            displayList.push({
                              stagedIndex: idx,
                              isNew: true,
                              isModified: false,
                              deviceType: st.deviceType,
                              deviceName: st.deviceName,
                              faultType: st.faultType,
                              quantity: st.quantity,
                              unitCost: st.unitCost,
                              status: st.status
                            });
                          }
                        });

                        if (displayList.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-gray-500 font-bold">لا يوجد أجهزة في هذه الفاتورة حالياً</td>
                            </tr>
                          );
                        }

                        return displayList.map((item, index) => (
                          <tr key={index} className="hover:bg-white/[0.02]">
                            <td className="p-3">
                              <div className="font-bold text-white">{item.deviceType}</div>
                              {item.deviceName && <div className="text-[10px] text-gray-500">{item.deviceName}</div>}
                            </td>
                            <td className="p-3 text-gray-400">{item.faultType || 'غير محدد'}</td>
                            <td className="p-3 text-center font-mono font-bold text-white">{item.quantity}</td>
                            <td className="p-3 text-right font-mono font-black text-emerald-400">
                              {(item.quantity * item.unitCost).toLocaleString()}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {getStatusTextArabic(item.status)}
                              </span>
                            </td>
                            <td className="p-3">
                              {item.isNew ? (
                                <span className="text-[10px] text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded border border-orange-400/10 font-bold">جديد</span>
                              ) : item.isModified ? (
                                <span className="text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/10 font-bold">تعديل معلق</span>
                              ) : (
                                <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">أصلي</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {item.stagedIndex !== undefined ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStagedChange(item.stagedIndex!)}
                                  className="p-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-all"
                                  title="تراجع عن التعديل"
                                >
                                  <Trash2 size={14} />
                                </button>
                              ) : (
                                <span className="text-[10px] text-gray-600">-</span>
                              )}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary and Save Migration */}
              <div className="pt-4 border-t border-white/5 mt-6 space-y-4">
                <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">إجمالي الأجهزة المعدلة والمضافة:</div>
                    <div className="text-sm font-black text-white">{stagedChanges.length} تعديلات في الجدول المؤقت</div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-500">الإجمالي العام المتوقع للفاتورة:</div>
                    <div className="text-xl font-mono font-black text-emerald-400">
                      {(() => {
                        const originalItems = items.filter(it => it.invoiceNumber === selectedInvoiceForAdmin.invoiceNumber);
                        let total = 0;
                        originalItems.forEach(orig => {
                          const staged = stagedChanges.find(s => s.id === orig.id);
                          if (staged) {
                            total += (staged.quantity * staged.unitCost);
                          } else {
                            total += (Number(orig.quantity || 1) * Number(orig.unitCost || 0));
                          }
                        });
                        stagedChanges.forEach(st => {
                          if (st.isNew) {
                            total += (st.quantity * st.unitCost);
                          }
                        });
                        return total.toLocaleString();
                      })()}{' '}
                      {selectedInvoiceForAdmin.currency || 'YER'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStagedChanges([]);
                      setSubview('admin_correction');
                      showToast('تم إلغاء جميع التعديلات المؤقتة');
                    }}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl text-xs font-bold font-cairo border border-white/5"
                  >
                    إلغاء التغييرات والرجوع
                  </button>

                  <button
                    type="button"
                    disabled={adminSaveLoading}
                    onClick={handlePostDetailedCorrection}
                    className="px-6 py-2.5 bg-gradient-to-l from-emerald-600 to-teal-700 hover:from-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/10 disabled:opacity-50 flex items-center gap-2"
                  >
                    {adminSaveLoading ? (
                      <>
                        <RefreshCw className="animate-spin" size={14} />
                        <span>جاري الحفظ والترحيل...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={14} />
                        <span>ترحيل التعديلات الإدارية وحفظ الكل</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* FINANCIAL REVERSAL MONITOR / CONFIRMATION MODAL OVERLAY */}
      <AnimatePresence>
        {reversalConfirmData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-cairo">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#181818] border border-red-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-right space-y-5"
            >
              <div className="flex items-center gap-3 text-red-500 pb-3 border-b border-white/5">
                <ShieldAlert size={32} className="animate-pulse" />
                <div>
                  <h3 className="text-lg font-black">تحذير الحوكمة والرقابة المالية الفعالة</h3>
                  <p className="text-[10px] text-gray-400">تنبيه تلقائي قبل عكس القيود المالية المعتمدة</p>
                </div>
              </div>

              <div className="text-xs text-gray-300 space-y-3 leading-relaxed">
                <p>
                  لقد قمت بتغيير حالة الفاتورة رقم <span className="font-mono text-white font-black">#{reversalConfirmData.invoice.invoiceNumber}</span> من حالة <span className="text-emerald-400 font-bold">تم التسليم والمغادرة (المدفوعة)</span> إلى حالة <span className="text-orange-400 font-bold">{getStatusTextArabic(reversalConfirmData.newStatus)}</span>.
                </p>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 font-bold space-y-1">
                  <div>⚠️ تنبيه النظام المحاسبي الموحد:</div>
                  <p className="text-[11px] font-normal text-gray-400">
                    هذا التعديل الإداري يترتب عليه إلغاء تفعيل حالة التسليم مما يستوجب عكس قيد المبالغ المالية التي تم دفعها سابقاً لضمان دقة وتطابق كشوفات الحسابات والخزائن المالية.
                  </p>
                </div>
              </div>

              {/* Transactions list to be reversed */}
              <div className="space-y-2">
                <label className="text-[11px] text-gray-500 font-bold block">المستندات المالية المتأثرة التي سيتم عكس قيودها:</label>
                <div className="bg-black/40 border border-white/5 rounded-xl p-3 max-h-32 overflow-y-auto space-y-2">
                  {reversalConfirmData.transactionsToReverse.map((tx: any) => (
                    <div key={tx.id} className="text-[10px] flex justify-between items-center bg-white/[0.02] p-2 rounded-lg border border-white/5 font-mono">
                      <div className="text-right">
                        <div className="text-white font-bold">مستند رقم: {tx.voucherNumber}</div>
                        <div className="text-gray-500 text-[9px]">{tx.notes || 'سند دفع للفاتورة'}</div>
                      </div>
                      <div className="text-left font-black text-rose-500">
                        -{Number(tx.amount).toLocaleString()} {tx.currency || 'USD'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400 bg-black/20 p-3 rounded-2xl">
                <div>مستخدم النظام الحالي: <span className="text-white font-bold">{user?.name || user?.username}</span></div>
                <div>رقم المستشار: <span className="text-white font-bold font-mono">#{user?.userNumber || 1}</span></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReversalConfirmData(null)}
                  className="px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/5"
                >
                  إلغاء الإجراء والتراجع
                </button>

                <button
                  type="button"
                  onClick={() => {
                    reversalConfirmData.onConfirm();
                  }}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black shadow-lg shadow-red-600/20 transition-all flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>موافق، قم بعكس القيود الآن</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
