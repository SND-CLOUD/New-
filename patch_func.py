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
with open('src/components/Customers.tsx', 'w') as f:
    f.write(content)
