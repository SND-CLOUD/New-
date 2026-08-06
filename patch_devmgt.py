with open('src/components/DeviceManagement.tsx', 'r') as f:
    content = f.read()

target = """      const batch = writeBatch(db);
      
      // Update invoice
      const invoiceRef = doc(db, 'invoices', inv.id!);
      batch.update(invoiceRef, {
        status: targetStatus,
        updatedAt: serverTimestamp()
      });

      // Update all items of this invoice
      const invItems = items.filter(it => it.invoiceNumber === inv.invoiceNumber);
      invItems.forEach(it => {
        const itemRef = doc(db, 'invoice_items', it.id!);
        batch.update(itemRef, {
          status: targetStatus,
          subStatus: finalSubStatus,
          updatedAt: serverTimestamp(),
          updatedBy: user?.name || user?.username || 'مدير النظام'
        });
      });

      await batch.commit();"""

replacement = """      // Use ProviderFactory for offline capability
      const { ProviderFactory } = await import('../data/ProviderFactory');
      const provider = ProviderFactory.getProvider();
      
      // Update invoice
      await provider.updateDoc('invoices', inv.id!, {
        status: targetStatus,
        updatedAt: new Date().toISOString()
      });

      // Update all items of this invoice
      const invItems = items.filter(it => it.invoiceNumber === inv.invoiceNumber);
      for (const it of invItems) {
        await provider.updateDoc('invoice_items', it.id!, {
          status: targetStatus,
          subStatus: finalSubStatus,
          updatedAt: new Date().toISOString(),
          updatedBy: user?.name || user?.username || 'مدير النظام'
        });
      }"""

content = content.replace(target, replacement)

with open('src/components/DeviceManagement.tsx', 'w') as f:
    f.write(content)
