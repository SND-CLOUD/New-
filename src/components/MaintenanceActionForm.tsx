import { useState, useEffect } from 'react';
import { sharePdfFile, openWhatsApp } from '../lib/shareHelper';
import { 
  X, 
  Save, 
  Plus, 
  Trash2,
  Calendar,
  Clock,
  User as UserIcon,
  Wrench,
  Package,
  ArrowLeft,
  ArrowRight,
  Loader2,
  MessageCircle,
  Printer,
  MapPin,
  Facebook,
  Phone,
  Smartphone
} from 'lucide-react';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { sanitizeDocumentStyles, sanitizeElementInlineStyles, cleanOklchInStyleText } from '../lib/html2canvasHelper';
import { collection, query, onSnapshot, doc, getDoc, writeBatch, serverTimestamp, addDoc } from '../firebase';
import { db } from '../firebase';
import { InvoiceItem, MaintenanceAction, User, OperationType } from '../types';
import { handleFirestoreError } from '../lib/error-handler';
import { useTranslation } from 'react-i18next';
import PrintPreviewOverlay from './PrintPreviewOverlay';
import { localDb } from '../lib/local-db';

const PIPELINE = ['10', '20', '30', '40', '50', '60'];

function getStatusIndex(status: string): number {
  if (status === 'new') return 0;
  if (status === 'testing' || status === 'inspected') return 1;
  if (status === 'repairing') return 3;
  if (['ready', 'intact', 'unrepairable', 'refused'].includes(status)) return 4;
  if (status === 'delivered') return 5;
  
  const idx = PIPELINE.indexOf(status);
  return idx !== -1 ? idx : 0;
}

