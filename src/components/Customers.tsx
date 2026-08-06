import { CustomerAutocomplete } from './CustomerAutocomplete';
import AddCustomerModal from './AddCustomerModal';
import { sharePdfFile, openWhatsApp, sendUniversalReminder } from '../lib/shareHelper';
import PrintPreviewOverlay from './PrintPreviewOverlay';
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, orderBy, doc, getDoc, setDoc, updateDoc, writeBatch, serverTimestamp } from '../firebase';
import { db } from '../firebase';
import { User, Phone, Smartphone, AlertTriangle, CheckCircle, Package, ArrowLeft, ArrowUpRight, ArrowRight, LogOut, Search, FileText, ChevronLeft, Eye, Clock, DollarSign, X, Users, ArrowUpDown, Plus, Edit2, Check, Building, Mail, Printer, UserPlus, MessageCircle, MapPin, Facebook, Trash2 } from 'lucide-react';
import { Customer, Invoice, InvoiceItem, User as SystemUser, ShopConfig } from '../types';
import { useBackHandler } from '../hooks/useBackHandler';
import { usePermissions } from '../hooks/usePermissions';
import BankAccountsFooter from './BankAccountsFooter';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { sanitizeDocumentStyles, sanitizeElementInlineStyles, cleanOklchInStyleText } from '../lib/html2canvasHelper';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { parseDate, formatDateTime, parseTxDate, formatTxDate } from '../lib/dateUtils';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.012 2c-5.506 0-9.978 4.471-9.978 9.978 0 1.764.459 3.42 1.258 4.873L2 22l5.312-1.393c1.405.766 3 1.18 4.7 1.18 5.506 0 9.978-4.472 9.978-9.978C21.99 6.471 17.518 2 12.012 2zm6.331 14.161c-.244.686-1.22 1.258-1.687 1.341-.468.084-.935.152-2.903-.631-2.479-.982-4.053-3.522-4.175-3.69-.122-.167-.991-1.319-.991-2.518 0-1.199.631-1.787.854-2.028.223-.241.488-.302.65-.302.162 0 .325.003.467.01.147.007.345-.057.545.421.203.488.691 1.687.752 1.809.061.122.102.264.02.427-.081.162-.122.264-.244.407-.122.142-.256.319-.366.427-.122.122-.249.255-.107.498.142.244.631 1.036 1.354 1.678.932.827 1.714 1.082 1.957 1.204.244.122.386.102.528-.061.142-.162.61-2.008.772-2.313.162-.305.325-.244.548-.162.223.081 1.423.671 1.667.793.244.122.406.183.467.284.061.104.061.59-.183 1.277z" />
  </svg>
);

