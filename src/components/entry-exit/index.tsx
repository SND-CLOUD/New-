import React, { useState, useEffect } from 'react';
import { FilePlus, FileOutput, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { User, InvoiceItem } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import DeviceEntry from './DeviceEntry';
import DeviceExit from './DeviceExit';
import { motion } from 'motion/react';
import { collection, query, onSnapshot } from '../../firebase';
import { db } from '../../firebase';
import { CircleDollarSign } from 'lucide-react'; // For the fallback icon
import { parseDate } from '../../lib/dateUtils';

interface EntryExitProps {
  user: User;
  onBack: () => void;
  view: 'hub' | 'entry' | 'exit';
  setView: (v: 'hub' | 'entry' | 'exit') => void;
}

export default function EntryExit({ user, onBack, view, setView }: EntryExitProps) {
  const { t, i18n } = useTranslation();
  const { hasPermission, canAdd, canEdit } = usePermissions(user, 'inventory');

  if (!hasPermission('view')) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
          <CircleDollarSign size={32} />
        </div>
        <h2 className="text-xl font-bold text-white">عذراً، ليس لديك صلاحية الوصول</h2>
        <p className="text-gray-400 max-w-md">يرجى التواصل مع المسؤول للحصول على الصلاحيات اللازمة للوصول لهذا القسم.</p>
        <button 
          onClick={onBack} 
          className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5"
          title="العودة للرئيسية"
        >
          <ArrowRight size={20} />
        </button>
      </div>
    );
  }
  const [todayEntryCount, setTodayEntryCount] = useState(0);
  const [todayExitCount, setTodayExitCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'invoice_items'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let enteredToday = 0;
      let exitedToday = 0;
      const todayStr = new Date().toDateString();

      snapshot.forEach(doc => {
        const item = doc.data() as InvoiceItem;
        
        // 1. Check entry (createdAt)
        const entryDate = parseDate(item.createdAt);
        if (entryDate && entryDate.toDateString() === todayStr) {
          enteredToday += (Number(item.quantity) || 1);
        }

        // 2. Check exit (status = '60' or 'delivered')
        if (item.status === '60' || item.status === 'delivered') {
          const exitDate = parseDate(item.deliveredAt) || parseDate(item.updatedAt) || parseDate((item as any).output_datetime);
          if (exitDate && exitDate.toDateString() === todayStr) {
            exitedToday += (Number(item.quantity) || 1);
          }
        }
      });

      setTodayEntryCount(enteredToday);
      setTodayExitCount(exitedToday);
    });

    return () => unsubscribe();
  }, []);

  const categories = [
    { 
      id: 'entry', 
      title: t('entryExit.deviceEntry', 'Device Entry'), 
      desc: 'Add new devices to the shop.',
      icon: FilePlus, 
      color: 'text-blue-600', 
      bg: 'bg-blue-500/10',
      allowed: canAdd
    },
    { 
      id: 'exit', 
      title: t('entryExit.deviceExit', 'Device Exit'), 
      desc: 'Deliver ready devices to customers.',
      icon: FileOutput, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-500/10',
      allowed: canEdit
    }
  ].filter(c => c.allowed);

  if (view === 'entry') {
    return <DeviceEntry user={user} onBack={() => setView('hub')} />;
  }
  
  if (view === 'exit') {
    return <DeviceExit user={user} onBack={() => setView('hub')} />;
  }

  return (
    <div className="space-y-4 pb-12 text-right animate-fadeIn" dir="rtl">
      {/* Top Card: Today Statistics (Full Width, No Margins) */}
      <div className="w-full bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 shadow-lg relative overflow-hidden flex flex-col items-center text-center">
        {/* Faint Background Icon */}
        <div className="absolute opacity-10 -left-6 -top-6">
          <ArrowLeft size={120} className="rtl:rotate-180" />
        </div>
        
        <h2 className="text-sm font-black font-cairo text-orange-50 mb-4 z-10">إحصائية حركة الأجهزة لليوم</h2>
        
        <div className="grid grid-cols-2 gap-4 w-full divide-x divide-white/20 divide-x-reverse z-10">
          {/* Entered Today */}
          <div className="flex flex-col items-center justify-center p-2">
            <div className="flex items-center gap-2 mb-1">
              <FilePlus size={18} className="text-orange-100" />
              <span className="text-xs font-bold text-orange-100 font-cairo">الأجهزة الداخلة</span>
            </div>
            <span className="text-3xl font-black tracking-widest text-white shadow-sm drop-shadow-md">{todayEntryCount}</span>
          </div>
          
          {/* Exited Today */}
          <div className="flex flex-col items-center justify-center p-2">
            <div className="flex items-center gap-2 mb-1">
              <FileOutput size={18} className="text-orange-100" />
              <span className="text-xs font-bold text-orange-100 font-cairo">الأجهزة الخارجة</span>
            </div>
            <span className="text-3xl font-black tracking-widest text-white shadow-sm drop-shadow-md">{todayExitCount}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Action Grid - White background, aspect-square, premium styling */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-6 justify-center">
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView(cat.id as any)}
              className="flex flex-col items-center justify-center gap-4 p-6 bg-white hover:bg-gray-50 rounded-[2rem] border border-gray-100 transition-all text-center group shadow-md hover:shadow-xl aspect-square w-full"
            >
              <div className={`p-4 ${cat.bg} ${cat.color} rounded-2xl group-hover:scale-110 transition-transform`}>
                <cat.icon size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-xs md:text-sm text-gray-900 font-cairo leading-tight">{cat.title}</h3>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
