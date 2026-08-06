import re

with open('src/components/Customers.tsx', 'r') as f:
    content = f.read()

block = """                  {!isEditingMode ? (
                    canEdit && (
                      <button"""

replacement = """                  {!isEditingMode ? (
                    canEdit && (
                      <div className="flex gap-2">
                      <button"""

content = content.replace(block, replacement)

block2 = """                          setEditLiabilityCurrency(selectedCustomer.liabilityCurrency || 'USD');
                        }}
                        className="px-3.5 py-1 bg-white/5 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 rounded-md text-[10px] font-bold font-cairo border border-orange-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Edit2 size={12} />
                        تعديل بيانات العميل
                      </button>
                    )"""

replacement2 = """                          setEditLiabilityCurrency(selectedCustomer.liabilityCurrency || 'USD');
                        }}
                        className="px-3.5 py-1 bg-white/5 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 rounded-md text-[10px] font-bold font-cairo border border-orange-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Edit2 size={12} />
                        تعديل بيانات العميل
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteCustomer}
                        className="px-3.5 py-1 bg-white/5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-md text-[10px] font-bold font-cairo border border-red-500/20 transition-all flex items-center gap-1.5"
                      >
                        <X size={12} />
                        حذف العميل نهائياً
                      </button>
                      </div>
                    )"""

content = content.replace(block2, replacement2)

with open('src/components/Customers.tsx', 'w') as f:
    f.write(content)
