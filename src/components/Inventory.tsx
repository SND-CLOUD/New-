import { useBackHandler } from '../hooks/useBackHandler';
import { useState, useEffect } from 'react';
import { 
  Search, 
  Wrench, 
  CheckCircle2, 
  Package, 
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  Clock,
  Plus,
  ShieldAlert
} from 'lucide-react';
import { collection, query, onSnapshot, where, orderBy, limit } from '../firebase';
import { db } from '../firebase';
import { InvoiceItem, User, isInShopMaintenanceDevice } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import MaintenanceActionForm from './MaintenanceActionForm';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../hooks/usePermissions';

const STATUS_CONFIG = {
  // New unified status codes
  '10': { label: 'New Entry', color: 'bg-blue-500/10 text-blue-500', icon: <Clock size={14} /> },
  '20': { label: 'Under Inspection', color: 'bg-amber-500/10 text-amber-500', icon: <Search size={14} /> },
  '30': { label: 'Awaiting Customer/Parts', color: 'bg-cyan-500/10 text-cyan-500', icon: <Clock size={14} /> },
  '40': { label: 'Under Repair', color: 'bg-indigo-500/10 text-indigo-500', icon: <Wrench size={14} /> },
  '50': { label: 'Ready', color: 'bg-emerald-500/10 text-emerald-500', icon: <CheckCircle2 size={14} /> },
  '60': { label: 'Delivered', color: 'bg-gray-500/10 text-gray-400', icon: <Package size={14} /> },
  '70': { label: 'Cancelled', color: 'bg-rose-500/10 text-rose-500', icon: <AlertTriangle size={14} /> },
  // Legacy status mapping (for backwards compatibility)
  new: { label: 'New', color: 'bg-blue-500/10 text-blue-500', icon: <Clock size={14} /> },
  inspected: { label: 'Inspected', color: 'bg-amber-500/10 text-amber-500', icon: <Search size={14} /> },
  testing: { label: 'In Testing', color: 'bg-amber-500/10 text-amber-500', icon: <Search size={14} /> },
  repairing: { label: 'Repairing', color: 'bg-indigo-500/10 text-indigo-500', icon: <Wrench size={14} /> },
  ready: { label: 'Ready', color: 'bg-emerald-500/10 text-emerald-500', icon: <CheckCircle2 size={14} /> },
  intact: { label: 'Intact', color: 'bg-emerald-500/10 text-emerald-500', icon: <CheckCircle2 size={14} /> },
  unrepairable: { label: 'Unrepairable', color: 'bg-red-500/10 text-red-500', icon: <AlertTriangle size={14} /> },
  refused: { label: 'Refused', color: 'bg-red-400/10 text-red-400', icon: <AlertTriangle size={14} /> },
  delivered: { label: 'Delivered', color: 'bg-gray-500/10 text-gray-400', icon: <Package size={14} /> },
};

