import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, deleteDoc, setDoc, serverTimestamp } from '../firebase';
import { Trash2, Plus, Search, Tag, Edit, Smartphone, LayoutGrid, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

export default function CategoriesTable() {
  const [activeTab, setActiveTab] = useState<'categories' | 'models'>('categories');
  
  // Categories State
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [catNameInput, setCatNameInput] = useState('');
  const [catSearchTerm, setCatSearchTerm] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);

  // Models State
  const [models, setModels] = useState<{ id: string; name: string; categoryId: string; categoryName: string }[]>([]);
  const [selectedCatIdForModel, setSelectedCatIdForModel] = useState<string>('');
  const [modelNameInput, setModelNameInput] = useState('');
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [showModelModal, setShowModelModal] = useState(false);

  useEffect(() => {
    const unsubCat = onSnapshot(collection(db, 'device_categories'), (snapshot) => {
      const cats = snapshot.docs.map(d => ({ id: d.id, name: d.data().name } as any));
      setCategories(cats);
      if (cats.length > 0 && !selectedCatIdForModel) {
        setSelectedCatIdForModel(cats[0].id);
      }
    });

    const unsubMod = onSnapshot(collection(db, 'device_models'), (snapshot) => {
      setModels(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    });

    return () => {
      unsubCat();
      unsubMod();
    };
  }, []);

  // --- Category Handlers ---
  const handleSaveCategory = async () => {
    if (!catNameInput.trim()) return;
    const newId = catNameInput.trim().replace(/\//g, '_');
    
    if (editingCatId) {
      if (editingCatId !== newId) {
        // Delete old and create new to reflect the ID change
        await deleteDoc(doc(db, 'device_categories', editingCatId));
      }
      await setDoc(doc(db, 'device_categories', newId), {
        name: catNameInput.trim(),
        createdAt: serverTimestamp()
      });
      setEditingCatId(null);
    } else {
      await setDoc(doc(db, 'device_categories', newId), {
        name: catNameInput.trim(),
        createdAt: serverTimestamp()
      });
    }
    setCatNameInput('');
    setShowCatModal(false);
  };

  const deleteCategory = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا النوع؟ جميع الأجهزة المرتبطة به قد تتأثر.')) {
      await deleteDoc(doc(db, 'device_categories', id));
      if (selectedCatIdForModel === id) {
        setSelectedCatIdForModel('');
      }
    }
  };

  const editCategory = (cat: {id: string, name: string}) => {
    setEditingCatId(cat.id);
    setCatNameInput(cat.name);
    setShowCatModal(true);
  };

  // --- Model Handlers ---
  const handleSaveModel = async () => {
    if (!modelNameInput.trim() || !selectedCatIdForModel) return;
    
    const cat = categories.find(c => c.id === selectedCatIdForModel);
    if (!cat) return;

    const newModelId = `${selectedCatIdForModel}_${modelNameInput.trim().replace(/\//g, '_')}`;

    if (editingModelId) {
      if (editingModelId !== newModelId) {
        await deleteDoc(doc(db, 'device_models', editingModelId));
      }
      await setDoc(doc(db, 'device_models', newModelId), {
        name: modelNameInput.trim(),
        categoryId: selectedCatIdForModel,
        categoryName: cat.name,
        createdAt: serverTimestamp()
      });
      setEditingModelId(null);
    } else {
      await setDoc(doc(db, 'device_models', newModelId), {
        name: modelNameInput.trim(),
        categoryId: selectedCatIdForModel,
        categoryName: cat.name,
        createdAt: serverTimestamp()
      });
    }
    setModelNameInput('');
    setShowModelModal(false);
  };

  const deleteModel = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الجهاز؟')) {
      await deleteDoc(doc(db, 'device_models', id));
    }
  };

  const editModel = (model: {id: string, name: string, categoryId: string}) => {
    setEditingModelId(model.id);
    setModelNameInput(model.name);
    setSelectedCatIdForModel(model.categoryId);
    setShowModelModal(true);
  };


  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(catSearchTerm.toLowerCase()));
  const filteredModels = models.filter(m => m.categoryId === selectedCatIdForModel);

  return (
    <div className="space-y-6 rtl:text-right">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/5 pb-2">
        <button 
          onClick={() => { setActiveTab('categories'); }}
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'categories' ? 'border-b-2 border-orange-500 text-orange-500 bg-white/5' : 'text-gray-400 hover:text-white'}`}
        >
          <LayoutGrid size={16} />
          إدارة أنواع الأجهزة
        </button>
        <button 
          onClick={() => { setActiveTab('models'); }}
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'models' ? 'border-b-2 border-orange-500 text-orange-500 bg-white/5' : 'text-gray-400 hover:text-white'}`}
        >
          <Smartphone size={16} />
          إدارة الأجهزة
        </button>
      </div>

      {activeTab === 'categories' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 font-cairo">
            <div>
              <h3 className="text-sm font-black text-white">تصنيفات وأنواع الأجهزة</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">إضافة وتعديل أنواع الأجهزة العامة (مثال: هواتف، تابلت)</p>
            </div>
            <button
              onClick={() => {
                setEditingCatId(null);
                setCatNameInput('');
                setShowCatModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-lg"
            >
              <Plus size={16} />
              إضافة نوع جديد
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              value={catSearchTerm}
              onChange={(e) => setCatSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 outline-none text-xs text-white"
              placeholder="بحث في أنواع الأجهزة..."
            />
          </div>

          <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                  <th className="px-6 py-4 text-right leading-loose">نوع الجهاز</th>
                  <th className="px-6 py-4 text-center leading-loose">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                          <Tag size={14} />
                        </div>
                        <span className="font-bold whitespace-nowrap">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button 
                        onClick={() => editCategory(cat)}
                        className="p-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg transition-all"
                        title="تعديل"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => deleteCategory(cat.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                      لا توجد أنواع مسجلة حالياً
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'models' && (
        <div className="space-y-4 animate-in fade-in duration-200 font-cairo">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
            <div>
              <h3 className="text-sm font-black text-white">إدارة وموديلات الأجهزة</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">يرجى تحديد نوع الأجهزة الرئيسي أولاً، ثم إضافة الجهاز/الموديل.</p>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <select 
                value={selectedCatIdForModel}
                onChange={(e) => setSelectedCatIdForModel(e.target.value)}
                className="bg-[#242424] border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white cursor-pointer outline-none focus:border-orange-500 text-right"
              >
                <option value="" disabled> -- فلترة وتحديد النوع -- </option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  setEditingModelId(null);
                  setModelNameInput('');
                  setShowModelModal(true);
                }}
                disabled={!selectedCatIdForModel}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-lg"
              >
                <Plus size={16} />
                إضافة جهاز جديد
              </button>
            </div>
          </div>

          <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 text-gray-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                  <th className="px-6 py-4 text-right leading-loose">اسم الجهاز / الموديل</th>
                  <th className="px-6 py-4 text-center leading-loose">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {!selectedCatIdForModel ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-gray-500">
                      يرجى اختيار النوع لعرض الأجهزة المرتبطة به.
                    </td>
                  </tr>
                ) : filteredModels.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-orange-500/80">
                      لا توجد أجهزة مضافة تحت هذا النوع حتى الآن.
                    </td>
                  </tr>
                ) : (
                  filteredModels.map((model) => (
                    <tr key={model.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                            <Smartphone size={14} />
                          </div>
                          <span className="font-bold whitespace-nowrap">{model.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button 
                          onClick={() => editModel(model)}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-all"
                          title="تعديل"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => deleteModel(model.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Modal Dialog */}
      <AnimatePresence>
        {showCatModal && (
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
                  setShowCatModal(false);
                  setEditingCatId(null);
                  setCatNameInput('');
                }}
                className="absolute left-4 top-4 p-1.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
                <Tag className="text-orange-500" size={18} />
                {editingCatId ? 'تعديل اسم نوع الأجهزة' : 'إدخال اسم نوع الأجهزة الجديد'}
              </h3>
              <p className="text-xs text-gray-400 mb-6">سيتم حفظ هذا القسم لتصنيف الأجهزة تحته في النظام.</p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 block mr-1">اسم نوع الأجهزة</label>
                  <input 
                    type="text" 
                    value={catNameInput}
                    onChange={(e) => setCatNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
                    className="w-full bg-[#242424] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-sm text-white"
                    placeholder="مثال: هواتف ذكية، شاشات، لابتوب"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCatModal(false);
                      setEditingCatId(null);
                      setCatNameInput('');
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCategory}
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-orange-900/20"
                  >
                    {editingCatId ? 'موافق وتعديل' : 'موافق وحفظ'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Model Modal Dialog */}
      <AnimatePresence>
        {showModelModal && (
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
                  setShowModelModal(false);
                  setEditingModelId(null);
                  setModelNameInput('');
                }}
                className="absolute left-4 top-4 p-1.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
                <Smartphone className="text-blue-500" size={18} />
                {editingModelId ? 'تعديل اسم الجهاز' : 'إدخل اسم الجهاز / الموديل الجديد'}
              </h3>
              <p className="text-xs text-gray-400 mb-6">سيتم حفظ الجهاز تحت التصنيف الرئيسي المختار.</p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 block mr-1">نوع الجهاز / التصنيف الرئيسي</label>
                  <select 
                    value={selectedCatIdForModel}
                    onChange={(e) => setSelectedCatIdForModel(e.target.value)}
                    className="w-full bg-[#242424] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-sm font-bold text-white cursor-pointer text-right"
                  >
                    <option value="" disabled> -- اختر النوع الرئيسي -- </option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 block mr-1">اسم الجهاز / الموديل</label>
                  <input 
                    type="text" 
                    value={modelNameInput}
                    onChange={(e) => setModelNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveModel()}
                    disabled={!selectedCatIdForModel}
                    className="w-full bg-[#242424] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-orange-500 text-sm text-white disabled:opacity-50"
                    placeholder="مثال: iPhone 13 Pro Max, Galaxy S22"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModelModal(false);
                      setEditingModelId(null);
                      setModelNameInput('');
                    }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveModel}
                    disabled={!selectedCatIdForModel || !modelNameInput.trim()}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg shadow-blue-900/20"
                  >
                    {editingModelId ? 'موافق وتعديل' : 'موافق وحفظ'}
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

