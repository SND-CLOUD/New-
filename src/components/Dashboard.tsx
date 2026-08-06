import React, { useEffect, useState } from 'react';
import { parseTxDate } from '../lib/dateUtils';
import { 
  FilePlus, 
  Package, 
  CheckCircle, 
  BarChart3, 
  Users, 
  Settings as SettingsIcon, 
  Database, 
  Search,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  CircleDollarSign,
  X,
  Calendar,
  User as UserIcon,
  Tag,
  Cpu,
  MoreVertical,
  Smartphone,
  Layers,
  Wrench,
  Bell
} from 'lucide-react';
import { collection, query, where, getDocs, onSnapshot, orderBy } from '../firebase';
import { db } from '../firebase';
import { VaultTransaction, InvoiceItem, isInShopMaintenanceDevice, isShopMaintenanceItem } from '../types';
import { useTranslation } from 'react-i18next';

export default function Dashboard({ 
  onNavigate, 
  shopName, 
  fiscalYear,
  activeAlertsCount = 0,
  onShowAlerts = () => {}
}: { 
  onNavigate: (tab: any) => void, 
  shopName?: string, 
  fiscalYear?: string,
  activeAlertsCount?: number,
  onShowAlerts?: () => void
}) {
  const { t } = useTranslation();
  const [vaultTotals, setVaultTotals] = useState<Record<string, number>>({
    RY: 0,
    SAR: 0,
    USD: 0
  });
  const [activeDevicesCount, setActiveDevicesCount] = useState(0);
  const [totalDevicesCount, setTotalDevicesCount] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<VaultTransaction[]>([]);
  
  // New Modals State
  const [showInventoryReportsModal, setShowInventoryReportsModal] = useState(false);
  const [showOtherServicesModal, setShowOtherServicesModal] = useState(false);

  useEffect(() => {
    // Listen to all vault transactions
    const qVault = query(collection(db, 'vault_transactions'));
    const unsubscribeVault = onSnapshot(qVault, (s) => {
      const totals: Record<string, number> = { RY: 0, SAR: 0, USD: 0 };
      const txs = s.docs.map(d => ({ id: d.id, ...d.data() } as VaultTransaction));
      
      txs.forEach(tx => {
        if (totals[tx.currency] !== undefined) {
          totals[tx.currency] += Number(tx.amount);
        }
      });
      
      setVaultTotals(totals);
      setTransactions(txs.sort((a, b) => {
        const timeA = parseTxDate(a)?.getTime() || 0;
        const timeB = parseTxDate(b)?.getTime() || 0;
        return timeB - timeA;
      }));
    });

    // Listen to active & total devices (In-shop hardware maintenance only)
    const qDevices = query(collection(db, 'invoice_items'));
    const unsubscribeDevices = onSnapshot(qDevices, (snapshot) => {
      let activeCount = 0;
      let totalCount = 0;
      snapshot.forEach(doc => {
        const data = doc.data() as InvoiceItem;
        const qty = Number(data.quantity) || 1;
        if (isShopMaintenanceItem(data)) {
          totalCount += qty;
        }
        if (isInShopMaintenanceDevice(data)) {
          activeCount += qty;
        }
      });
      setActiveDevicesCount(activeCount);
      setTotalDevicesCount(totalCount);
    });

    return () => {
      unsubscribeVault();
      unsubscribeDevices();
    };
  }, []);

  return (
    <div className="space-y-4 pb-10">
      {/* Top Main Active Devices Counter Card */}
      <button 
        onClick={() => onNavigate('reports')}
        className="w-full bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col items-center text-center hover:scale-[1.01] transition-transform cursor-pointer"
      >
        <div className="absolute opacity-10 -left-6 -top-6 pointer-events-none">
          <SettingsIcon size={140} />
        </div>
        <h2 className="text-base md:text-lg font-bold font-cairo text-orange-50 mb-2 z-10">{shopName || 'عالم الصيانة والتجارة'}</h2>
        <div className="flex items-center justify-center gap-3 my-1 z-10">
          <span className="text-5xl md:text-6xl font-black tracking-widest text-white drop-shadow-md">{activeDevicesCount}</span>
          <Smartphone size={36} className="text-orange-100" />
        </div>
        <p className="text-sm md:text-base font-bold mt-2 z-10 text-orange-50">الأجهزة النشطة في المحل</p>
      </button>

      {/* Quick Search */}
      <div className="w-full pt-1">
        <button 
          onClick={() => onNavigate('search')}
          className="w-full bg-white dark:bg-[#1a1a1a] py-3.5 px-5 rounded-2xl border border-gray-200 dark:border-white/5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-all group shadow-sm text-gray-500 dark:text-gray-400"
        >
          <div className="flex items-center gap-3 flex-1 text-right"> 
            <span className="text-sm font-bold font-cairo">البحث السريع</span>
          </div>
          <Search size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Action Grid - 3x2 layout */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-4xl mx-auto pt-2">
        <ActionCard 
          onClick={() => onNavigate('entry-exit')}
          icon={<FilePlus size={24} className="md:w-7 md:h-7" />} 
          label="دخول وخروج" 
          color="bg-orange-600 hover:bg-orange-700"
        />
        <ActionCard 
          onClick={() => onNavigate('device-movement')}
          icon={<SettingsIcon size={24} className="md:w-7 md:h-7" />} 
          label="قسم الصيانة" 
          color="bg-blue-600 hover:bg-blue-700"
        />
        <ActionCard 
          onClick={() => onNavigate('customers')}
          icon={<Users size={24} className="md:w-7 md:h-7" />} 
          label="العملاء" 
          color="bg-amber-500 hover:bg-amber-600"
        />
        <ActionCard 
          onClick={() => onNavigate('vault')}
          icon={<CircleDollarSign size={24} className="md:w-7 md:h-7" />} 
          label="الحسابات" 
          color="bg-emerald-600 hover:bg-emerald-700"
        />
        <ActionCard 
          onClick={() => setShowInventoryReportsModal(true)}
          icon={<Layers size={24} className="md:w-7 md:h-7" />} 
          label="المخزون والتقارير" 
          color="bg-purple-600 hover:bg-purple-700"
        />
        <ActionCard 
          onClick={() => setShowOtherServicesModal(true)}
          icon={<Wrench size={24} className="md:w-7 md:h-7" />} 
          label="خدمات أخرى" 
          color="bg-indigo-600 hover:bg-indigo-700"
        />
      </div>

      {/* Modals */}
      
      {/* Inventory & Reports Modal */}
      {showInventoryReportsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowInventoryReportsModal(false)}
              className="absolute top-4 left-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-black text-white mb-6 font-cairo text-center">المخزون والتقارير</h2>
            
            <div className="space-y-4">
              <button 
                onClick={() => {
                  setShowInventoryReportsModal(false);
                  onNavigate('inventory');
                }}
                className="w-full flex items-center justify-between bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl transition-colors shadow-lg"
              >
                <span className="font-bold font-cairo text-lg">المخزون</span>
                <Package size={24} />
              </button>
              <button 
                onClick={() => {
                  setShowInventoryReportsModal(false);
                  onNavigate('reports');
                }}
                className="w-full flex items-center justify-between bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl transition-colors shadow-lg"
              >
                <span className="font-bold font-cairo text-lg">التقارير</span>
                <BarChart3 size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Other Services Modal */}
      {showOtherServicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowOtherServicesModal(false)}
              className="absolute top-4 left-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-black text-white mb-2 font-cairo text-center">خدمات أخرى</h2>
            <p className="text-gray-400 text-sm text-center mb-6">قيود محاسبية وخدمات إضافية</p>
            
            <div className="space-y-3">
              <button 
                onClick={() => {
                  localStorage.setItem('otherServicesTab', 'software_services');
                  onNavigate('other-services');
                }}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 text-white p-4 rounded-xl transition-colors"
              >
                <span className="font-bold font-cairo">خدمات برمجية</span>
                <Cpu size={20} className="text-cyan-400" />
              </button>
              <button 
                onClick={() => {
                  localStorage.setItem('otherServicesTab', 'external_maintenance');
                  onNavigate('other-services');
                }}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 text-white p-4 rounded-xl transition-colors"
              >
                <span className="font-bold font-cairo">صيانة خارج المحل</span>
                <Wrench size={20} className="text-amber-400" />
              </button>
              <button 
                onClick={() => {
                  localStorage.setItem('otherServicesTab', 'spare_parts');
                  onNavigate('other-services');
                }}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 text-white p-4 rounded-xl transition-colors"
              >
                <span className="font-bold font-cairo">قطع وملحقات</span>
                <Tag size={20} className="text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function ActionCard({ icon, label, color, onClick }: { icon: React.ReactNode, label: string, color: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 group text-center border border-white/5 shadow-sm hover:shadow-md active:scale-95 aspect-square text-white ${color}`}
    >
      <div className="group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-xs md:text-sm leading-tight drop-shadow-sm">{label}</h3>
      </div>
    </button>
  );
}
