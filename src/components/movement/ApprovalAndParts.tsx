import { sharePdfFile, openWhatsApp } from '../../lib/shareHelper';
import { parseDate } from '../../lib/dateUtils';
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, writeBatch, serverTimestamp, getDoc, updateDoc } from '../../firebase';
import { db } from '../../firebase';
import { Invoice, InvoiceItem, User, Customer } from '../../types';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, X, Clock, Check, RefreshCw, ArrowUpRight, Save, Plus, Printer, Share2, FileText, Phone, Smartphone, Building, ArrowLeft, ArrowRight, MessageCircle, MapPin, Facebook, Edit2, Trash2 } from 'lucide-react';
import BankAccountsFooter from '../BankAccountsFooter';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { sanitizeDocumentStyles, sanitizeElementInlineStyles, cleanOklchInStyleText } from '../../lib/html2canvasHelper';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.501-5.734-1.451L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.018-5.11-2.871-6.968C16.592 1.96 14.118.94 11.482.94c-5.438 0-9.863 4.42-9.866 9.861-.001 1.761.468 3.481 1.357 5.02L1.97 21.03l5.311-1.392c.312.163.626.326.96.48zm11.365-7.6c-.302-.151-1.78-.879-2.057-.98-.277-.101-.48-.151-.68.151-.2.3-.777.979-.952 1.18-.176.201-.351.226-.654.076-.302-.151-1.277-.47-2.434-1.502-.9-.803-1.507-1.795-1.683-2.096-.176-.301-.019-.464.132-.614.136-.135.302-.35.453-.526.151-.176.201-.301.302-.503.101-.201.05-.377-.025-.527-.076-.151-.68-1.637-.932-2.247-.246-.59-.497-.51-.68-.52-.176-.01-.377-.01-.579-.01-.201 0-.528.075-.804.377-.277.301-1.057 1.031-1.057 2.515 0 1.485 1.082 2.918 1.232 3.119.15.2 2.13 3.25 5.16 4.561.721.311 1.284.498 1.72.639.724.23 1.382.197 1.902.12.58-.088 1.78-.728 2.031-.1.431.25.1.48.1.68.01.2.148z"/>
  </svg>
);

function parseEngineerReport(reportStr: string) {
  const s = reportStr || '';
  const idx = s.indexOf(' | ');
  if (idx !== -1) {
    return {
      technical: s.substring(0, idx).trim(),
      outcome: s.substring(idx + 3).trim()
    };
  }
  return {
    technical: s.trim(),
    outcome: ''
  };
}

function getItemStatus(it: any) {
  const statusVal = String(it.status || '').trim();
  const report = (it.engineerReport || '').toLowerCase();
  const notes = (it.technicalNotes || '').toLowerCase();
  const subStatus = (it.subStatus || '').toLowerCase();

  if (
    ['55', '45', '70'].includes(statusVal) || 
    subStatus === 'unrepairable' || 
    report.includes('لا يصلح') || 
    report.includes('لايصلح') || 
    report.includes('unrepairable') ||
    notes.includes('لا يصلح') ||
    notes.includes('لايصلح')
  ) {
    return 'لا يصلح';
  } else if (
    ['50', '60'].includes(statusVal) || 
    subStatus === 'intact' || 
    report.includes('سليم') || 
    report.includes('intact') ||
    notes.includes('سليم')
  ) {
    return 'سليم';
  }
  return 'صيانة';
}

