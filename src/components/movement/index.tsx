import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Wrench, ClipboardCheck, ArrowLeft, Clock, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { User, InvoiceItem } from '../../types';
import Inspection from './Inspection';
import Maintenance from './Maintenance';
import ApprovalAndParts from './ApprovalAndParts';
import { motion } from 'motion/react';
import { collection, query, onSnapshot } from '../../firebase';
import { db } from '../../firebase';

export default function DeviceMovement({ 
  user, 
  onBack, 
  view, 
  setView 
}: { 
  user: User; 
  onBack: () => void; 
  view: 'hub' | 'inspection' | 'maintenance' | 'approval'; 
  setView: (v: 'hub' | 'inspection' | 'maintenance' | 'approval') => void; 
}) {
  const { t, i18n } = useTranslation();
  
  const [inspectionCount, setInspectionCount] = useState(0);
  const [approvalCount, setApprovalCount] = useState(0);
  const [maintenanceCount, setMaintenanceCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'invoice_items'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let insCount = 0;
      let appCount = 0;
      let maintCount = 0;

      snapshot.forEach(doc => {
        const item = doc.data() as InvoiceItem;
        const status = item.status;
        const qty = Number(item.quantity) || 1;

        // 1. Inspection: '10', 'new', '20', '21', '22', '25', 'testing', 'inspected'
        if (['10', 'new', '20', '21', '22', '25', 'testing', 'inspected'].includes(status)) {
          insCount += qty;
        }
        // 2. Approval & Parts: '30', 'awaiting_approval', '35', 'awaiting_parts'
        else if (status === '30' || status === 'awaiting_approval' || status === '35' || status === 'awaiting_parts') {
          appCount += qty;
        }
        // 3. Maintenance: '40', 'repairing'
        else if (status === '40' || status === 'repairing') {
          maintCount += qty;
        }
      });

      setInspectionCount(insCount);
      setApprovalCount(appCount);
      setMaintenanceCount(maintCount);
    });

    return () => unsubscribe();
  }, []);

  const categories = [
    { 
      id: 'inspection', 
      title: t('movement.inspection', 'Inspection Action'), 
      arabicTitle: 'إجراء الفحص الفني والتشخيص',
      desc: 'عرض وفحص الأجهزة الواردة وتحديد المشاكل والأعطال بدقة وتسجيل التقرير الفني.',
      count: inspectionCount,
      icon: ClipboardCheck, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10' 
    },
    { 
      id: 'approval', 
      title: 'انتظار الموافقة والقطع', 
      arabicTitle: 'إدارة انتظار الموافقة وقطع الغيار',
      desc: 'متابعة قرارات العميل وتحديث حالة قطع الغيار المطلوبة وتأكيدها لبدء العمل.',
      count: approvalCount,
      icon: Clock, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10' 
    },
    { 
      id: 'maintenance', 
      title: t('movement.maintenance', 'Maintenance Action'), 
      arabicTitle: 'تنفيذ وإصلاح الأجهزة والصيانة',
      desc: 'تنفيذ عمليات الإصلاح الفعلي للأجهزة المعتمدة وفقاً للتقارير المعتمدة وإنجازها.',
      count: maintenanceCount,
      icon: Wrench, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/10' 
    }
  ];

  if (view === 'inspection') {
    return <Inspection user={user} onBack={() => setView('hub')} />;
  }
  
  if (view === 'approval') {
    return <ApprovalAndParts user={user} onBack={() => setView('hub')} />;
  }

  if (view === 'maintenance') {
    return <Maintenance user={user} onBack={() => setView('hub')} />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 text-right animate-fadeIn px-0 sm:px-4" dir="rtl">
      <div className="space-y-6 pt-4">
        {/* Top Card: Maintenance Statistics - Full screen width on mobile, rounded on desktop */}
        <div className="w-full bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-800 text-white p-6 sm:p-8 rounded-none sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
          {/* Faint Background Icon */}
          <div className="absolute opacity-10 -left-6 -top-6 select-none pointer-events-none">
            <SettingsIcon size={140} />
          </div>
          
          <h2 className="text-sm font-black font-cairo text-blue-100 mb-6 z-10 tracking-wide select-none">إحصائية حركة الصيانة النشطة بالمحل</h2>
          
          <div className="grid grid-cols-3 gap-1 sm:gap-4 w-full divide-x divide-white/10 divide-x-reverse z-10">
            {/* Under Inspection */}
            <button onClick={() => setView('inspection')} className="flex flex-col items-center justify-center p-1 sm:p-3 transition-all hover:bg-white/5 rounded-2xl cursor-pointer">
              <div className="flex flex-col items-center gap-1.5 mb-2 justify-center">
                <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                  <ClipboardCheck size={20} className="text-blue-200" />
                </div>
                <span className="text-[10px] sm:text-xs md:text-sm font-black text-blue-100 font-cairo whitespace-nowrap">في الفحص</span>
              </div>
              <span className="text-2xl sm:text-3xl md:text-4xl font-black font-mono text-white tracking-widest">{inspectionCount}</span>
            </button>
            
            {/* Awaiting Approval */}
            <button onClick={() => setView('approval')} className="flex flex-col items-center justify-center p-1 sm:p-3 transition-all hover:bg-white/5 rounded-2xl cursor-pointer">
              <div className="flex flex-col items-center gap-1.5 mb-2 justify-center">
                <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                  <Clock size={20} className="text-blue-200" />
                </div>
                <span className="text-[10px] sm:text-xs md:text-sm font-black text-blue-100 font-cairo whitespace-nowrap">انتظار الموافقة والقطع</span>
              </div>
              <span className="text-2xl sm:text-3xl md:text-4xl font-black font-mono text-white tracking-widest">{approvalCount}</span>
            </button>

            {/* In Repair */}
            <button onClick={() => setView('maintenance')} className="flex flex-col items-center justify-center p-1 sm:p-3 transition-all hover:bg-white/5 rounded-2xl cursor-pointer">
              <div className="flex flex-col items-center gap-1.5 mb-2 justify-center">
                <div className="p-2 bg-white/5 rounded-xl border border-white/5">
                  <Wrench size={20} className="text-blue-200" />
                </div>
                <span className="text-[10px] sm:text-xs md:text-sm font-black text-blue-100 font-cairo whitespace-nowrap">الصيانة والتشغيل</span>
              </div>
              <span className="text-2xl sm:text-3xl md:text-4xl font-black font-mono text-white tracking-widest">{maintenanceCount}</span>
            </button>
          </div>
        </div>

        {/* Action List - Horizontal, modern, independent layout */}
        <div className="flex flex-col gap-4 w-full px-4 sm:px-0">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setView(cat.id as any)}
              className="w-full flex items-center justify-between p-4 sm:p-5 bg-[#1a1a1a] hover:bg-[#222222] rounded-3xl border border-white/5 hover:border-white/10 transition-all text-right group shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-4">
                {/* Icon Wrapper */}
                <div className={`p-4 ${cat.bg} ${cat.color} rounded-2xl group-hover:scale-105 transition-transform shrink-0`}>
                  <cat.icon size={26} />
                </div>
                
                {/* Info Text */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-sm sm:text-base text-white font-cairo leading-snug">{cat.arabicTitle}</h3>
                    <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/5 hidden xs:inline-block">
                      {cat.title}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-cairo leading-relaxed max-w-md hidden md:block">
                    {cat.desc}
                  </p>
                </div>
              </div>

              {/* Counts & Navigation indicators */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex flex-col items-end gap-0.5">
                  <span className={`text-base font-black font-mono px-3 py-1 rounded-xl ${cat.bg} ${cat.color} shadow-inner`}>
                    {cat.count}
                  </span>
                  <span className="text-[9px] font-bold text-gray-500 font-cairo">بند نشط</span>
                </div>
                <ChevronLeft size={20} className="text-gray-500 group-hover:text-white transition-all transform group-hover:-translate-x-1 duration-150 shrink-0" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
