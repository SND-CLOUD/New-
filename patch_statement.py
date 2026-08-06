import re

with open('src/components/Customers.tsx', 'r') as f:
    content = f.read()

# Fix getStatementEntries
target1 = "const customerInvs = invoices.filter(inv => inv.customerId === customerId);"
replacement1 = """const customerName = customers.find(c => c.id === customerId)?.name || '';
    const customerInvs = invoices.filter(inv => inv.customerId === customerId || (customerName && inv.customerName === customerName));"""

content = content.replace(target1, replacement1)

# Fix getCustomerCurrencyLabel
target2 = "const customerInvs = invoices.filter(inv => inv.customerId === customerId);"
replacement2 = """const customerName = customers.find(c => c.id === customerId)?.name || '';
    const customerInvs = invoices.filter(inv => inv.customerId === customerId || (customerName && inv.customerName === customerName));"""

content = content.replace(target2, replacement2)

# Fix getCustomerTotalCost
target3 = "const customerInvs = invoices.filter(inv => inv.customerId === customerId);"
replacement3 = """const customerName = customers.find(c => c.id === customerId)?.name || '';
    const customerInvs = invoices.filter(inv => inv.customerId === customerId || (customerName && inv.customerName === customerName));"""

content = content.replace(target3, replacement3)

# Fix customerInvoices
target4 = "invoices.filter(inv => inv.customerId === selectedCustomer.id)"
replacement4 = "invoices.filter(inv => inv.customerId === selectedCustomer.id || (selectedCustomer.name && inv.customerName === selectedCustomer.name))"

content = content.replace(target4, replacement4)

# Fix getStatementEntries transactions
target5 = "const customerTxs = transactions.filter(tx => tx.customerId === customerId && tx.isReversed !== 1);"
replacement5 = """const customerTxs = transactions.filter(tx => 
      (tx.customerId === customerId || (customerName && tx.customerName === customerName)) 
      && tx.isReversed !== 1
    );"""

content = content.replace(target5, replacement5)

with open('src/components/Customers.tsx', 'w') as f:
    f.write(content)