export default function ApprovalAndParts({ user, onBack, initialInvoice }: { user: User, onBack: () => void, initialInvoice?: Invoice | null }) {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [engineersList, setEngineersList] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  
  // Outer double tabs state: 'approval' (انتظار الموافقة من العميل) vs 'parts' (انتظار قطع الغيار)
  const [subTab, setSubTab] = useState<'approval' | 'parts'>('approval');

  // Selection for detailed form (صفحة إجراء انتظار الموافقة والقطع)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [engineerName, setEngineerName] = useState('');
  const [actionItems, setActionItems] = useState<{ id: string, count: number, outcome: 'approved' | 'waiting_parts' | 'refused', reason: string }[]>([]);
  const [currentFormRow, setCurrentFormRow] = useState<{ id: string, count: number | '', outcome: 'approved' | 'waiting_parts' | 'refused', reason: string }>({ id: '', count: 1, outcome: 'approved', reason: 'تمت الموافقة' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // List-page state for cumulative row choices: record of invoiceId -> 'approved' or 'refused' or null
  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'refused' | null>>({});
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({});
  const [loadingForm, setLoadingForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Print-Report states and helpers
  const [showPreviewReport, setShowPreviewReport] = useState(false);
  const [activePrintReportInvoice, setActivePrintReportInvoice] = useState<Invoice | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [shopConfig, setShopConfig] = useState<any>(null);
  const [currentOutput, setCurrentOutput] = useState<any>(null);

  const [scaleFactor, setScaleFactor] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Calculate available width and height for the sheet inside the modal.
      // We reserve ~40px of width padding and ~140px of height padding for the top actions bar.
      const availableWidth = width - 40;
      const availableHeight = height - 140;
      
      const scaleW = availableWidth / 794;
      const scaleH = availableHeight / 1123;
      
      const bestScale = Math.min(scaleW, scaleH);
      // Clamp scale factor between 0.3 and 1
      setScaleFactor(Math.min(1, Math.max(0.3, bestScale)));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch shop config
  useEffect(() => {
    getDoc(doc(db, 'company_details', 'main_details')).then((snap) => {
      if (snap.exists()) {
        setShopConfig(snap.data());
      }
    }).catch(err => {
      console.warn("Could not fetch shop settings:", err);
    });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [subTab, search]);

  const getCustomerPhone = (customerId: string) => {
    const c = customers.find(c => c.id === customerId);
    return c ? (c.phone1 || c.phone2 || '') : '';
  };

  const getCustomerCompany = (customerId: string) => {
    const c = customers.find(c => c.id === customerId);
    return c ? (c.companyName || '---') : '---';
  };

  const incrementPrintCount = async (inv: Invoice) => {
    if (!inv || !inv.id) return;
    try {
      const currentCount = Number(inv.printCount || 0);
      const newCount = currentCount + 1;
      const docRef = doc(db, 'invoices', inv.id);
      await updateDoc(docRef, { printCount: newCount });
      
      // Update local states
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, printCount: newCount } : i));
      if (selectedInvoice && selectedInvoice.id === inv.id) {
        setSelectedInvoice(prev => prev ? { ...prev, printCount: newCount } : null);
      }
      if (activePrintReportInvoice && activePrintReportInvoice.id === inv.id) {
        setActivePrintReportInvoice(prev => prev ? { ...prev, printCount: newCount } : null);
      }
    } catch (e) {
      console.error("Error updating print count in Firestore:", e);
      // Fallback: update local state only
      const currentCount = Number(inv.printCount || 0);
      const newCount = currentCount + 1;
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, printCount: newCount } : i));
      if (selectedInvoice && selectedInvoice.id === inv.id) {
        setSelectedInvoice(prev => prev ? { ...prev, printCount: newCount } : null);
      }
      if (activePrintReportInvoice && activePrintReportInvoice.id === inv.id) {
        setActivePrintReportInvoice(prev => prev ? { ...prev, printCount: newCount } : null);
      }
    }
  };

  const handlePrintDirect = async () => {
    const inv = activePrintReportInvoice || selectedInvoice;
    if (inv) {
      await incrementPrintCount(inv);
    }
    
    setTimeout(() => {
      const originalStyle = document.createElement('style');
      originalStyle.innerHTML = `
        @media print {
          @page { size: auto; margin: 0; }
          body * {
            visibility: hidden !important;
          }
          #print-report-area, #print-report-area * {
            visibility: visible !important;
          }
          #print-report-area {
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
      document.head.appendChild(originalStyle);
      window.print();
      document.head.removeChild(originalStyle);
    }, 150);
  };

  const handleExportPDFAndWhatsApp = async (invoice: Invoice) => {
    await incrementPrintCount(invoice);
    const getConditionRank = (item: any) => {
      const statusLabel = getItemStatus(item);
      if (statusLabel === 'لا يصلح') return 3;
      if (statusLabel === 'سليم') return 2;
      return 1; // صيانة
    };
    const invoiceSpecItems = items
      .filter(it => it.invoiceNumber === invoice.invoiceNumber)
      .sort((a, b) => {
        const typeA = a.deviceType || '';
        const typeB = b.deviceType || '';
        const typeCompare = typeA.localeCompare(typeB, 'ar');
        if (typeCompare !== 0) return typeCompare;

        const nameA = a.deviceName || '';
        const nameB = b.deviceName || '';
        const nameCompare = nameA.localeCompare(nameB, 'ar');
        if (nameCompare !== 0) return nameCompare;

        return getConditionRank(a) - getConditionRank(b);
      });
    const totalInvoiceCost = invoiceSpecItems.reduce((sum, item) => sum + (Number(item.unitCost || item.cost || 0) * (item.quantity || 1)), 0);
    const currency = invoice.currency || 'USD';

    setIsGeneratingPDF(true);
    let restore: (() => void) | null = null;

    try {
      const element = document.getElementById('print-report-area');
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
      
      // Calculate realistic height based on scale width vs height ratio
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
      const filename = `عرض سعر أجهزة_${invoice.customerName}_${formattedDate}.pdf`;

      pdf.save(filename);

      // WhatsApp text composition
      let message = `*عرض سعر صيانة أجهزة فني* 📄\n\n`;
      message += `عزيزي العميل *${invoice.customerName}* المحترم،\n`;
      message += `تجد أدناه ملخص تقرير الفحص وعرض الأسعار صيانة أجهزتكم في الفاتورة رقم *${invoice.invoiceNumber}*:\n\n`;
      message += `- *رقم التقرير:* ${invoice.invoiceNumber}\n`;
      message += `- *القيمة الإجمالية المقدرة:* ${totalInvoiceCost.toLocaleString('en-US')} ${currency}\n\n`;
      message += `*جدول الأجهزة المسجلة بالفحص:*\n`;
      invoiceSpecItems.forEach((item, index) => {
        const statusLabel = getItemStatus(item);
        const reportVal = item.engineerReport || item.technicalNotes || item.faultType || '';
        const parsed = parseEngineerReport(reportVal);
        let displayReport = '-';
        if (statusLabel === 'صيانة') {
          displayReport = parsed.outcome || '-';
        } else {
          displayReport = parsed.technical || statusLabel;
        }
        
        message += `\n_${index + 1}. *${item.deviceType} - ${item.deviceName || ''}*_\n`;
        message += `   • تقرير الفحص: ${displayReport}\n`;
        message += `   • التكلفة: ${(item.cost || item.unitCost || 0).toLocaleString('en-US')} ${currency}\n`;
      });
      message += `\nيسعدنا مراجعتكم وبانتظار الموافقة لبدء الصيانة فورًا. شكرًا لتعاملكم الراقي معنا!`;

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
      console.error('Failed to export PDF & share:', e);
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

  useEffect(() => {
    if (initialInvoice && items.length > 0 && !selectedInvoice) {
      const APPROVAL_STATUSES = ['30', 'awaiting_approval'];
      const PARTS_STATUSES = ['35', 'awaiting_parts'];
      const isParts = initialInvoice.status === '35' || items.some(item => item.invoiceNumber === initialInvoice.invoiceNumber && item.status === '35');
      
      if (isParts) {
        setSubTab('parts');
        const invoiceSpecItems = items.filter(i => i.invoiceNumber === initialInvoice.invoiceNumber && PARTS_STATUSES.includes(i.status));
        setInvoiceItems(invoiceSpecItems);
        const existingTech = invoiceSpecItems.find(i => i.technician)?.technician || '';
        setEngineerName(existingTech);
        if (invoiceSpecItems.length > 0) {
          setActionItems([{ id: invoiceSpecItems[0].id!, count: 1, outcome: 'approved', reason: '' }]);
        }
        setSelectedInvoice(initialInvoice);
      } else {
        setSubTab('approval');
        const invoiceSpecItems = items.filter(i => i.invoiceNumber === initialInvoice.invoiceNumber && APPROVAL_STATUSES.includes(i.status));
        setInvoiceItems(invoiceSpecItems);
        const existingTech = invoiceSpecItems.find(i => i.technician)?.technician || '';
        setEngineerName(existingTech);
        if (invoiceSpecItems.length > 0) {
          setActionItems([{ id: invoiceSpecItems[0].id!, count: 1, outcome: 'approved', reason: '' }]);
        }
        setSelectedInvoice(initialInvoice);
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

  const getCustomerNumber = (customerId: string) => {
    const c = customers.find(c => c.id === customerId);
    return c ? c.customerNumber : '---';
  };

  // Separate current active statuses based on the sub-tab selected
  const APPROVAL_STATUSES = ['30', 'awaiting_approval'];
  const PARTS_STATUSES = ['35', 'awaiting_parts'];
  const activeStatuses = subTab === 'approval' ? APPROVAL_STATUSES : PARTS_STATUSES;

  const pendingInvoices = invoices.filter(inv => {
    return items.some(item => item.invoiceNumber === inv.invoiceNumber && activeStatuses.includes(item.status) && item.quantity > 0);
  }).filter(inv => {
    const customer = customers.find(c => c.id === inv.customerId);
    const customerName = (inv.customerName || '').toLowerCase();
    const customerPhone = customer ? (customer.phone1 || customer.phone2 || '') : '';
    const searchTerm = search.toLowerCase();
    
    return customerName.includes(searchTerm) || 
           customerPhone.includes(search) || // search term can be part of phone as well, search is just a string
           inv.invoiceNumber.includes(search);
  }).sort((a, b) => Number(b.invoiceNumber) - Number(a.invoiceNumber));

  useEffect(() => {
    setDecisions(prev => {
      let changed = false;
      const next = { ...prev };
      pendingInvoices.forEach(inv => {
        if (inv.id && next[inv.id] === undefined) {
          next[inv.id] = 'approved';
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [pendingInvoices]);

  const totalPages = Math.max(1, Math.ceil(pendingInvoices.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentInvoices = pendingInvoices.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  const totalAwaitingDevices = items.filter(i => activeStatuses.includes(i.status)).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const countEligibleDevices = (invoiceNumber: string) => {
    return items.filter(i => i.invoiceNumber === invoiceNumber && activeStatuses.includes(i.status) && i.quantity > 0).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  };

  // Handles toggling a decision on the list page
  const handleToggleDecision = (invoiceId: string, choice: 'approved' | 'refused') => {
    setDecisions(prev => {
      const current = prev[invoiceId];
      return {
        ...prev,
        [invoiceId]: current === choice ? null : choice
      };
    });
  };

  // Click on the action button on the list row (Approval SubTab)
  const handleProcessActionBtn = async (invoice: Invoice) => {
    const listDecision = decisions[invoice.id || ''];
    if (listDecision) {
      // Direct fast action path (either approved or fused completely)
      setRowLoading(prev => ({ ...prev, [invoice.id || '']: true }));
      try {
        const batch = writeBatch(db);
        const invoiceItemsToUpdate = items.filter(i => i.invoiceNumber === invoice.invoiceNumber && APPROVAL_STATUSES.includes(i.status));
        
        invoiceItemsToUpdate.forEach(item => {
          const itemRef = doc(db, 'invoice_items', item.id!);
          if (listDecision === 'approved') {
            // Move device fully to maintenance status '40'
            batch.update(itemRef, {
              status: '40',
              subStatus: 'repairing',
              source: 'approval_approved_bulk',
              updatedAt: serverTimestamp()
            });
          } else if (listDecision === 'refused') {
            // Move device directly to exit status '50'
            batch.update(itemRef, {
              status: '50',
              subStatus: 'refused',
              failureReason: 'لم يوافق العميل',
              source: 'approval_refused_bulk',
              updatedAt: serverTimestamp()
            });
          }
        });

        // Calculate final statuses of all items in this invoice for bulk updates
        let finalBulkInvoiceStatus = '50';
        const finalStatuses: string[] = [];
        items.filter(it => it.invoiceNumber === invoice.invoiceNumber).forEach(it => {
          if (APPROVAL_STATUSES.includes(it.status)) {
            finalStatuses.push(listDecision === 'approved' ? '40' : '50');
          } else {
            finalStatuses.push(it.status);
          }
        });
        
        if (finalStatuses.some(s => s === '70' || s === 'cancelled')) finalBulkInvoiceStatus = '70';
        else if (finalStatuses.some(s => s === '10' || s === 'new')) finalBulkInvoiceStatus = '10';
        else if (finalStatuses.some(s => s === '20')) finalBulkInvoiceStatus = '20';
        else if (finalStatuses.some(s => s === '30' || s === '35' || s === 'awaiting_approval' || s === 'awaiting_parts')) finalBulkInvoiceStatus = '30';
        else if (finalStatuses.some(s => s === '40' || s === 'repairing')) finalBulkInvoiceStatus = '40';

        batch.update(doc(db, 'invoices', invoice.id!), {
          status: finalBulkInvoiceStatus,
          updatedAt: serverTimestamp()
        });

        // Register the activity
        const actionRef = doc(collection(db, 'approval_actions'));
        batch.set(actionRef, {
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName,
          decision: listDecision,
          date: new Date().getTime(),
          userId: user.id || 'unknown',
          userName: user.name || 'System',
          createdAt: serverTimestamp()
        });

        await batch.commit();

        setDecisions(prev => {
          const copy = { ...prev };
          delete copy[invoice.id || ''];
          return copy;
        });
      } catch (err) {
        console.error("Error committing bulk approval decision:", err);
      } finally {
        setRowLoading(prev => ({ ...prev, [invoice.id || '']: false }));
      }
    } else {
      // The Third Way: Open detailed cloning page because no option is chosen
      setSelectedInvoice(invoice);
      const invoiceSpecItems = items.filter(i => i.invoiceNumber === invoice.invoiceNumber && APPROVAL_STATUSES.includes(i.status));
      setInvoiceItems(invoiceSpecItems);
      // Try to pre-fill the name of first items technician if any
      const existingTech = invoiceSpecItems.find(i => i.technician)?.technician || '';
      setEngineerName(existingTech || user.name || '');

      // Initialize actionItems as an empty table and prefill the form
      setActionItems([]);
      setEditingIndex(null);
      if (invoiceSpecItems.length > 0) {
        setCurrentFormRow({ id: invoiceSpecItems[0].id!, count: invoiceSpecItems[0].quantity, outcome: 'approved', reason: 'تمت الموافقة' });
      }
    }
  };

  // Click on the action button on the list row (Parts SubTab)
  const handleProcessPartsAction = async (invoice: Invoice) => {
    const listDecision = decisions[invoice.id || ''];
    if (!listDecision) {
      // Detailed action form for Parts tab
      setSelectedInvoice(invoice);
      const invoiceSpecItems = items.filter(i => i.invoiceNumber === invoice.invoiceNumber && PARTS_STATUSES.includes(i.status));
      setInvoiceItems(invoiceSpecItems);
      // Try to pre-fill the name of first items technician if any
      const existingTech = invoiceSpecItems.find(i => i.technician)?.technician || '';
      setEngineerName(existingTech || user.name || '');

      // Initialize actionItems as an empty table and prefill the form
      setActionItems([]);
      setEditingIndex(null);
      if (invoiceSpecItems.length > 0) {
        setCurrentFormRow({ id: invoiceSpecItems[0].id!, count: invoiceSpecItems[0].quantity, outcome: 'approved', reason: 'توفرت قطع الغيار' });
      }
      return;
    }

    setRowLoading(prev => ({ ...prev, [invoice.id || '']: true }));
    try {
      const batch = writeBatch(db);
      const invoiceItemsToUpdate = items.filter(
        i => i.invoiceNumber === invoice.invoiceNumber && PARTS_STATUSES.includes(i.status)
      );

      invoiceItemsToUpdate.forEach(item => {
        const itemRef = doc(db, 'invoice_items', item.id!);
        if (listDecision === 'approved') {
          // Parts arrived -> Move to maintenance status '40', subStatus 'repairing'
          batch.update(itemRef, {
            status: '40',
            subStatus: 'repairing',
            source: 'parts_available',
            updatedAt: serverTimestamp()
          });
        } else if (listDecision === 'refused') {
          // Parts did not arrive -> Move to exit status '50' with failureReason
          batch.update(itemRef, {
            status: '50',
            subStatus: 'no_parts',
            failureReason: 'لم تتوفر قطع الغيار',
            source: 'parts_not_available',
            updatedAt: serverTimestamp()
          });
        }
      });

      // Calculate final statuses of all items in this invoice for bulk updates
      let finalBulkInvoiceStatus = '50';
      const finalStatuses: string[] = [];
      items.filter(it => it.invoiceNumber === invoice.invoiceNumber).forEach(it => {
        if (PARTS_STATUSES.includes(it.status)) {
          finalStatuses.push(listDecision === 'approved' ? '40' : '50');
        } else {
          finalStatuses.push(it.status);
        }
      });
      
      if (finalStatuses.some(s => s === '70' || s === 'cancelled')) finalBulkInvoiceStatus = '70';
      else if (finalStatuses.some(s => s === '10' || s === 'new')) finalBulkInvoiceStatus = '10';
      else if (finalStatuses.some(s => s === '20')) finalBulkInvoiceStatus = '20';
      else if (finalStatuses.some(s => s === '30' || s === '35' || s === 'awaiting_approval' || s === 'awaiting_parts')) finalBulkInvoiceStatus = '30';
      else if (finalStatuses.some(s => s === '40' || s === 'repairing')) finalBulkInvoiceStatus = '40';

      batch.update(doc(db, 'invoices', invoice.id!), {
        status: finalBulkInvoiceStatus,
        updatedAt: serverTimestamp()
      });

      // Register the activity
      const actionRef = doc(collection(db, 'approval_actions'));
      batch.set(actionRef, {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        decision: listDecision === 'approved' ? 'parts_available' : 'parts_unavailable',
        date: new Date().getTime(),
        userId: user.id || 'unknown',
        userName: user.name || 'System',
        createdAt: serverTimestamp()
      });

      await batch.commit();

      setDecisions(prev => {
        const copy = { ...prev };
        delete copy[invoice.id || ''];
        return copy;
      });
    } catch (err) {
      console.error("Error committing bulk parts decision:", err);
    } finally {
      setRowLoading(prev => ({ ...prev, [invoice.id || '']: false }));
    }
  };

  // Cloned Details Form Navigation helpers (Only applicable for Approval Tab)
  const getAvailableQuantity = (itemId: string, excludeIndex: number = -1) => {
    const originalItem = invoiceItems.find(i => i.id === itemId);
    if (!originalItem) return 0;
    
    // Check how many have been applied to the table
    let usedQuantity = actionItems.reduce((acc, row, idx) => {
      if (idx !== excludeIndex && row.id === itemId) return acc + row.count;
      return acc;
    }, 0);
    
    // Also consider what's currently in the form (if we are NOT editing a row)
    if (excludeIndex === -1 && currentFormRow.id === itemId) {
       // We don't deduct it from available quantity so the user sees proper Max when adding
    }

    return originalItem.quantity - usedQuantity;
  };

  const handleUpdateCurrentForm = (field: string, value: any) => {
    const row = { ...currentFormRow, [field]: value };
    if (field === 'id') {
      const maxCount = getAvailableQuantity(value, -1);
      row.count = maxCount;
    }
    if (field === 'outcome') {
      if (value === 'approved') {
        row.reason = subTab === 'parts' ? 'توفرت قطع الغيار' : 'تمت الموافقة';
      } else if (value === 'waiting_parts') {
        row.reason = subTab === 'parts' ? 'ما زال ينتظر قطع الغيار' : 'انتظار قطع الغيار';
      } else if (value === 'refused') {
        row.reason = subTab === 'parts' ? 'لم تتوفر قطع الغيار' : 'لم يوافق العميل';
      }
    }
    setCurrentFormRow(row);
  };

  const handleApplyFormToTable = () => {
    if (!currentFormRow.id || !currentFormRow.count || isNaN(Number(currentFormRow.count)) || Number(currentFormRow.count) < 1) return;
    const maxAllowed = getAvailableQuantity(currentFormRow.id, editingIndex !== null ? editingIndex : -1);
    if (Number(currentFormRow.count) > maxAllowed) return; // Disallow going over available count

    if (editingIndex !== null) {
      const newItems = [...actionItems];
      newItems[editingIndex] = currentFormRow as any;
      setActionItems(newItems);
      setEditingIndex(null);
    } else {
      setActionItems([...actionItems, currentFormRow as any]);
    }
    
    const newActionItems = editingIndex !== null 
        ? actionItems.map((r, i) => i === editingIndex ? currentFormRow : r)
        : [...actionItems, currentFormRow as any];
        
    // reset form to next available item if any
    const availableItem = invoiceItems.find(it => {
        const used = newActionItems.reduce((acc, row) => row.id === it.id ? acc + row.count : acc, 0);
        return (it.quantity - used) > 0;
    });

    if (availableItem) {
        const used = newActionItems.reduce((acc, row) => row.id === availableItem.id ? acc + row.count : acc, 0);
        const remQty = Math.max(0, availableItem.quantity - used);
        setCurrentFormRow({ id: availableItem.id!, count: remQty, outcome: 'approved', reason: subTab === 'parts' ? 'توفرت قطع الغيار' : 'تمت الموافقة' });
    } else {
        setCurrentFormRow({ id: '', count: '', outcome: 'approved', reason: subTab === 'parts' ? 'توفرت قطع الغيار' : 'تمت الموافقة' });
    }
  };

  const handleCancelForm = () => {
      setEditingIndex(null);
      const availableItem = invoiceItems.find(it => getAvailableQuantity(it.id!, -1) > 0);
      if (availableItem) {
        const remQty = getAvailableQuantity(availableItem.id!, -1);
        setCurrentFormRow({ id: availableItem.id!, count: remQty, outcome: 'approved', reason: subTab === 'parts' ? 'توفرت قطع الغيار' : 'تمت الموافقة' });
      } else {
        setCurrentFormRow({ id: '', count: '', outcome: 'approved', reason: subTab === 'parts' ? 'توفرت قطع الغيار' : 'تمت الموافقة' });
      }
  };

  const handleEditTableRow = (index: number) => {
      setCurrentFormRow(actionItems[index]);
      setEditingIndex(index);
  };

  const handleRemoveFormRow = (index: number) => {
      const updated = actionItems.filter((_, i) => i !== index);
      setActionItems(updated);
      if (editingIndex === index) {
          handleCancelForm();
      }
  };

  // Cloned Form Submission Logic
  const saveApprovalData = async (actionType: 'none' | 'print' | 'whatsapp') => {
    if (!selectedInvoice || actionItems.length === 0 || !engineerName.trim()) return;
    setLoadingForm(true);

    try {
      const batch = writeBatch(db);
      let deductedCost = 0;

      // Track remaining quantities
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

        const rowCount = Number(row.count) || 1;
        let rem = itemRemaining.get(originalItem.id!) || 0;
        let unitCost = originalItem.quantity > 0 ? (Number(originalItem.cost || 0) / originalItem.quantity) : 0;

        let updatedStatus = '40'; // approved -> maintenance
        let subStatus = 'repairing';
        let failureReason: string | null = null;
        let finalEngineerReport = originalItem.engineerReport || '';

        if (row.outcome === 'approved') {
          updatedStatus = '40';
          subStatus = 'repairing';
          // Keep existing inspection engineer report intact
          finalEngineerReport = originalItem.engineerReport || '';
        } else if (row.outcome === 'waiting_parts') {
          updatedStatus = '35'; // remains on this page
          subStatus = 'awaiting_parts';
          // Keep the original diagnostic report intact so it's not lost when parts arrive!
          finalEngineerReport = originalItem.engineerReport || '';
          failureReason = row.reason || 'انتظار قطع الغيار';
        } else if (row.outcome === 'refused') {
          updatedStatus = '50'; // goes directly to exit
          subStatus = subTab === 'parts' ? 'no_parts' : 'refused';
          failureReason = row.reason || (subTab === 'parts' ? 'لم تتوفر قطع الغيار' : 'لم يوافق العميل');
          finalEngineerReport = null;
        }

        let splitItemCost = unitCost * rowCount;
        // Keep the cost field intact so accounts can calculate full list, whilst Customer filters on refused status.
        let deductedCostVal = 0; // do not deduct from base invoice

        if (rem > rowCount) {
          // split quantity
          const splitItemRef = doc(collection(db, 'invoice_items'));
          batch.set(splitItemRef, {
            ...originalItem,
            id: splitItemRef.id,
            quantity: rowCount,
            status: updatedStatus,
            subStatus,
            source: 'approval_details_split',
            cost: splitItemCost,
            failureReason,
            engineerReport: finalEngineerReport,
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
            source: 'approval_details_update',
            quantity: rem,
            cost: splitItemCost,
            failureReason,
            engineerReport: finalEngineerReport,
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

        let updatedStatus = '40';
        if (row.outcome === 'approved') {
          updatedStatus = '40';
        } else if (row.outcome === 'waiting_parts') {
          updatedStatus = '35';
        } else if (row.outcome === 'refused') {
          updatedStatus = '50';
        }
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

      // Record detailed approval action
      const actionRef = doc(collection(db, 'approval_actions'));
      batch.set(actionRef, {
        engineerName,
        actionDate: new Date().getTime(),
        type: subTab === 'parts' ? 'parts_details_form' : 'approval_details_form',
        invoiceNumber: selectedInvoice.invoiceNumber,
        customerName: selectedInvoice.customerName,
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

      // Save user as engineer/technician if we want to save them to the engineers list
      const sanitizedEngName = engineerName.trim().replace(/[\/]/g, '_');
      const engineerRef = doc(db, 'engineers', sanitizedEngName);
      batch.set(engineerRef, { name: engineerName.trim(), updatedAt: serverTimestamp() }, { merge: true });

      await batch.commit();
      
      if (actionType === 'print') {
        setTimeout(handlePrintDirect, 500);
      } else if (actionType === 'whatsapp') {
        await handleExportPDFAndWhatsApp(selectedInvoice);
      }

      setShowPreviewReport(false);
      setSelectedInvoice(null);
    } catch (err) {
      console.error("Error processing customized approval form save:", err);
    } finally {
      setLoadingForm(false);
    }
  };

  const renderPrintReportOverlay = () => {
    if (!activePrintReportInvoice) return null;
    const inv = activePrintReportInvoice;
    
    const getConditionRank = (item: any) => {
      const statusLabel = getItemStatus(item);
      if (statusLabel === 'لا يصلح') return 3;
      if (statusLabel === 'سليم') return 2;
      return 1; // صيانة
    };

    const invItems = items
      .filter(it => it.invoiceNumber === inv.invoiceNumber)
      .sort((a, b) => {
        const typeA = a.deviceType || '';
        const typeB = b.deviceType || '';
        const typeCompare = typeA.localeCompare(typeB, 'ar');
        if (typeCompare !== 0) return typeCompare;
        
        const nameA = a.deviceName || '';
        const nameB = b.deviceName || '';
        const nameCompare = nameA.localeCompare(nameB, 'ar');
        if (nameCompare !== 0) return nameCompare;
        
        return getConditionRank(a) - getConditionRank(b);
      });
      
    const totalCostVal = invItems.reduce((sum, item) => sum + (Number(item.cost || item.unitCost || 0) * (item.quantity || 1)), 0);
    const currencyVal = inv.currency || 'USD';
    const customerPhone = getCustomerPhone(inv.customerId) || 'غير متوفر';
    const customerCompany = getCustomerCompany(inv.customerId) || 'غير متوفر';

    return (
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999] overflow-hidden flex items-center justify-center p-2 sm:p-4 font-sans print:p-0 print:bg-white print:relative" dir="rtl">
        <div className="bg-[#141414] border border-white/10 w-full max-w-4xl max-h-[96vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col print:border-0 print:my-0 print:shadow-none print:bg-white">
          
          {/* Buttons / Controls hidden during print */}
          <div className="flex items-center justify-between p-4 bg-black/50 border-b border-white/5 print:hidden select-none gap-2">
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setActivePrintReportInvoice(null)}
                title="العودة للتعديل"
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <ArrowRight size={20} />
              </button>
              <span className="text-sm font-bold text-white hidden sm:block">معاينة وتجهيز وعرض سعر العميل</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Native Print button */}
              <button 
                type="button"
                onClick={handlePrintDirect}
                title="طباعة فورية"
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-white hover:bg-gray-100 text-black border border-white/20 shadow-md hover:scale-[1.05] active:scale-95 transition-all cursor-pointer"
              >
                <Printer size={20} />
              </button>

              {/* WhatsApp Export button */}
              <button 
                type="button"
                onClick={() => handleExportPDFAndWhatsApp(inv)}
                disabled={isGeneratingPDF}
                title="إرسال للواتس اب وتنزيل PDF"
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-green-600 hover:bg-green-500 text-white shadow-md hover:scale-[1.05] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPDF ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <WhatsAppIcon className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Printable Section Box */}
          <div className="w-full flex-1 overflow-hidden flex items-center justify-center bg-black/45 py-3 px-2 sm:px-4">
            <div style={{ width: `${794 * scaleFactor}px`, height: `${1123 * scaleFactor}px`, position: 'relative', overflow: 'hidden' }}>
              <div 
                id="print-report-area" 
                style={{ 
                  transform: `scale(${scaleFactor})`, 
                  transformOrigin: 'top left',
                  width: '794px',
                  minWidth: '794px',
                  height: '1123px',
                  minHeight: '1123px',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
                className="p-6 bg-white text-gray-900 print:p-0 print:bg-white print:text-black shadow-2xl rounded-sm print:rounded-none print:shadow-none flex flex-col justify-between select-none"
              >
                <div className="absolute left-8 top-1.5 text-[8px] text-gray-400 font-normal select-none opacity-45 font-mono pointer-events-none flex items-center gap-1.5" dir="rtl">
                  <span>تاريخ ووقت الطباعة: {new Date().toLocaleDateString('ar-YE')} {new Date().toLocaleTimeString('ar-YE', { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="border border-gray-400 px-1 rounded font-bold text-[9px] text-gray-500 bg-transparent inline-block font-sans ml-1">
                    {inv.printCount || 0}
                  </span>
                </div>
                <div>
                  {/* Header Layout */}
                  <div className="flex justify-between items-start border-b-2 border-gray-900 pb-2.5 mb-2.5">
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
                        <img src={shopConfig.logoUrl} alt="Logo" className="h-16 max-w-[150px] object-contain mb-1.5" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 border border-dashed border-gray-300 rounded-xl mb-1.5 flex items-center justify-center text-gray-400 text-[10px] font-bold">شعار المحل</div>
                      )}
                      <h1 className="text-lg font-black text-gray-900 tracking-tight border-2 border-gray-900 px-4 py-1.5 rounded-lg inline-block bg-gray-50/50">عرض سعر صيانة أجهزة</h1>
                    </div>

                    {/* Left Corner: Invoice Info */}
                    <div className="text-left flex-1 space-y-1 pt-1 bg-gray-50/50 p-3 rounded-lg border border-gray-200">
                      <div className="text-sm font-bold text-gray-700 flex justify-between gap-4">
                        <span>رقم التقرير:</span>
                        <span className="font-mono text-gray-900">{inv.invoiceNumber}</span>
                      </div>
                      <div className="text-sm font-bold text-gray-700 flex justify-between gap-4">
                        <span>التاريخ:</span>
                        <span className="font-mono text-gray-900">{inv.createdAt ? (function(){ const d = parseDate(inv.createdAt); return !d ? '---' : d.toISOString().slice(0,10).replace(/-/g, '/'); })() : '---'}</span>
                      </div>
                      <div className="text-sm font-bold text-gray-700 flex justify-between gap-4">
                        <span>وقت الإصدار:</span>
                        <span className="font-mono text-gray-900">
                          {inv.createdAt ? (function(){ 
                            const d = parseDate(inv.createdAt); 
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
                  <div className="bg-gray-100 p-2 rounded-lg mb-2 border border-gray-300 flex flex-row items-center justify-start gap-4 px-6 text-xs font-black text-gray-900 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-[10px] text-gray-600 ml-2 whitespace-nowrap">إسم العميل:</span>
                      <span className="text-gray-900 font-black">{inv.customerName}</span>
                    </div>
                    {customerCompany && customerCompany !== '---' && (
                      <div className="border-r border-gray-300 pr-6 flex items-center">
                        <span className="text-[10px] text-gray-600 ml-2 whitespace-nowrap">الجهة:</span>
                        <span className="text-gray-900 font-black">{customerCompany}</span>
                      </div>
                    )}
                    {customerPhone && customerPhone !== '---' && (
                      <div className="border-r border-gray-300 pr-6 flex items-center">
                        <span className="text-[10px] text-gray-600 ml-2 whitespace-nowrap">الجوال:</span>
                        <span className="font-mono text-gray-900" dir="ltr">{customerPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Device Detailed Items Table */}
                  <div className="border border-gray-400 overflow-hidden mb-2 rounded-md">
                    <table className="w-full text-right border-collapse text-xs table-fixed">
                      <thead className="bg-gray-100 text-gray-800 font-bold border-b-2 border-gray-400 text-[11px]">
                        <tr>
                          <th className="px-2 py-1.5 text-center w-[5%] border-l border-gray-400 bg-gray-200/50">م</th>
                          <th className="px-2 py-1.5 border-l border-gray-400 w-[25%]">النوع/الجهاز</th>
                          <th className="px-2 py-1.5 border-l border-gray-400 w-[40%]">تقرير الفحص / نتيجة الصيانة</th>
                          <th className="px-2 py-1.5 text-center border-l border-gray-400 w-[12%]">سعر الوحدة</th>
                          <th className="px-2 py-1.5 text-center border-l border-gray-400 w-[8%]">العدد</th>
                          <th className="px-2 py-1.5 text-center w-[10%] font-black bg-gray-200/50">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300">
                        {invItems.map((item, idx) => {
                          const itemQty = Number(item.quantity || 1);
                          const totalItemCost = Number(item.cost || 0);
                          const unitItemCost = item.unitCost || (itemQty > 0 ? totalItemCost / itemQty : 0);
                          const statusLabel = getItemStatus(item);
                          const reportVal = item.engineerReport || item.technicalNotes || item.faultType || '';
                          const parsed = parseEngineerReport(reportVal);
                          const displayStatusReport = (() => {
                            if (statusLabel === 'صيانة') {
                              return parsed.outcome || '-';
                            } else {
                              return parsed.technical || statusLabel;
                            }
                          })();
                          
                          return (
                            <tr key={item.id} className="even:bg-gray-50/50 text-[11px] leading-none">
                              <td className="px-2 py-1 text-center font-mono font-bold border-l border-gray-400 bg-gray-50 w-[5%]">{idx + 1}</td>
                              <td className="px-2 py-1 font-bold text-gray-900 border-l border-gray-400 w-[25%] max-w-[190px] whitespace-nowrap overflow-hidden text-ellipsis" title={`${item.deviceType} ${item.deviceName ? `- ${item.deviceName}` : ''}`}>
                                {item.deviceType} {item.deviceName ? `- ${item.deviceName}` : ''}
                              </td>
                              <td className="px-2 py-1 text-gray-800 border-l border-gray-400 w-[40%] max-w-[310px] whitespace-nowrap overflow-hidden text-ellipsis" title={displayStatusReport}>
                                <span>{displayStatusReport}</span>
                              </td>
                              <td className="px-2 py-1 text-center font-mono text-gray-900 border-l border-gray-400 w-[12%]">
                                {unitItemCost.toLocaleString('en-US')}
                              </td>
                              <td className="px-2 py-1 text-center font-mono text-gray-900 border-l border-gray-400 w-[8%]">
                                {itemQty}
                              </td>
                              <td className="px-2 py-1 text-center font-mono font-black text-gray-900 bg-gray-50 w-[10%]">
                                {totalItemCost.toLocaleString('en-US')}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Last row for totals */}
                        <tr className="bg-gray-200/60 font-bold border-t-2 border-gray-400 text-[11px]">
                          <td colSpan={4} className="px-2 py-1.5 text-left font-black border-l border-gray-400">الإجمالي</td>
                          <td className="px-2 py-1.5 text-center font-mono font-black border-l border-gray-400">
                            {invItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0)}
                          </td>
                          <td className="px-2 py-1.5 text-center font-mono font-black text-gray-900">
                            {invItems.reduce((sum, item) => sum + Number(item.cost || 0), 0).toLocaleString('en-US')} <span className="text-[10px] font-sans mr-0.5">{currencyVal}</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* العدادات بعد الجدول بشكل صحيح ومرتب */}
                  {(() => {
                    const maintCount = invItems.filter((i: any) => getItemStatus(i) === 'صيانة').reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);
                    const safeCount = invItems.filter((i: any) => getItemStatus(i) === 'سليم').reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);
                    const failedCount = invItems.filter((i: any) => getItemStatus(i) === 'لا يصلح').reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);

                    const smartCounters = [
                      { label: 'صيانة', count: maintCount, bg: 'bg-amber-50 text-amber-700' },
                      { label: 'سليم', count: safeCount, bg: 'bg-emerald-50 text-emerald-700' },
                      { label: 'لا يصلح', count: failedCount, bg: 'bg-rose-50 text-rose-700' }
                    ].filter(c => c.count > 0);

                    if (smartCounters.length === 0) return null;

                    return (
                      <div className="border border-gray-400 rounded-md overflow-hidden bg-gray-50 mb-2 font-cairo w-full text-xs">
                        <div className="bg-gray-100 border-b border-gray-400 p-2 font-black text-center text-gray-700 text-xs">
                          ملخص إحصائيات حالة الأجهزة الفنية
                        </div>
                        <div className="flex divide-x divide-x-reverse divide-gray-400 font-bold">
                          {smartCounters.map((c, i) => (
                            <div key={i} className={`flex-1 p-2 text-center ${c.bg}`}>
                              <div className="text-[10px] opacity-75 font-bold mb-0.5">{c.label}</div>
                              <div className="text-sm font-mono font-black">{c.count}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <div className="border-t-2 border-gray-900 my-3"></div>

                  {/* Footer Notes & Signatures - New Layout */}
                  <div className="flex justify-between items-start text-xs font-bold text-gray-900 leading-loose mb-2 px-4">
                    {/* Right Side */}
                    <div className="text-right space-y-1">
                        <p>نرجو منكم الرد خلال 24 ساعة كحد أقصى</p>
                        <p className="pt-2 font-black">توقيع العميل بالموافقة / ........................................</p>
                    </div>

                    {/* Left Side */}
                    <div className="text-left space-y-1">
                        <p className="pt-2">اسم المهندس المختص / <span className="font-bold border-b border-dashed px-4">................</span> التوقيع /.............</p>
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
        </div>
      </div>
    );
  };

  // SHOW CLONED DETAILED FORM VIEW
  if (selectedInvoice) {
    if (showPreviewReport) {
      const inv = selectedInvoice;
      return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999] overflow-hidden flex items-center justify-center p-2 sm:p-4 font-sans print:p-0 print:bg-white print:relative" dir="rtl">
          <div className="bg-[#141414] border border-white/10 w-full max-w-4xl max-h-[96vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col print:border-0 print:shadow-none print:bg-white">
            <div className="flex items-center justify-between p-4 bg-black/50 border-b border-white/5 print:hidden select-none gap-2 col-span-full">
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => setShowPreviewReport(false)}
                  title="العودة للخلف للمراجعة"
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-900 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <ArrowRight size={20} />
                </button>
                <span className="text-sm font-bold text-white hidden sm:block">معاينة وتجهيز وعرض سعر العميل</span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  disabled={loadingForm}
                  onClick={() => saveApprovalData('none')}
                  title="حفظ وترحيل"
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(5,150,105,0.3)] transition-all cursor-pointer disabled:opacity-50 active:scale-95 hover:scale-105"
                >
                  {loadingForm ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                </button>

                <button 
                  type="button"
                  disabled={loadingForm}
                  onClick={() => saveApprovalData('print')}
                  title="حفظ وطباعة مباشرة"
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95 hover:scale-105"
                >
                  {loadingForm ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />}
                </button>

                <button 
                  type="button"
                  disabled={loadingForm || isGeneratingPDF}
                  onClick={() => saveApprovalData('whatsapp')}
                  title="حفظ وارسال واتس وتنزيل PDF"
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-green-600 hover:bg-green-500 text-white shadow-md transition-all cursor-pointer disabled:opacity-50 active:scale-95 hover:scale-105"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <WhatsAppIcon className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Content to print is simply the active print element or logic for it */}
            <div className="w-full flex-1 overflow-hidden flex items-center justify-center bg-black/45 py-3 px-2 sm:px-4">
              <div style={{ width: `${794 * scaleFactor}px`, height: `${1123 * scaleFactor}px`, position: 'relative', overflow: 'hidden' }}>
                <div 
                  id="print-report-area" 
                  style={{ 
                    transform: `scale(${scaleFactor})`, 
                    transformOrigin: 'top left',
                    width: '794px',
                    minWidth: '794px',
                    height: '1123px',
                    minHeight: '1123px',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                  className="p-6 bg-white text-gray-900 print:p-0 print:bg-white print:text-black shadow-2xl rounded-sm print:rounded-none print:shadow-none flex flex-col justify-between select-none"
                >
                  <div className="absolute left-8 top-1.5 text-[8px] text-gray-400 font-normal select-none opacity-45 font-mono pointer-events-none flex items-center gap-1.5" dir="rtl">
                    <span>تاريخ ووقت الطباعة: {new Date().toLocaleDateString('ar-YE')} {new Date().toLocaleTimeString('ar-YE', { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="border border-gray-400 px-1 rounded font-bold text-[9px] text-gray-500 bg-transparent inline-block font-sans ml-1">
                      {inv.printCount || 0}
                    </span>
                  </div>
                  <div>
                    {/* Header Layout */}
                    <div className="flex justify-between items-start border-b-2 border-gray-900 pb-2.5 mb-2.5">
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
                          <img src={shopConfig.logoUrl} alt="Logo" className="h-16 max-w-[150px] object-contain mb-1.5" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-12 h-12 border border-dashed border-gray-300 rounded-xl mb-1.5 flex items-center justify-center text-gray-400 text-[10px] font-bold">شعار المحل</div>
                        )}
                        <h1 className="text-lg font-black text-gray-900 tracking-tight border-2 border-gray-900 px-4 py-1.5 rounded-lg inline-block bg-gray-50/50">تقرير الحالة والإسناد</h1>
                      </div>

                      {/* Left Corner: Invoice Info */}
                      <div className="text-left flex-1 space-y-1 pt-1 bg-gray-50/50 p-3 rounded-lg border border-gray-200">
                        <div className="text-sm font-bold text-gray-700 flex justify-between gap-4">
                          <span>رقم التقرير:</span>
                          <span className="font-mono text-gray-900">{inv.invoiceNumber}</span>
                        </div>
                        <div className="text-sm font-bold text-gray-700 flex justify-between gap-4">
                          <span>التاريخ:</span>
                          <span className="font-mono text-gray-900">{inv.createdAt ? (function(){ const d = parseDate(inv.createdAt); return !d ? '---' : d.toISOString().slice(0,10).replace(/-/g, '/'); })() : '---'}</span>
                        </div>
                        <div className="text-sm font-bold text-gray-700 flex justify-between gap-4">
                          <span>وقت الإصدار:</span>
                          <span className="font-mono text-gray-900">
                            {inv.createdAt ? (function(){ 
                              const d = parseDate(inv.createdAt); 
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
                    <div className="bg-gray-100 p-2 rounded-lg mb-2 border border-gray-300 flex flex-row items-center justify-start gap-4 px-6 text-xs font-black text-gray-900 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-[10px] text-gray-600 ml-2 whitespace-nowrap">إسم العميل:</span>
                        <span className="text-gray-900 font-black">{inv.customerName}</span>
                      </div>
                      {getCustomerCompany(inv.customerId) && getCustomerCompany(inv.customerId) !== '---' && (
                        <div className="border-r border-gray-300 pr-6 flex items-center">
                          <span className="text-[10px] text-gray-600 ml-2 whitespace-nowrap">الجهة:</span>
                          <span className="text-gray-900 font-black">{getCustomerCompany(inv.customerId)}</span>
                        </div>
                      )}
                      {getCustomerPhone(inv.customerId) && getCustomerPhone(inv.customerId) !== '---' && getCustomerPhone(inv.customerId) !== 'غير متوفر' && (
                        <div className="border-r border-gray-300 pr-6 flex items-center">
                          <span className="text-[10px] text-gray-600 ml-2 whitespace-nowrap">الجوال:</span>
                          <span className="font-mono text-gray-900" dir="ltr">{getCustomerPhone(inv.customerId)}</span>
                        </div>
                      )}
                    </div>

                    {/* Device Detailed Items Table */}
                    <div className="border border-gray-400 overflow-hidden mb-2 rounded-md">
                      <table className="w-full text-right border-collapse text-xs table-fixed">
                        <thead className="bg-gray-100 text-gray-800 font-bold border-b-2 border-gray-400 text-[11px]">
                          <tr>
                            <th className="px-2 py-1.5 text-center w-[5%] border-l border-gray-400 bg-gray-200/50">م</th>
                            <th className="px-2 py-1.5 border-l border-gray-400 w-[25%]">النوع/الجهاز</th>
                            <th className="px-2 py-1.5 border-l border-gray-400 w-[35%]">تقرير الفحص المسجل</th>
                            <th className="px-2 py-1.5 border-l border-gray-400 w-[25%]">تفاصيل الإجراء الحالي</th>
                            <th className="px-2 py-1.5 text-center border-l border-gray-400 w-[10%]">العدد</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300">
                          {actionItems.map((action, idx) => {
                            const it = invoiceItems.find(i => i.id === action.id);
                            if (!it) return null;
                            return (
                              <tr key={idx} className="even:bg-gray-50/50 text-[11px] leading-none">
                                <td className="px-2 py-1 text-center font-mono font-bold border-l border-gray-400 bg-gray-50 w-[5%]">{idx + 1}</td>
                                <td className="px-2 py-1 font-bold text-gray-900 border-l border-gray-400 w-[25%] max-w-[190px] whitespace-nowrap overflow-hidden text-ellipsis" title={`${it.deviceType} ${it.deviceName ? `- ${it.deviceName}` : ''}`}>
                                  {it.deviceType} {it.deviceName ? `- ${it.deviceName}` : ''}
                                </td>
                                <td className="px-2 py-1 text-gray-800 border-l border-gray-400 w-[35%] max-w-[270px] whitespace-nowrap overflow-hidden text-ellipsis" title={(() => {
                                  const reportVal = it.engineerReport || '';
                                  const parsed = parseEngineerReport(reportVal);
                                  return parsed.outcome ? `${parsed.technical} - ${parsed.outcome}` : (reportVal || 'لا يوجد تقرير');
                                })()}>
                                  {(() => {
                                    const reportVal = it.engineerReport || '';
                                    const parsed = parseEngineerReport(reportVal);
                                    return parsed.outcome ? `${parsed.technical} - ${parsed.outcome}` : (reportVal || 'لا يوجد تقرير');
                                  })()}
                                </td>
                                <td className="px-2 py-1 text-gray-800 border-l border-gray-400 w-[25%] max-w-[190px] whitespace-nowrap overflow-hidden text-ellipsis" title={`${action.outcome === 'approved' ? 'موافقة' : action.outcome === 'waiting_parts' ? 'انتظار قطع' : 'رفض'} - ${action.reason || '-'}`}>
                                  <span className="font-bold text-gray-900 ml-1">
                                    ({action.outcome === 'approved' ? 'موافقة' : action.outcome === 'waiting_parts' ? 'انتظار قطع' : 'رفض'})
                                  </span>
                                  {action.reason || '-'}
                                </td>
                                <td className="px-2 py-1 text-center font-mono text-gray-900 border-l border-gray-400 w-[10%]">
                                  {action.count}
                                </td>
                              </tr>
                            );
                          })}
                          {/* Last row for totals */}
                          <tr className="bg-gray-200/60 font-bold border-t-2 border-gray-400 text-[11px]">
                            <td colSpan={4} className="px-2 py-1.5 text-left font-black border-l border-gray-400">إجمالي الأجهزة المشمولة في الإجراء</td>
                            <td className="px-2 py-1.5 text-center font-mono font-black border-l border-gray-400">
                              {actionItems.reduce((acc, row) => acc + row.count, 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <div className="border-t-2 border-gray-900 my-3"></div>

                    {/* Footer Notes & Signatures - New Layout */}
                    <div className="flex justify-between items-start text-xs font-bold text-gray-900 leading-loose mb-2 px-4">
                      {/* Right Side */}
                      <div className="text-right space-y-1">
                          <p>نرجو منكم الرد خلال 24 ساعة كحد أقصى</p>
                          <p className="pt-2 font-black">توقيع العميل بالموافقة / ........................................</p>
                      </div>

                      {/* Left Side */}
                      <div className="text-left space-y-1">
                          <p className="pt-2">اسم المهندس المختص / <span className="font-bold border-b border-dashed px-4">................</span> التوقيع /.............</p>
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

                    <BankAccountsFooter shopConfig={shopConfig} currentOutput={{ output_datetime: new Date() }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    const isQuantityInvalid = !currentFormRow.count || 
                              isNaN(Number(currentFormRow.count)) || 
                              Number(currentFormRow.count) <= 0 || 
                              (currentFormRow.id ? Number(currentFormRow.count) > getAvailableQuantity(currentFormRow.id, editingIndex !== null ? editingIndex : -1) : true);

    const isApplyDisabled = !currentFormRow.id || isQuantityInvalid;

    return (
      <div className="w-full max-w-full overflow-x-hidden space-y-0 pb-32 md:pb-8 text-right font-sans" dir="rtl">
        {/* Unified Navigation Header (Non-sticky, scrolls with the page) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-4 border-b border-white/10 bg-[#141414] gap-4 w-full">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedInvoice(null)} className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-all shrink-0 cursor-pointer">
              <ArrowRight size={18} />
            </button>
            <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2 text-white m-0 p-0">
              <Clock size={18} className="text-amber-500 animate-pulse shrink-0" />
              <span>{subTab === 'parts' ? 'إجراء انتظار قطع الغيار' : 'إجراء انتظار الموافقة والقطع'} - #{selectedInvoice.invoiceNumber}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setActivePrintReportInvoice(selectedInvoice)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Printer size={14} />
              عرض وطباعة التقرير الفني
            </button>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="bg-[#1a1a1a]/90 p-4 sm:p-6 border-b border-white/5 space-y-6 relative overflow-hidden w-full">
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-y-10 -translate-x-10"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
             <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 shrink-0">
                <Clock size={24} />
             </div>
             <div>
               <h3 className="text-lg sm:text-xl font-bold text-white">{selectedInvoice.customerName}</h3>
               <p className="text-xs text-gray-400 mt-1">رقم الهاتف: {getCustomerNumber(selectedInvoice.customerId)}</p>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5 relative z-10 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
              <label className="text-xs text-gray-400 font-bold whitespace-nowrap sm:w-20 shrink-0">المهندس المختص</label>
              <input 
                type="text" 
                value={engineerName}
                list="engineers-list"
                onChange={e => setEngineerName(e.target.value)}
                placeholder="أدخل اسم مسؤول الإجراء فنيًا أو إداريًا"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none transition-all text-right text-white text-sm"
              />
              <datalist id="engineers-list">
                {engineersList.map((eng, idx) => (
                  <option key={idx} value={eng} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Invoice Devices Modern Overview */}
        <div className="p-0 sm:p-4 mt-4 w-full">
          <div className="bg-[#1a1a1a] p-4 sm:p-6 rounded-none sm:rounded-2xl border-y sm:border border-white/5 space-y-4 shadow-lg w-full">
            <h3 className="text-sm font-black text-amber-500 flex items-center gap-2 px-4 sm:px-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
              <span>قائمة أجهزة الفاتورة وقيد الإجراءات ({invoiceItems.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 sm:px-0">
              {invoiceItems.map(it => {
                const available = getAvailableQuantity(it.id!, -1);
                return (
                  <div key={it.id} className="bg-black/30 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3 hover:border-white/10 transition-colors w-full box-border">
                    <div>
                      <div className="font-bold text-white text-sm">
                        {it.deviceType} {it.deviceName ? `- ${it.deviceName}` : ''}
                      </div>
                      <div className="text-xs space-y-1.5 mt-2 text-gray-400">
                        <div className="flex items-start gap-1"><span className="text-amber-500/80 font-bold shrink-0">المشكلة:</span> <span className="text-gray-300">{it.faultType || 'غير مححدد'}</span></div>
                        <div className="flex items-start gap-1"><span className="text-amber-500/80 font-bold shrink-0">الفحص الفني:</span> <span className="text-gray-300">{it.engineerReport || 'لا يوجد تقرير'}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-2">
                      <span className="text-xs text-gray-500">العدد الكلي للفاتورة: <span className="font-mono text-gray-300 font-bold">{it.quantity}</span></span>
                      <span className="text-xs font-black text-amber-400">المتبقى للإجراء: <span className="font-mono text-amber-400 font-bold">{available}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Entry Block */}
        <div className="space-y-4 p-0 sm:p-4 mt-4 w-full">
           <div className="bg-[#1a1a1a] p-4 sm:p-6 rounded-none sm:rounded-2xl border-y sm:border border-white/5 space-y-5 shadow-lg w-full">
             <div className="flex justify-between items-center pb-3 border-b border-white/5 px-4 sm:px-0">
                <h3 className="font-bold text-amber-500 text-sm">البند التفصيلي والموافقة</h3>
             </div>

             <div className="space-y-4 w-full px-4 sm:px-0">
               {/* الجهاز */}
               <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
                 <label className="text-xs text-gray-400 font-bold whitespace-nowrap sm:w-20 shrink-0">الجهاز</label>
                 <select 
                   value={currentFormRow.id}
                   onChange={e => handleUpdateCurrentForm('id', e.target.value)}
                   className="w-full bg-black/40 border border-white/10 px-4 py-3 focus:border-amber-500 outline-none transition-all rounded-xl text-sm text-right text-white truncate box-border cursor-pointer"
                 >
                   <option value="" disabled>اختر الجهاز</option>
                   {invoiceItems.map(it => {
                     const available = getAvailableQuantity(it.id!, -1);
                     if (available <= 0 && currentFormRow.id !== it.id) return null;
                     return <option key={it.id} value={it.id}>{it.deviceType} - {it.deviceName} - المتبقى: {available}</option>;
                   })}
                 </select>
               </div>

               {/* تقرير الفحص */}
               {(() => {
                 const selectedItem = invoiceItems.find(i => i.id === currentFormRow.id);
                 if (!selectedItem) return null;
                 return (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
                      <span className="text-xs text-amber-500 font-bold whitespace-nowrap sm:w-20 shrink-0">تقرير الفحص</span>
                      <div className="w-full bg-black/20 px-4 py-3 border border-white/5 rounded-xl text-sm font-medium text-amber-500 truncate box-border" title={selectedItem.engineerReport}>
                        {selectedItem.engineerReport || 'لا يوجد'}
                      </div>
                    </div>
                 );
               })()}

               {/* تفاصيل الرد */}
               <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-full">
                 <label className="text-xs text-gray-400 font-bold whitespace-nowrap sm:w-20 shrink-0">تفاصيل الرد</label>
                 <input 
                   type="text"
                   value={currentFormRow.reason}
                   onFocus={(e) => {
                     e.target.select();
                     e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                   }}
                   onClick={(e) => {
                     e.currentTarget.select();
                   }}
                   onChange={e => handleUpdateCurrentForm('reason', e.target.value)}
                   placeholder="الرجاء كتابة تفاصيل الرد"
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-amber-500 outline-none transition-all text-sm text-right text-white box-border"
                 />
               </div>
             </div>

             {/* Count + Decisive Action Outcomes */}
             <div className="pt-4 border-t border-white/5 space-y-4 px-4 sm:px-0">
                {/* Count Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/30 p-4 rounded-xl border border-white/5 w-full box-border">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-300 font-bold whitespace-nowrap shrink-0">العدد المحدد للإجراء:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const current = Number(currentFormRow.count) || 1;
                          if (current > 1) handleUpdateCurrentForm('count', current - 1);
                        }}
                        className="w-9 h-9 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center font-bold text-lg border border-white/10 transition-colors cursor-pointer select-none"
                      >
                        -
                      </button>
                      <input 
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={currentFormRow.count}
                        onFocus={e => e.target.select()}
                        onKeyDown={e => {
                          if (['-', '+', '.', 'e', 'E', ',', '`'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onChange={e => {
                          let cleanValStr = e.target.value.replace(/[^0-9]/g, '');
                          if (cleanValStr === '') {
                            handleUpdateCurrentForm('count', '');
                            return;
                          }
                          let val = parseInt(cleanValStr, 10);
                          if (isNaN(val)) {
                            handleUpdateCurrentForm('count', '');
                            return;
                          }
                          const max = currentFormRow.id ? getAvailableQuantity(currentFormRow.id, editingIndex !== null ? editingIndex : -1) : 1;
                          if (val > max) {
                            val = max;
                          }
                          if (val < 1) {
                            val = 1;
                          }
                          handleUpdateCurrentForm('count', val);
                        }}
                        onBlur={() => {
                          let val = currentFormRow.count;
                          const max = currentFormRow.id ? getAvailableQuantity(currentFormRow.id, editingIndex !== null ? editingIndex : -1) : 1;
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
                          handleUpdateCurrentForm('count', val);
                        }}
                        className="w-14 h-9 bg-black/40 border border-white/10 text-center rounded-lg text-xs font-bold text-white font-mono focus:border-amber-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const current = Number(currentFormRow.count) || 1;
                          const max = currentFormRow.id ? getAvailableQuantity(currentFormRow.id, editingIndex !== null ? editingIndex : -1) : 1;
                          if (current < max) handleUpdateCurrentForm('count', current + 1);
                        }}
                        className="w-9 h-9 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center justify-center font-bold text-lg border border-white/10 transition-colors cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {currentFormRow.id && (
                    <span className="text-xs text-gray-400">
                      الحد الأقصى المتاح حاليًا لهذا الجهاز: <span className="font-mono text-amber-500 font-bold">{getAvailableQuantity(currentFormRow.id, editingIndex !== null ? editingIndex : -1)}</span>
                    </span>
                  )}
                </div>

                {/* Action Outcome Button Grid */}
                <div className="space-y-2">
                   <span className="text-xs text-gray-400 font-bold block mb-1">حدد الإجراء المتخذ:</span>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                     {/* Approved Option Card */}
                     <button
                       type="button"
                       onClick={() => handleUpdateCurrentForm('outcome', 'approved')}
                       className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-1 cursor-pointer select-none ${
                         currentFormRow.outcome === 'approved'
                           ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                           : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                       }`}
                     >
                       <span className="text-xs font-bold font-sans">
                         {subTab === 'parts' ? 'وصول قطع الغيار' : 'تم موافقة العميل'}
                       </span>
                       <span className="text-[10px] text-gray-400 font-normal">
                         {subTab === 'parts' ? 'وصلت قطع الغيار (إلى الصيانة)' : 'تم موافقة العميل على الإصلاح'}
                       </span>
                     </button>

                     {/* Refused Option Card */}
                     <button
                       type="button"
                       onClick={() => handleUpdateCurrentForm('outcome', 'refused')}
                       className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-1 cursor-pointer select-none ${
                         currentFormRow.outcome === 'refused'
                           ? 'bg-rose-500/10 border-rose-500 text-rose-400'
                           : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                       }`}
                     >
                       <span className="text-xs font-bold font-sans">
                         {subTab === 'parts' ? 'عدم توفر قطع' : 'لم يوافق العميل'}
                       </span>
                       <span className="text-[10px] text-gray-400 font-normal">
                         {subTab === 'parts' ? 'لم تتوفر قطع الغيار (إلى الخروج)' : 'رفض العميل الإصلاح'}
                       </span>
                     </button>

                     {/* Waiting Parts Option Card */}
                     <button
                       type="button"
                       onClick={() => handleUpdateCurrentForm('outcome', 'waiting_parts')}
                       className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-1 cursor-pointer select-none ${
                         currentFormRow.outcome === 'waiting_parts'
                           ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                           : 'bg-black/20 border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                       }`}
                     >
                       <span className="text-xs font-bold font-sans">
                         {subTab === 'parts' ? 'ما زال ينتظر قطع الغيار' : 'انتظار قطع الغيار'}
                       </span>
                       <span className="text-[10px] text-gray-400 font-normal">
                         {subTab === 'parts' ? 'ما زال ينتظر قطع الغيار' : 'تحتاج قطع غيار'}
                       </span>
                     </button>
                   </div>
                </div>
             </div>
             
             {/* Form Action Buttons (Add, Update, Cancel) */}
             <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 px-4 sm:px-0">
               <button
                 onClick={handleCancelForm}
                 className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
               >
                 إلغاء
               </button>
               {editingIndex !== null ? (
                 <button
                   onClick={handleApplyFormToTable}
                   disabled={isApplyDisabled}
                   className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-black rounded-xl text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                 >
                   تعديل البند
                 </button>
               ) : (
                 <button
                   onClick={handleApplyFormToTable}
                   disabled={isApplyDisabled}
                   className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl text-sm font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                 >
                   إضافة الجهاز
                 </button>
               )}
             </div>

           </div>
        </div>

        {/* Temporary Table / Action Items */}
        {actionItems.length > 0 && (
          <div className="space-y-4 p-0 sm:p-4 mt-4 w-full">
            <h3 className="text-sm font-bold text-white mb-2 px-4 sm:px-0">الأجهزة المضافة للإجراء ({actionItems.length}):</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4 sm:px-0">
              {actionItems.map((row, idx) => {
                const it = invoiceItems.find(i => i.id === row.id);
                return (
                  <div key={idx} className="bg-[#1e1e1e] border-y sm:border border-white/10 p-4 sm:p-5 rounded-none sm:rounded-2xl flex flex-col justify-between gap-4 shadow-xl hover:border-amber-500/20 transition-all w-full box-border">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-white text-base leading-snug">
                          {it ? `${it.deviceType} - ${it.deviceName}` : 'جهاز غير معروف'}
                        </div>
                        <div className="shrink-0">
                          {row.outcome === 'approved' ? (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {subTab === 'parts' ? 'وصول قطع' : 'تم موافقة العميل'}
                            </span>
                          ) : row.outcome === 'waiting_parts' ? (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              انتظار قطع
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              {subTab === 'parts' ? 'عدم توفر قطع' : 'لم يوافق العميل'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs space-y-2 text-gray-400 bg-black/20 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between">
                          <span className="text-gray-500">تقرير الفحص:</span>
                          <span className="text-gray-200 font-medium">{it?.engineerReport || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">تفاصيل الرد:</span>
                          <span className="text-gray-200 font-medium">{row.reason || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-white/5 pt-1.5 mt-1.5">
                          <span className="text-gray-500">العدد المضاف للإجراء:</span>
                          <span className="text-white font-mono font-black text-sm bg-white/5 px-2.5 py-0.5 rounded-md">{row.count}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                      <button 
                        type="button"
                        onClick={() => handleEditTableRow(idx)} 
                        className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5"
                      >
                        <Edit2 size={14} />
                        تعديل البند
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleRemoveFormRow(idx)} 
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5"
                      >
                        <Trash2 size={14} />
                        حذف
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form CTA Buttons */}
        <div className="p-0 sm:p-4 mt-6 mb-16 w-full">
           <button 
             onClick={() => {
               if (actionItems.length === 0) {
                 alert("الرجاء الضغط على زر 'إضافة الجهاز' أولاً لإدراج البند في قائمة الإجراءات قبل المعاينة.");
                 return;
               }
               if (!engineerName.trim()) {
                 alert("الرجاء إدخال اسم المهندس المسؤول عن الإجراء أولاً.");
                 return;
               }
               setShowPreviewReport(true);
             }}
             disabled={loadingForm}
             className="w-full bg-amber-500 hover:bg-amber-600 text-black py-4 font-black transition-all flex items-center justify-center gap-2 rounded-none sm:rounded-2xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
           >
             <Search size={20} className="text-black" />
             معاينة الحالة والإسناد
           </button>
        </div>
        {renderPrintReportOverlay()}
      </div>
    );
  }

  // STANDARD LIST VIEW: "صفحة انتظار الموافقة والقطع" (Dual View via subTabs)
  const countApprovalDevices = items.filter(i => ['30', 'awaiting_approval'].includes(i.status) && i.quantity > 0).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const countPartsDevices = items.filter(i => ['35', 'awaiting_parts'].includes(i.status) && i.quantity > 0).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);

  return (
    <div className="w-full space-y-6 pb-20 text-right font-sans pt-4" dir="rtl">
      {/* Large Orange/Amber Dual Stats Counter Card */}
      <div className="px-0">
        <div className="w-full bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 text-white p-6 rounded-none md:rounded-[2rem] shadow-lg relative overflow-hidden">
          {/* Faint Background Icon */}
          <div className="absolute top-1/2 left-6 -translate-y-1/2 opacity-10 pointer-events-none">
            <Clock size={160} />
          </div>

          <div className="relative z-10 grid grid-cols-2 divide-x divide-white/15 rtl:divide-x-reverse">
            {/* Clickable section 1: Waiting for Customer Approval */}
            <button
              onClick={() => {
                setSubTab('approval');
                setSearch('');
                setDecisions({});
              }}
              className={`flex flex-col items-center justify-center py-4 px-2 transition-all rounded-2xl relative cursor-pointer ${
                subTab === 'approval' 
                  ? 'bg-white/15 shadow-inner scale-[1.02]' 
                  : 'hover:bg-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              {subTab === 'approval' && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              )}
              <span className="text-3xl sm:text-5xl font-black font-mono tracking-wider drop-shadow-md">{countApprovalDevices}</span>
              <span className="text-xs sm:text-sm font-bold font-cairo mt-2 text-amber-100">بانتظار موافقة العميل</span>
              <span className="text-[10px] text-amber-200 mt-1 opacity-70">الموافقة على تكلفة الصيانة</span>
            </button>

            {/* Clickable section 2: Waiting for Spare Parts */}
            <button
              onClick={() => {
                setSubTab('parts');
                setSearch('');
                setDecisions({});
              }}
              className={`flex flex-col items-center justify-center py-4 px-2 transition-all rounded-2xl relative cursor-pointer ${
                subTab === 'parts' 
                  ? 'bg-white/15 shadow-inner scale-[1.02]' 
                  : 'hover:bg-white/5 opacity-80 hover:opacity-100'
              }`}
            >
              {subTab === 'parts' && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
              )}
              <span className="text-3xl sm:text-5xl font-black font-mono tracking-wider drop-shadow-md">{countPartsDevices}</span>
              <span className="text-xs sm:text-sm font-bold font-cairo mt-2 text-amber-100">بانتظار قطع الغيار</span>
              <span className="text-[10px] text-amber-200 mt-1 opacity-70">تأمين المواد اللازمة</span>
            </button>
          </div>
        </div>
      </div>



      {/* Search Input */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between px-4 md:px-8">
        <div className="relative w-full sm:w-80 font-sans">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="البحث باسم العميل أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl pr-12 pl-4 py-3 focus:border-amber-500 outline-none transition-all text-sm text-right text-white"
          />
        </div>
      </div>

      {/* Main Table - Full Width with zero horizontal margins/borders */}
      <div className="bg-[#1a1a1a] border-y border-white/5 overflow-hidden shadow-2xl w-full">
        <div className="overflow-hidden w-full">
          <table className="w-full text-right border-collapse select-none table-fixed sm:table-auto">
            <thead className="bg-black/40 text-gray-400 text-[8px] sm:text-[10px] uppercase tracking-wider border-b border-white/5 text-right">
              <tr>
                <th className="px-1 py-3 font-bold text-center w-[12%] sm:w-20">رقم الفاتورة</th>
                <th className="px-1 py-3 font-bold text-right w-[35%] sm:auto">اسم العميل</th>
                <th className="px-0.5 py-3 font-bold text-center w-[15%] sm:w-24">
                  <span className="hidden sm:inline">{subTab === 'approval' ? 'عدد الأجهزة' : 'الأجهزة المتبقية'}</span>
                  <span className="sm:hidden">{subTab === 'approval' ? 'العدد' : 'متبقي'}</span>
                </th>
                <th className="px-0.5 py-3 font-bold text-center w-[12%] sm:w-20">
                  <span className="hidden sm:inline">{subTab === 'approval' ? 'تمت الموافقة' : 'توفرت القطع'}</span>
                  <span className="sm:hidden">موافق</span>
                </th>
                <th className="px-0.5 py-3 font-bold text-center w-[12%] sm:w-20">
                  <span className="hidden sm:inline">{subTab === 'approval' ? 'لم يوافق' : 'لم تتوفر'}</span>
                  <span className="sm:hidden">رفض</span>
                </th>
                <th className="px-1 py-3 font-bold text-center w-[14%] sm:w-24">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[9px] sm:text-xs">
              {currentInvoices.map(invoice => {
                const currentDecision = decisions[invoice.id || ''];
                const isLoading = rowLoading[invoice.id || ''];
                
                return (
                  <tr key={invoice.id} className="hover:bg-white/5 transition-colors duration-150">
                    <td className="px-1 py-3 font-mono text-white font-bold text-center">{invoice.invoiceNumber}</td>
                    <td className="px-1 py-3 font-bold text-white text-right">
                      <div className="truncate">
                        {invoice.customerName}
                      </div>
                    </td>
                    <td className="px-0.5 py-3 font-mono text-amber-400 font-bold text-center">{countEligibleDevices(invoice.invoiceNumber)}</td>
                    
                    {/* Circle choice column "تمت الموافقة" / "توفرت القطع" */}
                    <td className="px-0.5 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleDecision(invoice.id!, 'approved')}
                        disabled={isLoading}
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center mx-auto transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                          currentDecision === 'approved'
                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                            : 'border-gray-400 dark:border-white/20 text-transparent hover:border-emerald-500/50 hover:bg-emerald-500/10'
                        }`}
                      >
                        <Check size={14} className={currentDecision === 'approved' ? 'opacity-100 text-white' : 'opacity-0'} />
                      </button>
                    </td>

                    {/* Circle choice column "لم يوافق" / "لم تتوفر" */}
                    <td className="px-0.5 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleDecision(invoice.id!, 'refused')}
                        disabled={isLoading}
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center mx-auto transition-all duration-200 cursor-pointer disabled:opacity-50 ${
                          currentDecision === 'refused'
                            ? 'border-red-500 bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                            : 'border-gray-400 dark:border-white/20 text-transparent hover:border-red-500/50 hover:bg-red-500/10'
                        }`}
                      >
                        <Check size={14} className={currentDecision === 'refused' ? 'opacity-100 text-white' : 'opacity-0'} />
                      </button>
                    </td>

                    {/* Action button */}
                    <td className="px-1 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 sm:gap-4">
                        <button 
                          type="button"
                          onClick={() => setActivePrintReportInvoice(invoice)}
                          title="عرض وطباعة تقرير الفحص الفني وعرض الأسعار"
                          className="p-1.5 rounded-lg bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white transition-all cursor-pointer border border-purple-500/20"
                        >
                          <Printer size={14} />
                        </button>
                        <button 
                          onClick={() => subTab === 'approval' ? handleProcessActionBtn(invoice) : handleProcessPartsAction(invoice)}
                          disabled={isLoading}
                          className="px-1 py-0.5 sm:px-1.5 sm:py-1 rounded-lg text-[7px] sm:text-[9px] font-black bg-amber-500 hover:bg-amber-600 text-black shadow-md transition-all duration-200 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <div className="w-2 h-2 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          ) : (
                            'تأكيد'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pendingInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {subTab === 'approval' 
                      ? 'لا توجد فواتير أو أجهزة بانتظار الموافقة حالياً.' 
                      : 'لا توجد فواتير أو أجهزة بانتظار قطع الغيار حالياً.'}
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
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
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

      {renderPrintReportOverlay()}
    </div>
  );
}
