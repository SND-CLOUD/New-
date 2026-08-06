import re

with open('src/components/Customers.tsx', 'r') as f:
    content = f.read()

# Desktop button
block4 = """                    {!isEditingMode ? (
                      canEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingMode(true);"""

replacement4 = """                    {!isEditingMode ? (
                      canEdit && (
                        <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingMode(true);"""
content = content.replace(block4, replacement4)


block5 = """                          >
                            <Edit2 size={12} />
                            تعديل بيانات العميل
                          </button>
                      )
                    ) : ("""

replacement5 = """                          >
                            <Edit2 size={12} />
                            تعديل بيانات العميل
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteCustomer}
                            className="px-3.5 py-1 bg-red-600/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-md text-[10px] font-bold font-cairo transition-all flex items-center gap-1.5"
                          >
                            <X size={12} />
                            حذف العميل نهائياً
                          </button>
                          </div>
                      )
                    ) : ("""
content = content.replace(block5, replacement5)


# Mobile button
block2 = """                  {!isEditingMode ? (
                    canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingMode(true);"""

replacement2 = """                  {!isEditingMode ? (
                    canEdit && (
                      <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingMode(true);"""
content = content.replace(block2, replacement2)

block3 = """                      >
                        <Edit2 size={10} />
                        <span>تحرير البيانات الأساسية</span>
                      </button>
                    )
                  ) : ("""

replacement3 = """                      >
                        <Edit2 size={10} />
                        <span>تحرير البيانات الأساسية</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteCustomer}
                        className="px-2.5 py-1 bg-red-600/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-md text-[10px] font-bold font-cairo transition-all flex items-center gap-1.5"
                      >
                        <X size={10} />
                        <span>حذف العميل نهائياً</span>
                      </button>
                      </div>
                    )
                  ) : ("""

content = content.replace(block3, replacement3)


with open('src/components/Customers.tsx', 'w') as f:
    f.write(content)
