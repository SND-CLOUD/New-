import re

with open('src/components/Customers.tsx', 'r') as f:
    content = f.read()

# Add handleDeleteCustomer function
block = """      setIsEditingMode(false);
    } catch (err) {
      console.error('Error updating customer:', err);
    } finally {
      setIsSavingInProcess(false);
    }
  };"""

replacement = """      setIsEditingMode(false);
    } catch (err) {
      console.error('Error updating customer:', err);
    } finally {
      setIsSavingInProcess(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer || !selectedCustomer.id) return;
    if (!window.confirm('هل أنت متأكد من حذف هذا العميل وجميع الفواتير والإيصالات المرتبطة به بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    
    setIsSavingInProcess(true);
    try {
      const { ProviderFactory } = await import('../data/ProviderFactory');
      const provider = ProviderFactory.getProvider();
      
      // Delete customer
      await provider.deleteDoc('customers', selectedCustomer.id);
      
      // Delete invoices
      const customerInvs = invoices.filter(inv => inv.customerId === selectedCustomer.id);
      for (const inv of customerInvs) {
        if (inv.id) await provider.deleteDoc('invoices', inv.id);
      }
      
      // Delete items
      const customerItems = items.filter(it => it.customerId === selectedCustomer.id);
      for (const it of customerItems) {
        if (it.id) await provider.deleteDoc('invoice_items', it.id);
      }
      
      // Delete transactions
      const customerTxs = transactions.filter(tx => tx.customerId === selectedCustomer.id);
      for (const tx of customerTxs) {
        if (tx.id) await provider.deleteDoc('vault_transactions', tx.id);
      }
      
      setSelectedCustomer(null);
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('حدث خطأ أثناء حذف العميل');
    } finally {
      setIsSavingInProcess(false);
    }
  };"""

content = content.replace(block, replacement)

# Add the UI buttons
block2 = """                  {!isEditingMode ? (
                    canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingMode(true);
                          setUpdatePastTransactions(true);"""

replacement2 = """                  {!isEditingMode ? (
                    canEdit && (
                      <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingMode(true);
                          setUpdatePastTransactions(true);"""

content = content.replace(block2, replacement2)

block3 = """                          setEditLiabilityCurrency(selectedCustomer.liabilityCurrency || 'USD');
                        }}
                        className="px-2.5 py-1 bg-orange-600/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/25 rounded-md text-[10px] font-bold font-cairo transition-all flex items-center gap-1.5"
                      >
                        <Edit2 size={10} />
                        <span>تحرير البيانات الأساسية</span>
                      </button>
                    )
                  ) : ("""

replacement3 = """                          setEditLiabilityCurrency(selectedCustomer.liabilityCurrency || 'USD');
                        }}
                        className="px-2.5 py-1 bg-orange-600/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/25 rounded-md text-[10px] font-bold font-cairo transition-all flex items-center gap-1.5"
                      >
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


# For the desktop view
block4 = """                    {!isEditingMode ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingMode(true);
                          setUpdatePastTransactions(true);"""

replacement4 = """                    {!isEditingMode ? (
                      canEdit && (
                      <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingMode(true);
                          setUpdatePastTransactions(true);"""

content = content.replace(block4, replacement4)

block5 = """                          setEditLiabilityCurrency(selectedCustomer.liabilityCurrency || 'USD');
                        }}
                        className="px-3.5 py-1 bg-white/5 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 rounded-md text-[10px] font-bold font-cairo border border-orange-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Edit2 size={12} />
                        تعديل بيانات العميل
                      </button>
                    )}"""

replacement5 = """                          setEditLiabilityCurrency(selectedCustomer.liabilityCurrency || 'USD');
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
                      )
                    )}"""

content = content.replace(block5, replacement5)

with open('src/components/Customers.tsx', 'w') as f:
    f.write(content)