export default function Customers({ user, shopConfig, onBack }: { user: SystemUser; shopConfig: ShopConfig | null; onBack?: () => void }) {
  const { t } = useTranslation();
  const { hasPermission, canAdd, canEdit, canDelete, canPrint } = usePermissions(user, 'customers');

  if (!hasPermission('view')) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
          <Users size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">عذراً، ليس لديك صلاحية الوصول</h2>
        <p className="text-gray-400 max-w-md">يرجى التواصل مع المسؤول للحصول على الصلاحيات اللازمة لعرض بيانات العملاء.</p>
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentOutput, setCurrentOutput] = useState<any>(null);
  const [previewData, setPreviewData] = useState<{ type: 'invoice' | 'voucher' | 'statement'; data: any } | null>(null);

  // Search/Autocomplete State
  const [search, setSearch] = useState('');

  // Selected state
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeCustomerTab, setActiveCustomerTab] = useState<'details' | 'statement' | 'log' | 'menu'>('menu');
  const [showPreview, setShowPreview] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLogInvoice, setSelectedLogInvoice] = useState<any | null>(null);

  // "Add Customer" modal states
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [isAddingInProcess, setIsAddingInProcess] = useState(false);

  // "Edit Customer Info" states
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editPhone1, setEditPhone1] = useState('');
  const [editPhone2, setEditPhone2] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editHasWhatsapp, setEditHasWhatsapp] = useState(true);
  const [editLiabilityCurrency, setEditLiabilityCurrency] = useState('USD');
  const [updatePastTransactions, setUpdatePastTransactions] = useState(true);
  const [deletePastTransactions, setDeletePastTransactions] = useState(true);
  const [isSavingInProcess, setIsSavingInProcess] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  useBackHandler(customerToDelete !== null, () => setCustomerToDelete(null));
  useBackHandler(showAddCustomer, () => setShowAddCustomer(false));
  useBackHandler(showLogModal, () => {
    if (selectedLogInvoice) {
      setSelectedLogInvoice(null);
    } else {
      setShowLogModal(false);
    }
  });
  useBackHandler(showDetailsModal, () => setShowDetailsModal(false));
  useBackHandler(isEditingMode, () => setIsEditingMode(false));
  useBackHandler(selectedCustomer !== null && !showAddCustomer && !showLogModal && !showDetailsModal && !isEditingMode, () => {
    if (activeCustomerTab !== 'menu') {
      setActiveCustomerTab('menu');
    } else {
      setSelectedCustomer(null);
    }
  });

  const nextCustomerNumber = Math.max(0, ...customers.map(c => Number(c.customerNumber) || 0)) + 1;

  const getArabicCurrencyName = (currCode: string) => {
    if (!currCode) return 'دولار';
    if (currCode.toUpperCase() === 'USD') return 'دولار';
    if (currCode.toUpperCase() === 'YER') return 'ريال يمني';
    if (currCode.toUpperCase().includes('USD') && currCode.toUpperCase().includes('YER')) return 'دولار / ريال يمني';
    return currCode;
  };

  const handleAddCustomer = async () => {
    // This is now handled inside AddCustomerModal
  };

  const onCustomerAdded = (customer: Customer) => {
    // Auto select newly created customer
    selectCustomer(customer);
    setShowAddCustomer(false);
  };

  // Load Customers, Invoices, and Invoice Items in real-time
  useEffect(() => {
    const unsubscribeCustomers = onSnapshot(query(collection(db, 'customers'), orderBy('name', 'asc')), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    });

    const unsubscribeInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)));
    });

    const unsubscribeItems = onSnapshot(collection(db, 'invoice_items'), (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvoiceItem)));
    });

    const unsubscribeTransactions = onSnapshot(collection(db, 'vault_transactions'), (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeInvoices();
      unsubscribeItems();
      unsubscribeTransactions();
    };
  }, []);

  // Handlers for selection
  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setActiveCustomerTab('menu');
    setSearch(customer.name);
    setShowPreview(false); // Reset preview on brand-new selection
    setIsEditingMode(false); // Reset edit mode
    setEditPhone1(customer.phone1 || '');
    setEditPhone2(customer.phone2 || '');
    setEditEmail(customer.email || '');
    setEditNotes(customer.notes || '');
    setEditHasWhatsapp(customer.hasWhatsapp !== undefined ? customer.hasWhatsapp : true);
      setEditLiabilityCurrency(customer.liabilityCurrency || 'USD');
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer || !selectedCustomer.id) return;
    const isEditFormValid = editName.trim() !== '' && editPhone1.trim() !== '';
    if (!isEditFormValid) return;
    
    const normalizedNewName = editName.replace(/\s+/g, '').toLowerCase();
    const isDuplicate = customers.some(c => 
      c.id !== selectedCustomer.id && 
      (c.name || '').replace(/\s+/g, '').toLowerCase() === normalizedNewName
    );
    
    if (isDuplicate) {
      alert('العميل موجود مسبقاً في النظام. يرجى التأكد من اسم العميل.');
      return;
    }

    setIsSavingInProcess(true);
    try {
      const customerRef = doc(db, 'customers', selectedCustomer.id);
      
      
      const updatedFields = {
        name: editName.trim(),
        companyName: editCompanyName.trim(),
        phone1: editPhone1.trim(),
        phone2: editPhone2.trim(),
        email: editEmail.trim(),
        notes: editNotes.trim(),
        hasWhatsapp: editHasWhatsapp,
        updatedAt: serverTimestamp()
      };
      
      try {
        const { ProviderFactory } = await import('../data/ProviderFactory');
        const provider = ProviderFactory.getProvider();
        await provider.updateDoc('customers', selectedCustomer.id, {
          ...updatedFields,
          updatedAt: new Date().toISOString()
        });

        if (updatePastTransactions && (editName.trim() !== selectedCustomer.name || editPhone1.trim() !== selectedCustomer.phone1)) {
          // Update invoices
          const invoicesSnap = await provider.getDocs('invoices');
          const invoices = invoicesSnap.docs ? invoicesSnap.docs.map((d) => d.data()) : [];
          for (const inv of invoices) {
            if (inv.customerId === selectedCustomer.id) {
              const invUpdates: any = {};
              if (editName.trim() !== selectedCustomer.name) invUpdates.customerName = editName.trim();
              if (editPhone1.trim() !== selectedCustomer.phone1) invUpdates.customerPhone = editPhone1.trim();
              
              await provider.updateDoc('invoices', inv.id, invUpdates);
              
            }
          }
          
          // Update transactions
          const txsSnap = await provider.getDocs('vault_transactions');
          const txs = txsSnap.docs ? txsSnap.docs.map((d) => d.data()) : [];
          for (const tx of txs) {
            if (tx.customerId === selectedCustomer.id && editName.trim() !== selectedCustomer.name) {
              await provider.updateDoc('vault_transactions', tx.id, { customerName: editName.trim() });
              
            }
          }
        }
      } catch (err) {
        console.warn('Could not update local db directly', err);
      }
            
      await updateDoc(customerRef, updatedFields);


      
      // Update local states
      const updatedCust = {
        ...selectedCustomer,
        ...updatedFields
      };
      setSelectedCustomer(updatedCust);
      
      // Also update in-memory customers list
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updatedCust : c));
      
      setIsEditingMode(false);
    } catch (err) {
      console.error("Error updating customer:", err);
    } finally {
      setIsSavingInProcess(false);
    }
  };

  const performDeleteCustomer = async (targetCustomer?: Customer | null) => {
    const cust = targetCustomer || selectedCustomer;
    if (!cust || !cust.id) return;
    
    setIsSavingInProcess(true);
    try {
      const { ProviderFactory } = await import('../data/ProviderFactory');
      const provider = ProviderFactory.getProvider();
      
      const customerInvs = invoices.filter(inv => inv.customerId === cust.id || (cust.name && inv.customerName === cust.name));
      const customerInvIds = customerInvs.map(inv => inv.id).filter(Boolean);
      const customerInvNumbers = customerInvs.map(inv => String(inv.invoiceNumber)).filter(Boolean);

      const customerItems = items.filter(it => 
        it.customerId === cust.id || 
        (it.invoiceId && customerInvIds.includes(it.invoiceId)) ||
        (it.invoiceNumber && customerInvNumbers.includes(String(it.invoiceNumber))) ||
        (cust.name && it.customerName === cust.name)
      );

      const customerTxs = transactions.filter(tx => 
        tx.customerId === cust.id || 
        (cust.name && tx.customerName === cust.name) ||
        (tx.invoiceId && customerInvIds.includes(tx.invoiceId)) ||
        (tx.invoiceNumber && customerInvNumbers.includes(String(tx.invoiceNumber)))
      );

      // 1. Delete from local database provider
      await provider.deleteDoc('customers', cust.id);
      
      if (deletePastTransactions) {
        for (const inv of customerInvs) {
          if (inv.id) await provider.deleteDoc('invoices', inv.id);
        }
        
        for (const it of customerItems) {
          if (it.id) await provider.deleteDoc('invoice_items', it.id);
        }
        
        for (const tx of customerTxs) {
          if (tx.id) await provider.deleteDoc('vault_transactions', tx.id);
        }
        
        try {
          const allMaint = await provider.getDocs('maintenance_actions');
          const allAppr = await provider.getDocs('approval_actions');
          const custItemIds = customerItems.map(it => it.id).filter(Boolean);
          
          const custMaint = allMaint.docs.filter((d: any) => custItemIds.includes(d.data().itemId));
          const custAppr = allAppr.docs.filter((d: any) => custItemIds.includes(d.data().itemId));
          
          for (const m of custMaint) {
            if (m.id) await provider.deleteDoc('maintenance_actions', m.id);
          }
          for (const a of custAppr) {
            if (a.id) await provider.deleteDoc('approval_actions', a.id);
          }
        } catch (err) {
          console.warn('Error deleting related actions locally:', err);
        }
      }

      // 2. Delete from Firebase Firestore database
      try {
        const { deleteDoc, doc, collection, getDocs } = await import('../firebase');
        const { db } = await import('../firebase');
        await deleteDoc(doc(db, 'customers', cust.id));
        
        if (deletePastTransactions) {
          for (const inv of customerInvs) {
            if (inv.id) await deleteDoc(doc(db, 'invoices', inv.id));
          }
          for (const it of customerItems) {
            if (it.id) await deleteDoc(doc(db, 'invoice_items', it.id));
          }
          for (const tx of customerTxs) {
            if (tx.id) await deleteDoc(doc(db, 'vault_transactions', tx.id));
          }
          
          try {
            const custItemIds = customerItems.map(it => it.id).filter(Boolean);
            if (custItemIds.length > 0) {
              const allMaintSnap = await getDocs(collection(db, 'maintenance_actions'));
              const allApprSnap = await getDocs(collection(db, 'approval_actions'));
              
              for (const d of allMaintSnap.docs) {
                if (custItemIds.includes(d.data().itemId)) {
                  await deleteDoc(doc(db, 'maintenance_actions', d.id));
                }
              }
              for (const d of allApprSnap.docs) {
                if (custItemIds.includes(d.data().itemId)) {
                  await deleteDoc(doc(db, 'approval_actions', d.id));
                }
              }
            }
          } catch (fbActionErr) {
             console.warn('Firestore related actions deletion warning:', fbActionErr);
          }
        }
      } catch (fbErr) {
        console.warn('Firestore deletion warning:', fbErr);
      }
      
      setCustomerToDelete(null);
      setSelectedCustomer(null);
      setShowDetailsModal(false);
      setActiveCustomerTab('menu');
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('حدث خطأ أثناء حذف العميل');
    } finally {
      setIsSavingInProcess(false);
    }
  };

  const handleDeleteCustomer = () => {
    if (selectedCustomer) {
      setCustomerToDelete(selectedCustomer);
    }
  };

  const getInvoiceActualCost = (invoiceItems: InvoiceItem[], invoice?: any) => {
    return invoiceItems.reduce((sum, item) => {
      // Exclude items in pending statuses (new, testing, awaiting approval, awaiting parts, repairing)
      // Because maintenance has not completed yet, so the amount is not yet due/confirmed on the customer.
      if (['10', '20', '25', '30', '35', '40', 'new', 'in_progress', 'awaiting_parts', 'awaiting_approval', 'repairing'].includes(item.status)) {
        return sum;
      }
      
      // Exclude cancelled/withdrawn devices, unrepairable/failed devices, refused devices, or devices backdue to unavailable parts
      const sub = (item.subStatus || '').toLowerCase();
      const status = (item.status || '').toLowerCase();
      const src = (item.source || '').toLowerCase();

      // Check if cancelled, refused, unrepairable (failed), or parts unavailable
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
    const customerName = customers.find(c => c.id === customerId)?.name || '';
    const customerInvs = invoices.filter(inv => inv.customerId === customerId || (customerName && inv.customerName === customerName));
    const currencies = Array.from(new Set(customerInvs.map(inv => inv.currency || 'USD')));
    if (currencies.length === 0) return 'USD';
    return currencies.join(' / ');
  };

  // Calculations for selected customer
  const getCustomerRemainingDevices = (customerId: string) => {
    // outstanding devices: items state not delivered and not '60'
    return items.filter(it => 
      (it.customerId === customerId || invoices.some(inv => inv.customerId === customerId && inv.invoiceNumber === it.invoiceNumber)) && 
      it.status !== 'delivered' && it.status !== '60'
    ).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };

  const getCustomerTotalCost = (customerId: string) => {
    const customerName = customers.find(c => c.id === customerId)?.name || '';
    const customerInvs = invoices.filter(inv => inv.customerId === customerId || (customerName && inv.customerName === customerName));
    return customerInvs.reduce((sum, inv) => {
      const invItems = items.filter(it => it.invoiceNumber === inv.invoiceNumber);
      return sum + getInvoiceActualCost(invItems, inv);
    }, 0);
  };

  const getCustomerTotalPaid = (customerId: string) => {
    // Receipts
    const separateReceipts = transactions
      .filter(tx => tx.customerId === customerId && (tx.type === 'receipt' || tx.type === 'invoice_payment') && !tx.isReversed && !tx.isReversal && tx.status !== 'reversed' && tx.status !== 'reversal')
      .reduce((sum, tx) => sum + (tx.liabilityAmount || Math.abs(Number(tx.amount || 0))), 0);

    // Payments
    const separatePayments = transactions
      .filter(tx => tx.customerId === customerId && tx.type === 'payment' && !tx.isReversed && !tx.isReversal && tx.status !== 'reversed' && tx.status !== 'reversal')
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);

    return separateReceipts - separatePayments;
  };

  const getCustomerOutstandingAmount = (customerId: string) => {
    return Math.max(0, getCustomerTotalCost(customerId) - getCustomerTotalPaid(customerId));
  };

  // Generate statement entries chronologically for Selected Customer
  const getStatementEntries = (customerId: string) => {
    const entries: {
      id: string;
      date: Date;
      type: string;
      label: string;
      reference: string;
      notes: string;
      debit: number;
      credit: number;
      runningBalance?: number;
    }[] = [];

    // 1. Get customer invoices
    const customerName = customers.find(c => c.id === customerId)?.name || '';
    const customerInvs = invoices.filter(inv => inv.customerId === customerId || (customerName && inv.customerName === customerName));
    customerInvs.forEach(inv => {
      const invItems = items.filter(it => it.invoiceNumber === inv.invoiceNumber);
      const actualCost = getInvoiceActualCost(invItems, inv);
      // Row 1: Invoice debit
      const invDate = parseDate(inv.createdAt);
      
      const explicitType = inv.invoiceType || inv.templateType || inv.type || '';
      let invTypeTitle = 'فاتورة صيانة';
      let invLabel = 'فاتورة صيانة أجهزة فنية';

      if (explicitType === 'sale_software') {
        invTypeTitle = 'فاتورة خدمات برمجية';
        invLabel = 'فاتورة مبيعات - خدمات برمجية';
      } else if (explicitType === 'sale_parts') {
        invTypeTitle = 'فاتورة بيع قطع غيار';
        invLabel = 'فاتورة مبيعات - بيع قطع غيار';
      } else if (explicitType === 'sale_maintenance') {
        invTypeTitle = 'فاتورة صيانة خارجية';
        invLabel = 'فاتورة مبيعات - صيانة خارجية';
      } else if (typeof explicitType === 'string' && explicitType.startsWith('sale_')) {
        const sub = explicitType.replace('sale_', '');
        invTypeTitle = `فاتورة مبيعات (${sub})`;
        invLabel = `فاتورة مبيعات - ${sub}`;
      } else if (inv.invoiceNumber && String(inv.invoiceNumber).startsWith('O-')) {
        invTypeTitle = 'فاتورة مبيعات قطع/خدمات';
        invLabel = 'فاتورة مبيعات أجهزة وقطع غيار';
      } else {
        invTypeTitle = 'فاتورة صيانة';
        invLabel = 'فاتورة صيانة أجهزة فنية';
      }

      const itemNotes = invItems.map(i => {
        const nameStr = i.deviceName || i.deviceType || '';
        const brandStr = i.brand ? `- ${i.brand}` : '';
        return `${nameStr} ${brandStr}`.trim();
      }).filter(Boolean).join(' | ');

      entries.push({
        id: `inv-cost-${inv.id}`,
        date: invDate,
        type: invTypeTitle,
        label: invLabel,
        reference: String(inv.invoiceNumber).replace(/#/g, ''),
        notes: inv.notes || itemNotes || 'فاتورة خدمات/مبيعات',
        debit: actualCost,
        credit: 0
      });
    });

    // 2. Get separate receipts and payments (filtering out reversed/reversals for customers)
    const customerTransactions = transactions.filter(tx => 
      tx.customerId === customerId &&
      !tx.isReversed &&
      !tx.isReversal &&
      tx.status !== 'reversed' &&
      tx.status !== 'reversal'
    );

    customerTransactions.forEach(tx => {
      const txDate = parseTxDate(tx);

      if (tx.type === 'receipt' || tx.type === 'invoice_payment') {
        const isLinkedToInvoice = !!tx.invoiceNumber;
        const liabilityAmount = tx.liabilityAmount || Math.abs(Number(tx.amount || 0));
        
        let docType = 'سند قبض';
        let statement = tx.transactionCategory || 'سند قبض / دفعه تحت الحساب';
        let details = tx.statementNote || tx.notes || '';
        let refStr = String(tx.voucherNumber || tx.id?.substring(0, 5)).replace(/#/g, '');

        if (isLinkedToInvoice) {
           docType = 'سند قبض';
           statement = `سند قبض / سداد في فاتورة رقم ${tx.invoiceNumber}`;
           refStr = String(tx.voucherNumber || tx.invoiceNumber).replace(/#/g, '');
        } else if (tx.transactionCategory === 'دفعة أجهزة') {
           docType = 'سند قبض';
           statement = `سند قبض / سداد في فاتورة رقم ${tx.invoiceNumber || '؟'}`;
           if (tx.voucherNumber || tx.invoiceNumber) {
             refStr = String(tx.voucherNumber || tx.invoiceNumber).replace(/#/g, '');
           }
        }

        entries.push({
          id: `tx-${tx.id}`,
          date: txDate,
          type: docType,
          label: statement,
          reference: refStr,
          notes: details,
          debit: 0,
          credit: liabilityAmount
        });
      } else if (tx.type === 'payment') {
        entries.push({
          id: `tx-${tx.id}`,
          date: txDate,
          type: 'سند صرف',
          label: tx.transactionCategory || 'سند صرف للعميل',
          reference: String(tx.voucherNumber || tx.id?.substring(0, 5)).replace(/#/g, ''),
          notes: tx.notes || '',
          debit: Math.abs(Number(tx.amount || 0)),
          credit: 0
        });
      }
    });

    // 3. Sort chronologically
    entries.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));

    // 4. Filter entries that have active financial impact (debit > 0 or credit > 0)
    const activeEntries = entries.filter(e => e.debit > 0.001 || e.credit > 0.001);

    // 5. Compute running balance
    let balance = 0;
    return activeEntries.map(entry => {
      balance += entry.debit - entry.credit;
      return {
        ...entry,
        runningBalance: balance
      };
    });
  };

  const handleWhatsAppShare = async (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust) return;

    setIsGeneratingPDF(true);

    const originalGetComputedStyle = window.getComputedStyle;
    let tempEl: HTMLDivElement | null = null;

    try {
      const element = document.getElementById('print-area');
      if (!element) {
        setIsGeneratingPDF(false);
        return;
      }

      const canvas = await htmlToImage.toCanvas(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

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

      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const printDate = `${year}-${month}-${day}`;
      const filename = `كشف حساب_${cust.name}_${printDate}.pdf`;

      // 2. Prepare the PDF Base64 & save in database folder and sqlite saved_pdfs
      let pdfBase64 = '';
      try {
        pdfBase64 = pdf.output('datauristring').split(',')[1];
      } catch (err) {
        console.error('Failed to get PDF Base64 string:', err);
      }

      // Save to Capacitor filesystem folder
      try {
        await Filesystem.writeFile({
          path: `SND_App/تقارير/${filename}`,
          data: pdfBase64,
          directory: Directory.Documents,
          recursive: true
        });
        console.log('PDF file saved successfully to SND_App/تقارير directory.');
      } catch (fsError) {
        console.warn('Skipping Device Filesystem save:', fsError);
      }

      // Save to SQLite database table (saved_pdfs history log)
      try {
        // Create table dynamically in sqlite if not created
        const { localDb } = await import('../lib/local-db');
        await localDb.run(`
          CREATE TABLE IF NOT EXISTS saved_pdfs (
            id TEXT PRIMARY KEY,
            customerId TEXT,
            customerName TEXT,
            filename TEXT,
            createdAt TEXT,
            fileSize TEXT,
            fileData TEXT
          )
        `);
        const docId = `pdf_${Date.now()}`;
        const fileSize = `${Math.round(pdfBase64.length * 0.75 / 1024)} KB`;
        await localDb.run(
          `INSERT INTO saved_pdfs (id, customerId, customerName, filename, createdAt, fileSize, fileData) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [docId, customerId, cust.name, filename, new Date().toISOString(), fileSize, pdfBase64]
        );
        console.log('PDF saved to local database saved_pdfs table!');
      } catch (dbError) {
        console.warn('Failed to save to SQLite database table saved_pdfs:', dbError);
      }

      // Download standard desktop ledger
      pdf.save(filename);

      // 3. Launch WhatsApp link or Native Share
      const totalCost = getCustomerTotalCost(customerId);
      const totalPaid = getCustomerTotalPaid(customerId);
      const diff = totalCost - totalPaid;
      const currency = getCustomerCurrencyLabel(customerId);

      let statusText = '';
      if (diff < -0.01) {
        statusText = `رصيد دائن للعميل بفائض: ${Math.abs(diff).toLocaleString('en-US')} ${currency}`;
      } else if (diff > 0.01) {
        statusText = `متبقي عليه كديون متراكمة: ${Math.abs(diff).toLocaleString('en-US')} ${currency}`;
      } else {
        statusText = `الحساب متزن بالكامل (0.00)`;
      }

      let message = `*كشف مالي رسمي وموحد بصيغة PDF* 📄\n\n`;
      message += `عزيزي العميل *${cust.name}*،\n`;
      message += `تجدون أدناه ملخصاً مالياً بالعمليات والدفوعات المسجلة لصيانتكم. كما تم تنزيل وحفظ مستند الـ PDF للتقرير في مجلد قاعدة البيانات.\n\n`;
      message += `- *الرصيد الصافي:* ${statusText}\n`;
      message += `- *إجمالي مستحقات الصيانة:* ${totalCost.toLocaleString('en-US')} ${currency}\n`;
      message += `- *إجمالي السندات والمقبوضات:* ${totalPaid.toLocaleString('en-US')} ${currency}\n\n`;
      message += `يرجى مشاركة وإرسال كشف مستند الـ PDF المحفوظ الآن بنجاح على جهازكم.`;

      // Native Share API if supported (to attach actual PDF sheet on mobile)
      let sharedNatively = false;
      try {
        const pdfBlob = pdf.output('blob');
        sharedNatively = await sharePdfFile(pdfBlob, filename, message, 'report');
      } catch (shareErr) {
        console.warn('Native share was skipped:', shareErr);
      }

      if (!sharedNatively) {
        openWhatsApp(message, cust.phone1 || cust.phone2, shopConfig?.countryCode);
      }
    } catch (e) {
      console.error('Failed to export PDF & share:', e);
    } finally {
      window.getComputedStyle = originalGetComputedStyle;
      if (tempEl && tempEl.parentNode) {
        tempEl.parentNode.removeChild(tempEl);
      }
      setIsGeneratingPDF(false);
    }
  };

  // Selected customer invoices
  const customerInvoices = selectedCustomer 
    ? invoices.filter(inv => inv.customerId === selectedCustomer.id || (selectedCustomer.name && inv.customerName === selectedCustomer.name))
              .sort((a, b) => Number(b.invoiceNumber || 0) - Number(a.invoiceNumber || 0))
    : [];

  // Sorting/Filter controls
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterType, setFilterType] = useState<'alpha' | 'date' | 'debt' | 'devices' | 'currency' | 'code'>('code');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Pagination controls
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered and sorted list of all customers
  const getProcessedCustomers = () => {
    let list = customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone1.includes(search) || (c.phone2 && c.phone2.includes(search))
    );
    
    // Process Sort/Filter
    list.sort((a, b) => {
      if (filterType === 'alpha') {
        return sortDir === 'asc' 
          ? a.name.localeCompare(b.name, 'ar') 
          : b.name.localeCompare(a.name, 'ar');
      } else if (filterType === 'date') {
        const dateA = a.createdAt ? (typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()) : 0;
        const dateB = b.createdAt ? (typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()) : 0;
        return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (filterType === 'debt') {
        const debtA = getCustomerOutstandingAmount(a.id!);
        const debtB = getCustomerOutstandingAmount(b.id!);
        return sortDir === 'asc' ? debtA - debtB : debtB - debtA;
      } else if (filterType === 'devices') {
        const devA = getCustomerRemainingDevices(a.id!);
        const devB = getCustomerRemainingDevices(b.id!);
        return sortDir === 'asc' ? devA - devB : devB - devA;
      } else if (filterType === 'currency') {
        const currA = a.liabilityCurrency || 'USD';
        const currB = b.liabilityCurrency || 'USD';
        return sortDir === 'asc' 
          ? currA.localeCompare(currB, 'ar') 
          : currB.localeCompare(currA, 'ar');
      } else if (filterType === 'code') {
        const numA = Number(a.customerNumber) || 0;
        const numB = Number(b.customerNumber) || 0;
        return sortDir === 'asc' ? numA - numB : numB - numA;
      }
      return 0;
    });

    return list;
  };

  const setFilterAndSort = (type: 'alpha' | 'date' | 'debt' | 'devices' | 'currency' | 'code', dir: 'asc' | 'desc') => {
    setFilterType(type);
    setSortDir(dir);
    setShowFilterDropdown(false);
  };

  const handleHeaderClick = (type: 'alpha' | 'date' | 'debt' | 'devices' | 'currency' | 'code') => {
    if (filterType === type) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setFilterType(type);
      if (type === 'date' || type === 'code' || type === 'debt' || type === 'devices') {
        setSortDir('desc');
      } else {
        setSortDir('asc');
      }
    }
    setCurrentPage(1);
  };

  const renderSortArrow = (type: 'alpha' | 'date' | 'debt' | 'devices' | 'currency' | 'code') => {
    if (filterType !== type) return null;
    return sortDir === 'asc' ? ' ▲' : ' ▼';
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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'parts_not_available':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case '40':
      case 'repairing':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case '50':
      case 'ready':
      case 'intact':
      case 'unrepairable':
      case 'refused':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case '60':
      case 'delivered':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
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

  const allProcessedCustomers = getProcessedCustomers();
  const totalPages = Math.max(1, Math.ceil(allProcessedCustomers.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentCustomers = allProcessedCustomers.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  return (
    <div className="text-right pb-24 md:pb-6" dir="rtl">

      <AddCustomerModal 
        isOpen={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onSuccess={onCustomerAdded}
        customers={customers}
        user={user}
      />

      {/* Smart Search Panel */}
      {(!selectedCustomer || activeCustomerTab === 'menu') && (
        <div className="customers-box bg-[#1a1a1a] border-y border-white/5 mx-0 my-0 relative">
          <div className="flex items-center gap-3 px-4 py-3">
          
          {/* 1. Name Autocomplete Search */}
          <div className="flex-1 space-y-1 relative">
            <CustomerAutocomplete
              customers={customers}
              onSelect={(cust) => selectCustomer(cust)}
              onInputChange={(val) => setSearch(val)}
              onAddNew={() => setShowAddCustomer(true)}
              label="البحث باسم العميل أو رقم الهاتف:"
              placeholder="ابدأ بكتابة اسم العميل أو الهاتف..."
              initialValue={search}
              type="name"
            />
          </div>

          {/* Add Customer Button */}
          {canAdd && (
            <div className="relative pt-4">
              <button
                onClick={() => {
                  setShowAddCustomer(true);
                  setSelectedCustomer(null);
                }}
                className="p-3 bg-orange-600/10 hover:bg-orange-600 border border-orange-600/20 text-orange-500 hover:text-white rounded-xl transition-all shadow-lg hover:shadow-orange-600/20"
                title="إضافة عميل جديد"
              >
                <UserPlus size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Customer Action Modal */}
      {selectedCustomer && activeCustomerTab === 'menu' && !showLogModal && !showDetailsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="customer-modal-bg bg-[#141414] border border-white/10 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative text-right">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-black text-white">{selectedCustomer.name}</h2>
               <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setSearch('');
                  }}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400"
                >
                  <X size={18} />
                </button>
             </div>
             
             <div className="grid grid-cols-1 gap-3">
              <button onClick={() => setShowDetailsModal(true)} className="w-full text-right p-4 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 rounded-2xl font-bold flex items-center justify-between border border-orange-500/10">
                <span>بيانات العميل</span>
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => {
                  const entries = getStatementEntries(selectedCustomer.id!);
                  const formattedEntries = entries.map((entry) => {
                    const formattedDate = formatDateTime(entry.date);

                    return {
                      ...entry,
                      formattedDate,
                      debit: entry.debit,
                      credit: entry.credit,
                      runningBalance: entry.runningBalance
                    };
                  });

                  const curr = getCustomerCurrencyLabel(selectedCustomer.id!);
                  const getArabicCurrencyName = (currCode: string) => {
                    if (!currCode) return 'دولار';
                    if (currCode.toUpperCase() === 'USD') return 'دولار';
                    if (currCode.toUpperCase() === 'YER') return 'ريال يمني';
                    if (currCode.toUpperCase().includes('USD') && currCode.toUpperCase().includes('YER')) return 'دولار / ريال يمني';
                    return currCode;
                  };
                  const arCurrency = getArabicCurrencyName(curr);

                  let totalDebit = 0;
                  let totalCredit = 0;
                  entries.forEach(e => {
                    totalDebit += e.debit;
                    totalCredit += e.credit;
                  });
                  const diff = totalCredit - totalDebit;
                  const isCreditor = diff > 0.01;
                  const isDebtor = diff < -0.01;
                  const balanceStatus = isCreditor ? 'دائن (له في الحساب)' : isDebtor ? 'مدين (متبقي عليه ديون)' : 'متزن الحساب';

                  setPreviewData({
                    type: 'statement',
                    data: {
                      statement: {
                        customerName: selectedCustomer.name,
                        companyName: selectedCustomer.companyName || '',
                        customerPhone: selectedCustomer.phone1 || '',
                        customerNumber: selectedCustomer.customerNumber || selectedCustomer.id?.substring(0, 5) || '',
                        balance: diff,
                        balanceStatus: balanceStatus,
                        currency: arCurrency,
                        liabilityCurrency: selectedCustomer.liabilityCurrency || 'USD',
                        entries: formattedEntries
                      }
                    }
                  });
                }} 
                className="w-full text-right p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold flex items-center justify-between border border-white/5"
              >
                <span>كشف حساب</span>
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => setShowLogModal(true)} className="w-full text-right p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold flex items-center justify-between border border-white/5">
                <span>سجل العميل</span>
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Panel (Only displayed when a category is selected) */}
      {selectedCustomer && activeCustomerTab !== 'menu' && (
        <div className="customers-details-card bg-[#121212] border border-white/5 rounded-3xl p-6 relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between gap-4 mb-6">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <User size={16} className="text-orange-500"/>
              <span>{selectedCustomer.name}</span>
            </h2>
            <button
               onClick={() => setActiveCustomerTab('menu')}
               className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all flex items-center border border-white/5"
               title="العودة للقائمة"
             >
               <ArrowRight size={18} />
             </button>
          </div>

          {activeCustomerTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUMN 1: Read-Only System Metadata & Accounts state */}
            <div className="space-y-4">
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl relative space-y-3">
                <div className="text-[10px] font-black tracking-wider text-orange-500 uppercase font-cairo border-b border-white/5 pb-1">البيانات النظامية الثابتة (غير قابلة للتعديل)</div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer number */}
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] text-gray-500 font-bold block font-cairo">رقم العميل:</span>
                    <div className="customer-static-input w-full bg-[#161616] border border-white/5 rounded-xl px-3.5 py-2 text-xs font-mono font-black text-gray-400 cursor-not-allowed">
                      #{selectedCustomer.customerNumber || '---'}
                    </div>
                  </div>



                  {/* Registration date */}
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] text-gray-500 font-bold block font-cairo">تاريخ التسجيل بالمنظومة:</span>
                    <div className="customer-static-input w-full bg-[#161616] border border-white/5 rounded-xl px-3.5 py-2 text-[11px] font-bold text-gray-400 cursor-not-allowed font-cairo">
                      {selectedCustomer.createdAt
                        ? parseDate(selectedCustomer.createdAt).toLocaleDateString('ar-YE', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
                        : 'تاريخ قديم/مستورد'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculations blocks for devices & Net Account balance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Remaining devices in shop */}
                <div className="p-4 bg-black/20 border border-white/5 rounded-2xl text-right">
                  <span className="text-[10px] text-gray-500 font-bold block font-cairo uppercase">الأجهزة المتبقية بمحل الصيانة</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-white font-mono">{getCustomerRemainingDevices(selectedCustomer.id!)}</span>
                    <span className="text-gray-500 text-[10px] font-bold">أجهزة</span>
                  </div>
                </div>

                {/* 2. Outstanding Balance & Financial indicator (له أو عليه) */}
                <div className="p-4 bg-black/20 border border-white/5 rounded-2xl text-right">
                  <span className="text-[10px] text-gray-500 font-bold block font-cairo uppercase">حالة صافي مديونية العميل</span>
                  <div className="mt-1">
                    {(() => {
                      const totalPaid = getCustomerTotalPaid(selectedCustomer.id!);
                      const totalCost = getCustomerTotalCost(selectedCustomer.id!);
                      const diff = totalPaid - totalCost;
                      const curr = getCustomerCurrencyLabel(selectedCustomer.id!);
                      
                      if (diff > 0.01) {
                        return (
                          <div className="space-y-1">
                            <div className="text-lg font-black text-emerald-400 font-mono">+{diff.toFixed(2)} {curr}</div>
                            <span className="inline-block px-2 py-0.5 rounded-lg text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-cairo">دائن (له متبقي لدينا)</span>
                          </div>
                        );
                      } else if (diff < -0.01) {
                        return (
                          <div className="space-y-1">
                            <div className="text-lg font-black text-rose-500 font-mono">-{Math.abs(diff).toFixed(2)} {curr}</div>
                            <span className="inline-block px-2 py-0.5 rounded-lg text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold font-cairo">مدين (عليه مستحقات للدفع)</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="space-y-1">
                            <div className="text-lg font-black text-slate-400 font-mono">0.00 {curr}</div>
                            <span className="inline-block px-2 py-0.5 rounded-lg text-[9px] bg-white/[0.02] border border-white/5 text-slate-400 font-bold font-cairo">رصيد خالي من المديونيات</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>

              </div>
            </div>

            {/* COLUMN 2: Editable/Modifiable Secondary Contact Information */}
            <div className="space-y-4">
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="text-[10px] font-black tracking-wider text-orange-500 uppercase font-cairo">بيانات الاتصال والتفاصيل (قابلة للتعديل والتحرير)</div>
                  {!isEditingMode ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomerToDelete(selectedCustomer)}
                        className="px-2.5 py-1 bg-rose-600/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 rounded-md text-[10px] font-bold font-cairo transition-all flex items-center gap-1.5 cursor-pointer"
                        title="حذف العميل وكافة بياناته"
                      >
                        <Trash2 size={10} />
                        <span>حذف</span>
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingMode(true);
                            setUpdatePastTransactions(true);
                            setEditName(selectedCustomer.name || '');
                            setEditCompanyName(selectedCustomer.companyName || '');
                            setEditPhone1(selectedCustomer.phone1 || '');
                            setEditPhone2(selectedCustomer.phone2 || '');
                            setEditEmail(selectedCustomer.email || '');
                            setEditNotes(selectedCustomer.notes || '');
                          }}
                          className="px-2.5 py-1 bg-orange-600/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/25 rounded-md text-[10px] font-bold font-cairo transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 size={10} />
                          <span>تحرير البيانات الأساسية</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingMode(false)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded-md text-[10px] font-bold font-cairo border border-white/10 transition-all"
                    >
                      إلغاء التعديل
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Name */}
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] text-gray-400 font-bold block font-cairo">اسم العميل ورابط الحساب:</span>
                    <input
                      type="text"
                      disabled={!isEditingMode}
                      value={isEditingMode ? editName : selectedCustomer.name}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`customer-static-input w-full text-xs font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all font-cairo ${
                        isEditingMode
                          ? 'bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none'
                          : 'bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>
                  {/* Company Name */}
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] text-gray-400 font-bold block font-cairo">اسم الجهة / الشركة:</span>
                    <input
                      type="text"
                      disabled={!isEditingMode}
                      value={isEditingMode ? editCompanyName : (selectedCustomer.companyName || '')}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                      placeholder={isEditingMode ? 'اسم الشركة أو الجهة إن وجدت...' : 'لا يوجد'}
                      className={`customer-static-input w-full text-xs font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all font-cairo ${
                        isEditingMode
                          ? 'bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none'
                          : 'bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>
                  {/* Phone 1 */}
                  <div className="space-y-1 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 font-bold block font-cairo">الهاتف الرئيسي:</span>
                      {isEditingMode && (
                        <button
                          type="button"
                          onClick={() => setEditPhone1('لا يوجد')}
                          className="text-[9px] text-orange-400 hover:text-white bg-white/5 px-2 py-0.5 rounded border border-white/5 font-cairo font-black"
                        >
                          تعيين لا يوجد
                        </button>
                      )}
                    </div>
                    <input
                      type="tel"
                      inputMode="tel"
                      disabled={!isEditingMode}
                      value={isEditingMode ? editPhone1 : selectedCustomer.phone1}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9+*#]/g, '');
                        setEditPhone1(val);
                      }}
                      className={`customer-static-input w-full text-xs font-mono font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all ${
                        isEditingMode
                          ? 'bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none'
                          : 'bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>

                  {/* Phone 2 */}
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] text-gray-400 font-bold block font-cairo">رقم هاتف ثانوي:</span>
                    <input
                      type="tel"
                      inputMode="tel"
                      disabled={!isEditingMode}
                      value={isEditingMode ? editPhone2 : selectedCustomer.phone2 || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9+*#]/g, '');
                        setEditPhone2(val);
                      }}
                      placeholder={isEditingMode ? 'رقم هاتف إضافي إن وجد...' : 'غير مدخل'}
                      className={`customer-static-input w-full text-xs font-mono font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all ${
                        isEditingMode
                          ? 'bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none'
                          : 'bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] text-gray-400 font-bold block font-cairo">البريد الإلكتروني:</span>
                    <input
                      type="email"
                      disabled={!isEditingMode}
                      value={isEditingMode ? editEmail : selectedCustomer.email || ''}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder={isEditingMode ? 'customer@domain.com' : 'غير مدخل'}
                      className={`customer-static-input w-full text-xs font-mono font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all ${
                        isEditingMode
                          ? 'bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none'
                          : 'bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>

                  {/* Details / Notes / Notes */}
                  <div className="space-y-1 text-right md:col-span-2">
                    <span className="text-[10px] text-gray-400 font-bold block font-cairo">تفاصيل وملاحظات إضافية:</span>
                    <textarea
                      disabled={!isEditingMode}
                      value={isEditingMode ? editNotes : selectedCustomer.notes || ''}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      placeholder={isEditingMode ? 'اكتب أية ملاحظات تفصيلية أو عنونة أخرى للعميل...' : 'لا توجد ملاحظات مسجلة للعميل'}
                      className={`customer-static-input w-full text-xs font-bold text-right py-2 px-3.5 border rounded-xl transition-all resize-none ${
                        isEditingMode
                          ? 'bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none font-cairo'
                          : 'bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none font-cairo'
                      }`}
                    />
                  </div>

                  {/* WhatsApp Toggle */}
                  <div className={`space-y-1 text-right md:col-span-2 flex items-center justify-between p-3 rounded-xl border transition-all ${isEditingMode ? 'bg-black/40 border-white/10' : 'bg-[#161616] border-white/5 opacity-80'}`}>
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400 font-bold block font-cairo">يمتلك حساب واتساب؟</span>
                      <p className="text-[8px] text-gray-500 font-cairo">تحديد هذا الخيار يسمح بالإرسال التلقائي عبر الواتساب.</p>
                    </div>
                    <button
                      type="button"
                      disabled={!isEditingMode}
                      onClick={() => setEditHasWhatsapp(!editHasWhatsapp)}
                      className={`w-10 h-5 rounded-full relative transition-all duration-300 ${ (isEditingMode ? editHasWhatsapp : selectedCustomer.hasWhatsapp) ? 'bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.3)]' : 'bg-gray-700' } ${!isEditingMode ? 'cursor-not-allowed' : ''}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${ (isEditingMode ? editHasWhatsapp : selectedCustomer.hasWhatsapp) ? 'right-6' : 'right-1' }`} />
                    </button>
                  </div>
                </div>

                
                {/* Edit Action Save / Discard buttons */}
                {isEditingMode && (
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={updatePastTransactions}
                        onChange={(e) => setUpdatePastTransactions(e.target.checked)}
                        className="w-3 h-3 md:w-4 md:h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 bg-black/50"
                      />
                      <span className="text-[9px] md:text-[10px] text-gray-400 font-bold font-cairo">شامل التعاملات السابقة (الفواتير والقيود)</span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsEditingMode(false)}
                        className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-[10px] font-bold font-cairo border border-white/5 transition-all"
                      >
                        إلغاء التعديل
                      </button>
                      <button

                      type="button"
                      disabled={editName.trim() === '' || editPhone1.trim() === '' || isSavingInProcess}
                      onClick={handleUpdateCustomer}
                      className={`px-4.5 py-1.5 font-black font-cairo text-[10px] border rounded-lg shadow-lg flex items-center gap-1.5 transition-all ${
                        editName.trim() !== '' && editPhone1.trim() !== '' && !isSavingInProcess
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 hover:shadow-emerald-600/15'
                          : 'bg-white/[0.01] text-gray-500 border-white/5 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {isSavingInProcess ? (
                        <span>جاري الحفظ...</span>
                      ) : (
                        <>
                          <Check size={11} />
                          <span>حفظ وتثبيت البيانات</span>
                        </>
                      )}
                    </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
          )}
          
          {activeCustomerTab === 'statement' && (
            <div className="p-6 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center gap-4">
              <p className="text-gray-400 text-sm font-bold text-center">يمكنك إصدار كشف حساب شامل للعميل من هنا</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => {
                    const entries = getStatementEntries(selectedCustomer.id!);
                    const formattedEntries = entries.map((entry) => {
                      const formattedDate = formatDateTime(entry.date);

                      return {
                        ...entry,
                        formattedDate,
                        debit: entry.debit,
                        credit: entry.credit,
                        runningBalance: entry.runningBalance
                      };
                    });

                    const curr = getCustomerCurrencyLabel(selectedCustomer.id!);
                    const getArabicCurrencyName = (currCode: string) => {
                      if (!currCode) return 'دولار';
                      if (currCode.toUpperCase() === 'USD') return 'دولار';
                      if (currCode.toUpperCase() === 'YER') return 'ريال يمني';
                      if (currCode.toUpperCase().includes('USD') && currCode.toUpperCase().includes('YER')) return 'دولار / ريال يمني';
                      return currCode;
                    };
                    const arCurrency = getArabicCurrencyName(curr);

                    let totalDebit = 0;
                    let totalCredit = 0;
                    entries.forEach(e => {
                      totalDebit += e.debit;
                      totalCredit += e.credit;
                    });
                    const diff = totalCredit - totalDebit;
                    const isCreditor = diff > 0.01;
                    const isDebtor = diff < -0.01;
                    const balanceStatus = isCreditor ? 'دائن (له في الحساب)' : isDebtor ? 'مدين (متبقي عليه ديون)' : 'متزن الحساب';

                    setPreviewData({
                      type: 'statement',
                      data: {
                        statement: {
                          customerName: selectedCustomer.name,
                          companyName: selectedCustomer.companyName || '',
                          customerPhone: selectedCustomer.phone1 || '',
                          customerNumber: selectedCustomer.customerNumber || selectedCustomer.id?.substring(0, 5) || '',
                          balance: diff,
                          balanceStatus: balanceStatus,
                          currency: arCurrency,
                          liabilityCurrency: selectedCustomer.liabilityCurrency || 'USD',
                          entries: formattedEntries
                        }
                      }
                    });
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/10 transition-all flex items-center gap-2"
                >
                  <FileText size={14} />
                  <span>معاينة وإصدار كشف حساب</span>
                </button>

                <button
                  onClick={() => {
                    const entries = getStatementEntries(selectedCustomer.id!);
                    let totalDebit = 0;
                    let totalCredit = 0;
                    entries.forEach(e => {
                      totalDebit += e.debit;
                      totalCredit += e.credit;
                    });
                    const unpaid = totalDebit - totalCredit;

                    if (unpaid <= 0) {
                      alert('حساب العميل متزن أو دائن، لا حاجة لإرسال تذكير.');
                      return;
                    }

                    sendUniversalReminder({
                      customerName: selectedCustomer.name,
                      phone: selectedCustomer.phone1,
                      amount: unpaid,
                      currency: selectedCustomer.currency || 'USD',
                      hasWhatsapp: selectedCustomer.hasWhatsapp !== undefined ? selectedCustomer.hasWhatsapp : true,
                      countryCode: shopConfig?.countryCode
                    });
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/10 transition-all flex items-center gap-2"
                >
                  <MessageCircle size={14} />
                  <span>إرسال تذكير سداد (واتساب/SMS)</span>
                </button>
              </div>
            </div>
          )}

          {activeCustomerTab === 'log' && (
            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <FileText size={16} className="text-orange-500" />
                <span>سجلات وفواتير العميل المالي والتقني ({customerInvoices.length})</span>
              </div>

              <div className="bg-black/25 rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/5 text-gray-500 uppercase">
                        <th className="px-6 py-3 font-bold">رقم الفاتورة</th>
                        <th className="px-6 py-3 font-bold">تاريخ الفاتورة</th>
                        <th className="px-6 py-3 font-bold">عدد الأجهزة</th>
                        <th className="px-6 py-3 font-bold">التكلفة الإجمالية</th>
                        <th className="px-6 py-3 font-bold">المدفوع</th>
                        <th className="px-6 py-3 font-bold">المتبقي</th>
                        <th className="px-6 py-3 font-bold">حالة الفاتورة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {customerInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            لا توجد فواتير مسجلة لهذا العميل.
                          </td>
                        </tr>
                      ) : (
                        customerInvoices.map((inv) => {
                          const invItems = items.filter(it => it.invoiceNumber === inv.invoiceNumber);
                          const itemsCount = invItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
                          const actualCost = getInvoiceActualCost(invItems, inv);
                          const remainingForInv = Math.max(0, actualCost - Number(inv.amountPaid || 0));
                          const curr = inv.currency || 'USD';

                          // Group counts by status
                          const statusGroups: { [status: string]: number } = {};
                          invItems.forEach(it => {
                            const curStatus = it.status || '10';
                            statusGroups[curStatus] = (statusGroups[curStatus] || 0) + (Number(it.quantity) || 1);
                          });
                          
                          return (
                            <tr key={inv.id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="px-6 py-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                              <td className="px-6 py-4 font-mono text-slate-400">
                                {inv.createdAt 
                                  ? (function(){ const d = parseDate(inv.createdAt); return d ? d.toLocaleDateString('ar-YE') : '---'; })()
                                  : '---'
                                }
                              </td>
                              <td className="px-6 py-4 font-mono">{itemsCount}</td>
                              <td className="px-6 py-4 font-mono text-white font-bold">{actualCost.toFixed(2)} <span className="text-[9px] text-gray-500">{curr}</span></td>
                              <td className="px-6 py-4 font-mono text-emerald-400">{Number(inv.amountPaid || 0).toFixed(2)} <span className="text-[9px] text-gray-500">{curr}</span></td>
                              <td className="px-6 py-4 font-mono text-rose-500 font-bold">{remainingForInv.toFixed(2)} <span className="text-[9px] text-gray-500">{curr}</span></td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1.5 justify-end">
                                  {Object.entries(statusGroups).map(([status, count]) => (
                                    <div key={status} className="flex items-center gap-1.5 justify-end">
                                      <span className="text-[10px] font-bold text-gray-400 font-mono">{count}x</span>
                                      <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${getStatusStyle(status)}`}>
                                        {getStatusTextArabic(status)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Bottom action block (Unique ID placeholder) */}
          <div className="flex justify-end pt-4">
            <span className="text-[10px] text-gray-500 font-bold font-cairo font-mono">المعرف الفريد: {selectedCustomer.id}</span>
          </div>

        </div>
      )}

      {/* Comprehensive Customers List Registry (Loaded directly into database table below search inputs) */}
      {(!selectedCustomer || activeCustomerTab === 'menu') && (
        <div className="customers-box bg-[#1a1a1a] border-y border-white/5 mx-0 my-4 space-y-0">
        {/* Headers and Advanced Sort filters */}
        <div className="flex items-center justify-between gap-2 p-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-600/10 text-orange-500 rounded-lg border border-orange-500/15">
              <Users size={16} />
            </div>
            <h3 className="text-[10px] sm:text-xs font-black font-cairo text-white">جدول جميع العملاء المسجلين في النظام</h3>
          </div>
          
          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="px-2 py-1.5 bg-white/5 hover:bg-orange-600/20 text-gray-400 hover:text-orange-500 rounded-lg transition-all border border-white/10 flex items-center gap-1.5"
            >
              <span className="text-[9px] font-bold font-cairo sm:block hidden">ترتيب وفرز</span>
              <ArrowUpDown size={12} />
            </button>
            
            {showFilterDropdown && (
              <div className="absolute z-50 left-0 mt-2 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-2xl p-1.5 w-48">
                <button onClick={() => setFilterAndSort('alpha', 'asc')} className="w-full text-right px-3 py-1.5 text-[10px] hover:bg-orange-600 hover:text-white text-slate-300 rounded font-bold font-cairo transition-colors">أبجدي (أ إلى ي)</button>
                <button onClick={() => setFilterAndSort('alpha', 'desc')} className="w-full text-right px-3 py-1.5 text-[10px] hover:bg-orange-600 hover:text-white text-slate-300 rounded font-bold font-cairo transition-colors">أبجدي (ي إلى أ)</button>
                <button onClick={() => setFilterAndSort('date', 'desc')} className="w-full text-right px-3 py-1.5 text-[10px] hover:bg-orange-600 hover:text-white text-slate-300 rounded font-bold font-cairo transition-colors">تاريخ التسجيل الأحدث</button>
                <button onClick={() => setFilterAndSort('date', 'asc')} className="w-full text-right px-3 py-1.5 text-[10px] hover:bg-orange-600 hover:text-white text-slate-300 rounded font-bold font-cairo transition-colors">تاريخ التسجيل الأقدم</button>
                <button onClick={() => setFilterAndSort('debt', 'asc')} className="w-full text-right px-3 py-1.5 text-[10px] hover:bg-orange-600 hover:text-white text-slate-300 rounded font-bold font-cairo transition-colors">المديونية (الأقل أولاً)</button>
                <button onClick={() => setFilterAndSort('debt', 'desc')} className="w-full text-right px-3 py-1.5 text-[10px] hover:bg-orange-600 hover:text-white text-slate-300 rounded font-bold font-cairo transition-colors">المديونية (الأكثر أولاً)</button>
              </div>
            )}
          </div>
        </div>

        {/* The Customers Data Table */}
        <div className="w-full overflow-hidden">
          <table className="w-full text-right border-collapse table-fixed select-none">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-gray-400 text-[9px] sm:text-[10px]">
                <th onClick={() => handleHeaderClick('code')} className="px-1 py-1.5 font-bold text-center w-10 sm:w-16 cursor-pointer hover:bg-white/10 hover:text-white transition-all select-none">
                  الكود{renderSortArrow('code')}
                </th>
                <th onClick={() => handleHeaderClick('alpha')} className="px-1 py-1.5 font-bold w-1/4 cursor-pointer hover:bg-white/10 hover:text-white transition-all select-none">
                  اسم العميل{renderSortArrow('alpha')}
                </th>
                <th className="px-1 py-1.5 font-bold">رقم الجوال</th>
                <th onClick={() => handleHeaderClick('devices')} className="px-1 py-1.5 font-bold text-center w-12 sm:w-16 whitespace-nowrap cursor-pointer hover:bg-white/10 hover:text-white transition-all select-none">
                  أجهزة{renderSortArrow('devices')}
                </th>
                <th onClick={() => handleHeaderClick('debt')} className="px-1 py-1.5 font-bold text-center w-14 sm:w-16 whitespace-nowrap cursor-pointer hover:bg-white/10 hover:text-white transition-all select-none">
                  المديونية{renderSortArrow('debt')}
                </th>
                <th onClick={() => handleHeaderClick('currency')} className="px-1 py-1.5 font-bold text-center w-14 sm:w-18 whitespace-nowrap cursor-pointer hover:bg-white/10 hover:text-white transition-all select-none">
                  عملة الحساب{renderSortArrow('currency')}
                </th>
                <th onClick={() => handleHeaderClick('date')} className="px-1 py-1.5 font-bold text-center w-14 sm:w-20 whitespace-nowrap cursor-pointer hover:bg-white/10 hover:text-white transition-all select-none">
                  تاريخ التسجيل{renderSortArrow('date')}
                </th>
              </tr>
            </thead>
              <tbody className="divide-y divide-white/5 text-slate-300 text-[10px] sm:text-xs">
                {currentCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-8 text-center text-gray-500 font-bold font-cairo text-xs">
                      لا يوجد عملاء مطابقين للبحث حالياً.
                    </td>
                  </tr>
                ) : (
                  currentCustomers.map((cust) => {
                    const remainingDevices = getCustomerRemainingDevices(cust.id!);
                    const outstandingAmt = getCustomerOutstandingAmount(cust.id!);
                    const currLabel = getCustomerCurrencyLabel(cust.id!);
                    const isSelected = selectedCustomer?.id === cust.id;

                    return (
                      <tr key={cust.id} className="hover:bg-white/[0.03] transition-colors cursor-pointer" onClick={() => selectCustomer(cust)}>
                        <td className="px-1 py-1 font-mono font-bold text-gray-500 text-center text-[9px] sm:text-[10px]">
                          {cust.customerNumber || '---'}
                        </td>
                        <td className="px-1 py-1">
                          <div className="flex flex-col">
                            <span className={`font-bold text-[10px] sm:text-xs truncate ${isSelected ? 'text-orange-400' : 'text-white'}`}>{cust.name}</span>
                            {cust.notes && <span className="text-[8px] sm:text-[9px] text-gray-500 line-clamp-1">{cust.notes}</span>}
                          </div>
                        </td>
                        <td className="px-1 py-1 font-mono text-slate-400">
                          <div className="flex flex-col gap-0">
                            <span className="flex items-center text-[9px] sm:text-[10px] truncate">{cust.phone1}</span>
                            {cust.phone2 && <span className="flex items-center text-[8px] sm:text-[9px] text-gray-600 truncate">{cust.phone2}</span>}
                          </div>
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap text-[9px] sm:text-[10px]">
                          {remainingDevices > 0 ? (
                            <span className="inline-block bg-orange-500/10 text-orange-400 px-1 py-0.5 rounded text-[9px] font-bold">
                              {remainingDevices}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-bold">-</span>
                          )}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap text-[9px] sm:text-[10px]">
                          {outstandingAmt > 0 ? (
                            <span className="inline-block bg-rose-500/10 text-rose-400 px-1 py-0.5 rounded text-[9px] font-bold">
                              {outstandingAmt.toFixed(0)}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[9px] font-bold">0</span>
                          )}
                        </td>
                        <td className="px-1 py-1 text-center whitespace-nowrap text-[9px] sm:text-[10px]">
                          <span className="inline-block bg-white/5 border border-white/5 text-gray-300 px-1.5 py-0.5 rounded text-[9px] font-black">
                            {(() => {
                              const curr = cust.liabilityCurrency || 'USD';
                              if (curr === 'USD') return 'دولار';
                              if (curr === 'SAR') return 'ريال سعودي';
                              if (curr === 'YER') return 'ريال يمني';
                              if (curr === 'EUR') return 'يورو';
                              return curr;
                            })()}
                          </span>
                        </td>
                        <td className="px-1 py-1 font-mono text-slate-400 text-[9px] sm:text-[10px] text-center whitespace-nowrap">
                          {cust.createdAt
                            ? (function(){ const d = parseDate(cust.createdAt); return d ? d.toLocaleDateString('ar-YE', { year: '2-digit', month: 'numeric', day: 'numeric' }) : '---'; })()
                            : '---'
                          }
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-black/20">
            <span className="text-xs text-gray-500 font-bold font-cairo">
              عرض {((safeCurrentPage - 1) * itemsPerPage) + 1} إلى {Math.min(safeCurrentPage * itemsPerPage, allProcessedCustomers.length)} من أصل {allProcessedCustomers.length} عميل
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 text-xs font-bold font-cairo bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-lg transition-all"
              >
                السابق
              </button>
              <div className="flex items-center gap-1 mx-2">
                <span className="text-sm font-bold text-white">{safeCurrentPage}</span>
                <span className="text-xs text-gray-500">من {totalPages}</span>
              </div>
              <button
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 text-xs font-bold font-cairo bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-lg transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
      )}

      {/* CUSTOMER STATEMENT OVERLAY IS NOW HANDLED BY PrintPreviewOverlay */}

      {/* 7. CUSTOMER DETAILS MODAL */}
      {showDetailsModal && selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl">
          <div className="customer-modal-bg bg-[#141414] w-full h-full p-6 md:p-8 space-y-6 shadow-2xl relative overflow-y-auto text-right">
            {/* Modal Actions */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 print:hidden">
              <div className="flex items-center gap-4">
                 <button onClick={() => setShowDetailsModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400">
                    <X size={20} />
                 </button>
                 <h3 className="text-sm font-black text-orange-400 font-cairo flex items-center gap-1.5 flex-row-reverse">
                    <User size={18} />
                    بيانات العميل المالية والتفصيلية
                 </h3>
              </div>
            </div>

            {/* Details Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* COLUMN 1: Read-Only System Metadata & Accounts state */}
              <div className="space-y-4">
                <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl relative space-y-3">
                  <div className="text-[10px] font-black tracking-wider text-orange-500 uppercase font-cairo border-b border-white/5 pb-1">البيانات النظامية الثابتة</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] text-gray-500 font-bold block font-cairo">رقم العميل:</span>
                      <div className="customer-static-input w-full bg-[#161616] border border-white/5 rounded-xl px-3.5 py-2 text-xs font-mono font-black text-gray-400 cursor-not-allowed">
                        #{selectedCustomer.customerNumber || '---'}
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <span className="text-[10px] text-gray-500 font-bold block font-cairo">اسم العميل:</span>
                      <div className="customer-static-input w-full bg-[#161616] border border-white/5 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-400 cursor-not-allowed font-cairo">
                        {selectedCustomer.name}
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <span className="text-[10px] text-gray-500 font-bold block font-cairo">اسم الجهة / الشركة:</span>
                      <div className="customer-static-input w-full bg-[#161616] border border-white/5 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-400 cursor-not-allowed font-cairo">
                        {selectedCustomer.companyName || 'لا يوجد'}
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <span className="text-[10px] text-gray-500 font-bold block font-cairo">تاريخ التسجيل:</span>
                      <div className="customer-static-input w-full bg-[#161616] border border-white/5 rounded-xl px-3.5 py-2 text-[11px] font-bold text-gray-400 cursor-not-allowed font-cairo">
                        {selectedCustomer.createdAt
                          ? (function(){ const d = parseDate(selectedCustomer.createdAt); return d ? d.toLocaleDateString('ar-YE') : '---'; })()
                          : '---'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calculations blocks for devices & Net Account balance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-black/20 border border-white/5 rounded-2xl text-right">
                    <span className="text-[10px] text-gray-500 font-bold block font-cairo uppercase">الأجهزة المتبقية بمحل الصيانة</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black text-white font-mono">{getCustomerRemainingDevices(selectedCustomer.id!)}</span>
                      <span className="text-gray-500 text-[10px] font-bold">أجهزة</span>
                    </div>
                  </div>

                  <div className="p-4 bg-black/20 border border-white/5 rounded-2xl text-right">
                    <span className="text-[10px] text-gray-500 font-bold block font-cairo uppercase">حالة صافي مديونية العميل</span>
                    <div className="mt-1">
                      {(() => {
                        const totalPaid = getCustomerTotalPaid(selectedCustomer.id!);
                        const totalCost = getCustomerTotalCost(selectedCustomer.id!);
                        const diff = totalPaid - totalCost;
                        const curr = getCustomerCurrencyLabel(selectedCustomer.id!);
                        
                        if (diff > 0.01) {
                          return <div className="text-lg font-black text-emerald-400 font-mono">+{diff.toFixed(2)} {curr}</div>;
                        } else if (diff < -0.01) {
                          return <div className="text-lg font-black text-rose-500 font-mono">{diff.toFixed(2)} {curr}</div>;
                        } else {
                          return <div className="text-lg font-black text-slate-400 font-mono">0.00 {curr}</div>;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMN 2: Editable/Modifiable Secondary Contact Information */}
              <div className="space-y-4">
                 <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="text-[10px] font-black tracking-wider text-orange-500 uppercase font-cairo">بيانات الاتصال والتفاصيل (قابلة للتعديل والتحرير)</div>
                    {!isEditingMode ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomerToDelete(selectedCustomer)}
                          className="px-2.5 py-1 bg-rose-600/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 rounded-md text-[10px] font-bold font-cairo transition-all flex items-center gap-1.5 cursor-pointer"
                          title="حذف العميل وكافة بياناته وفواتيره"
                        >
                          <Trash2 size={10} />
                          <span>حذف</span>
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingMode(true);
                              setUpdatePastTransactions(true);
                              setEditName(selectedCustomer.name || '');
                              setEditCompanyName(selectedCustomer.companyName || '');
                              setEditPhone1(selectedCustomer.phone1 || '');
                              setEditPhone2(selectedCustomer.phone2 || '');
                              setEditEmail(selectedCustomer.email || '');
                              setEditNotes(selectedCustomer.notes || '');
                            }}
                            className="px-2.5 py-1 bg-orange-600/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/25 rounded-md text-[10px] font-bold font-cairo transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 size={10} />
                            <span>تحرير البيانات الأساسية</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingMode(false)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded-md text-[10px] font-bold font-cairo border border-white/10 transition-all cursor-pointer"
                      >
                        إلغاء التعديل
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  
                  {/* Name */}
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] text-gray-400 font-bold block font-cairo">اسم العميل ورابط الحساب:</span>
                    <input
                      type="text"
                      disabled={!isEditingMode}
                      value={isEditingMode ? editName : selectedCustomer.name}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`customer-static-input w-full text-xs font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all font-cairo ${
                        isEditingMode
                          ? 'bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none'
                          : 'bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>
                  {/* Company Name */}
                  <div className="space-y-1 text-right">
                    <span className="text-[10px] text-gray-400 font-bold block font-cairo">اسم الجهة / الشركة:</span>
                    <input
                      type="text"
                      disabled={!isEditingMode}
                      value={isEditingMode ? editCompanyName : (selectedCustomer.companyName || '')}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                      placeholder={isEditingMode ? 'اسم الشركة أو الجهة إن وجدت...' : 'لا يوجد'}
                      className={`customer-static-input w-full text-xs font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all font-cairo ${
                        isEditingMode
                          ? 'bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none'
                          : 'bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none'
                      }`}
                    />
                  </div>
                  {/* Phone 1 */}
                    <div className="space-y-1 text-right">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-bold block font-cairo">الهاتف الرئيسي:</span>
                        {isEditingMode && (
                          <button
                            type="button"
                            onClick={() => setEditPhone1('لا يوجد')}
                            className="text-[9px] text-orange-400 hover:text-white bg-white/5 px-2 py-0.5 rounded border border-white/5 font-cairo font-black"
                          >
                            تعيين لا يوجد
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        disabled={!isEditingMode}
                        value={isEditingMode ? editPhone1 : selectedCustomer.phone1}
                        onChange={(e) => setEditPhone1(e.target.value)}
                        className={`customer-static-input w-full text-xs font-mono font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all ${
                          isEditingMode
                            ? 'bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none'
                            : 'bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none'
                        }`}
                      />
                    </div>

                    {/* Phone 2 */}
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] text-gray-400 font-bold block font-cairo">رقم هاتف ثانوي:</span>
                      <input
                        type="text"
                        disabled={!isEditingMode}
                        value={isEditingMode ? editPhone2 : selectedCustomer.phone2 || ''}
                        onChange={(e) => setEditPhone2(e.target.value)}
                        placeholder={isEditingMode ? 'رقم هاتف إضافي إن وجد...' : 'غير مدخل'}
                        className={`customer-static-input w-full text-xs font-mono font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all ${
                          isEditingMode
                            ? 'bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none'
                            : 'bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none'
                        }`}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] text-gray-400 font-bold block font-cairo">البريد الإلكتروني:</span>
                      <input
                        type="email"
                        disabled={!isEditingMode}
                        value={isEditingMode ? editEmail : selectedCustomer.email || ''}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder={isEditingMode ? 'customer@domain.com' : 'غير مدخل'}
                        className={`customer-static-input w-full text-xs font-mono font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all ${
                          isEditingMode
                            ? 'bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none'
                            : 'bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none'
                        }`}
                      />
                    </div>

                    {/* Details / Notes / Notes */}
                    <div className="space-y-1 text-right md:col-span-2">
                      <span className="text-[10px] text-gray-400 font-bold block font-cairo">تفاصيل وملاحظات إضافية:</span>
                      <textarea
                        disabled={!isEditingMode}
                        value={isEditingMode ? editNotes : selectedCustomer.notes || ''}
                        onChange={(e) => setEditNotes(e.target.value)}
                        rows={2}
                        placeholder={isEditingMode ? 'اكتب أية ملاحظات تفصيلية أو عنونة أخرى للعميل...' : 'لا توجد ملاحظات مسجلة للعميل'}
                        className={`customer-static-input w-full text-xs font-bold text-right py-2 px-3.5 border rounded-xl transition-all resize-none ${
                        isEditingMode
                          ? 'bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none font-cairo'
                          : 'bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none font-cairo'
                        }`}
                      />
                    </div>
                  </div>

                  
                {/* Edit Action Save / Discard buttons */}
                {isEditingMode && (
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={updatePastTransactions}
                        onChange={(e) => setUpdatePastTransactions(e.target.checked)}
                        className="w-3 h-3 md:w-4 md:h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 bg-black/50"
                      />
                      <span className="text-[9px] md:text-[10px] text-gray-400 font-bold font-cairo">شامل التعاملات السابقة (الفواتير والقيود)</span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsEditingMode(false)}
                        className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-[10px] font-bold font-cairo border border-white/5 transition-all"
                      >
                        إلغاء التعديل
                      </button>
                      <button

                        type="button"
                        disabled={editName.trim() === '' || editPhone1.trim() === '' || isSavingInProcess}
                        onClick={handleUpdateCustomer}
                        className={`px-4.5 py-1.5 font-black font-cairo text-[10px] border rounded-lg shadow-lg flex items-center gap-1.5 transition-all ${
                          editName.trim() !== '' && editPhone1.trim() !== '' && !isSavingInProcess
                            ? 'bg-orange-600 border-orange-600 text-white hover:bg-orange-500'
                            : 'bg-white/10 border-white/5 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isSavingInProcess ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. CUSTOMER INVOICES LOG MODAL */}
      {showLogModal && selectedCustomer && (() => {
        // Robust matching helper to solve any loose or missing ID links
        const matchesCustomer = (inv: any) => {
          if (!inv || !selectedCustomer) return false;
          
          // 1. Direct ID check
          if (inv.customerId && selectedCustomer.id && inv.customerId === selectedCustomer.id) return true;
          
          const cleanPhone = (p: string) => p ? p.replace(/[\s\-\+\(\)]/g, '') : '';
          const cleanName = (n: string) => n ? n.trim().toLowerCase() : '';
          
          // 2. Phone check fallback
          if (inv.customerPhone && (selectedCustomer.phone1 || selectedCustomer.phone2)) {
            const invP = cleanPhone(inv.customerPhone);
            if (invP) {
              if (selectedCustomer.phone1 && cleanPhone(selectedCustomer.phone1) === invP) return true;
              if (selectedCustomer.phone2 && cleanPhone(selectedCustomer.phone2) === invP) return true;
            }
          }
          
          // 3. Name check fallback
          if (inv.customerName && selectedCustomer.name) {
            const invN = cleanName(inv.customerName);
            const custN = cleanName(selectedCustomer.name);
            if (invN && custN && (invN === custN || invN.includes(custN) || custN.includes(invN))) {
              return true;
            }
          }
          
          return false;
        };

        const allInvs = invoices.filter(matchesCustomer);
        const totalInvsCount = allInvs.length;
        const totalBilledVal = allInvs.reduce((sum, inv) => {
          const invItems = items.filter(it => it.invoiceNumber === inv.invoiceNumber);
          return sum + getInvoiceActualCost(invItems, inv);
        }, 0);
        const totalPaidVal = allInvs.reduce((sum, inv) => sum + Number(inv.amountPaid || 0), 0);
        const totalRemainingVal = Math.max(0, totalBilledVal - totalPaidVal);
        const totalDevices = allInvs.reduce((sum, inv) => {
          const invItems = items.filter(it => it.invoiceNumber === inv.invoiceNumber);
          return sum + invItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
        }, 0);
        const cLabel = getCustomerCurrencyLabel(selectedCustomer.id!);

        const filteredInvs = allInvs.filter(inv => {
          if (!logSearch) return true;
          const s = logSearch.toLowerCase();
          
          const formattedDateStr = inv.createdAt 
            ? (function(){
                const d = parseDate(inv.createdAt);
                return d ? d.toLocaleDateString('ar-YE') : '';
              })()
            : '';

          const invItems = items.filter(it => it.invoiceNumber === inv.invoiceNumber);
          const deviceMatches = invItems.some(it => 
            it.deviceName?.toLowerCase().includes(s) || 
            it.serialNumber?.toLowerCase().includes(s)
          );

          return (
            inv.invoiceNumber?.toLowerCase().includes(s) ||
            formattedDateStr.includes(s) ||
            deviceMatches
          );
        }).sort((a, b) => Number(b.invoiceNumber || 0) - Number(a.invoiceNumber || 0));

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-1.5 md:p-4 overflow-hidden">
            <div className="customer-modal-bg bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-7xl h-[94vh] p-3 md:p-5 space-y-3.5 shadow-2xl relative text-right flex flex-col">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 gap-3 shrink-0 print:hidden">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setShowLogModal(false);
                      setLogSearch('');
                      setSelectedLogInvoice(null);
                    }} 
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all border border-white/5 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
                    title="إغلاق"
                  >
                    <X size={18} />
                  </button>
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-orange-600/10 rounded-lg border border-orange-500/20 shrink-0">
                      <FileText size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-black text-white font-cairo tracking-tight">سجل فواتير العميل الشامل</h3>
                      <p className="text-xs text-gray-400 font-bold mt-0.5">{selectedCustomer.name}</p>
                    </div>
                  </div>
                </div>

                {/* Search Inside Modal */}
                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="ابحث برقم الفاتورة أو التاريخ أو الأجهزة..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full text-right pr-9 pl-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-cairo"
                  />
                </div>
              </div>

              {/* Quick Metrics Panel - Very Compact */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 shrink-0">
                <div className="p-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl text-right hover:border-white/10 transition-all flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-gray-400 block mb-0.5 font-cairo">إجمالي الفواتير</span>
                  <span className="text-base md:text-xl font-black text-white font-mono">{totalInvsCount}</span>
                </div>
                <div className="p-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl text-right hover:border-white/10 transition-all flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-gray-400 block mb-0.5 font-cairo">إجمالي الأجهزة</span>
                  <span className="text-base md:text-xl font-black text-white font-mono">{totalDevices}</span>
                </div>
                <div className="p-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl text-right hover:border-white/10 transition-all flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-gray-400 block mb-0.5 font-cairo">إجمالي المطالبات</span>
                  <span className="text-base md:text-xl font-black text-orange-400 font-mono">
                    {totalBilledVal.toFixed(2)} <span className="text-[10px] text-gray-500 font-bold">{cLabel}</span>
                  </span>
                </div>
                <div className="p-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl text-right hover:border-white/10 transition-all flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-gray-400 block mb-0.5 font-cairo">إجمالي المدفوع</span>
                  <span className="text-base md:text-xl font-black text-emerald-400 font-mono">
                    {totalPaidVal.toFixed(2)} <span className="text-[10px] text-emerald-500/60 font-bold">{cLabel}</span>
                  </span>
                </div>
                <div className="p-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl text-right col-span-2 md:col-span-1 hover:border-white/10 transition-all flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-gray-400 block mb-0.5 font-cairo">إجمالي المتبقي</span>
                  <span className={`text-base md:text-xl font-black font-mono ${totalRemainingVal > 0.01 ? 'text-rose-500' : 'text-emerald-400'}`}>
                    {totalRemainingVal.toFixed(2)} <span className="text-[10px] text-gray-500 font-bold">{cLabel}</span>
                  </span>
                </div>
              </div>

              {/* Invoices List Table Section - Clear and Compact */}
              <div className="flex-1 bg-[#111] rounded-xl border border-white/5 overflow-hidden flex flex-col min-h-0">
                {filteredInvs.length === 0 ? (
                  <div className="text-center my-auto py-12 text-gray-500 flex flex-col items-center justify-center">
                    <FileText size={36} className="mb-2 text-gray-600 opacity-60" />
                    <p className="text-xs md:text-sm font-bold font-cairo">لا توجد فواتير مطابقة لعملية البحث للعميل</p>
                    <p className="text-[10px] text-gray-500 font-cairo mt-0.5">جرب إدخال رقم فاتورة صحيح أو اسم جهاز</p>
                  </div>
                ) : (
                  <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-white/10">
                    <table className="w-full text-right border-collapse text-xs">
                      <thead className="sticky top-0 z-10 bg-[#161616] border-b border-white/10 text-gray-300 font-cairo text-[11px] md:text-xs">
                        <tr>
                          <th className="px-3.5 py-2.5 font-black border-l border-white/5 w-16"># الفاتورة</th>
                          <th className="px-3.5 py-2.5 font-black border-l border-white/5 w-24">التاريخ</th>
                          <th className="px-3.5 py-2.5 font-black border-l border-white/5">الأجهزة والخدمات داخل الفاتورة</th>
                          <th className="px-3.5 py-2.5 font-black border-l border-white/5 w-28">القيمة الإجمالية</th>
                          <th className="px-3.5 py-2.5 font-black border-l border-white/5 w-28">المبلغ المدفوع</th>
                          <th className="px-3.5 py-2.5 font-black border-l border-white/5 w-28">المبلغ المتبقي</th>
                          <th className="px-3.5 py-2.5 text-center font-black w-40">الإجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300 font-cairo">
                        {filteredInvs.map((inv, index) => {
                          const invItems = items.filter(it => it.invoiceNumber === inv.invoiceNumber);
                          const actualCost = getInvoiceActualCost(invItems, inv);
                          const remainingForInv = Math.max(0, actualCost - Number(inv.amountPaid || 0));
                          const curr = getCustomerCurrencyLabel(selectedCustomer.id!);
                          const isSelected = selectedLogInvoice && selectedLogInvoice.invoiceNumber === inv.invoiceNumber;

                          return (
                            <tr 
                              key={inv.id || index} 
                              onClick={() => setSelectedLogInvoice(inv)}
                              className={`hover:bg-white/[0.04] even:bg-white/[0.01] cursor-pointer transition-colors ${isSelected ? 'bg-orange-600/15 border-r-4 border-r-orange-500' : ''}`}
                            >
                              {/* Invoice Number */}
                              <td className="px-3.5 py-2.5 font-mono font-black text-white text-xs border-l border-white/5">
                                <span className="text-orange-500 font-bold">#</span>{inv.invoiceNumber}
                              </td>

                              {/* Date */}
                              <td className="px-3.5 py-2.5 font-mono text-slate-400 border-l border-white/5 whitespace-nowrap text-[11px]">
                                {inv.createdAt 
                                  ? (function(){ 
                                      const d = parseDate(inv.createdAt); 
                                      return d ? d.toLocaleDateString('ar-YE', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '---'; 
                                    })()
                                  : '---'
                                }
                              </td>

                              {/* Devices List Details - Inlines and Badges */}
                              <td className="px-3.5 py-2.5 border-l border-white/5 max-w-md">
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                                  {invItems.length === 0 ? (
                                    <span className="text-[10px] text-gray-500 font-bold">
                                      {inv.invoiceType === 'sale_software' ? 'فاتورة خدمات برمجية' : (inv.invoiceType === 'sale_maintenance' ? 'فاتورة صيانة خارجية' : (inv.invoiceType === 'sale_parts' ? 'فاتورة بيع قطع غيار' : 'لا توجد أجهزة/خدمات مضافة'))}
                                    </span>
                                  ) : (
                                    invItems.map((item, idx) => (
                                      <div key={item.id || idx} className="inline-flex items-center gap-1 bg-white/[0.03] px-2 py-0.5 rounded border border-white/5 text-[10px] hover:bg-white/[0.06] transition-all whitespace-nowrap">
                                        <span className="font-bold text-white max-w-[130px] truncate">{item.deviceName || item.deviceType || 'خدمة'}</span>
                                        {item.serialNumber && <span className="text-gray-500 font-mono text-[9px]">({item.serialNumber})</span>}
                                        <span className={`px-1 py-[0.5px] rounded text-[8px] font-black scale-90 ${getStatusStyle(item.status || '10')}`}>
                                          {getStatusTextArabic(item.status || '10')}
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </td>

                              {/* Total Cost */}
                              <td className="px-3.5 py-2.5 font-mono text-orange-400 font-black text-xs border-l border-white/5 whitespace-nowrap">
                                {actualCost.toFixed(2)} <span className="text-[10px] text-gray-500 font-bold">{curr}</span>
                              </td>

                              {/* Amount Paid */}
                              <td className="px-3.5 py-2.5 font-mono text-emerald-400 font-black text-xs border-l border-white/5 whitespace-nowrap">
                                {Number(inv.amountPaid || 0).toFixed(2)} <span className="text-[10px] text-emerald-500/60 font-bold">{curr}</span>
                              </td>

                              {/* Remaining */}
                              <td className="px-3.5 py-2.5 font-mono text-xs border-l border-white/5 whitespace-nowrap">
                                <span className={`font-black ${remainingForInv > 0.01 ? 'text-rose-500' : 'text-emerald-400'}`}>
                                  {remainingForInv.toFixed(2)}
                                </span>{' '}
                                <span className="text-[10px] text-gray-500 font-bold">{curr}</span>
                              </td>

                              {/* Actions */}
                              <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => setSelectedLogInvoice(inv)}
                                    className={`px-2.5 py-1 rounded-md transition-all border text-[10px] font-black cursor-pointer inline-flex items-center gap-1 hover:scale-105 active:scale-95 ${isSelected ? 'bg-orange-600 text-white border-orange-500/30' : 'bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white border-amber-500/20'}`}
                                    title="تفاصيل الأصناف والقطع"
                                  >
                                    <Eye size={12} />
                                    <span>الأصناف والقطع</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setPreviewData({
                                        type: 'invoice',
                                        data: {
                                          invoice: {
                                            ...inv,
                                            customerPhone: selectedCustomer?.phone1 || inv.customerPhone || ''
                                          },
                                          items: invItems
                                        }
                                      });
                                    }}
                                    className="px-2.5 py-1 bg-orange-600/10 hover:bg-orange-600 text-orange-400 hover:text-white rounded-md transition-all border border-orange-500/20 text-[10px] font-black cursor-pointer inline-flex items-center gap-1 hover:scale-105 active:scale-95"
                                    title="عرض الفاتورة"
                                  >
                                    <Printer size={12} />
                                    <span>عرض الفاتورة</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer text */}
              <div className="border-t border-white/5 pt-2 shrink-0 text-right">
                <span className="text-[10px] md:text-xs text-gray-400 font-bold">يمكنك النقر على أي فاتورة في الجدول أعلاه أو استخدام زر "الأصناف والقطع" لفتح نافذة جانبية تعرض تفاصيل الأجهزة وقطع الغيار فوراً.</span>
              </div>

              {/* SIDE DRAWER FOR INVOICE ITEMS AND PARTS */}
              {selectedLogInvoice && (
                <motion.div
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="absolute left-0 top-0 bottom-0 h-full w-full max-w-[480px] sm:max-w-[550px] bg-[#0c0c0c] border-r border-white/10 z-50 rounded-r-none rounded-l-2xl shadow-[15px_0_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-right font-cairo"
                  dir="rtl"
                >
                  {/* Drawer Header */}
                  <div className="p-4 bg-white/[0.03] border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => setSelectedLogInvoice(null)}
                        className="p-2 bg-white/5 hover:bg-red-600/20 text-gray-400 hover:text-red-400 rounded-xl transition-all cursor-pointer border border-white/5 active:scale-95"
                        title="إغلاق"
                      >
                        <X size={18} />
                      </button>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-white">تفاصيل أصناف الفاتورة والقطع</h4>
                        <p className="text-[10px] text-orange-500 font-mono font-black mt-0.5">#{selectedLogInvoice.invoiceNumber}</p>
                      </div>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-[9px] text-gray-500 font-bold block">التاريخ</span>
                      <span className="text-[11px] text-gray-300 font-bold">
                        {selectedLogInvoice.createdAt 
                          ? (function(){ 
                              const d = parseDate(selectedLogInvoice.createdAt); 
                              return d ? d.toLocaleDateString('ar-YE', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '---'; 
                            })()
                          : '---'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4.5 scrollbar-thin scrollbar-thumb-white/10">
                    {/* Financial Summary card */}
                    <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold block mb-1">المطالبة الكلية</span>
                        <span className="text-xs sm:text-sm font-black text-orange-400 font-mono">
                          {getInvoiceActualCost(items.filter(it => it.invoiceNumber === selectedLogInvoice.invoiceNumber), selectedLogInvoice).toFixed(2)}
                        </span>
                      </div>
                      <div className="border-x border-white/5">
                        <span className="text-[9px] text-gray-500 font-bold block mb-1">المدفوع</span>
                        <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono">
                          {Number(selectedLogInvoice.amountPaid || 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold block mb-1">المتبقي</span>
                        <span className={`text-xs sm:text-sm font-black font-mono ${Math.max(0, getInvoiceActualCost(items.filter(it => it.invoiceNumber === selectedLogInvoice.invoiceNumber), selectedLogInvoice) - Number(selectedLogInvoice.amountPaid || 0)) > 0.01 ? 'text-rose-500' : 'text-emerald-400'}`}>
                          {Math.max(0, getInvoiceActualCost(items.filter(it => it.invoiceNumber === selectedLogInvoice.invoiceNumber), selectedLogInvoice) - Number(selectedLogInvoice.amountPaid || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* List of Devices */}
                    <div className="space-y-4">
                      <h5 className="text-xs font-black text-gray-300 border-r-2 border-orange-500 pr-2">الأجهزة والخدمات بالفاتورة ({items.filter(it => it.invoiceNumber === selectedLogInvoice.invoiceNumber).length})</h5>
                      
                      {items.filter(it => it.invoiceNumber === selectedLogInvoice.invoiceNumber).length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-xs bg-white/[0.01] border border-white/5 rounded-xl">
                          لا توجد أجهزة مسجلة في هذه الفاتورة.
                        </div>
                      ) : (
                        items.filter(it => it.invoiceNumber === selectedLogInvoice.invoiceNumber).map((it, idx) => {
                          const hasParts = it.partsUsed && Array.isArray(it.partsUsed) && it.partsUsed.length > 0;
                          const partsTotal = hasParts ? it.partsUsed.reduce((sum: number, p: any) => sum + Number(p.cost || 0), 0) : 0;
                          const laborCost = Math.max(0, Number(it.cost || 0) - partsTotal);
                          const curr = getCustomerCurrencyLabel(selectedCustomer.id!);

                          return (
                            <div key={it.id || idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3.5 hover:border-white/10 transition-all relative overflow-hidden">
                              {/* Device status and title row */}
                              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono font-black text-white bg-white/5 px-2 py-0.5 rounded border border-white/5">{idx + 1}</span>
                                  <span className="text-xs font-black text-white">{it.deviceName || 'جهاز صيانة'}</span>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black ${getStatusStyle(it.status || '10')}`}>
                                  {getStatusTextArabic(it.status || '10')}
                                </span>
                              </div>

                              {/* Details fields */}
                              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                                <div>
                                  <span className="text-[10px] text-gray-500 font-bold block mb-0.5">تصنيف الجهاز</span>
                                  <span className="text-gray-200 font-bold font-cairo">{it.deviceType || 'غير محدد'}</span>
                                </div>
                                {it.serialNumber && (
                                  <div>
                                    <span className="text-[10px] text-gray-500 font-bold block mb-0.5">الرقم التسلسلي S/N</span>
                                    <span className="text-gray-200 font-mono font-bold">{it.serialNumber}</span>
                                  </div>
                                )}
                                <div className="col-span-2 bg-[#161616]/40 p-2.5 rounded-xl border border-white/5">
                                  <span className="text-[10px] text-amber-500/80 font-black block mb-1">الشكوى والمشكلة الموصوفة:</span>
                                  <span className="text-amber-100 font-bold block leading-relaxed">{it.faultType || it.customerProblem || 'لم يحدد'}</span>
                                </div>
                                <div className="col-span-2 bg-emerald-950/10 p-2.5 rounded-xl border border-emerald-500/10">
                                  <span className="text-[10px] text-emerald-400 font-black block mb-1">تقرير الصيانة والإصلاح الفني:</span>
                                  <span className="text-slate-300 font-bold block leading-relaxed">{it.technicalNotes || it.engineerReport || 'تحت الفحص الفني والتشخيص حالياً'}</span>
                                </div>
                                {it.technician && (
                                  <div>
                                    <span className="text-[10px] text-gray-500 font-bold block mb-0.5">المهندس الفني</span>
                                    <span className="text-gray-200 font-bold">{it.technician}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-[10px] text-gray-500 font-bold block mb-0.5">إجمالي التكلفة</span>
                                  <span className="text-orange-400 font-mono font-black">{Number(it.cost || 0).toFixed(2)} <span className="text-[10px] text-gray-500 font-bold">{curr}</span></span>
                                </div>
                              </div>

                              {/* Spare Parts block */}
                              <div className="border-t border-white/5 pt-3 mt-1">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-black text-gray-300 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                    قطع الغيار المستخدمة
                                  </span>
                                  {hasParts && (
                                    <span className="text-[10px] font-mono text-gray-400">
                                      المجموع: {partsTotal.toFixed(2)} {curr}
                                    </span>
                                  )}
                                </div>

                                {hasParts ? (
                                  <div className="space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                                    {it.partsUsed.map((part: any, pIdx: number) => (
                                      <div key={pIdx} className="flex items-center justify-between text-[11px] text-slate-300 py-0.5">
                                        <span className="font-bold">{part.name}</span>
                                        <span className="font-mono font-black text-orange-400">{Number(part.cost || 0).toFixed(2)} {curr}</span>
                                      </div>
                                    ))}
                                    <div className="border-t border-white/5 pt-1.5 mt-1.5 flex justify-between text-[10px] text-gray-400">
                                      <span>أجور الصيانة (بدون قطع):</span>
                                      <span className="font-mono font-bold text-gray-300">{laborCost.toFixed(2)} {curr}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-2 text-gray-500 text-[10px] bg-black/20 rounded-xl border border-dashed border-white/5 font-bold">
                                    لا توجد قطع غيار مسجلة لهذا الجهاز بشكل مستقل.
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Drawer Footer */}
                  <div className="p-4 bg-white/[0.03] border-t border-white/5 flex items-center justify-between shrink-0">
                    <button
                      onClick={() => setSelectedLogInvoice(null)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                    >
                      إغلاق التفاصيل
                    </button>
                    <button
                      onClick={() => {
                        setPreviewData({
                          type: 'invoice',
                          data: {
                            invoice: {
                              ...selectedLogInvoice,
                              customerPhone: selectedCustomer?.phone1 || selectedLogInvoice.customerPhone || ''
                            },
                            items: items.filter(it => it.invoiceNumber === selectedLogInvoice.invoiceNumber)
                          }
                        });
                      }}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-lg shadow-orange-600/10"
                    >
                      <Printer size={13} />
                      <span>عرض وطباعة الفاتورة</span>
                    </button>
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        );
      })()}

      {previewData && (
        <PrintPreviewOverlay
          type={previewData.type}
          data={previewData.data}
          onClose={() => setPreviewData(null)}
          shopConfig={shopConfig}
          user={user}
        />
      )}

      {/* Delete Confirmation Modal */}
      {customerToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#18181b] border border-rose-500/30 rounded-3xl p-6 max-w-md w-full text-right shadow-2xl relative space-y-5"
          >
            <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
              <AlertTriangle size={24} />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-white font-cairo">تأكيد حذف العميل نهائياً</h3>
              <p className="text-xs text-gray-300 font-cairo leading-relaxed">
                هل أنت متأكد من رغبتك في حذف العميل <span className="text-rose-400 font-bold">"{customerToDelete.name}"</span> بشكل نهائي؟
              </p>
              
              <label className="flex items-start gap-2 bg-rose-950/20 p-3 rounded-xl border border-rose-900/30 cursor-pointer mt-3">
                <input 
                  type="checkbox" 
                  checked={deletePastTransactions}
                  onChange={(e) => setDeletePastTransactions(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-rose-500/50 text-rose-600 focus:ring-rose-500 bg-black/50"
                />
                <div className="text-right">
                  <span className="text-[11px] md:text-xs text-rose-300 font-bold font-cairo block">شامل التعاملات السابقة (العمليات المرتبطة)</span>
                  <span className="text-[9px] md:text-[10px] text-rose-400/70 font-cairo mt-1 block">إذا تم تفعيل هذا الخيار، سيتم محو كافة الفواتير والإيصالات وسجلات الصيانة والعمليات المالية التي تخص العميل.</span>
                </div>
              </label>

              <div className="p-3 bg-rose-950/30 border border-rose-800/30 rounded-xl text-[11px] text-rose-300 font-bold font-cairo mt-3">
                ⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSavingInProcess}
                onClick={() => performDeleteCustomer(customerToDelete)}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-black font-cairo transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {isSavingInProcess ? (
                  <span>جاري الحذف...</span>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>نعم، حذف النهائي</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isSavingInProcess}
                onClick={() => setCustomerToDelete(null)}
                className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-bold font-cairo transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