export default function MaintenanceActionForm({ 
  onClose, 
  user,
  availableItems,
  preSelectedItemId
}: { 
  onClose: () => void, 
  user: User,
  availableItems: InvoiceItem[],
  preSelectedItemId: string | null
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [shopConfig, setShopConfig] = useState<any>(null);
  const [engineerName, setEngineerName] = useState('');
  const [engineersList, setEngineersList] = useState<string[]>([]);
  const [actionDate, setActionDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  });
  
  const [actionItems, setActionItems] = useState<{
    itemId: string;
    newStatus: string;
    quantity: number;
  }[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'engineers'), (snapshot) => {
      setEngineersList(snapshot.docs.map(doc => doc.data().name).filter(Boolean));
    });
    
    // Shop settings
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

    const unsubscribeShopSettings = onSnapshot(doc(db, 'company_details', 'main_details'), (docSnap) => {
      if (docSnap.exists()) {
        setShopConfig(docSnap.data());
      }
    });

    loadShopConfig();

    return () => {
      unsubscribe();
      unsubscribeShopSettings();
    };
  }, []);

  useEffect(() => {
    if (preSelectedItemId) {
      addActionItem(preSelectedItemId);
    } else {
      addActionItem('');
    }
  }, [preSelectedItemId]);

  const addActionItem = (itemId: string = '') => {
    setActionItems([...actionItems, {
      itemId,
      newStatus: '',
      quantity: 1
    }]);
  };

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const updateActionItem = (index: number, field: string, value: any) => {
    const newItems = [...actionItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-update quantity if item changes
    if (field === 'itemId') {
      const item = availableItems.find(i => i.id === value);
      if (item) {
        newItems[index].quantity = Number(item.quantity) || 1;
        newItems[index].newStatus = ''; // reset status
      }
    }
    
    setActionItems(newItems);
  };

  const handlePreviewInit = () => {
    setShowPreview(true);
  };

  const handleSaveFinal = async (action: 'commit' | 'print' | 'whatsapp') => {
    if (!engineerName.trim()) return;

    setLoading(true);
    let actionRecordDate = new Date(actionDate).getTime();
    try {
      const batch = writeBatch(db);
      
      const updatesLog: MaintenanceAction['updates'] = [];

      for (const actionInfo of actionItems) {
        const dbItem = availableItems.find(i => i.id === actionInfo.itemId);
        if (!dbItem || !actionInfo.newStatus) continue;
        
        const itemQty = Number(dbItem.quantity) || 1;
        const itemRef = doc(db, 'invoice_items', dbItem.id!);
        const updateQty = actionInfo.quantity;
        
        if (itemQty <= updateQty) {
          // Update whole item
          batch.update(itemRef, { 
            status: actionInfo.newStatus,
            technician: engineerName.trim() // Tracking the engineer
          });
        } else {
          // Split item
          const remainingQty = itemQty - updateQty;
          
          const unitCost = (dbItem.cost || 0) / itemQty;
          const newOldItemCost = unitCost * remainingQty;
          const splitItemCost = unitCost * updateQty;
          
          // 1. Update original item with reduced quantity
          batch.update(itemRef, { 
            quantity: remainingQty, 
            cost: newOldItemCost 
          });
          
          // 2. Create new item split with new status
          const newItemRef = doc(collection(db, 'invoice_items'));
          const { id: _ignoreId, ...itemDataWithoutId } = dbItem;
          
          batch.set(newItemRef, {
            ...itemDataWithoutId,
            quantity: updateQty,
            cost: splitItemCost,
            status: actionInfo.newStatus,
            technician: engineerName.trim(), // Tracking the engineer
            createdAt: serverTimestamp()
          });
        }
        
        updatesLog.push({
          itemId: dbItem.id!,
          deviceType: dbItem.deviceType,
          oldStatus: dbItem.status,
          newStatus: actionInfo.newStatus,
          quantity: updateQty
        });
      }

      // Add maintenance action record
      const actionRef = doc(collection(db, 'maintenance_actions'));
      batch.set(actionRef, {
        engineerName: engineerName.trim(),
        actionDate: actionRecordDate,
        updates: updatesLog,
        userId: user?.id || 'unknown',
        userName: user?.name || 'System',
        createdAt: serverTimestamp()
      });
      
      const sanitizedEngName = engineerName.trim().replace(/[\/]/g, '_');
      const engineerRef = doc(db, 'engineers', sanitizedEngName);
      batch.set(engineerRef, { name: engineerName.trim(), updatedAt: serverTimestamp() }, { merge: true });

      await batch.commit();

      // Ensure the component renders the saved state briefly before taking pdf if needed
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
              const canvas = await htmlToImage.toCanvas(element, {
                pixelRatio: 2,
                backgroundColor: '#ffffff',
              });

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
              
              const firstActionItem = availableItems.find(i => i.id === actionItems[0]?.itemId);
              const custName = firstActionItem?.customerName || 'عام';
              const formattedDate = new Date().toISOString().split('T')[0];
              const filename = `تقرير الصيانة_${custName}_${formattedDate}.pdf`;
              pdf.save(filename);

              let message = `*تقرير إجراء صيانة* 📄\n\n`;
              message += `إلى من يهمه الأمر، مرفق لكم تقرير تحديث حالة الأجهزة:\n\n`;
              message += `*الأجهزة المحدثة:*\n`;
              updatesLog.forEach((item, index) => {
                const dbItem = availableItems.find(i => i.id === item.itemId);
                const invNum = dbItem?.invoiceNumber || '-';
                message += `\n_${index + 1}. *${item.deviceType}* (فاتورة: ${invNum})_\n`;
                message += `   • الحالة الجديدة: ${t('inventory.status_' + item.newStatus)}\n`;
              });

              // Assuming we don't have a single specific customer phone to prefill, or we just want to open WA share intent
              let sharedNatively = false;
              try {
                const pdfBlob = pdf.output('blob');
                sharedNatively = await sharePdfFile(pdfBlob, filename, message, 'report');
              } catch (err) {
                console.warn('Native sharing failed:', err);
              }
              if (!sharedNatively) {
                // Open general whatsapp share without specific number
                openWhatsApp(message);
              }
            } catch (err) {
              console.error('Failed to generate or share PDF', err);
            }
          }
        }
      }

      onClose();
    } catch (error: any) {
      alert(error.message);
      handleFirestoreError(error, OperationType.WRITE, 'maintenance_actions');
    } finally {
      setLoading(false);
    }
  };

  const isPreviewDisabled = loading || 
                         !engineerName.trim() || 
                         actionItems.length === 0 || 
                         actionItems.some(i => !i.itemId || !i.newStatus || i.quantity <= 0);

  if (showPreview) {
    const firstActionItem = availableItems.find(i => i.id === actionItems[0]?.itemId);
    const mockInvoice = {
      invoiceNumber: firstActionItem?.invoiceNumber || '---',
      customerName: firstActionItem?.customerName || '---',
      customerPhone: (firstActionItem as any)?.customerPhone || '---',
      createdAt: new Date(),
    };

    return (
      <PrintPreviewOverlay
        type="invoice"
        data={{
          invoice: mockInvoice,
          items: actionItems.map((item) => {
            const dbItem = availableItems.find(i => i.id === item.itemId);
            return {
              ...dbItem,
              deviceType: dbItem?.deviceType || '-',
              deviceName: dbItem?.deviceName || '-',
              customerProblem: dbItem?.customerProblem || '-',
              technicalNotes: item.reason || dbItem?.engineerReport || '-',
              status: item.newStatus || '30',
              quantity: item.quantity
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
                  <span>التاريخ:</span>
                  <span className="font-mono text-gray-900">{new Date(actionDate).toISOString().slice(0,10).replace(/-/g, '/')}</span>
                </div>
                <div className="text-xs font-bold text-gray-700 flex justify-between gap-4">
                  <span>الوقت:</span>
                  <span className="font-mono text-gray-900">{new Date(actionDate).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-center border-2 border-black mb-2">
              <thead className="bg-gray-100 text-black border-b-2 border-black">
                <tr>
                  <th className="py-2 px-3 border border-black text-sm font-black w-12 text-center">م</th>
                  <th className="py-2 px-3 border border-black text-sm font-black text-right">الجهاز</th>
                  <th className="py-2 px-3 border border-black text-sm font-black text-right w-1/4">رقم الفاتورة / العميل</th>
                  <th className="py-2 px-3 border border-black text-sm font-black text-right w-1/4">الحالة الجديدة</th>
                  <th className="py-2 px-3 border border-black text-sm font-black w-16 text-center">الكمية</th>
                </tr>
              </thead>
              <tbody className="text-black font-bold">
                {actionItems.map((item, index) => {
                  const dbItem = availableItems.find(i => i.id === item.itemId);
                  return (
                    <tr key={index} className="border-b border-black">
                      <td className="py-3 px-3 border-l border-black text-xs">{index + 1}</td>
                      <td className="py-3 px-3 border-l border-black text-right text-sm font-black whitespace-nowrap">
                        {dbItem?.deviceType || '-'} - {dbItem?.deviceName || ''}
                      </td>
                      <td className="py-3 px-3 border-l border-black text-right">
                        <div className="font-mono text-sm">#{dbItem?.invoiceNumber || '-'}</div>
                        <div className="text-gray-700 text-xs mt-1">{dbItem?.customerName || '-'}</div>
                      </td>
                      <td className={`py-3 px-3 border-l border-black text-sm text-right font-black whitespace-nowrap ${
                        (item.newStatus === '50' || item.newStatus === 'repaired') ? 'text-emerald-600' :
                        (item.newStatus === '55' || item.newStatus === 'failed' || item.newStatus === 'unrepairable') ? 'text-rose-600' :
                        'text-orange-600'
                      }`}>
                        {t('inventory.status_' + item.newStatus)}
                      </td>
                      <td className="py-3 px-3 text-sm font-bold text-center">{item.quantity}</td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-200/60 font-bold border-t-2 border-black">
                  <td colSpan={4} className="px-3 py-4 text-left font-black border-l border-black text-base">الإجمالي</td>
                  <td className="px-3 py-4 text-center font-mono font-black text-lg">
                    {actionItems.reduce((sum, item) => sum + Number(item.quantity || 1), 0)}
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
                  value: actionItems.filter(i => i.newStatus === '50' || i.newStatus === 'repaired').reduce((sum, i) => sum + Number(i.quantity || 1), 0),
                  textColor: 'text-emerald-600',
                },
                {
                  key: 'unrepairable',
                  label: 'لايصلح',
                  value: actionItems.filter(i => i.newStatus === '55' || i.newStatus === 'failed' || i.newStatus === 'unrepairable').reduce((sum, i) => sum + Number(i.quantity || 1), 0),
                  textColor: 'text-rose-600',
                },
                {
                  key: 'refused',
                  label: 'لم يوافق العميل',
                  value: actionItems.filter(i => i.newStatus === '70' || i.newStatus === 'refused').reduce((sum, i) => sum + Number(i.quantity || 1), 0),
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

              <div className="flex justify-between items-start text-xs font-bold text-gray-900 leading-loose">
                 <div className="text-right space-y-1">
                    <p>المسؤول المباشر / ....................... التوقيع / .......................</p>
                 </div>
                 <div className="text-left space-y-1">
                    <p>اسم المهندس المختص/.............. التوقيع /.............</p>
                 </div>
              </div>

              {(shopConfig?.address || shopConfig?.facebookUrl) && (
                <>
                  <div className="border-t-[3px] border-black mt-2 mb-2 border-solid"></div>
                  <div className="flex flex-row items-center justify-between text-[10px] font-bold text-black font-cairo pb-2">
                    {shopConfig?.address && (
                      <div className="flex items-center gap-1.5 justify-center flex-row-reverse text-center w-max">
                         <MapPin size={12} className="text-gray-600" />
                         <span className="text-gray-900">{shopConfig.address}</span>
                      </div>
                    )}
                    
                    {shopConfig?.facebookUrl && (
                      <div className="flex items-center gap-1.5 justify-center flex-row-reverse text-center w-max">
                        <Facebook size={12} className="text-blue-600" />
                        <span dir="ltr" className="text-gray-900">{shopConfig.facebookUrl}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        
        {/* Unified Header */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 bg-[#1a1a1a] rounded-t-2xl" dir="rtl">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all">
              <ArrowLeft size={18} className="rtl:rotate-180" />
            </button>
            <h2 className="text-lg font-bold text-white m-0 p-0 flex items-center gap-2">
              <Wrench className="text-orange-500" size={18} />
              {t('maintenance.title')}
            </h2>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">{t('maintenance.engineerName')}</label>
              <div className="relative">
                <UserIcon className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input 
                  type="text" 
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 focus:border-orange-500 outline-none transition-all text-sm"
                  placeholder="..."
                  list="engineers-list"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase font-black mb-1 block">{t('maintenance.dateTime')}</label>
              <div className="relative">
                <Calendar className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input 
                  type="datetime-local" 
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2 focus:border-orange-500 outline-none transition-all text-left rtl:text-right text-sm"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4 space-y-4">
             <h3 className="font-bold text-sm flex items-center gap-2">{t('maintenance.devicesToUpdate')}</h3>

             <div className="space-y-2">
               {actionItems.map((itemRow, index) => {
                 const selectedItem = availableItems.find(i => i.id === itemRow.itemId);
                 const currentStatusIndex = selectedItem ? getStatusIndex(selectedItem.status) : -1;
                 const availableNextStatuses = PIPELINE.slice(currentStatusIndex + 1);

                 return (
                  <div key={index} className="flex flex-col md:flex-row gap-3 p-3 bg-black/40 rounded-lg border border-white/5 relative group">
                     <div className="flex-1">
                        <label className="text-[10px] text-gray-500 uppercase font-black mb-0.5 block">{t('maintenance.selectDevice')}</label>
                        <select
                           value={itemRow.itemId}
                           onChange={(e) => updateActionItem(index, 'itemId', e.target.value)}
                           className="w-full bg-transparent border border-white/10 rounded-md px-2 py-1.5 outline-none focus:border-orange-500 text-xs"
                        >
                           <option value="">Select...</option>
                           {availableItems.map(i => (
                             <option key={i.id} value={i.id}>
                               {i.deviceType} - #{i.invoiceNumber || '---'}
                             </option>
                           ))}
                        </select>
                     </div>
                     <div className="w-full md:w-32">
                        <label className="text-[10px] text-gray-500 uppercase font-black mb-0.5 block">{t('maintenance.newStatus')}</label>
                        <select
                           value={itemRow.newStatus}
                           onChange={(e) => updateActionItem(index, 'newStatus', e.target.value)}
                           disabled={!selectedItem}
                           className="w-full bg-orange-500/10 text-orange-500 border border-orange-500/30 rounded-md px-2 py-1.5 outline-none focus:border-orange-500 disabled:opacity-50 text-[10px] font-black uppercase"
                        >
                           <option value="">Select...</option>
                           {availableNextStatuses.map(st => (
                             <option key={st} value={st}>{t(`inventory.status_${st}`)}</option>
                           ))}
                        </select>
                     </div>
                     <div className="w-full md:w-20">
                        <label className="text-[10px] text-gray-500 uppercase font-black mb-0.5 block">{t('inventory.quantity')}</label>
                        <input 
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            dir="ltr"
                            lang="en"
                            onFocus={e => e.target.select()}
                            value={itemRow.quantity === 0 ? '' : itemRow.quantity}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              const val = parseInt(raw) || 0;
                              const max = selectedItem ? (Number(selectedItem.quantity) || 1) : 1;
                              const sanitizedVal = Math.min(max, Math.max(1, val));
                              updateActionItem(index, 'quantity', sanitizedVal);
                            }}
                            disabled={!selectedItem}
                            className="w-full bg-transparent border border-white/10 rounded-md px-2 py-1.5 outline-none focus:border-orange-500 disabled:opacity-50 text-xs font-bold text-center font-mono"
                         />
                     </div>
                     <div className="flex items-end">
                       <button 
                          onClick={() => removeActionItem(index)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-md transition-colors disabled:opacity-0"
                          disabled={actionItems.length === 1}
                        >
                          <Trash2 size={14} />
                        </button>
                     </div>
                  </div>
                 );
               })}
             </div>

             <button 
               onClick={() => addActionItem()}
               className="w-full py-2 rounded-lg border border-dashed border-white/10 hover:border-orange-500 hover:text-orange-500 text-gray-500 font-bold text-xs flex items-center justify-center gap-2 transition-all"
             >
               <Plus size={14} /> {t('maintenance.addAnother')}
             </button>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 flex justify-end gap-3 bg-[#1a1a1a] rounded-b-2xl rtl:flex-row-reverse">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors"
          >
            {t('maintenance.cancel')}
          </button>
          <button 
            onClick={handlePreviewInit}
            disabled={isPreviewDisabled}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading ? t('common.loading') : <Save size={16} />}
            {loading ? '' : 'معاينة للتعديل والترحيل'}
          </button>
        </div>

      </div>
    </div>
  );
}