export default function Inventory({ user, onBack }: { user: User, onBack?: () => void }) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions(user);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  const canAdd = hasPermission('inventory', 'add');
  const canEdit = hasPermission('inventory', 'edit');
  const canView = hasPermission('inventory', 'view');

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500 gap-4" dir="rtl">
        <ShieldAlert size={48} className="text-orange-500/50" />
        <h2 className="text-xl font-bold font-cairo">ليس لديك صلاحية لعرض هذا القسم</h2>
        <p className="text-sm">يرجى التواصل مع مسؤول النظام للمزيد من المعلومات</p>
      </div>
    );
  }

  // Modal state
  const [isActionFormOpen, setIsActionFormOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  useBackHandler(isActionFormOpen, () => {
    setIsActionFormOpen(false);
    setSelectedItemId(null);
  });


  // Pagination controls
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Fetch items and filter locally
    const q = query(collection(db, 'invoice_items'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InvoiceItem)));
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const activeItems = items.filter(item => isInShopMaintenanceDevice(item));

  const filteredItems = activeItems.filter(item => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (item.deviceType?.toLowerCase() || '').includes(term) || 
      (item.invoiceNumber || '').includes(term) ||
      (item.createdBy?.toLowerCase() || '').includes(term) ||
      (item.technician?.toLowerCase() || '').includes(term)
    );
  }).sort((a, b) => Number(b.invoiceNumber || 0) - Number(a.invoiceNumber || 0));

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentItems = filteredItems.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  return (
    <div className="space-y-4 pb-24 md:pb-6 text-right pt-4" dir="rtl">

      {isActionFormOpen && (
        <MaintenanceActionForm 
          user={user}
          onClose={() => setIsActionFormOpen(false)} 
          availableItems={activeItems}
          preSelectedItemId={selectedItemId}
        />
      )}

      <div className="bg-[#1a1a1a] border-y border-white/5 mx-0 my-0 relative">
        <div className="flex items-center gap-3 py-3">
          <div className="flex-1 space-y-1 relative">
            <label className="text-[10px] font-bold text-gray-500 block">البحث برقم الفاتورة أو نوع الجهاز أو المهندس:</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="ابدأ بكتابة نوع الجهاز رقم الفاتورة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-4 pr-11 py-3 focus:border-orange-500 outline-none transition-all text-sm font-bold text-white text-right"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            </div>
          </div>

          <div className="relative mt-5">
            {canAdd && (
              <button 
                onClick={() => { setSelectedItemId(null); setIsActionFormOpen(true); }}
                className="p-3 bg-orange-600/10 hover:bg-orange-600 border border-orange-600/20 text-orange-500 hover:text-white rounded-xl transition-all shadow-lg hover:shadow-orange-600/20"
                title={t('common.newAction', 'إجراء جديد')}
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border-y border-white/5 mx-0 shadow-2xl">
        <div className="w-full overflow-hidden">
          <table className="w-full text-right border-collapse select-none">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-gray-400 text-[9px] sm:text-[10px]">
                <th className="px-2 py-2 font-bold whitespace-nowrap">{t('inventory.deviceType')}</th>
                <th className="px-2 py-2 font-bold whitespace-nowrap text-center">{t('inventory.invoiceNumber')}</th>
                <th className="px-2 py-2 font-bold hidden sm:table-cell">{t('inventory.manager')}</th>
                <th className="px-2 py-2 font-bold whitespace-nowrap">{t('inventory.engineer')}</th>
                <th className="px-2 py-2 font-bold text-center whitespace-nowrap">{t('inventory.quantity')}</th>
                <th className="px-2 py-2 font-bold text-center whitespace-nowrap">{t('inventory.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 text-[10px] sm:text-xs">
              <AnimatePresence>
                {currentItems.map((item) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={item.id} 
                    onClick={() => { 
                      if (canEdit) {
                        setSelectedItemId(item.id || null); 
                        setIsActionFormOpen(true); 
                      }
                    }}
                    className={`hover:bg-white/[0.03] transition-colors ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <td className="px-2 py-2">
                      <span className="font-bold text-[10px] sm:text-xs text-white truncate block">{item.deviceType || 'مجهول'}</span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="font-mono text-gray-500 font-bold text-[9px] sm:text-[10px]">{item.invoiceNumber || '---'}</span>
                    </td>
                    <td className="px-2 py-2 hidden sm:table-cell text-gray-400 truncate">
                      {item.createdBy || '---'}
                    </td>
                    <td className="px-2 py-2">
                      <span className="text-orange-400 font-bold truncate block">{item.technician || '---'}</span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="font-mono text-white font-bold">{item.quantity || 1}</span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex justify-center">
                        <StatusBadge status={item.status} />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && !loading && (
          <div className="px-6 py-20 text-center text-gray-500">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle size={40} className="text-gray-600" />
              <p>{t('inventory.noDevices')}</p>
            </div>
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-3 border-t border-white/5 bg-black/20">
            <span className="text-xs text-gray-500 font-bold font-cairo">
              عرض {((safeCurrentPage - 1) * itemsPerPage) + 1} إلى {Math.min(safeCurrentPage * itemsPerPage, filteredItems.length)} من أصل {filteredItems.length} جهاز
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
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.new;
  const { t } = useTranslation();
  
  const textColor = config.color.split(' ').find(c => c.startsWith('text-')) || 'text-gray-400';

  return (
    <span className={`text-[10px] sm:text-xs font-bold ${textColor}`}>
      {t(`inventory.status_${status}`)}
    </span>
  );
}
