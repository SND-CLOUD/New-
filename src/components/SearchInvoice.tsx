import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, getDocs, doc, getDoc } from '../firebase';
import { db } from '../firebase';
import { 
  Search, FileText, User, Calendar, Loader2, AlertCircle, ArrowLeft, 
  Check, Phone, DollarSign, ArrowUpRight, ShieldAlert, CheckCircle, 
  Clock, TrendingUp, ChevronLeft, Printer, RefreshCw, BarChart3, Users, Gift, X, FileDown, Layers
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PrintPreviewOverlay from './PrintPreviewOverlay';
import { useBackHandler } from '../hooks/useBackHandler';
import { formatTxDate, parseTxDate, parseDate, formatDate, formatTime } from '../lib/dateUtils';
import { isInShopMaintenanceDevice, isShopMaintenanceItem } from '../types';

export default function SearchInvoice({ onBack, user }: { onBack?: () => void, user: any }) {
  const { t } = useTranslation();
  
  // Tab states: 'customer' | 'invoice' | 'voucher' | 'report'
  const [activeTab, setActiveTab] = useState<'customer' | 'invoice' | 'voucher' | 'report'>('customer');

  // Customer search settings
  const [customerSearchMode, setCustomerSearchMode] = useState<'name' | 'phone'>('name');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  
  // Template selections
  const [invoicePrintTemplate, setInvoicePrintTemplate] = useState<'entry' | 'exit'>('entry');
  const [voucherPrintTemplate, setVoucherPrintTemplate] = useState<'payment' | 'receipt'>('payment');
  const [reportPrintTemplate, setReportPrintTemplate] = useState<'inspection' | 'quotation' | 'assignment' | 'maintenance'>('inspection');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Invoice search settings
  const [invoiceSearchTerm, setInvoiceSearchTerm] = useState('');
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Voucher search settings
  const [voucherSearchTerm, setVoucherSearchTerm] = useState('');
  const [showVoucherDropdown, setShowVoucherDropdown] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);

  // Reports state
  const [activeReportType, setActiveReportType] = useState<string | null>(null);

  const handlePrintReport = () => {
    if (!activeReportType) return;
    
    let reportData: any = null;
    
    if (activeReportType === 'progress_devices') {
      const activeItems = invoiceItems.filter(item => isInShopMaintenanceDevice(item));
      reportData = {
        type: 'table',
        data: {
          table: {
            title: 'تقرير الأجهزة النشطة (قيد الصيانة والانتظار)',
            customerName: 'عام (جميع العملاء)',
            subtitle: `قائمة الأجهزة التقنية التي لا تزال في عهدة المركز (إجمالي: ${activeItems.length})`,
            headers: ["اسم الجهاز", "الخلل والشكوى", "العميل", "المرجع", "التكلفة", "الحالة الحالية"],
            rows: activeItems.map(item => {
              const cleanInvNo = String(item.invoiceNumber || '').replace('#', '');
              const inv = invoices.find(i => String(i.invoiceNumber || '').replace('#', '') === cleanInvNo || i.id === item.invoiceId);
              const customerName = item.customerName || item.recipientName || inv?.customerName || '---';
              return [
                item.deviceName || 'جهاز تقني',
                item.faultType || 'غير محدد',
                customerName,
                item.invoiceNumber || '---',
                item.cost?.toFixed(2) || '0.00',
                getStatusText(item.status)
              ];
            }),
            userName: user?.displayName || user?.name || 'موظف النظام',
            reportNumber: `REP-ACT-${new Date().getTime().toString().slice(-5)}`,
            footerNotes: 'هذا التقرير يوضح جميع الأجهزة التي لم يتم تسليمها للعملاء بعد وهي في مراحل فحص أو صيانة مختلفة.'
          }
        }
      };
    } else if (activeReportType === 'delivered_devices') {
      const deliveredItems = invoiceItems.filter(item => item.status === '60' || item.status === 'delivered');
      reportData = {
        type: 'table',
        data: {
          table: {
            title: 'سجل الأجهزة المسلّمة والمنجزة (الأرشيف التقني)',
            customerName: 'عام (أرشيف)',
            subtitle: `أرشيف العمليات المكتملة والأجهزة التي خرجت من المركز (إجمالي: ${deliveredItems.length})`,
            headers: ["اسم الجهاز", "الخلل المنجز", "العميل المستلم", "رقم الفاتورة", "قيمة الصيانة", "الحالة"],
            rows: deliveredItems.map(item => {
              const cleanInvNo = String(item.invoiceNumber || '').replace('#', '');
              const inv = invoices.find(i => String(i.invoiceNumber || '').replace('#', '') === cleanInvNo || i.id === item.invoiceId);
              const customerName = item.customerName || item.recipientName || inv?.customerName || '---';
              return [
                item.deviceName || 'جهاز تقني',
                item.faultType || 'غير محدد',
                customerName,
                item.invoiceNumber || '---',
                item.cost?.toFixed(2) || '0.00',
                'تم تسليمه للمستلم'
              ];
            }),
            userName: user?.displayName || user?.name || 'موظف النظام',
            reportNumber: `REP-ARC-${new Date().getTime().toString().slice(-5)}`,
            footerNotes: 'تمثل هذه القائمة الأجهزة التي تم إنجاز صيانتها وتسليمها فعلياً لأصحابها.'
          }
        }
      };
    } else if (activeReportType === 'debts_report') {
      const debtCustomers = customers.filter(c => getCustomerOutstandingAmount(c.id!) > 0.01);
      reportData = {
        type: 'table',
        data: {
          table: {
            title: 'تقرير الذمم والديون المستحقة (العملاء)',
            customerName: 'عام (تقرير مالي)',
            subtitle: `كشف بالعملاء الذين تترتب عليهم مبالغ مالية معلقة (إجمالي: ${debtCustomers.length})`,
            headers: ["اسم العميل", "رقم الهاتف", "إجمالي الصيانة", "إجمالي المقبوض", "الديون المتبقية"],
            rows: debtCustomers.map((cust) => {
              const outstanding = getCustomerOutstandingAmount(cust.id!);
              const totalCost = getCustomerTotalCost(cust.id!);
              const totalPaid = getCustomerTotalPaid(cust.id!);
              const currency = getCustomerCurrencyLabel(cust.id!);
              return [
                cust.name,
                cust.phone1 || '---',
                `${totalCost.toFixed(2)} ${currency}`,
                `${totalPaid.toFixed(2)} ${currency}`,
                `${outstanding.toFixed(2)} ${currency}`
              ];
            }),
            userName: user?.displayName || user?.name || 'موظف النظام',
            reportNumber: `REP-DEB-${new Date().getTime().toString().slice(-5)}`,
            footerNotes: 'يرجى مراجعة هذه الذمم والتحصيل المالي في أقرب وقت ممكن لضمان سيولة الصناديق.'
          }
        }
      };
    }

    if (reportData) {
      setPreviewData(reportData);
    }
  };

  const handlePrintDebtsByCurrencyReport = () => {
    const debtCustomers = customers.filter(c => getCustomerOutstandingAmount(c.id!) > 0.01);
    
    // Group customers by their currency label
    const currencyGroups: Record<string, any[]> = {};
    debtCustomers.forEach(cust => {
      const currency = getCustomerCurrencyLabel(cust.id!);
      if (!currencyGroups[currency]) {
        currencyGroups[currency] = [];
      }
      currencyGroups[currency].push(cust);
    });

    // Create groups data structure for the PrintPreviewOverlay
    const groups = Object.entries(currencyGroups).map(([currency, custs]) => {
      const rows = custs.map(cust => {
        const outstanding = getCustomerOutstandingAmount(cust.id!);
        const totalCost = getCustomerTotalCost(cust.id!);
        const totalPaid = getCustomerTotalPaid(cust.id!);
        return [
          cust.name,
          cust.phone1 || '---',
          `${totalCost.toFixed(2)} ${currency}`,
          `${totalPaid.toFixed(2)} ${currency}`,
          `${outstanding.toFixed(2)} ${currency}`
        ];
      });

      // Calculate sum for this currency group
      const totalOutstanding = custs.reduce((sum, c) => sum + getCustomerOutstandingAmount(c.id!), 0);
      const totalCostGroup = custs.reduce((sum, c) => sum + getCustomerTotalCost(c.id!), 0);
      const totalPaidGroup = custs.reduce((sum, c) => sum + getCustomerTotalPaid(c.id!), 0);

      return {
        title: `تقرير الذمم والديون المستحقة - عملة ${currency}`,
        subtitle: `كشف تفصيلي بالعملاء المدينين بعملة (${currency})`,
        rows,
        footerNotes: `إجمالي الصيانة لعملة ${currency}: ${totalCostGroup.toFixed(2)} | إجمالي المقبوض: ${totalPaidGroup.toFixed(2)} | إجمالي الديون المتبقية: ${totalOutstanding.toFixed(2)}`
      };
    });

    const reportData = {
      type: 'table',
      data: {
        table: {
          title: 'تقرير الذمم والديون المستحقة المفصل حسب العملة',
          customerName: 'عام (جميع العملات)',
          subtitle: `كشف بالعملاء المترتب عليهم أرصدة معلقة (إجمالي العملات: ${Object.keys(currencyGroups).length})`,
          headers: ["اسم العميل", "رقم الهاتف", "إجمالي الصيانة", "إجمالي المقبوض", "الديون المتبقية"],
          groups,
          userName: user?.displayName || user?.name || 'موظف النظام',
          reportNumber: `REP-DEB-CUR-${new Date().getTime().toString().slice(-5)}`,
          footerNotes: 'يرجى مراجعة ومتابعة تحصيل هذه المديونيات المفصلة حسب العملات لضمان توازن الصناديق.'
        }
      }
    };

    setPreviewData(reportData);
  };

  const handlePrintDailyCompletedReport = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const deliveredToday = invoiceItems.filter(item => {
      const isDelivered = ['60', 'delivered'].includes(item.status);
      if (!isDelivered) return false;
      
      const updateDate = item.updatedAt?.toDate ? item.updatedAt.toDate() : (item.updatedAt?.seconds ? new Date(item.updatedAt.seconds * 1000) : null);
      if (updateDate) {
        updateDate.setHours(0,0,0,0);
        return updateDate.getTime() === today.getTime();
      }
      return false;
    });

    const reportData = {
      type: 'table',
      data: {
        table: {
          title: 'تقرير الصيانة المنجزة والمسلمة اليومي',
          customerName: 'تقرير يومي لجميع الفنيين',
          subtitle: `كشف بجميع الأجهزة التي تم تسليمها بتاريخ اليوم (${today.toLocaleDateString('ar-YE')})`,
          headers: ["الجهاز", "العميل", "رقم الفاتورة", "الفني المختص", "قيمة العمل", "الحالة"],
          rows: deliveredToday.map(item => {
            const inv = invoices.find(i => i.id === item.invoiceId || i.invoiceNumber === item.invoiceNumber);
            return [
              `${item.deviceType || ''} - ${item.deviceName || ''}`,
              item.customerName || inv?.customerName || '---',
              item.invoiceNumber || '---',
              item.technician || 'غير محدد',
              `${(item.cost || 0).toLocaleString('en-US')} ${inv?.currency || 'ر.ي'}`,
              'تم التسليم'
            ];
          }),
          userName: user?.displayName || user?.name || 'موظف النظام',
          reportNumber: `REP-DAY-${new Date().getTime().toString().slice(-5)}`,
          footerNotes: `إجمالي الأجهزة المنجزة لليوم: ${deliveredToday.length} أجهزة. تم استخراج التقرير آلياً من سجلات النظام.`
        }
      }
    };

    setPreviewData(reportData);
  };

  const handlePrintDelayedDevicesReport = () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    const delayedItems = invoiceItems.filter(item => {
      const isNotDelivered = !['60', 'delivered'].includes(item.status);
      if (!isNotDelivered) return false;
      
      const creationDate = parseDate(item.createdAt);
      return creationDate && creationDate < fiveDaysAgo;
    });

    const reportData = {
      type: 'table',
      data: {
        table: {
          title: 'تقرير الأجهزة المعلقة والمتأخرة (تجاوزت 5 أيام)',
          customerName: 'كشف المتابعة الفنية',
          subtitle: `الأجهزة التي لم يتم تسليمها ولا تزال بالمركز لأكثر من 5 أيام (إجمالي: ${delayedItems.length})`,
          headers: ["الجهاز", "العميل", "تاريخ الدخول", "المدة بالمركز", "الفني", "الحالة"],
          rows: delayedItems.map(item => {
            const creationDate = parseDate(item.createdAt) || new Date();
            const daysInCenter = Math.floor((new Date().getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24));
            const inv = invoices.find(i => i.id === item.invoiceId || i.invoiceNumber === item.invoiceNumber);
            
            return [
              `${item.deviceType || ''} - ${item.deviceName || ''}`,
              item.customerName || inv?.customerName || '---',
              creationDate.toLocaleDateString('ar-YE'),
              `${daysInCenter} أيام`,
              item.technician || 'غير مسند',
              getStatusText(item.status)
            ];
          }),
          userName: user?.displayName || user?.name || 'موظف النظام',
          reportNumber: `REP-DLY-${new Date().getTime().toString().slice(-5)}`,
          footerNotes: 'يجب مراجعة هذه الأجهزة مع القسم الفني لتوضيح أسباب التأخير وتحديث العملاء بالحالة.'
        }
      }
    };

    setPreviewData(reportData);
  };

  const handlePrintTechnicianProductivityReport = () => {
    const techGroups: Record<string, any[]> = {};
    invoiceItems.forEach(item => {
      const tech = item.technician || 'فني غير محدد';
      if (!techGroups[tech]) techGroups[tech] = [];
      techGroups[tech].push(item);
    });

    const groups = Object.entries(techGroups).map(([tech, items]) => {
      const delivered = items.filter(it => ['60', 'delivered'].includes(it.status));
      const inProgress = items.filter(it => !['60', 'delivered'].includes(it.status));
      const totalRevenue = delivered.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
      
      return {
        title: `ملخص إنتاجية: ${tech}`,
        subtitle: `إجمالي الأجهزة: ${items.length} | المنجز: ${delivered.length} | قيد العمل: ${inProgress.length}`,
        rows: items.map(it => {
          const inv = invoices.find(i => i.id === it.invoiceId || i.invoiceNumber === it.invoiceNumber);
          return [
            `${it.deviceType || ''} - ${it.deviceName || ''}`,
            it.customerName || inv?.customerName || '---',
            it.invoiceNumber || '---',
            getStatusText(it.status),
            `${(it.cost || 0).toLocaleString('en-US')} ${inv?.currency || 'ر.ي'}`
          ];
        }),
        footerNotes: `إجمالي مستحقات وإيرادات هذا الفني (للمنجز): ${totalRevenue.toLocaleString('en-US')} ر.ي`
      };
    });

    const reportData = {
      type: 'table',
      data: {
        table: {
          title: 'تقرير إنتاجية ومستحقات المهندسين والفنيين',
          customerName: 'قسم الإدارة الفنية والمالية',
          subtitle: `قياس دقة الأداء وحساب نسب الإنجاز والمستحقات لجميع الكوادر الفنية`,
          headers: ["الجهاز", "العميل", "رقم الفاتورة", "حالة الإنجاز", "قيمة العمل"],
          groups,
          userName: user?.displayName || user?.name || 'موظف النظام',
          reportNumber: `REP-PROD-${new Date().getTime().toString().slice(-5)}`,
          footerNotes: 'هذا التقرير يعكس النشاط الفعلي المسجل في النظام، ويتم صرف المستحقات بناءً على الأجهزة المسلمة فعلياً (Delivered).'
        }
      }
    };

    setPreviewData(reportData);
  };

  const [reportSearchTerm, setReportSearchTerm] = useState('');
  const [showReportDropdown, setShowReportDropdown] = useState(false);
  const [selectedReportInvoice, setSelectedReportInvoice] = useState<any | null>(null);

  // Pagination for Customer Statement
  const [ledgerPage, setLedgerPage] = useState(1);
  const itemsPerPage = 10;

  // Subscribed collections for live & instant sensitive autocomplete
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load shop config for print headers
  const [shopConfig, setShopConfig] = useState<any>(null);

  // Print overlay state
  const [previewData, setPreviewData] = useState<{type: 'invoice' | 'voucher' | 'statement' | 'table', data: any} | null>(null);

  useBackHandler(previewData !== null, () => setPreviewData(null));


  useEffect(() => {
    setLoading(true);
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snap) => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubItems = onSnapshot(collection(db, 'invoice_items'), (snap) => {
      setInvoiceItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubTransactions = onSnapshot(collection(db, 'vault_transactions'), (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    getDoc(doc(db, 'company_details', 'main_details')).then((snap) => {
      if (snap.exists()) {
        setShopConfig(snap.data());
      }
    });

    setLoading(false);

    return () => {
      unsubCustomers();
      unsubInvoices();
      unsubItems();
      unsubTransactions();
    };
  }, []);

  // Format Helper to calculate actual cost of an invoice excluding pending, cancelled, or failed devices
  const getInvoiceActualCost = (itemsList: any[], invoice?: any) => {
    return itemsList.reduce((sum, item) => {
      // Exclude items in pending statuses 
      if (['10', '20', '21', '22', '25', '30', '35', '40', 'new', 'in_progress', 'awaiting_parts', 'awaiting_approval', 'repairing'].includes(item.status)) {
        return sum;
      }
      
      const sub = (item.subStatus || '').toLowerCase();
      const status = (item.status || '').toLowerCase();
      const src = (item.source || '').toLowerCase();

      const isExcluded = 
        ['70', 'cancelled', 'refused', 'unrepairable', 'parts_not_available', 'failed'].includes(status) ||
        ['cancelled', 'refused', 'unrepairable', 'parts_not_available', 'failed'].includes(sub) ||
        ['cancelled', 'refused', 'unrepairable', 'parts_not_available', 'failed'].includes(src) ||
        (item.failureReason !== null && item.failureReason !== undefined && item.failureReason !== '');
      
      if (isExcluded) {
        return sum;
      }
      
      return sum + (Number(item.cost) || 0);
    }, 0) - (invoice ? Number(invoice.discount || 0) : 0) + (invoice ? Number(invoice.tax || 0) : 0);
  };

  const getCustomerCurrencyLabel = (customerId: string) => {
    const customerInvs = invoices.filter(inv => inv.customerId === customerId);
    const currencies = Array.from(new Set(customerInvs.map(inv => inv.currency || 'USD')));
    if (currencies.length === 0) return 'USD';
    return currencies.join(' / ');
  };

  const getCustomerOutstandingAmount = (customerId: string) => {
    const customerInvs = invoices.filter(inv => inv.customerId === customerId);
    return customerInvs.reduce((sum, inv) => {
      const invItems = invoiceItems.filter(it => it.invoiceNumber === inv.invoiceNumber);
      const actualCost = getInvoiceActualCost(invItems, inv);
      return sum + Math.max(0, actualCost - Number(inv.amountPaid || 0));
    }, 0);
  };

  const getCustomerTotalCost = (customerId: string) => {
    const customerInvs = invoices.filter(inv => inv.customerId === customerId);
    return customerInvs.reduce((sum, inv) => {
      const invItems = invoiceItems.filter(it => it.invoiceNumber === inv.invoiceNumber);
      return sum + getInvoiceActualCost(invItems, inv);
    }, 0);
  };

  const getCustomerTotalPaid = (customerId: string) => {
    const customerInvs = invoices.filter(inv => inv.customerId === customerId);
    const invoicesPaid = customerInvs.reduce((sum, inv) => sum + Number(inv.amountPaid || 0), 0);
    
    // Separate receipts
    const separateReceipts = transactions
      .filter(tx => tx.customerId === customerId && tx.type === 'receipt' && (!tx.invoiceNumber || tx.invoiceNumber.trim() === ''))
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);

    // Separate payments
    const separatePayments = transactions
      .filter(tx => tx.customerId === customerId && tx.type === 'payment')
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);

    return invoicesPaid + separateReceipts - separatePayments;
  };

  // Chronological Statement Entries
  const getStatementEntries = (customerId: string) => {
    const entries: any[] = [];

    // Invoices
    const customerInvs = invoices.filter(inv => inv.customerId === customerId);
    customerInvs.forEach(inv => {
      const invItems = invoiceItems.filter(it => it.invoiceId === inv.id || it.invoiceNumber === inv.invoiceNumber);
      const actualCost = getInvoiceActualCost(invItems, inv);

      const explicitType = inv.invoiceType || inv.templateType || inv.type || '';
      let invTypeTitle = 'فاتورة صيانة';
      if (explicitType === 'sale_software') {
        invTypeTitle = 'فاتورة خدمات برمجية';
      } else if (explicitType === 'sale_parts') {
        invTypeTitle = 'فاتورة بيع قطع غيار';
      } else if (explicitType === 'sale_maintenance') {
        invTypeTitle = 'فاتورة صيانة خارجية';
      } else if (typeof explicitType === 'string' && explicitType.startsWith('sale_')) {
        invTypeTitle = `فاتورة مبيعات (${explicitType.replace('sale_', '')})`;
      } else if (inv.invoiceNumber && String(inv.invoiceNumber).startsWith('O-')) {
        invTypeTitle = 'فاتورة مبيعات أجهزة/قطع';
      } else {
        invTypeTitle = 'فاتورة صيانة';
      }

      const itemNotes = invItems.map(i => {
        const nameStr = i.deviceName || i.deviceType || '';
        const brandStr = i.brand ? `- ${i.brand}` : '';
        return `${nameStr} ${brandStr}`.trim();
      }).filter(Boolean).join(' | ');

      entries.push({
        id: `inv-${inv.id}`,
        date: parseDate(inv.createdAt) || new Date(),
        type: invTypeTitle,
        reference: String(inv.invoiceNumber).replace(/#/g, ''),
        details: inv.notes?.trim() || itemNotes || 'خدمات ومبيعات أجهزة',
        debit: actualCost,
        credit: Number(inv.amountPaid || 0)
      });
    });

    // Receipts and Payments
    const customerTransactions = transactions.filter(tx => tx.customerId === customerId);
    customerTransactions.forEach(tx => {
      const txDate = parseTxDate(tx) || new Date();
      if (tx.type === 'receipt' || tx.type === 'invoice_payment') {
        entries.push({
          id: `tx-${tx.id}`,
          date: txDate,
          type: 'سند قبض',
          reference: String(tx.voucherNumber || tx.invoiceNumber || tx.id?.substring(0, 5)).replace(/#/g, ''),
          details: tx.notes?.trim() || tx.statementNote || tx.transactionCategory || 'قبض نقدي تحت الحساب',
          debit: 0,
          credit: Math.abs(Number(tx.amount || 0))
        });
      } else if (tx.type === 'payment') {
        entries.push({
          id: `tx-${tx.id}`,
          date: txDate,
          type: 'سند صرف',
          reference: String(tx.voucherNumber || tx.id?.substring(0, 5)).replace(/#/g, ''),
          details: tx.notes?.trim() || tx.transactionCategory || 'صرف مالي أو استرجاع نقدي',
          debit: Math.abs(Number(tx.amount || 0)),
          credit: 0
        });
      }
    });

    // Sort chronologically
    entries.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Filter non-zero items
    const activeEntries = entries.filter(e => e.debit > 0.001 || e.credit > 0.001);

    // Compute balance
    let balance = 0;
    return activeEntries.map(entry => {
      balance += entry.debit - entry.credit;
      return {
        ...entry,
        runningBalance: balance
      };
    });
  };

  // CUSTOMER AUTOCOMPLETE SENSITIVITY
  const getCustomerSuggestions = () => {
    if (!customerSearchTerm.trim()) return [];
    if (customerSearchMode === 'name') {
      return customers.filter(c => 
        c.name?.toLowerCase().includes(customerSearchTerm.toLowerCase())
      ).slice(0, 8);
    } else {
      // Numbers search: check phone1, phone2, or customerNumber
      return customers.filter(c => 
        c.phone1?.includes(customerSearchTerm) || 
        c.phone2?.includes(customerSearchTerm) ||
        String(c.customerNumber || '').includes(customerSearchTerm)
      ).slice(0, 8);
    }
  };

  // INVOICE AUTOCOMPLETE SENSITIVITY
  const getInvoiceSuggestions = () => {
    if (!invoiceSearchTerm.trim()) return [];
    return invoices.filter(inv => 
      String(inv.invoiceNumber || '').includes(invoiceSearchTerm) ||
      inv.customerName?.toLowerCase().includes(invoiceSearchTerm.toLowerCase())
    ).slice(0, 8);
  };

  // VOUCHER AUTOCOMPLETE SENSITIVITY
  const getVoucherSuggestions = () => {
    if (!voucherSearchTerm.trim()) return [];
    return transactions.filter(tx => 
      (tx.type === 'receipt' || tx.type === 'payment') && (
        String(tx.voucherNumber || '').includes(voucherSearchTerm) ||
        tx.customerName?.toLowerCase().includes(voucherSearchTerm.toLowerCase())
      )
    ).slice(0, 8);
  };

  // REPORT AUTOCOMPLETE SENSITIVITY
  const getReportSuggestions = () => {
    if (!reportSearchTerm.trim()) return [];
    return invoices.filter(inv => 
      String(inv.invoiceNumber || '').includes(reportSearchTerm) ||
      inv.customerName?.toLowerCase().includes(reportSearchTerm.toLowerCase())
    ).slice(0, 8);
  };

  // EXECUTIONS
  const handleCustomerSearchExecute = (targetCust?: any) => {
    setShowCustomerDropdown(false);
    const resolvedCust = targetCust || getCustomerSuggestions()[0];
    if (resolvedCust) {
      setSelectedCustomer(resolvedCust);
      setCustomerSearchTerm(resolvedCust.name);
    } else {
      setSelectedCustomer(null);
    }
  };

  const handleInvoiceSearchExecute = (targetInv?: any) => {
    setShowInvoiceDropdown(false);
    const resolvedInv = targetInv || getInvoiceSuggestions()[0];
    if (resolvedInv) {
      setSelectedInvoice(resolvedInv);
      setInvoiceSearchTerm(String(resolvedInv.invoiceNumber || ''));
    } else {
      setSelectedInvoice(null);
    }
  };

  const handleReportSearchExecute = (targetInv?: any) => {
    setShowReportDropdown(false);
    const resolvedInv = targetInv || getReportSuggestions()[0];
    if (resolvedInv) {
      setSelectedReportInvoice(resolvedInv);
      setReportSearchTerm(String(resolvedInv.invoiceNumber || ''));
    } else {
      setSelectedReportInvoice(null);
    }
  };

  const handleVoucherSearchExecute = (targetTx?: any) => {
    setShowVoucherDropdown(false);
    const resolvedTx = targetTx || getVoucherSuggestions()[0];
    if (resolvedTx) {
      setSelectedVoucher(resolvedTx);
      setVoucherSearchTerm(String(resolvedTx.voucherNumber || ''));
    } else {
      setSelectedVoucher(null);
    }
  };

  // Clear states when selecting another tab
  const handleTabChange = (tab: 'customer' | 'invoice' | 'voucher' | 'report') => {
    setActiveTab(tab);
    // Reset selections and inputs
    setCustomerSearchTerm('');
    setSelectedCustomer(null);
    setInvoiceSearchTerm('');
    setSelectedInvoice(null);
    setVoucherSearchTerm('');
    setSelectedVoucher(null);
    setActiveReportType(null);
  };

  // Invoice Items details helper
  const getInvoiceItemsList = (invNo: any, invId?: string) => {
    const cleanInvNo = String(invNo || '').replace(/#/g, '').trim();
    const cleanInvId = String(invId || '').trim();
    return invoiceItems.filter(item => {
      const itemInvNo = String(item.invoiceNumber || '').replace(/#/g, '').trim();
      const itemInvId = String(item.invoiceId || '').trim();
      return (cleanInvNo && itemInvNo === cleanInvNo) || 
             (cleanInvId && itemInvId === cleanInvId) || 
             (cleanInvNo && itemInvId === cleanInvNo);
    });
  };

  const handleViewReport = (entry: any) => {
    if (entry.id.startsWith('inv-')) {
      const invId = entry.id.substring(4);
      const inv = invoices.find(i => i.id === invId);
      if (inv) {
        const cust = customers.find(c => c.id === inv.customerId);
        setPreviewData({
          type: 'invoice',
          data: {
            invoice: {
              ...inv,
              customerPhone: cust?.phone1 || inv.customerPhone || ''
            },
            items: getInvoiceItemsList(inv.invoiceNumber, inv.id)
          }
        });
      }
    } else if (entry.id.startsWith('tx-')) {
      const txId = entry.id.substring(3);
      const tx = transactions.find(t => t.id === txId);
      if (tx) {
        const cust = customers.find(c => c.id === tx.customerId);
        setPreviewData({
          type: 'voucher',
          data: {
            voucher: {
               ...tx,
               customerPhone: cust?.phone1 || tx.customerPhone || '',
               type: voucherPrintTemplate
            },
            templateType: voucherPrintTemplate
          }
        });
      }
    }
  };

  const handleViewComprehensiveReport = (customer: any) => {
    const entries = getStatementEntries(customer.id!);
    
    // Enrich entries with device names if it's an invoice
    const enrichedEntries = entries.map(entry => {
      if (entry.id.startsWith('inv-')) {
        const invId = entry.id.substring(4);
        const items = getInvoiceItemsList(entry.reference, invId);
        const deviceList = items.map(it => it.deviceName || 'جهاز تقني').join(' + ');
        const typeTitle = entry.type || 'فاتورة';
        const labelStr = deviceList ? `${typeTitle}: ${deviceList}` : (entry.details || typeTitle);
        return {
          ...entry,
          label: labelStr,
          formattedDate: formatDate(entry.date)
        };
      }
      return {
        ...entry,
        label: entry.details,
        formattedDate: formatDate(entry.date)
      };
    });

    setPreviewData({
      type: 'statement',
      data: {
        statement: {
          id: customer.id,
          customerName: customer.name,
          customerNumber: customer.customerNumber,
          customerPhone: customer.phone1,
          currency: getCustomerCurrencyLabel(customer.id!),
          liabilityCurrency: customer.liabilityCurrency || 'USD',
          entries: enrichedEntries
        }
      }
    });
  };

  const handleViewInvoiceDetails = (inv: any, tmpl?: string) => {
    const cust = customers.find(c => c.id === inv.customerId);
    setPreviewData({
      type: 'invoice',
      data: {
        invoice: {
          ...inv,
          customerPhone: cust?.phone1 || inv.customerPhone || ''
        },
        items: getInvoiceItemsList(inv.invoiceNumber, inv.id),
        templateType: tmpl
      }
    });
  };

  const handleViewVoucherDetails = (tx: any, tmpl?: string) => {
    const cust = customers.find(c => c.id === tx.customerId);
    setPreviewData({
      type: 'voucher',
      data: {
        voucher: {
          ...tx,
          customerPhone: cust?.phone1 || tx.customerPhone || '',
          type: tmpl === 'receipt' ? 'receipt' : tmpl === 'payment' ? 'payment' : tx.type
        },
        templateType: tmpl
      }
    });
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case '10':
      case 'new': return 'دخول جديد';
      case '20':
      case 'inspected':
      case 'testing': return 'قيد الفحص';
      case '21': return 'فحص مرحلي 1 (المهندس)';
      case '22': return 'فحص مرحلي 2 (المشرف)';
      case '30':
      case 'awaiting_approval': return 'إنتظار موافقة العميل';
      case 'approved': return 'تمت موافقة العميل';
      case '35':
      case 'awaiting_parts': return 'انتظار قطع الغيار';
      case 'parts_available': return 'تم توفير قطع الغيار';
      case 'parts_not_available': return 'لم تتوفر قطع الغيار';
      case '40':
      case 'repairing': return 'قيد الصيانة';
      case '50':
      case 'ready':
      case 'intact':
      case 'unrepairable':
      case 'refused': return 'جاهز للتسليم';
      case '60':
      case 'delivered': return 'تم التسليم والمغادرة';
      case '70': return 'إلغاء وسحب الجهاز';
      default: return 'غير محدد';
    }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case '10':
      case 'new': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case '20':
      case 'inspected':
      case 'testing': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case '21': return 'bg-amber-600/15 text-amber-500 border-amber-500/20';
      case '22': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case '30':
      case 'awaiting_approval': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'approved': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case '35':
      case 'awaiting_parts': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'parts_available': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'parts_not_available': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case '40':
      case 'repairing': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case '50':
      case 'ready':
      case 'intact':
      case 'unrepairable':
      case 'refused': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case '60':
      case 'delivered': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-white/5';
    }
  };

  return (
    <div className="w-full space-y-5 pb-20 text-right px-1 pt-4" dir="rtl">

      {/* Top Controls / Tabs Buttons */}
      <div className="grid grid-cols-4 gap-1 sm:gap-2 bg-[#141414] p-1.5 rounded-2xl border border-white/5">
        <button
          onClick={() => handleTabChange('customer')}
          className={`py-3 px-1 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold text-[11px] sm:text-xs font-cairo transition-all ${
            activeTab === 'customer' 
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' 
              : 'hover:bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          <Users size={15} />
          <span>عميل</span>
        </button>

        <button
          onClick={() => handleTabChange('invoice')}
          className={`py-3 px-1 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold text-[11px] sm:text-xs font-cairo transition-all ${
            activeTab === 'invoice' 
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' 
              : 'hover:bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          <FileText size={15} />
          <span>فاتورة</span>
        </button>

        <button
          onClick={() => handleTabChange('voucher')}
          className={`py-3 px-1 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold text-[11px] sm:text-xs font-cairo transition-all ${
            activeTab === 'voucher' 
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' 
              : 'hover:bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          <DollarSign size={15} />
          <span>سند مالي</span>
        </button>

        <button
          onClick={() => handleTabChange('report')}
          className={`py-3 px-1 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold text-[11px] sm:text-xs font-cairo transition-all ${
            activeTab === 'report' 
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' 
              : 'hover:bg-white/5 text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 size={15} />
          <span>تقرير</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-orange-500" size={36} />
          <p className="text-gray-500 font-bold text-xs font-cairo">جاري تحميل السجلات والربط المتزامن...</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* TAB 1: CUSTOMER SEARCH */}
          {activeTab === 'customer' && (
            <div className="space-y-4">
              <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl space-y-4 shadow-xl">
                
                {/* Mode Selector (Row 1) */}
                <div className="flex items-center gap-6 border-b border-white/5 pb-3">
                  <span className="text-xs font-bold text-gray-400 font-cairo font-mono">طريقة البحث:</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none font-cairo text-xs font-bold">
                      <input 
                        type="radio" 
                        name="customerMode" 
                        checked={customerSearchMode === 'name'} 
                        onChange={() => {
                          setCustomerSearchMode('name');
                          setCustomerSearchTerm('');
                          setSelectedCustomer(null);
                        }}
                        className="accent-orange-600 w-4 h-4"
                      />
                      <span className={customerSearchMode === 'name' ? 'text-white' : 'text-gray-500'}>بحث بالاسم</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none font-cairo text-xs font-bold">
                      <input 
                        type="radio" 
                        name="customerMode" 
                        checked={customerSearchMode === 'phone'} 
                        onChange={() => {
                          setCustomerSearchMode('phone');
                          setCustomerSearchTerm('');
                          setSelectedCustomer(null);
                        }}
                        className="accent-orange-600 w-4 h-4"
                      />
                      <span className={customerSearchMode === 'phone' ? 'text-white' : 'text-gray-500'}>بحث بالرقم</span>
                    </label>
                  </div>
                </div>

                {/* Input Area (Row 2) */}
                <div className="relative">
                  <div className="relative w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      inputMode={customerSearchMode === 'phone' ? 'numeric' : 'text'}
                      pattern={customerSearchMode === 'phone' ? '[0-9]*' : undefined}
                      placeholder={customerSearchMode === 'name' ? 'أدخل اسم العميل للبحث (مثال: أحمد)' : 'أدخل رقم هاتف أو كود العميل'}
                      value={customerSearchTerm}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (customerSearchMode === 'phone') {
                          val = val.replace(/[^0-9]/g, ''); // Accept numbers only
                        }
                        setCustomerSearchTerm(val);
                        setShowCustomerDropdown(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomerSearchExecute();
                        }
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-12 py-3 focus:border-orange-500 outline-none transition-all text-xs font-bold text-white font-cairo"
                    />

                    {/* Compact Search Button at the left end ("النهاية") */}
                    <button
                      onClick={() => handleCustomerSearchExecute()}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-600 hover:bg-orange-500 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 animate-pulse-subtle"
                      title="إجراء البحث"
                    >
                      <Search size={14} />
                    </button>

                    {/* Dropdown suggestions */}
                    {showCustomerDropdown && getCustomerSuggestions().length > 0 && (
                      <div className="absolute top-14 right-0 left-0 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl z-50 divide-y divide-white/5 max-h-60 overflow-y-auto">
                        {getCustomerSuggestions().map((cust) => (
                          <button
                            key={cust.id}
                            onClick={() => {
                              handleCustomerSearchExecute(cust);
                            }}
                            className="w-full text-right px-4 py-3 hover:bg-orange-600/10 transition-colors flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-white font-cairo">{cust.name}</span>
                            <div className="flex items-center gap-3 font-mono text-gray-500">
                              <span>{cust.phone1}</span>
                              <span className="bg-white/5 px-2 py-0.5 rounded text-[10px]">#{cust.customerNumber}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Display Customer Ledger Account Statement */}
              {selectedCustomer ? (
                <div className="space-y-4">
                  {/* Customer Intro Card */}
                  <div className="bg-[#111111] border-l-4 border-orange-500 p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-500 font-bold font-cairo font-mono block">العميل المحدد كود: #{selectedCustomer.customerNumber}</span>
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-black text-white font-cairo">{selectedCustomer.name}</h2>
                        <button
                          onClick={() => handleViewComprehensiveReport(selectedCustomer)}
                          className="p-2 bg-orange-600/20 text-orange-400 hover:bg-orange-600 hover:text-white rounded-xl transition-all"
                          title="توليد كشف حساب شامل موحد"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                      {selectedCustomer.companyName && (
                        <p className="text-xs text-gray-400 font-bold font-cairo">الجهة: {selectedCustomer.companyName}</p>
                      )}
                      <p className="text-xs text-gray-400 font-mono mt-0.5">الهاتف: {selectedCustomer.phone1} {selectedCustomer.phone2 ? `| ${selectedCustomer.phone2}` : ''}</p>
                    </div>

                    {/* Net balance display block */}
                    {(() => {
                      const totalCost = getCustomerTotalCost(selectedCustomer.id!);
                      const totalPaid = getCustomerTotalPaid(selectedCustomer.id!);
                      const diff = totalPaid - totalCost;
                      const isCreditor = diff > 0.01;
                      const isDebtor = diff < -0.01;
                      const arCurrency = getCustomerCurrencyLabel(selectedCustomer.id!);

                      return (
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center md:text-left min-w-[200px]">
                          <span className="text-[9px] text-gray-500 font-bold font-cairo block uppercase">الرصيد الصافي الجاري</span>
                          <span className={`text-xl font-black font-mono tracking-tight block my-0.5 ${isCreditor ? 'text-emerald-400' : isDebtor ? 'text-rose-500' : 'text-gray-400'}`}>
                            {Math.abs(diff).toLocaleString('en-US')} <span className="text-xs font-sans">{arCurrency}</span>
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold font-cairo">
                            {isCreditor ? 'دائن (له مبالغ في الخزينة)' : isDebtor ? 'مدين (متبقي مستحقات صيانة)' : 'متزن دفترياً'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Operational Ledger Table */}
                  <div className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                      <h3 className="text-xs font-black text-white font-cairo">جميع الحركات والقيود المالية للعميل</h3>
                      <button
                        onClick={() => handleViewComprehensiveReport(selectedCustomer)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white border border-orange-500/20 rounded-xl transition-all font-bold text-[10px] font-cairo"
                        title="استخراج كشف حركات شامل وملخص مالي"
                      >
                        <FileText size={14} />
                        <span>كشف شامل (فاتورة خروج + ملخص)</span>
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs select-none">
                        <thead>
                          <tr className="bg-white/5 border-b border-white/10 text-gray-400 uppercase">
                            <th className="px-4 py-3 font-bold text-center w-12">مـ</th>
                            <th className="px-4 py-3 font-bold">نوع الحركة</th>
                            <th className="px-4 py-3 font-bold text-center">رقم المرجع</th>
                            <th className="px-4 py-3 font-bold text-center">تاريخ ووقت القيد</th>
                            <th className="px-4 py-3 font-bold">البيان والتفاصيل</th>
                            <th className="px-4 py-3 text-rose-400 text-center bg-rose-500/5">المستحق (مدين)</th>
                            <th className="px-4 py-3 text-emerald-400 text-center bg-emerald-500/5">المقبوض (دائن)</th>
                            <th className="px-4 py-3 text-center font-bold">الرصيد الجاري</th>
                            <th className="px-4 py-3 text-center font-bold">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                          {(() => {
                            const allEntries = getStatementEntries(selectedCustomer.id!);
                            const totalPages = Math.max(1, Math.ceil(allEntries.length / itemsPerPage));
                            const safeCurrentPage = Math.min(ledgerPage, totalPages);
                            const currentEntries = allEntries.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

                            if (allEntries.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500 font-bold font-cairo">
                                    لا توجد قيود أو فواتير صيانة مفعّلة في الحساب المالي للعميل حالياً.
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <>
                                {currentEntries.map((entry, index) => {
                                  const arCurrency = getCustomerCurrencyLabel(selectedCustomer.id!);
                                  const globalIndex = ((safeCurrentPage - 1) * itemsPerPage) + index + 1;
                                  return (
                                    <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors whitespace-nowrap">
                                      <td className="px-4 py-3.5 text-center font-mono font-bold text-gray-500">{globalIndex}</td>
                                      <td className="px-4 py-3.5 font-bold font-cairo text-white">{entry.type}</td>
                                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-500">{entry.reference}</td>
                                      <td className="px-4 py-3.5 text-center font-mono text-gray-400">
                                        {formatDate(entry.date)} {formatTime(entry.date)}
                                      </td>
                                      <td className="px-4 py-3.5 font-cairo text-slate-200 min-w-[350px] overflow-hidden text-ellipsis whitespace-nowrap">
                                        <span className="font-bold">{entry.details}</span>
                                      </td>
                                      <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-500 bg-rose-500/5">
                                        {entry.debit > 0 ? entry.debit.toFixed(2) : '---'}
                                      </td>
                                      <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-400 bg-emerald-500/5">
                                        {entry.credit > 0 ? entry.credit.toFixed(2) : '---'}
                                      </td>
                                      <td className="px-4 py-3.5 text-center font-mono font-extrabold text-white">
                                        {entry.runningBalance.toFixed(2)} <span className="text-[10px] text-gray-500 font-sans">{arCurrency}</span>
                                      </td>
                                      <td className="px-4 py-3.5 text-center">
                                        <button 
                                          onClick={() => handleViewReport(entry)}
                                          className="bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600 hover:text-white px-3 py-1.5 flex items-center justify-center rounded-xl transition-all w-full"
                                          title="عرض المستند والطباعة"
                                        >
                                          <FileText size={16} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {totalPages > 1 && (
                                  <tr>
                                    <td colSpan={9} className="px-4 py-4 bg-black/20">
                                      <div className="flex items-center justify-between" dir="rtl">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => setLedgerPage(prev => Math.max(1, prev - 1))}
                                            disabled={safeCurrentPage === 1}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                          >
                                            <ChevronLeft className="rotate-180" size={18} />
                                          </button>
                                          <div className="flex items-center gap-1">
                                            {[...Array(totalPages)].map((_, i) => (
                                              <button
                                                key={i}
                                                onClick={() => setLedgerPage(i + 1)}
                                                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                                                  safeCurrentPage === i + 1
                                                    ? 'bg-orange-600 text-white'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                              >
                                                {i + 1}
                                              </button>
                                            ))}
                                          </div>
                                          <button
                                            onClick={() => setLedgerPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={safeCurrentPage === totalPages}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                          >
                                            <ChevronLeft size={18} />
                                          </button>
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-bold font-cairo">
                                          عرض {((safeCurrentPage - 1) * itemsPerPage) + 1} إلى {Math.min(safeCurrentPage * itemsPerPage, allEntries.length)} من أصل {allEntries.length} حركة
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-gray-600 bg-[#111111] rounded-2xl border border-dashed border-white/5 space-y-3">
                  <User size={48} className="mx-auto text-gray-800" />
                  <p className="font-cairo text-sm font-bold">بإمكانك البحث واختيار عميل من الخيارات لعرض كشف الحساب المتكامل فوراً</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: INVOICE SEARCH */}
          {activeTab === 'invoice' && (
            <div className="space-y-4">
              <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl shadow-xl space-y-4">
                

                <div className="relative">
                  <div className="relative w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="أدخل رقم الفاتورة أو اسم صاحب الفاتورة للبحث"
                      value={invoiceSearchTerm}
                      onChange={(e) => {
                        setInvoiceSearchTerm(e.target.value);
                        setShowInvoiceDropdown(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleInvoiceSearchExecute();
                        }
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-12 py-3 focus:border-orange-500 outline-none transition-all text-xs font-bold text-white font-cairo"
                    />

                    {/* Compact Search Button at the left end ("النهاية") */}
                    <button
                      onClick={() => handleInvoiceSearchExecute()}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-600 hover:bg-orange-500 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 animate-pulse-subtle"
                      title="إجراء البحث"
                    >
                      <Search size={14} />
                    </button>

                    {/* Suggestions list */}
                    {showInvoiceDropdown && getInvoiceSuggestions().length > 0 && (
                      <div className="absolute top-14 right-0 left-0 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl z-50 divide-y divide-white/5 max-h-60 overflow-y-auto">
                        {getInvoiceSuggestions().map((inv) => (
                          <button
                            key={inv.id}
                            onClick={() => {
                              handleInvoiceSearchExecute(inv);
                            }}
                            className="w-full text-right px-4 py-3 hover:bg-orange-600/10 transition-colors flex items-center justify-between text-xs"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-white font-cairo">فاتورة رقم: {inv.invoiceNumber}</span>
                              <span className="text-[10px] text-gray-500 font-bold font-cairo">العميل: {inv.customerName}</span>
                            </div>
                            <div className="font-mono text-amber-500 font-bold">
                              {inv.totalCost} {inv.currency}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Display Selected Invoice Details */}
              {selectedInvoice ? (
                <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-2xl space-y-6">
                  {/* Invoice Meta header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-orange-600/15 border border-orange-500/20 text-orange-400 font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg">
                          {selectedInvoice.invoiceType === 'sale_software' ? 'فاتورة خدمات برمجية' : (selectedInvoice.invoiceType === 'sale_maintenance' ? 'فاتورة صيانة خارجية' : (selectedInvoice.invoiceType === 'sale_parts' ? 'فاتورة بيع قطع غيار' : 'فاتورة صيانة'))} #{selectedInvoice.invoiceNumber}
                        </span>
                        <span className="text-xs text-gray-500 font-bold">
                          {parseDate(selectedInvoice.createdAt) ? parseDate(selectedInvoice.createdAt)!.toLocaleDateString('ar-YE') : '---'}
                        </span>
                      </div>
                      <h2 className="text-base font-black text-white font-cairo mt-1.5 flex items-center gap-2">
                        <User size={16} className="text-gray-500" />
                        <span>العميل: {selectedInvoice.customerName}</span>
                      </h2>
                    </div>

                    <div className="flex gap-4 flex-wrap">
                      <div className="text-center px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl min-w-[100px]">
                        <span className="text-[9px] text-gray-500 font-bold block">إجمالي الفاتورة</span>
                        <span className="font-mono font-bold text-base text-amber-500">{selectedInvoice.totalCost} {selectedInvoice.currency}</span>
                      </div>
                      <div className="text-center px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl min-w-[100px]">
                        <span className="text-[9px] text-gray-500 font-bold block">المدفوع</span>
                        <span className="font-mono font-bold text-base text-emerald-400">{selectedInvoice.amountPaid} {selectedInvoice.currency}</span>
                      </div>
                      <div className="text-center px-4 py-2 bg-white/[0.02] border border-white/5 rounded-xl min-w-[100px]">
                        <span className="text-[9px] text-gray-500 font-bold block">المتبقي</span>
                        <span className="font-mono font-black text-base text-rose-500">
                          {(Number(selectedInvoice.totalCost) - Number(selectedInvoice.amountPaid)).toFixed(2)} {selectedInvoice.currency}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleViewInvoiceDetails(selectedInvoice, invoicePrintTemplate)}
                        className="flex flex-col items-center justify-center px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl min-w-[100px] transition-all"
                        title="عرض الفاتورة للطباعة"
                      >
                        <Printer size={16} className="mb-1" />
                        <span className="text-[10px] font-bold block font-cairo">عرض التقرير</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode Selector for Invoice */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                    <span className="text-xs font-bold text-gray-400 font-cairo">المستند المطلوب عرضه وطباعته:</span>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer select-none font-cairo text-xs font-bold">
                        <input 
                          type="radio" 
                          name="searchInvoiceTemplate" 
                          checked={invoicePrintTemplate === 'entry'} 
                          onChange={() => setInvoicePrintTemplate('entry')}
                          className="accent-orange-600 w-4 h-4"
                        />
                        <span className={invoicePrintTemplate === 'entry' ? 'text-white' : 'text-gray-500'}>فاتورة دخول</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none font-cairo text-xs font-bold">
                        <input 
                          type="radio" 
                          name="searchInvoiceTemplate" 
                          checked={invoicePrintTemplate === 'exit'} 
                          onChange={() => setInvoicePrintTemplate('exit')}
                          className="accent-orange-600 w-4 h-4"
                        />
                        <span className={invoicePrintTemplate === 'exit' ? 'text-white' : 'text-gray-500'}>فاتورة خروج</span>
                      </label>
                    </div>
                  </div>

                  {/* List of items on this invoice */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-white font-cairo">تفاصيل الأجهزة المدرجة في الفاتورة ({getInvoiceItemsList(selectedInvoice.invoiceNumber, selectedInvoice.id).length}):</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getInvoiceItemsList(selectedInvoice.invoiceNumber, selectedInvoice.id).map((item, idx) => (
                        <div key={item.id} className="bg-black/30 p-4 border border-white/5 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white font-cairo">{item.deviceName || 'جهاز تقني'}</span>
                            <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${getStatusStyle(item.status)}`}>
                              {getStatusText(item.status)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-bold font-cairo">
                            <div>نوع الجهاز: <span className="text-slate-200">{item.deviceType}</span></div>
                            <div>الكمية: <span className="text-slate-200">{item.quantity}</span></div>
                            <div className="col-span-2">خلل الجهاز: <span className="text-slate-200">{item.faultType}</span></div>
                            {item.technicalNotes && <div className="col-span-2 text-amber-500">ملاحظات الفني: <span>{item.technicalNotes}</span></div>}
                          </div>

                          <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs font-mono">
                            <span className="text-gray-500">مـ : {idx + 1}</span>
                            <span className="text-amber-500 font-bold">التكلفة: {item.cost} {selectedInvoice.currency}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-20 text-gray-600 bg-[#111111] rounded-2xl border border-dashed border-white/5 space-y-3">
                  <FileText size={48} className="mx-auto text-gray-800" />
                  <p className="font-cairo text-sm font-bold">أدخل رقم الفاتورة أو اسم العميل لعرض ملف الفاتورة المتكامل وتفاصيل صيانة الأجهزة فوراً</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VOUCHER SEARCH */}
          {activeTab === 'voucher' && (
            <div className="space-y-4">
              <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl shadow-xl space-y-4">
                
                {/* Mode Selector */}
                <div className="flex items-center gap-6 border-b border-white/5 pb-3">
                  <span className="text-xs font-bold text-gray-400 font-cairo font-mono">نوع السند المراد البحث عنه:</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none font-cairo text-xs font-bold">
                      <input 
                        type="radio" 
                        name="voucherTemplate" 
                        checked={voucherPrintTemplate === 'payment'} 
                        onChange={() => setVoucherPrintTemplate('payment')}
                        className="accent-orange-600 w-4 h-4"
                      />
                      <span className={voucherPrintTemplate === 'payment' ? 'text-white' : 'text-gray-500'}>سند صرف</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none font-cairo text-xs font-bold">
                      <input 
                        type="radio" 
                        name="voucherTemplate" 
                        checked={voucherPrintTemplate === 'receipt'} 
                        onChange={() => setVoucherPrintTemplate('receipt')}
                        className="accent-orange-600 w-4 h-4"
                      />
                      <span className={voucherPrintTemplate === 'receipt' ? 'text-white' : 'text-gray-500'}>سند قبض</span>
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <div className="relative w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="أدخل رقم سند الصرف أو القبض (مثال: 1001)"
                      value={voucherSearchTerm}
                      onChange={(e) => {
                        setVoucherSearchTerm(e.target.value.replace(/[^0-9]/g, '')); // only numbers
                        setShowVoucherDropdown(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleVoucherSearchExecute();
                        }
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-12 py-3 focus:border-orange-500 outline-none transition-all text-sm font-bold text-white font-cairo font-mono font-sans"
                    />

                    {/* Compact Search Button at the left end ("النهاية") */}
                    <button
                      onClick={() => handleVoucherSearchExecute()}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-600 hover:bg-orange-500 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 animate-pulse-subtle"
                      title="إجراء البحث"
                    >
                      <Search size={14} />
                    </button>

                    {/* Voucher dropdown suggestions */}
                    {showVoucherDropdown && getVoucherSuggestions().length > 0 && (
                      <div className="absolute top-14 right-0 left-0 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl z-50 divide-y divide-white/5 max-h-60 overflow-y-auto">
                        {getVoucherSuggestions().map((tx) => (
                          <button
                            key={tx.id}
                            onClick={() => {
                              handleVoucherSearchExecute(tx);
                            }}
                            className="w-full text-right px-4 py-3 hover:bg-orange-600/10 transition-colors flex items-center justify-between text-xs"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-white font-cairo">سند رقم: {tx.voucherNumber} ({tx.type === 'receipt' ? 'قبض' : 'صرف'})</span>
                              <span className="text-[10px] text-gray-500 font-bold font-cairo">الحساب: {tx.customerName}</span>
                            </div>
                            <span className={`font-mono font-bold font-cairo ${tx.type === 'receipt' ? 'text-emerald-400' : 'text-rose-500'}`}>
                              {tx.amount} {tx.currency}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Display Voucher Details Card */}
              {selectedVoucher ? (
                <div className="w-full bg-[#111111] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden" dir="rtl">
                  
                  {/* Voucher top accent line */}
                  <div className={`absolute top-0 right-0 left-0 h-2 ${selectedVoucher.type === 'receipt' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-rose-500 to-amber-500'}`} />

                  {/* Receipt Voucher Body styled */}
                  <div className="space-y-5 text-right font-cairo">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <div>
                        <span className="text-[10px] text-gray-500 font-bold block">الحركة المحاسبية في الخزنة</span>
                        <h3 className="font-black text-base text-white">
                          {selectedVoucher.type === 'receipt' ? 'سند قبض مالي' : 'سند صرف للعميل'}
                        </h3>
                      </div>
                      <span className="bg-white/5 px-3 py-1 rounded-lg text-amber-500 font-mono font-bold text-xs">
                        سند رقم: {selectedVoucher.voucherNumber}
                      </span>
                    </div>

                    <div className="text-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl my-2">
                      <span className="text-[10px] text-gray-500 font-bold">المبلغ المدفوع كلياً</span>
                      <p className={`text-2xl font-black font-mono tracking-tight my-1 ${selectedVoucher.type === 'receipt' ? 'text-emerald-400' : 'text-rose-500'}`}>
                        {Math.abs(Number(selectedVoucher.amount || 0)).toLocaleString('en-US')} <span className="text-sm font-cairo font-bold">{selectedVoucher.currency}</span>
                      </p>
                    </div>

                    <div className="space-y-3.5 text-xs text-gray-400 font-bold">
                      <div className="flex justify-between items-center border-b border-white/[0.02] pb-1.5">
                        <span>اسم المستلم/العميل :</span>
                        <span className="text-white font-black">{selectedVoucher.customerName || '---'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/[0.02] pb-1.5">
                        <span>رقم الفاتورة المرجعية :</span>
                        <span className="text-amber-500 font-mono">{selectedVoucher.invoiceNumber || '---'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/[0.02] pb-1.5">
                        <span>تاريخ السند :</span>
                        <span className="text-gray-300 font-mono">
                          {formatTxDate(selectedVoucher)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-b border-white/[0.02] pb-1.5">
                        <span>اسم مدخل القيد المعتمد :</span>
                        <span className="text-slate-300">{selectedVoucher.userName || 'غير معروف'}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <span>ملاحظات وبيان السند :</span>
                        <span className="text-white p-2.5 bg-black/40 border border-white/5 rounded-xl font-medium font-cairo mt-1">
                          {selectedVoucher.notes || 'لا يوجد ملاحظات إضافية مسجلة في السند المالي.'}
                        </span>
                      </div>
                      
                      <div className="pt-2">
                        <button 
                          onClick={() => handleViewVoucherDetails(selectedVoucher, voucherPrintTemplate)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl transition-all"
                          title="عرض السند للطباعة"
                        >
                          <Printer size={16} />
                          <span className="text-xs font-bold font-cairo">عرض السند والطباعة الفورية</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-gray-600 bg-[#111111] rounded-2xl border border-dashed border-white/5 space-y-3">
                  <DollarSign size={48} className="mx-auto text-gray-800" />
                  <p className="font-cairo text-sm font-bold">يرجى كتابة رقم السند في الخانة بالأعلى لعرض بيانات مستند القبض أو مستند الصرف بالتفصيل</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SYSTEM AND MAINTENANCE REPORTS */}
          {activeTab === 'report' && (
            <div className="space-y-6">

              {/* REPORT TEMPLATE SEARCH */}
              <div className="bg-[#111111] border border-white/5 p-5 rounded-2xl shadow-xl space-y-4">
                
                {/* Mode Selector */}
                <div className="flex items-center gap-6 border-b border-white/5 pb-3">
                  <span className="text-xs font-bold text-gray-400 font-cairo font-mono">نوع التقرير للطباعة:</span>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer select-none font-cairo text-xs font-bold">
                      <input 
                        type="radio" 
                        name="reportTemplate" 
                        checked={reportPrintTemplate === 'inspection'} 
                        onChange={() => setReportPrintTemplate('inspection')}
                        className="accent-orange-600 w-4 h-4"
                      />
                      <span className={reportPrintTemplate === 'inspection' ? 'text-white' : 'text-gray-500'}>فحص فني</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none font-cairo text-xs font-bold">
                      <input 
                        type="radio" 
                        name="reportTemplate" 
                        checked={reportPrintTemplate === 'quotation'} 
                        onChange={() => setReportPrintTemplate('quotation')}
                        className="accent-orange-600 w-4 h-4"
                      />
                      <span className={reportPrintTemplate === 'quotation' ? 'text-white' : 'text-gray-500'}>عرض سعر</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none font-cairo text-xs font-bold">
                      <input 
                        type="radio" 
                        name="reportTemplate" 
                        checked={reportPrintTemplate === 'assignment'} 
                        onChange={() => setReportPrintTemplate('assignment')}
                        className="accent-orange-600 w-4 h-4"
                      />
                      <span className={reportPrintTemplate === 'assignment' ? 'text-white' : 'text-gray-500'}>حالة وإسناد</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none font-cairo text-xs font-bold">
                      <input 
                        type="radio" 
                        name="reportTemplate" 
                        checked={reportPrintTemplate === 'maintenance'} 
                        onChange={() => setReportPrintTemplate('maintenance')}
                        className="accent-orange-600 w-4 h-4"
                      />
                      <span className={reportPrintTemplate === 'maintenance' ? 'text-white' : 'text-gray-500'}>صيانة</span>
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <div className="relative w-full">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="أدخل رقم الفاتورة للبحث واستخراج التقرير"
                      value={reportSearchTerm}
                      onChange={(e) => {
                        setReportSearchTerm(e.target.value);
                        setShowReportDropdown(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleReportSearchExecute();
                        }
                      }}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-12 py-3 focus:border-orange-500 outline-none transition-all text-xs font-bold text-white font-cairo"
                    />

                    {/* Compact Search Button at the left end ("النهاية") */}
                    <button
                      onClick={() => handleReportSearchExecute()}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-600 hover:bg-orange-500 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 animate-pulse-subtle"
                      title="إجراء البحث"
                    >
                      <Search size={14} />
                    </button>

                    {/* Suggestions list */}
                    {showReportDropdown && getReportSuggestions().length > 0 && (
                      <div className="absolute top-14 right-0 left-0 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl z-50 divide-y divide-white/5 max-h-60 overflow-y-auto">
                        {getReportSuggestions().map((inv) => (
                          <button
                            key={inv.id}
                            onClick={() => handleReportSearchExecute(inv)}
                            className="w-full text-right px-4 py-3 hover:bg-orange-600/10 transition-colors flex items-center justify-between text-xs"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-white font-cairo">فاتورة رقم: {inv.invoiceNumber}</span>
                              <span className="text-[10px] text-gray-500 font-bold font-cairo">العميل: {inv.customerName}</span>
                            </div>
                            <div className="font-mono text-amber-500 font-bold">
                              {inv.totalCost} {inv.currency}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedReportInvoice && (
                   <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                     <span className="text-sm font-bold text-gray-300">
                        الفاتورة المختارة: <span className="text-amber-500 font-mono">{selectedReportInvoice.invoiceNumber}</span> - العميل: {selectedReportInvoice.customerName}
                     </span>
                     <button 
                        onClick={() => handleViewInvoiceDetails(selectedReportInvoice, reportPrintTemplate)}
                        className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl transition-all font-bold text-xs font-cairo flex items-center gap-2"
                        title="عرض التقرير للطباعة"
                      >
                        <Printer size={16} />
                        <span>عرض وطباعة التقرير المستهدف</span>
                      </button>
                   </div>
                )}
              </div>
              
              <div className="w-full h-px bg-white/5 my-6"></div>

              <div className="space-y-4">
                <h3 className="text-base font-black text-white font-cairo px-2">تقارير النظام والمهام الشاملة</h3>
                {/* Reports types bento selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                
                {/* Under Progress Devices report */}
                <button
                  onClick={() => setActiveReportType('progress_devices')}
                  className={`p-4 bg-[#111111] rounded-2xl hover:bg-white/5 hover:border-white/10 text-right space-y-2 transition-all border ${
                    activeReportType === 'progress_devices' ? 'border-orange-500' : 'border-white/5'
                  }`}
                >
                  <div className="p-2 bg-orange-600/10 text-orange-500 rounded-xl w-max">
                    <Clock size={20} />
                  </div>
                  <h3 className="font-black text-sm font-cairo text-white">الأجهزة قيد الفحص والصيانة</h3>
                  <p className="text-[10px] text-gray-500 font-bold font-cairo leading-relaxed">عرض تفصيلي لجميع الأجهزة النشطة في النظام والتي لم تسلم وتغادر بعد</p>
                </button>

                {/* Delivered Devices list */}
                <button
                  onClick={() => setActiveReportType('delivered_devices')}
                  className={`p-4 bg-[#111111] rounded-2xl hover:bg-white/5 hover:border-white/10 text-right space-y-2 transition-all border ${
                    activeReportType === 'delivered_devices' ? 'border-orange-500' : 'border-white/5'
                  }`}
                >
                  <div className="p-2 bg-emerald-600/10 text-emerald-500 rounded-xl w-max">
                    <CheckCircle size={20} />
                  </div>
                  <h3 className="font-black text-sm font-cairo text-white">الأجهزة المسلّمة والمنجزة</h3>
                  <p className="text-[10px] text-gray-500 font-bold font-cairo leading-relaxed">قائمة تفصيلية بالأجهزة المستلمة من العميل والتي غادرت قسم الصيانة بنجاح</p>
                </button>

                {/* Financial Summary */}
                <button
                  onClick={() => setActiveReportType('debts_report')}
                  className={`p-4 bg-[#111111] rounded-2xl hover:bg-white/5 hover:border-white/10 text-right space-y-2 transition-all border ${
                    activeReportType === 'debts_report' ? 'border-orange-500' : 'border-white/5'
                  }`}
                >
                  <div className="p-2 bg-purple-600/10 text-purple-500 rounded-xl w-max">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="font-black text-sm font-cairo text-white">كشف الديون والمستحقات والعملاء</h3>
                  <p className="text-[10px] text-gray-500 font-bold font-cairo leading-relaxed">قائمة العملاء المترتب عليهم أرصدة مالية معلقة ومستحقة الدفع</p>
                </button>

                {/* Daily Completed Maintenance Report */}
                <button
                  onClick={() => handlePrintDailyCompletedReport()}
                  className="p-4 bg-[#111111] rounded-2xl hover:bg-orange-600/10 hover:border-orange-500/30 text-right space-y-2 transition-all border border-white/5 group"
                >
                  <div className="p-2 bg-orange-600/10 text-orange-500 rounded-xl w-max group-hover:scale-110 transition-transform">
                    <CheckCircle size={20} />
                  </div>
                  <h3 className="font-black text-sm font-cairo text-white">بيان الصيانة المنجزة اليومي</h3>
                  <p className="text-[10px] text-gray-500 font-bold font-cairo leading-relaxed">كشف بكل صيانة تم تسليمها وماليتها لليوم (تصدير فوري)</p>
                </button>

                {/* Pending/Delayed Devices Report */}
                <button
                  onClick={() => handlePrintDelayedDevicesReport()}
                  className="p-4 bg-[#111111] rounded-2xl hover:bg-rose-600/10 hover:border-rose-500/30 text-right space-y-2 transition-all border border-white/5 group"
                >
                  <div className="p-2 bg-rose-600/10 text-rose-500 rounded-xl w-max group-hover:scale-110 transition-transform">
                    <Clock size={20} />
                  </div>
                  <h3 className="font-black text-sm font-cairo text-white">تقرير المعلقات والمتعطلات</h3>
                  <p className="text-[10px] text-gray-500 font-bold font-cairo leading-relaxed">بيان بالأجهزة التي تجاوزت 5 أيام بالورشة ولم تسلم</p>
                </button>

                {/* Technician Productivity Report */}
                <button
                  onClick={() => handlePrintTechnicianProductivityReport()}
                  className="p-4 bg-[#111111] rounded-2xl hover:bg-blue-600/10 hover:border-blue-500/30 text-right space-y-2 transition-all border border-white/5 group"
                >
                  <div className="p-2 bg-blue-600/10 text-blue-500 rounded-xl w-max group-hover:scale-110 transition-transform">
                    <Users size={20} />
                  </div>
                  <h3 className="font-black text-sm font-cairo text-white">إنتاجية ومستحقات الفنيين</h3>
                  <p className="text-[10px] text-gray-500 font-bold font-cairo leading-relaxed">قياس دقة الأداء وحساب نسب ومستحقات الفحص والعمل</p>
                </button>

              </div>

              {/* REPORT DRAWERS/TABLES COMPILATIONS AS MODALS */}
              {activeReportType && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-fade-in">
                    
                    {/* Header */}
                    <div className="p-4 bg-white/[0.02] border-b border-white/10 flex items-center justify-between sticky top-0 z-10">
                      <h3 className="text-sm md:text-base font-black text-white font-cairo">
                        {activeReportType === 'progress_devices' && 'تقرير الأجهزة النشطة (قيد الصيانة والانتظار)'}
                        {activeReportType === 'delivered_devices' && 'سجل الأجهزة المسلّمة والمنجزة (الأرشيف التقني)'}
                        {activeReportType === 'debts_report' && 'تقرير الذمم والديون المستحقة (العملاء)'}
                      </h3>
                      <div className="flex items-center gap-2">
                        {activeReportType === 'debts_report' && (
                          <button 
                            onClick={() => handlePrintDebtsByCurrencyReport()}
                            className="p-2 bg-orange-600/15 hover:bg-orange-600 text-orange-400 hover:text-white border border-orange-500/25 rounded-xl transition-all flex items-center gap-2 text-xs font-bold font-cairo"
                            title="تصدير كشف حسابات العملاء والديون مفصل ومفصول لكل عملة بورقة مستقلة"
                          >
                            <Layers size={18} />
                            <span className="hidden sm:inline">كشف مفصل بالعملات</span>
                          </button>
                        )}
                        <button 
                          onClick={() => handlePrintReport()}
                          className="p-2 bg-white/5 hover:bg-emerald-500/20 text-gray-400 hover:text-emerald-400 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold font-cairo"
                          title="تصدير تقرير PDF"
                        >
                          <FileDown size={20} />
                          <span className="hidden sm:inline">تقرير PDF موحد</span>
                        </button>
                        <button 
                          onClick={() => setActiveReportType(null)}
                          className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto flex-1 p-0">
                      {activeReportType === 'progress_devices' && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse text-xs select-none min-w-[600px]">
                            <thead className="bg-[#1a1a1a] sticky top-0">
                              <tr className="border-b border-white/10 text-gray-400">
                                <th className="px-4 py-3 font-bold whitespace-nowrap">اسم الجهاز</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">الخلل والشكوى</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">العميل</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">المرجع</th>
                                <th className="px-4 py-3 font-bold text-center whitespace-nowrap">التكلفة</th>
                                <th className="px-4 py-3 font-bold text-center whitespace-nowrap">الحالة الحالية</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                              {invoiceItems.filter(item => isInShopMaintenanceDevice(item)).length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="px-4 py-20 text-center text-gray-500 font-bold font-cairo text-sm">
                                    لا يوجد أجهزة قيد الصيانة حالياً.
                                  </td>
                                </tr>
                              ) : (
                                invoiceItems.filter(item => isInShopMaintenanceDevice(item)).map((item) => (
                                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3.5 font-bold text-white font-cairo whitespace-nowrap">{item.deviceName || 'جهاز تقني'}</td>
                                    <td className="px-4 py-3.5 text-gray-400 font-cairo whitespace-nowrap">{item.faultType || 'غير محدد'}</td>
                                    <td className="px-4 py-3.5 font-bold font-cairo whitespace-nowrap">{item.recipientName || '---'}</td>
                                    <td className="px-4 py-3.5 font-mono font-bold text-amber-500 whitespace-nowrap">{item.invoiceNumber || '---'}</td>
                                    <td className="px-4 py-3.5 font-mono text-center font-bold whitespace-nowrap">{item.cost?.toFixed(2) || '0.00'}</td>
                                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                      <span className={`inline-block px-3 py-1 rounded-full border text-[10px] font-bold ${getStatusStyle(item.status)}`}>
                                        {getStatusText(item.status)}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {activeReportType === 'delivered_devices' && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse text-xs select-none min-w-[600px]">
                            <thead className="bg-[#1a1a1a] sticky top-0">
                              <tr className="border-b border-white/10 text-gray-400">
                                <th className="px-4 py-3 font-bold whitespace-nowrap">اسم الجهاز</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">الخلل المنجز</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">العميل المستلم</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">رقم الفاتورة</th>
                                <th className="px-4 py-3 font-bold text-center whitespace-nowrap">قيمة الصيانة</th>
                                <th className="px-4 py-3 font-bold text-center whitespace-nowrap">الحالة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                              {invoiceItems.filter(item => item.status === '60' || item.status === 'delivered').length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="px-4 py-20 text-center text-gray-500 font-bold font-cairo text-sm">
                                    لا يوجد أجهزة مؤرشفة كمسلمة حالياً في النظام.
                                  </td>
                                </tr>
                              ) : (
                                invoiceItems.filter(item => item.status === '60' || item.status === 'delivered').map((item) => (
                                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 py-3.5 font-bold text-white font-cairo whitespace-nowrap">{item.deviceName || 'جهاز تقني'}</td>
                                    <td className="px-4 py-3.5 text-gray-400 font-cairo whitespace-nowrap">{item.faultType || 'غير محدد'}</td>
                                    <td className="px-4 py-3.5 font-bold font-cairo whitespace-nowrap">{item.recipientName || '---'}</td>
                                    <td className="px-4 py-3.5 font-mono font-bold text-amber-500 whitespace-nowrap">{item.invoiceNumber || '---'}</td>
                                    <td className="px-4 py-3.5 font-mono text-center font-bold whitespace-nowrap">{item.cost?.toFixed(2) || '0.00'}</td>
                                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                      <span className="inline-block px-3 py-1 rounded-full border border-purple-500/10 bg-purple-500/10 text-purple-400 text-[10px] font-bold">
                                        تم تسليمه للمستلم
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {activeReportType === 'debts_report' && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse text-xs select-none min-w-[600px]">
                            <thead className="bg-[#1a1a1a] sticky top-0">
                              <tr className="border-b border-white/10 text-gray-400">
                                <th className="px-4 py-3 font-bold whitespace-nowrap">اسم العميل</th>
                                <th className="px-4 py-3 font-bold whitespace-nowrap">رقم الهاتف</th>
                                <th className="px-4 py-3 font-bold text-center whitespace-nowrap">إجمالي الصيانة</th>
                                <th className="px-4 py-3 font-bold text-center whitespace-nowrap">إجمالي المقبوض</th>
                                <th className="px-4 py-3 text-rose-400 font-bold text-center whitespace-nowrap">الديون المتبقية</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                              {customers.filter(c => getCustomerOutstandingAmount(c.id!) > 0.01).length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-4 py-20 text-center text-gray-500 font-bold font-cairo text-sm">
                                    الحمد لله، لا تترتب أية مديونيات أو مستحقات مالية متراكمة على أي من عمالئكم حالياً.
                                  </td>
                                </tr>
                              ) : (
                                customers.filter(c => getCustomerOutstandingAmount(c.id!) > 0.01).map((cust) => {
                                  const outstanding = getCustomerOutstandingAmount(cust.id!);
                                  const totalCost = getCustomerTotalCost(cust.id!);
                                  const totalPaid = getCustomerTotalPaid(cust.id!);
                                  const currency = getCustomerCurrencyLabel(cust.id!);
                                  return (
                                    <tr key={cust.id} className="hover:bg-white/[0.02] transition-colors">
                                      <td className="px-4 py-3.5 font-bold text-white font-cairo whitespace-nowrap flex items-center gap-2">
                                        <span>{cust.name}</span>
                                        <button
                                          onClick={() => handleViewComprehensiveReport(cust)}
                                          className="p-1.5 bg-orange-600/10 text-orange-500 hover:bg-orange-600 hover:text-white rounded-lg transition-all"
                                          title="كشف شامل"
                                        >
                                          <FileText size={12} />
                                        </button>
                                      </td>
                                      <td className="px-4 py-3.5 font-mono text-gray-400 whitespace-nowrap">{cust.phone1}</td>
                                      <td className="px-4 py-3.5 font-mono text-center whitespace-nowrap">{totalCost.toFixed(2)} {currency}</td>
                                      <td className="px-4 py-3.5 font-mono text-center text-emerald-400 whitespace-nowrap">{totalPaid.toFixed(2)} {currency}</td>
                                      <td className="px-4 py-3.5 font-mono font-extrabold text-rose-500 text-center whitespace-nowrap">{outstanding.toFixed(2)} {currency}</td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!activeReportType && (
                <div className="text-center py-20 text-gray-650 bg-[#111111] rounded-2xl border border-dashed border-white/5 space-y-3">
                  <TrendingUp size={48} className="mx-auto text-gray-800" />
                  <p className="font-cairo text-sm font-bold">تفضل بتحديد وتفعيل إحدى بطاقات التقارير من الأعلى لتركيب وتوليد البيانات وإحصائيات العمل فورا</p>
                </div>
              )}

              </div>
            </div>
          )}

        </div>
      )}

      {previewData && (
        <PrintPreviewOverlay 
          type={previewData.type}
          data={previewData.data}
          onClose={() => setPreviewData(null)}
          shopConfig={shopConfig}
          user={user}
        />
      )}

    </div>
  );
}
