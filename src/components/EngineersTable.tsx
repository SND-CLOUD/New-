import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc, serverTimestamp } from '../firebase';
import { Trash2, UserPlus, Search, User, X, Edit2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function EngineersTable() {
  const [engineers, setEngineers] = useState<{ id: string; name: string; updatedAt?: any }[]>([]);
  const [newName, setNewName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'engineers'), (snapshot) => {
      setEngineers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });
    return () => unsubscribe();
  }, []);

  const addEngineer = async () => {
    if (!newName.trim()) return;
    const id = newName.trim().replace(/\//g, '_');
    await setDoc(doc(db, 'engineers', id), {
      name: newName.trim(),
      updatedAt: serverTimestamp()
    });
    setNewName('');
    setShowAddModal(false);
  };

  const updateEngineer = async () => {
    if (!editingEngineer || !editName.trim()) return;
    
    const newId = editName.trim().replace(/\//g, '_');
    
    // If the name/id changed, we delete the old one and create a new one to keep id consistency
    if (newId !== editingEngineer.id) {
      await deleteDoc(doc(db, 'engineers', editingEngineer.id));
    }
    
    await setDoc(doc(db, 'engineers', newId), {
      name: editName.trim(),
      updatedAt: serverTimestamp()
    });
    
    setEditingEngineer(null);
    setEditName('');
  };

  const deleteEngineer = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المهندس؟')) {
      await deleteDoc(doc(db, 'engineers', id));
    }
  };

  const filtered = engineers.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4 rtl:text-right font-cairo">
      {/* Header with trigger button */}
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
        <div>
          <h3 className="text-sm font-black text-white">إدارة المهندسين والفنيين</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">إضافة وتعيين مهندسي وفنيي الصيانة المسؤولين عن الأجهزة.</p>
        </div>
        <button
          onClick={() => {
            setNewName('');
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-lg"
        >
          <UserPlus size={16} />
          إضافة مهندس جديد
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 outline-none text-xs text-white"
          placeholder="بحث في المهندسين..."
        />
      </div>

      <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
              <th className="px-6 py-4 text-right">الاسم</th>
              <th className="px-6 py-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((eng) => (
              <tr key={eng.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                      <User size={14} />
                    </div>
                    <span className="font-bold text-white text-xs sm:text-sm">{eng.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingEngineer(eng);
                      setEditName(eng.name);
                    }}
                    className="p-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg transition-all cursor-pointer"
                    title="تعديل"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => deleteEngineer(eng.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                  لا يوجد مهندسين مسجلين حالياً
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Engineer Modal Dialog */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-right font-cairo"
              dir="rtl"
            >
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewName('');
                }}
                className="absolute left-4 top-4 p-1.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
                <UserPlus className="text-orange-500" size={18} />
                إدخال اسم المهندس الجديد
              </h3>
              <p className="text-xs text-gray-400 mb-6">سيتم إضافة هذا المهندس وتعيينه في مهام صيانة الأجهزة.</p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 block mr-1">اسم المهندس / الفني</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEngineer()}
                    className="w-full bg-[#242424] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-sm text-white"
                    placeholder="مثال: المهندس أحمد، فني الصيانة سعيد"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewName('');
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={addEngineer}
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-orange-900/20"
                  >
                    موافق وحفظ
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Engineer Modal Dialog */}
        {editingEngineer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative text-right font-cairo"
              dir="rtl"
            >
              <button
                onClick={() => {
                  setEditingEngineer(null);
                  setEditName('');
                }}
                className="absolute left-4 top-4 p-1.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
                <Edit2 className="text-blue-500" size={18} />
                تعديل اسم المهندس
              </h3>
              <p className="text-xs text-gray-400 mb-6">قم بتعديل اسم المهندس أو الفني المختار.</p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 block mr-1">اسم المهندس / الفني</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && updateEngineer()}
                    className="w-full bg-[#242424] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm text-white"
                    placeholder="مثال: المهندس أحمد، فني الصيانة سعيد"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEngineer(null);
                      setEditName('');
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={updateEngineer}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-900/20"
                  >
                    حفظ التعديلات
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
