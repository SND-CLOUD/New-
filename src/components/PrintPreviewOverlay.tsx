import React, { useState, useEffect, useRef } from 'react';
import { parseDate, renderSafeValue } from '../lib/dateUtils';
import { ArrowLeft, ArrowRight, Printer, Share2, Smartphone, MessageCircle, Phone, Loader2, FileText, Settings2, MapPin, Facebook, AlertTriangle, Mail, Landmark, ArrowUp, Save, Check, ZoomIn, ZoomOut } from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { db, doc, updateDoc, increment, collection, getDocs } from '../firebase';
import { sharePdfFile, openWhatsApp } from '../lib/shareHelper';

import ReportActions, { WhatsAppIcon } from './ReportActions';

type PrintTemplateType = 'entry' | 'exit' | 'inspection' | 'quotation' | 'assignment' | 'maintenance' | 'sale_parts' | 'sale_software' | 'sale_maintenance';

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

export default function PrintPreviewOverlay({ 
  type, 
  data, 
  onClose,
  shopConfig,
  user,
  extraHeaderActions,
  onPrint,
  onWhatsApp,
  onSave,
  isSaving
}: { 
  type: 'invoice' | 'voucher' | 'statement' | 'table';
  data: any;
  onClose: () => void;
  shopConfig: any;
  user?: any;
  extraHeaderActions?: React.ReactNode;
  onPrint?: () => void;
  onWhatsApp?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [templateType, setTemplateType] = useState<PrintTemplateType>(data?.templateType || 'entry');
  const [scale, setScale] = useState(1);
  const [userZoom, setUserZoom] = useState(1);
  const [previewDate] = useState(() => new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(1123);
  const [customersMap, setCustomersMap] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const snap = await getDocs(collection(db, 'customers'));
        const m = new Map<string, any>();
        snap.docs.forEach((d: any) => {
          m.set(d.id, { id: d.id, ...d.data() });
        });
        setCustomersMap(m);
      } catch (err) {
        console.error("Error fetching customers for preview:", err);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (printAreaRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setContentHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(printAreaRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 48; // accounting for padding
        
        // Fit primarily to width to ensure readability, max scale of 1
        const scaleW = containerWidth / 794;
        const newScale = Math.min(1, scaleW);
        
        setScale(newScale > 0 ? newScale : 1);
      }
    };
    handleResize();
    const timer = setTimeout(handleResize, 150);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [contentHeight]);

  const invoice = type === 'invoice' ? data.invoice : null;
  const items = type === 'invoice' ? data.items || [] : [];
  const voucher = type === 'voucher' ? data.voucher : null;
  const statement = type === 'statement' ? data.statement : null;
  const tableData = type === 'table' ? data.table : null;

  const printableUserName = user?.name || invoice?.userName || invoice?.createdBy || voucher?.userName || voucher?.createdBy || statement?.userName || statement?.createdBy || tableData?.userName || '---';

  const getOverlayCustomerDetails = () => {
    let custId = '';
    let name = '';
    let company = '';
    let phone = '';

    if (type === 'invoice' && invoice) {
      custId = invoice.customerId || '';
      name = invoice.customerName || '';
      phone = invoice.customerPhone || '';
    } else if (type === 'statement' && statement) {
      custId = statement.customerId || statement.id || '';
      name = statement.customerName || '';
      company = statement.companyName || '';
      phone = statement.customerPhone || '';
    } else if (type === 'table' && tableData) {
      custId = tableData.customerId || '';
      name = tableData.customerName || 'عام';
      company = tableData.subtitle || '';
      phone = tableData.customerPhone || '';
    } else if (type === 'voucher' && voucher) {
      custId = voucher.customerId || '';
      name = voucher.customerName || '';
      phone = voucher.customerPhone || '';
    }

    if (custId) {
      const cust = customersMap.get(custId);
      if (cust) {
        if (!name) name = cust.name;
        if (!company) company = cust.companyName;
        if (!phone) phone = cust.phone1;
      }
    }

    if (name && name !== 'عام' && (!company || !phone)) {
      for (const [_, cust] of customersMap.entries()) {
        if (cust.name === name) {
          if (!company) company = cust.companyName;
          if (!phone) phone = cust.phone1;
          break;
        }
      }
    }

    return {
      name: name || 'عام',
      company: company && company !== '---' ? company : '',
      phone: phone && phone !== '---' ? phone : ''
    };
  };

  // Auto-detect default template based on invoice status if possible
  useEffect(() => {
    if (data && data.templateType) {
      setTemplateType(data.templateType);
    } else if (type === 'invoice' && invoice) {
      const status = (invoice.status || '').toLowerCase();
      if (['50', 'ready', 'intact', 'unrepairable', 'refused', '60', 'delivered', '70', 'cancelled'].includes(status)) {
        setTemplateType('exit');
      } else if (['20', 'inspected', 'testing'].includes(status)) {
        setTemplateType('inspection');
      } else if (['30', 'awaiting_approval'].includes(status)) {
        setTemplateType('quotation');
      } else if (['40', 'repairing', 'approved', '35', 'awaiting_parts', 'parts_available'].includes(status)) {
        setTemplateType('maintenance');
      } else {
        setTemplateType('entry');
      }
    }
  }, [type, invoice, data.templateType]);

  const statementEntries = statement?.entries || [];
  const itemsPerPage = 22;
  const statementChunks = [];
  for (let i = 0; i < statementEntries.length; i += itemsPerPage) {
    statementChunks.push(statementEntries.slice(i, i + itemsPerPage));
  }
  if (statementChunks.length === 0) {
    statementChunks.push([]); // At least one page
  }

  const renderHeader = (customTitle?: string, customSubtitle?: string) => (
    <>
      <div className="absolute left-8 top-1.5 text-[8px] text-gray-400 font-normal select-none opacity-45 font-mono pointer-events-none flex items-center gap-1.5" dir="rtl">
        <span>تاريخ ووقت الطباعة: {new Date().toLocaleDateString('ar-YE')} {new Date().toLocaleTimeString('ar-YE', { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
        {type === 'invoice' && invoice?.printCount !== undefined && (
          <span className="border border-gray-400 px-1 rounded font-bold text-[9px] text-gray-500 bg-transparent inline-block font-sans ml-1">
            {invoice.printCount}
          </span>
        )}
      </div>
    
      {/* Universal Header Layout */}
      <div className="flex justify-between items-start border-b-2 border-gray-900 pb-1.5 mb-1.5 shrink-0">
        {/* Right Corner: Shop Name */}
        <div className="text-right flex-1 pt-0.5">
          <h2 className="text-lg font-black text-gray-900 leading-normal font-cairo whitespace-nowrap cursor-default">{shopConfig?.shopName || 'عالم الصيانة والتجارة'}</h2>
          <div className="text-xs font-black text-gray-900 leading-normal mt-1 font-cairo cursor-default">
            {type === 'invoice' ? 'قسم الصيانة الفنية' : 'قسم الحسابات والمالية'}
          </div>
          <div className="mt-1 space-y-0.5">
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
        <div className="text-center flex-[1.2] flex flex-col items-center justify-center pt-0.5">
          {shopConfig?.logoUrl ? (
            <img 
              src={shopConfig.logoUrl} 
              alt="Logo" 
              className="h-11 max-w-[150px] object-contain mb-0.5" 
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-10 h-10 border border-dashed border-gray-300 rounded-xl mb-1 flex items-center justify-center text-gray-400 text-[10px] font-bold">شعار المحل</div>
          )}
          <h1 className="text-xs md:text-sm font-black text-gray-900 border-2 border-gray-900 px-5 h-7.5 inline-flex items-center justify-center rounded-lg bg-gray-50/50 leading-none whitespace-nowrap">
            {type === 'invoice' ? getTemplateName(templateType) : (type === 'statement' ? `كشف حساب مالي - ${(() => {
              const curr = statement?.liabilityCurrency || 'USD';
              if (curr === 'USD') return 'دولار';
              if (curr === 'SAR') return 'ريال سعودي';
              if (curr === 'YER') return 'ريال يمني';
              if (curr === 'EUR') return 'يورو';
              return curr;
            })()}` : (type === 'table' ? (customTitle || tableData?.title) : (voucher?.type === 'receipt' ? 'سند قبض مالي' : 'سند صرف مالي')))}
          </h1>
        </div>

        {/* Left Corner: Info */}
        <div className="text-left flex-1 space-y-0.5 pt-0.5 bg-gray-50/50 p-2 rounded-lg border border-gray-200 text-[11px]">
          <div className="font-bold text-gray-700 flex justify-between gap-4">
            <span>{type === 'invoice' ? (templateType === 'quotation' ? 'رقم العرض:' : 'رقم المستند:') : (type === 'statement' ? 'رقم الحساب:' : (type === 'table' ? 'رقم التقرير:' : 'رقم المرجع:'))}</span>
            <span className="font-mono text-gray-900">
              {type === 'invoice' 
                ? invoice?.invoiceNumber 
                : (type === 'statement' 
                    ? (statement?.customerNumber || statement?.id?.substring(0, 5)) 
                    : (type === 'table' ? (tableData?.reportNumber || '00000') : voucher?.reference))}
            </span>
          </div>
          <div className="font-bold text-gray-700 flex justify-between gap-4">
            <span>تاريخ السند:</span>
            <span className="font-mono text-gray-900">
              {type === 'invoice' 
                ? `${formatDate(invoice?.createdAt)} - ${formatTime(invoice?.createdAt)}`
                : (type === 'statement'
                    ? `${formatDate(previewDate)} - ${formatTime(previewDate)}`
                    : `${formatDate(voucher?.timestamp || voucher?.date)} - ${formatTime(voucher?.timestamp || voucher?.date)}`)}
            </span>
          </div>
          <div className="font-bold text-gray-700 flex justify-between gap-4 border-t border-gray-200 pt-0.5 mt-0.5 font-cairo">
            <span>رقم المستخدم:</span>
            <span className="font-mono text-gray-900">{user?.userNumber || '100'}</span>
          </div>
        </div>
      </div>

      {/* Customer Info Box */}
      <div className="bg-gray-100 p-1.5 rounded-lg mb-1.5 border border-gray-300 flex flex-row items-center justify-start gap-4 px-4 shrink-0 text-xs whitespace-nowrap">
        <div className="font-black text-gray-900 flex items-center">
          <span className="text-[10px] text-gray-600 ml-2 whitespace-nowrap">إسم العميل:</span>
          <span className="text-gray-900 font-black">{getOverlayCustomerDetails().name}</span>
        </div>
        {getOverlayCustomerDetails().company && (
          <div className="font-black text-gray-900 border-r border-gray-300 pr-3 flex items-center">
            <span className="text-[10px] text-gray-600 ml-2 whitespace-nowrap">الجهة:</span>
            <span className="text-gray-900 font-black">{getOverlayCustomerDetails().company}</span>
          </div>
        )}
        {getOverlayCustomerDetails().phone && (
          <div className="font-black text-gray-900 border-r border-gray-300 pr-4 flex items-center">
            <span className="text-[10px] text-gray-600 ml-2 whitespace-nowrap">الجوال:</span>
            <span className="font-mono text-gray-900" dir="ltr">{getOverlayCustomerDetails().phone}</span>
          </div>
        )}
      </div>
    </>
  );

  const renderFooter = (isStatement = false) => (
    <div className="mt-auto shrink-0 pt-1 pb-[5px]">
      <div className="border-t border-black/20 my-1"></div>
      
      <div className="flex justify-between items-start text-[11px] font-bold text-gray-900 leading-snug mb-1 px-4 font-cairo">
        {type === 'voucher' ? (
          <>
            <div className="text-right space-y-0.5">
                <p className="pt-0.5">اسم المهندس المختص: ........................</p>
                <p className="pt-0.5 font-black">التوقيع / ........................................</p>
            </div>
            <div className="text-left space-y-0.5">
                <p className="pt-1.5">المستلم المقر بما فيه /.............. التوقيع /.............</p>
            </div>
          </>
        ) : type === 'statement' ? (
          <>
            <div className="text-right space-y-0.5">
              <div>اسم مستلم الكشف: ........................................</div>
              <div className="pt-0.5">اسم المهندس المختص: ........................</div>
              <div className="pt-0.5">التوقيع والختم: ........................................</div>
            </div>
            <div className="text-left space-y-0.5 col-span-1">
              <div className="pt-0.5">التوقيع والختم: ........................................</div>
            </div>
          </>
        ) : ['entry', 'exit'].includes(templateType) ? (
          <>
              {/* Right Side */}
              <div className="text-right space-y-0.5">
                {templateType === 'entry' && (
                  <>
                    <p>يرجى الاحتفاظ بهذا السند وإحضاره لاستلام الاجهزة</p>
                    <p>المحل غير مسؤول عن الأجهزة بعد مرور 30 يوم</p>
                  </>
                )}
                {templateType === 'exit' && (
                  <p>استلمت الأجهزة الموضحة بحالة جيدة</p>
                )}
                
                <p className="pt-2">توقيع العميل / المقر بالموافقة</p>
                <p className="pt-1 font-black">التوقيع: ........................................</p>
              </div>

              {/* Left Side */}
              <div className="text-left space-y-0.5 flex flex-col items-end">
                {templateType === 'entry' && <p>سوف يتم موافاتكم بتكاليف الصيانة بعد الفحص</p>}
                {templateType === 'exit' && (
                  <p>نتمنى أن تنال خدمتنا إعجابكم</p>
                )}
                
                <p className="pt-2">اسم المهندس المختص: ........................</p>
                <p className="pt-1 font-black">التوقيع / ........................................</p>
              </div>
          </>
        ) : (
          <>
              {/* Right Side */}
              <div className="text-right space-y-0.5">
                {templateType === 'quotation' && <p>مقدم العرض والمختص الفني</p>}
                {(templateType === 'inspection' || templateType === 'maintenance' || templateType === 'assignment') && <p>المسؤول المباشر / المشرف</p>}
                
                <p className="pt-1">اسم المهندس المختص: ........................</p>
                <p className="pt-0.5 font-black">التوقيع / ........................................</p>
              </div>

              {/* Left Side */}
              <div className="text-left space-y-0.5 flex flex-col items-end">
                {['inspection', 'quotation'].includes(templateType) && <p>توقيع العميل / المقر بالموافقة</p>}
                {(templateType === 'maintenance' || templateType === 'assignment') && <p>تصدير واعتماد الإدارة الفنية</p>}
                
                <p className="pt-0.5">التوقيع /.....................</p>
              </div>
          </>
        )}
      </div>

      <div className="border-t-[3px] border-black mt-1 mb-1 border-solid"></div>
      
      {/* Footer Info section */}
      <div className="flex flex-col gap-1 text-[9px] font-bold text-black font-cairo py-1 mt-0">
        <div className="flex flex-row items-center justify-between w-full gap-4">
          {shopConfig?.address && (
            <div className="flex items-center gap-1.5 flex-row-reverse text-center w-max truncate">
                <MapPin size={10} className="text-gray-600 shrink-0" />
                <span className="text-gray-900 truncate">{shopConfig.address}</span>
            </div>
          )}

          {shopConfig?.facebookUrl && (
            <div className="flex items-center gap-1.5 flex-row-reverse text-center w-max truncate">
              <Facebook size={10} className="text-blue-600 shrink-0" />
              <span dir="ltr" className="text-gray-900 truncate">{shopConfig.facebookUrl}</span>
            </div>
          )}
        </div>

        {/* Bank Accounts Row */}
        {(shopConfig?.bankHolderName || shopConfig?.bankYerAccount || shopConfig?.bankSarAccount || shopConfig?.bankUsdAccount) && (
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center mt-0.5 border-t border-gray-200 pt-1 text-[10px]">
            <span className="text-gray-600 font-bold flex items-center gap-1">
              <Landmark size={10} className="text-emerald-700 shrink-0" />
              الحسابات البنكية:
            </span>
            {(() => {
              const items: React.ReactNode[] = [];
              if (shopConfig?.bankHolderName) {
                items.push(
                  <span key="holder" className="text-gray-900 font-bold">
                    باسم: {shopConfig.bankHolderName}
                  </span>
                );
              }
              if (shopConfig?.bankYerAccount) {
                items.push(
                  <span key="yer" className="inline-flex items-center gap-1 text-gray-900">
                    <span dir="ltr" className="font-mono font-semibold">{shopConfig.bankYerAccount}</span>
                    {shopConfig?.bankYerName && <span className="text-gray-600">({shopConfig.bankYerName})</span>}
                  </span>
                );
              }
              if (shopConfig?.bankSarAccount) {
                items.push(
                  <span key="sar" className="inline-flex items-center gap-1 text-gray-900">
                    <span dir="ltr" className="font-mono font-semibold">{shopConfig.bankSarAccount}</span>
                    {shopConfig?.bankSarName && <span className="text-gray-600">({shopConfig.bankSarName})</span>}
                  </span>
                );
              }
              if (shopConfig?.bankUsdAccount) {
                items.push(
                  <span key="usd" className="inline-flex items-center gap-1 text-gray-900">
                    <span dir="ltr" className="font-mono font-semibold">{shopConfig.bankUsdAccount}</span>
                    {shopConfig?.bankUsdName && <span className="text-gray-600">({shopConfig.bankUsdName})</span>}
                  </span>
                );
              }

              return items.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-gray-400 font-bold">/</span>}
                  {item}
                </React.Fragment>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );

  const renderStatementPages = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    statementEntries.forEach((e: any) => {
      totalDebit += Number(e.debit || 0);
      totalCredit += Number(e.credit || 0);
    });
    const diff = totalCredit - totalDebit;
    const isCreditor = diff > 0.01;
    const isDebtor = diff < -0.01;
    const finalBalanceStatus = isCreditor ? 'دائن (له في الحساب ومستحق له رصيد متبقي)' : isDebtor ? 'مدين (متبقي عليه ديون لصالح المحل)' : 'متزن الحساب بالكامل';

    return statementChunks.map((chunk, pageIndex) => {
      const isLastPage = pageIndex === statementChunks.length - 1;
      return (
        <div key={pageIndex} className="w-[794px] min-h-[1123px] bg-white p-2 pb-2 flex flex-col relative shrink-0 shadow-2xl print:shadow-none" style={{ pageBreakAfter: 'always' }}>
          {renderHeader()}

          {/* Statement Content */}
          <div className="flex-1 mb-4 flex flex-col">
            <div className="space-y-2 mb-2 flex flex-col">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-gray-900 font-cairo block">العمليات والتحركات المالية (القيود مرتبة بتسلسل تاريخي):</span>
                <span className="text-xs font-bold text-gray-500 font-mono">صفحة {pageIndex + 1} من {statementChunks.length}</span>
              </div>
              <div className="w-full text-center border-2 border-black text-black font-bold mb-0 overflow-hidden rounded-lg flex flex-col">
                <div className="w-full text-right select-none flex flex-col">
                  {/* Header Row */}
                  <div className="bg-gray-100 border-b-2 border-black text-black font-cairo font-black flex items-stretch text-[11px] shrink-0">
                    <div className="py-2 px-1.5 text-center w-8 border-l border-black flex items-center justify-center shrink-0">م</div>
                    <div className="py-2 px-2 text-center border-l border-black w-24 flex items-center justify-center shrink-0 whitespace-nowrap" dir="ltr">تاريخ القيد</div>
                    <div className="py-2 px-2 border-l border-black text-right flex items-center justify-start whitespace-nowrap overflow-hidden" style={{flex: 1}}>المستند</div>
                    <div className="py-2 px-2 text-center border-l border-black w-20 flex items-center justify-center shrink-0 whitespace-nowrap" dir="ltr">رقمه</div>
                    <div className="py-2 px-2 border-l border-black text-right w-44 flex items-center justify-start shrink-0 whitespace-nowrap overflow-hidden">البيان والتفاصيل</div>
                    <div className="py-2 px-2 text-rose-900 text-center border-l border-black bg-rose-50/10 w-24 flex items-center justify-center shrink-0 whitespace-nowrap">مدين</div>
                    <div className="py-2 px-2 text-emerald-900 text-center border-l border-black bg-emerald-50/10 w-24 flex items-center justify-center shrink-0 whitespace-nowrap">دائن</div>
                    <div className="py-2 px-2 text-center font-black bg-gray-100 w-28 flex items-center justify-center shrink-0 whitespace-nowrap">الرصيد</div>
                  </div>
                  {/* Body List */}
                  <div className="divide-y divide-black font-bold bg-white flex flex-col">
                    {chunk.length === 0 ? (
                      <div className="py-8 text-center text-gray-500 font-cairo font-bold bg-white w-full">
                        لا يوجد أي قيود أو عمليات محاسبية مسجلة لهذا العميل حتى الآن.
                      </div>
                    ) : (
                      chunk.map((entry: any, index: number) => {
                        const globalIndex = pageIndex * itemsPerPage + index + 1;
                        return (
                          <div key={entry.id || index} className="text-black bg-white flex items-stretch text-[10px] min-h-[34px]">
                            <div className="px-1.5 font-mono text-center text-gray-800 border-l border-black bg-gray-50/50 w-8 flex items-center justify-center shrink-0 whitespace-nowrap">
                              {globalIndex}
                            </div>
                            <div className="px-2 font-mono text-[9px] text-gray-700 text-center border-l border-black w-24 flex items-center justify-center shrink-0 whitespace-nowrap overflow-hidden text-ellipsis" dir="ltr">
                              {renderSafeValue(entry.formattedDate)}
                            </div>
                            <div className="px-2 font-cairo font-bold text-black border-l border-black text-right flex-1 flex items-center justify-start whitespace-normal">
                              {renderSafeValue(entry.type)}
                            </div>
                            <div className="px-2 font-mono font-bold text-gray-800 text-center border-l border-black w-20 flex items-center justify-center shrink-0 whitespace-nowrap text-ellipsis overflow-hidden" dir="ltr">
                              {renderSafeValue(entry.reference)}
                            </div>
                            <div className="px-2 py-1 font-cairo text-black w-44 border-l border-black text-right flex flex-col items-start justify-center shrink-0 whitespace-normal">
                              <span className="font-bold leading-normal break-words" title={typeof entry.label === 'string' ? entry.label : ''}>{renderSafeValue(entry.label)}</span>
                              {entry.notes && <span className="font-semibold text-gray-600 text-[8px] leading-tight break-words" title={typeof entry.notes === 'string' ? entry.notes : ''}>{renderSafeValue(entry.notes)}</span>}
                            </div>
                            <div className="px-2 font-mono font-black text-rose-800 text-center border-l border-black bg-rose-50/5 w-24 flex items-center justify-center shrink-0 whitespace-nowrap text-ellipsis overflow-hidden" dir="ltr">
                              {entry.debit > 0 ? entry.debit.toLocaleString('en-US') : '---'}
                            </div>
                            <div className="px-2 font-mono font-black text-emerald-800 text-center border-l border-black bg-emerald-50/5 w-24 flex items-center justify-center shrink-0 whitespace-nowrap text-ellipsis overflow-hidden" dir="ltr">
                              {entry.credit > 0 ? entry.credit.toLocaleString('en-US') : '---'}
                            </div>
                            <div className={`px-2 font-mono font-black text-center w-28 flex items-center justify-center shrink-0 whitespace-nowrap text-ellipsis overflow-hidden ${entry.runningBalance > 0.01 ? 'text-rose-800' : entry.runningBalance < -0.01 ? 'text-emerald-800' : 'text-gray-600'}`} dir="ltr">
                              {entry.runningBalance.toLocaleString('en-US')} {statement?.currency}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isLastPage ? (
              <div className="pt-2 shrink-0 flex flex-col flex-1">
                {/* 3-Box Financial Summary */}
                <div className="flex border-2 border-black rounded-lg overflow-hidden bg-gray-50 mb-4 font-cairo w-full shrink-0">
                  <div className="flex-1 p-2.5 text-center border-l-2 border-black bg-white">
                    <div className="text-[10px] text-gray-500 font-bold mb-0.5">إجمالي المطالبات (مدين)</div>
                    <div className="text-base font-black text-rose-800 leading-none">
                      <span className="font-mono">{totalDebit.toLocaleString('en-US')}</span> <span className="text-xs font-bold">{statement?.currency}</span>
                    </div>
                  </div>
                  <div className="flex-1 p-2.5 text-center border-l-2 border-black bg-emerald-50/40 text-emerald-800 bg-white">
                    <div className="text-[10px] text-gray-500 font-bold mb-0.5">إجمالي المقبوضات (دائن)</div>
                    <div className="text-base font-black leading-none">
                      <span className="font-mono">{totalCredit.toLocaleString('en-US')}</span> <span className="text-xs font-bold">{statement?.currency}</span>
                    </div>
                  </div>
                  <div className="flex-1 p-2.5 text-center bg-gray-100 text-black">
                    <div className="text-[10px] text-gray-600 font-bold mb-0.5">صافي المتبقي بالجاري</div>
                    <div className="text-base font-black leading-none">
                      <span className="font-mono">{Math.abs(diff).toLocaleString('en-US')}</span> <span className="text-xs font-bold">{statement?.currency}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs font-black text-gray-900 font-cairo text-center mb-2 shrink-0">
                  حالة الحساب النهائية: <span className={isCreditor ? 'text-emerald-700' : isDebtor ? 'text-rose-700 font-black' : 'text-gray-700'}>{finalBalanceStatus}</span>
                </div>

                {/* Notes (الملاحظات) */}
                <div className="border border-gray-300 p-2.5 rounded-lg text-right font-cairo text-xs space-y-1 bg-gray-50/50 mb-2 shrink-0">
                  <div className="font-black text-gray-950 border-b border-gray-200 pb-1 mb-1 flex items-center gap-1.5">
                    <AlertTriangle size={12} className="text-gray-600" />
                    <span>الملاحظات والشروط العامة للتقرير:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-gray-800 leading-relaxed text-[10px]">
                    <li>
                      <span className="font-black text-gray-950">مراجعة الحساب:</span> نرجو من عملائنا الكرام مراجعة وتأكيد هذا الكشف والرد علينا وتأكيد مطابقة الرصيد خلال 24 ساعة من تاريخ الاستلام.
                    </li>
                    <li>
                      <span className="font-black text-gray-950">الاعتماد النهائي:</span> يعتبر هذا الكشف كشفاً نهائياً وموافقة ضمنية مالم يردنا اعتراض مكتوب مسجلاً لدينا خلال أسبوع كحد أقصى من تاريخ إصدار التقرير.
                    </li>
                    <li>
                      <span className="font-black text-gray-950">تفاصيل الضمان:</span> تلتزم الشركة بتقديم كافة الضمانات الفنية والمالية المتفق عليها في بنود وفواتير الخدمات المرجعية.
                    </li>
                  </ul>
                </div>

                <div className="mt-auto w-full">
                  {renderFooter(true)}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-gray-400 font-bold border-t border-gray-300 pt-3 shrink-0">
                يتبع في الصفحة التالية...
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  const renderTablePages = () => {
    const tableHeaders = tableData?.headers || [];
    const rowsPerPage = 24;

    if (tableData?.groups) {
      const pages: React.ReactNode[] = [];
      tableData.groups.forEach((group: any, gIdx: number) => {
        const groupRows = group.rows || [];
        const groupChunks = [];
        for (let i = 0; i < groupRows.length; i += rowsPerPage) {
          groupChunks.push(groupRows.slice(i, i + rowsPerPage));
        }
        if (groupChunks.length === 0) groupChunks.push([]);

        groupChunks.forEach((chunk, chunkIdx) => {
          const isLastPageOfGroup = chunkIdx === groupChunks.length - 1;
          const isLastPageOfAll = gIdx === tableData.groups!.length - 1 && isLastPageOfGroup;

          pages.push(
            <div 
              key={`${gIdx}-${chunkIdx}`} 
              className="w-[794px] min-h-[1123px] bg-white p-2 pb-2 flex flex-col relative shrink-0 shadow-2xl print:shadow-none" 
              style={{ pageBreakAfter: 'always' }}
            >
              {renderHeader(group.title, group.subtitle)}

              {/* Table Content */}
              <div className="flex-1 mb-4 flex flex-col">
                <div className="space-y-2 mb-2 flex flex-col">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-gray-900 font-cairo block">
                      جدول البيانات المفصل (صفحة {chunkIdx + 1} من {groupChunks.length}):
                    </span>
                  </div>
                  <div className="w-full text-center border-2 border-black text-black font-bold mb-0 overflow-hidden rounded-lg flex flex-col">
                    <div className="w-full text-right select-none flex flex-col">
                      {/* Header Row */}
                      <div className="bg-gray-100 border-b-2 border-black text-black font-cairo font-black flex items-stretch text-[10px] shrink-0">
                        <div className="py-2 px-1 text-center w-8 border-l border-black flex items-center justify-center shrink-0">م</div>
                        {tableHeaders.map((header: string, hIdx: number) => (
                          <div 
                            key={hIdx} 
                            className={`py-2 px-1 text-center border-black flex items-center justify-center overflow-hidden whitespace-nowrap ${hIdx < tableHeaders.length - 1 ? 'border-l' : ''}`}
                            style={{ flex: 1 }}
                          >
                            {header}
                          </div>
                        ))}
                      </div>
                      {/* Body List */}
                      <div className="divide-y divide-black font-bold bg-white flex flex-col">
                        {chunk.length === 0 ? (
                          <div className="py-12 text-center text-gray-500 font-cairo font-bold bg-white w-full">
                            لا توجد بيانات مسجلة حالياً في هذا التقرير لهذه العملة.
                          </div>
                        ) : (
                          chunk.map((row: any[], rIdx: number) => {
                            const globalIndex = chunkIdx * rowsPerPage + rIdx + 1;
                            return (
                              <div key={rIdx} className="text-black bg-white flex items-stretch text-[9px] min-h-[30px]">
                                <div className="px-1 font-mono text-center text-gray-800 border-l border-black bg-gray-50/50 w-8 flex items-center justify-center shrink-0 whitespace-nowrap">
                                  {globalIndex}
                                </div>
                                {row.map((cell: any, cIdx: number) => (
                                  <div 
                                    key={cIdx} 
                                    className={`px-1 py-1 font-cairo text-black text-center flex items-center justify-center whitespace-normal break-words leading-tight ${cIdx < row.length - 1 ? 'border-l border-black' : ''}`}
                                    style={{ flex: 1 }}
                                  >
                                    {renderSafeValue(cell)}
                                  </div>
                                ))}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {isLastPageOfGroup && (
                  <div className="mt-auto w-full">
                    {group.footerNotes && (
                       <div className="border border-gray-300 p-2 rounded-lg text-right font-cairo text-[10px] space-y-1 bg-gray-50/50 mb-2">
                         <div className="font-black text-gray-950 border-b border-gray-200 pb-1 mb-1">الملاحظات والشروط الخاصة بهذه العملة:</div>
                         <p className="leading-relaxed text-gray-800">{group.footerNotes}</p>
                       </div>
                    )}
                    {isLastPageOfAll && tableData?.footerNotes && !group.footerNotes && (
                       <div className="border border-gray-300 p-2 rounded-lg text-right font-cairo text-[10px] space-y-1 bg-gray-50/50 mb-2">
                         <div className="font-black text-gray-950 border-b border-gray-200 pb-1 mb-1">الملاحظات والشروط العامة:</div>
                         <p className="leading-relaxed text-gray-800">{tableData.footerNotes}</p>
                       </div>
                    )}
                    {renderFooter(false)}
                  </div>
                )}
              </div>
            </div>
          );
        });
      });

      return pages;
    }

    const tableRows = tableData?.rows || [];
    const tableChunks = [];
    for (let i = 0; i < tableRows.length; i += rowsPerPage) {
      tableChunks.push(tableRows.slice(i, i + rowsPerPage));
    }
    if (tableChunks.length === 0) tableChunks.push([]);

    return tableChunks.map((chunk, pageIndex) => {
      const isLastPage = pageIndex === tableChunks.length - 1;
      return (
        <div key={pageIndex} className="w-[794px] min-h-[1123px] bg-white p-2 pb-2 flex flex-col relative shrink-0 shadow-2xl print:shadow-none" style={{ pageBreakAfter: 'always' }}>
          {renderHeader()}

          {/* Table Content */}
          <div className="flex-1 mb-4 flex flex-col">
            <div className="space-y-2 mb-2 flex flex-col">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-gray-900 font-cairo block">جدول البيانات المفصل (صفحة {pageIndex + 1} من {tableChunks.length}):</span>
              </div>
              <div className="w-full text-center border-2 border-black text-black font-bold mb-0 overflow-hidden rounded-lg flex flex-col">
                <div className="w-full text-right select-none flex flex-col">
                  {/* Header Row */}
                  <div className="bg-gray-100 border-b-2 border-black text-black font-cairo font-black flex items-stretch text-[10px] shrink-0">
                    <div className="py-2 px-1 text-center w-8 border-l border-black flex items-center justify-center shrink-0">م</div>
                    {tableHeaders.map((header: string, hIdx: number) => (
                      <div 
                        key={hIdx} 
                        className={`py-2 px-1 text-center border-black flex items-center justify-center overflow-hidden whitespace-nowrap ${hIdx < tableHeaders.length - 1 ? 'border-l' : ''}`}
                        style={{ flex: 1 }}
                      >
                        {header}
                      </div>
                    ))}
                  </div>
                  {/* Body List */}
                  <div className="divide-y divide-black font-bold bg-white flex flex-col">
                    {chunk.length === 0 ? (
                      <div className="py-12 text-center text-gray-500 font-cairo font-bold bg-white w-full">
                        لا توجد بيانات مسجلة حالياً في هذا التقرير.
                      </div>
                    ) : (
                      chunk.map((row: any[], rIdx: number) => {
                        const globalIndex = pageIndex * rowsPerPage + rIdx + 1;
                        return (
                          <div key={rIdx} className="text-black bg-white flex items-stretch text-[9px] min-h-[30px]">
                            <div className="px-1 font-mono text-center text-gray-800 border-l border-black bg-gray-50/50 w-8 flex items-center justify-center shrink-0 whitespace-nowrap">
                              {globalIndex}
                            </div>
                            {row.map((cell: any, cIdx: number) => (
                              <div 
                                key={cIdx} 
                                className={`px-1 py-1 font-cairo text-black text-center flex items-center justify-center whitespace-normal break-words leading-tight ${cIdx < row.length - 1 ? 'border-l border-black' : ''}`}
                                style={{ flex: 1 }}
                              >
                                {renderSafeValue(cell)}
                              </div>
                            ))}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isLastPage && (
              <div className="mt-auto w-full">
                {tableData?.footerNotes && (
                   <div className="border border-gray-300 p-2 rounded-lg text-right font-cairo text-[10px] space-y-1 bg-gray-50/50 mb-2">
                     <div className="font-black text-gray-950 border-b border-gray-200 pb-1 mb-1">الملاحظات والشروط:</div>
                     <p className="leading-relaxed text-gray-800">{tableData.footerNotes}</p>
                   </div>
                )}
                {renderFooter(false)}
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  const handlePrint = async () => {
    // Increment print count if it's an invoice
    if (type === 'invoice' && invoice?.id) {
      try {
        await updateDoc(doc(db, 'invoices', invoice.id), {
          printCount: increment(1)
        });
      } catch (e) {
        console.warn("Failed to increment print count", e);
      }
    }

    const printArea = document.getElementById('print-preview-area');
    if (!printArea) return;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write('<html><head><title>Print</title>');
      // Add all styles
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      styles.forEach((style) => {
        iframeDoc.write(style.outerHTML);
      });
      // Add print specific styles
      iframeDoc.write(`
        <style>
          @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            #print-preview-area { gap: 0 !important; }
            .shadow-2xl { shadow: none !important; }
            * { box-sizing: border-box; }
          }
        </style>
      `);
      iframeDoc.write('</head><body style="background: white !important; margin: 0; padding: 0;">');
      iframeDoc.write(printArea.outerHTML);
      iframeDoc.write('</body></html>');
      iframeDoc.close();
      
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    } else {
      window.print();
    }
  };

  const handleWhatsApp = async () => {
    let phone = '';
    let customerName = '';
    
    if (type === 'invoice' && invoice) {
      phone = invoice.customerPhone || '';
      customerName = invoice.customerName || '';
    } else if (type === 'statement' && statement) {
      phone = statement.customerPhone || '';
      customerName = statement.customerName || '';
    } else if (type === 'table' && tableData) {
      phone = tableData.customerPhone || '';
      customerName = tableData.customerName || '';
    }
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    
    let baseName = '';
    if (type === 'invoice') {
      baseName = getTemplateName(templateType);
    } else if (type === 'statement') {
      baseName = 'كشف حساب';
    } else if (type === 'table') {
      baseName = tableData?.title || 'تقرير';
    } else if (type === 'voucher') {
      baseName = voucher?.type === 'receipt' ? 'سند قبض' : 'سند صرف';
    }
    
    const fileName = customerName ? `${baseName} - ${customerName}.pdf` : `${baseName}.pdf`;
          
    const msg = type === 'invoice' 
      ? `مرفق ${getTemplateName(templateType)}` 
      : (type === 'statement' 
          ? `مرفق كشف حساب مالي للعميل: ${statement?.customerName}` 
          : (type === 'table' ? `مرفق تقرير: ${tableData?.title}` : 'مرفق سند مالي'));
          
    const text = msg + '\n(يرجى إرفاق ملف PDF الذي سيتم تحميله الآن)';
    
    // Direct WhatsApp opening to avoid popup blockers
    const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
    const canShareNatively = typeof navigator !== 'undefined' && !!navigator.share;

    if (!canShareNatively && !isNative) {
      openWhatsApp(text, cleanPhone);
    }

    setIsGeneratingPDF(true);

    // Increment print count if it's an invoice
    if (type === 'invoice' && invoice?.id) {
      try {
        await updateDoc(doc(db, 'invoices', invoice.id), {
          printCount: increment(1)
        });
      } catch (e) {
        console.warn("Failed to increment print count", e);
      }
    }

    try {
      const printArea = document.getElementById('print-preview-area');
      if (printArea) {
        // Temporarily remove transform
        const parentElement = printArea.parentElement;
        let originalTransform = '';
        if (parentElement) {
          originalTransform = parentElement.style.transform;
          parentElement.style.transform = 'none';
        }

        const canvas = await htmlToImage.toCanvas(printArea, { 
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        
        if (parentElement) {
          parentElement.style.transform = originalTransform;
        }

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
      
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
        let heightLeft = pdfHeight;
        let position = 0;
      
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      
        while (heightLeft > 0.5) {
          position = heightLeft - pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
          heightLeft -= pdf.internal.pageSize.getHeight();
        }
      
        const blob = pdf.output('blob');
        if (!blob) {
          setIsGeneratingPDF(false);
          return;
        }

        if (canShareNatively || isNative) {
          const sharedNatively = await sharePdfFile(blob, fileName, msg, 'invoice');
          if (!sharedNatively) {
            openWhatsApp(text, cleanPhone);
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);
        }
        
        setIsGeneratingPDF(false);
      } else {
        setIsGeneratingPDF(false);
      }
    } catch (err) {
      console.error(err);
      setIsGeneratingPDF(false);
    }
  };

  const getTemplateName = (tmpl: PrintTemplateType) => {
    switch(tmpl) {
      case 'entry': return 'فاتورة دخول أجهزة';
      case 'exit': return 'فاتورة خروج وملخص مالي';
      case 'inspection': return 'تقرير فحص فني';
      case 'quotation': return 'عرض سعر صيانة';
      case 'assignment': return 'تقرير حالة وإسناد';
      case 'maintenance': return 'تقرير صيانة داخلي';
      case 'sale_software': return 'فاتورة خدمات برمجية';
      case 'sale_maintenance': return 'فاتورة صيانة خارجية';
      case 'sale_parts': return 'فاتورة بيع قطع غيار';
      default: return 'فاتورة مبيعات';
    }
  };

  const getStatusText = (status: string) => {
    const map: any = {
      '10': 'مستلم', '20': 'قيد الفحص', '21': 'فحص مرحلي - مرحلة أولى', '22': 'فحص مرحلي - مرحلة ثانية', '30': 'بانتظار الموافقة',
      '40': 'قيد الصيانة', '45': 'لا يمكن إصلاحه', '50': 'جاهز للتسليم', '55': 'لا يمكن إصلاحه',
      '60': 'تم التسليم', '70': 'رفض الإصلاح'
    };
    return map[status] || status;
  };

  const formatDate = (dateObj: any) => {
    const d = parseDate(dateObj);
    if (!d) return '---';
    return d.toLocaleDateString('ar-YE');
  };

  const formatTime = (dateObj: any) => {
    const d = parseDate(dateObj);
    if (!d) return '---';
    return d.toLocaleTimeString('ar-YE', { hour12: true, hour: '2-digit', minute: '2-digit' });
  };

  const getPageCount = () => {
    if (type === 'table') return Math.ceil((tableData?.rows?.length || 0) / 24);
    if (type === 'statement') return Math.ceil((statement?.entries?.length || 0) / 22);
    return 1;
  };

  const totalPages = getPageCount();

  return (
    <div className="fixed inset-0 z-[120] bg-black/95 flex flex-col" dir="rtl">
      {/* Floating Page Navigator (Always Visible) */}
      {totalPages > 1 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-[130] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto text-white">
          <div className="flex items-center gap-2 font-bold font-cairo">
            <span className="text-[10px] text-gray-400">إجمالي الصفحات:</span>
            <span className="bg-emerald-500 text-white px-2.5 py-0.5 rounded-lg text-sm font-mono">
              {totalPages}
            </span>
          </div>
          <div className="h-4 w-[1px] bg-white/20"></div>
          <button 
            onClick={() => {
              const scrollContainer = containerRef.current;
              if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-[10px] font-black text-blue-400 hover:text-blue-300 font-cairo transition-colors flex items-center gap-1"
          >
            <span>العودة للأعلى</span>
            <ArrowUp size={14} />
          </button>
        </div>
      )}

      {/* Hidden buttons to allow external components to trigger internal actions */}
      <button id="internal-print-btn" className="hidden" onClick={handlePrint}></button>
      <button id="internal-wa-btn" className="hidden" onClick={handleWhatsApp}></button>

      {/* Top Navbar */}
      <div className="flex justify-between items-center bg-black/50 p-4 border-b border-white/10 shrink-0 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-bold hidden sm:block border-l border-white/20 pl-4">
            {type === 'invoice' ? `مستند الفاتورة - #${invoice.invoiceNumber}` : (type === 'statement' ? `كشف حساب - ${statement?.customerName}` : (type === 'table' ? tableData?.title : `استعراض السند - #${voucher?.reference}`))}
          </h2>

          <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/10 mr-2">
            <button
              onClick={() => setUserZoom(prev => Math.min(2.5, prev + 0.1))}
              className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-all active:scale-95"
              title="تكبير"
            >
              <ZoomIn size={16} />
            </button>
            <span className="text-xs font-mono text-gray-300 min-w-[4ch] text-center font-bold select-none" dir="ltr">{Math.round(userZoom * 100)}%</span>
            <button
              onClick={() => setUserZoom(prev => Math.max(0.5, prev - 0.1))}
              className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-all active:scale-95"
              title="تصغير"
            >
              <ZoomOut size={16} />
            </button>
            {userZoom !== 1 && (
              <button
                onClick={() => setUserZoom(1)}
                className="text-[10px] px-2 h-8 text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded-md transition-all active:scale-95 font-cairo font-bold"
                title="إعادة ضبط"
              >
                تلقائي
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 animate-in fade-in duration-300" dir="rtl">
          {/* Share/WhatsApp Button */}
          {(handleWhatsApp || onWhatsApp) && (
            <button 
              onClick={async () => {
                if (onWhatsApp) await onWhatsApp();
                else if (handleWhatsApp) await handleWhatsApp();
              }}
              disabled={isGeneratingPDF || isSaving}
              className="w-10 h-10 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 active:scale-95 cursor-pointer shrink-0"
              title={onWhatsApp ? "ترحيل ومشاركة عبر واتساب" : "مشاركة عبر واتساب"}
            >
              {isGeneratingPDF ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <WhatsAppIcon className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Print Button */}
          {(handlePrint || onPrint) && (
            <button 
              onClick={async () => {
                if (onPrint) await onPrint();
                else if (handlePrint) await handlePrint();
              }}
              disabled={isSaving}
              className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
              title={onPrint ? "ترحيل وطباعة" : "طباعة"}
            >
              <Printer size={18} />
            </button>
          )}

          {/* Save/Commit Button */}
          {onSave && (
            <button 
              onClick={onSave}
              disabled={isSaving}
              className="h-10 px-5 flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer font-cairo shrink-0"
              title="ترحيل وحفظ التغييرات"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>ترحيل وحفظ</span>
            </button>
          )}

          {extraHeaderActions}

          {/* Back/Close Button */}
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
            title="خروج"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      <div 
        ref={containerRef} 
        className="flex-1 overflow-auto bg-[#1a1a1a] p-4 md:p-8 text-right w-full flex flex-col items-center scroll-smooth"
      >
        <div 
          className="relative shrink-0 my-4 transition-all duration-150 flex justify-center"
          style={{ 
            width: `${794 * (scale * userZoom)}px`, 
            height: `${contentHeight * (scale * userZoom)}px`
          }}
        >
          <div 
            className="absolute top-0 left-0 transition-transform duration-150 shrink-0 scale-wrapper origin-top-left"
            style={{ 
              width: '794px', 
              minHeight: '1123px',
              height: `${contentHeight}px`, 
              transform: `scale(${scale * userZoom})`
            }}
          >
            <div ref={printAreaRef} id="print-preview-area" className="w-[794px] mx-auto flex flex-col gap-8 relative shrink-0 font-cairo bg-transparent print:bg-white print:gap-0" dir="rtl">
            {type === 'statement' ? renderStatementPages() : (type === 'table' ? renderTablePages() : (
              <div className="w-[794px] min-h-[1123px] bg-white p-5 pb-[15px] flex flex-col relative shrink-0 shadow-2xl print:shadow-none" style={{ pageBreakAfter: 'always' }}>
                {renderHeader()}
                
                {/* Dynamic Bodies based on Type & Template */}
                <div className="flex-1 mb-4 flex flex-col">
                {type === 'voucher' && voucher && (
              <div className="mt-3 border-2 border-gray-900 rounded-lg overflow-hidden">
                 <div className="flex border-b-2 border-gray-900">
                    <div className="w-1/4 bg-gray-100 p-2 font-black text-gray-700 border-l-2 border-gray-900 text-center flex items-center justify-center text-xs">نوع السند</div>
                    <div className="w-3/4 p-2 font-black text-lg text-center bg-white">{voucher.type === 'receipt' ? 'سند قبض مالي' : 'سند صرف مالي'}</div>
                 </div>
                 <div className="flex border-b-2 border-gray-900">
                    <div className="w-1/4 bg-gray-100 p-2 font-black text-gray-700 border-l-2 border-gray-900 text-center flex items-center justify-center text-xs">المبلغ</div>
                    <div className="w-3/4 p-2 font-mono font-black text-xl text-center bg-white">
                      {Number(voucher.amount).toLocaleString('en-US')} <span className="text-sm font-sans mr-1">{voucher.currency || 'USD'}</span>
                    </div>
                 </div>
                 <div className="flex border-b-2 border-gray-900">
                    <div className="w-1/4 bg-gray-100 p-2 font-black text-gray-700 border-l-2 border-gray-900 text-center flex items-center justify-center text-xs">البيان والتفاصيل</div>
                    <div className="w-3/4 p-2 font-bold text-sm leading-relaxed bg-white">
                      {voucher.details || 'لا توجد تفاصيل.'}
                    </div>
                 </div>
                 <div className="flex">
                    <div className="w-1/4 bg-gray-100 p-2 font-black text-gray-700 border-l-2 border-gray-900 text-center flex items-center justify-center text-xs">التصنيف المحاسبي</div>
                    <div className="w-3/4 p-2 font-bold text-xs bg-white">
                      {voucher.category || 'عام'}
                    </div>
                 </div>
                 {voucher.notes && (
                   <div className="flex border-t-2 border-gray-900">
                      <div className="w-1/4 bg-gray-100 p-2 font-black text-gray-700 border-l-2 border-gray-900 text-center flex items-center justify-center text-xs">ملاحظات</div>
                      <div className="w-3/4 p-2 font-bold text-xs text-gray-600 bg-white leading-relaxed">
                        {voucher.notes}
                      </div>
                   </div>
                 )}
              </div>
            )}



            {type === 'invoice' && templateType === 'entry' && (
              <>
                <div className="w-full text-center border-2 border-black mb-2 text-black font-bold">
                  {/* Header Row */}
                  <div className="bg-gray-100 border-b-2 border-black flex items-stretch text-xs font-bold">
                    <div className="py-1.5 px-3 border-l border-black w-12 flex items-center justify-center shrink-0">م</div>
                    <div className="py-1.5 px-3 border-l border-black w-48 flex items-center justify-start shrink-0">النوع / الجهاز</div>
                    <div className="py-1.5 px-3 border-l border-black flex-1 flex items-center justify-start">المشكلة (من وجهة نظر العميل)</div>
                    <div className="py-1.5 px-3 border-l border-black w-1/4 flex items-center justify-start shrink-0">ملاحظات الاستلام</div>
                    <div className="py-1.5 px-3 w-16 flex items-center justify-center shrink-0">العدد</div>
                  </div>
                  {/* Body List */}
                  <div className="divide-y divide-black text-[11px]">
                    {items.map((it:any, idx:number) => (
                      <div key={idx} className="flex items-stretch min-h-[32px]">
                        <div className="py-1.5 px-3 border-l border-black font-mono w-12 flex items-center justify-center shrink-0">{idx + 1}</div>
                        <div className="py-1.5 px-3 border-l border-black text-right w-48 flex items-center justify-start shrink-0" dir="ltr">
                          <span className="break-words w-full text-right" dir="rtl">
                            {it.deviceType || '-'} - <span className="text-gray-500 text-[10px]">{it.deviceName || '-'}</span>
                          </span>
                        </div>
                        <div className="py-1.5 px-3 border-l border-black text-right flex-1 flex items-center justify-start">
                          <span className="break-words w-full">{it.faultType || it.customerProblem || '-'}</span>
                        </div>
                        <div className="py-1.5 px-3 border-l border-black text-right w-1/4 flex items-center justify-start shrink-0">
                          <span className="break-words w-full">{it.deviceNotes || '-'}</span>
                        </div>
                        <div className="py-1.5 px-3 font-bold font-mono w-16 flex items-center justify-center shrink-0">{it.quantity || 1}</div>
                      </div>
                    ))}
                    {/* Total Row */}
                    <div className="bg-gray-100 border-t-2 border-black flex items-stretch min-h-[32px]">
                      <div className="py-1.5 px-4 border-l border-black text-left font-black flex-1 flex items-center justify-start">اجمالي الأجهزة المستلمة</div>
                      <div className="py-1.5 px-3 text-base font-black text-center font-mono w-16 flex items-center justify-center shrink-0">{items.reduce((sum:number, it:any) => sum + (Number(it.quantity) || 1), 0)}</div>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-500 font-bold mb-2 text-center">
                  سيتم موافاتكم بتقرير الفحص الفني والتكاليف المبدئية في أقرب وقت.
                </div>
              </>
            )}

            {type === 'invoice' && templateType === 'exit' && (() => {
              const getItemStatusLabel = (it: any) => {
                const statusVal = String(it.status || '').trim();
                const subStatus = String(it.subStatus || '').trim();
                const report = String(it.engineerReport || '').toLowerCase();
                const notes = String(it.technicalNotes || '').toLowerCase();
                const reason = String(it.failureReason || '').toLowerCase();

                const isNoPartsText = (text: string) => {
                  const t = text.toLowerCase();
                  return (
                    t.includes('عدم توفر') ||
                    t.includes('غير متوفر') ||
                    t.includes('لا تتوفر') ||
                    t.includes('لا توجد قطع') ||
                    t.includes('قطع غير متوفرة') ||
                    t.includes('no parts') ||
                    t.includes('parts not available') ||
                    t.includes('parts unavailable') ||
                    t.includes('unavailability of parts')
                  );
                };

                // 1. Direct subStatus check
                if (subStatus === 'ready') return 'جاهز';
                if (subStatus === 'intact') return 'سليم';
                if (subStatus === 'unrepairable') return 'لا يصلح';
                if (subStatus === 'refused') return 'لم يوافق';
                if (subStatus === 'no_parts') return 'عدم توفر قطع الغيار';

                // 2. Direct status check
                if (statusVal === 'ready' || statusVal === '60') return 'جاهز';
                if (statusVal === 'intact') return 'سليم';
                if (statusVal === 'unrepairable' || statusVal === '55' || statusVal === '45') return 'لا يصلح';
                if (statusVal === 'refused' || statusVal === '70' || statusVal === 'cancelled') return 'لم يوافق';
                if (statusVal === 'no_parts') return 'عدم توفر قطع الغيار';

                // 3. Keyword fallbacks for other cases/legacy/unified '50'
                if (
                  isNoPartsText(reason) || 
                  isNoPartsText(report) || 
                  isNoPartsText(notes)
                ) {
                  return 'عدم توفر قطع الغيار';
                }

                if (report.includes('سليم') || notes.includes('سليم')) return 'سليم';
                if (
                  report.includes('لا يصلح') || 
                  report.includes('لايصلح') ||
                  notes.includes('لا يصلح') ||
                  notes.includes('لايصلح')
                ) {
                  return 'لا يصلح';
                }
                if (reason.includes('لم يوافق') || report.includes('لم يوافق')) return 'لم يوافق';

                if (statusVal === '50') {
                  if (reason.includes('لم يوافق') || report.includes('لم يوافق')) return 'لم يوافق';
                  if (reason.includes('لا يصلح') || report.includes('لا يصلح') || report.includes('unrepairable')) return 'لا يصلح';
                  if (report.includes('سليم') || report.includes('intact')) return 'سليم';
                  return 'جاهز';
                }

                return 'جاهز'; // default fallback for exit items
              };

              const subTotal = items.reduce((sum: number, it: any) => {
                const statusLabel = getItemStatusLabel(it);
                return sum + (statusLabel === 'جاهز' ? Number(it.cost || 0) : 0);
              }, 0);

              const discount = Number(invoice.discount || 0);
              const finalCost = subTotal - discount;
              const paid = Number(invoice.amountPaid || 0);
              const remaining = finalCost - paid;
              const currency = invoice.currency || 'ر.ي';

              return (
                <>
                  <div className="w-full border-2 border-black rounded-lg overflow-hidden mb-2 text-black font-bold font-cairo">
                    <table className="w-full border-collapse text-xs table-fixed">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-black text-black">
                          <th className="py-1.5 px-2 border-l border-black text-center w-12 font-bold">مسلسل</th>
                          <th className="py-1.5 px-2 border-l border-black text-right w-48 font-bold">النوع/الجهاز</th>
                          <th className="py-1.5 px-2 border-l border-black text-center w-24 font-bold">الحالة</th>
                          <th className="py-1.5 px-2 border-l border-black text-center w-36 font-bold">تكلفة صيانة الجهاز</th>
                          <th className="py-1.5 px-2 border-l border-black text-center w-16 font-bold">العدد</th>
                          <th className="py-1.5 px-2 text-center w-36 font-bold">إجمالي التكلفة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {(() => {
                          const getConditionRank = (item: any) => {
                            const subStatus = getItemStatusLabel(item);
                            if (subStatus === 'جاهز') return 1;
                            if (subStatus === 'سليم') return 2;
                            if (subStatus === 'لا يصلح' || subStatus === 'عدم توفر قطع الغيار') return 3;
                            if (subStatus === 'لم يوافق') return 4;
                            return 5;
                          };
                          const typeRanks: Record<string, number> = {};
                          const nameRanks: Record<string, number> = {};
                          items.forEach((item: any) => {
                            const t = item.deviceType || '';
                            const n = item.deviceName || '';
                            const key = `${t}|${n}`;
                            const r = getConditionRank(item);
                            if (!(t in typeRanks) || r < typeRanks[t]) typeRanks[t] = r;
                            if (!(key in nameRanks) || r < nameRanks[key]) nameRanks[key] = r;
                          });

                          return [...items].sort((a, b) => {
                            const tA = a.deviceType || '';
                            const tB = b.deviceType || '';
                            if (typeRanks[tA] !== typeRanks[tB]) return typeRanks[tA] - typeRanks[tB];
                            if (tA !== tB) return tA.localeCompare(tB, 'ar');
                            
                            const nA = a.deviceName || '';
                            const nB = b.deviceName || '';
                            const keyA = `${tA}|${nA}`;
                            const keyB = `${tB}|${nB}`;
                            if (nameRanks[keyA] !== nameRanks[keyB]) return nameRanks[keyA] - nameRanks[keyB];
                            if (nA !== nB) return nA.localeCompare(nB, 'ar');
                            
                            return getConditionRank(a) - getConditionRank(b);
                          }).map((it: any, idx: number) => {
                            const qty = Number(it.quantity || 1);
                            const statusLabel = getItemStatusLabel(it);
                            const isReady = statusLabel === 'جاهز';
                            const originalUnitCost = qty > 0 ? Number(it.cost || 0) / qty : Number(it.cost || 0);
                            const unitCost = isReady ? originalUnitCost : 0;
                            const totalCost = isReady ? Number(it.cost || 0) : 0;

                            let statusColor = 'text-amber-700';
                            if (statusLabel === 'جاهز') statusColor = 'text-emerald-700';
                            if (statusLabel === 'سليم') statusColor = 'text-blue-700';
                            if (statusLabel === 'لا يصلح') statusColor = 'text-rose-700';
                             if (statusLabel === 'عدم توفر قطع الغيار') statusColor = 'text-rose-700';
                            if (statusLabel === 'لم يوافق') statusColor = 'text-gray-600';

                            return (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="py-1 px-2 border-l border-black text-center font-mono whitespace-nowrap overflow-hidden text-ellipsis truncate">{idx + 1}</td>
                                <td className="py-1 px-2 border-l border-black text-right whitespace-nowrap overflow-hidden text-ellipsis truncate">
                                  <div className="truncate max-w-[180px]" dir="rtl" title={`${it.deviceType} ${it.deviceName ? `- ${it.deviceName}` : ''}`}>
                                    {it.deviceType} <span className="text-gray-500 text-[10px] font-normal">- {it.deviceName}</span>
                                  </div>
                                </td>
                                <td className={`py-1 px-2 border-l border-black text-center font-black ${statusColor}`}>
                                  <div className="flex flex-col items-center justify-center leading-normal">
                                    {(() => {
                                      const { outcome } = parseEngineerReport(it.technicalNotes || it.engineerReport || '');
                                      return (
                                        <span>
                                          {statusLabel}
                                          {isReady && outcome ? ` - ${outcome}` : ''}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </td>
                              <td className="py-1 px-2 border-l border-black text-center font-mono whitespace-nowrap overflow-hidden text-ellipsis truncate" dir="ltr">
                                {unitCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-1 px-2 border-l border-black text-center font-mono whitespace-nowrap overflow-hidden text-ellipsis truncate" dir="ltr">
                                {qty}
                              </td>
                              <td className="py-1 px-2 text-center font-mono whitespace-nowrap overflow-hidden text-ellipsis truncate" dir="ltr">
                                {totalCost.toLocaleString('en-US')}
                              </td>
                            </tr>
                          );
                        });
                        })()}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 border-t-2 border-black font-black text-xs h-9">
                          <td colSpan={4} className="py-1.5 px-4 border-l border-black text-right font-black">
                            إجمالي عدد الأجهزة ومبلغ الفاتورة
                          </td>
                          <td className="py-1.5 px-2 border-l border-black text-center font-mono font-black text-sm" dir="ltr">
                            {items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0)}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono font-black text-sm" dir="ltr">
                            {subTotal.toLocaleString('en-US')} <span className="text-[10px] font-bold">{currency}</span>
                          </td>
                        </tr>
                        {discount <= 0 ? (
                          <tr className="bg-white border-t border-black font-black text-xs h-9">
                            <td colSpan={3} className="py-1.5 px-4 border-l border-black text-right">
                              المبلغ المدفوع: <span className="font-mono text-emerald-700 text-sm font-black">{paid.toLocaleString('en-US')}</span> <span className="text-[10px] font-bold">{currency}</span>
                            </td>
                            <td colSpan={3} className="py-1.5 px-4 text-center">
                              المبلغ المتبقي: <span className="font-mono text-rose-700 text-sm font-black">{remaining.toLocaleString('en-US')}</span> <span className="text-[10px] font-bold">{currency}</span>
                            </td>
                          </tr>
                        ) : (
                          <tr className="bg-white border-t border-black font-black text-xs h-9">
                            <td colSpan={2} className="py-1.5 px-4 border-l border-black text-right">
                              الخصم: <span className="font-mono text-amber-700 text-sm font-black">{discount.toLocaleString('en-US')}</span> <span className="text-[10px] font-bold">{currency}</span>
                            </td>
                            <td colSpan={2} className="py-1.5 px-4 border-l border-black text-center">
                              المبلغ المدفوع: <span className="font-mono text-emerald-700 text-sm font-black">{paid.toLocaleString('en-US')}</span> <span className="text-[10px] font-bold">{currency}</span>
                            </td>
                            <td colSpan={2} className="py-1.5 px-4 text-center">
                              المبلغ المتبقي: <span className="font-mono text-rose-700 text-sm font-black">{remaining.toLocaleString('en-US')}</span> <span className="text-[10px] font-bold">{currency}</span>
                            </td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>

                  {/* العدادات الذكية والنشطة */}
                  {(() => {
                    const readyCount = items.filter((i: any) => getItemStatusLabel(i) === 'جاهز').reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);
                    const failedCount = items.filter((i: any) => {
                      const statusLabel = getItemStatusLabel(i);
                      return statusLabel === 'لا يصلح' || statusLabel === 'عدم توفر قطع الغيار';
                    }).reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);
                    const safeCount = items.filter((i: any) => getItemStatusLabel(i) === 'سليم').reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);
                    const refusedCount = items.filter((i: any) => getItemStatusLabel(i) === 'لم يوافق').reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);

                    const smartCounters = [
                      { label: 'جاهز', count: readyCount, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                      { label: 'لا يصلح', count: failedCount, bg: 'bg-rose-50 text-rose-700 border-rose-200' },
                      { label: 'سليم', count: safeCount, bg: 'bg-blue-50 text-blue-700 border-blue-200' },
                      { label: 'لم يوافق', count: refusedCount, bg: 'bg-gray-50 text-gray-700 border-gray-200' }
                    ].filter(c => c.count > 0);

                    if (smartCounters.length === 0) return null;

                    return (
                      <div className="border border-black rounded-lg overflow-hidden bg-gray-50 mb-3 font-cairo w-full text-xs">
                        <div className="bg-gray-100 border-b border-black p-2 font-black text-center text-gray-700 text-xs">
                          ملخص إحصائيات حالة الأجهزة الفنية
                        </div>
                        <div className="flex divide-x divide-x-reverse divide-black font-bold">
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
                </>
              );
            })()}

            {type === 'invoice' && templateType === 'inspection' && (() => {
              const isPhase1 = invoice?.status === '21';
              const getItemStatus = (it: any) => {
                const statusVal = String(it.status || '').trim();
                if (['55', '45', '70'].includes(statusVal) || it.subStatus === 'unrepairable' || (it.engineerReport || '').includes('لا يصلح') || (it.technicalNotes || '').includes('لا يصلح')) {
                  return 'لا يصلح';
                } else if (['50', '60'].includes(statusVal)) {
                  return 'سليم';
                }
                return 'صيانة';
              };

              const sortedItems = [...items].sort((a: any, b: any) => {
                // 1. Sort by deviceType (النوع)
                const typeA = a.deviceType || '';
                const typeB = b.deviceType || '';
                const typeComp = typeA.localeCompare(typeB, 'ar');
                if (typeComp !== 0) return typeComp;

                // 2. Sort by deviceName (الجهاز)
                const nameA = a.deviceName || '';
                const nameB = b.deviceName || '';
                const nameComp = nameA.localeCompare(nameB, 'ar');
                if (nameComp !== 0) return nameComp;

                // 3. Sort by الحالة (صيانه, سليم, لا يصلح)
                const getWeight = (it: any) => {
                  const label = getItemStatus(it);
                  if (label === 'لا يصلح') return 3;
                  if (label === 'سليم') return 2;
                  return 1; // صيانة
                };
                return getWeight(a) - getWeight(b);
              });

              return (
                <>
                  <div className="w-full border-2 border-black rounded-lg overflow-hidden mb-2 text-black font-bold font-cairo">
                    <table className="w-full border-collapse text-xs table-fixed">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-black text-black">
                          <th className="py-1.5 px-2 border-l border-black text-center w-10 font-bold">م</th>
                          <th className="py-1.5 px-2 border-l border-black text-right w-44 font-bold">النوع / الجهاز</th>
                          <th className="py-1.5 px-2 border-l border-black text-right min-w-[120px] font-bold">تقرير الفحص / نتيجة الصيانة</th>
                          {!isPhase1 && <th className="py-1.5 px-2 border-l border-black text-center w-32 font-bold">تكلفة صيانة الجهاز</th>}
                          <th className="py-1.5 px-2 border-l border-black text-center w-16 font-bold">العدد</th>
                          {!isPhase1 && <th className="py-1.5 px-2 text-center w-28 font-bold">اجمالي التكلفة</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {sortedItems.map((it: any, idx: number) => {
                          const qty = Number(it.quantity || 1);
                          const totalCost = Number(it.cost || 0);
                          const unitCost = qty > 0 ? totalCost / qty : totalCost;
                          const statusLabel = getItemStatus(it);
                          const reportVal = it.technicalNotes || it.engineerReport || it.failureReason || '';
                          const parsed = parseEngineerReport(reportVal);

                          const displayStatusReport = (() => {
                            if (reportVal && reportVal.trim() !== '' && reportVal.trim() !== '-') {
                              if (parsed.outcome) {
                                return `${parsed.technical} - ${parsed.outcome}`;
                              }
                              return parsed.technical;
                            }
                            return statusLabel;
                          })();

                          return (
                            <tr key={idx} className="h-8 hover:bg-gray-50/50">
                              <td className="py-1 px-2 border-l border-black text-center font-mono">{idx + 1}</td>
                              <td className="py-1 px-2 border-l border-black text-right">
                                <div className="truncate max-w-[170px] whitespace-nowrap overflow-hidden text-ellipsis" dir="rtl">
                                  {it.deviceType} <span className="text-gray-500 text-[10px] font-normal">- {it.deviceName}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 border-l border-black text-right">
                                <div className="max-w-[280px] text-emerald-800 leading-normal flex flex-col justify-center" dir="rtl">
                                  <span>{displayStatusReport}</span>
                                </div>
                              </td>
                              {!isPhase1 && (
                                <td className="py-1 px-2 border-l border-black text-center font-mono" dir="ltr">
                                  {unitCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </td>
                              )}
                              <td className="py-1 px-2 border-l border-black text-center font-mono" dir="ltr">
                                {qty}
                              </td>
                              {!isPhase1 && (
                                <td className="py-1 px-2 text-center font-mono" dir="ltr">
                                  {totalCost.toLocaleString('en-US')}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 border-t-2 border-black font-black text-sm h-9">
                          <td colSpan={isPhase1 ? 3 : 4} className="py-1.5 px-4 border-l border-black text-left font-black">
                            الاجمالي
                          </td>
                          <td className="py-1.5 px-2 border-l border-black text-center font-mono font-black" dir="ltr">
                            {sortedItems.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0)}
                          </td>
                          {!isPhase1 && (
                            <td className="py-1.5 px-2 text-center font-mono font-black" dir="ltr">
                              {sortedItems.reduce((sum: number, it: any) => sum + Number(it.cost || 0), 0).toLocaleString('en-US')}
                            </td>
                          )}
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* العدادات بعد الجدول بشكل صحيح ومرتب */}
                  {(() => {
                    const maintCount = items.filter((i: any) => getItemStatus(i) === 'صيانة').reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);
                    const safeCount = items.filter((i: any) => getItemStatus(i) === 'سليم').reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);
                    const failedCount = items.filter((i: any) => getItemStatus(i) === 'لا يصلح').reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);

                    const smartCounters = [
                      { label: 'صيانة', count: maintCount, bg: 'bg-amber-50 text-amber-700' },
                      { label: 'سليم', count: safeCount, bg: 'bg-emerald-50 text-emerald-700' },
                      { label: 'لا يصلح', count: failedCount, bg: 'bg-rose-50 text-rose-700' }
                    ].filter(c => c.count > 0);

                    if (smartCounters.length === 0) return null;

                    return (
                      <div className="border-2 border-black rounded-lg overflow-hidden bg-gray-50 mb-3 font-cairo w-full text-xs">
                        <div className="bg-gray-100 border-b border-black p-2 font-black text-center text-gray-700 text-xs">
                          ملخص إحصائيات حالة الأجهزة الفنية
                        </div>
                        <div className="flex divide-x divide-x-reverse divide-black font-bold">
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
                </>
              );
            })()}

            {type === 'invoice' && templateType === 'quotation' && (() => {
              const getItemStatus = (it: any) => {
                const statusVal = String(it.status || '').trim();
                if (['55', '45', '70'].includes(statusVal) || it.subStatus === 'unrepairable' || (it.engineerReport || '').includes('لا يصلح') || (it.technicalNotes || '').includes('لا يصلح')) {
                  return 'لا يصلح';
                } else if (['50', '60'].includes(statusVal)) {
                  return 'سليم';
                }
                return 'صيانة';
              };

              const sortedItems = [...items].sort((a: any, b: any) => {
                // 1. Sort by deviceType (النوع)
                const typeA = a.deviceType || '';
                const typeB = b.deviceType || '';
                const typeComp = typeA.localeCompare(typeB, 'ar');
                if (typeComp !== 0) return typeComp;

                // 2. Sort by deviceName (الجهاز)
                const nameA = a.deviceName || '';
                const nameB = b.deviceName || '';
                const nameComp = nameA.localeCompare(nameB, 'ar');
                if (nameComp !== 0) return nameComp;

                // 3. Sort by الحالة (صيانه, سليم, لا يصلح)
                const getWeight = (it: any) => {
                  const label = getItemStatus(it);
                  if (label === 'لا يصلح') return 3;
                  if (label === 'سليم') return 2;
                  return 1; // صيانة
                };
                return getWeight(a) - getWeight(b);
              });

              return (
                <>
                  <div className="w-full border-2 border-black rounded-lg overflow-hidden mb-2 text-black font-bold font-cairo">
                    <table className="w-full border-collapse text-xs table-fixed">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-black text-black">
                          <th className="py-1.5 px-2 border-l border-black text-center w-10 font-bold">م</th>
                          <th className="py-1.5 px-2 border-l border-black text-right w-44 font-bold">النوع / الجهاز</th>
                          <th className="py-1.5 px-2 border-l border-black text-right min-w-[120px] font-bold">تقرير الفحص / نتيجة الصيانة</th>
                          <th className="py-1.5 px-2 border-l border-black text-center w-32 font-bold">تكلفة صيانة الجهاز</th>
                          <th className="py-1.5 px-2 border-l border-black text-center w-16 font-bold">العدد</th>
                          <th className="py-1.5 px-2 text-center w-28 font-bold">اجمالي التكلفة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {sortedItems.map((it: any, idx: number) => {
                          const qty = Number(it.quantity || 1);
                          const totalCost = Number(it.cost || 0);
                          const unitCost = qty > 0 ? totalCost / qty : totalCost;
                          const statusLabel = getItemStatus(it);
                          const reportVal = it.technicalNotes || it.engineerReport || it.failureReason || '';
                          const parsed = parseEngineerReport(reportVal);

                          const displayStatusReport = (() => {
                            if (statusLabel === 'صيانة') {
                              return parsed.outcome || '-';
                            } else {
                              return parsed.technical || statusLabel;
                            }
                          })();

                          return (
                            <tr key={idx} className="h-8 hover:bg-gray-50/50">
                              <td className="py-1 px-2 border-l border-black text-center font-mono">{idx + 1}</td>
                              <td className="py-1 px-2 border-l border-black text-right">
                                <div className="truncate max-w-[170px] whitespace-nowrap overflow-hidden text-ellipsis" dir="rtl">
                                  {it.deviceType} <span className="text-gray-500 text-[10px] font-normal">- {it.deviceName}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 border-l border-black text-right">
                                <div className="max-w-[280px] text-emerald-800 leading-normal flex flex-col justify-center" dir="rtl">
                                  <span>{displayStatusReport}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 border-l border-black text-center font-mono" dir="ltr">
                                {unitCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-1 px-2 border-l border-black text-center font-mono" dir="ltr">
                                {qty}
                              </td>
                              <td className="py-1 px-2 text-center font-mono" dir="ltr">
                                {totalCost.toLocaleString('en-US')}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 border-t-2 border-black font-black text-sm h-9">
                          <td colSpan={4} className="py-1.5 px-4 border-l border-black text-left font-black">
                            الاجمالي
                          </td>
                          <td className="py-1.5 px-2 border-l border-black text-center font-mono font-black" dir="ltr">
                            {sortedItems.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0)}
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono font-black" dir="ltr">
                            {sortedItems.reduce((sum: number, it: any) => sum + Number(it.cost || 0), 0).toLocaleString('en-US')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* العدادات بعد الجدول بشكل صحيح ومرتب */}
                  {(() => {
                    const maintCount = items.filter((i: any) => getItemStatus(i) === 'صيانة').reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);
                    const safeCount = items.filter((i: any) => getItemStatus(i) === 'سليم').reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);
                    const failedCount = items.filter((i: any) => getItemStatus(i) === 'لا يصلح').reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);

                    const smartCounters = [
                      { label: 'صيانة', count: maintCount, bg: 'bg-amber-50 text-amber-700' },
                      { label: 'سليم', count: safeCount, bg: 'bg-emerald-50 text-emerald-700' },
                      { label: 'لا يصلح', count: failedCount, bg: 'bg-rose-50 text-rose-700' }
                    ].filter(c => c.count > 0);

                    if (smartCounters.length === 0) return null;

                    return (
                      <div className="border-2 border-black rounded-lg overflow-hidden bg-gray-50 mb-3 font-cairo w-full text-xs">
                        <div className="bg-gray-100 border-b border-black p-2 font-black text-center text-gray-700 text-xs">
                          ملخص إحصائيات حالة الأجهزة الفنية
                        </div>
                        <div className="flex divide-x divide-x-reverse divide-black font-bold">
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

                  <div className="text-[10px] text-gray-600 font-bold mb-2 italic">
                    * هذا العرض صالح لمدة 14 يوماً من تاريخ إصدارها وتظل الأسعار قابلة للتغير بناءً على توفر قطع الغيار.
                  </div>
                </>
              );
            })()}

            {type === 'invoice' && templateType === 'assignment' && (() => {
              const getItemStatus = (it: any) => {
                const statusVal = String(it.status || '').trim();
                if (['55', '45', '70'].includes(statusVal) || it.subStatus === 'unrepairable' || (it.engineerReport || '').includes('لا يصلح') || (it.technicalNotes || '').includes('لا يصلح')) {
                  return 'لا يصلح';
                } else if (['50', '60'].includes(statusVal)) {
                  return 'سليم';
                }
                return 'صيانة';
              };

              const getAssignmentReport = (it: any) => {
                const statusLabel = getItemStatus(it);
                if (statusLabel !== 'صيانة') return '-';
                const statusVal = String(it.status || '').trim();
                const subStatus = String(it.subStatus || '').trim().toLowerCase();
                const report = String(it.engineerReport || it.technicalNotes || '').toLowerCase();

                if (subStatus === 'refused' || statusVal === '70' || report.includes('رفض') || report.includes('لم يوافق')) {
                  return 'لم يوافق';
                }
                if (subStatus === 'no_parts' || subStatus === 'parts_not_available' || subStatus === 'awaiting_parts' || statusVal === '35' || report.includes('قطع الغيار')) {
                  return 'انتظار قطع الغيار';
                }
                if (subStatus === 'repairing' || subStatus === 'approved' || ['40', '50', '60'].includes(statusVal) || report.includes('وافق')) {
                  return 'وافق';
                }
                return 'بانتظار الموافقة';
              };

              return (
                <>
                  <div className="w-full border-2 border-black rounded-lg overflow-hidden mb-2 text-black font-bold font-cairo">
                    <table className="w-full border-collapse text-xs table-fixed">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-black text-black">
                          <th className="py-1.5 px-2 border-l border-black text-center w-10 font-bold">م</th>
                          <th className="py-1.5 px-2 border-l border-black text-right w-40 font-bold">النوع / الجهاز</th>
                          <th className="py-1.5 px-2 border-l border-black text-right min-w-[140px] font-bold">تقرير الفحص الفني / نتيجة الصيانة</th>
                          <th className="py-1.5 px-2 border-l border-black text-center w-36 font-bold">تقرير الإسناد</th>
                          <th className="py-1.5 px-2 border-l border-black text-center w-32 font-bold">المهندس المسند إليه</th>
                          <th className="py-1.5 px-2 text-center w-28 font-bold">ملاحظات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {items.map((it: any, idx: number) => {
                          const statusLabel = getItemStatus(it);
                          const reportVal = it.technicalNotes || it.engineerReport || it.failureReason || '';
                          const parsed = parseEngineerReport(reportVal);
                          const displayInspection = parsed.outcome ? `${parsed.technical} - ${parsed.outcome}` : (parsed.technical || statusLabel);
                          const assignmentStatus = getAssignmentReport(it);

                          return (
                            <tr key={idx} className="h-8 hover:bg-gray-50/50">
                              <td className="py-1 px-2 border-l border-black text-center font-mono">{idx + 1}</td>
                              <td className="py-1 px-2 border-l border-black text-right">
                                <div className="truncate max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis" dir="rtl">
                                  {it.deviceType} <span className="text-gray-500 text-[10px] font-normal">- {it.deviceName}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 border-l border-black text-right">
                                <div className="max-w-[200px] leading-normal flex flex-col justify-center" dir="rtl">
                                  <span>{displayInspection}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 border-l border-black text-center">
                                <span className={
                                  assignmentStatus === 'وافق' ? 'text-emerald-700 font-bold' :
                                  assignmentStatus === 'لم يوافق' ? 'text-rose-700 font-bold' :
                                  assignmentStatus === 'انتظار قطع الغيار' ? 'text-amber-700 font-bold' : 'text-gray-600 font-medium'
                                }>{assignmentStatus}</span>
                              </td>
                              <td className="py-1 px-2 border-l border-black text-center text-blue-700">
                                {it.technician || '-'}
                              </td>
                              <td className="py-1 px-2 text-center text-[10px] text-gray-600">
                                {it.deviceNotes || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* العدادات بعد الجدول بشكل صحيح ومرتب */}
                  <div className="border-2 border-black rounded-lg overflow-hidden bg-gray-50 mb-3 font-cairo w-full text-xs">
                    <div className="bg-gray-100 border-b border-black p-2 font-black text-center text-gray-700 text-xs">
                      ملخص إحصائيات حالة الأجهزة الفنية
                    </div>
                    <div className="flex divide-x divide-x-reverse divide-black font-bold">
                      <div className="flex-1 p-2 text-center bg-white">
                        <div className="text-[10px] text-gray-500 font-bold mb-0.5">إجمالي الأجهزة</div>
                        <div className="text-sm font-mono font-black text-gray-900">
                          {items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0)}
                        </div>
                      </div>
                      <div className="flex-1 p-2 text-center bg-emerald-50 text-emerald-700">
                        <div className="text-[10px] opacity-75 font-bold mb-0.5">جاهز للتسليم</div>
                        <div className="text-sm font-mono font-black">
                          {items.filter((i: any) => ['50', '60'].includes(i.status)).reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0)}
                        </div>
                      </div>
                      <div className="flex-1 p-2 text-center bg-amber-50 text-amber-700">
                        <div className="text-[10px] opacity-75 font-bold mb-0.5">قيد الصيانة / الفحص</div>
                        <div className="text-sm font-mono font-black">
                          {items.filter((i: any) => !['50', '60', '55', '45', '70'].includes(i.status)).reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0)}
                        </div>
                      </div>
                      <div className="flex-1 p-2 text-center bg-rose-50 text-rose-700">
                        <div className="text-[10px] opacity-75 font-bold mb-0.5">لا يمكن / رفض</div>
                        <div className="text-sm font-mono font-black">
                          {items.filter((i: any) => ['55', '45', '70'].includes(i.status)).reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {type === 'invoice' && templateType === 'maintenance' && (() => {
              const getItemStatus = (it: any) => {
                const statusVal = String(it.status || '').trim();
                if (['55', '45', '70'].includes(statusVal) || it.subStatus === 'unrepairable' || (it.engineerReport || '').includes('لا يصلح') || (it.technicalNotes || '').includes('لا يصلح')) {
                  return 'لا يصلح';
                } else if (['50', '60'].includes(statusVal)) {
                  return 'سليم';
                }
                return 'صيانة';
              };

              const getAssignmentReport = (it: any) => {
                const statusLabel = getItemStatus(it);
                if (statusLabel !== 'صيانة') return '-';
                const statusVal = String(it.status || '').trim();
                const subStatus = String(it.subStatus || '').trim().toLowerCase();
                const report = String(it.engineerReport || it.technicalNotes || '').toLowerCase();

                if (subStatus === 'refused' || statusVal === '70' || report.includes('رفض') || report.includes('لم يوافق')) {
                  return 'لم يوافق';
                }
                if (subStatus === 'no_parts' || subStatus === 'parts_not_available' || subStatus === 'awaiting_parts' || statusVal === '35' || report.includes('قطع الغيار')) {
                  return 'انتظار قطع الغيار';
                }
                if (subStatus === 'repairing' || subStatus === 'approved' || ['40', '50', '60'].includes(statusVal) || report.includes('وافق')) {
                  return 'وافق';
                }
                return 'بانتظار الموافقة';
              };

              const getMaintenanceReport = (it: any) => {
                const statusLabel = getItemStatus(it);
                if (statusLabel !== 'صيانة') return '-';

                const statusVal = String(it.status || '').trim();
                const subStatus = String(it.subStatus || '').trim().toLowerCase();
                const report = String(it.engineerReport || it.technicalNotes || '').toLowerCase();

                if (['50', '60'].includes(statusVal) || subStatus === 'ready' || statusVal === 'delivered' || report.includes('تم الإصلاح') || report.includes('جاهز')) {
                  return 'تم الإصلاح';
                }
                if (['55', '45'].includes(statusVal) || subStatus === 'unrepairable' || subStatus === 'failed' || report.includes('لم يتم الإصلاح')) {
                  return 'لم يتم الإصلاح';
                }
                if (['70'].includes(statusVal) || subStatus === 'refused' || report.includes('عدم موافقة') || report.includes('لم يوافق')) {
                  return 'عدم موافقة العميل';
                }
                return 'قيد الصيانة';
              };

              return (
                <>
                  <div className="w-full border-2 border-black rounded-lg overflow-hidden mb-2 text-black font-bold font-cairo">
                    <table className="w-full border-collapse text-xs table-fixed">
                      <thead>
                        <tr className="bg-gray-100 border-b-2 border-black text-black">
                          <th className="py-1.5 px-2 border-l border-black text-center w-10 font-bold">م</th>
                          <th className="py-1.5 px-2 border-l border-black text-right w-40 font-bold">النوع / الجهاز</th>
                          <th className="py-1.5 px-2 border-l border-black text-right min-w-[130px] font-bold">التقرير الفني / نتيجة الصيانة</th>
                          <th className="py-1.5 px-2 border-l border-black text-center w-32 font-bold">تقرير الإسناد</th>
                          <th className="py-1.5 px-2 border-l border-black text-center w-36 font-bold">تقرير الصيانة</th>
                          <th className="py-1.5 px-2 text-center w-16 font-bold">العدد</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black">
                        {items.map((it: any, idx: number) => {
                          const qty = Number(it.quantity || 1);
                          const statusLabel = getItemStatus(it);
                          const reportVal = it.technicalNotes || it.engineerReport || it.failureReason || '';
                          const parsed = parseEngineerReport(reportVal);
                          const displayInspection = parsed.outcome ? `${parsed.technical} - ${parsed.outcome}` : (parsed.technical || statusLabel);
                          const assignmentReport = getAssignmentReport(it);
                          const maintenanceReport = getMaintenanceReport(it);

                          return (
                            <tr key={idx} className="h-8 hover:bg-gray-50/50">
                              <td className="py-1 px-2 border-l border-black text-center font-mono">{idx + 1}</td>
                              <td className="py-1 px-2 border-l border-black text-right">
                                <div className="truncate max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis" title={`${it.deviceType} ${it.deviceName ? `- ${it.deviceName}` : ''}`} dir="rtl">
                                  {it.deviceType} <span className="text-gray-500 text-[10px] font-normal">- {it.deviceName}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 border-l border-black text-right">
                                <div className="max-w-[180px] leading-normal flex flex-col justify-center" dir="rtl">
                                  <span>{displayInspection}</span>
                                </div>
                              </td>
                              <td className="py-1 px-2 border-l border-black text-center">
                                <span className={
                                  assignmentReport === 'وافق' ? 'text-emerald-700 font-bold' :
                                  assignmentReport === 'لم يوافق' ? 'text-rose-700 font-bold' :
                                  assignmentReport === 'انتظار قطع الغيار' ? 'text-amber-700 font-bold' : 'text-gray-600 font-medium'
                                }>{assignmentReport}</span>
                              </td>
                              <td className="py-1 px-2 border-l border-black text-center">
                                <span className={
                                  maintenanceReport === 'تم الإصلاح' ? 'text-emerald-700 font-bold' :
                                  maintenanceReport === 'لم يتم الإصلاح' ? 'text-rose-700 font-bold' :
                                  maintenanceReport === 'عدم موافقة العميل' ? 'text-amber-800 font-bold' : 'text-blue-700 font-bold'
                                }>{maintenanceReport}</span>
                              </td>
                              <td className="py-1 px-2 text-center font-mono" dir="ltr">
                                {qty}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 border-t-2 border-black font-black text-sm h-9">
                          <td colSpan={5} className="py-1.5 px-4 border-l border-black text-left font-black">
                            الإجمالي
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono font-black" dir="ltr">
                            {items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* العدادات الذكيه جاهز لا يصلح لم يوافق وياخذ القيمه من الحاله */}
                  {(() => {
                    const readyCount = items.filter((i: any) => ['50', '60'].includes(String(i.status || ''))).reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);
                    const failedCount = items.filter((i: any) => ['55', '45'].includes(String(i.status || ''))).reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);
                    const refusedCount = items.filter((i: any) => ['70'].includes(String(i.status || ''))).reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);

                    const smartCounters = [
                      { label: 'جاهز', count: readyCount, bg: 'bg-emerald-50 text-emerald-700' },
                      { label: 'لا يصلح', count: failedCount, bg: 'bg-rose-50 text-rose-700' },
                      { label: 'لم يوافق', count: refusedCount, bg: 'bg-amber-50 text-amber-700' }
                    ];

                    return (
                      <div className="border-2 border-black rounded-lg overflow-hidden bg-gray-50 mb-3 font-cairo w-full text-xs">
                        <div className="bg-gray-100 border-b border-black p-2 font-black text-center text-gray-700 text-xs">
                          ملخص إحصائيات حالة الأجهزة الفنية
                        </div>
                        <div className="flex divide-x divide-x-reverse divide-black font-bold">
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
                </>
              );
            })()}
                </div>
            {(templateType === 'sale_software' || templateType === 'sale_maintenance' || templateType === 'sale_parts') && (
              <>
                <div className="w-full text-center border-2 border-black mb-2 text-black font-bold">
                  {/* Header Row */}
                  <div className="bg-gray-100 border-b-2 border-black flex items-stretch text-xs font-bold">
                    <div className="py-1.5 px-3 border-l border-black w-12 flex items-center justify-center shrink-0">م</div>
                    <div className="py-1.5 px-3 border-l border-black flex-1 flex items-center justify-start">البيان / الوصف</div>
                    <div className="py-1.5 px-3 border-l border-black w-24 flex items-center justify-center shrink-0">سعر الوحدة</div>
                    <div className="py-1.5 px-3 border-l border-black w-16 flex items-center justify-center shrink-0">الكمية</div>
                    <div className="py-1.5 px-3 w-28 flex items-center justify-center shrink-0">الإجمالي</div>
                  </div>
                  
                  {/* Items */}
                  <div className="flex flex-col">
                    {items.map((it: any, idx: number) => {
                      const qty = Number(it.quantity || 1);
                      const unitCost = Number(it.unitCost || 0);
                      const cost = Number(it.cost || (qty * unitCost));
                      
                      return (
                        <div key={idx} className={`flex items-stretch text-xs ${idx !== items.length - 1 ? 'border-b border-black' : ''}`}>
                          <div className="py-1.5 px-3 border-l border-black w-12 flex items-center justify-center font-mono shrink-0">{idx + 1}</div>
                          <div className="py-1.5 px-3 border-l border-black flex-1 flex flex-col justify-center text-right overflow-hidden break-words">
                            <span className="font-bold">{it.deviceType || it.name || ''}</span>
                            {it.faultType && <span className="text-[10px] text-gray-700 mt-0.5">{it.faultType}</span>}
                          </div>
                          <div className="py-1.5 px-3 border-l border-black w-24 flex items-center justify-center font-mono shrink-0">
                            {unitCost > 0 ? unitCost.toLocaleString('en-US') : '-'}
                          </div>
                          <div className="py-1.5 px-3 border-l border-black w-16 flex items-center justify-center font-mono font-black shrink-0">
                            {qty}
                          </div>
                          <div className="py-1.5 px-3 w-28 flex items-center justify-center font-mono font-black shrink-0">
                            {cost > 0 ? cost.toLocaleString('en-US') : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-start gap-4 mb-2">
                  <div className="flex-1 border-2 border-black rounded-lg p-2 min-h-[60px]">
                    <div className="text-xs font-bold text-gray-600 mb-1">ملاحظات الفاتورة:</div>
                    <div className="text-sm font-bold">{invoice?.notes || 'لا يوجد ملاحظات إضافية'}</div>
                  </div>
                  
                  <div className="w-[200px] border-2 border-black rounded-lg overflow-hidden shrink-0">
                    <div className="flex justify-between items-center p-1.5 border-b border-black bg-gray-50">
                      <span className="text-xs font-bold">الإجمالي:</span>
                      <span className="font-mono font-black">{Number(invoice?.totalCost || 0).toLocaleString('en-US')}</span>
                    </div>
                    <div className="flex justify-between items-center p-1.5 border-b border-black">
                      <span className="text-xs font-bold">المدفوع:</span>
                      <span className="font-mono font-black">{Number(invoice?.amountPaid || 0).toLocaleString('en-US')}</span>
                    </div>
                    <div className="flex justify-between items-center p-1.5 bg-gray-100">
                      <span className="text-xs font-black">المتبقي:</span>
                      <span className="font-mono font-black">{Math.max(0, Number(invoice?.totalCost || 0) - Number(invoice?.amountPaid || 0)).toLocaleString('en-US')}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

                {renderFooter(false)}
              </div>
            )) }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
