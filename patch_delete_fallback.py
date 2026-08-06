import re

with open('src/components/Customers.tsx', 'r') as f:
    content = f.read()

target = """      // Delete invoices
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
      const customerTxs = transactions.filter(tx => tx.customerId === selectedCustomer.id);"""

replacement = """      // Delete invoices
      const customerInvs = invoices.filter(inv => inv.customerId === selectedCustomer.id || (selectedCustomer.name && inv.customerName === selectedCustomer.name));
      for (const inv of customerInvs) {
        if (inv.id) await provider.deleteDoc('invoices', inv.id);
      }
      
      // Delete items
      const customerItems = items.filter(it => it.customerId === selectedCustomer.id || (selectedCustomer.name && it.customerName === selectedCustomer.name) || (selectedCustomer.name && it.customerName === selectedCustomer.name));
      for (const it of customerItems) {
        if (it.id) await provider.deleteDoc('invoice_items', it.id);
      }
      
      // Delete transactions
      const customerTxs = transactions.filter(tx => tx.customerId === selectedCustomer.id || (selectedCustomer.name && tx.customerName === selectedCustomer.name));"""

content = content.replace(target, replacement)

with open('src/components/Customers.tsx', 'w') as f:
    f.write(content)
