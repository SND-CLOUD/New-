import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=3617eb90"; const Fragment = __vite__cjsImport0_react_jsxDevRuntime["Fragment"]; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
import { CustomerAutocomplete } from "/src/components/CustomerAutocomplete.tsx";
import AddCustomerModal from "/src/components/AddCustomerModal.tsx";
import { sharePdfFile, openWhatsApp, sendUniversalReminder } from "/src/lib/shareHelper.ts";
import PrintPreviewOverlay from "/src/components/PrintPreviewOverlay.tsx";
import __vite__cjsImport5_react from "/node_modules/.vite/deps/react.js?v=3617eb90"; const useState = __vite__cjsImport5_react["useState"]; const useEffect = __vite__cjsImport5_react["useEffect"];
import { motion } from "/node_modules/.vite/deps/motion_react.js?v=3617eb90";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp } from "/src/firebase.ts";
import { db } from "/src/firebase.ts";
import { User, ArrowRight, LogOut, Search, FileText, ChevronLeft, Eye, X, Users, ArrowUpDown, Edit2, Check, Printer, UserPlus, MessageCircle } from "/node_modules/.vite/deps/lucide-react.js?v=3617eb90";
import { useBackHandler } from "/src/hooks/useBackHandler.ts";
import { usePermissions } from "/src/hooks/usePermissions.ts";
import { useTranslation } from "/node_modules/.vite/deps/react-i18next.js?v=3617eb90";
import jsPDF from "/node_modules/.vite/deps/jspdf.js?v=3617eb90";
import * as htmlToImage from "/node_modules/.vite/deps/html-to-image.js?v=3617eb90";
import { Filesystem, Directory } from "/node_modules/.vite/deps/@capacitor_filesystem.js?v=3617eb90";
import { parseDate, formatDateTime, parseTxDate } from "/src/lib/dateUtils.ts";
const WhatsAppIcon = (props) => /* @__PURE__ */ jsxDEV("svg", { viewBox: "0 0 24 24", fill: "currentColor", ...props, children: /* @__PURE__ */ jsxDEV("path", { d: "M12.012 2c-5.506 0-9.978 4.471-9.978 9.978 0 1.764.459 3.42 1.258 4.873L2 22l5.312-1.393c1.405.766 3 1.18 4.7 1.18 5.506 0 9.978-4.472 9.978-9.978C21.99 6.471 17.518 2 12.012 2zm6.331 14.161c-.244.686-1.22 1.258-1.687 1.341-.468.084-.935.152-2.903-.631-2.479-.982-4.053-3.522-4.175-3.69-.122-.167-.991-1.319-.991-2.518 0-1.199.631-1.787.854-2.028.223-.241.488-.302.65-.302.162 0 .325.003.467.01.147.007.345-.057.545.421.203.488.691 1.687.752 1.809.061.122.102.264.02.427-.081.162-.122.264-.244.407-.122.142-.256.319-.366.427-.122.122-.249.255-.107.498.142.244.631 1.036 1.354 1.678.932.827 1.714 1.082 1.957 1.204.244.122.386.102.528-.061.142-.162.61-2.008.772-2.313.162-.305.325-.244.548-.162.223.081 1.423.671 1.667.793.244.122.406.183.467.284.061.104.061.59-.183 1.277z" }, void 0, false, {
  fileName: "/app/applet/src/components/Customers.tsx",
  lineNumber: 23,
  columnNumber: 5
}, this) }, void 0, false, {
  fileName: "/app/applet/src/components/Customers.tsx",
  lineNumber: 22,
  columnNumber: 3
}, this);
export default function Customers({ user, shopConfig, onBack }) {
  const { t } = useTranslation();
  const { hasPermission, canAdd, canEdit, canDelete, canPrint } = usePermissions(user, "customers");
  if (!hasPermission("view")) {
    return /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col items-center justify-center h-full p-8 text-center space-y-4", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500", children: /* @__PURE__ */ jsxDEV(Users, { size: 32 }, void 0, false, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 35,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 34,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("h2", { className: "text-xl font-bold text-white", children: "عذراً، ليس لديك صلاحية الوصول" }, void 0, false, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 37,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-gray-400 max-w-md", children: "يرجى التواصل مع المسؤول للحصول على الصلاحيات اللازمة لعرض بيانات العملاء." }, void 0, false, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 38,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: onBack,
          className: "p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 flex items-center justify-center",
          title: "خروج للرئيسية",
          children: /* @__PURE__ */ jsxDEV(LogOut, { size: 20, className: "rotate-180" }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 44,
            columnNumber: 11
          }, this)
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 39,
          columnNumber: 9
        },
        this
      )
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/Customers.tsx",
      lineNumber: 33,
      columnNumber: 7
    }, this);
  }
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [currentOutput, setCurrentOutput] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeCustomerTab, setActiveCustomerTab] = useState("menu");
  const [showPreview, setShowPreview] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logSearch, setLogSearch] = useState("");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLogInvoice, setSelectedLogInvoice] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [isAddingInProcess, setIsAddingInProcess] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCompanyName, setEditCompanyName] = useState("");
  const [editPhone1, setEditPhone1] = useState("");
  const [editPhone2, setEditPhone2] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editHasWhatsapp, setEditHasWhatsapp] = useState(true);
  const [editLiabilityCurrency, setEditLiabilityCurrency] = useState("USD");
  const [updatePastTransactions, setUpdatePastTransactions] = useState(true);
  const [isSavingInProcess, setIsSavingInProcess] = useState(false);
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
    if (activeCustomerTab !== "menu") {
      setActiveCustomerTab("menu");
    } else {
      setSelectedCustomer(null);
    }
  });
  const nextCustomerNumber = Math.max(0, ...customers.map((c) => Number(c.customerNumber) || 0)) + 1;
  const getArabicCurrencyName = (currCode) => {
    if (!currCode) return "دولار";
    if (currCode.toUpperCase() === "USD") return "دولار";
    if (currCode.toUpperCase() === "YER") return "ريال يمني";
    if (currCode.toUpperCase().includes("USD") && currCode.toUpperCase().includes("YER")) return "دولار / ريال يمني";
    return currCode;
  };
  const handleAddCustomer = async () => {
  };
  const onCustomerAdded = (customer) => {
    selectCustomer(customer);
    setShowAddCustomer(false);
  };
  useEffect(() => {
    const unsubscribeCustomers = onSnapshot(query(collection(db, "customers"), orderBy("name", "asc")), (snapshot) => {
      setCustomers(snapshot.docs.map((doc2) => ({ id: doc2.id, ...doc2.data() })));
    });
    const unsubscribeInvoices = onSnapshot(collection(db, "invoices"), (snapshot) => {
      setInvoices(snapshot.docs.map((doc2) => ({ id: doc2.id, ...doc2.data() })));
    });
    const unsubscribeItems = onSnapshot(collection(db, "invoice_items"), (snapshot) => {
      setItems(snapshot.docs.map((doc2) => ({ id: doc2.id, ...doc2.data() })));
    });
    const unsubscribeTransactions = onSnapshot(collection(db, "vault_transactions"), (snapshot) => {
      setTransactions(snapshot.docs.map((doc2) => ({ id: doc2.id, ...doc2.data() })));
    });
    return () => {
      unsubscribeCustomers();
      unsubscribeInvoices();
      unsubscribeItems();
      unsubscribeTransactions();
    };
  }, []);
  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setActiveCustomerTab("menu");
    setSearch(customer.name);
    setShowPreview(false);
    setIsEditingMode(false);
    setEditPhone1(customer.phone1 || "");
    setEditPhone2(customer.phone2 || "");
    setEditEmail(customer.email || "");
    setEditNotes(customer.notes || "");
    setEditHasWhatsapp(customer.hasWhatsapp !== void 0 ? customer.hasWhatsapp : true);
    setEditLiabilityCurrency(customer.liabilityCurrency || "USD");
  };
  const handleUpdateCustomer = async () => {
    if (!selectedCustomer || !selectedCustomer.id) return;
    const isEditFormValid = editName.trim() !== "" && editPhone1.trim() !== "";
    if (!isEditFormValid) return;
    setIsSavingInProcess(true);
    try {
      const customerRef = doc(db, "customers", selectedCustomer.id);
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
        const { ProviderFactory } = await import("/src/data/ProviderFactory.ts");
        const provider = ProviderFactory.getProvider();
        await provider.updateDoc("customers", selectedCustomer.id, {
          ...updatedFields,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        if (updatePastTransactions && (editName.trim() !== selectedCustomer.name || editPhone1.trim() !== selectedCustomer.phone1)) {
          const invoicesSnap = await provider.getDocs("invoices");
          const invoices2 = invoicesSnap.docs ? invoicesSnap.docs.map((d) => d.data()) : [];
          for (const inv of invoices2) {
            if (inv.customerId === selectedCustomer.id) {
              const invUpdates = {};
              if (editName.trim() !== selectedCustomer.name) invUpdates.customerName = editName.trim();
              if (editPhone1.trim() !== selectedCustomer.phone1) invUpdates.customerPhone = editPhone1.trim();
              await provider.updateDoc("invoices", inv.id, invUpdates);
            }
          }
          const txsSnap = await provider.getDocs("vault_transactions");
          const txs = txsSnap.docs ? txsSnap.docs.map((d) => d.data()) : [];
          for (const tx of txs) {
            if (tx.customerId === selectedCustomer.id && editName.trim() !== selectedCustomer.name) {
              await provider.updateDoc("vault_transactions", tx.id, { customerName: editName.trim() });
            }
          }
        }
      } catch (err) {
        console.warn("Could not update local db directly", err);
      }
      await updateDoc(customerRef, updatedFields);
      const updatedCust = {
        ...selectedCustomer,
        ...updatedFields
      };
      setSelectedCustomer(updatedCust);
      setCustomers((prev) => prev.map((c) => c.id === selectedCustomer.id ? updatedCust : c));
      setIsEditingMode(false);
    } catch (err) {
      console.error("Error updating customer:", err);
    } finally {
      setIsSavingInProcess(false);
    }
  };
  const getInvoiceActualCost = (invoiceItems) => {
    return invoiceItems.reduce((sum, item) => {
      if (["10", "20", "25", "30", "35", "40", "new", "in_progress", "awaiting_parts", "awaiting_approval", "repairing"].includes(item.status)) {
        return sum;
      }
      const sub = (item.subStatus || "").toLowerCase();
      const status = (item.status || "").toLowerCase();
      const src = (item.source || "").toLowerCase();
      const isExcluded = ["70", "cancelled", "refused", "unrepairable", "parts_not_available", "failed"].includes(status) || ["cancelled", "refused", "unrepairable", "parts_not_available", "failed"].includes(sub) || ["cancelled", "refused", "unrepairable", "parts_not_available", "failed"].includes(src) || item.failureReason !== null && item.failureReason !== void 0 && item.failureReason !== "";
      if (isExcluded) {
        return sum;
      }
      return sum + (Number(item.cost) || 0);
    }, 0);
  };
  const getCustomerCurrencyLabel = (customerId) => {
    const customerInvs = invoices.filter((inv) => inv.customerId === customerId);
    const currencies = Array.from(new Set(customerInvs.map((inv) => inv.currency || "USD")));
    if (currencies.length === 0) return "USD";
    return currencies.join(" / ");
  };
  const getCustomerRemainingDevices = (customerId) => {
    return items.filter(
      (it) => (it.customerId === customerId || invoices.some((inv) => inv.customerId === customerId && inv.invoiceNumber === it.invoiceNumber)) && it.status !== "delivered" && it.status !== "60"
    ).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  };
  const getCustomerTotalCost = (customerId) => {
    const customerInvs = invoices.filter((inv) => inv.customerId === customerId);
    return customerInvs.reduce((sum, inv) => {
      const invItems = items.filter((it) => it.invoiceNumber === inv.invoiceNumber);
      return sum + getInvoiceActualCost(invItems);
    }, 0);
  };
  const getCustomerTotalPaid = (customerId) => {
    const separateReceipts = transactions.filter((tx) => tx.customerId === customerId && tx.type === "receipt" && !tx.isReversed && !tx.isReversal && tx.status !== "reversed" && tx.status !== "reversal").reduce((sum, tx) => sum + (tx.liabilityAmount || Math.abs(Number(tx.amount || 0))), 0);
    const separatePayments = transactions.filter((tx) => tx.customerId === customerId && tx.type === "payment" && !tx.isReversed && !tx.isReversal && tx.status !== "reversed" && tx.status !== "reversal").reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);
    return separateReceipts - separatePayments;
  };
  const getCustomerOutstandingAmount = (customerId) => {
    return Math.max(0, getCustomerTotalCost(customerId) - getCustomerTotalPaid(customerId));
  };
  const getStatementEntries = (customerId) => {
    const entries = [];
    const customerInvs = invoices.filter((inv) => inv.customerId === customerId);
    customerInvs.forEach((inv) => {
      const invItems = items.filter((it) => it.invoiceNumber === inv.invoiceNumber);
      const actualCost = getInvoiceActualCost(invItems);
      const invDate = parseDate(inv.createdAt);
      entries.push({
        id: `inv-cost-${inv.id}`,
        date: invDate,
        type: "فاتورة صيانة",
        label: "فاتورة صيانة أجهزة فنية",
        reference: String(inv.invoiceNumber).replace(/#/g, ""),
        notes: inv.notes || invItems.map((i) => `${i.deviceType} - ${i.brand}`).join(" | "),
        debit: actualCost,
        credit: 0
      });
    });
    const customerTransactions = transactions.filter(
      (tx) => tx.customerId === customerId && !tx.isReversed && !tx.isReversal && tx.status !== "reversed" && tx.status !== "reversal"
    );
    customerTransactions.forEach((tx) => {
      const txDate = parseTxDate(tx);
      if (tx.type === "receipt") {
        const isLinkedToInvoice = !!tx.invoiceNumber;
        const liabilityAmount = tx.liabilityAmount || Math.abs(Number(tx.amount || 0));
        let docType = "سند قبض";
        let statement = tx.transactionCategory || "دفعه تحت الحساب";
        let details = tx.statementNote || tx.notes || "";
        let refStr = String(tx.voucherNumber || tx.id?.substring(0, 5)).replace(/#/g, "");
        if (isLinkedToInvoice) {
          docType = "سداد فاتورة";
          statement = `سداد في فاتورة رقم ${tx.invoiceNumber}`;
          refStr = `${tx.invoiceNumber}${tx.voucherNumber || "100"}`;
        } else if (tx.transactionCategory === "دفعة أجهزة") {
          docType = "سداد فاتورة";
          statement = `سداد في فاتورة رقم ${tx.invoiceNumber || "؟"}`;
          if (tx.invoiceNumber) {
            refStr = `${tx.invoiceNumber}${tx.voucherNumber || "100"}`;
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
      } else if (tx.type === "payment") {
        entries.push({
          id: `tx-${tx.id}`,
          date: txDate,
          type: "سند صرف",
          label: tx.transactionCategory || "سند صرف للعميل",
          reference: String(tx.voucherNumber || tx.id?.substring(0, 5)).replace(/#/g, ""),
          notes: tx.notes || "",
          debit: Math.abs(Number(tx.amount || 0)),
          credit: 0
        });
      }
    });
    entries.sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0));
    const activeEntries = entries.filter((e) => e.debit > 1e-3 || e.credit > 1e-3);
    let balance = 0;
    return activeEntries.map((entry) => {
      balance += entry.debit - entry.credit;
      return {
        ...entry,
        runningBalance: balance
      };
    });
  };
  const handleWhatsAppShare = async (customerId) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;
    setIsGeneratingPDF(true);
    const originalGetComputedStyle = window.getComputedStyle;
    let tempEl = null;
    try {
      const element = document.getElementById("print-area");
      if (!element) {
        setIsGeneratingPDF(false);
        return;
      }
      const canvas = await htmlToImage.toCanvas(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true
      });
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, void 0, "FAST");
      heightLeft -= pageHeight;
      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, void 0, "FAST");
        heightLeft -= pageHeight;
      }
      const today = /* @__PURE__ */ new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const printDate = `${year}-${month}-${day}`;
      const filename = `كشف حساب_${cust.name}_${printDate}.pdf`;
      let pdfBase64 = "";
      try {
        pdfBase64 = pdf.output("datauristring").split(",")[1];
      } catch (err) {
        console.error("Failed to get PDF Base64 string:", err);
      }
      try {
        await Filesystem.writeFile({
          path: `SND_App/تقارير/${filename}`,
          data: pdfBase64,
          directory: Directory.Documents,
          recursive: true
        });
        console.log("PDF file saved successfully to SND_App/تقارير directory.");
      } catch (fsError) {
        console.warn("Skipping Device Filesystem save:", fsError);
      }
      try {
        const { localDb } = await import("/src/lib/local-db.ts");
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
          [docId, customerId, cust.name, filename, (/* @__PURE__ */ new Date()).toISOString(), fileSize, pdfBase64]
        );
        console.log("PDF saved to local database saved_pdfs table!");
      } catch (dbError) {
        console.warn("Failed to save to SQLite database table saved_pdfs:", dbError);
      }
      pdf.save(filename);
      const totalCost = getCustomerTotalCost(customerId);
      const totalPaid = getCustomerTotalPaid(customerId);
      const diff = totalCost - totalPaid;
      const currency = getCustomerCurrencyLabel(customerId);
      let statusText = "";
      if (diff < -0.01) {
        statusText = `رصيد دائن للعميل بفائض: ${Math.abs(diff).toLocaleString("en-US")} ${currency}`;
      } else if (diff > 0.01) {
        statusText = `متبقي عليه كديون متراكمة: ${Math.abs(diff).toLocaleString("en-US")} ${currency}`;
      } else {
        statusText = `الحساب متزن بالكامل (0.00)`;
      }
      let message = `*كشف مالي رسمي وموحد بصيغة PDF* 📄

`;
      message += `عزيزي العميل *${cust.name}*،
`;
      message += `تجدون أدناه ملخصاً مالياً بالعمليات والدفوعات المسجلة لصيانتكم. كما تم تنزيل وحفظ مستند الـ PDF للتقرير في مجلد قاعدة البيانات.

`;
      message += `- *الرصيد الصافي:* ${statusText}
`;
      message += `- *إجمالي مستحقات الصيانة:* ${totalCost.toLocaleString("en-US")} ${currency}
`;
      message += `- *إجمالي السندات والمقبوضات:* ${totalPaid.toLocaleString("en-US")} ${currency}

`;
      message += `يرجى مشاركة وإرسال كشف مستند الـ PDF المحفوظ الآن بنجاح على جهازكم.`;
      let sharedNatively = false;
      try {
        const pdfBlob = pdf.output("blob");
        sharedNatively = await sharePdfFile(pdfBlob, filename, message, "report");
      } catch (shareErr) {
        console.warn("Native share was skipped:", shareErr);
      }
      if (!sharedNatively) {
        openWhatsApp(message, cust.phone1 || cust.phone2, shopConfig?.countryCode);
      }
    } catch (e) {
      console.error("Failed to export PDF & share:", e);
    } finally {
      window.getComputedStyle = originalGetComputedStyle;
      if (tempEl && tempEl.parentNode) {
        tempEl.parentNode.removeChild(tempEl);
      }
      setIsGeneratingPDF(false);
    }
  };
  const customerInvoices = selectedCustomer ? invoices.filter((inv) => inv.customerId === selectedCustomer.id).sort((a, b) => Number(b.invoiceNumber || 0) - Number(a.invoiceNumber || 0)) : [];
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterType, setFilterType] = useState("code");
  const [sortDir, setSortDir] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const getProcessedCustomers = () => {
    let list = customers.filter(
      (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone1.includes(search) || c.phone2 && c.phone2.includes(search)
    );
    list.sort((a, b) => {
      if (filterType === "alpha") {
        return sortDir === "asc" ? a.name.localeCompare(b.name, "ar") : b.name.localeCompare(a.name, "ar");
      } else if (filterType === "date") {
        const dateA = a.createdAt ? typeof a.createdAt.toDate === "function" ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? typeof b.createdAt.toDate === "function" ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime() : 0;
        return sortDir === "asc" ? dateA - dateB : dateB - dateA;
      } else if (filterType === "debt") {
        const debtA = getCustomerOutstandingAmount(a.id);
        const debtB = getCustomerOutstandingAmount(b.id);
        return sortDir === "asc" ? debtA - debtB : debtB - debtA;
      } else if (filterType === "devices") {
        const devA = getCustomerRemainingDevices(a.id);
        const devB = getCustomerRemainingDevices(b.id);
        return sortDir === "asc" ? devA - devB : devB - devA;
      } else if (filterType === "currency") {
        const currA = a.liabilityCurrency || "USD";
        const currB = b.liabilityCurrency || "USD";
        return sortDir === "asc" ? currA.localeCompare(currB, "ar") : currB.localeCompare(currA, "ar");
      } else if (filterType === "code") {
        const numA = Number(a.customerNumber) || 0;
        const numB = Number(b.customerNumber) || 0;
        return sortDir === "asc" ? numA - numB : numB - numA;
      }
      return 0;
    });
    return list;
  };
  const setFilterAndSort = (type, dir) => {
    setFilterType(type);
    setSortDir(dir);
    setShowFilterDropdown(false);
  };
  const handleHeaderClick = (type) => {
    if (filterType === type) {
      setSortDir((prev) => prev === "asc" ? "desc" : "asc");
    } else {
      setFilterType(type);
      if (type === "date" || type === "code" || type === "debt" || type === "devices") {
        setSortDir("desc");
      } else {
        setSortDir("asc");
      }
    }
    setCurrentPage(1);
  };
  const renderSortArrow = (type) => {
    if (filterType !== type) return null;
    return sortDir === "asc" ? " ▲" : " ▼";
  };
  const getStatusStyle = (status) => {
    switch (status) {
      case "10":
      case "new":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "20":
      case "inspected":
      case "testing":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "30":
      case "awaiting_approval":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "approved":
        return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "35":
      case "awaiting_parts":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "parts_available":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "parts_not_available":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "40":
      case "repairing":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "50":
      case "ready":
      case "intact":
      case "unrepairable":
      case "refused":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "60":
      case "delivered":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-white/5";
    }
  };
  const getStatusTextArabic = (status) => {
    switch (status) {
      case "10":
      case "new":
        return "دخول جديد";
      case "20":
      case "inspected":
      case "testing":
        return "قيد الفحص";
      case "30":
      case "awaiting_approval":
        return "إنتظار موافقة العميل";
      case "approved":
        return "تمت موافقة العميل";
      case "35":
      case "awaiting_parts":
        return "انتظار قطع الغيار";
      case "parts_available":
        return "تم توفير قطع الغيار";
      case "parts_not_available":
        return "لم تتوفر قطع الغيار";
      case "40":
      case "repairing":
        return "قيد الصيانة";
      case "50":
      case "ready":
      case "intact":
      case "unrepairable":
      case "refused":
        return "جاهز للتسليم";
      case "60":
      case "delivered":
        return "تم التسليم والمغادرة";
      case "70":
        return "إلغاء وسحب الجهاز";
      default:
        return "غير محدد";
    }
  };
  const allProcessedCustomers = getProcessedCustomers();
  const totalPages = Math.max(1, Math.ceil(allProcessedCustomers.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentCustomers = allProcessedCustomers.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);
  return /* @__PURE__ */ jsxDEV("div", { className: "text-right pb-24 md:pb-6", dir: "rtl", children: [
    /* @__PURE__ */ jsxDEV(
      AddCustomerModal,
      {
        isOpen: showAddCustomer,
        onClose: () => setShowAddCustomer(false),
        onSuccess: onCustomerAdded,
        customers,
        user
      },
      void 0,
      false,
      {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 742,
        columnNumber: 7
      },
      this
    ),
    (!selectedCustomer || activeCustomerTab === "menu") && /* @__PURE__ */ jsxDEV("div", { className: "customers-box bg-[#1a1a1a] border-y border-white/5 mx-0 my-0 relative", children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3 px-4 py-3", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 space-y-1 relative", children: /* @__PURE__ */ jsxDEV(
        CustomerAutocomplete,
        {
          customers,
          onSelect: (cust) => selectCustomer(cust),
          onInputChange: (val) => setSearch(val),
          onAddNew: () => setShowAddCustomer(true),
          label: "البحث باسم العميل أو رقم الهاتف:",
          placeholder: "ابدأ بكتابة اسم العميل أو الهاتف...",
          initialValue: search,
          type: "name"
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 757,
          columnNumber: 13
        },
        this
      ) }, void 0, false, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 756,
        columnNumber: 11
      }, this),
      canAdd && /* @__PURE__ */ jsxDEV("div", { className: "relative pt-4", children: /* @__PURE__ */ jsxDEV(
        "button",
        {
          onClick: () => {
            setShowAddCustomer(true);
            setSelectedCustomer(null);
          },
          className: "p-3 bg-orange-600/10 hover:bg-orange-600 border border-orange-600/20 text-orange-500 hover:text-white rounded-xl transition-all shadow-lg hover:shadow-orange-600/20",
          title: "إضافة عميل جديد",
          children: /* @__PURE__ */ jsxDEV(UserPlus, { size: 20 }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 780,
            columnNumber: 17
          }, this)
        },
        void 0,
        false,
        {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 772,
          columnNumber: 15
        },
        this
      ) }, void 0, false, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 771,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/Customers.tsx",
      lineNumber: 753,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/Customers.tsx",
      lineNumber: 752,
      columnNumber: 9
    }, this),
    selectedCustomer && activeCustomerTab === "menu" && !showLogModal && !showDetailsModal && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4", children: /* @__PURE__ */ jsxDEV("div", { className: "customer-modal-bg bg-[#141414] border border-white/10 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative text-right", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-black text-white", children: selectedCustomer.name }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 793,
          columnNumber: 16
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              setSelectedCustomer(null);
              setSearch("");
            },
            className: "p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400",
            children: /* @__PURE__ */ jsxDEV(X, { size: 18 }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 801,
              columnNumber: 19
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 794,
            columnNumber: 16
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 792,
        columnNumber: 14
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 gap-3", children: [
        /* @__PURE__ */ jsxDEV("button", { onClick: () => setShowDetailsModal(true), className: "w-full text-right p-4 bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 rounded-2xl font-bold flex items-center justify-between border border-orange-500/10", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "بيانات العميل" }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 807,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(ChevronLeft, { size: 18 }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 808,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 806,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => {
              const entries = getStatementEntries(selectedCustomer.id);
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
              const curr = getCustomerCurrencyLabel(selectedCustomer.id);
              const getArabicCurrencyName2 = (currCode) => {
                if (!currCode) return "دولار";
                if (currCode.toUpperCase() === "USD") return "دولار";
                if (currCode.toUpperCase() === "YER") return "ريال يمني";
                if (currCode.toUpperCase().includes("USD") && currCode.toUpperCase().includes("YER")) return "دولار / ريال يمني";
                return currCode;
              };
              const arCurrency = getArabicCurrencyName2(curr);
              let totalDebit = 0;
              let totalCredit = 0;
              entries.forEach((e) => {
                totalDebit += e.debit;
                totalCredit += e.credit;
              });
              const diff = totalCredit - totalDebit;
              const isCreditor = diff > 0.01;
              const isDebtor = diff < -0.01;
              const balanceStatus = isCreditor ? "دائن (له في الحساب)" : isDebtor ? "مدين (متبقي عليه ديون)" : "متزن الحساب";
              setPreviewData({
                type: "statement",
                data: {
                  statement: {
                    customerName: selectedCustomer.name,
                    companyName: selectedCustomer.companyName || "",
                    customerPhone: selectedCustomer.phone1 || "",
                    customerNumber: selectedCustomer.customerNumber || selectedCustomer.id?.substring(0, 5) || "",
                    balance: diff,
                    balanceStatus,
                    currency: arCurrency,
                    liabilityCurrency: selectedCustomer.liabilityCurrency || "USD",
                    entries: formattedEntries
                  }
                }
              });
            },
            className: "w-full text-right p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold flex items-center justify-between border border-white/5",
            children: [
              /* @__PURE__ */ jsxDEV("span", { children: "كشف حساب" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 865,
                columnNumber: 17
              }, this),
              /* @__PURE__ */ jsxDEV(ChevronLeft, { size: 18 }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 866,
                columnNumber: 17
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 810,
            columnNumber: 15
          },
          this
        ),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => setShowLogModal(true), className: "w-full text-right p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold flex items-center justify-between border border-white/5", children: [
          /* @__PURE__ */ jsxDEV("span", { children: "سجل العميل" }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 869,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV(ChevronLeft, { size: 18 }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 870,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 868,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 805,
        columnNumber: 14
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/Customers.tsx",
      lineNumber: 791,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/Customers.tsx",
      lineNumber: 790,
      columnNumber: 9
    }, this),
    selectedCustomer && activeCustomerTab !== "menu" && /* @__PURE__ */ jsxDEV("div", { className: "customers-details-card bg-[#121212] border border-white/5 rounded-3xl p-6 relative group", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" }, void 0, false, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 880,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between gap-4 mb-6", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-sm font-black text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV(User, { size: 16, className: "text-orange-500" }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 884,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("span", { children: selectedCustomer.name }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 885,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 883,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV(
          "button",
          {
            onClick: () => setActiveCustomerTab("menu"),
            className: "p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all flex items-center border border-white/5",
            title: "العودة للقائمة",
            children: /* @__PURE__ */ jsxDEV(ArrowRight, { size: 18 }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 892,
              columnNumber: 16
            }, this)
          },
          void 0,
          false,
          {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 887,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 882,
        columnNumber: 11
      }, this),
      activeCustomerTab === "details" && /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-white/[0.01] border border-white/5 rounded-2xl relative space-y-3", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] font-black tracking-wider text-orange-500 uppercase font-cairo border-b border-white/5 pb-1", children: "البيانات النظامية الثابتة (غير قابلة للتعديل)" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 902,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block font-cairo", children: "رقم العميل:" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 907,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "customer-static-input w-full bg-[#161616] border border-white/5 rounded-xl px-3.5 py-2 text-xs font-mono font-black text-gray-400 cursor-not-allowed", children: [
                  "#",
                  selectedCustomer.customerNumber || "---"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 908,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 906,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block font-cairo", children: "تاريخ التسجيل بالمنظومة:" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 917,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "customer-static-input w-full bg-[#161616] border border-white/5 rounded-xl px-3.5 py-2 text-[11px] font-bold text-gray-400 cursor-not-allowed font-cairo", children: selectedCustomer.createdAt ? parseDate(selectedCustomer.createdAt).toLocaleDateString("ar-YE", { weekday: "long", year: "numeric", month: "short", day: "numeric" }) : "تاريخ قديم/مستورد" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 918,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 916,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 904,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 901,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-black/20 border border-white/5 rounded-2xl text-right", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block font-cairo uppercase", children: "الأجهزة المتبقية بمحل الصيانة" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 933,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-baseline gap-1 mt-1", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-2xl font-black text-white font-mono", children: getCustomerRemainingDevices(selectedCustomer.id) }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 935,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-gray-500 text-[10px] font-bold", children: "أجهزة" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 936,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 934,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 932,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-black/20 border border-white/5 rounded-2xl text-right", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block font-cairo uppercase", children: "حالة صافي مديونية العميل" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 942,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "mt-1", children: (() => {
                const totalPaid = getCustomerTotalPaid(selectedCustomer.id);
                const totalCost = getCustomerTotalCost(selectedCustomer.id);
                const diff = totalPaid - totalCost;
                const curr = getCustomerCurrencyLabel(selectedCustomer.id);
                if (diff > 0.01) {
                  return /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "text-lg font-black text-emerald-400 font-mono", children: [
                      "+",
                      diff.toFixed(2),
                      " ",
                      curr
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 953,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "inline-block px-2 py-0.5 rounded-lg text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold font-cairo", children: "دائن (له متبقي لدينا)" }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 954,
                      columnNumber: 29
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 952,
                    columnNumber: 27
                  }, this);
                } else if (diff < -0.01) {
                  return /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "text-lg font-black text-rose-500 font-mono", children: [
                      "-",
                      Math.abs(diff).toFixed(2),
                      " ",
                      curr
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 960,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "inline-block px-2 py-0.5 rounded-lg text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold font-cairo", children: "مدين (عليه مستحقات للدفع)" }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 961,
                      columnNumber: 29
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 959,
                    columnNumber: 27
                  }, this);
                } else {
                  return /* @__PURE__ */ jsxDEV("div", { className: "space-y-1", children: [
                    /* @__PURE__ */ jsxDEV("div", { className: "text-lg font-black text-slate-400 font-mono", children: [
                      "0.00 ",
                      curr
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 967,
                      columnNumber: 29
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "inline-block px-2 py-0.5 rounded-lg text-[9px] bg-white/[0.02] border border-white/5 text-slate-400 font-bold font-cairo", children: "رصيد خالي من المديونيات" }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 968,
                      columnNumber: 29
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 966,
                    columnNumber: 27
                  }, this);
                }
              })() }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 943,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 941,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 929,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 900,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between border-b border-white/5 pb-2", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] font-black tracking-wider text-orange-500 uppercase font-cairo", children: "بيانات الاتصال والتفاصيل (قابلة للتعديل والتحرير)" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 983,
              columnNumber: 19
            }, this),
            !isEditingMode ? canEdit && /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                onClick: () => {
                  setIsEditingMode(true);
                  setUpdatePastTransactions(true);
                  setEditName(selectedCustomer.name || "");
                  setEditCompanyName(selectedCustomer.companyName || "");
                  setEditPhone1(selectedCustomer.phone1 || "");
                  setEditPhone2(selectedCustomer.phone2 || "");
                  setEditEmail(selectedCustomer.email || "");
                  setEditNotes(selectedCustomer.notes || "");
                },
                className: "px-2.5 py-1 bg-orange-600/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/25 rounded-md text-[10px] font-bold font-cairo transition-all flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsxDEV(Edit2, { size: 10 }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1e3,
                    columnNumber: 25
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { children: "تحرير البيانات الأساسية" }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1001,
                    columnNumber: 25
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 986,
                columnNumber: 23
              },
              this
            ) : /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                onClick: () => setIsEditingMode(false),
                className: "px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded-md text-[10px] font-bold font-cairo border border-white/10 transition-all",
                children: "إلغاء التعديل"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1005,
                columnNumber: 21
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 982,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-400 font-bold block font-cairo", children: "اسم العميل ورابط الحساب:" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1019,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  disabled: !isEditingMode,
                  value: isEditingMode ? editName : selectedCustomer.name,
                  onChange: (e) => setEditName(e.target.value),
                  className: `customer-static-input w-full text-xs font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all font-cairo ${isEditingMode ? "bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none" : "bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none"}`
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1020,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1018,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-400 font-bold block font-cairo", children: "اسم الجهة / الشركة:" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1034,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  disabled: !isEditingMode,
                  value: isEditingMode ? editCompanyName : selectedCustomer.companyName || "",
                  onChange: (e) => setEditCompanyName(e.target.value),
                  placeholder: isEditingMode ? "اسم الشركة أو الجهة إن وجدت..." : "لا يوجد",
                  className: `customer-static-input w-full text-xs font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all font-cairo ${isEditingMode ? "bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none" : "bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none"}`
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1035,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1033,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-400 font-bold block font-cairo", children: "الهاتف الرئيسي:" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1051,
                  columnNumber: 23
                }, this),
                isEditingMode && /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    type: "button",
                    onClick: () => setEditPhone1("لا يوجد"),
                    className: "text-[9px] text-orange-400 hover:text-white bg-white/5 px-2 py-0.5 rounded border border-white/5 font-cairo font-black",
                    children: "تعيين لا يوجد"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1053,
                    columnNumber: 25
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1050,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "tel",
                  inputMode: "tel",
                  disabled: !isEditingMode,
                  value: isEditingMode ? editPhone1 : selectedCustomer.phone1,
                  onChange: (e) => {
                    const val = e.target.value.replace(/[^0-9+*#]/g, "");
                    setEditPhone1(val);
                  },
                  className: `customer-static-input w-full text-xs font-mono font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all ${isEditingMode ? "bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none" : "bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none"}`
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1062,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1049,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-400 font-bold block font-cairo", children: "رقم هاتف ثانوي:" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1081,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "tel",
                  inputMode: "tel",
                  disabled: !isEditingMode,
                  value: isEditingMode ? editPhone2 : selectedCustomer.phone2 || "",
                  onChange: (e) => {
                    const val = e.target.value.replace(/[^0-9+*#]/g, "");
                    setEditPhone2(val);
                  },
                  placeholder: isEditingMode ? "رقم هاتف إضافي إن وجد..." : "غير مدخل",
                  className: `customer-static-input w-full text-xs font-mono font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all ${isEditingMode ? "bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none" : "bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none"}`
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1082,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1080,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-400 font-bold block font-cairo", children: "البريد الإلكتروني:" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1102,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "email",
                  disabled: !isEditingMode,
                  value: isEditingMode ? editEmail : selectedCustomer.email || "",
                  onChange: (e) => setEditEmail(e.target.value),
                  placeholder: isEditingMode ? "customer@domain.com" : "غير مدخل",
                  className: `customer-static-input w-full text-xs font-mono font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all ${isEditingMode ? "bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none" : "bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none"}`
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1103,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1101,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right md:col-span-2", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-400 font-bold block font-cairo", children: "تفاصيل وملاحظات إضافية:" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1119,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "textarea",
                {
                  disabled: !isEditingMode,
                  value: isEditingMode ? editNotes : selectedCustomer.notes || "",
                  onChange: (e) => setEditNotes(e.target.value),
                  rows: 2,
                  placeholder: isEditingMode ? "اكتب أية ملاحظات تفصيلية أو عنونة أخرى للعميل..." : "لا توجد ملاحظات مسجلة للعميل",
                  className: `customer-static-input w-full text-xs font-bold text-right py-2 px-3.5 border rounded-xl transition-all resize-none ${isEditingMode ? "bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none font-cairo" : "bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none font-cairo"}`
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1120,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1118,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: `space-y-1 text-right md:col-span-2 flex items-center justify-between p-3 rounded-xl border transition-all ${isEditingMode ? "bg-black/40 border-white/10" : "bg-[#161616] border-white/5 opacity-80"}`, children: [
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-0.5", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-400 font-bold block font-cairo", children: "يمتلك حساب واتساب؟" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1137,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-[8px] text-gray-500 font-cairo", children: "تحديد هذا الخيار يسمح بالإرسال التلقائي عبر الواتساب." }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1138,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1136,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  disabled: !isEditingMode,
                  onClick: () => setEditHasWhatsapp(!editHasWhatsapp),
                  className: `w-10 h-5 rounded-full relative transition-all duration-300 ${(isEditingMode ? editHasWhatsapp : selectedCustomer.hasWhatsapp) ? "bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.3)]" : "bg-gray-700"} ${!isEditingMode ? "cursor-not-allowed" : ""}`,
                  children: /* @__PURE__ */ jsxDEV("div", { className: `absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${(isEditingMode ? editHasWhatsapp : selectedCustomer.hasWhatsapp) ? "right-6" : "right-1"}` }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1146,
                    columnNumber: 23
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1140,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1135,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1015,
            columnNumber: 17
          }, this),
          isEditingMode && /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between pt-3 border-t border-white/5", children: [
            /* @__PURE__ */ jsxDEV("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "checkbox",
                  checked: updatePastTransactions,
                  onChange: (e) => setUpdatePastTransactions(e.target.checked),
                  className: "w-3 h-3 md:w-4 md:h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 bg-black/50"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1156,
                  columnNumber: 23
                },
                this
              ),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] md:text-[10px] text-gray-400 font-bold font-cairo", children: "شامل التعاملات السابقة (الفواتير والقيود)" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1162,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1155,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  onClick: () => setIsEditingMode(false),
                  className: "px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-[10px] font-bold font-cairo border border-white/5 transition-all",
                  children: "إلغاء التعديل"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1165,
                  columnNumber: 23
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  disabled: editName.trim() === "" || editPhone1.trim() === "" || isSavingInProcess,
                  onClick: handleUpdateCustomer,
                  className: `px-4.5 py-1.5 font-black font-cairo text-[10px] border rounded-lg shadow-lg flex items-center gap-1.5 transition-all ${editName.trim() !== "" && editPhone1.trim() !== "" && !isSavingInProcess ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 hover:shadow-emerald-600/15" : "bg-white/[0.01] text-gray-500 border-white/5 cursor-not-allowed shadow-none"}`,
                  children: isSavingInProcess ? /* @__PURE__ */ jsxDEV("span", { children: "جاري الحفظ..." }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1184,
                    columnNumber: 25
                  }, this) : /* @__PURE__ */ jsxDEV(Fragment, { children: [
                    /* @__PURE__ */ jsxDEV(Check, { size: 11 }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 1187,
                      columnNumber: 27
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { children: "حفظ وتثبيت البيانات" }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 1188,
                      columnNumber: 27
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1186,
                    columnNumber: 25
                  }, this)
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1172,
                  columnNumber: 23
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1164,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1154,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 981,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 980,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 897,
        columnNumber: 11
      }, this),
      activeCustomerTab === "statement" && /* @__PURE__ */ jsxDEV("div", { className: "p-6 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center gap-4", children: [
        /* @__PURE__ */ jsxDEV("p", { className: "text-gray-400 text-sm font-bold text-center", children: "يمكنك إصدار كشف حساب شامل للعميل من هنا" }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1203,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap justify-center gap-3", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                const entries = getStatementEntries(selectedCustomer.id);
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
                const curr = getCustomerCurrencyLabel(selectedCustomer.id);
                const getArabicCurrencyName2 = (currCode) => {
                  if (!currCode) return "دولار";
                  if (currCode.toUpperCase() === "USD") return "دولار";
                  if (currCode.toUpperCase() === "YER") return "ريال يمني";
                  if (currCode.toUpperCase().includes("USD") && currCode.toUpperCase().includes("YER")) return "دولار / ريال يمني";
                  return currCode;
                };
                const arCurrency = getArabicCurrencyName2(curr);
                let totalDebit = 0;
                let totalCredit = 0;
                entries.forEach((e) => {
                  totalDebit += e.debit;
                  totalCredit += e.credit;
                });
                const diff = totalCredit - totalDebit;
                const isCreditor = diff > 0.01;
                const isDebtor = diff < -0.01;
                const balanceStatus = isCreditor ? "دائن (له في الحساب)" : isDebtor ? "مدين (متبقي عليه ديون)" : "متزن الحساب";
                setPreviewData({
                  type: "statement",
                  data: {
                    statement: {
                      customerName: selectedCustomer.name,
                      companyName: selectedCustomer.companyName || "",
                      customerPhone: selectedCustomer.phone1 || "",
                      customerNumber: selectedCustomer.customerNumber || selectedCustomer.id?.substring(0, 5) || "",
                      balance: diff,
                      balanceStatus,
                      currency: arCurrency,
                      liabilityCurrency: selectedCustomer.liabilityCurrency || "USD",
                      entries: formattedEntries
                    }
                  }
                });
              },
              className: "px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-500/10 transition-all flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxDEV(FileText, { size: 14 }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1260,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("span", { children: "معاينة وإصدار كشف حساب" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1261,
                  columnNumber: 19
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1205,
              columnNumber: 17
            },
            this
          ),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => {
                const entries = getStatementEntries(selectedCustomer.id);
                let totalDebit = 0;
                let totalCredit = 0;
                entries.forEach((e) => {
                  totalDebit += e.debit;
                  totalCredit += e.credit;
                });
                const unpaid = totalDebit - totalCredit;
                if (unpaid <= 0) {
                  alert("حساب العميل متزن أو دائن، لا حاجة لإرسال تذكير.");
                  return;
                }
                sendUniversalReminder({
                  customerName: selectedCustomer.name,
                  phone: selectedCustomer.phone1,
                  amount: unpaid,
                  currency: selectedCustomer.currency || "USD",
                  hasWhatsapp: selectedCustomer.hasWhatsapp !== void 0 ? selectedCustomer.hasWhatsapp : true,
                  countryCode: shopConfig?.countryCode
                });
              },
              className: "px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/10 transition-all flex items-center gap-2",
              children: [
                /* @__PURE__ */ jsxDEV(MessageCircle, { size: 14 }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1291,
                  columnNumber: 19
                }, this),
                /* @__PURE__ */ jsxDEV("span", { children: "إرسال تذكير سداد (واتساب/SMS)" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1292,
                  columnNumber: 19
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1264,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1204,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 1202,
        columnNumber: 13
      }, this),
      activeCustomerTab === "log" && /* @__PURE__ */ jsxDEV("div", { className: "pt-6 border-t border-white/5 space-y-4", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-white font-bold text-sm", children: [
          /* @__PURE__ */ jsxDEV(FileText, { size: 16, className: "text-orange-500" }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1301,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("span", { children: [
            "سجلات وفواتير العميل المالي والتقني (",
            customerInvoices.length,
            ")"
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1302,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1300,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-black/25 rounded-2xl border border-white/5 overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full text-right border-collapse text-xs", children: [
          /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { className: "bg-white/[0.02] border-b border-white/5 text-gray-500 uppercase", children: [
            /* @__PURE__ */ jsxDEV("th", { className: "px-6 py-3 font-bold", children: "رقم الفاتورة" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1310,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("th", { className: "px-6 py-3 font-bold", children: "تاريخ الفاتورة" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1311,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("th", { className: "px-6 py-3 font-bold", children: "عدد الأجهزة" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1312,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("th", { className: "px-6 py-3 font-bold", children: "التكلفة الإجمالية" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1313,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("th", { className: "px-6 py-3 font-bold", children: "المدفوع" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1314,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("th", { className: "px-6 py-3 font-bold", children: "المتبقي" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1315,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("th", { className: "px-6 py-3 font-bold", children: "حالة الفاتورة" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1316,
              columnNumber: 25
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1309,
            columnNumber: 23
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1308,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-white/5 text-slate-300", children: customerInvoices.length === 0 ? /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 7, className: "px-6 py-8 text-center text-gray-500", children: "لا توجد فواتير مسجلة لهذا العميل." }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1322,
            columnNumber: 27
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1321,
            columnNumber: 25
          }, this) : customerInvoices.map((inv) => {
            const invItems = items.filter((it) => it.invoiceNumber === inv.invoiceNumber);
            const itemsCount = invItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
            const actualCost = getInvoiceActualCost(invItems);
            const remainingForInv = Math.max(0, actualCost - Number(inv.amountPaid || 0));
            const curr = inv.currency || "USD";
            const statusGroups = {};
            invItems.forEach((it) => {
              const curStatus = it.status || "10";
              statusGroups[curStatus] = (statusGroups[curStatus] || 0) + (Number(it.quantity) || 1);
            });
            return /* @__PURE__ */ jsxDEV("tr", { className: "hover:bg-white/[0.01] transition-colors", children: [
              /* @__PURE__ */ jsxDEV("td", { className: "px-6 py-4 font-mono font-bold text-white", children: inv.invoiceNumber }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1343,
                columnNumber: 31
              }, this),
              /* @__PURE__ */ jsxDEV("td", { className: "px-6 py-4 font-mono text-slate-400", children: inv.createdAt ? (function() {
                const d = parseDate(inv.createdAt);
                return d ? d.toLocaleDateString("ar-YE") : "---";
              })() : "---" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1344,
                columnNumber: 31
              }, this),
              /* @__PURE__ */ jsxDEV("td", { className: "px-6 py-4 font-mono", children: itemsCount }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1350,
                columnNumber: 31
              }, this),
              /* @__PURE__ */ jsxDEV("td", { className: "px-6 py-4 font-mono text-white font-bold", children: [
                actualCost.toFixed(2),
                " ",
                /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] text-gray-500", children: curr }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1351,
                  columnNumber: 112
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1351,
                columnNumber: 31
              }, this),
              /* @__PURE__ */ jsxDEV("td", { className: "px-6 py-4 font-mono text-emerald-400", children: [
                Number(inv.amountPaid || 0).toFixed(2),
                " ",
                /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] text-gray-500", children: curr }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1352,
                  columnNumber: 125
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1352,
                columnNumber: 31
              }, this),
              /* @__PURE__ */ jsxDEV("td", { className: "px-6 py-4 font-mono text-rose-500 font-bold", children: [
                remainingForInv.toFixed(2),
                " ",
                /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] text-gray-500", children: curr }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1353,
                  columnNumber: 120
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1353,
                columnNumber: 31
              }, this),
              /* @__PURE__ */ jsxDEV("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col gap-1.5 justify-end", children: Object.entries(statusGroups).map(([status, count]) => /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5 justify-end", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-gray-400 font-mono", children: [
                  count,
                  "x"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1358,
                  columnNumber: 39
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: `inline-block px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${getStatusStyle(status)}`, children: getStatusTextArabic(status) }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1359,
                  columnNumber: 39
                }, this)
              ] }, status, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1357,
                columnNumber: 37
              }, this)) }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1355,
                columnNumber: 33
              }, this) }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1354,
                columnNumber: 31
              }, this)
            ] }, inv.id, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1342,
              columnNumber: 29
            }, this);
          }) }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1319,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1307,
          columnNumber: 19
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1306,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1305,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 1299,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex justify-end pt-4", children: /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold font-cairo font-mono", children: [
        "المعرف الفريد: ",
        selectedCustomer.id
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 1379,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 1378,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/Customers.tsx",
      lineNumber: 879,
      columnNumber: 9
    }, this),
    (!selectedCustomer || activeCustomerTab === "menu") && /* @__PURE__ */ jsxDEV("div", { className: "customers-box bg-[#1a1a1a] border-y border-white/5 mx-0 my-4 space-y-0", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between gap-2 p-3 border-b border-white/5", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "p-1.5 bg-orange-600/10 text-orange-500 rounded-lg border border-orange-500/15", children: /* @__PURE__ */ jsxDEV(Users, { size: 16 }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1392,
            columnNumber: 15
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1391,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("h3", { className: "text-[10px] sm:text-xs font-black font-cairo text-white", children: "جدول جميع العملاء المسجلين في النظام" }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1394,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1390,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "relative", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              onClick: () => setShowFilterDropdown(!showFilterDropdown),
              className: "px-2 py-1.5 bg-white/5 hover:bg-orange-600/20 text-gray-400 hover:text-orange-500 rounded-lg transition-all border border-white/10 flex items-center gap-1.5",
              children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] font-bold font-cairo sm:block hidden", children: "ترتيب وفرز" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1403,
                  columnNumber: 15
                }, this),
                /* @__PURE__ */ jsxDEV(ArrowUpDown, { size: 12 }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1404,
                  columnNumber: 15
                }, this)
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1399,
              columnNumber: 13
            },
            this
          ),
          showFilterDropdown && /* @__PURE__ */ jsxDEV("div", { className: "absolute z-50 left-0 mt-2 bg-[#1f1f1f] border border-white/10 rounded-xl shadow-2xl p-1.5 w-48", children: [
            /* @__PURE__ */ jsxDEV("button", { onClick: () => setFilterAndSort("alpha", "asc"), className: "w-full text-right px-3 py-1.5 text-[10px] hover:bg-orange-600 hover:text-white text-slate-300 rounded font-bold font-cairo transition-colors", children: "أبجدي (أ إلى ي)" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1409,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("button", { onClick: () => setFilterAndSort("alpha", "desc"), className: "w-full text-right px-3 py-1.5 text-[10px] hover:bg-orange-600 hover:text-white text-slate-300 rounded font-bold font-cairo transition-colors", children: "أبجدي (ي إلى أ)" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1410,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("button", { onClick: () => setFilterAndSort("date", "desc"), className: "w-full text-right px-3 py-1.5 text-[10px] hover:bg-orange-600 hover:text-white text-slate-300 rounded font-bold font-cairo transition-colors", children: "تاريخ التسجيل الأحدث" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1411,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("button", { onClick: () => setFilterAndSort("date", "asc"), className: "w-full text-right px-3 py-1.5 text-[10px] hover:bg-orange-600 hover:text-white text-slate-300 rounded font-bold font-cairo transition-colors", children: "تاريخ التسجيل الأقدم" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1412,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("button", { onClick: () => setFilterAndSort("debt", "asc"), className: "w-full text-right px-3 py-1.5 text-[10px] hover:bg-orange-600 hover:text-white text-slate-300 rounded font-bold font-cairo transition-colors", children: "المديونية (الأقل أولاً)" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1413,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("button", { onClick: () => setFilterAndSort("debt", "desc"), className: "w-full text-right px-3 py-1.5 text-[10px] hover:bg-orange-600 hover:text-white text-slate-300 rounded font-bold font-cairo transition-colors", children: "المديونية (الأكثر أولاً)" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1414,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1408,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1398,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 1389,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "w-full overflow-hidden", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full text-right border-collapse table-fixed select-none", children: [
        /* @__PURE__ */ jsxDEV("thead", { children: /* @__PURE__ */ jsxDEV("tr", { className: "bg-white/5 border-b border-white/10 text-gray-400 text-[9px] sm:text-[10px]", children: [
          /* @__PURE__ */ jsxDEV("th", { onClick: () => handleHeaderClick("code"), className: "px-1 py-1.5 font-bold text-center w-10 sm:w-16 cursor-pointer hover:bg-white/10 hover:text-white transition-all select-none", children: [
            "الكود",
            renderSortArrow("code")
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1425,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("th", { onClick: () => handleHeaderClick("alpha"), className: "px-1 py-1.5 font-bold w-1/4 cursor-pointer hover:bg-white/10 hover:text-white transition-all select-none", children: [
            "اسم العميل",
            renderSortArrow("alpha")
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1428,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "px-1 py-1.5 font-bold", children: "رقم الجوال" }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1431,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("th", { onClick: () => handleHeaderClick("devices"), className: "px-1 py-1.5 font-bold text-center w-12 sm:w-16 whitespace-nowrap cursor-pointer hover:bg-white/10 hover:text-white transition-all select-none", children: [
            "أجهزة",
            renderSortArrow("devices")
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1432,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("th", { onClick: () => handleHeaderClick("debt"), className: "px-1 py-1.5 font-bold text-center w-14 sm:w-16 whitespace-nowrap cursor-pointer hover:bg-white/10 hover:text-white transition-all select-none", children: [
            "المديونية",
            renderSortArrow("debt")
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1435,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("th", { onClick: () => handleHeaderClick("currency"), className: "px-1 py-1.5 font-bold text-center w-14 sm:w-18 whitespace-nowrap cursor-pointer hover:bg-white/10 hover:text-white transition-all select-none", children: [
            "عملة الحساب",
            renderSortArrow("currency")
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1438,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("th", { onClick: () => handleHeaderClick("date"), className: "px-1 py-1.5 font-bold text-center w-14 sm:w-20 whitespace-nowrap cursor-pointer hover:bg-white/10 hover:text-white transition-all select-none", children: [
            "تاريخ التسجيل",
            renderSortArrow("date")
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1441,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1424,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1423,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-white/5 text-slate-300 text-[10px] sm:text-xs", children: currentCustomers.length === 0 ? /* @__PURE__ */ jsxDEV("tr", { children: /* @__PURE__ */ jsxDEV("td", { colSpan: 7, className: "px-2 py-8 text-center text-gray-500 font-bold font-cairo text-xs", children: "لا يوجد عملاء مطابقين للبحث حالياً." }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1449,
          columnNumber: 21
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1448,
          columnNumber: 19
        }, this) : currentCustomers.map((cust) => {
          const remainingDevices = getCustomerRemainingDevices(cust.id);
          const outstandingAmt = getCustomerOutstandingAmount(cust.id);
          const currLabel = getCustomerCurrencyLabel(cust.id);
          const isSelected = selectedCustomer?.id === cust.id;
          return /* @__PURE__ */ jsxDEV("tr", { className: "hover:bg-white/[0.03] transition-colors cursor-pointer", onClick: () => selectCustomer(cust), children: [
            /* @__PURE__ */ jsxDEV("td", { className: "px-1 py-1 font-mono font-bold text-gray-500 text-center text-[9px] sm:text-[10px]", children: cust.customerNumber || "---" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1462,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "px-1 py-1", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsxDEV("span", { className: `font-bold text-[10px] sm:text-xs truncate ${isSelected ? "text-orange-400" : "text-white"}`, children: cust.name }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1467,
                columnNumber: 29
              }, this),
              cust.notes && /* @__PURE__ */ jsxDEV("span", { className: "text-[8px] sm:text-[9px] text-gray-500 line-clamp-1", children: cust.notes }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1468,
                columnNumber: 44
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1466,
              columnNumber: 27
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1465,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "px-1 py-1 font-mono text-slate-400", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col gap-0", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "flex items-center text-[9px] sm:text-[10px] truncate", children: cust.phone1 }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1473,
                columnNumber: 29
              }, this),
              cust.phone2 && /* @__PURE__ */ jsxDEV("span", { className: "flex items-center text-[8px] sm:text-[9px] text-gray-600 truncate", children: cust.phone2 }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1474,
                columnNumber: 45
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1472,
              columnNumber: 27
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1471,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "px-1 py-1 text-center whitespace-nowrap text-[9px] sm:text-[10px]", children: remainingDevices > 0 ? /* @__PURE__ */ jsxDEV("span", { className: "inline-block bg-orange-500/10 text-orange-400 px-1 py-0.5 rounded text-[9px] font-bold", children: remainingDevices }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1479,
              columnNumber: 29
            }, this) : /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600 font-bold", children: "-" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1483,
              columnNumber: 29
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1477,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "px-1 py-1 text-center whitespace-nowrap text-[9px] sm:text-[10px]", children: outstandingAmt > 0 ? /* @__PURE__ */ jsxDEV("span", { className: "inline-block bg-rose-500/10 text-rose-400 px-1 py-0.5 rounded text-[9px] font-bold", children: outstandingAmt.toFixed(0) }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1488,
              columnNumber: 29
            }, this) : /* @__PURE__ */ jsxDEV("span", { className: "text-slate-600 text-[9px] font-bold", children: "0" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1492,
              columnNumber: 29
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1486,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "px-1 py-1 text-center whitespace-nowrap text-[9px] sm:text-[10px]", children: /* @__PURE__ */ jsxDEV("span", { className: "inline-block bg-white/5 border border-white/5 text-gray-300 px-1.5 py-0.5 rounded text-[9px] font-black", children: (() => {
              const curr = cust.liabilityCurrency || "USD";
              if (curr === "USD") return "دولار";
              if (curr === "SAR") return "ريال سعودي";
              if (curr === "YER") return "ريال يمني";
              if (curr === "EUR") return "يورو";
              return curr;
            })() }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1496,
              columnNumber: 27
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1495,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "px-1 py-1 font-mono text-slate-400 text-[9px] sm:text-[10px] text-center whitespace-nowrap", children: cust.createdAt ? (function() {
              const d = parseDate(cust.createdAt);
              return d ? d.toLocaleDateString("ar-YE", { year: "2-digit", month: "numeric", day: "numeric" }) : "---";
            })() : "---" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1507,
              columnNumber: 25
            }, this)
          ] }, cust.id, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1461,
            columnNumber: 23
          }, this);
        }) }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1446,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 1422,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 1421,
        columnNumber: 9
      }, this),
      totalPages > 1 && /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between px-4 py-3 border-t border-white/5 bg-black/20", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-gray-500 font-bold font-cairo", children: [
          "عرض ",
          (safeCurrentPage - 1) * itemsPerPage + 1,
          " إلى ",
          Math.min(safeCurrentPage * itemsPerPage, allProcessedCustomers.length),
          " من أصل ",
          allProcessedCustomers.length,
          " عميل"
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1524,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              disabled: safeCurrentPage === 1,
              onClick: () => setCurrentPage((prev) => Math.max(1, prev - 1)),
              className: "px-3 py-1.5 text-xs font-bold font-cairo bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-lg transition-all",
              children: "السابق"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1528,
              columnNumber: 15
            },
            this
          ),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-1 mx-2", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-sm font-bold text-white", children: safeCurrentPage }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1536,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-xs text-gray-500", children: [
              "من ",
              totalPages
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1537,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1535,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV(
            "button",
            {
              disabled: safeCurrentPage === totalPages,
              onClick: () => setCurrentPage((prev) => Math.min(totalPages, prev + 1)),
              className: "px-3 py-1.5 text-xs font-bold font-cairo bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 rounded-lg transition-all",
              children: "التالي"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1539,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1527,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 1523,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/Customers.tsx",
      lineNumber: 1387,
      columnNumber: 9
    }, this),
    showDetailsModal && selectedCustomer && /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl", children: /* @__PURE__ */ jsxDEV("div", { className: "customer-modal-bg bg-[#141414] w-full h-full p-6 md:p-8 space-y-6 shadow-2xl relative overflow-y-auto text-right", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between border-b border-white/5 pb-4 print:hidden", children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxDEV("button", { onClick: () => setShowDetailsModal(false), className: "p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400", children: /* @__PURE__ */ jsxDEV(X, { size: 20 }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1562,
          columnNumber: 21
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1561,
          columnNumber: 18
        }, this),
        /* @__PURE__ */ jsxDEV("h3", { className: "text-sm font-black text-orange-400 font-cairo flex items-center gap-1.5 flex-row-reverse", children: [
          /* @__PURE__ */ jsxDEV(User, { size: 18 }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1565,
            columnNumber: 21
          }, this),
          "بيانات العميل المالية والتفصيلية"
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1564,
          columnNumber: 18
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 1560,
        columnNumber: 15
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 1559,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-white/[0.01] border border-white/5 rounded-2xl relative space-y-3", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] font-black tracking-wider text-orange-500 uppercase font-cairo border-b border-white/5 pb-1", children: "البيانات النظامية الثابتة" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1576,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block font-cairo", children: "رقم العميل:" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1580,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "customer-static-input w-full bg-[#161616] border border-white/5 rounded-xl px-3.5 py-2 text-xs font-mono font-black text-gray-400 cursor-not-allowed", children: [
                  "#",
                  selectedCustomer.customerNumber || "---"
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1581,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1579,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block font-cairo", children: "اسم العميل:" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1587,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "customer-static-input w-full bg-[#161616] border border-white/5 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-400 cursor-not-allowed font-cairo", children: selectedCustomer.name }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1588,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1586,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block font-cairo", children: "اسم الجهة / الشركة:" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1594,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "customer-static-input w-full bg-[#161616] border border-white/5 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-400 cursor-not-allowed font-cairo", children: selectedCustomer.companyName || "لا يوجد" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1595,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1593,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block font-cairo", children: "تاريخ التسجيل:" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1601,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "customer-static-input w-full bg-[#161616] border border-white/5 rounded-xl px-3.5 py-2 text-[11px] font-bold text-gray-400 cursor-not-allowed font-cairo", children: selectedCustomer.createdAt ? (function() {
                  const d = parseDate(selectedCustomer.createdAt);
                  return d ? d.toLocaleDateString("ar-YE") : "---";
                })() : "---" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1602,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1600,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1578,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1575,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-black/20 border border-white/5 rounded-2xl text-right", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block font-cairo uppercase", children: "الأجهزة المتبقية بمحل الصيانة" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1615,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-baseline gap-1 mt-1", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-2xl font-black text-white font-mono", children: getCustomerRemainingDevices(selectedCustomer.id) }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1617,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("span", { className: "text-gray-500 text-[10px] font-bold", children: "أجهزة" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1618,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1616,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1614,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-black/20 border border-white/5 rounded-2xl text-right", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block font-cairo uppercase", children: "حالة صافي مديونية العميل" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1623,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "mt-1", children: (() => {
                const totalPaid = getCustomerTotalPaid(selectedCustomer.id);
                const totalCost = getCustomerTotalCost(selectedCustomer.id);
                const diff = totalPaid - totalCost;
                const curr = getCustomerCurrencyLabel(selectedCustomer.id);
                if (diff > 0.01) {
                  return /* @__PURE__ */ jsxDEV("div", { className: "text-lg font-black text-emerald-400 font-mono", children: [
                    "+",
                    diff.toFixed(2),
                    " ",
                    curr
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1632,
                    columnNumber: 34
                  }, this);
                } else if (diff < -0.01) {
                  return /* @__PURE__ */ jsxDEV("div", { className: "text-lg font-black text-rose-500 font-mono", children: [
                    diff.toFixed(2),
                    " ",
                    curr
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1634,
                    columnNumber: 34
                  }, this);
                } else {
                  return /* @__PURE__ */ jsxDEV("div", { className: "text-lg font-black text-slate-400 font-mono", children: [
                    "0.00 ",
                    curr
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1636,
                    columnNumber: 34
                  }, this);
                }
              })() }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1624,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1622,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1613,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1574,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between border-b border-white/5 pb-2", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] font-black tracking-wider text-orange-500 uppercase font-cairo", children: "بيانات الاتصال والتفاصيل" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1648,
              columnNumber: 21
            }, this),
            !isEditingMode ? /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                onClick: () => {
                  setIsEditingMode(true);
                  setUpdatePastTransactions(true);
                  setEditName(selectedCustomer.name || "");
                  setEditCompanyName(selectedCustomer.companyName || "");
                  setEditPhone1(selectedCustomer.phone1 || "");
                  setEditPhone2(selectedCustomer.phone2 || "");
                  setEditEmail(selectedCustomer.email || "");
                  setEditNotes(selectedCustomer.notes || "");
                },
                className: "px-2.5 py-1 bg-orange-600/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/25 rounded-md text-[10px] font-bold font-cairo transition-all flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsxDEV(Edit2, { size: 10 }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1664,
                    columnNumber: 25
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { children: "تحرير" }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1665,
                    columnNumber: 25
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1650,
                columnNumber: 23
              },
              this
            ) : /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                onClick: () => setIsEditingMode(false),
                className: "px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded-md text-[10px] font-bold font-cairo border border-white/10 transition-all",
                children: "إلغاء التعديل"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1668,
                columnNumber: 23
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1647,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between border-b border-white/5 pb-2", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] font-black tracking-wider text-orange-500 uppercase font-cairo", children: "بيانات الاتصال والتفاصيل (قابلة للتعديل والتحرير)" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1680,
              columnNumber: 21
            }, this),
            !isEditingMode ? /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                onClick: () => {
                  setIsEditingMode(true);
                  setUpdatePastTransactions(true);
                  setEditName(selectedCustomer.name || "");
                  setEditCompanyName(selectedCustomer.companyName || "");
                  setEditPhone1(selectedCustomer.phone1 || "");
                  setEditPhone2(selectedCustomer.phone2 || "");
                  setEditEmail(selectedCustomer.email || "");
                  setEditNotes(selectedCustomer.notes || "");
                },
                className: "px-2.5 py-1 bg-orange-600/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/25 rounded-md text-[10px] font-bold font-cairo transition-all flex items-center gap-1.5",
                children: [
                  /* @__PURE__ */ jsxDEV(Edit2, { size: 10 }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1696,
                    columnNumber: 25
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { children: "تحرير البيانات الأساسية" }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1697,
                    columnNumber: 25
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1682,
                columnNumber: 23
              },
              this
            ) : /* @__PURE__ */ jsxDEV(
              "button",
              {
                type: "button",
                onClick: () => setIsEditingMode(false),
                className: "px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-400 rounded-md text-[10px] font-bold font-cairo border border-white/10 transition-all",
                children: "إلغاء التعديل"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1700,
                columnNumber: 23
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1679,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-400 font-bold block font-cairo", children: "اسم العميل ورابط الحساب:" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1714,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  disabled: !isEditingMode,
                  value: isEditingMode ? editName : selectedCustomer.name,
                  onChange: (e) => setEditName(e.target.value),
                  className: `customer-static-input w-full text-xs font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all font-cairo ${isEditingMode ? "bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none" : "bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none"}`
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1715,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1713,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-400 font-bold block font-cairo", children: "اسم الجهة / الشركة:" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1729,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  disabled: !isEditingMode,
                  value: isEditingMode ? editCompanyName : selectedCustomer.companyName || "",
                  onChange: (e) => setEditCompanyName(e.target.value),
                  placeholder: isEditingMode ? "اسم الشركة أو الجهة إن وجدت..." : "لا يوجد",
                  className: `customer-static-input w-full text-xs font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all font-cairo ${isEditingMode ? "bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none" : "bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none"}`
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1730,
                  columnNumber: 21
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1728,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-400 font-bold block font-cairo", children: "الهاتف الرئيسي:" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1746,
                  columnNumber: 25
                }, this),
                isEditingMode && /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    type: "button",
                    onClick: () => setEditPhone1("لا يوجد"),
                    className: "text-[9px] text-orange-400 hover:text-white bg-white/5 px-2 py-0.5 rounded border border-white/5 font-cairo font-black",
                    children: "تعيين لا يوجد"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 1748,
                    columnNumber: 27
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1745,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  disabled: !isEditingMode,
                  value: isEditingMode ? editPhone1 : selectedCustomer.phone1,
                  onChange: (e) => setEditPhone1(e.target.value),
                  className: `customer-static-input w-full text-xs font-mono font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all ${isEditingMode ? "bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none" : "bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none"}`
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1757,
                  columnNumber: 23
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1744,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-400 font-bold block font-cairo", children: "رقم هاتف ثانوي:" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1772,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "text",
                  disabled: !isEditingMode,
                  value: isEditingMode ? editPhone2 : selectedCustomer.phone2 || "",
                  onChange: (e) => setEditPhone2(e.target.value),
                  placeholder: isEditingMode ? "رقم هاتف إضافي إن وجد..." : "غير مدخل",
                  className: `customer-static-input w-full text-xs font-mono font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all ${isEditingMode ? "bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none" : "bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none"}`
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1773,
                  columnNumber: 23
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1771,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-400 font-bold block font-cairo", children: "البريد الإلكتروني:" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1789,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "email",
                  disabled: !isEditingMode,
                  value: isEditingMode ? editEmail : selectedCustomer.email || "",
                  onChange: (e) => setEditEmail(e.target.value),
                  placeholder: isEditingMode ? "customer@domain.com" : "غير مدخل",
                  className: `customer-static-input w-full text-xs font-mono font-bold text-right py-2.5 px-3.5 border rounded-xl transition-all ${isEditingMode ? "bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none" : "bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none"}`
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1790,
                  columnNumber: 23
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1788,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "space-y-1 text-right md:col-span-2", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-400 font-bold block font-cairo", children: "تفاصيل وملاحظات إضافية:" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1806,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV(
                "textarea",
                {
                  disabled: !isEditingMode,
                  value: isEditingMode ? editNotes : selectedCustomer.notes || "",
                  onChange: (e) => setEditNotes(e.target.value),
                  rows: 2,
                  placeholder: isEditingMode ? "اكتب أية ملاحظات تفصيلية أو عنونة أخرى للعميل..." : "لا توجد ملاحظات مسجلة للعميل",
                  className: `customer-static-input w-full text-xs font-bold text-right py-2 px-3.5 border rounded-xl transition-all resize-none ${isEditingMode ? "bg-black/50 border-white/10 text-white focus:border-orange-500 outline-none font-cairo" : "bg-[#161616] border-white/5 text-gray-400 cursor-not-allowed select-none font-cairo"}`
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1807,
                  columnNumber: 23
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1805,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1710,
            columnNumber: 19
          }, this),
          isEditingMode && /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between pt-3 border-t border-white/5", children: [
            /* @__PURE__ */ jsxDEV("label", { className: "flex items-center gap-2 cursor-pointer", children: [
              /* @__PURE__ */ jsxDEV(
                "input",
                {
                  type: "checkbox",
                  checked: updatePastTransactions,
                  onChange: (e) => setUpdatePastTransactions(e.target.checked),
                  className: "w-3 h-3 md:w-4 md:h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 bg-black/50"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1827,
                  columnNumber: 23
                },
                this
              ),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] md:text-[10px] text-gray-400 font-bold font-cairo", children: "شامل التعاملات السابقة (الفواتير والقيود)" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1833,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1826,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  onClick: () => setIsEditingMode(false),
                  className: "px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-[10px] font-bold font-cairo border border-white/5 transition-all",
                  children: "إلغاء التعديل"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1836,
                  columnNumber: 23
                },
                this
              ),
              /* @__PURE__ */ jsxDEV(
                "button",
                {
                  type: "button",
                  disabled: editName.trim() === "" || editPhone1.trim() === "" || isSavingInProcess,
                  onClick: handleUpdateCustomer,
                  className: `px-4.5 py-1.5 font-black font-cairo text-[10px] border rounded-lg shadow-lg flex items-center gap-1.5 transition-all ${editName.trim() !== "" && editPhone1.trim() !== "" && !isSavingInProcess ? "bg-orange-600 border-orange-600 text-white hover:bg-orange-500" : "bg-white/10 border-white/5 text-gray-500 cursor-not-allowed"}`,
                  children: isSavingInProcess ? "جاري الحفظ..." : "حفظ التعديلات"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1843,
                  columnNumber: 23
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1835,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1825,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1646,
          columnNumber: 18
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1645,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 1572,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/Customers.tsx",
      lineNumber: 1557,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/Customers.tsx",
      lineNumber: 1556,
      columnNumber: 9
    }, this),
    showLogModal && selectedCustomer && (() => {
      const matchesCustomer = (inv) => {
        if (!inv || !selectedCustomer) return false;
        if (inv.customerId && selectedCustomer.id && inv.customerId === selectedCustomer.id) return true;
        const cleanPhone = (p) => p ? p.replace(/[\s\-\+\(\)]/g, "") : "";
        const cleanName = (n) => n ? n.trim().toLowerCase() : "";
        if (inv.customerPhone && (selectedCustomer.phone1 || selectedCustomer.phone2)) {
          const invP = cleanPhone(inv.customerPhone);
          if (invP) {
            if (selectedCustomer.phone1 && cleanPhone(selectedCustomer.phone1) === invP) return true;
            if (selectedCustomer.phone2 && cleanPhone(selectedCustomer.phone2) === invP) return true;
          }
        }
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
        const invItems = items.filter((it) => it.invoiceNumber === inv.invoiceNumber);
        return sum + getInvoiceActualCost(invItems);
      }, 0);
      const totalPaidVal = allInvs.reduce((sum, inv) => sum + Number(inv.amountPaid || 0), 0);
      const totalRemainingVal = Math.max(0, totalBilledVal - totalPaidVal);
      const totalDevices = allInvs.reduce((sum, inv) => {
        const invItems = items.filter((it) => it.invoiceNumber === inv.invoiceNumber);
        return sum + invItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);
      }, 0);
      const cLabel = getCustomerCurrencyLabel(selectedCustomer.id);
      const filteredInvs = allInvs.filter((inv) => {
        if (!logSearch) return true;
        const s = logSearch.toLowerCase();
        const formattedDateStr = inv.createdAt ? (function() {
          const d = parseDate(inv.createdAt);
          return d ? d.toLocaleDateString("ar-YE") : "";
        })() : "";
        const invItems = items.filter((it) => it.invoiceNumber === inv.invoiceNumber);
        const deviceMatches = invItems.some(
          (it) => it.deviceName?.toLowerCase().includes(s) || it.serialNumber?.toLowerCase().includes(s)
        );
        return inv.invoiceNumber?.toLowerCase().includes(s) || formattedDateStr.includes(s) || deviceMatches;
      }).sort((a, b) => Number(b.invoiceNumber || 0) - Number(a.invoiceNumber || 0));
      return /* @__PURE__ */ jsxDEV("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-1.5 md:p-4 overflow-hidden", children: /* @__PURE__ */ jsxDEV("div", { className: "customer-modal-bg bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-7xl h-[94vh] p-3 md:p-5 space-y-3.5 shadow-2xl relative text-right flex flex-col", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 gap-3 shrink-0 print:hidden", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxDEV(
              "button",
              {
                onClick: () => {
                  setShowLogModal(false);
                  setLogSearch("");
                  setSelectedLogInvoice(null);
                },
                className: "p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all border border-white/5 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95",
                title: "إغلاق",
                children: /* @__PURE__ */ jsxDEV(X, { size: 18 }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1952,
                  columnNumber: 21
                }, this)
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1943,
                columnNumber: 19
              },
              this
            ),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2.5", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "p-2 bg-orange-600/10 rounded-lg border border-orange-500/20 shrink-0", children: /* @__PURE__ */ jsxDEV(FileText, { size: 20, className: "text-orange-500" }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1956,
                columnNumber: 23
              }, this) }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1955,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDEV("div", { children: [
                /* @__PURE__ */ jsxDEV("h3", { className: "text-base md:text-lg font-black text-white font-cairo tracking-tight", children: "سجل فواتير العميل الشامل" }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1959,
                  columnNumber: 23
                }, this),
                /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-gray-400 font-bold mt-0.5", children: selectedCustomer.name }, void 0, false, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 1960,
                  columnNumber: 23
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1958,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1954,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1942,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "relative w-full sm:w-72", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500", children: /* @__PURE__ */ jsxDEV(Search, { size: 15 }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1968,
              columnNumber: 21
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1967,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV(
              "input",
              {
                type: "text",
                placeholder: "ابحث برقم الفاتورة أو التاريخ أو الأجهزة...",
                value: logSearch,
                onChange: (e) => setLogSearch(e.target.value),
                className: "w-full text-right pr-9 pl-3 py-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-cairo"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1970,
                columnNumber: 19
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1966,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1941,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 md:grid-cols-5 gap-2 shrink-0", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "p-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl text-right hover:border-white/10 transition-all flex flex-col justify-center", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-gray-400 block mb-0.5 font-cairo", children: "إجمالي الفواتير" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1983,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-base md:text-xl font-black text-white font-mono", children: totalInvsCount }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1984,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1982,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "p-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl text-right hover:border-white/10 transition-all flex flex-col justify-center", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-gray-400 block mb-0.5 font-cairo", children: "إجمالي الأجهزة" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1987,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-base md:text-xl font-black text-white font-mono", children: totalDevices }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1988,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1986,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "p-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl text-right hover:border-white/10 transition-all flex flex-col justify-center", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-gray-400 block mb-0.5 font-cairo", children: "إجمالي المطالبات" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1991,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-base md:text-xl font-black text-orange-400 font-mono", children: [
              totalBilledVal.toFixed(2),
              " ",
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold", children: cLabel }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1993,
                columnNumber: 49
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1992,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1990,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "p-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl text-right hover:border-white/10 transition-all flex flex-col justify-center", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-gray-400 block mb-0.5 font-cairo", children: "إجمالي المدفوع" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1997,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-base md:text-xl font-black text-emerald-400 font-mono", children: [
              totalPaidVal.toFixed(2),
              " ",
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-emerald-500/60 font-bold", children: cLabel }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 1999,
                columnNumber: 47
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 1998,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 1996,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "p-2 px-3 bg-white/[0.02] border border-white/5 rounded-xl text-right col-span-2 md:col-span-1 hover:border-white/10 transition-all flex flex-col justify-center", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-bold text-gray-400 block mb-0.5 font-cairo", children: "إجمالي المتبقي" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 2003,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: `text-base md:text-xl font-black font-mono ${totalRemainingVal > 0.01 ? "text-rose-500" : "text-emerald-400"}`, children: [
              totalRemainingVal.toFixed(2),
              " ",
              /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold", children: cLabel }, void 0, false, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 2005,
                columnNumber: 52
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 2004,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 2002,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 1981,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex-1 bg-[#111] rounded-xl border border-white/5 overflow-hidden flex flex-col min-h-0", children: filteredInvs.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "text-center my-auto py-12 text-gray-500 flex flex-col items-center justify-center", children: [
          /* @__PURE__ */ jsxDEV(FileText, { size: 36, className: "mb-2 text-gray-600 opacity-60" }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 2014,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs md:text-sm font-bold font-cairo", children: "لا توجد فواتير مطابقة لعملية البحث للعميل" }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 2015,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-gray-500 font-cairo mt-0.5", children: "جرب إدخال رقم فاتورة صحيح أو اسم جهاز" }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 2016,
            columnNumber: 21
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 2013,
          columnNumber: 19
        }, this) : /* @__PURE__ */ jsxDEV("div", { className: "overflow-auto flex-1 scrollbar-thin scrollbar-thumb-white/10", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full text-right border-collapse text-xs", children: [
          /* @__PURE__ */ jsxDEV("thead", { className: "sticky top-0 z-10 bg-[#161616] border-b border-white/10 text-gray-300 font-cairo text-[11px] md:text-xs", children: /* @__PURE__ */ jsxDEV("tr", { children: [
            /* @__PURE__ */ jsxDEV("th", { className: "px-3.5 py-2.5 font-black border-l border-white/5 w-16", children: "# الفاتورة" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 2023,
              columnNumber: 27
            }, this),
            /* @__PURE__ */ jsxDEV("th", { className: "px-3.5 py-2.5 font-black border-l border-white/5 w-24", children: "التاريخ" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 2024,
              columnNumber: 27
            }, this),
            /* @__PURE__ */ jsxDEV("th", { className: "px-3.5 py-2.5 font-black border-l border-white/5", children: "الأجهزة والخدمات داخل الفاتورة" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 2025,
              columnNumber: 27
            }, this),
            /* @__PURE__ */ jsxDEV("th", { className: "px-3.5 py-2.5 font-black border-l border-white/5 w-28", children: "القيمة الإجمالية" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 2026,
              columnNumber: 27
            }, this),
            /* @__PURE__ */ jsxDEV("th", { className: "px-3.5 py-2.5 font-black border-l border-white/5 w-28", children: "المبلغ المدفوع" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 2027,
              columnNumber: 27
            }, this),
            /* @__PURE__ */ jsxDEV("th", { className: "px-3.5 py-2.5 font-black border-l border-white/5 w-28", children: "المبلغ المتبقي" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 2028,
              columnNumber: 27
            }, this),
            /* @__PURE__ */ jsxDEV("th", { className: "px-3.5 py-2.5 text-center font-black w-40", children: "الإجراء" }, void 0, false, {
              fileName: "/app/applet/src/components/Customers.tsx",
              lineNumber: 2029,
              columnNumber: 27
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 2022,
            columnNumber: 25
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 2021,
            columnNumber: 23
          }, this),
          /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-white/5 text-slate-300 font-cairo", children: filteredInvs.map((inv, index) => {
            const invItems = items.filter((it) => it.invoiceNumber === inv.invoiceNumber);
            const actualCost = getInvoiceActualCost(invItems);
            const remainingForInv = Math.max(0, actualCost - Number(inv.amountPaid || 0));
            const curr = getCustomerCurrencyLabel(selectedCustomer.id);
            const isSelected = selectedLogInvoice && selectedLogInvoice.invoiceNumber === inv.invoiceNumber;
            return /* @__PURE__ */ jsxDEV(
              "tr",
              {
                onClick: () => setSelectedLogInvoice(inv),
                className: `hover:bg-white/[0.04] even:bg-white/[0.01] cursor-pointer transition-colors ${isSelected ? "bg-orange-600/15 border-r-4 border-r-orange-500" : ""}`,
                children: [
                  /* @__PURE__ */ jsxDEV("td", { className: "px-3.5 py-2.5 font-mono font-black text-white text-xs border-l border-white/5", children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "text-orange-500 font-bold", children: "#" }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2048,
                      columnNumber: 33
                    }, this),
                    inv.invoiceNumber
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2047,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "px-3.5 py-2.5 font-mono text-slate-400 border-l border-white/5 whitespace-nowrap text-[11px]", children: inv.createdAt ? (function() {
                    const d = parseDate(inv.createdAt);
                    return d ? d.toLocaleDateString("ar-YE", { year: "numeric", month: "2-digit", day: "2-digit" }) : "---";
                  })() : "---" }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2052,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "px-3.5 py-2.5 border-l border-white/5 max-w-md", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin", children: invItems.length === 0 ? /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold", children: "لا توجد أجهزة مضافة" }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2066,
                    columnNumber: 37
                  }, this) : invItems.map((item, idx) => /* @__PURE__ */ jsxDEV("div", { className: "inline-flex items-center gap-1 bg-white/[0.03] px-2 py-0.5 rounded border border-white/5 text-[10px] hover:bg-white/[0.06] transition-all whitespace-nowrap", children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-white max-w-[130px] truncate", children: item.deviceName || "جهاز" }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2070,
                      columnNumber: 41
                    }, this),
                    item.serialNumber && /* @__PURE__ */ jsxDEV("span", { className: "text-gray-500 font-mono text-[9px]", children: [
                      "(",
                      item.serialNumber,
                      ")"
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2071,
                      columnNumber: 63
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: `px-1 py-[0.5px] rounded text-[8px] font-black scale-90 ${getStatusStyle(item.status || "10")}`, children: getStatusTextArabic(item.status || "10") }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2072,
                      columnNumber: 41
                    }, this)
                  ] }, item.id || idx, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2069,
                    columnNumber: 39
                  }, this)) }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2064,
                    columnNumber: 33
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2063,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "px-3.5 py-2.5 font-mono text-orange-400 font-black text-xs border-l border-white/5 whitespace-nowrap", children: [
                    actualCost.toFixed(2),
                    " ",
                    /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold", children: curr }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2083,
                      columnNumber: 57
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2082,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "px-3.5 py-2.5 font-mono text-emerald-400 font-black text-xs border-l border-white/5 whitespace-nowrap", children: [
                    Number(inv.amountPaid || 0).toFixed(2),
                    " ",
                    /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-emerald-500/60 font-bold", children: curr }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2088,
                      columnNumber: 74
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2087,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "px-3.5 py-2.5 font-mono text-xs border-l border-white/5 whitespace-nowrap", children: [
                    /* @__PURE__ */ jsxDEV("span", { className: `font-black ${remainingForInv > 0.01 ? "text-rose-500" : "text-emerald-400"}`, children: remainingForInv.toFixed(2) }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2093,
                      columnNumber: 33
                    }, this),
                    " ",
                    /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold", children: curr }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2096,
                      columnNumber: 33
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2092,
                    columnNumber: 31
                  }, this),
                  /* @__PURE__ */ jsxDEV("td", { className: "px-3.5 py-2.5 text-center whitespace-nowrap", children: /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-center gap-1.5", onClick: (e) => e.stopPropagation(), children: [
                    /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        onClick: () => setSelectedLogInvoice(inv),
                        className: `px-2.5 py-1 rounded-md transition-all border text-[10px] font-black cursor-pointer inline-flex items-center gap-1 hover:scale-105 active:scale-95 ${isSelected ? "bg-orange-600 text-white border-orange-500/30" : "bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white border-amber-500/20"}`,
                        title: "تفاصيل الأصناف والقطع",
                        children: [
                          /* @__PURE__ */ jsxDEV(Eye, { size: 12 }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2107,
                            columnNumber: 37
                          }, this),
                          /* @__PURE__ */ jsxDEV("span", { children: "الأصناف والقطع" }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2108,
                            columnNumber: 37
                          }, this)
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "/app/applet/src/components/Customers.tsx",
                        lineNumber: 2102,
                        columnNumber: 35
                      },
                      this
                    ),
                    /* @__PURE__ */ jsxDEV(
                      "button",
                      {
                        onClick: () => {
                          setPreviewData({
                            type: "invoice",
                            data: {
                              invoice: {
                                ...inv,
                                customerPhone: selectedCustomer?.phone1 || inv.customerPhone || ""
                              },
                              items: invItems
                            }
                          });
                        },
                        className: "px-2.5 py-1 bg-orange-600/10 hover:bg-orange-600 text-orange-400 hover:text-white rounded-md transition-all border border-orange-500/20 text-[10px] font-black cursor-pointer inline-flex items-center gap-1 hover:scale-105 active:scale-95",
                        title: "عرض الفاتورة",
                        children: [
                          /* @__PURE__ */ jsxDEV(Printer, { size: 12 }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2127,
                            columnNumber: 37
                          }, this),
                          /* @__PURE__ */ jsxDEV("span", { children: "عرض الفاتورة" }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2128,
                            columnNumber: 37
                          }, this)
                        ]
                      },
                      void 0,
                      true,
                      {
                        fileName: "/app/applet/src/components/Customers.tsx",
                        lineNumber: 2111,
                        columnNumber: 35
                      },
                      this
                    )
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2101,
                    columnNumber: 33
                  }, this) }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2100,
                    columnNumber: 31
                  }, this)
                ]
              },
              inv.id || index,
              true,
              {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 2041,
                columnNumber: 29
              },
              this
            );
          }) }, void 0, false, {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 2032,
            columnNumber: 23
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 2020,
          columnNumber: 21
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 2019,
          columnNumber: 19
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 2011,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "border-t border-white/5 pt-2 shrink-0 text-right", children: /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] md:text-xs text-gray-400 font-bold", children: 'يمكنك النقر على أي فاتورة في الجدول أعلاه أو استخدام زر "الأصناف والقطع" لفتح نافذة جانبية تعرض تفاصيل الأجهزة وقطع الغيار فوراً.' }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 2143,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/Customers.tsx",
          lineNumber: 2142,
          columnNumber: 15
        }, this),
        selectedLogInvoice && /* @__PURE__ */ jsxDEV(
          motion.div,
          {
            initial: { x: "100%", opacity: 0 },
            animate: { x: 0, opacity: 1 },
            exit: { x: "100%", opacity: 0 },
            transition: { type: "spring", damping: 25, stiffness: 220 },
            className: "absolute left-0 top-0 bottom-0 h-full w-full max-w-[480px] sm:max-w-[550px] bg-[#0c0c0c] border-r border-white/10 z-50 rounded-r-none rounded-l-2xl shadow-[15px_0_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-right font-cairo",
            dir: "rtl",
            children: [
              /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-white/[0.03] border-b border-white/5 flex items-center justify-between shrink-0", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2.5", children: [
                  /* @__PURE__ */ jsxDEV(
                    "button",
                    {
                      onClick: () => setSelectedLogInvoice(null),
                      className: "p-2 bg-white/5 hover:bg-red-600/20 text-gray-400 hover:text-red-400 rounded-xl transition-all cursor-pointer border border-white/5 active:scale-95",
                      title: "إغلاق",
                      children: /* @__PURE__ */ jsxDEV(X, { size: 18 }, void 0, false, {
                        fileName: "/app/applet/src/components/Customers.tsx",
                        lineNumber: 2164,
                        columnNumber: 25
                      }, this)
                    },
                    void 0,
                    false,
                    {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2159,
                      columnNumber: 23
                    },
                    this
                  ),
                  /* @__PURE__ */ jsxDEV("div", { children: [
                    /* @__PURE__ */ jsxDEV("h4", { className: "text-xs sm:text-sm font-black text-white", children: "تفاصيل أصناف الفاتورة والقطع" }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2167,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-orange-500 font-mono font-black mt-0.5", children: [
                      "#",
                      selectedLogInvoice.invoiceNumber
                    ] }, void 0, true, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2168,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2166,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 2158,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "text-left font-mono", children: [
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] text-gray-500 font-bold block", children: "التاريخ" }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2172,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] text-gray-300 font-bold", children: selectedLogInvoice.createdAt ? (function() {
                    const d = parseDate(selectedLogInvoice.createdAt);
                    return d ? d.toLocaleDateString("ar-YE", { year: "numeric", month: "2-digit", day: "2-digit" }) : "---";
                  })() : "---" }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2173,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 2171,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 2157,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "flex-1 overflow-y-auto p-4 md:p-5 space-y-4.5 scrollbar-thin scrollbar-thumb-white/10", children: [
                /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-white/[0.01] border border-white/5 rounded-2xl grid grid-cols-3 gap-2 text-center", children: [
                  /* @__PURE__ */ jsxDEV("div", { children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] text-gray-500 font-bold block mb-1", children: "المطالبة الكلية" }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2190,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "text-xs sm:text-sm font-black text-orange-400 font-mono", children: getInvoiceActualCost(items.filter((it) => it.invoiceNumber === selectedLogInvoice.invoiceNumber)).toFixed(2) }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2191,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2189,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { className: "border-x border-white/5", children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] text-gray-500 font-bold block mb-1", children: "المدفوع" }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2196,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: "text-xs sm:text-sm font-black text-emerald-400 font-mono", children: Number(selectedLogInvoice.amountPaid || 0).toFixed(2) }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2197,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2195,
                    columnNumber: 23
                  }, this),
                  /* @__PURE__ */ jsxDEV("div", { children: [
                    /* @__PURE__ */ jsxDEV("span", { className: "text-[9px] text-gray-500 font-bold block mb-1", children: "المتبقي" }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2202,
                      columnNumber: 25
                    }, this),
                    /* @__PURE__ */ jsxDEV("span", { className: `text-xs sm:text-sm font-black font-mono ${Math.max(0, getInvoiceActualCost(items.filter((it) => it.invoiceNumber === selectedLogInvoice.invoiceNumber)) - Number(selectedLogInvoice.amountPaid || 0)) > 0.01 ? "text-rose-500" : "text-emerald-400"}`, children: Math.max(0, getInvoiceActualCost(items.filter((it) => it.invoiceNumber === selectedLogInvoice.invoiceNumber)) - Number(selectedLogInvoice.amountPaid || 0)).toFixed(2) }, void 0, false, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2203,
                      columnNumber: 25
                    }, this)
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2201,
                    columnNumber: 23
                  }, this)
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 2188,
                  columnNumber: 21
                }, this),
                /* @__PURE__ */ jsxDEV("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxDEV("h5", { className: "text-xs font-black text-gray-300 border-r-2 border-orange-500 pr-2", children: [
                    "الأجهزة والخدمات بالفاتورة (",
                    items.filter((it) => it.invoiceNumber === selectedLogInvoice.invoiceNumber).length,
                    ")"
                  ] }, void 0, true, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2211,
                    columnNumber: 23
                  }, this),
                  items.filter((it) => it.invoiceNumber === selectedLogInvoice.invoiceNumber).length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "p-8 text-center text-gray-500 text-xs bg-white/[0.01] border border-white/5 rounded-xl", children: "لا توجد أجهزة مسجلة في هذه الفاتورة." }, void 0, false, {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2214,
                    columnNumber: 25
                  }, this) : items.filter((it) => it.invoiceNumber === selectedLogInvoice.invoiceNumber).map((it, idx) => {
                    const hasParts = it.partsUsed && Array.isArray(it.partsUsed) && it.partsUsed.length > 0;
                    const partsTotal = hasParts ? it.partsUsed.reduce((sum, p) => sum + Number(p.cost || 0), 0) : 0;
                    const laborCost = Math.max(0, Number(it.cost || 0) - partsTotal);
                    const curr = getCustomerCurrencyLabel(selectedCustomer.id);
                    return /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3.5 hover:border-white/10 transition-all relative overflow-hidden", children: [
                      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between border-b border-white/5 pb-2.5", children: [
                        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-mono font-black text-white bg-white/5 px-2 py-0.5 rounded border border-white/5", children: idx + 1 }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2229,
                            columnNumber: 35
                          }, this),
                          /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-black text-white", children: it.deviceName || "جهاز صيانة" }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2230,
                            columnNumber: 35
                          }, this)
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/components/Customers.tsx",
                          lineNumber: 2228,
                          columnNumber: 33
                        }, this),
                        /* @__PURE__ */ jsxDEV("span", { className: `px-2.5 py-0.5 rounded text-[10px] font-black ${getStatusStyle(it.status || "10")}`, children: getStatusTextArabic(it.status || "10") }, void 0, false, {
                          fileName: "/app/applet/src/components/Customers.tsx",
                          lineNumber: 2232,
                          columnNumber: 33
                        }, this)
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/components/Customers.tsx",
                        lineNumber: 2227,
                        columnNumber: 31
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 gap-x-4 gap-y-3 text-xs", children: [
                        /* @__PURE__ */ jsxDEV("div", { children: [
                          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block mb-0.5", children: "تصنيف الجهاز" }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2240,
                            columnNumber: 35
                          }, this),
                          /* @__PURE__ */ jsxDEV("span", { className: "text-gray-200 font-bold font-cairo", children: it.deviceType || "غير محدد" }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2241,
                            columnNumber: 35
                          }, this)
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/components/Customers.tsx",
                          lineNumber: 2239,
                          columnNumber: 33
                        }, this),
                        it.serialNumber && /* @__PURE__ */ jsxDEV("div", { children: [
                          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block mb-0.5", children: "الرقم التسلسلي S/N" }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2245,
                            columnNumber: 37
                          }, this),
                          /* @__PURE__ */ jsxDEV("span", { className: "text-gray-200 font-mono font-bold", children: it.serialNumber }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2246,
                            columnNumber: 37
                          }, this)
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/components/Customers.tsx",
                          lineNumber: 2244,
                          columnNumber: 35
                        }, this),
                        /* @__PURE__ */ jsxDEV("div", { className: "col-span-2 bg-[#161616]/40 p-2.5 rounded-xl border border-white/5", children: [
                          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-amber-500/80 font-black block mb-1", children: "الشكوى والمشكلة الموصوفة:" }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2250,
                            columnNumber: 35
                          }, this),
                          /* @__PURE__ */ jsxDEV("span", { className: "text-amber-100 font-bold block leading-relaxed", children: it.faultType || it.customerProblem || "لم يحدد" }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2251,
                            columnNumber: 35
                          }, this)
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/components/Customers.tsx",
                          lineNumber: 2249,
                          columnNumber: 33
                        }, this),
                        /* @__PURE__ */ jsxDEV("div", { className: "col-span-2 bg-emerald-950/10 p-2.5 rounded-xl border border-emerald-500/10", children: [
                          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-emerald-400 font-black block mb-1", children: "تقرير الصيانة والإصلاح الفني:" }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2254,
                            columnNumber: 35
                          }, this),
                          /* @__PURE__ */ jsxDEV("span", { className: "text-slate-300 font-bold block leading-relaxed", children: it.technicalNotes || it.engineerReport || "تحت الفحص الفني والتشخيص حالياً" }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2255,
                            columnNumber: 35
                          }, this)
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/components/Customers.tsx",
                          lineNumber: 2253,
                          columnNumber: 33
                        }, this),
                        it.technician && /* @__PURE__ */ jsxDEV("div", { children: [
                          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block mb-0.5", children: "المهندس الفني" }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2259,
                            columnNumber: 37
                          }, this),
                          /* @__PURE__ */ jsxDEV("span", { className: "text-gray-200 font-bold", children: it.technician }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2260,
                            columnNumber: 37
                          }, this)
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/components/Customers.tsx",
                          lineNumber: 2258,
                          columnNumber: 35
                        }, this),
                        /* @__PURE__ */ jsxDEV("div", { children: [
                          /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold block mb-0.5", children: "إجمالي التكلفة" }, void 0, false, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2264,
                            columnNumber: 35
                          }, this),
                          /* @__PURE__ */ jsxDEV("span", { className: "text-orange-400 font-mono font-black", children: [
                            Number(it.cost || 0).toFixed(2),
                            " ",
                            /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] text-gray-500 font-bold", children: curr }, void 0, false, {
                              fileName: "/app/applet/src/components/Customers.tsx",
                              lineNumber: 2265,
                              columnNumber: 124
                            }, this)
                          ] }, void 0, true, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2265,
                            columnNumber: 35
                          }, this)
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/components/Customers.tsx",
                          lineNumber: 2263,
                          columnNumber: 33
                        }, this)
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/components/Customers.tsx",
                        lineNumber: 2238,
                        columnNumber: 31
                      }, this),
                      /* @__PURE__ */ jsxDEV("div", { className: "border-t border-white/5 pt-3 mt-1", children: [
                        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between mb-2", children: [
                          /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] font-black text-gray-300 flex items-center gap-1.5", children: [
                            /* @__PURE__ */ jsxDEV("span", { className: "w-1.5 h-1.5 bg-orange-500 rounded-full" }, void 0, false, {
                              fileName: "/app/applet/src/components/Customers.tsx",
                              lineNumber: 2273,
                              columnNumber: 37
                            }, this),
                            "قطع الغيار المستخدمة"
                          ] }, void 0, true, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2272,
                            columnNumber: 35
                          }, this),
                          hasParts && /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] font-mono text-gray-400", children: [
                            "المجموع: ",
                            partsTotal.toFixed(2),
                            " ",
                            curr
                          ] }, void 0, true, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2277,
                            columnNumber: 37
                          }, this)
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/components/Customers.tsx",
                          lineNumber: 2271,
                          columnNumber: 33
                        }, this),
                        hasParts ? /* @__PURE__ */ jsxDEV("div", { className: "space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5", children: [
                          it.partsUsed.map((part, pIdx) => /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between text-[11px] text-slate-300 py-0.5", children: [
                            /* @__PURE__ */ jsxDEV("span", { className: "font-bold", children: part.name }, void 0, false, {
                              fileName: "/app/applet/src/components/Customers.tsx",
                              lineNumber: 2287,
                              columnNumber: 41
                            }, this),
                            /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-black text-orange-400", children: [
                              Number(part.cost || 0).toFixed(2),
                              " ",
                              curr
                            ] }, void 0, true, {
                              fileName: "/app/applet/src/components/Customers.tsx",
                              lineNumber: 2288,
                              columnNumber: 41
                            }, this)
                          ] }, pIdx, true, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2286,
                            columnNumber: 39
                          }, this)),
                          /* @__PURE__ */ jsxDEV("div", { className: "border-t border-white/5 pt-1.5 mt-1.5 flex justify-between text-[10px] text-gray-400", children: [
                            /* @__PURE__ */ jsxDEV("span", { children: "أجور الصيانة (بدون قطع):" }, void 0, false, {
                              fileName: "/app/applet/src/components/Customers.tsx",
                              lineNumber: 2292,
                              columnNumber: 39
                            }, this),
                            /* @__PURE__ */ jsxDEV("span", { className: "font-mono font-bold text-gray-300", children: [
                              laborCost.toFixed(2),
                              " ",
                              curr
                            ] }, void 0, true, {
                              fileName: "/app/applet/src/components/Customers.tsx",
                              lineNumber: 2293,
                              columnNumber: 39
                            }, this)
                          ] }, void 0, true, {
                            fileName: "/app/applet/src/components/Customers.tsx",
                            lineNumber: 2291,
                            columnNumber: 37
                          }, this)
                        ] }, void 0, true, {
                          fileName: "/app/applet/src/components/Customers.tsx",
                          lineNumber: 2284,
                          columnNumber: 35
                        }, this) : /* @__PURE__ */ jsxDEV("div", { className: "text-center py-2 text-gray-500 text-[10px] bg-black/20 rounded-xl border border-dashed border-white/5 font-bold", children: "لا توجد قطع غيار مسجلة لهذا الجهاز بشكل مستقل." }, void 0, false, {
                          fileName: "/app/applet/src/components/Customers.tsx",
                          lineNumber: 2297,
                          columnNumber: 35
                        }, this)
                      ] }, void 0, true, {
                        fileName: "/app/applet/src/components/Customers.tsx",
                        lineNumber: 2270,
                        columnNumber: 31
                      }, this)
                    ] }, it.id || idx, true, {
                      fileName: "/app/applet/src/components/Customers.tsx",
                      lineNumber: 2225,
                      columnNumber: 29
                    }, this);
                  })
                ] }, void 0, true, {
                  fileName: "/app/applet/src/components/Customers.tsx",
                  lineNumber: 2210,
                  columnNumber: 21
                }, this)
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 2186,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: "p-4 bg-white/[0.03] border-t border-white/5 flex items-center justify-between shrink-0", children: [
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    onClick: () => setSelectedLogInvoice(null),
                    className: "px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95",
                    children: "إغلاق التفاصيل"
                  },
                  void 0,
                  false,
                  {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2311,
                    columnNumber: 21
                  },
                  this
                ),
                /* @__PURE__ */ jsxDEV(
                  "button",
                  {
                    onClick: () => {
                      setPreviewData({
                        type: "invoice",
                        data: {
                          invoice: {
                            ...selectedLogInvoice,
                            customerPhone: selectedCustomer?.phone1 || selectedLogInvoice.customerPhone || ""
                          },
                          items: items.filter((it) => it.invoiceNumber === selectedLogInvoice.invoiceNumber)
                        }
                      });
                    },
                    className: "px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-lg shadow-orange-600/10",
                    children: [
                      /* @__PURE__ */ jsxDEV(Printer, { size: 13 }, void 0, false, {
                        fileName: "/app/applet/src/components/Customers.tsx",
                        lineNumber: 2332,
                        columnNumber: 23
                      }, this),
                      /* @__PURE__ */ jsxDEV("span", { children: "عرض وطباعة الفاتورة" }, void 0, false, {
                        fileName: "/app/applet/src/components/Customers.tsx",
                        lineNumber: 2333,
                        columnNumber: 23
                      }, this)
                    ]
                  },
                  void 0,
                  true,
                  {
                    fileName: "/app/applet/src/components/Customers.tsx",
                    lineNumber: 2317,
                    columnNumber: 21
                  },
                  this
                )
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/Customers.tsx",
                lineNumber: 2310,
                columnNumber: 19
              }, this)
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/Customers.tsx",
            lineNumber: 2148,
            columnNumber: 17
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 1939,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 1938,
        columnNumber: 11
      }, this);
    })(),
    previewData && /* @__PURE__ */ jsxDEV(
      PrintPreviewOverlay,
      {
        type: previewData.type,
        data: previewData.data,
        onClose: () => setPreviewData(null),
        shopConfig,
        user
      },
      void 0,
      false,
      {
        fileName: "/app/applet/src/components/Customers.tsx",
        lineNumber: 2345,
        columnNumber: 9
      },
      this
    )
  ] }, void 0, true, {
    fileName: "/app/applet/src/components/Customers.tsx",
    lineNumber: 740,
    columnNumber: 5
  }, this);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkN1c3RvbWVycy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3VzdG9tZXJBdXRvY29tcGxldGUgfSBmcm9tICcuL0N1c3RvbWVyQXV0b2NvbXBsZXRlJztcbmltcG9ydCBBZGRDdXN0b21lck1vZGFsIGZyb20gJy4vQWRkQ3VzdG9tZXJNb2RhbCc7XG5pbXBvcnQgeyBzaGFyZVBkZkZpbGUsIG9wZW5XaGF0c0FwcCwgc2VuZFVuaXZlcnNhbFJlbWluZGVyIH0gZnJvbSAnLi4vbGliL3NoYXJlSGVscGVyJztcbmltcG9ydCBQcmludFByZXZpZXdPdmVybGF5IGZyb20gJy4vUHJpbnRQcmV2aWV3T3ZlcmxheSc7XG5pbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IG1vdGlvbiB9IGZyb20gJ21vdGlvbi9yZWFjdCc7XG5pbXBvcnQgeyBjb2xsZWN0aW9uLCBvblNuYXBzaG90LCBxdWVyeSwgb3JkZXJCeSwgZG9jLCBnZXREb2MsIHNldERvYywgdXBkYXRlRG9jLCB3cml0ZUJhdGNoLCBzZXJ2ZXJUaW1lc3RhbXAgfSBmcm9tICcuLi9maXJlYmFzZSc7XG5pbXBvcnQgeyBkYiB9IGZyb20gJy4uL2ZpcmViYXNlJztcbmltcG9ydCB7IFVzZXIsIFBob25lLCBTbWFydHBob25lLCBBbGVydFRyaWFuZ2xlLCBDaGVja0NpcmNsZSwgUGFja2FnZSwgQXJyb3dMZWZ0LCBBcnJvd1VwUmlnaHQsIEFycm93UmlnaHQsIExvZ091dCwgU2VhcmNoLCBGaWxlVGV4dCwgQ2hldnJvbkxlZnQsIEV5ZSwgQ2xvY2ssIERvbGxhclNpZ24sIFgsIFVzZXJzLCBBcnJvd1VwRG93biwgUGx1cywgRWRpdDIsIENoZWNrLCBCdWlsZGluZywgTWFpbCwgUHJpbnRlciwgVXNlclBsdXMsIE1lc3NhZ2VDaXJjbGUsIE1hcFBpbiwgRmFjZWJvb2sgfSBmcm9tICdsdWNpZGUtcmVhY3QnO1xuaW1wb3J0IHsgQ3VzdG9tZXIsIEludm9pY2UsIEludm9pY2VJdGVtLCBVc2VyIGFzIFN5c3RlbVVzZXIsIFNob3BDb25maWcgfSBmcm9tICcuLi90eXBlcyc7XG5pbXBvcnQgeyB1c2VCYWNrSGFuZGxlciB9IGZyb20gJy4uL2hvb2tzL3VzZUJhY2tIYW5kbGVyJztcbmltcG9ydCB7IHVzZVBlcm1pc3Npb25zIH0gZnJvbSAnLi4vaG9va3MvdXNlUGVybWlzc2lvbnMnO1xuaW1wb3J0IEJhbmtBY2NvdW50c0Zvb3RlciBmcm9tICcuL0JhbmtBY2NvdW50c0Zvb3Rlcic7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IGpzUERGIGZyb20gJ2pzcGRmJztcbmltcG9ydCAqIGFzIGh0bWxUb0ltYWdlIGZyb20gJ2h0bWwtdG8taW1hZ2UnO1xuaW1wb3J0IHsgc2FuaXRpemVEb2N1bWVudFN0eWxlcywgc2FuaXRpemVFbGVtZW50SW5saW5lU3R5bGVzLCBjbGVhbk9rbGNoSW5TdHlsZVRleHQgfSBmcm9tICcuLi9saWIvaHRtbDJjYW52YXNIZWxwZXInO1xuaW1wb3J0IHsgRmlsZXN5c3RlbSwgRGlyZWN0b3J5IH0gZnJvbSAnQGNhcGFjaXRvci9maWxlc3lzdGVtJztcbmltcG9ydCB7IHBhcnNlRGF0ZSwgZm9ybWF0RGF0ZVRpbWUsIHBhcnNlVHhEYXRlLCBmb3JtYXRUeERhdGUgfSBmcm9tICcuLi9saWIvZGF0ZVV0aWxzJztcblxuY29uc3QgV2hhdHNBcHBJY29uID0gKHByb3BzOiBSZWFjdC5TVkdQcm9wczxTVkdTVkdFbGVtZW50PikgPT4gKFxuICA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwiY3VycmVudENvbG9yXCIgey4uLnByb3BzfT5cbiAgICA8cGF0aCBkPVwiTTEyLjAxMiAyYy01LjUwNiAwLTkuOTc4IDQuNDcxLTkuOTc4IDkuOTc4IDAgMS43NjQuNDU5IDMuNDIgMS4yNTggNC44NzNMMiAyMmw1LjMxMi0xLjM5M2MxLjQwNS43NjYgMyAxLjE4IDQuNyAxLjE4IDUuNTA2IDAgOS45NzgtNC40NzIgOS45NzgtOS45NzhDMjEuOTkgNi40NzEgMTcuNTE4IDIgMTIuMDEyIDJ6bTYuMzMxIDE0LjE2MWMtLjI0NC42ODYtMS4yMiAxLjI1OC0xLjY4NyAxLjM0MS0uNDY4LjA4NC0uOTM1LjE1Mi0yLjkwMy0uNjMxLTIuNDc5LS45ODItNC4wNTMtMy41MjItNC4xNzUtMy42OS0uMTIyLS4xNjctLjk5MS0xLjMxOS0uOTkxLTIuNTE4IDAtMS4xOTkuNjMxLTEuNzg3Ljg1NC0yLjAyOC4yMjMtLjI0MS40ODgtLjMwMi42NS0uMzAyLjE2MiAwIC4zMjUuMDAzLjQ2Ny4wMS4xNDcuMDA3LjM0NS0uMDU3LjU0NS40MjEuMjAzLjQ4OC42OTEgMS42ODcuNzUyIDEuODA5LjA2MS4xMjIuMTAyLjI2NC4wMi40MjctLjA4MS4xNjItLjEyMi4yNjQtLjI0NC40MDctLjEyMi4xNDItLjI1Ni4zMTktLjM2Ni40MjctLjEyMi4xMjItLjI0OS4yNTUtLjEwNy40OTguMTQyLjI0NC42MzEgMS4wMzYgMS4zNTQgMS42NzguOTMyLjgyNyAxLjcxNCAxLjA4MiAxLjk1NyAxLjIwNC4yNDQuMTIyLjM4Ni4xMDIuNTI4LS4wNjEuMTQyLS4xNjIuNjEtMi4wMDguNzcyLTIuMzEzLjE2Mi0uMzA1LjMyNS0uMjQ0LjU0OC0uMTYyLjIyMy4wODEgMS40MjMuNjcxIDEuNjY3Ljc5My4yNDQuMTIyLjQwNi4xODMuNDY3LjI4NC4wNjEuMTA0LjA2MS41OS0uMTgzIDEuMjc3elwiIC8+XG4gIDwvc3ZnPlxuKTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQ3VzdG9tZXJzKHsgdXNlciwgc2hvcENvbmZpZywgb25CYWNrIH06IHsgdXNlcjogU3lzdGVtVXNlcjsgc2hvcENvbmZpZzogU2hvcENvbmZpZyB8IG51bGw7IG9uQmFjaz86ICgpID0+IHZvaWQgfSkge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gIGNvbnN0IHsgaGFzUGVybWlzc2lvbiwgY2FuQWRkLCBjYW5FZGl0LCBjYW5EZWxldGUsIGNhblByaW50IH0gPSB1c2VQZXJtaXNzaW9ucyh1c2VyLCAnY3VzdG9tZXJzJyk7XG5cbiAgaWYgKCFoYXNQZXJtaXNzaW9uKCd2aWV3JykpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBoLWZ1bGwgcC04IHRleHQtY2VudGVyIHNwYWNlLXktNFwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctMTYgaC0xNiBiZy1yZWQtNTAwLzEwIHJvdW5kZWQtZnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciB0ZXh0LXJlZC01MDBcIj5cbiAgICAgICAgICA8VXNlcnMgc2l6ZT17MzJ9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC14bCBmb250LWJvbGQgdGV4dC13aGl0ZVwiPti52LDYsdin2YvYjCDZhNmK2LMg2YTYr9mK2YMg2LXZhNin2K3ZitipINin2YTZiNi12YjZhDwvaDI+XG4gICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtZ3JheS00MDAgbWF4LXctbWRcIj7Zitix2KzZiSDYp9mE2KrZiNin2LXZhCDZhdi5INin2YTZhdiz2KTZiNmEINmE2YTYrdi12YjZhCDYudmE2Ykg2KfZhNi12YTYp9it2YrYp9iqINin2YTZhNin2LLZhdipINmE2LnYsdi2INio2YrYp9mG2KfYqiDYp9mE2LnZhdmE2KfYoS48L3A+XG4gICAgICAgIDxidXR0b24gXG4gICAgICAgICAgb25DbGljaz17b25CYWNrfSBcbiAgICAgICAgICBjbGFzc05hbWU9XCJwLTIuNSBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtZ3JheS00MDAgaG92ZXI6dGV4dC13aGl0ZSByb3VuZGVkLXhsIHRyYW5zaXRpb24tYWxsIGJvcmRlciBib3JkZXItd2hpdGUvNSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiXG4gICAgICAgICAgdGl0bGU9XCLYrtix2YjYrCDZhNmE2LHYptmK2LPZitipXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxMb2dPdXQgc2l6ZT17MjB9IGNsYXNzTmFtZT1cInJvdGF0ZS0xODBcIiAvPlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cbiAgY29uc3QgW2N1c3RvbWVycywgc2V0Q3VzdG9tZXJzXSA9IHVzZVN0YXRlPEN1c3RvbWVyW10+KFtdKTtcbiAgY29uc3QgW2ludm9pY2VzLCBzZXRJbnZvaWNlc10gPSB1c2VTdGF0ZTxJbnZvaWNlW10+KFtdKTtcbiAgY29uc3QgW2l0ZW1zLCBzZXRJdGVtc10gPSB1c2VTdGF0ZTxJbnZvaWNlSXRlbVtdPihbXSk7XG4gIGNvbnN0IFt0cmFuc2FjdGlvbnMsIHNldFRyYW5zYWN0aW9uc10gPSB1c2VTdGF0ZTxhbnlbXT4oW10pO1xuICBjb25zdCBbc2hvd1ByaW50T3B0aW9ucywgc2V0U2hvd1ByaW50T3B0aW9uc10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtpc0dlbmVyYXRpbmdQREYsIHNldElzR2VuZXJhdGluZ1BERl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtjdXJyZW50T3V0cHV0LCBzZXRDdXJyZW50T3V0cHV0XSA9IHVzZVN0YXRlPGFueT4obnVsbCk7XG4gIGNvbnN0IFtwcmV2aWV3RGF0YSwgc2V0UHJldmlld0RhdGFdID0gdXNlU3RhdGU8eyB0eXBlOiAnaW52b2ljZScgfCAndm91Y2hlcicgfCAnc3RhdGVtZW50JzsgZGF0YTogYW55IH0gfCBudWxsPihudWxsKTtcblxuICAvLyBTZWFyY2gvQXV0b2NvbXBsZXRlIFN0YXRlXG4gIGNvbnN0IFtzZWFyY2gsIHNldFNlYXJjaF0gPSB1c2VTdGF0ZSgnJyk7XG5cbiAgLy8gU2VsZWN0ZWQgc3RhdGVcbiAgY29uc3QgW3NlbGVjdGVkQ3VzdG9tZXIsIHNldFNlbGVjdGVkQ3VzdG9tZXJdID0gdXNlU3RhdGU8Q3VzdG9tZXIgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2FjdGl2ZUN1c3RvbWVyVGFiLCBzZXRBY3RpdmVDdXN0b21lclRhYl0gPSB1c2VTdGF0ZTwnZGV0YWlscycgfCAnc3RhdGVtZW50JyB8ICdsb2cnIHwgJ21lbnUnPignbWVudScpO1xuICBjb25zdCBbc2hvd1ByZXZpZXcsIHNldFNob3dQcmV2aWV3XSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW3Nob3dMb2dNb2RhbCwgc2V0U2hvd0xvZ01vZGFsXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2xvZ1NlYXJjaCwgc2V0TG9nU2VhcmNoXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW3Nob3dEZXRhaWxzTW9kYWwsIHNldFNob3dEZXRhaWxzTW9kYWxdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbc2VsZWN0ZWRMb2dJbnZvaWNlLCBzZXRTZWxlY3RlZExvZ0ludm9pY2VdID0gdXNlU3RhdGU8YW55IHwgbnVsbD4obnVsbCk7XG5cbiAgLy8gXCJBZGQgQ3VzdG9tZXJcIiBtb2RhbCBzdGF0ZXNcbiAgY29uc3QgW3Nob3dBZGRDdXN0b21lciwgc2V0U2hvd0FkZEN1c3RvbWVyXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2lzQWRkaW5nSW5Qcm9jZXNzLCBzZXRJc0FkZGluZ0luUHJvY2Vzc10gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgLy8gXCJFZGl0IEN1c3RvbWVyIEluZm9cIiBzdGF0ZXNcbiAgY29uc3QgW2lzRWRpdGluZ01vZGUsIHNldElzRWRpdGluZ01vZGVdID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbZWRpdE5hbWUsIHNldEVkaXROYW1lXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2VkaXRDb21wYW55TmFtZSwgc2V0RWRpdENvbXBhbnlOYW1lXSA9IHVzZVN0YXRlKCcnKTtcbiAgY29uc3QgW2VkaXRQaG9uZTEsIHNldEVkaXRQaG9uZTFdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbZWRpdFBob25lMiwgc2V0RWRpdFBob25lMl0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtlZGl0RW1haWwsIHNldEVkaXRFbWFpbF0gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtlZGl0Tm90ZXMsIHNldEVkaXROb3Rlc10gPSB1c2VTdGF0ZSgnJyk7XG4gIGNvbnN0IFtlZGl0SGFzV2hhdHNhcHAsIHNldEVkaXRIYXNXaGF0c2FwcF0gPSB1c2VTdGF0ZSh0cnVlKTtcbiAgY29uc3QgW2VkaXRMaWFiaWxpdHlDdXJyZW5jeSwgc2V0RWRpdExpYWJpbGl0eUN1cnJlbmN5XSA9IHVzZVN0YXRlKCdVU0QnKTtcbiAgY29uc3QgW3VwZGF0ZVBhc3RUcmFuc2FjdGlvbnMsIHNldFVwZGF0ZVBhc3RUcmFuc2FjdGlvbnNdID0gdXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IFtpc1NhdmluZ0luUHJvY2Vzcywgc2V0SXNTYXZpbmdJblByb2Nlc3NdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG5cbiAgdXNlQmFja0hhbmRsZXIoc2hvd0FkZEN1c3RvbWVyLCAoKSA9PiBzZXRTaG93QWRkQ3VzdG9tZXIoZmFsc2UpKTtcbiAgdXNlQmFja0hhbmRsZXIoc2hvd0xvZ01vZGFsLCAoKSA9PiB7XG4gICAgaWYgKHNlbGVjdGVkTG9nSW52b2ljZSkge1xuICAgICAgc2V0U2VsZWN0ZWRMb2dJbnZvaWNlKG51bGwpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRTaG93TG9nTW9kYWwoZmFsc2UpO1xuICAgIH1cbiAgfSk7XG4gIHVzZUJhY2tIYW5kbGVyKHNob3dEZXRhaWxzTW9kYWwsICgpID0+IHNldFNob3dEZXRhaWxzTW9kYWwoZmFsc2UpKTtcbiAgdXNlQmFja0hhbmRsZXIoaXNFZGl0aW5nTW9kZSwgKCkgPT4gc2V0SXNFZGl0aW5nTW9kZShmYWxzZSkpO1xuICB1c2VCYWNrSGFuZGxlcihzZWxlY3RlZEN1c3RvbWVyICE9PSBudWxsICYmICFzaG93QWRkQ3VzdG9tZXIgJiYgIXNob3dMb2dNb2RhbCAmJiAhc2hvd0RldGFpbHNNb2RhbCAmJiAhaXNFZGl0aW5nTW9kZSwgKCkgPT4ge1xuICAgIGlmIChhY3RpdmVDdXN0b21lclRhYiAhPT0gJ21lbnUnKSB7XG4gICAgICBzZXRBY3RpdmVDdXN0b21lclRhYignbWVudScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRTZWxlY3RlZEN1c3RvbWVyKG51bGwpO1xuICAgIH1cbiAgfSk7XG5cbiAgY29uc3QgbmV4dEN1c3RvbWVyTnVtYmVyID0gTWF0aC5tYXgoMCwgLi4uY3VzdG9tZXJzLm1hcChjID0+IE51bWJlcihjLmN1c3RvbWVyTnVtYmVyKSB8fCAwKSkgKyAxO1xuXG4gIGNvbnN0IGdldEFyYWJpY0N1cnJlbmN5TmFtZSA9IChjdXJyQ29kZTogc3RyaW5nKSA9PiB7XG4gICAgaWYgKCFjdXJyQ29kZSkgcmV0dXJuICfYr9mI2YTYp9ixJztcbiAgICBpZiAoY3VyckNvZGUudG9VcHBlckNhc2UoKSA9PT0gJ1VTRCcpIHJldHVybiAn2K/ZiNmE2KfYsSc7XG4gICAgaWYgKGN1cnJDb2RlLnRvVXBwZXJDYXNlKCkgPT09ICdZRVInKSByZXR1cm4gJ9ix2YrYp9mEINmK2YXZhtmKJztcbiAgICBpZiAoY3VyckNvZGUudG9VcHBlckNhc2UoKS5pbmNsdWRlcygnVVNEJykgJiYgY3VyckNvZGUudG9VcHBlckNhc2UoKS5pbmNsdWRlcygnWUVSJykpIHJldHVybiAn2K/ZiNmE2KfYsSAvINix2YrYp9mEINmK2YXZhtmKJztcbiAgICByZXR1cm4gY3VyckNvZGU7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlQWRkQ3VzdG9tZXIgPSBhc3luYyAoKSA9PiB7XG4gICAgLy8gVGhpcyBpcyBub3cgaGFuZGxlZCBpbnNpZGUgQWRkQ3VzdG9tZXJNb2RhbFxuICB9O1xuXG4gIGNvbnN0IG9uQ3VzdG9tZXJBZGRlZCA9IChjdXN0b21lcjogQ3VzdG9tZXIpID0+IHtcbiAgICAvLyBBdXRvIHNlbGVjdCBuZXdseSBjcmVhdGVkIGN1c3RvbWVyXG4gICAgc2VsZWN0Q3VzdG9tZXIoY3VzdG9tZXIpO1xuICAgIHNldFNob3dBZGRDdXN0b21lcihmYWxzZSk7XG4gIH07XG5cbiAgLy8gTG9hZCBDdXN0b21lcnMsIEludm9pY2VzLCBhbmQgSW52b2ljZSBJdGVtcyBpbiByZWFsLXRpbWVcbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zdCB1bnN1YnNjcmliZUN1c3RvbWVycyA9IG9uU25hcHNob3QocXVlcnkoY29sbGVjdGlvbihkYiwgJ2N1c3RvbWVycycpLCBvcmRlckJ5KCduYW1lJywgJ2FzYycpKSwgKHNuYXBzaG90KSA9PiB7XG4gICAgICBzZXRDdXN0b21lcnMoc25hcHNob3QuZG9jcy5tYXAoZG9jID0+ICh7IGlkOiBkb2MuaWQsIC4uLmRvYy5kYXRhKCkgfSBhcyBDdXN0b21lcikpKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHVuc3Vic2NyaWJlSW52b2ljZXMgPSBvblNuYXBzaG90KGNvbGxlY3Rpb24oZGIsICdpbnZvaWNlcycpLCAoc25hcHNob3QpID0+IHtcbiAgICAgIHNldEludm9pY2VzKHNuYXBzaG90LmRvY3MubWFwKGRvYyA9PiAoeyBpZDogZG9jLmlkLCAuLi5kb2MuZGF0YSgpIH0gYXMgSW52b2ljZSkpKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHVuc3Vic2NyaWJlSXRlbXMgPSBvblNuYXBzaG90KGNvbGxlY3Rpb24oZGIsICdpbnZvaWNlX2l0ZW1zJyksIChzbmFwc2hvdCkgPT4ge1xuICAgICAgc2V0SXRlbXMoc25hcHNob3QuZG9jcy5tYXAoZG9jID0+ICh7IGlkOiBkb2MuaWQsIC4uLmRvYy5kYXRhKCkgfSBhcyBJbnZvaWNlSXRlbSkpKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHVuc3Vic2NyaWJlVHJhbnNhY3Rpb25zID0gb25TbmFwc2hvdChjb2xsZWN0aW9uKGRiLCAndmF1bHRfdHJhbnNhY3Rpb25zJyksIChzbmFwc2hvdCkgPT4ge1xuICAgICAgc2V0VHJhbnNhY3Rpb25zKHNuYXBzaG90LmRvY3MubWFwKGRvYyA9PiAoeyBpZDogZG9jLmlkLCAuLi5kb2MuZGF0YSgpIH0pKSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdW5zdWJzY3JpYmVDdXN0b21lcnMoKTtcbiAgICAgIHVuc3Vic2NyaWJlSW52b2ljZXMoKTtcbiAgICAgIHVuc3Vic2NyaWJlSXRlbXMoKTtcbiAgICAgIHVuc3Vic2NyaWJlVHJhbnNhY3Rpb25zKCk7XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIC8vIEhhbmRsZXJzIGZvciBzZWxlY3Rpb25cbiAgY29uc3Qgc2VsZWN0Q3VzdG9tZXIgPSAoY3VzdG9tZXI6IEN1c3RvbWVyKSA9PiB7XG4gICAgc2V0U2VsZWN0ZWRDdXN0b21lcihjdXN0b21lcik7XG4gICAgc2V0QWN0aXZlQ3VzdG9tZXJUYWIoJ21lbnUnKTtcbiAgICBzZXRTZWFyY2goY3VzdG9tZXIubmFtZSk7XG4gICAgc2V0U2hvd1ByZXZpZXcoZmFsc2UpOyAvLyBSZXNldCBwcmV2aWV3IG9uIGJyYW5kLW5ldyBzZWxlY3Rpb25cbiAgICBzZXRJc0VkaXRpbmdNb2RlKGZhbHNlKTsgLy8gUmVzZXQgZWRpdCBtb2RlXG4gICAgc2V0RWRpdFBob25lMShjdXN0b21lci5waG9uZTEgfHwgJycpO1xuICAgIHNldEVkaXRQaG9uZTIoY3VzdG9tZXIucGhvbmUyIHx8ICcnKTtcbiAgICBzZXRFZGl0RW1haWwoY3VzdG9tZXIuZW1haWwgfHwgJycpO1xuICAgIHNldEVkaXROb3RlcyhjdXN0b21lci5ub3RlcyB8fCAnJyk7XG4gICAgc2V0RWRpdEhhc1doYXRzYXBwKGN1c3RvbWVyLmhhc1doYXRzYXBwICE9PSB1bmRlZmluZWQgPyBjdXN0b21lci5oYXNXaGF0c2FwcCA6IHRydWUpO1xuICAgICAgc2V0RWRpdExpYWJpbGl0eUN1cnJlbmN5KGN1c3RvbWVyLmxpYWJpbGl0eUN1cnJlbmN5IHx8ICdVU0QnKTtcbiAgfTtcblxuICBjb25zdCBoYW5kbGVVcGRhdGVDdXN0b21lciA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIXNlbGVjdGVkQ3VzdG9tZXIgfHwgIXNlbGVjdGVkQ3VzdG9tZXIuaWQpIHJldHVybjtcbiAgICBjb25zdCBpc0VkaXRGb3JtVmFsaWQgPSBlZGl0TmFtZS50cmltKCkgIT09ICcnICYmIGVkaXRQaG9uZTEudHJpbSgpICE9PSAnJztcbiAgICBpZiAoIWlzRWRpdEZvcm1WYWxpZCkgcmV0dXJuO1xuICAgIFxuICAgIHNldElzU2F2aW5nSW5Qcm9jZXNzKHRydWUpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBjdXN0b21lclJlZiA9IGRvYyhkYiwgJ2N1c3RvbWVycycsIHNlbGVjdGVkQ3VzdG9tZXIuaWQpO1xuICAgICAgXG4gICAgICBcbiAgICAgIGNvbnN0IHVwZGF0ZWRGaWVsZHMgPSB7XG4gICAgICAgIG5hbWU6IGVkaXROYW1lLnRyaW0oKSxcbiAgICAgICAgY29tcGFueU5hbWU6IGVkaXRDb21wYW55TmFtZS50cmltKCksXG4gICAgICAgIHBob25lMTogZWRpdFBob25lMS50cmltKCksXG4gICAgICAgIHBob25lMjogZWRpdFBob25lMi50cmltKCksXG4gICAgICAgIGVtYWlsOiBlZGl0RW1haWwudHJpbSgpLFxuICAgICAgICBub3RlczogZWRpdE5vdGVzLnRyaW0oKSxcbiAgICAgICAgaGFzV2hhdHNhcHA6IGVkaXRIYXNXaGF0c2FwcCxcbiAgICAgICAgdXBkYXRlZEF0OiBzZXJ2ZXJUaW1lc3RhbXAoKVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgeyBQcm92aWRlckZhY3RvcnkgfSA9IGF3YWl0IGltcG9ydCgnLi4vZGF0YS9Qcm92aWRlckZhY3RvcnknKTtcbiAgICAgICAgY29uc3QgcHJvdmlkZXIgPSBQcm92aWRlckZhY3RvcnkuZ2V0UHJvdmlkZXIoKTtcbiAgICAgICAgYXdhaXQgcHJvdmlkZXIudXBkYXRlRG9jKCdjdXN0b21lcnMnLCBzZWxlY3RlZEN1c3RvbWVyLmlkLCB7XG4gICAgICAgICAgLi4udXBkYXRlZEZpZWxkcyxcbiAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAodXBkYXRlUGFzdFRyYW5zYWN0aW9ucyAmJiAoZWRpdE5hbWUudHJpbSgpICE9PSBzZWxlY3RlZEN1c3RvbWVyLm5hbWUgfHwgZWRpdFBob25lMS50cmltKCkgIT09IHNlbGVjdGVkQ3VzdG9tZXIucGhvbmUxKSkge1xuICAgICAgICAgIC8vIFVwZGF0ZSBpbnZvaWNlc1xuICAgICAgICAgIGNvbnN0IGludm9pY2VzU25hcCA9IGF3YWl0IHByb3ZpZGVyLmdldERvY3MoJ2ludm9pY2VzJyk7XG4gICAgICAgICAgY29uc3QgaW52b2ljZXMgPSBpbnZvaWNlc1NuYXAuZG9jcyA/IGludm9pY2VzU25hcC5kb2NzLm1hcCgoZCkgPT4gZC5kYXRhKCkpIDogW107XG4gICAgICAgICAgZm9yIChjb25zdCBpbnYgb2YgaW52b2ljZXMpIHtcbiAgICAgICAgICAgIGlmIChpbnYuY3VzdG9tZXJJZCA9PT0gc2VsZWN0ZWRDdXN0b21lci5pZCkge1xuICAgICAgICAgICAgICBjb25zdCBpbnZVcGRhdGVzOiBhbnkgPSB7fTtcbiAgICAgICAgICAgICAgaWYgKGVkaXROYW1lLnRyaW0oKSAhPT0gc2VsZWN0ZWRDdXN0b21lci5uYW1lKSBpbnZVcGRhdGVzLmN1c3RvbWVyTmFtZSA9IGVkaXROYW1lLnRyaW0oKTtcbiAgICAgICAgICAgICAgaWYgKGVkaXRQaG9uZTEudHJpbSgpICE9PSBzZWxlY3RlZEN1c3RvbWVyLnBob25lMSkgaW52VXBkYXRlcy5jdXN0b21lclBob25lID0gZWRpdFBob25lMS50cmltKCk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICBhd2FpdCBwcm92aWRlci51cGRhdGVEb2MoJ2ludm9pY2VzJywgaW52LmlkLCBpbnZVcGRhdGVzKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIFVwZGF0ZSB0cmFuc2FjdGlvbnNcbiAgICAgICAgICBjb25zdCB0eHNTbmFwID0gYXdhaXQgcHJvdmlkZXIuZ2V0RG9jcygndmF1bHRfdHJhbnNhY3Rpb25zJyk7XG4gICAgICAgICAgY29uc3QgdHhzID0gdHhzU25hcC5kb2NzID8gdHhzU25hcC5kb2NzLm1hcCgoZCkgPT4gZC5kYXRhKCkpIDogW107XG4gICAgICAgICAgZm9yIChjb25zdCB0eCBvZiB0eHMpIHtcbiAgICAgICAgICAgIGlmICh0eC5jdXN0b21lcklkID09PSBzZWxlY3RlZEN1c3RvbWVyLmlkICYmIGVkaXROYW1lLnRyaW0oKSAhPT0gc2VsZWN0ZWRDdXN0b21lci5uYW1lKSB7XG4gICAgICAgICAgICAgIGF3YWl0IHByb3ZpZGVyLnVwZGF0ZURvYygndmF1bHRfdHJhbnNhY3Rpb25zJywgdHguaWQsIHsgY3VzdG9tZXJOYW1lOiBlZGl0TmFtZS50cmltKCkgfSk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignQ291bGQgbm90IHVwZGF0ZSBsb2NhbCBkYiBkaXJlY3RseScsIGVycik7XG4gICAgICB9XG4gICAgICAgICAgICBcbiAgICAgIGF3YWl0IHVwZGF0ZURvYyhjdXN0b21lclJlZiwgdXBkYXRlZEZpZWxkcyk7XG5cblxuICAgICAgXG4gICAgICAvLyBVcGRhdGUgbG9jYWwgc3RhdGVzXG4gICAgICBjb25zdCB1cGRhdGVkQ3VzdCA9IHtcbiAgICAgICAgLi4uc2VsZWN0ZWRDdXN0b21lcixcbiAgICAgICAgLi4udXBkYXRlZEZpZWxkc1xuICAgICAgfTtcbiAgICAgIHNldFNlbGVjdGVkQ3VzdG9tZXIodXBkYXRlZEN1c3QpO1xuICAgICAgXG4gICAgICAvLyBBbHNvIHVwZGF0ZSBpbi1tZW1vcnkgY3VzdG9tZXJzIGxpc3RcbiAgICAgIHNldEN1c3RvbWVycyhwcmV2ID0+IHByZXYubWFwKGMgPT4gYy5pZCA9PT0gc2VsZWN0ZWRDdXN0b21lci5pZCA/IHVwZGF0ZWRDdXN0IDogYykpO1xuICAgICAgXG4gICAgICBzZXRJc0VkaXRpbmdNb2RlKGZhbHNlKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciB1cGRhdGluZyBjdXN0b21lcjpcIiwgZXJyKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0SXNTYXZpbmdJblByb2Nlc3MoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBnZXRJbnZvaWNlQWN0dWFsQ29zdCA9IChpbnZvaWNlSXRlbXM6IEludm9pY2VJdGVtW10pID0+IHtcbiAgICByZXR1cm4gaW52b2ljZUl0ZW1zLnJlZHVjZSgoc3VtLCBpdGVtKSA9PiB7XG4gICAgICAvLyBFeGNsdWRlIGl0ZW1zIGluIHBlbmRpbmcgc3RhdHVzZXMgKG5ldywgdGVzdGluZywgYXdhaXRpbmcgYXBwcm92YWwsIGF3YWl0aW5nIHBhcnRzLCByZXBhaXJpbmcpXG4gICAgICAvLyBCZWNhdXNlIG1haW50ZW5hbmNlIGhhcyBub3QgY29tcGxldGVkIHlldCwgc28gdGhlIGFtb3VudCBpcyBub3QgeWV0IGR1ZS9jb25maXJtZWQgb24gdGhlIGN1c3RvbWVyLlxuICAgICAgaWYgKFsnMTAnLCAnMjAnLCAnMjUnLCAnMzAnLCAnMzUnLCAnNDAnLCAnbmV3JywgJ2luX3Byb2dyZXNzJywgJ2F3YWl0aW5nX3BhcnRzJywgJ2F3YWl0aW5nX2FwcHJvdmFsJywgJ3JlcGFpcmluZyddLmluY2x1ZGVzKGl0ZW0uc3RhdHVzKSkge1xuICAgICAgICByZXR1cm4gc3VtO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBFeGNsdWRlIGNhbmNlbGxlZC93aXRoZHJhd24gZGV2aWNlcywgdW5yZXBhaXJhYmxlL2ZhaWxlZCBkZXZpY2VzLCByZWZ1c2VkIGRldmljZXMsIG9yIGRldmljZXMgYmFja2R1ZSB0byB1bmF2YWlsYWJsZSBwYXJ0c1xuICAgICAgY29uc3Qgc3ViID0gKGl0ZW0uc3ViU3RhdHVzIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3Qgc3RhdHVzID0gKGl0ZW0uc3RhdHVzIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3Qgc3JjID0gKGl0ZW0uc291cmNlIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAvLyBDaGVjayBpZiBjYW5jZWxsZWQsIHJlZnVzZWQsIHVucmVwYWlyYWJsZSAoZmFpbGVkKSwgb3IgcGFydHMgdW5hdmFpbGFibGVcbiAgICAgIGNvbnN0IGlzRXhjbHVkZWQgPSBcbiAgICAgICAgWyc3MCcsICdjYW5jZWxsZWQnLCAncmVmdXNlZCcsICd1bnJlcGFpcmFibGUnLCAncGFydHNfbm90X2F2YWlsYWJsZScsICdmYWlsZWQnXS5pbmNsdWRlcyhzdGF0dXMpIHx8XG4gICAgICAgIFsnY2FuY2VsbGVkJywgJ3JlZnVzZWQnLCAndW5yZXBhaXJhYmxlJywgJ3BhcnRzX25vdF9hdmFpbGFibGUnLCAnZmFpbGVkJ10uaW5jbHVkZXMoc3ViKSB8fFxuICAgICAgICBbJ2NhbmNlbGxlZCcsICdyZWZ1c2VkJywgJ3VucmVwYWlyYWJsZScsICdwYXJ0c19ub3RfYXZhaWxhYmxlJywgJ2ZhaWxlZCddLmluY2x1ZGVzKHNyYykgfHxcbiAgICAgICAgKGl0ZW0uZmFpbHVyZVJlYXNvbiAhPT0gbnVsbCAmJiBpdGVtLmZhaWx1cmVSZWFzb24gIT09IHVuZGVmaW5lZCAmJiBpdGVtLmZhaWx1cmVSZWFzb24gIT09ICcnKTtcbiAgICAgIFxuICAgICAgaWYgKGlzRXhjbHVkZWQpIHtcbiAgICAgICAgcmV0dXJuIHN1bTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgcmV0dXJuIHN1bSArIChOdW1iZXIoaXRlbS5jb3N0KSB8fCAwKTtcbiAgICB9LCAwKTtcbiAgfTtcblxuICBjb25zdCBnZXRDdXN0b21lckN1cnJlbmN5TGFiZWwgPSAoY3VzdG9tZXJJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgY3VzdG9tZXJJbnZzID0gaW52b2ljZXMuZmlsdGVyKGludiA9PiBpbnYuY3VzdG9tZXJJZCA9PT0gY3VzdG9tZXJJZCk7XG4gICAgY29uc3QgY3VycmVuY2llcyA9IEFycmF5LmZyb20obmV3IFNldChjdXN0b21lckludnMubWFwKGludiA9PiBpbnYuY3VycmVuY3kgfHwgJ1VTRCcpKSk7XG4gICAgaWYgKGN1cnJlbmNpZXMubGVuZ3RoID09PSAwKSByZXR1cm4gJ1VTRCc7XG4gICAgcmV0dXJuIGN1cnJlbmNpZXMuam9pbignIC8gJyk7XG4gIH07XG5cbiAgLy8gQ2FsY3VsYXRpb25zIGZvciBzZWxlY3RlZCBjdXN0b21lclxuICBjb25zdCBnZXRDdXN0b21lclJlbWFpbmluZ0RldmljZXMgPSAoY3VzdG9tZXJJZDogc3RyaW5nKSA9PiB7XG4gICAgLy8gb3V0c3RhbmRpbmcgZGV2aWNlczogaXRlbXMgc3RhdGUgbm90IGRlbGl2ZXJlZCBhbmQgbm90ICc2MCdcbiAgICByZXR1cm4gaXRlbXMuZmlsdGVyKGl0ID0+IFxuICAgICAgKGl0LmN1c3RvbWVySWQgPT09IGN1c3RvbWVySWQgfHwgaW52b2ljZXMuc29tZShpbnYgPT4gaW52LmN1c3RvbWVySWQgPT09IGN1c3RvbWVySWQgJiYgaW52Lmludm9pY2VOdW1iZXIgPT09IGl0Lmludm9pY2VOdW1iZXIpKSAmJiBcbiAgICAgIGl0LnN0YXR1cyAhPT0gJ2RlbGl2ZXJlZCcgJiYgaXQuc3RhdHVzICE9PSAnNjAnXG4gICAgKS5yZWR1Y2UoKHN1bSwgaXRlbSkgPT4gc3VtICsgKE51bWJlcihpdGVtLnF1YW50aXR5KSB8fCAwKSwgMCk7XG4gIH07XG5cbiAgY29uc3QgZ2V0Q3VzdG9tZXJUb3RhbENvc3QgPSAoY3VzdG9tZXJJZDogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgY3VzdG9tZXJJbnZzID0gaW52b2ljZXMuZmlsdGVyKGludiA9PiBpbnYuY3VzdG9tZXJJZCA9PT0gY3VzdG9tZXJJZCk7XG4gICAgcmV0dXJuIGN1c3RvbWVySW52cy5yZWR1Y2UoKHN1bSwgaW52KSA9PiB7XG4gICAgICBjb25zdCBpbnZJdGVtcyA9IGl0ZW1zLmZpbHRlcihpdCA9PiBpdC5pbnZvaWNlTnVtYmVyID09PSBpbnYuaW52b2ljZU51bWJlcik7XG4gICAgICByZXR1cm4gc3VtICsgZ2V0SW52b2ljZUFjdHVhbENvc3QoaW52SXRlbXMpO1xuICAgIH0sIDApO1xuICB9O1xuXG4gIGNvbnN0IGdldEN1c3RvbWVyVG90YWxQYWlkID0gKGN1c3RvbWVySWQ6IHN0cmluZykgPT4ge1xuICAgIC8vIFJlY2VpcHRzXG4gICAgY29uc3Qgc2VwYXJhdGVSZWNlaXB0cyA9IHRyYW5zYWN0aW9uc1xuICAgICAgLmZpbHRlcih0eCA9PiB0eC5jdXN0b21lcklkID09PSBjdXN0b21lcklkICYmIHR4LnR5cGUgPT09ICdyZWNlaXB0JyAmJiAhdHguaXNSZXZlcnNlZCAmJiAhdHguaXNSZXZlcnNhbCAmJiB0eC5zdGF0dXMgIT09ICdyZXZlcnNlZCcgJiYgdHguc3RhdHVzICE9PSAncmV2ZXJzYWwnKVxuICAgICAgLnJlZHVjZSgoc3VtLCB0eCkgPT4gc3VtICsgKHR4LmxpYWJpbGl0eUFtb3VudCB8fCBNYXRoLmFicyhOdW1iZXIodHguYW1vdW50IHx8IDApKSksIDApO1xuXG4gICAgLy8gUGF5bWVudHNcbiAgICBjb25zdCBzZXBhcmF0ZVBheW1lbnRzID0gdHJhbnNhY3Rpb25zXG4gICAgICAuZmlsdGVyKHR4ID0+IHR4LmN1c3RvbWVySWQgPT09IGN1c3RvbWVySWQgJiYgdHgudHlwZSA9PT0gJ3BheW1lbnQnICYmICF0eC5pc1JldmVyc2VkICYmICF0eC5pc1JldmVyc2FsICYmIHR4LnN0YXR1cyAhPT0gJ3JldmVyc2VkJyAmJiB0eC5zdGF0dXMgIT09ICdyZXZlcnNhbCcpXG4gICAgICAucmVkdWNlKChzdW0sIHR4KSA9PiBzdW0gKyBNYXRoLmFicyhOdW1iZXIodHguYW1vdW50IHx8IDApKSwgMCk7XG5cbiAgICByZXR1cm4gc2VwYXJhdGVSZWNlaXB0cyAtIHNlcGFyYXRlUGF5bWVudHM7XG4gIH07XG5cbiAgY29uc3QgZ2V0Q3VzdG9tZXJPdXRzdGFuZGluZ0Ftb3VudCA9IChjdXN0b21lcklkOiBzdHJpbmcpID0+IHtcbiAgICByZXR1cm4gTWF0aC5tYXgoMCwgZ2V0Q3VzdG9tZXJUb3RhbENvc3QoY3VzdG9tZXJJZCkgLSBnZXRDdXN0b21lclRvdGFsUGFpZChjdXN0b21lcklkKSk7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGUgc3RhdGVtZW50IGVudHJpZXMgY2hyb25vbG9naWNhbGx5IGZvciBTZWxlY3RlZCBDdXN0b21lclxuICBjb25zdCBnZXRTdGF0ZW1lbnRFbnRyaWVzID0gKGN1c3RvbWVySWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGVudHJpZXM6IHtcbiAgICAgIGlkOiBzdHJpbmc7XG4gICAgICBkYXRlOiBEYXRlO1xuICAgICAgdHlwZTogc3RyaW5nO1xuICAgICAgbGFiZWw6IHN0cmluZztcbiAgICAgIHJlZmVyZW5jZTogc3RyaW5nO1xuICAgICAgbm90ZXM6IHN0cmluZztcbiAgICAgIGRlYml0OiBudW1iZXI7XG4gICAgICBjcmVkaXQ6IG51bWJlcjtcbiAgICAgIHJ1bm5pbmdCYWxhbmNlPzogbnVtYmVyO1xuICAgIH1bXSA9IFtdO1xuXG4gICAgLy8gMS4gR2V0IGN1c3RvbWVyIGludm9pY2VzXG4gICAgY29uc3QgY3VzdG9tZXJJbnZzID0gaW52b2ljZXMuZmlsdGVyKGludiA9PiBpbnYuY3VzdG9tZXJJZCA9PT0gY3VzdG9tZXJJZCk7XG4gICAgY3VzdG9tZXJJbnZzLmZvckVhY2goaW52ID0+IHtcbiAgICAgIGNvbnN0IGludkl0ZW1zID0gaXRlbXMuZmlsdGVyKGl0ID0+IGl0Lmludm9pY2VOdW1iZXIgPT09IGludi5pbnZvaWNlTnVtYmVyKTtcbiAgICAgIGNvbnN0IGFjdHVhbENvc3QgPSBnZXRJbnZvaWNlQWN0dWFsQ29zdChpbnZJdGVtcyk7XG4gICAgICAvLyBSb3cgMTogSW52b2ljZSBkZWJpdFxuICAgICAgY29uc3QgaW52RGF0ZSA9IHBhcnNlRGF0ZShpbnYuY3JlYXRlZEF0KTtcbiAgICAgIFxuICAgICAgZW50cmllcy5wdXNoKHtcbiAgICAgICAgaWQ6IGBpbnYtY29zdC0ke2ludi5pZH1gLFxuICAgICAgICBkYXRlOiBpbnZEYXRlLFxuICAgICAgICB0eXBlOiAn2YHYp9iq2YjYsdipINi12YrYp9mG2KknLFxuICAgICAgICBsYWJlbDogJ9mB2KfYqtmI2LHYqSDYtdmK2KfZhtipINij2KzZh9iy2Kkg2YHZhtmK2KknLFxuICAgICAgICByZWZlcmVuY2U6IFN0cmluZyhpbnYuaW52b2ljZU51bWJlcikucmVwbGFjZSgvIy9nLCAnJyksXG4gICAgICAgIG5vdGVzOiBpbnYubm90ZXMgfHwgaW52SXRlbXMubWFwKGkgPT4gYCR7aS5kZXZpY2VUeXBlfSAtICR7aS5icmFuZH1gKS5qb2luKCcgfCAnKSxcbiAgICAgICAgZGViaXQ6IGFjdHVhbENvc3QsXG4gICAgICAgIGNyZWRpdDogMFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyAyLiBHZXQgc2VwYXJhdGUgcmVjZWlwdHMgYW5kIHBheW1lbnRzIChmaWx0ZXJpbmcgb3V0IHJldmVyc2VkL3JldmVyc2FscyBmb3IgY3VzdG9tZXJzKVxuICAgIGNvbnN0IGN1c3RvbWVyVHJhbnNhY3Rpb25zID0gdHJhbnNhY3Rpb25zLmZpbHRlcih0eCA9PiBcbiAgICAgIHR4LmN1c3RvbWVySWQgPT09IGN1c3RvbWVySWQgJiZcbiAgICAgICF0eC5pc1JldmVyc2VkICYmXG4gICAgICAhdHguaXNSZXZlcnNhbCAmJlxuICAgICAgdHguc3RhdHVzICE9PSAncmV2ZXJzZWQnICYmXG4gICAgICB0eC5zdGF0dXMgIT09ICdyZXZlcnNhbCdcbiAgICApO1xuXG4gICAgY3VzdG9tZXJUcmFuc2FjdGlvbnMuZm9yRWFjaCh0eCA9PiB7XG4gICAgICBjb25zdCB0eERhdGUgPSBwYXJzZVR4RGF0ZSh0eCk7XG5cbiAgICAgIGlmICh0eC50eXBlID09PSAncmVjZWlwdCcpIHtcbiAgICAgICAgY29uc3QgaXNMaW5rZWRUb0ludm9pY2UgPSAhIXR4Lmludm9pY2VOdW1iZXI7XG4gICAgICAgIGNvbnN0IGxpYWJpbGl0eUFtb3VudCA9IHR4LmxpYWJpbGl0eUFtb3VudCB8fCBNYXRoLmFicyhOdW1iZXIodHguYW1vdW50IHx8IDApKTtcbiAgICAgICAgXG4gICAgICAgIGxldCBkb2NUeXBlID0gJ9iz2YbYryDZgtio2LYnO1xuICAgICAgICBsZXQgc3RhdGVtZW50ID0gdHgudHJhbnNhY3Rpb25DYXRlZ29yeSB8fCAn2K/Zgdi52Ycg2KrYrdiqINin2YTYrdiz2KfYqCc7XG4gICAgICAgIGxldCBkZXRhaWxzID0gdHguc3RhdGVtZW50Tm90ZSB8fCB0eC5ub3RlcyB8fCAnJztcbiAgICAgICAgbGV0IHJlZlN0ciA9IFN0cmluZyh0eC52b3VjaGVyTnVtYmVyIHx8IHR4LmlkPy5zdWJzdHJpbmcoMCwgNSkpLnJlcGxhY2UoLyMvZywgJycpO1xuXG4gICAgICAgIGlmIChpc0xpbmtlZFRvSW52b2ljZSkge1xuICAgICAgICAgICBkb2NUeXBlID0gJ9iz2K/Yp9ivINmB2KfYqtmI2LHYqSc7XG4gICAgICAgICAgIHN0YXRlbWVudCA9IGDYs9iv2KfYryDZgdmKINmB2KfYqtmI2LHYqSDYsdmC2YUgJHt0eC5pbnZvaWNlTnVtYmVyfWA7XG4gICAgICAgICAgIHJlZlN0ciA9IGAke3R4Lmludm9pY2VOdW1iZXJ9JHt0eC52b3VjaGVyTnVtYmVyIHx8ICcxMDAnfWA7XG4gICAgICAgIH0gZWxzZSBpZiAodHgudHJhbnNhY3Rpb25DYXRlZ29yeSA9PT0gJ9iv2YHYudipINij2KzZh9iy2KknKSB7XG4gICAgICAgICAgIGRvY1R5cGUgPSAn2LPYr9in2K8g2YHYp9iq2YjYsdipJztcbiAgICAgICAgICAgc3RhdGVtZW50ID0gYNiz2K/Yp9ivINmB2Yog2YHYp9iq2YjYsdipINix2YLZhSAke3R4Lmludm9pY2VOdW1iZXIgfHwgJ9ifJ31gO1xuICAgICAgICAgICBpZiAodHguaW52b2ljZU51bWJlcikge1xuICAgICAgICAgICAgIHJlZlN0ciA9IGAke3R4Lmludm9pY2VOdW1iZXJ9JHt0eC52b3VjaGVyTnVtYmVyIHx8ICcxMDAnfWA7XG4gICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVudHJpZXMucHVzaCh7XG4gICAgICAgICAgaWQ6IGB0eC0ke3R4LmlkfWAsXG4gICAgICAgICAgZGF0ZTogdHhEYXRlLFxuICAgICAgICAgIHR5cGU6IGRvY1R5cGUsXG4gICAgICAgICAgbGFiZWw6IHN0YXRlbWVudCxcbiAgICAgICAgICByZWZlcmVuY2U6IHJlZlN0cixcbiAgICAgICAgICBub3RlczogZGV0YWlscyxcbiAgICAgICAgICBkZWJpdDogMCxcbiAgICAgICAgICBjcmVkaXQ6IGxpYWJpbGl0eUFtb3VudFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAodHgudHlwZSA9PT0gJ3BheW1lbnQnKSB7XG4gICAgICAgIGVudHJpZXMucHVzaCh7XG4gICAgICAgICAgaWQ6IGB0eC0ke3R4LmlkfWAsXG4gICAgICAgICAgZGF0ZTogdHhEYXRlLFxuICAgICAgICAgIHR5cGU6ICfYs9mG2K8g2LXYsdmBJyxcbiAgICAgICAgICBsYWJlbDogdHgudHJhbnNhY3Rpb25DYXRlZ29yeSB8fCAn2LPZhtivINi12LHZgSDZhNmE2LnZhdmK2YQnLFxuICAgICAgICAgIHJlZmVyZW5jZTogU3RyaW5nKHR4LnZvdWNoZXJOdW1iZXIgfHwgdHguaWQ/LnN1YnN0cmluZygwLCA1KSkucmVwbGFjZSgvIy9nLCAnJyksXG4gICAgICAgICAgbm90ZXM6IHR4Lm5vdGVzIHx8ICcnLFxuICAgICAgICAgIGRlYml0OiBNYXRoLmFicyhOdW1iZXIodHguYW1vdW50IHx8IDApKSxcbiAgICAgICAgICBjcmVkaXQ6IDBcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyAzLiBTb3J0IGNocm9ub2xvZ2ljYWxseVxuICAgIGVudHJpZXMuc29ydCgoYSwgYikgPT4gKGEuZGF0ZT8uZ2V0VGltZSgpIHx8IDApIC0gKGIuZGF0ZT8uZ2V0VGltZSgpIHx8IDApKTtcblxuICAgIC8vIDQuIEZpbHRlciBlbnRyaWVzIHRoYXQgaGF2ZSBhY3RpdmUgZmluYW5jaWFsIGltcGFjdCAoZGViaXQgPiAwIG9yIGNyZWRpdCA+IDApXG4gICAgY29uc3QgYWN0aXZlRW50cmllcyA9IGVudHJpZXMuZmlsdGVyKGUgPT4gZS5kZWJpdCA+IDAuMDAxIHx8IGUuY3JlZGl0ID4gMC4wMDEpO1xuXG4gICAgLy8gNS4gQ29tcHV0ZSBydW5uaW5nIGJhbGFuY2VcbiAgICBsZXQgYmFsYW5jZSA9IDA7XG4gICAgcmV0dXJuIGFjdGl2ZUVudHJpZXMubWFwKGVudHJ5ID0+IHtcbiAgICAgIGJhbGFuY2UgKz0gZW50cnkuZGViaXQgLSBlbnRyeS5jcmVkaXQ7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5lbnRyeSxcbiAgICAgICAgcnVubmluZ0JhbGFuY2U6IGJhbGFuY2VcbiAgICAgIH07XG4gICAgfSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlV2hhdHNBcHBTaGFyZSA9IGFzeW5jIChjdXN0b21lcklkOiBzdHJpbmcpID0+IHtcbiAgICBjb25zdCBjdXN0ID0gY3VzdG9tZXJzLmZpbmQoYyA9PiBjLmlkID09PSBjdXN0b21lcklkKTtcbiAgICBpZiAoIWN1c3QpIHJldHVybjtcblxuICAgIHNldElzR2VuZXJhdGluZ1BERih0cnVlKTtcblxuICAgIGNvbnN0IG9yaWdpbmFsR2V0Q29tcHV0ZWRTdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlO1xuICAgIGxldCB0ZW1wRWw6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcmludC1hcmVhJyk7XG4gICAgICBpZiAoIWVsZW1lbnQpIHtcbiAgICAgICAgc2V0SXNHZW5lcmF0aW5nUERGKGZhbHNlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjYW52YXMgPSBhd2FpdCBodG1sVG9JbWFnZS50b0NhbnZhcyhlbGVtZW50LCB7XG4gICAgICAgIHBpeGVsUmF0aW86IDIsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJyNmZmZmZmYnLFxuICAgICAgfSk7XG5cbiAgICAgIGNvbnN0IGltZ0RhdGEgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9qcGVnJywgMC45NSk7XG5cbiAgICAgIGNvbnN0IHBkZiA9IG5ldyBqc1BERih7XG4gICAgICAgIG9yaWVudGF0aW9uOiAncCcsXG4gICAgICAgIHVuaXQ6ICdtbScsXG4gICAgICAgIGZvcm1hdDogJ2E0JyxcbiAgICAgICAgY29tcHJlc3M6IHRydWVcbiAgICAgIH0pO1xuICAgICAgY29uc3QgaW1nV2lkdGggPSAyMTA7XG4gICAgICBjb25zdCBwYWdlSGVpZ2h0ID0gMjk3O1xuICAgICAgXG4gICAgICBjb25zdCBpbWdIZWlnaHQgPSAoY2FudmFzLmhlaWdodCAqIGltZ1dpZHRoKSAvIGNhbnZhcy53aWR0aDtcbiAgICAgIGxldCBoZWlnaHRMZWZ0ID0gaW1nSGVpZ2h0O1xuICAgICAgbGV0IHBvc2l0aW9uID0gMDtcblxuICAgICAgcGRmLmFkZEltYWdlKGltZ0RhdGEsICdKUEVHJywgMCwgcG9zaXRpb24sIGltZ1dpZHRoLCBpbWdIZWlnaHQsIHVuZGVmaW5lZCwgJ0ZBU1QnKTtcbiAgICAgIGhlaWdodExlZnQgLT0gcGFnZUhlaWdodDtcblxuICAgICAgd2hpbGUgKGhlaWdodExlZnQgPiA1KSB7XG4gICAgICAgIHBvc2l0aW9uID0gaGVpZ2h0TGVmdCAtIGltZ0hlaWdodDtcbiAgICAgICAgcGRmLmFkZFBhZ2UoKTtcbiAgICAgICAgcGRmLmFkZEltYWdlKGltZ0RhdGEsICdKUEVHJywgMCwgcG9zaXRpb24sIGltZ1dpZHRoLCBpbWdIZWlnaHQsIHVuZGVmaW5lZCwgJ0ZBU1QnKTtcbiAgICAgICAgaGVpZ2h0TGVmdCAtPSBwYWdlSGVpZ2h0O1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKCk7XG4gICAgICBjb25zdCB5ZWFyID0gdG9kYXkuZ2V0RnVsbFllYXIoKTtcbiAgICAgIGNvbnN0IG1vbnRoID0gU3RyaW5nKHRvZGF5LmdldE1vbnRoKCkgKyAxKS5wYWRTdGFydCgyLCAnMCcpO1xuICAgICAgY29uc3QgZGF5ID0gU3RyaW5nKHRvZGF5LmdldERhdGUoKSkucGFkU3RhcnQoMiwgJzAnKTtcbiAgICAgIGNvbnN0IHByaW50RGF0ZSA9IGAke3llYXJ9LSR7bW9udGh9LSR7ZGF5fWA7XG4gICAgICBjb25zdCBmaWxlbmFtZSA9IGDZg9i02YEg2K3Ys9in2KhfJHtjdXN0Lm5hbWV9XyR7cHJpbnREYXRlfS5wZGZgO1xuXG4gICAgICAvLyAyLiBQcmVwYXJlIHRoZSBQREYgQmFzZTY0ICYgc2F2ZSBpbiBkYXRhYmFzZSBmb2xkZXIgYW5kIHNxbGl0ZSBzYXZlZF9wZGZzXG4gICAgICBsZXQgcGRmQmFzZTY0ID0gJyc7XG4gICAgICB0cnkge1xuICAgICAgICBwZGZCYXNlNjQgPSBwZGYub3V0cHV0KCdkYXRhdXJpc3RyaW5nJykuc3BsaXQoJywnKVsxXTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gZ2V0IFBERiBCYXNlNjQgc3RyaW5nOicsIGVycik7XG4gICAgICB9XG5cbiAgICAgIC8vIFNhdmUgdG8gQ2FwYWNpdG9yIGZpbGVzeXN0ZW0gZm9sZGVyXG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBGaWxlc3lzdGVtLndyaXRlRmlsZSh7XG4gICAgICAgICAgcGF0aDogYFNORF9BcHAv2KrZgtin2LHZitixLyR7ZmlsZW5hbWV9YCxcbiAgICAgICAgICBkYXRhOiBwZGZCYXNlNjQsXG4gICAgICAgICAgZGlyZWN0b3J5OiBEaXJlY3RvcnkuRG9jdW1lbnRzLFxuICAgICAgICAgIHJlY3Vyc2l2ZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2coJ1BERiBmaWxlIHNhdmVkIHN1Y2Nlc3NmdWxseSB0byBTTkRfQXBwL9iq2YLYp9ix2YrYsSBkaXJlY3RvcnkuJyk7XG4gICAgICB9IGNhdGNoIChmc0Vycm9yKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignU2tpcHBpbmcgRGV2aWNlIEZpbGVzeXN0ZW0gc2F2ZTonLCBmc0Vycm9yKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2F2ZSB0byBTUUxpdGUgZGF0YWJhc2UgdGFibGUgKHNhdmVkX3BkZnMgaGlzdG9yeSBsb2cpXG4gICAgICB0cnkge1xuICAgICAgICAvLyBDcmVhdGUgdGFibGUgZHluYW1pY2FsbHkgaW4gc3FsaXRlIGlmIG5vdCBjcmVhdGVkXG4gICAgICAgIGNvbnN0IHsgbG9jYWxEYiB9ID0gYXdhaXQgaW1wb3J0KCcuLi9saWIvbG9jYWwtZGInKTtcbiAgICAgICAgYXdhaXQgbG9jYWxEYi5ydW4oYFxuICAgICAgICAgIENSRUFURSBUQUJMRSBJRiBOT1QgRVhJU1RTIHNhdmVkX3BkZnMgKFxuICAgICAgICAgICAgaWQgVEVYVCBQUklNQVJZIEtFWSxcbiAgICAgICAgICAgIGN1c3RvbWVySWQgVEVYVCxcbiAgICAgICAgICAgIGN1c3RvbWVyTmFtZSBURVhULFxuICAgICAgICAgICAgZmlsZW5hbWUgVEVYVCxcbiAgICAgICAgICAgIGNyZWF0ZWRBdCBURVhULFxuICAgICAgICAgICAgZmlsZVNpemUgVEVYVCxcbiAgICAgICAgICAgIGZpbGVEYXRhIFRFWFRcbiAgICAgICAgICApXG4gICAgICAgIGApO1xuICAgICAgICBjb25zdCBkb2NJZCA9IGBwZGZfJHtEYXRlLm5vdygpfWA7XG4gICAgICAgIGNvbnN0IGZpbGVTaXplID0gYCR7TWF0aC5yb3VuZChwZGZCYXNlNjQubGVuZ3RoICogMC43NSAvIDEwMjQpfSBLQmA7XG4gICAgICAgIGF3YWl0IGxvY2FsRGIucnVuKFxuICAgICAgICAgIGBJTlNFUlQgSU5UTyBzYXZlZF9wZGZzIChpZCwgY3VzdG9tZXJJZCwgY3VzdG9tZXJOYW1lLCBmaWxlbmFtZSwgY3JlYXRlZEF0LCBmaWxlU2l6ZSwgZmlsZURhdGEpIFZBTFVFUyAoPywgPywgPywgPywgPywgPywgPylgLFxuICAgICAgICAgIFtkb2NJZCwgY3VzdG9tZXJJZCwgY3VzdC5uYW1lLCBmaWxlbmFtZSwgbmV3IERhdGUoKS50b0lTT1N0cmluZygpLCBmaWxlU2l6ZSwgcGRmQmFzZTY0XVxuICAgICAgICApO1xuICAgICAgICBjb25zb2xlLmxvZygnUERGIHNhdmVkIHRvIGxvY2FsIGRhdGFiYXNlIHNhdmVkX3BkZnMgdGFibGUhJyk7XG4gICAgICB9IGNhdGNoIChkYkVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIHNhdmUgdG8gU1FMaXRlIGRhdGFiYXNlIHRhYmxlIHNhdmVkX3BkZnM6JywgZGJFcnJvcik7XG4gICAgICB9XG5cbiAgICAgIC8vIERvd25sb2FkIHN0YW5kYXJkIGRlc2t0b3AgbGVkZ2VyXG4gICAgICBwZGYuc2F2ZShmaWxlbmFtZSk7XG5cbiAgICAgIC8vIDMuIExhdW5jaCBXaGF0c0FwcCBsaW5rIG9yIE5hdGl2ZSBTaGFyZVxuICAgICAgY29uc3QgdG90YWxDb3N0ID0gZ2V0Q3VzdG9tZXJUb3RhbENvc3QoY3VzdG9tZXJJZCk7XG4gICAgICBjb25zdCB0b3RhbFBhaWQgPSBnZXRDdXN0b21lclRvdGFsUGFpZChjdXN0b21lcklkKTtcbiAgICAgIGNvbnN0IGRpZmYgPSB0b3RhbENvc3QgLSB0b3RhbFBhaWQ7XG4gICAgICBjb25zdCBjdXJyZW5jeSA9IGdldEN1c3RvbWVyQ3VycmVuY3lMYWJlbChjdXN0b21lcklkKTtcblxuICAgICAgbGV0IHN0YXR1c1RleHQgPSAnJztcbiAgICAgIGlmIChkaWZmIDwgLTAuMDEpIHtcbiAgICAgICAgc3RhdHVzVGV4dCA9IGDYsdi12YrYryDYr9in2KbZhiDZhNmE2LnZhdmK2YQg2KjZgdin2KbYtjogJHtNYXRoLmFicyhkaWZmKS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0gJHtjdXJyZW5jeX1gO1xuICAgICAgfSBlbHNlIGlmIChkaWZmID4gMC4wMSkge1xuICAgICAgICBzdGF0dXNUZXh0ID0gYNmF2KrYqNmC2Yog2LnZhNmK2Ycg2YPYr9mK2YjZhiDZhdiq2LHYp9mD2YXYqTogJHtNYXRoLmFicyhkaWZmKS50b0xvY2FsZVN0cmluZygnZW4tVVMnKX0gJHtjdXJyZW5jeX1gO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdHVzVGV4dCA9IGDYp9mE2K3Ys9in2Kgg2YXYqtiy2YYg2KjYp9mE2YPYp9mF2YQgKDAuMDApYDtcbiAgICAgIH1cblxuICAgICAgbGV0IG1lc3NhZ2UgPSBgKtmD2LTZgSDZhdin2YTZiiDYsdiz2YXZiiDZiNmF2YjYrdivINio2LXZiti62KkgUERGKiDwn5OEXFxuXFxuYDtcbiAgICAgIG1lc3NhZ2UgKz0gYNi52LLZitiy2Yog2KfZhNi52YXZitmEICoke2N1c3QubmFtZX0q2IxcXG5gO1xuICAgICAgbWVzc2FnZSArPSBg2KrYrNiv2YjZhiDYo9iv2YbYp9mHINmF2YTYrti12KfZiyDZhdin2YTZitin2Ysg2KjYp9mE2LnZhdmE2YrYp9iqINmI2KfZhNiv2YHZiNi52KfYqiDYp9mE2YXYs9is2YTYqSDZhNi12YrYp9mG2KrZg9mFLiDZg9mF2Kcg2KrZhSDYqtmG2LLZitmEINmI2K3Zgdi4INmF2LPYqtmG2K8g2KfZhNmAIFBERiDZhNmE2KrZgtix2YrYsSDZgdmKINmF2KzZhNivINmC2KfYudiv2Kkg2KfZhNio2YrYp9mG2KfYqi5cXG5cXG5gO1xuICAgICAgbWVzc2FnZSArPSBgLSAq2KfZhNix2LXZitivINin2YTYtdin2YHZijoqICR7c3RhdHVzVGV4dH1cXG5gO1xuICAgICAgbWVzc2FnZSArPSBgLSAq2KXYrNmF2KfZhNmKINmF2LPYqtit2YLYp9iqINin2YTYtdmK2KfZhtipOiogJHt0b3RhbENvc3QudG9Mb2NhbGVTdHJpbmcoJ2VuLVVTJyl9ICR7Y3VycmVuY3l9XFxuYDtcbiAgICAgIG1lc3NhZ2UgKz0gYC0gKtil2KzZhdin2YTZiiDYp9mE2LPZhtiv2KfYqiDZiNin2YTZhdmC2KjZiNi22KfYqjoqICR7dG90YWxQYWlkLnRvTG9jYWxlU3RyaW5nKCdlbi1VUycpfSAke2N1cnJlbmN5fVxcblxcbmA7XG4gICAgICBtZXNzYWdlICs9IGDZitix2KzZiSDZhdi02KfYsdmD2Kkg2YjYpdix2LPYp9mEINmD2LTZgSDZhdiz2KrZhtivINin2YTZgCBQREYg2KfZhNmF2K3ZgdmI2Lgg2KfZhNii2YYg2KjZhtis2KfYrSDYudmE2Ykg2KzZh9in2LLZg9mFLmA7XG5cbiAgICAgIC8vIE5hdGl2ZSBTaGFyZSBBUEkgaWYgc3VwcG9ydGVkICh0byBhdHRhY2ggYWN0dWFsIFBERiBzaGVldCBvbiBtb2JpbGUpXG4gICAgICBsZXQgc2hhcmVkTmF0aXZlbHkgPSBmYWxzZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHBkZkJsb2IgPSBwZGYub3V0cHV0KCdibG9iJyk7XG4gICAgICAgIHNoYXJlZE5hdGl2ZWx5ID0gYXdhaXQgc2hhcmVQZGZGaWxlKHBkZkJsb2IsIGZpbGVuYW1lLCBtZXNzYWdlLCAncmVwb3J0Jyk7XG4gICAgICB9IGNhdGNoIChzaGFyZUVycikge1xuICAgICAgICBjb25zb2xlLndhcm4oJ05hdGl2ZSBzaGFyZSB3YXMgc2tpcHBlZDonLCBzaGFyZUVycik7XG4gICAgICB9XG5cbiAgICAgIGlmICghc2hhcmVkTmF0aXZlbHkpIHtcbiAgICAgICAgb3BlbldoYXRzQXBwKG1lc3NhZ2UsIGN1c3QucGhvbmUxIHx8IGN1c3QucGhvbmUyLCBzaG9wQ29uZmlnPy5jb3VudHJ5Q29kZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGV4cG9ydCBQREYgJiBzaGFyZTonLCBlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgd2luZG93LmdldENvbXB1dGVkU3R5bGUgPSBvcmlnaW5hbEdldENvbXB1dGVkU3R5bGU7XG4gICAgICBpZiAodGVtcEVsICYmIHRlbXBFbC5wYXJlbnROb2RlKSB7XG4gICAgICAgIHRlbXBFbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRlbXBFbCk7XG4gICAgICB9XG4gICAgICBzZXRJc0dlbmVyYXRpbmdQREYoZmFsc2UpO1xuICAgIH1cbiAgfTtcblxuICAvLyBTZWxlY3RlZCBjdXN0b21lciBpbnZvaWNlc1xuICBjb25zdCBjdXN0b21lckludm9pY2VzID0gc2VsZWN0ZWRDdXN0b21lciBcbiAgICA/IGludm9pY2VzLmZpbHRlcihpbnYgPT4gaW52LmN1c3RvbWVySWQgPT09IHNlbGVjdGVkQ3VzdG9tZXIuaWQpXG4gICAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiBOdW1iZXIoYi5pbnZvaWNlTnVtYmVyIHx8IDApIC0gTnVtYmVyKGEuaW52b2ljZU51bWJlciB8fCAwKSlcbiAgICA6IFtdO1xuXG4gIC8vIFNvcnRpbmcvRmlsdGVyIGNvbnRyb2xzXG4gIGNvbnN0IFtzaG93RmlsdGVyRHJvcGRvd24sIHNldFNob3dGaWx0ZXJEcm9wZG93bl0gPSB1c2VTdGF0ZShmYWxzZSk7XG4gIGNvbnN0IFtmaWx0ZXJUeXBlLCBzZXRGaWx0ZXJUeXBlXSA9IHVzZVN0YXRlPCdhbHBoYScgfCAnZGF0ZScgfCAnZGVidCcgfCAnZGV2aWNlcycgfCAnY3VycmVuY3knIHwgJ2NvZGUnPignY29kZScpO1xuICBjb25zdCBbc29ydERpciwgc2V0U29ydERpcl0gPSB1c2VTdGF0ZTwnYXNjJyB8ICdkZXNjJz4oJ2Rlc2MnKTtcblxuICAvLyBQYWdpbmF0aW9uIGNvbnRyb2xzXG4gIGNvbnN0IFtjdXJyZW50UGFnZSwgc2V0Q3VycmVudFBhZ2VdID0gdXNlU3RhdGUoMSk7XG4gIGNvbnN0IGl0ZW1zUGVyUGFnZSA9IDEwO1xuXG4gIC8vIEZpbHRlcmVkIGFuZCBzb3J0ZWQgbGlzdCBvZiBhbGwgY3VzdG9tZXJzXG4gIGNvbnN0IGdldFByb2Nlc3NlZEN1c3RvbWVycyA9ICgpID0+IHtcbiAgICBsZXQgbGlzdCA9IGN1c3RvbWVycy5maWx0ZXIoYyA9PiBcbiAgICAgIGMubmFtZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHNlYXJjaC50b0xvd2VyQ2FzZSgpKSB8fFxuICAgICAgYy5waG9uZTEuaW5jbHVkZXMoc2VhcmNoKSB8fCAoYy5waG9uZTIgJiYgYy5waG9uZTIuaW5jbHVkZXMoc2VhcmNoKSlcbiAgICApO1xuICAgIFxuICAgIC8vIFByb2Nlc3MgU29ydC9GaWx0ZXJcbiAgICBsaXN0LnNvcnQoKGEsIGIpID0+IHtcbiAgICAgIGlmIChmaWx0ZXJUeXBlID09PSAnYWxwaGEnKSB7XG4gICAgICAgIHJldHVybiBzb3J0RGlyID09PSAnYXNjJyBcbiAgICAgICAgICA/IGEubmFtZS5sb2NhbGVDb21wYXJlKGIubmFtZSwgJ2FyJykgXG4gICAgICAgICAgOiBiLm5hbWUubG9jYWxlQ29tcGFyZShhLm5hbWUsICdhcicpO1xuICAgICAgfSBlbHNlIGlmIChmaWx0ZXJUeXBlID09PSAnZGF0ZScpIHtcbiAgICAgICAgY29uc3QgZGF0ZUEgPSBhLmNyZWF0ZWRBdCA/ICh0eXBlb2YgYS5jcmVhdGVkQXQudG9EYXRlID09PSAnZnVuY3Rpb24nID8gYS5jcmVhdGVkQXQudG9EYXRlKCkuZ2V0VGltZSgpIDogbmV3IERhdGUoYS5jcmVhdGVkQXQpLmdldFRpbWUoKSkgOiAwO1xuICAgICAgICBjb25zdCBkYXRlQiA9IGIuY3JlYXRlZEF0ID8gKHR5cGVvZiBiLmNyZWF0ZWRBdC50b0RhdGUgPT09ICdmdW5jdGlvbicgPyBiLmNyZWF0ZWRBdC50b0RhdGUoKS5nZXRUaW1lKCkgOiBuZXcgRGF0ZShiLmNyZWF0ZWRBdCkuZ2V0VGltZSgpKSA6IDA7XG4gICAgICAgIHJldHVybiBzb3J0RGlyID09PSAnYXNjJyA/IGRhdGVBIC0gZGF0ZUIgOiBkYXRlQiAtIGRhdGVBO1xuICAgICAgfSBlbHNlIGlmIChmaWx0ZXJUeXBlID09PSAnZGVidCcpIHtcbiAgICAgICAgY29uc3QgZGVidEEgPSBnZXRDdXN0b21lck91dHN0YW5kaW5nQW1vdW50KGEuaWQhKTtcbiAgICAgICAgY29uc3QgZGVidEIgPSBnZXRDdXN0b21lck91dHN0YW5kaW5nQW1vdW50KGIuaWQhKTtcbiAgICAgICAgcmV0dXJuIHNvcnREaXIgPT09ICdhc2MnID8gZGVidEEgLSBkZWJ0QiA6IGRlYnRCIC0gZGVidEE7XG4gICAgICB9IGVsc2UgaWYgKGZpbHRlclR5cGUgPT09ICdkZXZpY2VzJykge1xuICAgICAgICBjb25zdCBkZXZBID0gZ2V0Q3VzdG9tZXJSZW1haW5pbmdEZXZpY2VzKGEuaWQhKTtcbiAgICAgICAgY29uc3QgZGV2QiA9IGdldEN1c3RvbWVyUmVtYWluaW5nRGV2aWNlcyhiLmlkISk7XG4gICAgICAgIHJldHVybiBzb3J0RGlyID09PSAnYXNjJyA/IGRldkEgLSBkZXZCIDogZGV2QiAtIGRldkE7XG4gICAgICB9IGVsc2UgaWYgKGZpbHRlclR5cGUgPT09ICdjdXJyZW5jeScpIHtcbiAgICAgICAgY29uc3QgY3VyckEgPSBhLmxpYWJpbGl0eUN1cnJlbmN5IHx8ICdVU0QnO1xuICAgICAgICBjb25zdCBjdXJyQiA9IGIubGlhYmlsaXR5Q3VycmVuY3kgfHwgJ1VTRCc7XG4gICAgICAgIHJldHVybiBzb3J0RGlyID09PSAnYXNjJyBcbiAgICAgICAgICA/IGN1cnJBLmxvY2FsZUNvbXBhcmUoY3VyckIsICdhcicpIFxuICAgICAgICAgIDogY3VyckIubG9jYWxlQ29tcGFyZShjdXJyQSwgJ2FyJyk7XG4gICAgICB9IGVsc2UgaWYgKGZpbHRlclR5cGUgPT09ICdjb2RlJykge1xuICAgICAgICBjb25zdCBudW1BID0gTnVtYmVyKGEuY3VzdG9tZXJOdW1iZXIpIHx8IDA7XG4gICAgICAgIGNvbnN0IG51bUIgPSBOdW1iZXIoYi5jdXN0b21lck51bWJlcikgfHwgMDtcbiAgICAgICAgcmV0dXJuIHNvcnREaXIgPT09ICdhc2MnID8gbnVtQSAtIG51bUIgOiBudW1CIC0gbnVtQTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAwO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIGxpc3Q7XG4gIH07XG5cbiAgY29uc3Qgc2V0RmlsdGVyQW5kU29ydCA9ICh0eXBlOiAnYWxwaGEnIHwgJ2RhdGUnIHwgJ2RlYnQnIHwgJ2RldmljZXMnIHwgJ2N1cnJlbmN5JyB8ICdjb2RlJywgZGlyOiAnYXNjJyB8ICdkZXNjJykgPT4ge1xuICAgIHNldEZpbHRlclR5cGUodHlwZSk7XG4gICAgc2V0U29ydERpcihkaXIpO1xuICAgIHNldFNob3dGaWx0ZXJEcm9wZG93bihmYWxzZSk7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlSGVhZGVyQ2xpY2sgPSAodHlwZTogJ2FscGhhJyB8ICdkYXRlJyB8ICdkZWJ0JyB8ICdkZXZpY2VzJyB8ICdjdXJyZW5jeScgfCAnY29kZScpID0+IHtcbiAgICBpZiAoZmlsdGVyVHlwZSA9PT0gdHlwZSkge1xuICAgICAgc2V0U29ydERpcihwcmV2ID0+IHByZXYgPT09ICdhc2MnID8gJ2Rlc2MnIDogJ2FzYycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZXRGaWx0ZXJUeXBlKHR5cGUpO1xuICAgICAgaWYgKHR5cGUgPT09ICdkYXRlJyB8fCB0eXBlID09PSAnY29kZScgfHwgdHlwZSA9PT0gJ2RlYnQnIHx8IHR5cGUgPT09ICdkZXZpY2VzJykge1xuICAgICAgICBzZXRTb3J0RGlyKCdkZXNjJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzZXRTb3J0RGlyKCdhc2MnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgc2V0Q3VycmVudFBhZ2UoMSk7XG4gIH07XG5cbiAgY29uc3QgcmVuZGVyU29ydEFycm93ID0gKHR5cGU6ICdhbHBoYScgfCAnZGF0ZScgfCAnZGVidCcgfCAnZGV2aWNlcycgfCAnY3VycmVuY3knIHwgJ2NvZGUnKSA9PiB7XG4gICAgaWYgKGZpbHRlclR5cGUgIT09IHR5cGUpIHJldHVybiBudWxsO1xuICAgIHJldHVybiBzb3J0RGlyID09PSAnYXNjJyA/ICcg4payJyA6ICcg4pa8JztcbiAgfTtcblxuICBjb25zdCBnZXRTdGF0dXNTdHlsZSA9IChzdGF0dXM6IHN0cmluZykgPT4ge1xuICAgIHN3aXRjaChzdGF0dXMpIHtcbiAgICAgIGNhc2UgJzEwJzpcbiAgICAgIGNhc2UgJ25ldyc6XG4gICAgICAgIHJldHVybiAnYmctYmx1ZS01MDAvMTAgdGV4dC1ibHVlLTQwMCBib3JkZXItYmx1ZS01MDAvMjAnO1xuICAgICAgY2FzZSAnMjAnOlxuICAgICAgY2FzZSAnaW5zcGVjdGVkJzpcbiAgICAgIGNhc2UgJ3Rlc3RpbmcnOlxuICAgICAgICByZXR1cm4gJ2JnLWFtYmVyLTUwMC8xMCB0ZXh0LWFtYmVyLTQwMCBib3JkZXItYW1iZXItNTAwLzIwJztcbiAgICAgIGNhc2UgJzMwJzpcbiAgICAgIGNhc2UgJ2F3YWl0aW5nX2FwcHJvdmFsJzpcbiAgICAgICAgcmV0dXJuICdiZy1jeWFuLTUwMC8xMCB0ZXh0LWN5YW4tNDAwIGJvcmRlci1jeWFuLTUwMC8yMCc7XG4gICAgICBjYXNlICdhcHByb3ZlZCc6XG4gICAgICAgIHJldHVybiAnYmctdGVhbC01MDAvMTAgdGV4dC10ZWFsLTQwMCBib3JkZXItdGVhbC01MDAvMjAnO1xuICAgICAgY2FzZSAnMzUnOlxuICAgICAgY2FzZSAnYXdhaXRpbmdfcGFydHMnOlxuICAgICAgICByZXR1cm4gJ2JnLW9yYW5nZS01MDAvMTAgdGV4dC1vcmFuZ2UtNDAwIGJvcmRlci1vcmFuZ2UtNTAwLzIwJztcbiAgICAgIGNhc2UgJ3BhcnRzX2F2YWlsYWJsZSc6XG4gICAgICAgIHJldHVybiAnYmctZW1lcmFsZC01MDAvMTAgdGV4dC1lbWVyYWxkLTQwMCBib3JkZXItZW1lcmFsZC01MDAvMjAnO1xuICAgICAgY2FzZSAncGFydHNfbm90X2F2YWlsYWJsZSc6XG4gICAgICAgIHJldHVybiAnYmctcm9zZS01MDAvMTAgdGV4dC1yb3NlLTQwMCBib3JkZXItcm9zZS01MDAvMjAnO1xuICAgICAgY2FzZSAnNDAnOlxuICAgICAgY2FzZSAncmVwYWlyaW5nJzpcbiAgICAgICAgcmV0dXJuICdiZy1pbmRpZ28tNTAwLzEwIHRleHQtaW5kaWdvLTQwMCBib3JkZXItaW5kaWdvLTUwMC8yMCc7XG4gICAgICBjYXNlICc1MCc6XG4gICAgICBjYXNlICdyZWFkeSc6XG4gICAgICBjYXNlICdpbnRhY3QnOlxuICAgICAgY2FzZSAndW5yZXBhaXJhYmxlJzpcbiAgICAgIGNhc2UgJ3JlZnVzZWQnOlxuICAgICAgICByZXR1cm4gJ2JnLWVtZXJhbGQtNTAwLzEwIHRleHQtZW1lcmFsZC00MDAgYm9yZGVyLWVtZXJhbGQtNTAwLzIwJztcbiAgICAgIGNhc2UgJzYwJzpcbiAgICAgIGNhc2UgJ2RlbGl2ZXJlZCc6XG4gICAgICAgIHJldHVybiAnYmctcHVycGxlLTUwMC8xMCB0ZXh0LXB1cnBsZS00MDAgYm9yZGVyLXB1cnBsZS01MDAvMjAnO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuICdiZy1ncmF5LTUwMC8xMCB0ZXh0LWdyYXktNDAwIGJvcmRlci13aGl0ZS81JztcbiAgICB9XG4gIH07XG5cbiAgY29uc3QgZ2V0U3RhdHVzVGV4dEFyYWJpYyA9IChzdGF0dXM6IHN0cmluZykgPT4ge1xuICAgIHN3aXRjaChzdGF0dXMpIHtcbiAgICAgIGNhc2UgJzEwJzpcbiAgICAgIGNhc2UgJ25ldyc6XG4gICAgICAgIHJldHVybiAn2K/YrtmI2YQg2KzYr9mK2K8nO1xuICAgICAgY2FzZSAnMjAnOlxuICAgICAgY2FzZSAnaW5zcGVjdGVkJzpcbiAgICAgIGNhc2UgJ3Rlc3RpbmcnOlxuICAgICAgICByZXR1cm4gJ9mC2YrYryDYp9mE2YHYrdi1JztcbiAgICAgIGNhc2UgJzMwJzpcbiAgICAgIGNhc2UgJ2F3YWl0aW5nX2FwcHJvdmFsJzpcbiAgICAgICAgcmV0dXJuICfYpdmG2KrYuNin2LEg2YXZiNin2YHZgtipINin2YTYudmF2YrZhCc7XG4gICAgICBjYXNlICdhcHByb3ZlZCc6XG4gICAgICAgIHJldHVybiAn2KrZhdiqINmF2YjYp9mB2YLYqSDYp9mE2LnZhdmK2YQnO1xuICAgICAgY2FzZSAnMzUnOlxuICAgICAgY2FzZSAnYXdhaXRpbmdfcGFydHMnOlxuICAgICAgICByZXR1cm4gJ9in2YbYqti42KfYsSDZgti32Lkg2KfZhNi62YrYp9ixJztcbiAgICAgIGNhc2UgJ3BhcnRzX2F2YWlsYWJsZSc6XG4gICAgICAgIHJldHVybiAn2KrZhSDYqtmI2YHZitixINmC2LfYuSDYp9mE2LrZitin2LEnO1xuICAgICAgY2FzZSAncGFydHNfbm90X2F2YWlsYWJsZSc6XG4gICAgICAgIHJldHVybiAn2YTZhSDYqtiq2YjZgdixINmC2LfYuSDYp9mE2LrZitin2LEnO1xuICAgICAgY2FzZSAnNDAnOlxuICAgICAgY2FzZSAncmVwYWlyaW5nJzpcbiAgICAgICAgcmV0dXJuICfZgtmK2K8g2KfZhNi12YrYp9mG2KknO1xuICAgICAgY2FzZSAnNTAnOlxuICAgICAgY2FzZSAncmVhZHknOlxuICAgICAgY2FzZSAnaW50YWN0JzpcbiAgICAgIGNhc2UgJ3VucmVwYWlyYWJsZSc6XG4gICAgICBjYXNlICdyZWZ1c2VkJzpcbiAgICAgICAgcmV0dXJuICfYrNin2YfYsiDZhNmE2KrYs9mE2YrZhSc7XG4gICAgICBjYXNlICc2MCc6XG4gICAgICBjYXNlICdkZWxpdmVyZWQnOlxuICAgICAgICByZXR1cm4gJ9iq2YUg2KfZhNiq2LPZhNmK2YUg2YjYp9mE2YXYutin2K/YsdipJztcbiAgICAgIGNhc2UgJzcwJzpcbiAgICAgICAgcmV0dXJuICfYpdmE2LrYp9ihINmI2LPYrdioINin2YTYrNmH2KfYsic7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gJ9i62YrYsSDZhdit2K/Yryc7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGFsbFByb2Nlc3NlZEN1c3RvbWVycyA9IGdldFByb2Nlc3NlZEN1c3RvbWVycygpO1xuICBjb25zdCB0b3RhbFBhZ2VzID0gTWF0aC5tYXgoMSwgTWF0aC5jZWlsKGFsbFByb2Nlc3NlZEN1c3RvbWVycy5sZW5ndGggLyBpdGVtc1BlclBhZ2UpKTtcbiAgY29uc3Qgc2FmZUN1cnJlbnRQYWdlID0gTWF0aC5taW4oY3VycmVudFBhZ2UsIHRvdGFsUGFnZXMpO1xuICBjb25zdCBjdXJyZW50Q3VzdG9tZXJzID0gYWxsUHJvY2Vzc2VkQ3VzdG9tZXJzLnNsaWNlKChzYWZlQ3VycmVudFBhZ2UgLSAxKSAqIGl0ZW1zUGVyUGFnZSwgc2FmZUN1cnJlbnRQYWdlICogaXRlbXNQZXJQYWdlKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1yaWdodCBwYi0yNCBtZDpwYi02XCIgZGlyPVwicnRsXCI+XG5cbiAgICAgIDxBZGRDdXN0b21lck1vZGFsIFxuICAgICAgICBpc09wZW49e3Nob3dBZGRDdXN0b21lcn1cbiAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0U2hvd0FkZEN1c3RvbWVyKGZhbHNlKX1cbiAgICAgICAgb25TdWNjZXNzPXtvbkN1c3RvbWVyQWRkZWR9XG4gICAgICAgIGN1c3RvbWVycz17Y3VzdG9tZXJzfVxuICAgICAgICB1c2VyPXt1c2VyfVxuICAgICAgLz5cblxuICAgICAgey8qIFNtYXJ0IFNlYXJjaCBQYW5lbCAqL31cbiAgICAgIHsoIXNlbGVjdGVkQ3VzdG9tZXIgfHwgYWN0aXZlQ3VzdG9tZXJUYWIgPT09ICdtZW51JykgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImN1c3RvbWVycy1ib3ggYmctWyMxYTFhMWFdIGJvcmRlci15IGJvcmRlci13aGl0ZS81IG14LTAgbXktMCByZWxhdGl2ZVwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTMgcHgtNCBweS0zXCI+XG4gICAgICAgICAgXG4gICAgICAgICAgey8qIDEuIE5hbWUgQXV0b2NvbXBsZXRlIFNlYXJjaCAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBzcGFjZS15LTEgcmVsYXRpdmVcIj5cbiAgICAgICAgICAgIDxDdXN0b21lckF1dG9jb21wbGV0ZVxuICAgICAgICAgICAgICBjdXN0b21lcnM9e2N1c3RvbWVyc31cbiAgICAgICAgICAgICAgb25TZWxlY3Q9eyhjdXN0KSA9PiBzZWxlY3RDdXN0b21lcihjdXN0KX1cbiAgICAgICAgICAgICAgb25JbnB1dENoYW5nZT17KHZhbCkgPT4gc2V0U2VhcmNoKHZhbCl9XG4gICAgICAgICAgICAgIG9uQWRkTmV3PXsoKSA9PiBzZXRTaG93QWRkQ3VzdG9tZXIodHJ1ZSl9XG4gICAgICAgICAgICAgIGxhYmVsPVwi2KfZhNio2K3YqyDYqNin2LPZhSDYp9mE2LnZhdmK2YQg2KPZiCDYsdmC2YUg2KfZhNmH2KfYqtmBOlwiXG4gICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi2KfYqNiv2KMg2KjZg9iq2KfYqNipINin2LPZhSDYp9mE2LnZhdmK2YQg2KPZiCDYp9mE2YfYp9iq2YEuLi5cIlxuICAgICAgICAgICAgICBpbml0aWFsVmFsdWU9e3NlYXJjaH1cbiAgICAgICAgICAgICAgdHlwZT1cIm5hbWVcIlxuICAgICAgICAgICAgLz5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiBBZGQgQ3VzdG9tZXIgQnV0dG9uICovfVxuICAgICAgICAgIHtjYW5BZGQgJiYgKFxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZWxhdGl2ZSBwdC00XCI+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICBzZXRTaG93QWRkQ3VzdG9tZXIodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZEN1c3RvbWVyKG51bGwpO1xuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0zIGJnLW9yYW5nZS02MDAvMTAgaG92ZXI6Ymctb3JhbmdlLTYwMCBib3JkZXIgYm9yZGVyLW9yYW5nZS02MDAvMjAgdGV4dC1vcmFuZ2UtNTAwIGhvdmVyOnRleHQtd2hpdGUgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCBzaGFkb3ctbGcgaG92ZXI6c2hhZG93LW9yYW5nZS02MDAvMjBcIlxuICAgICAgICAgICAgICAgIHRpdGxlPVwi2KXYttin2YHYqSDYudmF2YrZhCDYrNiv2YrYr1wiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICA8VXNlclBsdXMgc2l6ZT17MjB9IC8+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBDdXN0b21lciBBY3Rpb24gTW9kYWwgKi99XG4gICAgICB7c2VsZWN0ZWRDdXN0b21lciAmJiBhY3RpdmVDdXN0b21lclRhYiA9PT0gJ21lbnUnICYmICFzaG93TG9nTW9kYWwgJiYgIXNob3dEZXRhaWxzTW9kYWwgJiYgKFxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZpeGVkIGluc2V0LTAgei1bMTAwXSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBiZy1ibGFjay84NSBiYWNrZHJvcC1ibHVyLW1kIHAtNFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY3VzdG9tZXItbW9kYWwtYmcgYmctWyMxNDE0MTRdIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC0zeGwgdy1mdWxsIG1heC13LXNtIHAtNiBzcGFjZS15LTQgc2hhZG93LTJ4bCByZWxhdGl2ZSB0ZXh0LXJpZ2h0XCI+XG4gICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gbWItNFwiPlxuICAgICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1ibGFjayB0ZXh0LXdoaXRlXCI+e3NlbGVjdGVkQ3VzdG9tZXIubmFtZX08L2gyPlxuICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBzZXRTZWxlY3RlZEN1c3RvbWVyKG51bGwpO1xuICAgICAgICAgICAgICAgICAgICBzZXRTZWFyY2goJycpO1xuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHJvdW5kZWQtbGcgdGV4dC1ncmF5LTQwMFwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPFggc2l6ZT17MTh9IC8+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgXG4gICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0xIGdhcC0zXCI+XG4gICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4gc2V0U2hvd0RldGFpbHNNb2RhbCh0cnVlKX0gY2xhc3NOYW1lPVwidy1mdWxsIHRleHQtcmlnaHQgcC00IGJnLW9yYW5nZS02MDAvMTAgaG92ZXI6Ymctb3JhbmdlLTYwMC8yMCB0ZXh0LW9yYW5nZS00MDAgcm91bmRlZC0yeGwgZm9udC1ib2xkIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBib3JkZXIgYm9yZGVyLW9yYW5nZS01MDAvMTBcIj5cbiAgICAgICAgICAgICAgICA8c3Bhbj7YqNmK2KfZhtin2Kog2KfZhNi52YXZitmEPC9zcGFuPlxuICAgICAgICAgICAgICAgIDxDaGV2cm9uTGVmdCBzaXplPXsxOH0gLz5cbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgIDxidXR0b24gXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgY29uc3QgZW50cmllcyA9IGdldFN0YXRlbWVudEVudHJpZXMoc2VsZWN0ZWRDdXN0b21lci5pZCEpO1xuICAgICAgICAgICAgICAgICAgY29uc3QgZm9ybWF0dGVkRW50cmllcyA9IGVudHJpZXMubWFwKChlbnRyeSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXR0ZWREYXRlID0gZm9ybWF0RGF0ZVRpbWUoZW50cnkuZGF0ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAuLi5lbnRyeSxcbiAgICAgICAgICAgICAgICAgICAgICBmb3JtYXR0ZWREYXRlLFxuICAgICAgICAgICAgICAgICAgICAgIGRlYml0OiBlbnRyeS5kZWJpdCxcbiAgICAgICAgICAgICAgICAgICAgICBjcmVkaXQ6IGVudHJ5LmNyZWRpdCxcbiAgICAgICAgICAgICAgICAgICAgICBydW5uaW5nQmFsYW5jZTogZW50cnkucnVubmluZ0JhbGFuY2VcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICBjb25zdCBjdXJyID0gZ2V0Q3VzdG9tZXJDdXJyZW5jeUxhYmVsKHNlbGVjdGVkQ3VzdG9tZXIuaWQhKTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGdldEFyYWJpY0N1cnJlbmN5TmFtZSA9IChjdXJyQ29kZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghY3VyckNvZGUpIHJldHVybiAn2K/ZiNmE2KfYsSc7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJyQ29kZS50b1VwcGVyQ2FzZSgpID09PSAnVVNEJykgcmV0dXJuICfYr9mI2YTYp9ixJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJDb2RlLnRvVXBwZXJDYXNlKCkgPT09ICdZRVInKSByZXR1cm4gJ9ix2YrYp9mEINmK2YXZhtmKJztcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJDb2RlLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoJ1VTRCcpICYmIGN1cnJDb2RlLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoJ1lFUicpKSByZXR1cm4gJ9iv2YjZhNin2LEgLyDYsdmK2KfZhCDZitmF2YbZiic7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJyQ29kZTtcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICBjb25zdCBhckN1cnJlbmN5ID0gZ2V0QXJhYmljQ3VycmVuY3lOYW1lKGN1cnIpO1xuXG4gICAgICAgICAgICAgICAgICBsZXQgdG90YWxEZWJpdCA9IDA7XG4gICAgICAgICAgICAgICAgICBsZXQgdG90YWxDcmVkaXQgPSAwO1xuICAgICAgICAgICAgICAgICAgZW50cmllcy5mb3JFYWNoKGUgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0b3RhbERlYml0ICs9IGUuZGViaXQ7XG4gICAgICAgICAgICAgICAgICAgIHRvdGFsQ3JlZGl0ICs9IGUuY3JlZGl0O1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICBjb25zdCBkaWZmID0gdG90YWxDcmVkaXQgLSB0b3RhbERlYml0O1xuICAgICAgICAgICAgICAgICAgY29uc3QgaXNDcmVkaXRvciA9IGRpZmYgPiAwLjAxO1xuICAgICAgICAgICAgICAgICAgY29uc3QgaXNEZWJ0b3IgPSBkaWZmIDwgLTAuMDE7XG4gICAgICAgICAgICAgICAgICBjb25zdCBiYWxhbmNlU3RhdHVzID0gaXNDcmVkaXRvciA/ICfYr9in2KbZhiAo2YTZhyDZgdmKINin2YTYrdiz2KfYqCknIDogaXNEZWJ0b3IgPyAn2YXYr9mK2YYgKNmF2KrYqNmC2Yog2LnZhNmK2Ycg2K/ZitmI2YYpJyA6ICfZhdiq2LLZhiDYp9mE2K3Ys9in2KgnO1xuXG4gICAgICAgICAgICAgICAgICBzZXRQcmV2aWV3RGF0YSh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdzdGF0ZW1lbnQnLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgc3RhdGVtZW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21lck5hbWU6IHNlbGVjdGVkQ3VzdG9tZXIubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBhbnlOYW1lOiBzZWxlY3RlZEN1c3RvbWVyLmNvbXBhbnlOYW1lIHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tZXJQaG9uZTogc2VsZWN0ZWRDdXN0b21lci5waG9uZTEgfHwgJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21lck51bWJlcjogc2VsZWN0ZWRDdXN0b21lci5jdXN0b21lck51bWJlciB8fCBzZWxlY3RlZEN1c3RvbWVyLmlkPy5zdWJzdHJpbmcoMCwgNSkgfHwgJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWxhbmNlOiBkaWZmLFxuICAgICAgICAgICAgICAgICAgICAgICAgYmFsYW5jZVN0YXR1czogYmFsYW5jZVN0YXR1cyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbmN5OiBhckN1cnJlbmN5LFxuICAgICAgICAgICAgICAgICAgICAgICAgbGlhYmlsaXR5Q3VycmVuY3k6IHNlbGVjdGVkQ3VzdG9tZXIubGlhYmlsaXR5Q3VycmVuY3kgfHwgJ1VTRCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRyaWVzOiBmb3JtYXR0ZWRFbnRyaWVzXG4gICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9fSBcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC1yaWdodCBwLTQgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LXdoaXRlIHJvdW5kZWQtMnhsIGZvbnQtYm9sZCBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyIGJvcmRlci13aGl0ZS81XCJcbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxzcGFuPtmD2LTZgSDYrdiz2KfYqDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8Q2hldnJvbkxlZnQgc2l6ZT17MTh9IC8+XG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldFNob3dMb2dNb2RhbCh0cnVlKX0gY2xhc3NOYW1lPVwidy1mdWxsIHRleHQtcmlnaHQgcC00IGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC13aGl0ZSByb3VuZGVkLTJ4bCBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGJvcmRlciBib3JkZXItd2hpdGUvNVwiPlxuICAgICAgICAgICAgICAgIDxzcGFuPtiz2KzZhCDYp9mE2LnZhdmK2YQ8L3NwYW4+XG4gICAgICAgICAgICAgICAgPENoZXZyb25MZWZ0IHNpemU9ezE4fSAvPlxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG5cbiAgICAgIHsvKiBDdXN0b21lciBEZXRhaWxzIFBhbmVsIChPbmx5IGRpc3BsYXllZCB3aGVuIGEgY2F0ZWdvcnkgaXMgc2VsZWN0ZWQpICovfVxuICAgICAge3NlbGVjdGVkQ3VzdG9tZXIgJiYgYWN0aXZlQ3VzdG9tZXJUYWIgIT09ICdtZW51JyAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY3VzdG9tZXJzLWRldGFpbHMtY2FyZCBiZy1bIzEyMTIxMl0gYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQtM3hsIHAtNiByZWxhdGl2ZSBncm91cFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYWJzb2x1dGUgdG9wLTAgcmlnaHQtMCB3LTMyIGgtMzIgYmctb3JhbmdlLTYwMC81IHJvdW5kZWQtZnVsbCBibHVyLTN4bCBwb2ludGVyLWV2ZW50cy1ub25lXCIgLz5cbiAgICAgICAgICBcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtNCBtYi02XCI+XG4gICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtd2hpdGUgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgICAgPFVzZXIgc2l6ZT17MTZ9IGNsYXNzTmFtZT1cInRleHQtb3JhbmdlLTUwMFwiLz5cbiAgICAgICAgICAgICAgPHNwYW4+e3NlbGVjdGVkQ3VzdG9tZXIubmFtZX08L3NwYW4+XG4gICAgICAgICAgICA8L2gyPlxuICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0QWN0aXZlQ3VzdG9tZXJUYWIoJ21lbnUnKX1cbiAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHJvdW5kZWQteGwgdGV4dC1ncmF5LTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGJvcmRlciBib3JkZXItd2hpdGUvNVwiXG4gICAgICAgICAgICAgICB0aXRsZT1cItin2YTYudmI2K/YqSDZhNmE2YLYp9im2YXYqVwiXG4gICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgPEFycm93UmlnaHQgc2l6ZT17MTh9IC8+XG4gICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7YWN0aXZlQ3VzdG9tZXJUYWIgPT09ICdkZXRhaWxzJyAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0xIGxnOmdyaWQtY29scy0yIGdhcC04XCI+XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHsvKiBDT0xVTU4gMTogUmVhZC1Pbmx5IFN5c3RlbSBNZXRhZGF0YSAmIEFjY291bnRzIHN0YXRlICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTQgYmctd2hpdGUvWzAuMDFdIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLTJ4bCByZWxhdGl2ZSBzcGFjZS15LTNcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYmxhY2sgdHJhY2tpbmctd2lkZXIgdGV4dC1vcmFuZ2UtNTAwIHVwcGVyY2FzZSBmb250LWNhaXJvIGJvcmRlci1iIGJvcmRlci13aGl0ZS81IHBiLTFcIj7Yp9mE2KjZitin2YbYp9iqINin2YTZhti42KfZhdmK2Kkg2KfZhNir2KfYqNiq2KkgKNi62YrYsSDZgtin2KjZhNipINmE2YTYqti52K/ZitmEKTwvZGl2PlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMSBtZDpncmlkLWNvbHMtMiBnYXAtNFwiPlxuICAgICAgICAgICAgICAgICAgey8qIEN1c3RvbWVyIG51bWJlciAqL31cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xIHRleHQtcmlnaHRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1ncmF5LTUwMCBmb250LWJvbGQgYmxvY2sgZm9udC1jYWlyb1wiPtix2YLZhSDYp9mE2LnZhdmK2YQ6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImN1c3RvbWVyLXN0YXRpYy1pbnB1dCB3LWZ1bGwgYmctWyMxNjE2MTZdIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLXhsIHB4LTMuNSBweS0yIHRleHQteHMgZm9udC1tb25vIGZvbnQtYmxhY2sgdGV4dC1ncmF5LTQwMCBjdXJzb3Itbm90LWFsbG93ZWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAje3NlbGVjdGVkQ3VzdG9tZXIuY3VzdG9tZXJOdW1iZXIgfHwgJy0tLSd9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cblxuXG4gICAgICAgICAgICAgICAgICB7LyogUmVnaXN0cmF0aW9uIGRhdGUgKi99XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMSB0ZXh0LXJpZ2h0XCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS01MDAgZm9udC1ib2xkIGJsb2NrIGZvbnQtY2Fpcm9cIj7Yqtin2LHZitiuINin2YTYqtiz2KzZitmEINio2KfZhNmF2YbYuNmI2YXYqTo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY3VzdG9tZXItc3RhdGljLWlucHV0IHctZnVsbCBiZy1bIzE2MTYxNl0gYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQteGwgcHgtMy41IHB5LTIgdGV4dC1bMTFweF0gZm9udC1ib2xkIHRleHQtZ3JheS00MDAgY3Vyc29yLW5vdC1hbGxvd2VkIGZvbnQtY2Fpcm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICB7c2VsZWN0ZWRDdXN0b21lci5jcmVhdGVkQXRcbiAgICAgICAgICAgICAgICAgICAgICAgID8gcGFyc2VEYXRlKHNlbGVjdGVkQ3VzdG9tZXIuY3JlYXRlZEF0KS50b0xvY2FsZURhdGVTdHJpbmcoJ2FyLVlFJywgeyB3ZWVrZGF5OiAnbG9uZycsIHllYXI6ICdudW1lcmljJywgbW9udGg6ICdzaG9ydCcsIGRheTogJ251bWVyaWMnIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICA6ICfYqtin2LHZitiuINmC2K/ZitmFL9mF2LPYqtmI2LHYrydcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBDYWxjdWxhdGlvbnMgYmxvY2tzIGZvciBkZXZpY2VzICYgTmV0IEFjY291bnQgYmFsYW5jZSAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0xIG1kOmdyaWQtY29scy0yIGdhcC00XCI+XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgey8qIDEuIFJlbWFpbmluZyBkZXZpY2VzIGluIHNob3AgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTQgYmctYmxhY2svMjAgYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQtMnhsIHRleHQtcmlnaHRcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS01MDAgZm9udC1ib2xkIGJsb2NrIGZvbnQtY2Fpcm8gdXBwZXJjYXNlXCI+2KfZhNij2KzZh9iy2Kkg2KfZhNmF2KrYqNmC2YrYqSDYqNmF2K3ZhCDYp9mE2LXZitin2YbYqTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1iYXNlbGluZSBnYXAtMSBtdC0xXCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBmb250LW1vbm9cIj57Z2V0Q3VzdG9tZXJSZW1haW5pbmdEZXZpY2VzKHNlbGVjdGVkQ3VzdG9tZXIuaWQhKX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtZ3JheS01MDAgdGV4dC1bMTBweF0gZm9udC1ib2xkXCI+2KPYrNmH2LLYqTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgey8qIDIuIE91dHN0YW5kaW5nIEJhbGFuY2UgJiBGaW5hbmNpYWwgaW5kaWNhdG9yICjZhNmHINij2Ygg2LnZhNmK2YcpICovfVxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC00IGJnLWJsYWNrLzIwIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLTJ4bCB0ZXh0LXJpZ2h0XCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNTAwIGZvbnQtYm9sZCBibG9jayBmb250LWNhaXJvIHVwcGVyY2FzZVwiPtit2KfZhNipINi12KfZgdmKINmF2K/ZitmI2YbZitipINin2YTYudmF2YrZhDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXQtMVwiPlxuICAgICAgICAgICAgICAgICAgICB7KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0b3RhbFBhaWQgPSBnZXRDdXN0b21lclRvdGFsUGFpZChzZWxlY3RlZEN1c3RvbWVyLmlkISk7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgdG90YWxDb3N0ID0gZ2V0Q3VzdG9tZXJUb3RhbENvc3Qoc2VsZWN0ZWRDdXN0b21lci5pZCEpO1xuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpZmYgPSB0b3RhbFBhaWQgLSB0b3RhbENvc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VyciA9IGdldEN1c3RvbWVyQ3VycmVuY3lMYWJlbChzZWxlY3RlZEN1c3RvbWVyLmlkISk7XG4gICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgaWYgKGRpZmYgPiAwLjAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWJsYWNrIHRleHQtZW1lcmFsZC00MDAgZm9udC1tb25vXCI+K3tkaWZmLnRvRml4ZWQoMil9IHtjdXJyfTwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImlubGluZS1ibG9jayBweC0yIHB5LTAuNSByb3VuZGVkLWxnIHRleHQtWzlweF0gYmctZW1lcmFsZC01MDAvMTAgYm9yZGVyIGJvcmRlci1lbWVyYWxkLTUwMC8yMCB0ZXh0LWVtZXJhbGQtNDAwIGZvbnQtYm9sZCBmb250LWNhaXJvXCI+2K/Yp9im2YYgKNmE2Ycg2YXYqtio2YLZiiDZhNiv2YrZhtinKTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGlmZiA8IC0wLjAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWJsYWNrIHRleHQtcm9zZS01MDAgZm9udC1tb25vXCI+LXtNYXRoLmFicyhkaWZmKS50b0ZpeGVkKDIpfSB7Y3Vycn08L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpbmxpbmUtYmxvY2sgcHgtMiBweS0wLjUgcm91bmRlZC1sZyB0ZXh0LVs5cHhdIGJnLXJvc2UtNTAwLzEwIGJvcmRlciBib3JkZXItcm9zZS01MDAvMjAgdGV4dC1yb3NlLTUwMCBmb250LWJvbGQgZm9udC1jYWlyb1wiPtmF2K/ZitmGICjYudmE2YrZhyDZhdiz2KrYrdmC2KfYqiDZhNmE2K/Zgdi5KTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWJsYWNrIHRleHQtc2xhdGUtNDAwIGZvbnQtbW9ub1wiPjAuMDAge2N1cnJ9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiaW5saW5lLWJsb2NrIHB4LTIgcHktMC41IHJvdW5kZWQtbGcgdGV4dC1bOXB4XSBiZy13aGl0ZS9bMC4wMl0gYm9yZGVyIGJvcmRlci13aGl0ZS81IHRleHQtc2xhdGUtNDAwIGZvbnQtYm9sZCBmb250LWNhaXJvXCI+2LHYtdmK2K8g2K7Yp9mE2Yog2YXZhiDYp9mE2YXYr9mK2YjZhtmK2KfYqjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSkoKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIHsvKiBDT0xVTU4gMjogRWRpdGFibGUvTW9kaWZpYWJsZSBTZWNvbmRhcnkgQ29udGFjdCBJbmZvcm1hdGlvbiAqL31cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS00XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC00IGJnLXdoaXRlL1swLjAxXSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC0yeGwgc3BhY2UteS00XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzUgcGItMlwiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJsYWNrIHRyYWNraW5nLXdpZGVyIHRleHQtb3JhbmdlLTUwMCB1cHBlcmNhc2UgZm9udC1jYWlyb1wiPtio2YrYp9mG2KfYqiDYp9mE2KfYqti12KfZhCDZiNin2YTYqtmB2KfYtdmK2YQgKNmC2KfYqNmE2Kkg2YTZhNiq2LnYr9mK2YQg2YjYp9mE2KrYrdix2YrYsSk8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIHshaXNFZGl0aW5nTW9kZSA/IChcbiAgICAgICAgICAgICAgICAgICAgY2FuRWRpdCAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldElzRWRpdGluZ01vZGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldFVwZGF0ZVBhc3RUcmFuc2FjdGlvbnModHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXROYW1lKHNlbGVjdGVkQ3VzdG9tZXIubmFtZSB8fCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRDb21wYW55TmFtZShzZWxlY3RlZEN1c3RvbWVyLmNvbXBhbnlOYW1lIHx8ICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdFBob25lMShzZWxlY3RlZEN1c3RvbWVyLnBob25lMSB8fCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRQaG9uZTIoc2VsZWN0ZWRDdXN0b21lci5waG9uZTIgfHwgJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0RW1haWwoc2VsZWN0ZWRDdXN0b21lci5lbWFpbCB8fCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXROb3RlcyhzZWxlY3RlZEN1c3RvbWVyLm5vdGVzIHx8ICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSBiZy1vcmFuZ2UtNjAwLzEwIGhvdmVyOmJnLW9yYW5nZS01MDAvMjAgdGV4dC1vcmFuZ2UtNDAwIGJvcmRlciBib3JkZXItb3JhbmdlLTUwMC8yNSByb3VuZGVkLW1kIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBmb250LWNhaXJvIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIlxuICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0MiBzaXplPXsxMH0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPtiq2K3YsdmK2LEg2KfZhNio2YrYp9mG2KfYqiDYp9mE2KPYs9in2LPZitipPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0SXNFZGl0aW5nTW9kZShmYWxzZSl9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LWdyYXktNDAwIHJvdW5kZWQtbWQgdGV4dC1bMTBweF0gZm9udC1ib2xkIGZvbnQtY2Fpcm8gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0cmFuc2l0aW9uLWFsbFwiXG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICDYpdmE2LrYp9ihINin2YTYqti52K/ZitmEXG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMSBtZDpncmlkLWNvbHMtMiBnYXAtNFwiPlxuXG4gICAgICAgICAgICAgICAgICB7LyogTmFtZSAqL31cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xIHRleHQtcmlnaHRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1ncmF5LTQwMCBmb250LWJvbGQgYmxvY2sgZm9udC1jYWlyb1wiPtin2LPZhSDYp9mE2LnZhdmK2YQg2YjYsdin2KjYtyDYp9mE2K3Ys9in2Kg6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFpc0VkaXRpbmdNb2RlfVxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtpc0VkaXRpbmdNb2RlID8gZWRpdE5hbWUgOiBzZWxlY3RlZEN1c3RvbWVyLm5hbWV9XG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0TmFtZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgY3VzdG9tZXItc3RhdGljLWlucHV0IHctZnVsbCB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJpZ2h0IHB5LTIuNSBweC0zLjUgYm9yZGVyIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgZm9udC1jYWlybyAke1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNFZGl0aW5nTW9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ibGFjay81MCBib3JkZXItd2hpdGUvMTAgdGV4dC13aGl0ZSBmb2N1czpib3JkZXItb3JhbmdlLTUwMCBvdXRsaW5lLW5vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLVsjMTYxNjE2XSBib3JkZXItd2hpdGUvNSB0ZXh0LWdyYXktNDAwIGN1cnNvci1ub3QtYWxsb3dlZCBzZWxlY3Qtbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgey8qIENvbXBhbnkgTmFtZSAqL31cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xIHRleHQtcmlnaHRcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1ncmF5LTQwMCBmb250LWJvbGQgYmxvY2sgZm9udC1jYWlyb1wiPtin2LPZhSDYp9mE2KzZh9ipIC8g2KfZhNi02LHZg9ipOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshaXNFZGl0aW5nTW9kZX1cbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17aXNFZGl0aW5nTW9kZSA/IGVkaXRDb21wYW55TmFtZSA6IChzZWxlY3RlZEN1c3RvbWVyLmNvbXBhbnlOYW1lIHx8ICcnKX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXRDb21wYW55TmFtZShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e2lzRWRpdGluZ01vZGUgPyAn2KfYs9mFINin2YTYtNix2YPYqSDYo9mIINin2YTYrNmH2Kkg2KXZhiDZiNis2K/Yqi4uLicgOiAn2YTYpyDZitmI2KzYryd9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgY3VzdG9tZXItc3RhdGljLWlucHV0IHctZnVsbCB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LXJpZ2h0IHB5LTIuNSBweC0zLjUgYm9yZGVyIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgZm9udC1jYWlybyAke1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNFZGl0aW5nTW9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ibGFjay81MCBib3JkZXItd2hpdGUvMTAgdGV4dC13aGl0ZSBmb2N1czpib3JkZXItb3JhbmdlLTUwMCBvdXRsaW5lLW5vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLVsjMTYxNjE2XSBib3JkZXItd2hpdGUvNSB0ZXh0LWdyYXktNDAwIGN1cnNvci1ub3QtYWxsb3dlZCBzZWxlY3Qtbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgey8qIFBob25lIDEgKi99XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMSB0ZXh0LXJpZ2h0XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1ncmF5LTQwMCBmb250LWJvbGQgYmxvY2sgZm9udC1jYWlyb1wiPtin2YTZh9in2KrZgSDYp9mE2LHYptmK2LPZijo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAge2lzRWRpdGluZ01vZGUgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0RWRpdFBob25lMSgn2YTYpyDZitmI2KzYrycpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtb3JhbmdlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIGJnLXdoaXRlLzUgcHgtMiBweS0wLjUgcm91bmRlZCBib3JkZXIgYm9yZGVyLXdoaXRlLzUgZm9udC1jYWlybyBmb250LWJsYWNrXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAg2KrYudmK2YrZhiDZhNinINmK2YjYrNivXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cInRlbFwiXG4gICAgICAgICAgICAgICAgICAgICAgaW5wdXRNb2RlPVwidGVsXCJcbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWlzRWRpdGluZ01vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2lzRWRpdGluZ01vZGUgPyBlZGl0UGhvbmUxIDogc2VsZWN0ZWRDdXN0b21lci5waG9uZTF9XG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWwgPSBlLnRhcmdldC52YWx1ZS5yZXBsYWNlKC9bXjAtOSsqI10vZywgJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdFBob25lMSh2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgY3VzdG9tZXItc3RhdGljLWlucHV0IHctZnVsbCB0ZXh0LXhzIGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1yaWdodCBweS0yLjUgcHgtMy41IGJvcmRlciByb3VuZGVkLXhsIHRyYW5zaXRpb24tYWxsICR7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc0VkaXRpbmdNb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWJsYWNrLzUwIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXdoaXRlIGZvY3VzOmJvcmRlci1vcmFuZ2UtNTAwIG91dGxpbmUtbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctWyMxNjE2MTZdIGJvcmRlci13aGl0ZS81IHRleHQtZ3JheS00MDAgY3Vyc29yLW5vdC1hbGxvd2VkIHNlbGVjdC1ub25lJ1xuICAgICAgICAgICAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIHsvKiBQaG9uZSAyICovfVxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEgdGV4dC1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNDAwIGZvbnQtYm9sZCBibG9jayBmb250LWNhaXJvXCI+2LHZgtmFINmH2KfYqtmBINir2KfZhtmI2Yo6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGVsXCJcbiAgICAgICAgICAgICAgICAgICAgICBpbnB1dE1vZGU9XCJ0ZWxcIlxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshaXNFZGl0aW5nTW9kZX1cbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17aXNFZGl0aW5nTW9kZSA/IGVkaXRQaG9uZTIgOiBzZWxlY3RlZEN1c3RvbWVyLnBob25lMiB8fCAnJ31cbiAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbCA9IGUudGFyZ2V0LnZhbHVlLnJlcGxhY2UoL1teMC05KyojXS9nLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0UGhvbmUyKHZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17aXNFZGl0aW5nTW9kZSA/ICfYsdmC2YUg2YfYp9iq2YEg2KXYttin2YHZiiDYpdmGINmI2KzYry4uLicgOiAn2LrZitixINmF2K/YrtmEJ31cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BjdXN0b21lci1zdGF0aWMtaW5wdXQgdy1mdWxsIHRleHQteHMgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LXJpZ2h0IHB5LTIuNSBweC0zLjUgYm9yZGVyIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzRWRpdGluZ01vZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctYmxhY2svNTAgYm9yZGVyLXdoaXRlLzEwIHRleHQtd2hpdGUgZm9jdXM6Ym9yZGVyLW9yYW5nZS01MDAgb3V0bGluZS1ub25lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy1bIzE2MTYxNl0gYm9yZGVyLXdoaXRlLzUgdGV4dC1ncmF5LTQwMCBjdXJzb3Itbm90LWFsbG93ZWQgc2VsZWN0LW5vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgey8qIEVtYWlsICovfVxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEgdGV4dC1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNDAwIGZvbnQtYm9sZCBibG9jayBmb250LWNhaXJvXCI+2KfZhNio2LHZitivINin2YTYpdmE2YPYqtix2YjZhtmKOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImVtYWlsXCJcbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWlzRWRpdGluZ01vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2lzRWRpdGluZ01vZGUgPyBlZGl0RW1haWwgOiBzZWxlY3RlZEN1c3RvbWVyLmVtYWlsIHx8ICcnfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0RWRpdEVtYWlsKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17aXNFZGl0aW5nTW9kZSA/ICdjdXN0b21lckBkb21haW4uY29tJyA6ICfYutmK2LEg2YXYr9iu2YQnfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGN1c3RvbWVyLXN0YXRpYy1pbnB1dCB3LWZ1bGwgdGV4dC14cyBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtcmlnaHQgcHktMi41IHB4LTMuNSBib3JkZXIgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNFZGl0aW5nTW9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ibGFjay81MCBib3JkZXItd2hpdGUvMTAgdGV4dC13aGl0ZSBmb2N1czpib3JkZXItb3JhbmdlLTUwMCBvdXRsaW5lLW5vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLVsjMTYxNjE2XSBib3JkZXItd2hpdGUvNSB0ZXh0LWdyYXktNDAwIGN1cnNvci1ub3QtYWxsb3dlZCBzZWxlY3Qtbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICB7LyogRGV0YWlscyAvIE5vdGVzIC8gTm90ZXMgKi99XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMSB0ZXh0LXJpZ2h0IG1kOmNvbC1zcGFuLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1ncmF5LTQwMCBmb250LWJvbGQgYmxvY2sgZm9udC1jYWlyb1wiPtiq2YHYp9i12YrZhCDZiNmF2YTYp9it2LjYp9iqINil2LbYp9mB2YrYqTo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshaXNFZGl0aW5nTW9kZX1cbiAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17aXNFZGl0aW5nTW9kZSA/IGVkaXROb3RlcyA6IHNlbGVjdGVkQ3VzdG9tZXIubm90ZXMgfHwgJyd9XG4gICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0Tm90ZXMoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgIHJvd3M9ezJ9XG4gICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e2lzRWRpdGluZ01vZGUgPyAn2KfZg9iq2Kgg2KPZitipINmF2YTYp9it2LjYp9iqINiq2YHYtdmK2YTZitipINij2Ygg2LnZhtmI2YbYqSDYo9iu2LHZiSDZhNmE2LnZhdmK2YQuLi4nIDogJ9mE2Kcg2KrZiNis2K8g2YXZhNin2K3YuNin2Kog2YXYs9is2YTYqSDZhNmE2LnZhdmK2YQnfVxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGN1c3RvbWVyLXN0YXRpYy1pbnB1dCB3LWZ1bGwgdGV4dC14cyBmb250LWJvbGQgdGV4dC1yaWdodCBweS0yIHB4LTMuNSBib3JkZXIgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCByZXNpemUtbm9uZSAke1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNFZGl0aW5nTW9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ibGFjay81MCBib3JkZXItd2hpdGUvMTAgdGV4dC13aGl0ZSBmb2N1czpib3JkZXItb3JhbmdlLTUwMCBvdXRsaW5lLW5vbmUgZm9udC1jYWlybydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctWyMxNjE2MTZdIGJvcmRlci13aGl0ZS81IHRleHQtZ3JheS00MDAgY3Vyc29yLW5vdC1hbGxvd2VkIHNlbGVjdC1ub25lIGZvbnQtY2Fpcm8nXG4gICAgICAgICAgICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgey8qIFdoYXRzQXBwIFRvZ2dsZSAqL31cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtgc3BhY2UteS0xIHRleHQtcmlnaHQgbWQ6Y29sLXNwYW4tMiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcC0zIHJvdW5kZWQteGwgYm9yZGVyIHRyYW5zaXRpb24tYWxsICR7aXNFZGl0aW5nTW9kZSA/ICdiZy1ibGFjay80MCBib3JkZXItd2hpdGUvMTAnIDogJ2JnLVsjMTYxNjE2XSBib3JkZXItd2hpdGUvNSBvcGFjaXR5LTgwJ31gfT5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTAuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS00MDAgZm9udC1ib2xkIGJsb2NrIGZvbnQtY2Fpcm9cIj7ZitmF2KrZhNmDINit2LPYp9ioINmI2KfYqtiz2KfYqNifPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQtWzhweF0gdGV4dC1ncmF5LTUwMCBmb250LWNhaXJvXCI+2KrYrdiv2YrYryDZh9iw2Kcg2KfZhNiu2YrYp9ixINmK2LPZhditINio2KfZhNil2LHYs9in2YQg2KfZhNiq2YTZgtin2KbZiiDYudio2LEg2KfZhNmI2KfYqtiz2KfYqC48L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFpc0VkaXRpbmdNb2RlfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEVkaXRIYXNXaGF0c2FwcCghZWRpdEhhc1doYXRzYXBwKX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B3LTEwIGgtNSByb3VuZGVkLWZ1bGwgcmVsYXRpdmUgdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwICR7IChpc0VkaXRpbmdNb2RlID8gZWRpdEhhc1doYXRzYXBwIDogc2VsZWN0ZWRDdXN0b21lci5oYXNXaGF0c2FwcCkgPyAnYmctZW1lcmFsZC02MDAgc2hhZG93LVswXzBfOHB4X3JnYmEoNSwxNTAsMTA1LDAuMyldJyA6ICdiZy1ncmF5LTcwMCcgfSAkeyFpc0VkaXRpbmdNb2RlID8gJ2N1cnNvci1ub3QtYWxsb3dlZCcgOiAnJ31gfVxuICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9e2BhYnNvbHV0ZSB0b3AtMSB3LTMgaC0zIHJvdW5kZWQtZnVsbCBiZy13aGl0ZSB0cmFuc2l0aW9uLWFsbCBkdXJhdGlvbi0zMDAgJHsgKGlzRWRpdGluZ01vZGUgPyBlZGl0SGFzV2hhdHNhcHAgOiBzZWxlY3RlZEN1c3RvbWVyLmhhc1doYXRzYXBwKSA/ICdyaWdodC02JyA6ICdyaWdodC0xJyB9YH0gLz5cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHsvKiBFZGl0IEFjdGlvbiBTYXZlIC8gRGlzY2FyZCBidXR0b25zICovfVxuICAgICAgICAgICAgICAgIHtpc0VkaXRpbmdNb2RlICYmIChcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHB0LTMgYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIGN1cnNvci1wb2ludGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0IFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImNoZWNrYm94XCIgXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja2VkPXt1cGRhdGVQYXN0VHJhbnNhY3Rpb25zfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRVcGRhdGVQYXN0VHJhbnNhY3Rpb25zKGUudGFyZ2V0LmNoZWNrZWQpfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0zIGgtMyBtZDp3LTQgbWQ6aC00IHJvdW5kZWQgYm9yZGVyLWdyYXktMzAwIHRleHQtZW1lcmFsZC02MDAgZm9jdXM6cmluZy1lbWVyYWxkLTUwMCBiZy1ibGFjay81MFwiXG4gICAgICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIG1kOnRleHQtWzEwcHhdIHRleHQtZ3JheS00MDAgZm9udC1ib2xkIGZvbnQtY2Fpcm9cIj7YtNin2YXZhCDYp9mE2KrYudin2YXZhNin2Kog2KfZhNiz2KfYqNmC2KkgKNin2YTZgdmI2KfYqtmK2LEg2YjYp9mE2YLZitmI2K8pPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yLjVcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzRWRpdGluZ01vZGUoZmFsc2UpfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMy41IHB5LTEuNSBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHRleHQtZ3JheS00MDAgcm91bmRlZC1sZyB0ZXh0LVsxMHB4XSBmb250LWJvbGQgZm9udC1jYWlybyBib3JkZXIgYm9yZGVyLXdoaXRlLzUgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgINil2YTYutin2KEg2KfZhNiq2LnYr9mK2YRcbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG5cbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17ZWRpdE5hbWUudHJpbSgpID09PSAnJyB8fCBlZGl0UGhvbmUxLnRyaW0oKSA9PT0gJycgfHwgaXNTYXZpbmdJblByb2Nlc3N9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17aGFuZGxlVXBkYXRlQ3VzdG9tZXJ9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtNC41IHB5LTEuNSBmb250LWJsYWNrIGZvbnQtY2Fpcm8gdGV4dC1bMTBweF0gYm9yZGVyIHJvdW5kZWQtbGcgc2hhZG93LWxnIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXROYW1lLnRyaW0oKSAhPT0gJycgJiYgZWRpdFBob25lMS50cmltKCkgIT09ICcnICYmICFpc1NhdmluZ0luUHJvY2Vzc1xuICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1lbWVyYWxkLTYwMCBob3ZlcjpiZy1lbWVyYWxkLTUwMCB0ZXh0LXdoaXRlIGJvcmRlci1lbWVyYWxkLTYwMCBob3ZlcjpzaGFkb3ctZW1lcmFsZC02MDAvMTUnXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLXdoaXRlL1swLjAxXSB0ZXh0LWdyYXktNTAwIGJvcmRlci13aGl0ZS81IGN1cnNvci1ub3QtYWxsb3dlZCBzaGFkb3ctbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIHtpc1NhdmluZ0luUHJvY2VzcyA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPtis2KfYsdmKINin2YTYrdmB2LguLi48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxDaGVjayBzaXplPXsxMX0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+2K3Zgdi4INmI2KrYq9io2YrYqiDYp9mE2KjZitin2YbYp9iqPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG4gICAgICAgICAgXG4gICAgICAgICAge2FjdGl2ZUN1c3RvbWVyVGFiID09PSAnc3RhdGVtZW50JyAmJiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNiBiZy1ibGFjay80MCBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC0yeGwgZmxleCBmbGV4LWNvbCBpdGVtcy1jZW50ZXIgZ2FwLTRcIj5cbiAgICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1ncmF5LTQwMCB0ZXh0LXNtIGZvbnQtYm9sZCB0ZXh0LWNlbnRlclwiPtmK2YXZg9mG2YMg2KXYtdiv2KfYsSDZg9i02YEg2K3Ys9in2Kgg2LTYp9mF2YQg2YTZhNi52YXZitmEINmF2YYg2YfZhtinPC9wPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGp1c3RpZnktY2VudGVyIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbnRyaWVzID0gZ2V0U3RhdGVtZW50RW50cmllcyhzZWxlY3RlZEN1c3RvbWVyLmlkISk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvcm1hdHRlZEVudHJpZXMgPSBlbnRyaWVzLm1hcCgoZW50cnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3JtYXR0ZWREYXRlID0gZm9ybWF0RGF0ZVRpbWUoZW50cnkuZGF0ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLi4uZW50cnksXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXR0ZWREYXRlLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGViaXQ6IGVudHJ5LmRlYml0LFxuICAgICAgICAgICAgICAgICAgICAgICAgY3JlZGl0OiBlbnRyeS5jcmVkaXQsXG4gICAgICAgICAgICAgICAgICAgICAgICBydW5uaW5nQmFsYW5jZTogZW50cnkucnVubmluZ0JhbGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyID0gZ2V0Q3VzdG9tZXJDdXJyZW5jeUxhYmVsKHNlbGVjdGVkQ3VzdG9tZXIuaWQhKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ2V0QXJhYmljQ3VycmVuY3lOYW1lID0gKGN1cnJDb2RlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoIWN1cnJDb2RlKSByZXR1cm4gJ9iv2YjZhNin2LEnO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyQ29kZS50b1VwcGVyQ2FzZSgpID09PSAnVVNEJykgcmV0dXJuICfYr9mI2YTYp9ixJztcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VyckNvZGUudG9VcHBlckNhc2UoKSA9PT0gJ1lFUicpIHJldHVybiAn2LHZitin2YQg2YrZhdmG2YonO1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyQ29kZS50b1VwcGVyQ2FzZSgpLmluY2x1ZGVzKCdVU0QnKSAmJiBjdXJyQ29kZS50b1VwcGVyQ2FzZSgpLmluY2x1ZGVzKCdZRVInKSkgcmV0dXJuICfYr9mI2YTYp9ixIC8g2LHZitin2YQg2YrZhdmG2YonO1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJyQ29kZTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJDdXJyZW5jeSA9IGdldEFyYWJpY0N1cnJlbmN5TmFtZShjdXJyKTtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgdG90YWxEZWJpdCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0b3RhbENyZWRpdCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGVudHJpZXMuZm9yRWFjaChlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICB0b3RhbERlYml0ICs9IGUuZGViaXQ7XG4gICAgICAgICAgICAgICAgICAgICAgdG90YWxDcmVkaXQgKz0gZS5jcmVkaXQ7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBkaWZmID0gdG90YWxDcmVkaXQgLSB0b3RhbERlYml0O1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpc0NyZWRpdG9yID0gZGlmZiA+IDAuMDE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGlzRGVidG9yID0gZGlmZiA8IC0wLjAxO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBiYWxhbmNlU3RhdHVzID0gaXNDcmVkaXRvciA/ICfYr9in2KbZhiAo2YTZhyDZgdmKINin2YTYrdiz2KfYqCknIDogaXNEZWJ0b3IgPyAn2YXYr9mK2YYgKNmF2KrYqNmC2Yog2LnZhNmK2Ycg2K/ZitmI2YYpJyA6ICfZhdiq2LLZhiDYp9mE2K3Ys9in2KgnO1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFByZXZpZXdEYXRhKHtcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc3RhdGVtZW50JyxcbiAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZW1lbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tZXJOYW1lOiBzZWxlY3RlZEN1c3RvbWVyLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBhbnlOYW1lOiBzZWxlY3RlZEN1c3RvbWVyLmNvbXBhbnlOYW1lIHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21lclBob25lOiBzZWxlY3RlZEN1c3RvbWVyLnBob25lMSB8fCAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tZXJOdW1iZXI6IHNlbGVjdGVkQ3VzdG9tZXIuY3VzdG9tZXJOdW1iZXIgfHwgc2VsZWN0ZWRDdXN0b21lci5pZD8uc3Vic3RyaW5nKDAsIDUpIHx8ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBiYWxhbmNlOiBkaWZmLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBiYWxhbmNlU3RhdHVzOiBiYWxhbmNlU3RhdHVzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW5jeTogYXJDdXJyZW5jeSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbGlhYmlsaXR5Q3VycmVuY3k6IHNlbGVjdGVkQ3VzdG9tZXIubGlhYmlsaXR5Q3VycmVuY3kgfHwgJ1VTRCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVudHJpZXM6IGZvcm1hdHRlZEVudHJpZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMi41IGJnLWdyYWRpZW50LXRvLXIgZnJvbS1wdXJwbGUtNjAwIHRvLWluZGlnby02MDAgaG92ZXI6ZnJvbS1wdXJwbGUtNTAwIGhvdmVyOnRvLWluZGlnby01MDAgdGV4dC13aGl0ZSByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHNoYWRvdy1sZyBzaGFkb3ctcHVycGxlLTUwMC8xMCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPEZpbGVUZXh0IHNpemU9ezE0fSAvPlxuICAgICAgICAgICAgICAgICAgPHNwYW4+2YXYudin2YrZhtipINmI2KXYtdiv2KfYsSDZg9i02YEg2K3Ys9in2Kg8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9idXR0b24+XG5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVudHJpZXMgPSBnZXRTdGF0ZW1lbnRFbnRyaWVzKHNlbGVjdGVkQ3VzdG9tZXIuaWQhKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRvdGFsRGViaXQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBsZXQgdG90YWxDcmVkaXQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBlbnRyaWVzLmZvckVhY2goZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgdG90YWxEZWJpdCArPSBlLmRlYml0O1xuICAgICAgICAgICAgICAgICAgICAgIHRvdGFsQ3JlZGl0ICs9IGUuY3JlZGl0O1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdW5wYWlkID0gdG90YWxEZWJpdCAtIHRvdGFsQ3JlZGl0O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh1bnBhaWQgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCfYrdiz2KfYqCDYp9mE2LnZhdmK2YQg2YXYqtiy2YYg2KPZiCDYr9in2KbZhtiMINmE2Kcg2K3Yp9is2Kkg2YTYpdix2LPYp9mEINiq2LDZg9mK2LEuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgc2VuZFVuaXZlcnNhbFJlbWluZGVyKHtcbiAgICAgICAgICAgICAgICAgICAgICBjdXN0b21lck5hbWU6IHNlbGVjdGVkQ3VzdG9tZXIubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICBwaG9uZTogc2VsZWN0ZWRDdXN0b21lci5waG9uZTEsXG4gICAgICAgICAgICAgICAgICAgICAgYW1vdW50OiB1bnBhaWQsXG4gICAgICAgICAgICAgICAgICAgICAgY3VycmVuY3k6IHNlbGVjdGVkQ3VzdG9tZXIuY3VycmVuY3kgfHwgJ1VTRCcsXG4gICAgICAgICAgICAgICAgICAgICAgaGFzV2hhdHNhcHA6IHNlbGVjdGVkQ3VzdG9tZXIuaGFzV2hhdHNhcHAgIT09IHVuZGVmaW5lZCA/IHNlbGVjdGVkQ3VzdG9tZXIuaGFzV2hhdHNhcHAgOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgIGNvdW50cnlDb2RlOiBzaG9wQ29uZmlnPy5jb3VudHJ5Q29kZVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC02IHB5LTIuNSBiZy1ncmFkaWVudC10by1yIGZyb20tZW1lcmFsZC02MDAgdG8tdGVhbC02MDAgaG92ZXI6ZnJvbS1lbWVyYWxkLTUwMCBob3Zlcjp0by10ZWFsLTUwMCB0ZXh0LXdoaXRlIHJvdW5kZWQteGwgdGV4dC14cyBmb250LWJvbGQgc2hhZG93LWxnIHNoYWRvdy1lbWVyYWxkLTYwMC8xMCB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiXG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPE1lc3NhZ2VDaXJjbGUgc2l6ZT17MTR9IC8+XG4gICAgICAgICAgICAgICAgICA8c3Bhbj7Ypdix2LPYp9mEINiq2LDZg9mK2LEg2LPYr9in2K8gKNmI2KfYqtiz2KfYqC9TTVMpPC9zcGFuPlxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG5cbiAgICAgICAgICB7YWN0aXZlQ3VzdG9tZXJUYWIgPT09ICdsb2cnICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicHQtNiBib3JkZXItdCBib3JkZXItd2hpdGUvNSBzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LXdoaXRlIGZvbnQtYm9sZCB0ZXh0LXNtXCI+XG4gICAgICAgICAgICAgICAgPEZpbGVUZXh0IHNpemU9ezE2fSBjbGFzc05hbWU9XCJ0ZXh0LW9yYW5nZS01MDBcIiAvPlxuICAgICAgICAgICAgICAgIDxzcGFuPtiz2KzZhNin2Kog2YjZgdmI2KfYqtmK2LEg2KfZhNi52YXZitmEINin2YTZhdin2YTZiiDZiNin2YTYqtmC2YbZiiAoe2N1c3RvbWVySW52b2ljZXMubGVuZ3RofSk8L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctYmxhY2svMjUgcm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci13aGl0ZS81IG92ZXJmbG93LWhpZGRlblwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3ZlcmZsb3cteC1hdXRvXCI+XG4gICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVwidy1mdWxsIHRleHQtcmlnaHQgYm9yZGVyLWNvbGxhcHNlIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0ciBjbGFzc05hbWU9XCJiZy13aGl0ZS9bMC4wMl0gYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzUgdGV4dC1ncmF5LTUwMCB1cHBlcmNhc2VcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC02IHB5LTMgZm9udC1ib2xkXCI+2LHZgtmFINin2YTZgdin2KrZiNix2Kk8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTYgcHktMyBmb250LWJvbGRcIj7Yqtin2LHZitiuINin2YTZgdin2KrZiNix2Kk8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTYgcHktMyBmb250LWJvbGRcIj7Yudiv2K8g2KfZhNij2KzZh9iy2Kk8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTYgcHktMyBmb250LWJvbGRcIj7Yp9mE2KrZg9mE2YHYqSDYp9mE2KXYrNmF2KfZhNmK2Kk8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTYgcHktMyBmb250LWJvbGRcIj7Yp9mE2YXYr9mB2YjYuTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtNiBweS0zIGZvbnQtYm9sZFwiPtin2YTZhdiq2KjZgtmKPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC02IHB5LTMgZm9udC1ib2xkXCI+2K3Yp9mE2Kkg2KfZhNmB2KfYqtmI2LHYqTwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgPC90aGVhZD5cbiAgICAgICAgICAgICAgICAgICAgPHRib2R5IGNsYXNzTmFtZT1cImRpdmlkZS15IGRpdmlkZS13aGl0ZS81IHRleHQtc2xhdGUtMzAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAge2N1c3RvbWVySW52b2ljZXMubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY29sU3Bhbj17N30gY2xhc3NOYW1lPVwicHgtNiBweS04IHRleHQtY2VudGVyIHRleHQtZ3JheS01MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICDZhNinINiq2YjYrNivINmB2YjYp9iq2YrYsSDZhdiz2KzZhNipINmE2YfYsNinINin2YTYudmF2YrZhC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbWVySW52b2ljZXMubWFwKChpbnYpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaW52SXRlbXMgPSBpdGVtcy5maWx0ZXIoaXQgPT4gaXQuaW52b2ljZU51bWJlciA9PT0gaW52Lmludm9pY2VOdW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtc0NvdW50ID0gaW52SXRlbXMucmVkdWNlKChhY2MsIGl0KSA9PiBhY2MgKyAoTnVtYmVyKGl0LnF1YW50aXR5KSB8fCAwKSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdHVhbENvc3QgPSBnZXRJbnZvaWNlQWN0dWFsQ29zdChpbnZJdGVtcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbWFpbmluZ0ZvckludiA9IE1hdGgubWF4KDAsIGFjdHVhbENvc3QgLSBOdW1iZXIoaW52LmFtb3VudFBhaWQgfHwgMCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyID0gaW52LmN1cnJlbmN5IHx8ICdVU0QnO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdyb3VwIGNvdW50cyBieSBzdGF0dXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhdHVzR3JvdXBzOiB7IFtzdGF0dXM6IHN0cmluZ106IG51bWJlciB9ID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGludkl0ZW1zLmZvckVhY2goaXQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1clN0YXR1cyA9IGl0LnN0YXR1cyB8fCAnMTAnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1c0dyb3Vwc1tjdXJTdGF0dXNdID0gKHN0YXR1c0dyb3Vwc1tjdXJTdGF0dXNdIHx8IDApICsgKE51bWJlcihpdC5xdWFudGl0eSkgfHwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIga2V5PXtpbnYuaWR9IGNsYXNzTmFtZT1cImhvdmVyOmJnLXdoaXRlL1swLjAxXSB0cmFuc2l0aW9uLWNvbG9yc1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTYgcHktNCBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtd2hpdGVcIj57aW52Lmludm9pY2VOdW1iZXJ9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC02IHB5LTQgZm9udC1tb25vIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpbnYuY3JlYXRlZEF0IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gKGZ1bmN0aW9uKCl7IGNvbnN0IGQgPSBwYXJzZURhdGUoaW52LmNyZWF0ZWRBdCk7IHJldHVybiBkID8gZC50b0xvY2FsZURhdGVTdHJpbmcoJ2FyLVlFJykgOiAnLS0tJzsgfSkoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJy0tLSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC02IHB5LTQgZm9udC1tb25vXCI+e2l0ZW1zQ291bnR9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC02IHB5LTQgZm9udC1tb25vIHRleHQtd2hpdGUgZm9udC1ib2xkXCI+e2FjdHVhbENvc3QudG9GaXhlZCgyKX0gPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LWdyYXktNTAwXCI+e2N1cnJ9PC9zcGFuPjwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtNiBweS00IGZvbnQtbW9ubyB0ZXh0LWVtZXJhbGQtNDAwXCI+e051bWJlcihpbnYuYW1vdW50UGFpZCB8fCAwKS50b0ZpeGVkKDIpfSA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtZ3JheS01MDBcIj57Y3Vycn08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC02IHB5LTQgZm9udC1tb25vIHRleHQtcm9zZS01MDAgZm9udC1ib2xkXCI+e3JlbWFpbmluZ0Zvckludi50b0ZpeGVkKDIpfSA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtZ3JheS01MDBcIj57Y3Vycn08L3NwYW4+PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC02IHB5LTRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIGdhcC0xLjUganVzdGlmeS1lbmRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7T2JqZWN0LmVudHJpZXMoc3RhdHVzR3JvdXBzKS5tYXAoKFtzdGF0dXMsIGNvdW50XSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e3N0YXR1c30gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBqdXN0aWZ5LWVuZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1ncmF5LTQwMCBmb250LW1vbm9cIj57Y291bnR9eDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgaW5saW5lLWJsb2NrIHB4LTIuNSBweS0wLjUgcm91bmRlZC1mdWxsIGJvcmRlciB0ZXh0LVs5cHhdIGZvbnQtYm9sZCAke2dldFN0YXR1c1N0eWxlKHN0YXR1cyl9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2dldFN0YXR1c1RleHRBcmFiaWMoc3RhdHVzKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAgey8qIEJvdHRvbSBhY3Rpb24gYmxvY2sgKFVuaXF1ZSBJRCBwbGFjZWhvbGRlcikgKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGp1c3RpZnktZW5kIHB0LTRcIj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS01MDAgZm9udC1ib2xkIGZvbnQtY2Fpcm8gZm9udC1tb25vXCI+2KfZhNmF2LnYsdmBINin2YTZgdix2YrYrzoge3NlbGVjdGVkQ3VzdG9tZXIuaWR9PC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIENvbXByZWhlbnNpdmUgQ3VzdG9tZXJzIExpc3QgUmVnaXN0cnkgKExvYWRlZCBkaXJlY3RseSBpbnRvIGRhdGFiYXNlIHRhYmxlIGJlbG93IHNlYXJjaCBpbnB1dHMpICovfVxuICAgICAgeyghc2VsZWN0ZWRDdXN0b21lciB8fCBhY3RpdmVDdXN0b21lclRhYiA9PT0gJ21lbnUnKSAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY3VzdG9tZXJzLWJveCBiZy1bIzFhMWExYV0gYm9yZGVyLXkgYm9yZGVyLXdoaXRlLzUgbXgtMCBteS00IHNwYWNlLXktMFwiPlxuICAgICAgICB7LyogSGVhZGVycyBhbmQgQWR2YW5jZWQgU29ydCBmaWx0ZXJzICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMiBwLTMgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMS41IGJnLW9yYW5nZS02MDAvMTAgdGV4dC1vcmFuZ2UtNTAwIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci1vcmFuZ2UtNTAwLzE1XCI+XG4gICAgICAgICAgICAgIDxVc2VycyBzaXplPXsxNn0gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHNtOnRleHQteHMgZm9udC1ibGFjayBmb250LWNhaXJvIHRleHQtd2hpdGVcIj7YrNiv2YjZhCDYrNmF2YrYuSDYp9mE2LnZhdmE2KfYoSDYp9mE2YXYs9is2YTZitmGINmB2Yog2KfZhNmG2LjYp9mFPC9oMz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICBcbiAgICAgICAgICB7LyogRmlsdGVyIERyb3Bkb3duICovfVxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVsYXRpdmVcIj5cbiAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2hvd0ZpbHRlckRyb3Bkb3duKCFzaG93RmlsdGVyRHJvcGRvd24pfVxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yIHB5LTEuNSBiZy13aGl0ZS81IGhvdmVyOmJnLW9yYW5nZS02MDAvMjAgdGV4dC1ncmF5LTQwMCBob3Zlcjp0ZXh0LW9yYW5nZS01MDAgcm91bmRlZC1sZyB0cmFuc2l0aW9uLWFsbCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIGZvbnQtYm9sZCBmb250LWNhaXJvIHNtOmJsb2NrIGhpZGRlblwiPtiq2LHYqtmK2Kgg2YjZgdix2LI8L3NwYW4+XG4gICAgICAgICAgICAgIDxBcnJvd1VwRG93biBzaXplPXsxMn0gLz5cbiAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICB7c2hvd0ZpbHRlckRyb3Bkb3duICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJhYnNvbHV0ZSB6LTUwIGxlZnQtMCBtdC0yIGJnLVsjMWYxZjFmXSBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQteGwgc2hhZG93LTJ4bCBwLTEuNSB3LTQ4XCI+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBzZXRGaWx0ZXJBbmRTb3J0KCdhbHBoYScsICdhc2MnKX0gY2xhc3NOYW1lPVwidy1mdWxsIHRleHQtcmlnaHQgcHgtMyBweS0xLjUgdGV4dC1bMTBweF0gaG92ZXI6Ymctb3JhbmdlLTYwMCBob3Zlcjp0ZXh0LXdoaXRlIHRleHQtc2xhdGUtMzAwIHJvdW5kZWQgZm9udC1ib2xkIGZvbnQtY2Fpcm8gdHJhbnNpdGlvbi1jb2xvcnNcIj7Yo9io2KzYr9mKICjYoyDYpdmE2Ykg2YopPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBzZXRGaWx0ZXJBbmRTb3J0KCdhbHBoYScsICdkZXNjJyl9IGNsYXNzTmFtZT1cInctZnVsbCB0ZXh0LXJpZ2h0IHB4LTMgcHktMS41IHRleHQtWzEwcHhdIGhvdmVyOmJnLW9yYW5nZS02MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXNsYXRlLTMwMCByb3VuZGVkIGZvbnQtYm9sZCBmb250LWNhaXJvIHRyYW5zaXRpb24tY29sb3JzXCI+2KPYqNis2K/ZiiAo2Yog2KXZhNmJINijKTwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4gc2V0RmlsdGVyQW5kU29ydCgnZGF0ZScsICdkZXNjJyl9IGNsYXNzTmFtZT1cInctZnVsbCB0ZXh0LXJpZ2h0IHB4LTMgcHktMS41IHRleHQtWzEwcHhdIGhvdmVyOmJnLW9yYW5nZS02MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXNsYXRlLTMwMCByb3VuZGVkIGZvbnQtYm9sZCBmb250LWNhaXJvIHRyYW5zaXRpb24tY29sb3JzXCI+2KrYp9ix2YrYriDYp9mE2KrYs9is2YrZhCDYp9mE2KPYrdiv2Ks8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldEZpbHRlckFuZFNvcnQoJ2RhdGUnLCAnYXNjJyl9IGNsYXNzTmFtZT1cInctZnVsbCB0ZXh0LXJpZ2h0IHB4LTMgcHktMS41IHRleHQtWzEwcHhdIGhvdmVyOmJnLW9yYW5nZS02MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXNsYXRlLTMwMCByb3VuZGVkIGZvbnQtYm9sZCBmb250LWNhaXJvIHRyYW5zaXRpb24tY29sb3JzXCI+2KrYp9ix2YrYriDYp9mE2KrYs9is2YrZhCDYp9mE2KPZgtiv2YU8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldEZpbHRlckFuZFNvcnQoJ2RlYnQnLCAnYXNjJyl9IGNsYXNzTmFtZT1cInctZnVsbCB0ZXh0LXJpZ2h0IHB4LTMgcHktMS41IHRleHQtWzEwcHhdIGhvdmVyOmJnLW9yYW5nZS02MDAgaG92ZXI6dGV4dC13aGl0ZSB0ZXh0LXNsYXRlLTMwMCByb3VuZGVkIGZvbnQtYm9sZCBmb250LWNhaXJvIHRyYW5zaXRpb24tY29sb3JzXCI+2KfZhNmF2K/ZitmI2YbZitipICjYp9mE2KPZgtmEINij2YjZhNin2YspPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBvbkNsaWNrPXsoKSA9PiBzZXRGaWx0ZXJBbmRTb3J0KCdkZWJ0JywgJ2Rlc2MnKX0gY2xhc3NOYW1lPVwidy1mdWxsIHRleHQtcmlnaHQgcHgtMyBweS0xLjUgdGV4dC1bMTBweF0gaG92ZXI6Ymctb3JhbmdlLTYwMCBob3Zlcjp0ZXh0LXdoaXRlIHRleHQtc2xhdGUtMzAwIHJvdW5kZWQgZm9udC1ib2xkIGZvbnQtY2Fpcm8gdHJhbnNpdGlvbi1jb2xvcnNcIj7Yp9mE2YXYr9mK2YjZhtmK2KkgKNin2YTYo9mD2KvYsSDYo9mI2YTYp9mLKTwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIHsvKiBUaGUgQ3VzdG9tZXJzIERhdGEgVGFibGUgKi99XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIG92ZXJmbG93LWhpZGRlblwiPlxuICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC1yaWdodCBib3JkZXItY29sbGFwc2UgdGFibGUtZml4ZWQgc2VsZWN0LW5vbmVcIj5cbiAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgPHRyIGNsYXNzTmFtZT1cImJnLXdoaXRlLzUgYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzEwIHRleHQtZ3JheS00MDAgdGV4dC1bOXB4XSBzbTp0ZXh0LVsxMHB4XVwiPlxuICAgICAgICAgICAgICAgIDx0aCBvbkNsaWNrPXsoKSA9PiBoYW5kbGVIZWFkZXJDbGljaygnY29kZScpfSBjbGFzc05hbWU9XCJweC0xIHB5LTEuNSBmb250LWJvbGQgdGV4dC1jZW50ZXIgdy0xMCBzbTp3LTE2IGN1cnNvci1wb2ludGVyIGhvdmVyOmJnLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUgdHJhbnNpdGlvbi1hbGwgc2VsZWN0LW5vbmVcIj5cbiAgICAgICAgICAgICAgICAgINin2YTZg9mI2K97cmVuZGVyU29ydEFycm93KCdjb2RlJyl9XG4gICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICA8dGggb25DbGljaz17KCkgPT4gaGFuZGxlSGVhZGVyQ2xpY2soJ2FscGhhJyl9IGNsYXNzTmFtZT1cInB4LTEgcHktMS41IGZvbnQtYm9sZCB3LTEvNCBjdXJzb3ItcG9pbnRlciBob3ZlcjpiZy13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlIHRyYW5zaXRpb24tYWxsIHNlbGVjdC1ub25lXCI+XG4gICAgICAgICAgICAgICAgICDYp9iz2YUg2KfZhNi52YXZitmEe3JlbmRlclNvcnRBcnJvdygnYWxwaGEnKX1cbiAgICAgICAgICAgICAgICA8L3RoPlxuICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC0xIHB5LTEuNSBmb250LWJvbGRcIj7YsdmC2YUg2KfZhNis2YjYp9mEPC90aD5cbiAgICAgICAgICAgICAgICA8dGggb25DbGljaz17KCkgPT4gaGFuZGxlSGVhZGVyQ2xpY2soJ2RldmljZXMnKX0gY2xhc3NOYW1lPVwicHgtMSBweS0xLjUgZm9udC1ib2xkIHRleHQtY2VudGVyIHctMTIgc206dy0xNiB3aGl0ZXNwYWNlLW5vd3JhcCBjdXJzb3ItcG9pbnRlciBob3ZlcjpiZy13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlIHRyYW5zaXRpb24tYWxsIHNlbGVjdC1ub25lXCI+XG4gICAgICAgICAgICAgICAgICDYo9is2YfYstipe3JlbmRlclNvcnRBcnJvdygnZGV2aWNlcycpfVxuICAgICAgICAgICAgICAgIDwvdGg+XG4gICAgICAgICAgICAgICAgPHRoIG9uQ2xpY2s9eygpID0+IGhhbmRsZUhlYWRlckNsaWNrKCdkZWJ0Jyl9IGNsYXNzTmFtZT1cInB4LTEgcHktMS41IGZvbnQtYm9sZCB0ZXh0LWNlbnRlciB3LTE0IHNtOnctMTYgd2hpdGVzcGFjZS1ub3dyYXAgY3Vyc29yLXBvaW50ZXIgaG92ZXI6Ymctd2hpdGUvMTAgaG92ZXI6dGV4dC13aGl0ZSB0cmFuc2l0aW9uLWFsbCBzZWxlY3Qtbm9uZVwiPlxuICAgICAgICAgICAgICAgICAg2KfZhNmF2K/ZitmI2YbZitipe3JlbmRlclNvcnRBcnJvdygnZGVidCcpfVxuICAgICAgICAgICAgICAgIDwvdGg+XG4gICAgICAgICAgICAgICAgPHRoIG9uQ2xpY2s9eygpID0+IGhhbmRsZUhlYWRlckNsaWNrKCdjdXJyZW5jeScpfSBjbGFzc05hbWU9XCJweC0xIHB5LTEuNSBmb250LWJvbGQgdGV4dC1jZW50ZXIgdy0xNCBzbTp3LTE4IHdoaXRlc3BhY2Utbm93cmFwIGN1cnNvci1wb2ludGVyIGhvdmVyOmJnLXdoaXRlLzEwIGhvdmVyOnRleHQtd2hpdGUgdHJhbnNpdGlvbi1hbGwgc2VsZWN0LW5vbmVcIj5cbiAgICAgICAgICAgICAgICAgINi52YXZhNipINin2YTYrdiz2KfYqHtyZW5kZXJTb3J0QXJyb3coJ2N1cnJlbmN5Jyl9XG4gICAgICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICAgICAgICA8dGggb25DbGljaz17KCkgPT4gaGFuZGxlSGVhZGVyQ2xpY2soJ2RhdGUnKX0gY2xhc3NOYW1lPVwicHgtMSBweS0xLjUgZm9udC1ib2xkIHRleHQtY2VudGVyIHctMTQgc206dy0yMCB3aGl0ZXNwYWNlLW5vd3JhcCBjdXJzb3ItcG9pbnRlciBob3ZlcjpiZy13aGl0ZS8xMCBob3Zlcjp0ZXh0LXdoaXRlIHRyYW5zaXRpb24tYWxsIHNlbGVjdC1ub25lXCI+XG4gICAgICAgICAgICAgICAgICDYqtin2LHZitiuINin2YTYqtiz2KzZitmEe3JlbmRlclNvcnRBcnJvdygnZGF0ZScpfVxuICAgICAgICAgICAgICAgIDwvdGg+XG4gICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICA8dGJvZHkgY2xhc3NOYW1lPVwiZGl2aWRlLXkgZGl2aWRlLXdoaXRlLzUgdGV4dC1zbGF0ZS0zMDAgdGV4dC1bMTBweF0gc206dGV4dC14c1wiPlxuICAgICAgICAgICAgICAgIHtjdXJyZW50Q3VzdG9tZXJzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgICAgPHRkIGNvbFNwYW49ezd9IGNsYXNzTmFtZT1cInB4LTIgcHktOCB0ZXh0LWNlbnRlciB0ZXh0LWdyYXktNTAwIGZvbnQtYm9sZCBmb250LWNhaXJvIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICDZhNinINmK2YjYrNivINi52YXZhNin2KEg2YXYt9in2KjZgtmK2YYg2YTZhNio2K3YqyDYrdin2YTZitin2YsuXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICBjdXJyZW50Q3VzdG9tZXJzLm1hcCgoY3VzdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZW1haW5pbmdEZXZpY2VzID0gZ2V0Q3VzdG9tZXJSZW1haW5pbmdEZXZpY2VzKGN1c3QuaWQhKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb3V0c3RhbmRpbmdBbXQgPSBnZXRDdXN0b21lck91dHN0YW5kaW5nQW1vdW50KGN1c3QuaWQhKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VyckxhYmVsID0gZ2V0Q3VzdG9tZXJDdXJyZW5jeUxhYmVsKGN1c3QuaWQhKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNTZWxlY3RlZCA9IHNlbGVjdGVkQ3VzdG9tZXI/LmlkID09PSBjdXN0LmlkO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgPHRyIGtleT17Y3VzdC5pZH0gY2xhc3NOYW1lPVwiaG92ZXI6Ymctd2hpdGUvWzAuMDNdIHRyYW5zaXRpb24tY29sb3JzIGN1cnNvci1wb2ludGVyXCIgb25DbGljaz17KCkgPT4gc2VsZWN0Q3VzdG9tZXIoY3VzdCl9PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInB4LTEgcHktMSBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtZ3JheS01MDAgdGV4dC1jZW50ZXIgdGV4dC1bOXB4XSBzbTp0ZXh0LVsxMHB4XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB7Y3VzdC5jdXN0b21lck51bWJlciB8fCAnLS0tJ31cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtMSBweS0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YGZvbnQtYm9sZCB0ZXh0LVsxMHB4XSBzbTp0ZXh0LXhzIHRydW5jYXRlICR7aXNTZWxlY3RlZCA/ICd0ZXh0LW9yYW5nZS00MDAnIDogJ3RleHQtd2hpdGUnfWB9PntjdXN0Lm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtjdXN0Lm5vdGVzICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzhweF0gc206dGV4dC1bOXB4XSB0ZXh0LWdyYXktNTAwIGxpbmUtY2xhbXAtMVwiPntjdXN0Lm5vdGVzfTwvc3Bhbj59XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC0xIHB5LTEgZm9udC1tb25vIHRleHQtc2xhdGUtNDAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHRleHQtWzlweF0gc206dGV4dC1bMTBweF0gdHJ1bmNhdGVcIj57Y3VzdC5waG9uZTF9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtjdXN0LnBob25lMiAmJiA8c3BhbiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciB0ZXh0LVs4cHhdIHNtOnRleHQtWzlweF0gdGV4dC1ncmF5LTYwMCB0cnVuY2F0ZVwiPntjdXN0LnBob25lMn08L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtMSBweS0xIHRleHQtY2VudGVyIHdoaXRlc3BhY2Utbm93cmFwIHRleHQtWzlweF0gc206dGV4dC1bMTBweF1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge3JlbWFpbmluZ0RldmljZXMgPiAwID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImlubGluZS1ibG9jayBiZy1vcmFuZ2UtNTAwLzEwIHRleHQtb3JhbmdlLTQwMCBweC0xIHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVtYWluaW5nRGV2aWNlc31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS02MDAgZm9udC1ib2xkXCI+LTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtMSBweS0xIHRleHQtY2VudGVyIHdoaXRlc3BhY2Utbm93cmFwIHRleHQtWzlweF0gc206dGV4dC1bMTBweF1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge291dHN0YW5kaW5nQW10ID4gMCA/IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpbmxpbmUtYmxvY2sgYmctcm9zZS01MDAvMTAgdGV4dC1yb3NlLTQwMCBweC0xIHB5LTAuNSByb3VuZGVkIHRleHQtWzlweF0gZm9udC1ib2xkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7b3V0c3RhbmRpbmdBbXQudG9GaXhlZCgwKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1zbGF0ZS02MDAgdGV4dC1bOXB4XSBmb250LWJvbGRcIj4wPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC0xIHB5LTEgdGV4dC1jZW50ZXIgd2hpdGVzcGFjZS1ub3dyYXAgdGV4dC1bOXB4XSBzbTp0ZXh0LVsxMHB4XVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJpbmxpbmUtYmxvY2sgYmctd2hpdGUvNSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgdGV4dC1ncmF5LTMwMCBweC0xLjUgcHktMC41IHJvdW5kZWQgdGV4dC1bOXB4XSBmb250LWJsYWNrXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyID0gY3VzdC5saWFiaWxpdHlDdXJyZW5jeSB8fCAnVVNEJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyID09PSAnVVNEJykgcmV0dXJuICfYr9mI2YTYp9ixJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyID09PSAnU0FSJykgcmV0dXJuICfYsdmK2KfZhCDYs9i52YjYr9mKJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyID09PSAnWUVSJykgcmV0dXJuICfYsdmK2KfZhCDZitmF2YbZiic7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY3VyciA9PT0gJ0VVUicpIHJldHVybiAn2YrZiNix2YgnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN1cnI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkoKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC0xIHB5LTEgZm9udC1tb25vIHRleHQtc2xhdGUtNDAwIHRleHQtWzlweF0gc206dGV4dC1bMTBweF0gdGV4dC1jZW50ZXIgd2hpdGVzcGFjZS1ub3dyYXBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge2N1c3QuY3JlYXRlZEF0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAoZnVuY3Rpb24oKXsgY29uc3QgZCA9IHBhcnNlRGF0ZShjdXN0LmNyZWF0ZWRBdCk7IHJldHVybiBkID8gZC50b0xvY2FsZURhdGVTdHJpbmcoJ2FyLVlFJywgeyB5ZWFyOiAnMi1kaWdpdCcsIG1vbnRoOiAnbnVtZXJpYycsIGRheTogJ251bWVyaWMnIH0pIDogJy0tLSc7IH0pKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICctLS0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgIDwvdGFibGU+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICBcbiAgICAgICAgey8qIFBhZ2luYXRpb24gQ29udHJvbHMgKi99XG4gICAgICAgIHt0b3RhbFBhZ2VzID4gMSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcHgtNCBweS0zIGJvcmRlci10IGJvcmRlci13aGl0ZS81IGJnLWJsYWNrLzIwXCI+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtZ3JheS01MDAgZm9udC1ib2xkIGZvbnQtY2Fpcm9cIj5cbiAgICAgICAgICAgICAg2LnYsdi2IHsoKHNhZmVDdXJyZW50UGFnZSAtIDEpICogaXRlbXNQZXJQYWdlKSArIDF9INil2YTZiSB7TWF0aC5taW4oc2FmZUN1cnJlbnRQYWdlICogaXRlbXNQZXJQYWdlLCBhbGxQcm9jZXNzZWRDdXN0b21lcnMubGVuZ3RoKX0g2YXZhiDYo9i12YQge2FsbFByb2Nlc3NlZEN1c3RvbWVycy5sZW5ndGh9INi52YXZitmEXG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtzYWZlQ3VycmVudFBhZ2UgPT09IDF9XG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0Q3VycmVudFBhZ2UocHJldiA9PiBNYXRoLm1heCgxLCBwcmV2IC0gMSkpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMgcHktMS41IHRleHQteHMgZm9udC1ib2xkIGZvbnQtY2Fpcm8gYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCBkaXNhYmxlZDpvcGFjaXR5LTUwIGRpc2FibGVkOmN1cnNvci1ub3QtYWxsb3dlZCBib3JkZXIgYm9yZGVyLXdoaXRlLzEwIHJvdW5kZWQtbGcgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAg2KfZhNiz2KfYqNmCXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0xIG14LTJcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYm9sZCB0ZXh0LXdoaXRlXCI+e3NhZmVDdXJyZW50UGFnZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LWdyYXktNTAwXCI+2YXZhiB7dG90YWxQYWdlc308L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e3NhZmVDdXJyZW50UGFnZSA9PT0gdG90YWxQYWdlc31cbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRDdXJyZW50UGFnZShwcmV2ID0+IE1hdGgubWluKHRvdGFsUGFnZXMsIHByZXYgKyAxKSl9XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMyBweS0xLjUgdGV4dC14cyBmb250LWJvbGQgZm9udC1jYWlybyBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIGRpc2FibGVkOm9wYWNpdHktNTAgZGlzYWJsZWQ6Y3Vyc29yLW5vdC1hbGxvd2VkIGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyB0cmFuc2l0aW9uLWFsbFwiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICDYp9mE2KrYp9mE2YpcbiAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIENVU1RPTUVSIFNUQVRFTUVOVCBPVkVSTEFZIElTIE5PVyBIQU5ETEVEIEJZIFByaW50UHJldmlld092ZXJsYXkgKi99XG5cbiAgICAgIHsvKiA3LiBDVVNUT01FUiBERVRBSUxTIE1PREFMICovfVxuICAgICAge3Nob3dEZXRhaWxzTW9kYWwgJiYgc2VsZWN0ZWRDdXN0b21lciAmJiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgaW5zZXQtMCB6LVsxMDBdIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWJsYWNrLzk1IGJhY2tkcm9wLWJsdXIteGxcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImN1c3RvbWVyLW1vZGFsLWJnIGJnLVsjMTQxNDE0XSB3LWZ1bGwgaC1mdWxsIHAtNiBtZDpwLTggc3BhY2UteS02IHNoYWRvdy0yeGwgcmVsYXRpdmUgb3ZlcmZsb3cteS1hdXRvIHRleHQtcmlnaHRcIj5cbiAgICAgICAgICAgIHsvKiBNb2RhbCBBY3Rpb25zICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzUgcGItNCBwcmludDpoaWRkZW5cIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtNFwiPlxuICAgICAgICAgICAgICAgICA8YnV0dG9uIG9uQ2xpY2s9eygpID0+IHNldFNob3dEZXRhaWxzTW9kYWwoZmFsc2UpfSBjbGFzc05hbWU9XCJwLTIgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCByb3VuZGVkLXhsIHRleHQtZ3JheS00MDBcIj5cbiAgICAgICAgICAgICAgICAgICAgPFggc2l6ZT17MjB9IC8+XG4gICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtb3JhbmdlLTQwMCBmb250LWNhaXJvIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgZmxleC1yb3ctcmV2ZXJzZVwiPlxuICAgICAgICAgICAgICAgICAgICA8VXNlciBzaXplPXsxOH0gLz5cbiAgICAgICAgICAgICAgICAgICAg2KjZitin2YbYp9iqINin2YTYudmF2YrZhCDYp9mE2YXYp9mE2YrYqSDZiNin2YTYqtmB2LXZitmE2YrYqVxuICAgICAgICAgICAgICAgICA8L2gzPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7LyogRGV0YWlscyBDb250ZW50ICovfVxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0xIGxnOmdyaWQtY29scy0yIGdhcC04XCI+XG4gICAgICAgICAgICAgIHsvKiBDT0xVTU4gMTogUmVhZC1Pbmx5IFN5c3RlbSBNZXRhZGF0YSAmIEFjY291bnRzIHN0YXRlICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC00IGJnLXdoaXRlL1swLjAxXSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC0yeGwgcmVsYXRpdmUgc3BhY2UteS0zXCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYmxhY2sgdHJhY2tpbmctd2lkZXIgdGV4dC1vcmFuZ2UtNTAwIHVwcGVyY2FzZSBmb250LWNhaXJvIGJvcmRlci1iIGJvcmRlci13aGl0ZS81IHBiLTFcIj7Yp9mE2KjZitin2YbYp9iqINin2YTZhti42KfZhdmK2Kkg2KfZhNir2KfYqNiq2Kk8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0xIG1kOmdyaWQtY29scy0yIGdhcC00XCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xIHRleHQtcmlnaHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNTAwIGZvbnQtYm9sZCBibG9jayBmb250LWNhaXJvXCI+2LHZgtmFINin2YTYudmF2YrZhDo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjdXN0b21lci1zdGF0aWMtaW5wdXQgdy1mdWxsIGJnLVsjMTYxNjE2XSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC14bCBweC0zLjUgcHktMiB0ZXh0LXhzIGZvbnQtbW9ubyBmb250LWJsYWNrIHRleHQtZ3JheS00MDAgY3Vyc29yLW5vdC1hbGxvd2VkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAje3NlbGVjdGVkQ3VzdG9tZXIuY3VzdG9tZXJOdW1iZXIgfHwgJy0tLSd9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xIHRleHQtcmlnaHRcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNTAwIGZvbnQtYm9sZCBibG9jayBmb250LWNhaXJvXCI+2KfYs9mFINin2YTYudmF2YrZhDo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjdXN0b21lci1zdGF0aWMtaW5wdXQgdy1mdWxsIGJnLVsjMTYxNjE2XSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC14bCBweC0zLjUgcHktMiB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWdyYXktNDAwIGN1cnNvci1ub3QtYWxsb3dlZCBmb250LWNhaXJvXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7c2VsZWN0ZWRDdXN0b21lci5uYW1lfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMSB0ZXh0LXJpZ2h0XCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1ncmF5LTUwMCBmb250LWJvbGQgYmxvY2sgZm9udC1jYWlyb1wiPtin2LPZhSDYp9mE2KzZh9ipIC8g2KfZhNi02LHZg9ipOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImN1c3RvbWVyLXN0YXRpYy1pbnB1dCB3LWZ1bGwgYmctWyMxNjE2MTZdIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLXhsIHB4LTMuNSBweS0yIHRleHQteHMgZm9udC1ib2xkIHRleHQtZ3JheS00MDAgY3Vyc29yLW5vdC1hbGxvd2VkIGZvbnQtY2Fpcm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzZWxlY3RlZEN1c3RvbWVyLmNvbXBhbnlOYW1lIHx8ICfZhNinINmK2YjYrNivJ31cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEgdGV4dC1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS01MDAgZm9udC1ib2xkIGJsb2NrIGZvbnQtY2Fpcm9cIj7Yqtin2LHZitiuINin2YTYqtiz2KzZitmEOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImN1c3RvbWVyLXN0YXRpYy1pbnB1dCB3LWZ1bGwgYmctWyMxNjE2MTZdIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLXhsIHB4LTMuNSBweS0yIHRleHQtWzExcHhdIGZvbnQtYm9sZCB0ZXh0LWdyYXktNDAwIGN1cnNvci1ub3QtYWxsb3dlZCBmb250LWNhaXJvXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7c2VsZWN0ZWRDdXN0b21lci5jcmVhdGVkQXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPyAoZnVuY3Rpb24oKXsgY29uc3QgZCA9IHBhcnNlRGF0ZShzZWxlY3RlZEN1c3RvbWVyLmNyZWF0ZWRBdCk7IHJldHVybiBkID8gZC50b0xvY2FsZURhdGVTdHJpbmcoJ2FyLVlFJykgOiAnLS0tJzsgfSkoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICA6ICctLS0nXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogQ2FsY3VsYXRpb25zIGJsb2NrcyBmb3IgZGV2aWNlcyAmIE5ldCBBY2NvdW50IGJhbGFuY2UgKi99XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0xIG1kOmdyaWQtY29scy0yIGdhcC00XCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNCBiZy1ibGFjay8yMCBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC0yeGwgdGV4dC1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNTAwIGZvbnQtYm9sZCBibG9jayBmb250LWNhaXJvIHVwcGVyY2FzZVwiPtin2YTYo9is2YfYstipINin2YTZhdiq2KjZgtmK2Kkg2KjZhdit2YQg2KfZhNi12YrYp9mG2Kk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1iYXNlbGluZSBnYXAtMSBtdC0xXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0yeGwgZm9udC1ibGFjayB0ZXh0LXdoaXRlIGZvbnQtbW9ub1wiPntnZXRDdXN0b21lclJlbWFpbmluZ0RldmljZXMoc2VsZWN0ZWRDdXN0b21lci5pZCEpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktNTAwIHRleHQtWzEwcHhdIGZvbnQtYm9sZFwiPtij2KzZh9iy2Kk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC00IGJnLWJsYWNrLzIwIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLTJ4bCB0ZXh0LXJpZ2h0XCI+XG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS01MDAgZm9udC1ib2xkIGJsb2NrIGZvbnQtY2Fpcm8gdXBwZXJjYXNlXCI+2K3Yp9mE2Kkg2LXYp9mB2Yog2YXYr9mK2YjZhtmK2Kkg2KfZhNi52YXZitmEPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm10LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsUGFpZCA9IGdldEN1c3RvbWVyVG90YWxQYWlkKHNlbGVjdGVkQ3VzdG9tZXIuaWQhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsQ29zdCA9IGdldEN1c3RvbWVyVG90YWxDb3N0KHNlbGVjdGVkQ3VzdG9tZXIuaWQhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRpZmYgPSB0b3RhbFBhaWQgLSB0b3RhbENvc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyID0gZ2V0Q3VzdG9tZXJDdXJyZW5jeUxhYmVsKHNlbGVjdGVkQ3VzdG9tZXIuaWQhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRpZmYgPiAwLjAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1ibGFjayB0ZXh0LWVtZXJhbGQtNDAwIGZvbnQtbW9ub1wiPit7ZGlmZi50b0ZpeGVkKDIpfSB7Y3Vycn08L2Rpdj47XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRpZmYgPCAtMC4wMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtYmxhY2sgdGV4dC1yb3NlLTUwMCBmb250LW1vbm9cIj57ZGlmZi50b0ZpeGVkKDIpfSB7Y3Vycn08L2Rpdj47XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtYmxhY2sgdGV4dC1zbGF0ZS00MDAgZm9udC1tb25vXCI+MC4wMCB7Y3Vycn08L2Rpdj47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgfSkoKX1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgey8qIENPTFVNTiAyOiBFZGl0YWJsZS9Nb2RpZmlhYmxlIFNlY29uZGFyeSBDb250YWN0IEluZm9ybWF0aW9uICovfVxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktNFwiPlxuICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNCBiZy13aGl0ZS9bMC4wMV0gYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQtMnhsIHNwYWNlLXktNFwiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzUgcGItMlwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYmxhY2sgdHJhY2tpbmctd2lkZXIgdGV4dC1vcmFuZ2UtNTAwIHVwcGVyY2FzZSBmb250LWNhaXJvXCI+2KjZitin2YbYp9iqINin2YTYp9iq2LXYp9mEINmI2KfZhNiq2YHYp9i12YrZhDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICB7IWlzRWRpdGluZ01vZGUgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldElzRWRpdGluZ01vZGUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldFVwZGF0ZVBhc3RUcmFuc2FjdGlvbnModHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXROYW1lKHNlbGVjdGVkQ3VzdG9tZXIubmFtZSB8fCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRDb21wYW55TmFtZShzZWxlY3RlZEN1c3RvbWVyLmNvbXBhbnlOYW1lIHx8ICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdFBob25lMShzZWxlY3RlZEN1c3RvbWVyLnBob25lMSB8fCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRQaG9uZTIoc2VsZWN0ZWRDdXN0b21lci5waG9uZTIgfHwgJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0RW1haWwoc2VsZWN0ZWRDdXN0b21lci5lbWFpbCB8fCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXROb3RlcyhzZWxlY3RlZEN1c3RvbWVyLm5vdGVzIHx8ICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC0yLjUgcHktMSBiZy1vcmFuZ2UtNjAwLzEwIGhvdmVyOmJnLW9yYW5nZS01MDAvMjAgdGV4dC1vcmFuZ2UtNDAwIGJvcmRlciBib3JkZXItb3JhbmdlLTUwMC8yNSByb3VuZGVkLW1kIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBmb250LWNhaXJvIHRyYW5zaXRpb24tYWxsIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjVcIlxuICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxFZGl0MiBzaXplPXsxMH0gLz5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPtiq2K3YsdmK2LE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc0VkaXRpbmdNb2RlKGZhbHNlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIGJnLXdoaXRlLzUgaG92ZXI6Ymctd2hpdGUvMTAgdGV4dC1ncmF5LTQwMCByb3VuZGVkLW1kIHRleHQtWzEwcHhdIGZvbnQtYm9sZCBmb250LWNhaXJvIGJvcmRlciBib3JkZXItd2hpdGUvMTAgdHJhbnNpdGlvbi1hbGxcIlxuICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgINil2YTYutin2KEg2KfZhNiq2LnYr9mK2YRcbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGJvcmRlci1iIGJvcmRlci13aGl0ZS81IHBiLTJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJsYWNrIHRyYWNraW5nLXdpZGVyIHRleHQtb3JhbmdlLTUwMCB1cHBlcmNhc2UgZm9udC1jYWlyb1wiPtio2YrYp9mG2KfYqiDYp9mE2KfYqti12KfZhCDZiNin2YTYqtmB2KfYtdmK2YQgKNmC2KfYqNmE2Kkg2YTZhNiq2LnYr9mK2YQg2YjYp9mE2KrYrdix2YrYsSk8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgeyFpc0VkaXRpbmdNb2RlID8gKFxuICAgICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRJc0VkaXRpbmdNb2RlKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRVcGRhdGVQYXN0VHJhbnNhY3Rpb25zKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0TmFtZShzZWxlY3RlZEN1c3RvbWVyLm5hbWUgfHwgJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0Q29tcGFueU5hbWUoc2VsZWN0ZWRDdXN0b21lci5jb21wYW55TmFtZSB8fCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNldEVkaXRQaG9uZTEoc2VsZWN0ZWRDdXN0b21lci5waG9uZTEgfHwgJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0UGhvbmUyKHNlbGVjdGVkQ3VzdG9tZXIucGhvbmUyIHx8ICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RWRpdEVtYWlsKHNlbGVjdGVkQ3VzdG9tZXIuZW1haWwgfHwgJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRFZGl0Tm90ZXMoc2VsZWN0ZWRDdXN0b21lci5ub3RlcyB8fCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgYmctb3JhbmdlLTYwMC8xMCBob3ZlcjpiZy1vcmFuZ2UtNTAwLzIwIHRleHQtb3JhbmdlLTQwMCBib3JkZXIgYm9yZGVyLW9yYW5nZS01MDAvMjUgcm91bmRlZC1tZCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgZm9udC1jYWlybyB0cmFuc2l0aW9uLWFsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCJcbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8RWRpdDIgc2l6ZT17MTB9IC8+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj7Yqtit2LHZitixINin2YTYqNmK2KfZhtin2Kog2KfZhNij2LPYp9iz2YrYqTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldElzRWRpdGluZ01vZGUoZmFsc2UpfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicHgtMi41IHB5LTEgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LWdyYXktNDAwIHJvdW5kZWQtbWQgdGV4dC1bMTBweF0gZm9udC1ib2xkIGZvbnQtY2Fpcm8gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCB0cmFuc2l0aW9uLWFsbFwiXG4gICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAg2KXZhNi62KfYoSDYp9mE2KrYudiv2YrZhFxuICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMSBtZDpncmlkLWNvbHMtMiBnYXAtNFwiPlxuICBcbiAgICAgICAgICAgICAgICAgIHsvKiBOYW1lICovfVxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEgdGV4dC1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNDAwIGZvbnQtYm9sZCBibG9jayBmb250LWNhaXJvXCI+2KfYs9mFINin2YTYudmF2YrZhCDZiNix2KfYqNi3INin2YTYrdiz2KfYqDo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWlzRWRpdGluZ01vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2lzRWRpdGluZ01vZGUgPyBlZGl0TmFtZSA6IHNlbGVjdGVkQ3VzdG9tZXIubmFtZX1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEVkaXROYW1lKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BjdXN0b21lci1zdGF0aWMtaW5wdXQgdy1mdWxsIHRleHQteHMgZm9udC1ib2xkIHRleHQtcmlnaHQgcHktMi41IHB4LTMuNSBib3JkZXIgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCBmb250LWNhaXJvICR7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc0VkaXRpbmdNb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWJsYWNrLzUwIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXdoaXRlIGZvY3VzOmJvcmRlci1vcmFuZ2UtNTAwIG91dGxpbmUtbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctWyMxNjE2MTZdIGJvcmRlci13aGl0ZS81IHRleHQtZ3JheS00MDAgY3Vyc29yLW5vdC1hbGxvd2VkIHNlbGVjdC1ub25lJ1xuICAgICAgICAgICAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICB7LyogQ29tcGFueSBOYW1lICovfVxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEgdGV4dC1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNDAwIGZvbnQtYm9sZCBibG9jayBmb250LWNhaXJvXCI+2KfYs9mFINin2YTYrNmH2KkgLyDYp9mE2LTYsdmD2Kk6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8aW5wdXRcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFpc0VkaXRpbmdNb2RlfVxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtpc0VkaXRpbmdNb2RlID8gZWRpdENvbXBhbnlOYW1lIDogKHNlbGVjdGVkQ3VzdG9tZXIuY29tcGFueU5hbWUgfHwgJycpfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0RWRpdENvbXBhbnlOYW1lKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17aXNFZGl0aW5nTW9kZSA/ICfYp9iz2YUg2KfZhNi02LHZg9ipINij2Ygg2KfZhNis2YfYqSDYpdmGINmI2KzYr9iqLi4uJyA6ICfZhNinINmK2YjYrNivJ31cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BjdXN0b21lci1zdGF0aWMtaW5wdXQgdy1mdWxsIHRleHQteHMgZm9udC1ib2xkIHRleHQtcmlnaHQgcHktMi41IHB4LTMuNSBib3JkZXIgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCBmb250LWNhaXJvICR7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc0VkaXRpbmdNb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWJsYWNrLzUwIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXdoaXRlIGZvY3VzOmJvcmRlci1vcmFuZ2UtNTAwIG91dGxpbmUtbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctWyMxNjE2MTZdIGJvcmRlci13aGl0ZS81IHRleHQtZ3JheS00MDAgY3Vyc29yLW5vdC1hbGxvd2VkIHNlbGVjdC1ub25lJ1xuICAgICAgICAgICAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICB7LyogUGhvbmUgMSAqL31cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEgdGV4dC1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNDAwIGZvbnQtYm9sZCBibG9jayBmb250LWNhaXJvXCI+2KfZhNmH2KfYqtmBINin2YTYsdim2YrYs9mKOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtpc0VkaXRpbmdNb2RlICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJidXR0b25cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldEVkaXRQaG9uZTEoJ9mE2Kcg2YrZiNis2K8nKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtb3JhbmdlLTQwMCBob3Zlcjp0ZXh0LXdoaXRlIGJnLXdoaXRlLzUgcHgtMiBweS0wLjUgcm91bmRlZCBib3JkZXIgYm9yZGVyLXdoaXRlLzUgZm9udC1jYWlybyBmb250LWJsYWNrXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgINiq2LnZitmK2YYg2YTYpyDZitmI2KzYr1xuICAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWlzRWRpdGluZ01vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17aXNFZGl0aW5nTW9kZSA/IGVkaXRQaG9uZTEgOiBzZWxlY3RlZEN1c3RvbWVyLnBob25lMX1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0RWRpdFBob25lMShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BjdXN0b21lci1zdGF0aWMtaW5wdXQgdy1mdWxsIHRleHQteHMgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LXJpZ2h0IHB5LTIuNSBweC0zLjUgYm9yZGVyIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaXNFZGl0aW5nTW9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWJsYWNrLzUwIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXdoaXRlIGZvY3VzOmJvcmRlci1vcmFuZ2UtNTAwIG91dGxpbmUtbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy1bIzE2MTYxNl0gYm9yZGVyLXdoaXRlLzUgdGV4dC1ncmF5LTQwMCBjdXJzb3Itbm90LWFsbG93ZWQgc2VsZWN0LW5vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICB7LyogUGhvbmUgMiAqL31cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEgdGV4dC1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS00MDAgZm9udC1ib2xkIGJsb2NrIGZvbnQtY2Fpcm9cIj7YsdmC2YUg2YfYp9iq2YEg2KvYp9mG2YjZijo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwidGV4dFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17IWlzRWRpdGluZ01vZGV9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17aXNFZGl0aW5nTW9kZSA/IGVkaXRQaG9uZTIgOiBzZWxlY3RlZEN1c3RvbWVyLnBob25lMiB8fCAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0RWRpdFBob25lMihlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17aXNFZGl0aW5nTW9kZSA/ICfYsdmC2YUg2YfYp9iq2YEg2KXYttin2YHZiiDYpdmGINmI2KzYry4uLicgOiAn2LrZitixINmF2K/YrtmEJ31cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGN1c3RvbWVyLXN0YXRpYy1pbnB1dCB3LWZ1bGwgdGV4dC14cyBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtcmlnaHQgcHktMi41IHB4LTMuNSBib3JkZXIgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCAke1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpc0VkaXRpbmdNb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctYmxhY2svNTAgYm9yZGVyLXdoaXRlLzEwIHRleHQtd2hpdGUgZm9jdXM6Ym9yZGVyLW9yYW5nZS01MDAgb3V0bGluZS1ub25lJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogJ2JnLVsjMTYxNjE2XSBib3JkZXItd2hpdGUvNSB0ZXh0LWdyYXktNDAwIGN1cnNvci1ub3QtYWxsb3dlZCBzZWxlY3Qtbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgIH1gfVxuICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICAgIHsvKiBFbWFpbCAqL31cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEgdGV4dC1yaWdodFwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS00MDAgZm9udC1ib2xkIGJsb2NrIGZvbnQtY2Fpcm9cIj7Yp9mE2KjYsdmK2K8g2KfZhNil2YTZg9iq2LHZiNmG2Yo6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImVtYWlsXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXshaXNFZGl0aW5nTW9kZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtpc0VkaXRpbmdNb2RlID8gZWRpdEVtYWlsIDogc2VsZWN0ZWRDdXN0b21lci5lbWFpbCB8fCAnJ31cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0RWRpdEVtYWlsKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtpc0VkaXRpbmdNb2RlID8gJ2N1c3RvbWVyQGRvbWFpbi5jb20nIDogJ9i62YrYsSDZhdiv2K7ZhCd9XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BjdXN0b21lci1zdGF0aWMtaW5wdXQgdy1mdWxsIHRleHQteHMgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LXJpZ2h0IHB5LTIuNSBweC0zLjUgYm9yZGVyIHJvdW5kZWQteGwgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaXNFZGl0aW5nTW9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gJ2JnLWJsYWNrLzUwIGJvcmRlci13aGl0ZS8xMCB0ZXh0LXdoaXRlIGZvY3VzOmJvcmRlci1vcmFuZ2UtNTAwIG91dGxpbmUtbm9uZSdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy1bIzE2MTYxNl0gYm9yZGVyLXdoaXRlLzUgdGV4dC1ncmF5LTQwMCBjdXJzb3Itbm90LWFsbG93ZWQgc2VsZWN0LW5vbmUnXG4gICAgICAgICAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICB7LyogRGV0YWlscyAvIE5vdGVzIC8gTm90ZXMgKi99XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xIHRleHQtcmlnaHQgbWQ6Y29sLXNwYW4tMlwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS00MDAgZm9udC1ib2xkIGJsb2NrIGZvbnQtY2Fpcm9cIj7YqtmB2KfYtdmK2YQg2YjZhdmE2KfYrdi42KfYqiDYpdi22KfZgdmK2Kk6PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDx0ZXh0YXJlYVxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9eyFpc0VkaXRpbmdNb2RlfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2lzRWRpdGluZ01vZGUgPyBlZGl0Tm90ZXMgOiBzZWxlY3RlZEN1c3RvbWVyLm5vdGVzIHx8ICcnfVxuICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRFZGl0Tm90ZXMoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgcm93cz17Mn1cbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPXtpc0VkaXRpbmdNb2RlID8gJ9in2YPYqtioINij2YrYqSDZhdmE2KfYrdi42KfYqiDYqtmB2LXZitmE2YrYqSDYo9mIINi52YbZiNmG2Kkg2KPYrtix2Ykg2YTZhNi52YXZitmELi4uJyA6ICfZhNinINiq2YjYrNivINmF2YTYp9it2LjYp9iqINmF2LPYrNmE2Kkg2YTZhNi52YXZitmEJ31cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGN1c3RvbWVyLXN0YXRpYy1pbnB1dCB3LWZ1bGwgdGV4dC14cyBmb250LWJvbGQgdGV4dC1yaWdodCBweS0yIHB4LTMuNSBib3JkZXIgcm91bmRlZC14bCB0cmFuc2l0aW9uLWFsbCByZXNpemUtbm9uZSAke1xuICAgICAgICAgICAgICAgICAgICAgICAgaXNFZGl0aW5nTW9kZVxuICAgICAgICAgICAgICAgICAgICAgICAgICA/ICdiZy1ibGFjay81MCBib3JkZXItd2hpdGUvMTAgdGV4dC13aGl0ZSBmb2N1czpib3JkZXItb3JhbmdlLTUwMCBvdXRsaW5lLW5vbmUgZm9udC1jYWlybydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctWyMxNjE2MTZdIGJvcmRlci13aGl0ZS81IHRleHQtZ3JheS00MDAgY3Vyc29yLW5vdC1hbGxvd2VkIHNlbGVjdC1ub25lIGZvbnQtY2Fpcm8nXG4gICAgICAgICAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB7LyogRWRpdCBBY3Rpb24gU2F2ZSAvIERpc2NhcmQgYnV0dG9ucyAqL31cbiAgICAgICAgICAgICAgICB7aXNFZGl0aW5nTW9kZSAmJiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwdC0zIGJvcmRlci10IGJvcmRlci13aGl0ZS81XCI+XG4gICAgICAgICAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiBjdXJzb3ItcG9pbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU9XCJjaGVja2JveFwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17dXBkYXRlUGFzdFRyYW5zYWN0aW9uc31cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0VXBkYXRlUGFzdFRyYW5zYWN0aW9ucyhlLnRhcmdldC5jaGVja2VkKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInctMyBoLTMgbWQ6dy00IG1kOmgtNCByb3VuZGVkIGJvcmRlci1ncmF5LTMwMCB0ZXh0LWVtZXJhbGQtNjAwIGZvY3VzOnJpbmctZW1lcmFsZC01MDAgYmctYmxhY2svNTBcIlxuICAgICAgICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSBtZDp0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNDAwIGZvbnQtYm9sZCBmb250LWNhaXJvXCI+2LTYp9mF2YQg2KfZhNiq2LnYp9mF2YTYp9iqINin2YTYs9in2KjZgtipICjYp9mE2YHZiNin2KrZitixINmI2KfZhNmC2YrZiNivKTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9sYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRJc0VkaXRpbmdNb2RlKGZhbHNlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTMuNSBweS0xLjUgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LWdyYXktNDAwIHJvdW5kZWQtbGcgdGV4dC1bMTBweF0gZm9udC1ib2xkIGZvbnQtY2Fpcm8gYm9yZGVyIGJvcmRlci13aGl0ZS81IHRyYW5zaXRpb24tYWxsXCJcbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICDYpdmE2LrYp9ihINin2YTYqti52K/ZitmEXG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwiYnV0dG9uXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtlZGl0TmFtZS50cmltKCkgPT09ICcnIHx8IGVkaXRQaG9uZTEudHJpbSgpID09PSAnJyB8fCBpc1NhdmluZ0luUHJvY2Vzc31cbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVVwZGF0ZUN1c3RvbWVyfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcHgtNC41IHB5LTEuNSBmb250LWJsYWNrIGZvbnQtY2Fpcm8gdGV4dC1bMTBweF0gYm9yZGVyIHJvdW5kZWQtbGcgc2hhZG93LWxnIGZsZXggaXRlbXMtY2VudGVyIGdhcC0xLjUgdHJhbnNpdGlvbi1hbGwgJHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdE5hbWUudHJpbSgpICE9PSAnJyAmJiBlZGl0UGhvbmUxLnRyaW0oKSAhPT0gJycgJiYgIWlzU2F2aW5nSW5Qcm9jZXNzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctb3JhbmdlLTYwMCBib3JkZXItb3JhbmdlLTYwMCB0ZXh0LXdoaXRlIGhvdmVyOmJnLW9yYW5nZS01MDAnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAnYmctd2hpdGUvMTAgYm9yZGVyLXdoaXRlLzUgdGV4dC1ncmF5LTUwMCBjdXJzb3Itbm90LWFsbG93ZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICB7aXNTYXZpbmdJblByb2Nlc3MgPyAn2KzYp9ix2Yog2KfZhNit2YHYuC4uLicgOiAn2K3Zgdi4INin2YTYqti52K/ZitmE2KfYqid9XG4gICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKX1cblxuICAgICAgey8qIDguIENVU1RPTUVSIElOVk9JQ0VTIExPRyBNT0RBTCAqL31cbiAgICAgIHtzaG93TG9nTW9kYWwgJiYgc2VsZWN0ZWRDdXN0b21lciAmJiAoKCkgPT4ge1xuICAgICAgICAvLyBSb2J1c3QgbWF0Y2hpbmcgaGVscGVyIHRvIHNvbHZlIGFueSBsb29zZSBvciBtaXNzaW5nIElEIGxpbmtzXG4gICAgICAgIGNvbnN0IG1hdGNoZXNDdXN0b21lciA9IChpbnY6IGFueSkgPT4ge1xuICAgICAgICAgIGlmICghaW52IHx8ICFzZWxlY3RlZEN1c3RvbWVyKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gMS4gRGlyZWN0IElEIGNoZWNrXG4gICAgICAgICAgaWYgKGludi5jdXN0b21lcklkICYmIHNlbGVjdGVkQ3VzdG9tZXIuaWQgJiYgaW52LmN1c3RvbWVySWQgPT09IHNlbGVjdGVkQ3VzdG9tZXIuaWQpIHJldHVybiB0cnVlO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGNsZWFuUGhvbmUgPSAocDogc3RyaW5nKSA9PiBwID8gcC5yZXBsYWNlKC9bXFxzXFwtXFwrXFwoXFwpXS9nLCAnJykgOiAnJztcbiAgICAgICAgICBjb25zdCBjbGVhbk5hbWUgPSAobjogc3RyaW5nKSA9PiBuID8gbi50cmltKCkudG9Mb3dlckNhc2UoKSA6ICcnO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIDIuIFBob25lIGNoZWNrIGZhbGxiYWNrXG4gICAgICAgICAgaWYgKGludi5jdXN0b21lclBob25lICYmIChzZWxlY3RlZEN1c3RvbWVyLnBob25lMSB8fCBzZWxlY3RlZEN1c3RvbWVyLnBob25lMikpIHtcbiAgICAgICAgICAgIGNvbnN0IGludlAgPSBjbGVhblBob25lKGludi5jdXN0b21lclBob25lKTtcbiAgICAgICAgICAgIGlmIChpbnZQKSB7XG4gICAgICAgICAgICAgIGlmIChzZWxlY3RlZEN1c3RvbWVyLnBob25lMSAmJiBjbGVhblBob25lKHNlbGVjdGVkQ3VzdG9tZXIucGhvbmUxKSA9PT0gaW52UCkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgIGlmIChzZWxlY3RlZEN1c3RvbWVyLnBob25lMiAmJiBjbGVhblBob25lKHNlbGVjdGVkQ3VzdG9tZXIucGhvbmUyKSA9PT0gaW52UCkgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIDMuIE5hbWUgY2hlY2sgZmFsbGJhY2tcbiAgICAgICAgICBpZiAoaW52LmN1c3RvbWVyTmFtZSAmJiBzZWxlY3RlZEN1c3RvbWVyLm5hbWUpIHtcbiAgICAgICAgICAgIGNvbnN0IGludk4gPSBjbGVhbk5hbWUoaW52LmN1c3RvbWVyTmFtZSk7XG4gICAgICAgICAgICBjb25zdCBjdXN0TiA9IGNsZWFuTmFtZShzZWxlY3RlZEN1c3RvbWVyLm5hbWUpO1xuICAgICAgICAgICAgaWYgKGludk4gJiYgY3VzdE4gJiYgKGludk4gPT09IGN1c3ROIHx8IGludk4uaW5jbHVkZXMoY3VzdE4pIHx8IGN1c3ROLmluY2x1ZGVzKGludk4pKSkge1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGFsbEludnMgPSBpbnZvaWNlcy5maWx0ZXIobWF0Y2hlc0N1c3RvbWVyKTtcbiAgICAgICAgY29uc3QgdG90YWxJbnZzQ291bnQgPSBhbGxJbnZzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgdG90YWxCaWxsZWRWYWwgPSBhbGxJbnZzLnJlZHVjZSgoc3VtLCBpbnYpID0+IHtcbiAgICAgICAgICBjb25zdCBpbnZJdGVtcyA9IGl0ZW1zLmZpbHRlcihpdCA9PiBpdC5pbnZvaWNlTnVtYmVyID09PSBpbnYuaW52b2ljZU51bWJlcik7XG4gICAgICAgICAgcmV0dXJuIHN1bSArIGdldEludm9pY2VBY3R1YWxDb3N0KGludkl0ZW1zKTtcbiAgICAgICAgfSwgMCk7XG4gICAgICAgIGNvbnN0IHRvdGFsUGFpZFZhbCA9IGFsbEludnMucmVkdWNlKChzdW0sIGludikgPT4gc3VtICsgTnVtYmVyKGludi5hbW91bnRQYWlkIHx8IDApLCAwKTtcbiAgICAgICAgY29uc3QgdG90YWxSZW1haW5pbmdWYWwgPSBNYXRoLm1heCgwLCB0b3RhbEJpbGxlZFZhbCAtIHRvdGFsUGFpZFZhbCk7XG4gICAgICAgIGNvbnN0IHRvdGFsRGV2aWNlcyA9IGFsbEludnMucmVkdWNlKChzdW0sIGludikgPT4ge1xuICAgICAgICAgIGNvbnN0IGludkl0ZW1zID0gaXRlbXMuZmlsdGVyKGl0ID0+IGl0Lmludm9pY2VOdW1iZXIgPT09IGludi5pbnZvaWNlTnVtYmVyKTtcbiAgICAgICAgICByZXR1cm4gc3VtICsgaW52SXRlbXMucmVkdWNlKChhY2MsIGl0KSA9PiBhY2MgKyAoTnVtYmVyKGl0LnF1YW50aXR5KSB8fCAwKSwgMCk7XG4gICAgICAgIH0sIDApO1xuICAgICAgICBjb25zdCBjTGFiZWwgPSBnZXRDdXN0b21lckN1cnJlbmN5TGFiZWwoc2VsZWN0ZWRDdXN0b21lci5pZCEpO1xuXG4gICAgICAgIGNvbnN0IGZpbHRlcmVkSW52cyA9IGFsbEludnMuZmlsdGVyKGludiA9PiB7XG4gICAgICAgICAgaWYgKCFsb2dTZWFyY2gpIHJldHVybiB0cnVlO1xuICAgICAgICAgIGNvbnN0IHMgPSBsb2dTZWFyY2gudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBmb3JtYXR0ZWREYXRlU3RyID0gaW52LmNyZWF0ZWRBdCBcbiAgICAgICAgICAgID8gKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgY29uc3QgZCA9IHBhcnNlRGF0ZShpbnYuY3JlYXRlZEF0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZCA/IGQudG9Mb2NhbGVEYXRlU3RyaW5nKCdhci1ZRScpIDogJyc7XG4gICAgICAgICAgICAgIH0pKClcbiAgICAgICAgICAgIDogJyc7XG5cbiAgICAgICAgICBjb25zdCBpbnZJdGVtcyA9IGl0ZW1zLmZpbHRlcihpdCA9PiBpdC5pbnZvaWNlTnVtYmVyID09PSBpbnYuaW52b2ljZU51bWJlcik7XG4gICAgICAgICAgY29uc3QgZGV2aWNlTWF0Y2hlcyA9IGludkl0ZW1zLnNvbWUoaXQgPT4gXG4gICAgICAgICAgICBpdC5kZXZpY2VOYW1lPy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHMpIHx8IFxuICAgICAgICAgICAgaXQuc2VyaWFsTnVtYmVyPy50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKHMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBpbnYuaW52b2ljZU51bWJlcj8udG9Mb3dlckNhc2UoKS5pbmNsdWRlcyhzKSB8fFxuICAgICAgICAgICAgZm9ybWF0dGVkRGF0ZVN0ci5pbmNsdWRlcyhzKSB8fFxuICAgICAgICAgICAgZGV2aWNlTWF0Y2hlc1xuICAgICAgICAgICk7XG4gICAgICAgIH0pLnNvcnQoKGEsIGIpID0+IE51bWJlcihiLmludm9pY2VOdW1iZXIgfHwgMCkgLSBOdW1iZXIoYS5pbnZvaWNlTnVtYmVyIHx8IDApKTtcblxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZml4ZWQgaW5zZXQtMCB6LVsxMDBdIGZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGJnLWJsYWNrLzk1IGJhY2tkcm9wLWJsdXItbWQgcC0xLjUgbWQ6cC00IG92ZXJmbG93LWhpZGRlblwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJjdXN0b21lci1tb2RhbC1iZyBiZy1bIzBhMGEwYV0gYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLTJ4bCB3LWZ1bGwgbWF4LXctN3hsIGgtWzk0dmhdIHAtMyBtZDpwLTUgc3BhY2UteS0zLjUgc2hhZG93LTJ4bCByZWxhdGl2ZSB0ZXh0LXJpZ2h0IGZsZXggZmxleC1jb2xcIj5cbiAgICAgICAgICAgICAgey8qIEhlYWRlciAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtY29sIHNtOmZsZXgtcm93IHNtOml0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gYm9yZGVyLWIgYm9yZGVyLXdoaXRlLzUgcGItMyBnYXAtMyBzaHJpbmstMCBwcmludDpoaWRkZW5cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XG4gICAgICAgICAgICAgICAgICA8YnV0dG9uIFxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgc2V0U2hvd0xvZ01vZGFsKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICBzZXRMb2dTZWFyY2goJycpO1xuICAgICAgICAgICAgICAgICAgICAgIHNldFNlbGVjdGVkTG9nSW52b2ljZShudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfX0gXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInAtMiBiZy13aGl0ZS81IGhvdmVyOmJnLXdoaXRlLzEwIHJvdW5kZWQtbGcgdGV4dC1ncmF5LTQwMCBob3Zlcjp0ZXh0LXdoaXRlIHRyYW5zaXRpb24tYWxsIGJvcmRlciBib3JkZXItd2hpdGUvNSBjdXJzb3ItcG9pbnRlciBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBob3ZlcjpzY2FsZS0xMDUgYWN0aXZlOnNjYWxlLTk1XCJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCLYpdi62YTYp9mCXCJcbiAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgPFggc2l6ZT17MTh9IC8+XG4gICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIuNVwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMiBiZy1vcmFuZ2UtNjAwLzEwIHJvdW5kZWQtbGcgYm9yZGVyIGJvcmRlci1vcmFuZ2UtNTAwLzIwIHNocmluay0wXCI+XG4gICAgICAgICAgICAgICAgICAgICAgPEZpbGVUZXh0IHNpemU9ezIwfSBjbGFzc05hbWU9XCJ0ZXh0LW9yYW5nZS01MDBcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8aDMgY2xhc3NOYW1lPVwidGV4dC1iYXNlIG1kOnRleHQtbGcgZm9udC1ibGFjayB0ZXh0LXdoaXRlIGZvbnQtY2Fpcm8gdHJhY2tpbmctdGlnaHRcIj7Ys9is2YQg2YHZiNin2KrZitixINin2YTYudmF2YrZhCDYp9mE2LTYp9mF2YQ8L2gzPlxuICAgICAgICAgICAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1ncmF5LTQwMCBmb250LWJvbGQgbXQtMC41XCI+e3NlbGVjdGVkQ3VzdG9tZXIubmFtZX08L3A+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICB7LyogU2VhcmNoIEluc2lkZSBNb2RhbCAqL31cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlbGF0aXZlIHctZnVsbCBzbTp3LTcyXCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJhYnNvbHV0ZSBpbnNldC15LTAgcmlnaHQtMCBmbGV4IGl0ZW1zLWNlbnRlciBwci0zIHBvaW50ZXItZXZlbnRzLW5vbmUgdGV4dC1ncmF5LTUwMFwiPlxuICAgICAgICAgICAgICAgICAgICA8U2VhcmNoIHNpemU9ezE1fSAvPlxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgICAgIHR5cGU9XCJ0ZXh0XCJcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCLYp9io2K3YqyDYqNix2YLZhSDYp9mE2YHYp9iq2YjYsdipINij2Ygg2KfZhNiq2KfYsdmK2K4g2KPZiCDYp9mE2KPYrNmH2LLYqS4uLlwiXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtsb2dTZWFyY2h9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0TG9nU2VhcmNoKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHRleHQtcmlnaHQgcHItOSBwbC0zIHB5LTIgdGV4dC14cyBiZy13aGl0ZS81IGJvcmRlciBib3JkZXItd2hpdGUvMTAgcm91bmRlZC1sZyB0ZXh0LXdoaXRlIHBsYWNlaG9sZGVyLWdyYXktNTAwIGZvY3VzOm91dGxpbmUtbm9uZSBmb2N1czpib3JkZXItb3JhbmdlLTUwMCBmb2N1czpyaW5nLTEgZm9jdXM6cmluZy1vcmFuZ2UtNTAwIHRyYW5zaXRpb24tYWxsIGZvbnQtY2Fpcm9cIlxuICAgICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgey8qIFF1aWNrIE1ldHJpY3MgUGFuZWwgLSBWZXJ5IENvbXBhY3QgKi99XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMiBtZDpncmlkLWNvbHMtNSBnYXAtMiBzaHJpbmstMFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC0yIHB4LTMgYmctd2hpdGUvWzAuMDJdIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLXhsIHRleHQtcmlnaHQgaG92ZXI6Ym9yZGVyLXdoaXRlLzEwIHRyYW5zaXRpb24tYWxsIGZsZXggZmxleC1jb2wganVzdGlmeS1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LWdyYXktNDAwIGJsb2NrIG1iLTAuNSBmb250LWNhaXJvXCI+2KXYrNmF2KfZhNmKINin2YTZgdmI2KfYqtmK2LE8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgbWQ6dGV4dC14bCBmb250LWJsYWNrIHRleHQtd2hpdGUgZm9udC1tb25vXCI+e3RvdGFsSW52c0NvdW50fTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMiBweC0zIGJnLXdoaXRlL1swLjAyXSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC14bCB0ZXh0LXJpZ2h0IGhvdmVyOmJvcmRlci13aGl0ZS8xMCB0cmFuc2l0aW9uLWFsbCBmbGV4IGZsZXgtY29sIGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1ncmF5LTQwMCBibG9jayBtYi0wLjUgZm9udC1jYWlyb1wiPtil2KzZhdin2YTZiiDYp9mE2KPYrNmH2LLYqTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtYmFzZSBtZDp0ZXh0LXhsIGZvbnQtYmxhY2sgdGV4dC13aGl0ZSBmb250LW1vbm9cIj57dG90YWxEZXZpY2VzfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMiBweC0zIGJnLXdoaXRlL1swLjAyXSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC14bCB0ZXh0LXJpZ2h0IGhvdmVyOmJvcmRlci13aGl0ZS8xMCB0cmFuc2l0aW9uLWFsbCBmbGV4IGZsZXgtY29sIGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LWJvbGQgdGV4dC1ncmF5LTQwMCBibG9jayBtYi0wLjUgZm9udC1jYWlyb1wiPtil2KzZhdin2YTZiiDYp9mE2YXYt9in2YTYqNin2Ko8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgbWQ6dGV4dC14bCBmb250LWJsYWNrIHRleHQtb3JhbmdlLTQwMCBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAge3RvdGFsQmlsbGVkVmFsLnRvRml4ZWQoMil9IDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS01MDAgZm9udC1ib2xkXCI+e2NMYWJlbH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTIgcHgtMyBiZy13aGl0ZS9bMC4wMl0gYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQteGwgdGV4dC1yaWdodCBob3Zlcjpib3JkZXItd2hpdGUvMTAgdHJhbnNpdGlvbi1hbGwgZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtZ3JheS00MDAgYmxvY2sgbWItMC41IGZvbnQtY2Fpcm9cIj7Ypdis2YXYp9mE2Yog2KfZhNmF2K/ZgdmI2Lk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgbWQ6dGV4dC14bCBmb250LWJsYWNrIHRleHQtZW1lcmFsZC00MDAgZm9udC1tb25vXCI+XG4gICAgICAgICAgICAgICAgICAgIHt0b3RhbFBhaWRWYWwudG9GaXhlZCgyKX0gPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1lbWVyYWxkLTUwMC82MCBmb250LWJvbGRcIj57Y0xhYmVsfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtMiBweC0zIGJnLXdoaXRlL1swLjAyXSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC14bCB0ZXh0LXJpZ2h0IGNvbC1zcGFuLTIgbWQ6Y29sLXNwYW4tMSBob3Zlcjpib3JkZXItd2hpdGUvMTAgdHJhbnNpdGlvbi1hbGwgZmxleCBmbGV4LWNvbCBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gZm9udC1ib2xkIHRleHQtZ3JheS00MDAgYmxvY2sgbWItMC41IGZvbnQtY2Fpcm9cIj7Ypdis2YXYp9mE2Yog2KfZhNmF2KrYqNmC2Yo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2B0ZXh0LWJhc2UgbWQ6dGV4dC14bCBmb250LWJsYWNrIGZvbnQtbW9ubyAke3RvdGFsUmVtYWluaW5nVmFsID4gMC4wMSA/ICd0ZXh0LXJvc2UtNTAwJyA6ICd0ZXh0LWVtZXJhbGQtNDAwJ31gfT5cbiAgICAgICAgICAgICAgICAgICAge3RvdGFsUmVtYWluaW5nVmFsLnRvRml4ZWQoMil9IDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS01MDAgZm9udC1ib2xkXCI+e2NMYWJlbH08L3NwYW4+XG4gICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBJbnZvaWNlcyBMaXN0IFRhYmxlIFNlY3Rpb24gLSBDbGVhciBhbmQgQ29tcGFjdCAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgYmctWyMxMTFdIHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci13aGl0ZS81IG92ZXJmbG93LWhpZGRlbiBmbGV4IGZsZXgtY29sIG1pbi1oLTBcIj5cbiAgICAgICAgICAgICAgICB7ZmlsdGVyZWRJbnZzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgbXktYXV0byBweS0xMiB0ZXh0LWdyYXktNTAwIGZsZXggZmxleC1jb2wgaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxGaWxlVGV4dCBzaXplPXszNn0gY2xhc3NOYW1lPVwibWItMiB0ZXh0LWdyYXktNjAwIG9wYWNpdHktNjBcIiAvPlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIG1kOnRleHQtc20gZm9udC1ib2xkIGZvbnQtY2Fpcm9cIj7ZhNinINiq2YjYrNivINmB2YjYp9iq2YrYsSDZhdi32KfYqNmC2Kkg2YTYudmF2YTZitipINin2YTYqNit2Ksg2YTZhNi52YXZitmEPC9wPlxuICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNTAwIGZvbnQtY2Fpcm8gbXQtMC41XCI+2KzYsdioINil2K/Yrtin2YQg2LHZgtmFINmB2KfYqtmI2LHYqSDYtdit2YrYrSDYo9mIINin2LPZhSDYrNmH2KfYsjwvcD5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm92ZXJmbG93LWF1dG8gZmxleC0xIHNjcm9sbGJhci10aGluIHNjcm9sbGJhci10aHVtYi13aGl0ZS8xMFwiPlxuICAgICAgICAgICAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVwidy1mdWxsIHRleHQtcmlnaHQgYm9yZGVyLWNvbGxhcHNlIHRleHQteHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8dGhlYWQgY2xhc3NOYW1lPVwic3RpY2t5IHRvcC0wIHotMTAgYmctWyMxNjE2MTZdIGJvcmRlci1iIGJvcmRlci13aGl0ZS8xMCB0ZXh0LWdyYXktMzAwIGZvbnQtY2Fpcm8gdGV4dC1bMTFweF0gbWQ6dGV4dC14c1wiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtMy41IHB5LTIuNSBmb250LWJsYWNrIGJvcmRlci1sIGJvcmRlci13aGl0ZS81IHctMTZcIj4jINin2YTZgdin2KrZiNix2Kk8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtMy41IHB5LTIuNSBmb250LWJsYWNrIGJvcmRlci1sIGJvcmRlci13aGl0ZS81IHctMjRcIj7Yp9mE2KrYp9ix2YrYrjwvdGg+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJweC0zLjUgcHktMi41IGZvbnQtYmxhY2sgYm9yZGVyLWwgYm9yZGVyLXdoaXRlLzVcIj7Yp9mE2KPYrNmH2LLYqSDZiNin2YTYrtiv2YXYp9iqINiv2KfYrtmEINin2YTZgdin2KrZiNix2Kk8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicHgtMy41IHB5LTIuNSBmb250LWJsYWNrIGJvcmRlci1sIGJvcmRlci13aGl0ZS81IHctMjhcIj7Yp9mE2YLZitmF2Kkg2KfZhNil2KzZhdin2YTZitipPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTMuNSBweS0yLjUgZm9udC1ibGFjayBib3JkZXItbCBib3JkZXItd2hpdGUvNSB3LTI4XCI+2KfZhNmF2KjZhNi6INin2YTZhdiv2YHZiNi5PC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTMuNSBweS0yLjUgZm9udC1ibGFjayBib3JkZXItbCBib3JkZXItd2hpdGUvNSB3LTI4XCI+2KfZhNmF2KjZhNi6INin2YTZhdiq2KjZgtmKPC90aD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInB4LTMuNSBweS0yLjUgdGV4dC1jZW50ZXIgZm9udC1ibGFjayB3LTQwXCI+2KfZhNil2KzYsdin2KE8L3RoPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICAgICAgICAgIDx0Ym9keSBjbGFzc05hbWU9XCJkaXZpZGUteSBkaXZpZGUtd2hpdGUvNSB0ZXh0LXNsYXRlLTMwMCBmb250LWNhaXJvXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICB7ZmlsdGVyZWRJbnZzLm1hcCgoaW52LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnZJdGVtcyA9IGl0ZW1zLmZpbHRlcihpdCA9PiBpdC5pbnZvaWNlTnVtYmVyID09PSBpbnYuaW52b2ljZU51bWJlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGFjdHVhbENvc3QgPSBnZXRJbnZvaWNlQWN0dWFsQ29zdChpbnZJdGVtcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlbWFpbmluZ0ZvckludiA9IE1hdGgubWF4KDAsIGFjdHVhbENvc3QgLSBOdW1iZXIoaW52LmFtb3VudFBhaWQgfHwgMCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXJyID0gZ2V0Q3VzdG9tZXJDdXJyZW5jeUxhYmVsKHNlbGVjdGVkQ3VzdG9tZXIuaWQhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNTZWxlY3RlZCA9IHNlbGVjdGVkTG9nSW52b2ljZSAmJiBzZWxlY3RlZExvZ0ludm9pY2UuaW52b2ljZU51bWJlciA9PT0gaW52Lmludm9pY2VOdW1iZXI7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dHIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2ludi5pZCB8fCBpbmRleH0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTZWxlY3RlZExvZ0ludm9pY2UoaW52KX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGhvdmVyOmJnLXdoaXRlL1swLjA0XSBldmVuOmJnLXdoaXRlL1swLjAxXSBjdXJzb3ItcG9pbnRlciB0cmFuc2l0aW9uLWNvbG9ycyAke2lzU2VsZWN0ZWQgPyAnYmctb3JhbmdlLTYwMC8xNSBib3JkZXItci00IGJvcmRlci1yLW9yYW5nZS01MDAnIDogJyd9YH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7LyogSW52b2ljZSBOdW1iZXIgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtMy41IHB5LTIuNSBmb250LW1vbm8gZm9udC1ibGFjayB0ZXh0LXdoaXRlIHRleHQteHMgYm9yZGVyLWwgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1vcmFuZ2UtNTAwIGZvbnQtYm9sZFwiPiM8L3NwYW4+e2ludi5pbnZvaWNlTnVtYmVyfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIERhdGUgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtMy41IHB5LTIuNSBmb250LW1vbm8gdGV4dC1zbGF0ZS00MDAgYm9yZGVyLWwgYm9yZGVyLXdoaXRlLzUgd2hpdGVzcGFjZS1ub3dyYXAgdGV4dC1bMTFweF1cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2ludi5jcmVhdGVkQXQgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAoZnVuY3Rpb24oKXsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBwYXJzZURhdGUoaW52LmNyZWF0ZWRBdCk7IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZCA/IGQudG9Mb2NhbGVEYXRlU3RyaW5nKCdhci1ZRScsIHsgeWVhcjogJ251bWVyaWMnLCBtb250aDogJzItZGlnaXQnLCBkYXk6ICcyLWRpZ2l0JyB9KSA6ICctLS0nOyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pKClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICctLS0nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBEZXZpY2VzIExpc3QgRGV0YWlscyAtIElubGluZXMgYW5kIEJhZGdlcyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC0zLjUgcHktMi41IGJvcmRlci1sIGJvcmRlci13aGl0ZS81IG1heC13LW1kXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgZ2FwLTEuNSBtYXgtaC0yNCBvdmVyZmxvdy15LWF1dG8gc2Nyb2xsYmFyLXRoaW5cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aW52SXRlbXMubGVuZ3RoID09PSAwID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1ncmF5LTUwMCBmb250LWJvbGRcIj7ZhNinINiq2YjYrNivINij2KzZh9iy2Kkg2YXYttin2YHYqTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW52SXRlbXMubWFwKChpdGVtLCBpZHgpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e2l0ZW0uaWQgfHwgaWR4fSBjbGFzc05hbWU9XCJpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgYmctd2hpdGUvWzAuMDNdIHB4LTIgcHktMC41IHJvdW5kZWQgYm9yZGVyIGJvcmRlci13aGl0ZS81IHRleHQtWzEwcHhdIGhvdmVyOmJnLXdoaXRlL1swLjA2XSB0cmFuc2l0aW9uLWFsbCB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LXdoaXRlIG1heC13LVsxMzBweF0gdHJ1bmNhdGVcIj57aXRlbS5kZXZpY2VOYW1lIHx8ICfYrNmH2KfYsid9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpdGVtLnNlcmlhbE51bWJlciAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktNTAwIGZvbnQtbW9ubyB0ZXh0LVs5cHhdXCI+KHtpdGVtLnNlcmlhbE51bWJlcn0pPC9zcGFuPn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2BweC0xIHB5LVswLjVweF0gcm91bmRlZCB0ZXh0LVs4cHhdIGZvbnQtYmxhY2sgc2NhbGUtOTAgJHtnZXRTdGF0dXNTdHlsZShpdGVtLnN0YXR1cyB8fCAnMTAnKX1gfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtnZXRTdGF0dXNUZXh0QXJhYmljKGl0ZW0uc3RhdHVzIHx8ICcxMCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFRvdGFsIENvc3QgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtMy41IHB5LTIuNSBmb250LW1vbm8gdGV4dC1vcmFuZ2UtNDAwIGZvbnQtYmxhY2sgdGV4dC14cyBib3JkZXItbCBib3JkZXItd2hpdGUvNSB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7YWN0dWFsQ29zdC50b0ZpeGVkKDIpfSA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNTAwIGZvbnQtYm9sZFwiPntjdXJyfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsvKiBBbW91bnQgUGFpZCAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC0zLjUgcHktMi41IGZvbnQtbW9ubyB0ZXh0LWVtZXJhbGQtNDAwIGZvbnQtYmxhY2sgdGV4dC14cyBib3JkZXItbCBib3JkZXItd2hpdGUvNSB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7TnVtYmVyKGludi5hbW91bnRQYWlkIHx8IDApLnRvRml4ZWQoMil9IDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZW1lcmFsZC01MDAvNjAgZm9udC1ib2xkXCI+e2N1cnJ9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFJlbWFpbmluZyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJweC0zLjUgcHktMi41IGZvbnQtbW9ubyB0ZXh0LXhzIGJvcmRlci1sIGJvcmRlci13aGl0ZS81IHdoaXRlc3BhY2Utbm93cmFwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YGZvbnQtYmxhY2sgJHtyZW1haW5pbmdGb3JJbnYgPiAwLjAxID8gJ3RleHQtcm9zZS01MDAnIDogJ3RleHQtZW1lcmFsZC00MDAnfWB9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtyZW1haW5pbmdGb3JJbnYudG9GaXhlZCgyKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPnsnICd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS01MDAgZm9udC1ib2xkXCI+e2N1cnJ9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIEFjdGlvbnMgKi99XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicHgtMy41IHB5LTIuNSB0ZXh0LWNlbnRlciB3aGl0ZXNwYWNlLW5vd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktY2VudGVyIGdhcC0xLjVcIiBvbkNsaWNrPXsoZSkgPT4gZS5zdG9wUHJvcGFnYXRpb24oKX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2VsZWN0ZWRMb2dJbnZvaWNlKGludil9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BweC0yLjUgcHktMSByb3VuZGVkLW1kIHRyYW5zaXRpb24tYWxsIGJvcmRlciB0ZXh0LVsxMHB4XSBmb250LWJsYWNrIGN1cnNvci1wb2ludGVyIGlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBob3ZlcjpzY2FsZS0xMDUgYWN0aXZlOnNjYWxlLTk1ICR7aXNTZWxlY3RlZCA/ICdiZy1vcmFuZ2UtNjAwIHRleHQtd2hpdGUgYm9yZGVyLW9yYW5nZS01MDAvMzAnIDogJ2JnLWFtYmVyLTYwMC8xMCBob3ZlcjpiZy1hbWJlci02MDAgdGV4dC1hbWJlci00MDAgaG92ZXI6dGV4dC13aGl0ZSBib3JkZXItYW1iZXItNTAwLzIwJ31gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCLYqtmB2KfYtdmK2YQg2KfZhNij2LXZhtin2YEg2YjYp9mE2YLYt9i5XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8RXllIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+2KfZhNij2LXZhtin2YEg2YjYp9mE2YLYt9i5PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRQcmV2aWV3RGF0YSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2ludm9pY2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludm9pY2U6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLi4uaW52LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21lclBob25lOiBzZWxlY3RlZEN1c3RvbWVyPy5waG9uZTEgfHwgaW52LmN1c3RvbWVyUGhvbmUgfHwgJydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogaW52SXRlbXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTIuNSBweS0xIGJnLW9yYW5nZS02MDAvMTAgaG92ZXI6Ymctb3JhbmdlLTYwMCB0ZXh0LW9yYW5nZS00MDAgaG92ZXI6dGV4dC13aGl0ZSByb3VuZGVkLW1kIHRyYW5zaXRpb24tYWxsIGJvcmRlciBib3JkZXItb3JhbmdlLTUwMC8yMCB0ZXh0LVsxMHB4XSBmb250LWJsYWNrIGN1cnNvci1wb2ludGVyIGlubGluZS1mbGV4IGl0ZW1zLWNlbnRlciBnYXAtMSBob3ZlcjpzY2FsZS0xMDUgYWN0aXZlOnNjYWxlLTk1XCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPVwi2LnYsdi2INin2YTZgdin2KrZiNix2KlcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxQcmludGVyIHNpemU9ezEyfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4+2LnYsdi2INin2YTZgdin2KrZiNix2Kk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgICAgICAgICAgPC90YWJsZT5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBGb290ZXIgdGV4dCAqL31cbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJib3JkZXItdCBib3JkZXItd2hpdGUvNSBwdC0yIHNocmluay0wIHRleHQtcmlnaHRcIj5cbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBtZDp0ZXh0LXhzIHRleHQtZ3JheS00MDAgZm9udC1ib2xkXCI+2YrZhdmD2YbZgyDYp9mE2YbZgtixINi52YTZiSDYo9mKINmB2KfYqtmI2LHYqSDZgdmKINin2YTYrNiv2YjZhCDYo9i52YTYp9mHINij2Ygg2KfYs9iq2K7Yr9in2YUg2LLYsSBcItin2YTYo9i12YbYp9mBINmI2KfZhNmC2LfYuVwiINmE2YHYqtitINmG2KfZgdiw2Kkg2KzYp9mG2KjZitipINiq2LnYsdi2INiq2YHYp9i12YrZhCDYp9mE2KPYrNmH2LLYqSDZiNmC2LfYuSDYp9mE2LrZitin2LEg2YHZiNix2KfZiy48L3NwYW4+XG4gICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgIHsvKiBTSURFIERSQVdFUiBGT1IgSU5WT0lDRSBJVEVNUyBBTkQgUEFSVFMgKi99XG4gICAgICAgICAgICAgIHtzZWxlY3RlZExvZ0ludm9pY2UgJiYgKFxuICAgICAgICAgICAgICAgIDxtb3Rpb24uZGl2XG4gICAgICAgICAgICAgICAgICBpbml0aWFsPXt7IHg6ICcxMDAlJywgb3BhY2l0eTogMCB9fVxuICAgICAgICAgICAgICAgICAgYW5pbWF0ZT17eyB4OiAwLCBvcGFjaXR5OiAxIH19XG4gICAgICAgICAgICAgICAgICBleGl0PXt7IHg6ICcxMDAlJywgb3BhY2l0eTogMCB9fVxuICAgICAgICAgICAgICAgICAgdHJhbnNpdGlvbj17eyB0eXBlOiAnc3ByaW5nJywgZGFtcGluZzogMjUsIHN0aWZmbmVzczogMjIwIH19XG4gICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJhYnNvbHV0ZSBsZWZ0LTAgdG9wLTAgYm90dG9tLTAgaC1mdWxsIHctZnVsbCBtYXgtdy1bNDgwcHhdIHNtOm1heC13LVs1NTBweF0gYmctWyMwYzBjMGNdIGJvcmRlci1yIGJvcmRlci13aGl0ZS8xMCB6LTUwIHJvdW5kZWQtci1ub25lIHJvdW5kZWQtbC0yeGwgc2hhZG93LVsxNXB4XzBfNDBweF9yZ2JhKDAsMCwwLDAuODUpXSBmbGV4IGZsZXgtY29sIG92ZXJmbG93LWhpZGRlbiB0ZXh0LXJpZ2h0IGZvbnQtY2Fpcm9cIlxuICAgICAgICAgICAgICAgICAgZGlyPVwicnRsXCJcbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICB7LyogRHJhd2VyIEhlYWRlciAqL31cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC00IGJnLXdoaXRlL1swLjAzXSBib3JkZXItYiBib3JkZXItd2hpdGUvNSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMi41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0U2VsZWN0ZWRMb2dJbnZvaWNlKG51bGwpfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yIGJnLXdoaXRlLzUgaG92ZXI6YmctcmVkLTYwMC8yMCB0ZXh0LWdyYXktNDAwIGhvdmVyOnRleHQtcmVkLTQwMCByb3VuZGVkLXhsIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyIGJvcmRlciBib3JkZXItd2hpdGUvNSBhY3RpdmU6c2NhbGUtOTVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU9XCLYpdi62YTYp9mCXCJcbiAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICA8WCBzaXplPXsxOH0gLz5cbiAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPGg0IGNsYXNzTmFtZT1cInRleHQteHMgc206dGV4dC1zbSBmb250LWJsYWNrIHRleHQtd2hpdGVcIj7YqtmB2KfYtdmK2YQg2KPYtdmG2KfZgSDYp9mE2YHYp9iq2YjYsdipINmI2KfZhNmC2LfYuTwvaDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LW9yYW5nZS01MDAgZm9udC1tb25vIGZvbnQtYmxhY2sgbXQtMC41XCI+I3tzZWxlY3RlZExvZ0ludm9pY2UuaW52b2ljZU51bWJlcn08L3A+XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtbGVmdCBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtZ3JheS01MDAgZm9udC1ib2xkIGJsb2NrXCI+2KfZhNiq2KfYsdmK2K48L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1ncmF5LTMwMCBmb250LWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzZWxlY3RlZExvZ0ludm9pY2UuY3JlYXRlZEF0IFxuICAgICAgICAgICAgICAgICAgICAgICAgICA/IChmdW5jdGlvbigpeyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGQgPSBwYXJzZURhdGUoc2VsZWN0ZWRMb2dJbnZvaWNlLmNyZWF0ZWRBdCk7IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGQgPyBkLnRvTG9jYWxlRGF0ZVN0cmluZygnYXItWUUnLCB7IHllYXI6ICdudW1lcmljJywgbW9udGg6ICcyLWRpZ2l0JywgZGF5OiAnMi1kaWdpdCcgfSkgOiAnLS0tJzsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICA6ICctLS0nXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICB7LyogU2Nyb2xsYWJsZSBDb250ZW50ICovfVxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgb3ZlcmZsb3cteS1hdXRvIHAtNCBtZDpwLTUgc3BhY2UteS00LjUgc2Nyb2xsYmFyLXRoaW4gc2Nyb2xsYmFyLXRodW1iLXdoaXRlLzEwXCI+XG4gICAgICAgICAgICAgICAgICAgIHsvKiBGaW5hbmNpYWwgU3VtbWFyeSBjYXJkICovfVxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNCBiZy13aGl0ZS9bMC4wMV0gYm9yZGVyIGJvcmRlci13aGl0ZS81IHJvdW5kZWQtMnhsIGdyaWQgZ3JpZC1jb2xzLTMgZ2FwLTIgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LWdyYXktNTAwIGZvbnQtYm9sZCBibG9jayBtYi0xXCI+2KfZhNmF2LfYp9mE2KjYqSDYp9mE2YPZhNmK2Kk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHNtOnRleHQtc20gZm9udC1ibGFjayB0ZXh0LW9yYW5nZS00MDAgZm9udC1tb25vXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtnZXRJbnZvaWNlQWN0dWFsQ29zdChpdGVtcy5maWx0ZXIoaXQgPT4gaXQuaW52b2ljZU51bWJlciA9PT0gc2VsZWN0ZWRMb2dJbnZvaWNlLmludm9pY2VOdW1iZXIpKS50b0ZpeGVkKDIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYm9yZGVyLXggYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1ncmF5LTUwMCBmb250LWJvbGQgYmxvY2sgbWItMVwiPtin2YTZhdiv2YHZiNi5PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBzbTp0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC1lbWVyYWxkLTQwMCBmb250LW1vbm9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAge051bWJlcihzZWxlY3RlZExvZ0ludm9pY2UuYW1vdW50UGFpZCB8fCAwKS50b0ZpeGVkKDIpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtZ3JheS01MDAgZm9udC1ib2xkIGJsb2NrIG1iLTFcIj7Yp9mE2YXYqtio2YLZijwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHRleHQteHMgc206dGV4dC1zbSBmb250LWJsYWNrIGZvbnQtbW9ubyAke01hdGgubWF4KDAsIGdldEludm9pY2VBY3R1YWxDb3N0KGl0ZW1zLmZpbHRlcihpdCA9PiBpdC5pbnZvaWNlTnVtYmVyID09PSBzZWxlY3RlZExvZ0ludm9pY2UuaW52b2ljZU51bWJlcikpIC0gTnVtYmVyKHNlbGVjdGVkTG9nSW52b2ljZS5hbW91bnRQYWlkIHx8IDApKSA+IDAuMDEgPyAndGV4dC1yb3NlLTUwMCcgOiAndGV4dC1lbWVyYWxkLTQwMCd9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtNYXRoLm1heCgwLCBnZXRJbnZvaWNlQWN0dWFsQ29zdChpdGVtcy5maWx0ZXIoaXQgPT4gaXQuaW52b2ljZU51bWJlciA9PT0gc2VsZWN0ZWRMb2dJbnZvaWNlLmludm9pY2VOdW1iZXIpKSAtIE51bWJlcihzZWxlY3RlZExvZ0ludm9pY2UuYW1vdW50UGFpZCB8fCAwKSkudG9GaXhlZCgyKX1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgey8qIExpc3Qgb2YgRGV2aWNlcyAqL31cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTRcIj5cbiAgICAgICAgICAgICAgICAgICAgICA8aDUgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJsYWNrIHRleHQtZ3JheS0zMDAgYm9yZGVyLXItMiBib3JkZXItb3JhbmdlLTUwMCBwci0yXCI+2KfZhNij2KzZh9iy2Kkg2YjYp9mE2K7Yr9mF2KfYqiDYqNin2YTZgdin2KrZiNix2KkgKHtpdGVtcy5maWx0ZXIoaXQgPT4gaXQuaW52b2ljZU51bWJlciA9PT0gc2VsZWN0ZWRMb2dJbnZvaWNlLmludm9pY2VOdW1iZXIpLmxlbmd0aH0pPC9oNT5cbiAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICB7aXRlbXMuZmlsdGVyKGl0ID0+IGl0Lmludm9pY2VOdW1iZXIgPT09IHNlbGVjdGVkTG9nSW52b2ljZS5pbnZvaWNlTnVtYmVyKS5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtOCB0ZXh0LWNlbnRlciB0ZXh0LWdyYXktNTAwIHRleHQteHMgYmctd2hpdGUvWzAuMDFdIGJvcmRlciBib3JkZXItd2hpdGUvNSByb3VuZGVkLXhsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgINmE2Kcg2KrZiNis2K8g2KPYrNmH2LLYqSDZhdiz2KzZhNipINmB2Yog2YfYsNmHINin2YTZgdin2KrZiNix2KkuXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXMuZmlsdGVyKGl0ID0+IGl0Lmludm9pY2VOdW1iZXIgPT09IHNlbGVjdGVkTG9nSW52b2ljZS5pbnZvaWNlTnVtYmVyKS5tYXAoKGl0LCBpZHgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaGFzUGFydHMgPSBpdC5wYXJ0c1VzZWQgJiYgQXJyYXkuaXNBcnJheShpdC5wYXJ0c1VzZWQpICYmIGl0LnBhcnRzVXNlZC5sZW5ndGggPiAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJ0c1RvdGFsID0gaGFzUGFydHMgPyBpdC5wYXJ0c1VzZWQucmVkdWNlKChzdW06IG51bWJlciwgcDogYW55KSA9PiBzdW0gKyBOdW1iZXIocC5jb3N0IHx8IDApLCAwKSA6IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGxhYm9yQ29zdCA9IE1hdGgubWF4KDAsIE51bWJlcihpdC5jb3N0IHx8IDApIC0gcGFydHNUb3RhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGN1cnIgPSBnZXRDdXN0b21lckN1cnJlbmN5TGFiZWwoc2VsZWN0ZWRDdXN0b21lci5pZCEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBrZXk9e2l0LmlkIHx8IGlkeH0gY2xhc3NOYW1lPVwicC00IGJnLXdoaXRlL1swLjAyXSBib3JkZXIgYm9yZGVyLXdoaXRlLzUgcm91bmRlZC0yeGwgc3BhY2UteS0zLjUgaG92ZXI6Ym9yZGVyLXdoaXRlLzEwIHRyYW5zaXRpb24tYWxsIHJlbGF0aXZlIG92ZXJmbG93LWhpZGRlblwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIERldmljZSBzdGF0dXMgYW5kIHRpdGxlIHJvdyAqL31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGJvcmRlci1iIGJvcmRlci13aGl0ZS81IHBiLTIuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LW1vbm8gZm9udC1ibGFjayB0ZXh0LXdoaXRlIGJnLXdoaXRlLzUgcHgtMiBweS0wLjUgcm91bmRlZCBib3JkZXIgYm9yZGVyLXdoaXRlLzVcIj57aWR4ICsgMX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJsYWNrIHRleHQtd2hpdGVcIj57aXQuZGV2aWNlTmFtZSB8fCAn2KzZh9in2LIg2LXZitin2YbYqSd9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgcHgtMi41IHB5LTAuNSByb3VuZGVkIHRleHQtWzEwcHhdIGZvbnQtYmxhY2sgJHtnZXRTdGF0dXNTdHlsZShpdC5zdGF0dXMgfHwgJzEwJyl9YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2dldFN0YXR1c1RleHRBcmFiaWMoaXQuc3RhdHVzIHx8ICcxMCcpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIERldGFpbHMgZmllbGRzICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIGdhcC14LTQgZ2FwLXktMyB0ZXh0LXhzXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1ncmF5LTUwMCBmb250LWJvbGQgYmxvY2sgbWItMC41XCI+2KrYtdmG2YrZgSDYp9mE2KzZh9in2LI8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1ncmF5LTIwMCBmb250LWJvbGQgZm9udC1jYWlyb1wiPntpdC5kZXZpY2VUeXBlIHx8ICfYutmK2LEg2YXYrdiv2K8nfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpdC5zZXJpYWxOdW1iZXIgJiYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNTAwIGZvbnQtYm9sZCBibG9jayBtYi0wLjVcIj7Yp9mE2LHZgtmFINin2YTYqtiz2YTYs9mE2YogUy9OPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1ncmF5LTIwMCBmb250LW1vbm8gZm9udC1ib2xkXCI+e2l0LnNlcmlhbE51bWJlcn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXNwYW4tMiBiZy1bIzE2MTYxNl0vNDAgcC0yLjUgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWFtYmVyLTUwMC84MCBmb250LWJsYWNrIGJsb2NrIG1iLTFcIj7Yp9mE2LTZg9mI2Ykg2YjYp9mE2YXYtNmD2YTYqSDYp9mE2YXZiNi12YjZgdipOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWFtYmVyLTEwMCBmb250LWJvbGQgYmxvY2sgbGVhZGluZy1yZWxheGVkXCI+e2l0LmZhdWx0VHlwZSB8fCBpdC5jdXN0b21lclByb2JsZW0gfHwgJ9mE2YUg2YrYrdiv2K8nfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiY29sLXNwYW4tMiBiZy1lbWVyYWxkLTk1MC8xMCBwLTIuNSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItZW1lcmFsZC01MDAvMTBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWVtZXJhbGQtNDAwIGZvbnQtYmxhY2sgYmxvY2sgbWItMVwiPtiq2YLYsdmK2LEg2KfZhNi12YrYp9mG2Kkg2YjYp9mE2KXYtdmE2KfYrSDYp9mE2YHZhtmKOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXNsYXRlLTMwMCBmb250LWJvbGQgYmxvY2sgbGVhZGluZy1yZWxheGVkXCI+e2l0LnRlY2huaWNhbE5vdGVzIHx8IGl0LmVuZ2luZWVyUmVwb3J0IHx8ICfYqtit2Kog2KfZhNmB2K3YtSDYp9mE2YHZhtmKINmI2KfZhNiq2LTYrtmK2LUg2K3Yp9mE2YrYp9mLJ308L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7aXQudGVjaG5pY2lhbiAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS01MDAgZm9udC1ib2xkIGJsb2NrIG1iLTAuNVwiPtin2YTZhdmH2YbYr9izINin2YTZgdmG2Yo8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktMjAwIGZvbnQtYm9sZFwiPntpdC50ZWNobmljaWFufTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNTAwIGZvbnQtYm9sZCBibG9jayBtYi0wLjVcIj7Ypdis2YXYp9mE2Yog2KfZhNiq2YPZhNmB2Kk8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1vcmFuZ2UtNDAwIGZvbnQtbW9ubyBmb250LWJsYWNrXCI+e051bWJlcihpdC5jb3N0IHx8IDApLnRvRml4ZWQoMil9IDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtZ3JheS01MDAgZm9udC1ib2xkXCI+e2N1cnJ9PC9zcGFuPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgey8qIFNwYXJlIFBhcnRzIGJsb2NrICovfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJib3JkZXItdCBib3JkZXItd2hpdGUvNSBwdC0zIG10LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gbWItMlwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIGZvbnQtYmxhY2sgdGV4dC1ncmF5LTMwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMS41XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ3LTEuNSBoLTEuNSBiZy1vcmFuZ2UtNTAwIHJvdW5kZWQtZnVsbFwiPjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgINmC2LfYuSDYp9mE2LrZitin2LEg2KfZhNmF2LPYqtiu2K/ZhdipXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtoYXNQYXJ0cyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSBmb250LW1vbm8gdGV4dC1ncmF5LTQwMFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICDYp9mE2YXYrNmF2YjYuToge3BhcnRzVG90YWwudG9GaXhlZCgyKX0ge2N1cnJ9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2hhc1BhcnRzID8gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xLjUgYmctYmxhY2svNDAgcC0yLjUgcm91bmRlZC14bCBib3JkZXIgYm9yZGVyLXdoaXRlLzVcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtpdC5wYXJ0c1VzZWQubWFwKChwYXJ0OiBhbnksIHBJZHg6IG51bWJlcikgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGtleT17cElkeH0gY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtWzExcHhdIHRleHQtc2xhdGUtMzAwIHB5LTAuNVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYm9sZFwiPntwYXJ0Lm5hbWV9PC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtbW9ubyBmb250LWJsYWNrIHRleHQtb3JhbmdlLTQwMFwiPntOdW1iZXIocGFydC5jb3N0IHx8IDApLnRvRml4ZWQoMil9IHtjdXJyfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYm9yZGVyLXQgYm9yZGVyLXdoaXRlLzUgcHQtMS41IG10LTEuNSBmbGV4IGp1c3RpZnktYmV0d2VlbiB0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNDAwXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPtij2KzZiNixINin2YTYtdmK2KfZhtipICjYqNiv2YjZhiDZgti32LkpOjwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LWdyYXktMzAwXCI+e2xhYm9yQ29zdC50b0ZpeGVkKDIpfSB7Y3Vycn08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHB5LTIgdGV4dC1ncmF5LTUwMCB0ZXh0LVsxMHB4XSBiZy1ibGFjay8yMCByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItZGFzaGVkIGJvcmRlci13aGl0ZS81IGZvbnQtYm9sZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg2YTYpyDYqtmI2KzYryDZgti32Lkg2LrZitin2LEg2YXYs9is2YTYqSDZhNmH2LDYpyDYp9mE2KzZh9in2LIg2KjYtNmD2YQg2YXYs9iq2YLZhC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICAgICAgICB7LyogRHJhd2VyIEZvb3RlciAqL31cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC00IGJnLXdoaXRlL1swLjAzXSBib3JkZXItdCBib3JkZXItd2hpdGUvNSBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gc2hyaW5rLTBcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNlbGVjdGVkTG9nSW52b2ljZShudWxsKX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgYmctd2hpdGUvNSBob3ZlcjpiZy13aGl0ZS8xMCB0ZXh0LWdyYXktMzAwIGhvdmVyOnRleHQtd2hpdGUgYm9yZGVyIGJvcmRlci13aGl0ZS8xMCByb3VuZGVkLXhsIHRleHQteHMgZm9udC1ib2xkIHRyYW5zaXRpb24tYWxsIGN1cnNvci1wb2ludGVyIGFjdGl2ZTpzY2FsZS05NVwiXG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICDYpdi62YTYp9mCINin2YTYqtmB2KfYtdmK2YRcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRQcmV2aWV3RGF0YSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdpbnZvaWNlJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludm9pY2U6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC4uLnNlbGVjdGVkTG9nSW52b2ljZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbWVyUGhvbmU6IHNlbGVjdGVkQ3VzdG9tZXI/LnBob25lMSB8fCBzZWxlY3RlZExvZ0ludm9pY2UuY3VzdG9tZXJQaG9uZSB8fCAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IGl0ZW1zLmZpbHRlcihpdCA9PiBpdC5pbnZvaWNlTnVtYmVyID09PSBzZWxlY3RlZExvZ0ludm9pY2UuaW52b2ljZU51bWJlcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJweC00IHB5LTIgYmctb3JhbmdlLTYwMCBob3ZlcjpiZy1vcmFuZ2UtNTAwIHRleHQtd2hpdGUgcm91bmRlZC14bCB0ZXh0LXhzIGZvbnQtYmxhY2sgdHJhbnNpdGlvbi1hbGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEuNSBjdXJzb3ItcG9pbnRlciBhY3RpdmU6c2NhbGUtOTUgc2hhZG93LWxnIHNoYWRvdy1vcmFuZ2UtNjAwLzEwXCJcbiAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgIDxQcmludGVyIHNpemU9ezEzfSAvPlxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPti52LHYtiDZiNi32KjYp9i52Kkg2KfZhNmB2KfYqtmI2LHYqTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L21vdGlvbi5kaXY+XG4gICAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgICAgfSkoKX1cblxuICAgICAge3ByZXZpZXdEYXRhICYmIChcbiAgICAgICAgPFByaW50UHJldmlld092ZXJsYXlcbiAgICAgICAgICB0eXBlPXtwcmV2aWV3RGF0YS50eXBlfVxuICAgICAgICAgIGRhdGE9e3ByZXZpZXdEYXRhLmRhdGF9XG4gICAgICAgICAgb25DbG9zZT17KCkgPT4gc2V0UHJldmlld0RhdGEobnVsbCl9XG4gICAgICAgICAgc2hvcENvbmZpZz17c2hvcENvbmZpZ31cbiAgICAgICAgICB1c2VyPXt1c2VyfVxuICAgICAgICAvPlxuICAgICAgKX1cblxuICAgIDwvZGl2PlxuICApO1xufVxuIl0sIm1hcHBpbmdzIjoiQUFzQkksU0Eyb0NvQixVQTNvQ3BCO0FBdEJKLFNBQVMsNEJBQTRCO0FBQ3JDLE9BQU8sc0JBQXNCO0FBQzdCLFNBQVMsY0FBYyxjQUFjLDZCQUE2QjtBQUNsRSxPQUFPLHlCQUF5QjtBQUNoQyxTQUFnQixVQUFVLGlCQUFpQjtBQUMzQyxTQUFTLGNBQWM7QUFDdkIsU0FBUyxZQUFZLFlBQVksT0FBTyxTQUFTLEtBQXFCLFdBQXVCLHVCQUF1QjtBQUNwSCxTQUFTLFVBQVU7QUFDbkIsU0FBUyxNQUF1RixZQUFZLFFBQVEsUUFBUSxVQUFVLGFBQWEsS0FBd0IsR0FBRyxPQUFPLGFBQW1CLE9BQU8sT0FBdUIsU0FBUyxVQUFVLHFCQUF1QztBQUVoUyxTQUFTLHNCQUFzQjtBQUMvQixTQUFTLHNCQUFzQjtBQUUvQixTQUFTLHNCQUFzQjtBQUMvQixPQUFPLFdBQVc7QUFDbEIsWUFBWSxpQkFBaUI7QUFFN0IsU0FBUyxZQUFZLGlCQUFpQjtBQUN0QyxTQUFTLFdBQVcsZ0JBQWdCLG1CQUFpQztBQUVyRSxNQUFNLGVBQWUsQ0FBQyxVQUNwQix1QkFBQyxTQUFJLFNBQVEsYUFBWSxNQUFLLGdCQUFnQixHQUFHLE9BQy9DLGlDQUFDLFVBQUssR0FBRSwwd0JBQVI7QUFBQTtBQUFBO0FBQUE7QUFBQSxPQUErd0IsS0FEanhCO0FBQUE7QUFBQTtBQUFBO0FBQUEsT0FFQTtBQUdGLHdCQUF3QixVQUFVLEVBQUUsTUFBTSxZQUFZLE9BQU8sR0FBNkU7QUFDeEksUUFBTSxFQUFFLEVBQUUsSUFBSSxlQUFlO0FBQzdCLFFBQU0sRUFB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