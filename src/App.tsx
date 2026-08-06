/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  FilePlus, 
  Package, 
  CheckCircle, 
  BarChart3, 
  Users, 
  Settings as SettingsIcon, 
  ClipboardCheck,
  Router,
  Bell,
  LogOut,
  Cpu,
  CircleDollarSign,
  Wrench,
  ShieldCheck,
  ArrowRightLeft,
  Clock,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  MessageCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, onSnapshot, writeBatch, deleteDoc, serverTimestamp } from './firebase';
import { db } from './firebase';
import { User, ShopConfig } from './types';
import { openWhatsApp, sendUniversalReminder } from './lib/shareHelper';
import { ProviderFactory } from './data/ProviderFactory';
import { localDb } from './lib/local-db';

// Components
import Dashboard from './components/Dashboard';
import EntryExit from './components/entry-exit';
import DeviceMovement from './components/movement';
import Inspection from './components/movement/Inspection';
import Maintenance from './components/movement/Maintenance';
import ApprovalAndParts from './components/movement/ApprovalAndParts';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Customers from './components/Customers';
import Settings from './components/Settings';
import SearchInvoice from './components/SearchInvoice';
import DeviceManagement from './components/DeviceManagement';
import OtherServiceInvoice from './components/OtherServiceInvoice';
import Login from './components/Login';
import SetupWizard from './components/SetupWizard';

import Vault from './components/Vault';
import SecurityGuard from './components/SecurityGuard';

import { useTranslation } from 'react-i18next';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { App as CapacitorApp } from '@capacitor/app';

import { useSmartInputs } from './hooks/useSmartInputs';

export default function App() {
  useSmartInputs();
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [shopConfig, setShopConfig] = useState<ShopConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entry-exit' | 'device-movement' | 'inspection' | 'maintenance' | 'inventory' | 'reports' | 'customers' | 'settings' | 'search' | 'vault' | 'device-management' | 'approval' | 'other-services'>('dashboard');
  const [movementView, setMovementView] = useState<'hub' | 'inspection' | 'maintenance' | 'approval'>('hub');
  const [entryExitView, setEntryExitView] = useState<'hub' | 'entry' | 'exit'>('hub');

  // Alerts and Notifications State
  const [invoicesList, setInvoicesList] = useState<any[]>([]);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [showAllAlertsModal, setShowAllAlertsModal] = useState(false);
  const [alertsTab, setAlertsTab] = useState<'outstanding' | 'warranty'>('outstanding');
  
  // Settle Outstanding Payment state
  const [settleInvoice, setSettleInvoice] = useState<any | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [isSettling, setIsSettling] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const handleManualSync = async () => {
    if (isSyncingAll) return;
    setIsSyncingAll(true);
    try {
      const { SyncEngine } = await import('./data/SyncEngine');
      const result = await SyncEngine.syncAll(true);

      // Refresh local shop config after sync
      try {
        const shopSnap = await getDoc(doc(db, 'company_details', 'main_details'));
        if (shopSnap.exists()) {
          const cData = shopSnap.data() as ShopConfig;
          setShopConfig(prev => ({ ...prev, ...cData }));
        } else {
          const localDetails = await localDb.query("SELECT * FROM company_details WHERE id = 'main_details' OR (shopName != '' AND shopName != 'اسم المؤسسة / المركز') ORDER BY CASE WHEN id = 'main_details' THEN 0 ELSE 1 END LIMIT 1");
          if (localDetails.values && localDetails.values.length > 0) {
            const det = localDetails.values[0];
            if ((det.name || det.shopName) && det.id !== 'default-company') {
              setShopConfig(det as ShopConfig);
            }
          }
        }
      } catch (confErr) {
        console.warn("Error refreshing shop config after sync:", confErr);
      }

      window.dispatchEvent(new CustomEvent('snd_data_synced'));
      if (result && result.message) {
        alert(result.message);
      }
    } catch (e: any) {
      console.error("Manual sync failed:", e);
      alert("حدث خطأ أثناء المزامنة: " + (e?.message || e));
    } finally {
      setIsSyncingAll(false);
    }
  };

  const stateRefs = useRef({
    activeTab,
    movementView,
    entryExitView,
    showAllAlertsModal,
    showSetup,
    user,
    settleInvoice
  });

  useEffect(() => {
    stateRefs.current = {
      activeTab,
      movementView,
      entryExitView,
      showAllAlertsModal,
      showSetup,
      user,
      settleInvoice
    };
  }, [activeTab, movementView, entryExitView, showAllAlertsModal, showSetup, user, settleInvoice]);

  useEffect(() => {
    const handleBackButton = async ({ canGoBack }: { canGoBack: boolean }) => {
      const state = stateRefs.current;

      const handlers = (window as any).backHandlers || [];
      if (handlers.length > 0) {
        const topHandler = handlers[handlers.length - 1];
        if (topHandler()) return;
      }
      
      if (!state.user || state.showSetup) {
        if (confirm("هل تريد الخروج من البرنامج؟")) {
          sessionStorage.removeItem('snd_user');
          CapacitorApp.exitApp();
        }
        return;
      }

      if (state.settleInvoice) {
        setSettleInvoice(null);
        return;
      }

      if (state.showAllAlertsModal) {
        setShowAllAlertsModal(false);
        return;
      }

      if (state.activeTab === 'device-movement' && state.movementView !== 'hub') {
        setMovementView('hub');
        return;
      }

      if (state.activeTab === 'entry-exit' && state.entryExitView !== 'hub') {
        setEntryExitView('hub');
        return;
      }

      if (state.activeTab === 'settings' && (window as any).isSettingsDeepView) {
        window.dispatchEvent(new Event('closeSettingsDeepView'));
        return;
      }
      
      if (state.activeTab !== 'dashboard') {
        setActiveTab('dashboard');
        return;
      }

      if (confirm("هل تريد الخروج من البرنامج؟")) {
        sessionStorage.removeItem('snd_user');
        CapacitorApp.exitApp();
      }
    };

    let listenerHandle: any = null;

    CapacitorApp.addListener('backButton', handleBackButton).then(handle => {
      listenerHandle = handle;
    });

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubInvoices = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      setInvoicesList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubItems = onSnapshot(collection(db, 'invoice_items'), (snapshot) => {
      setItemsList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubInvoices();
      unsubItems();
    };
  }, [user]);

  // Real-time synchronization of the currently logged-in user's status and permissions
  useEffect(() => {
    if (!user?.id) return;
    const unsubUser = onSnapshot(doc(db, 'users', user.id), (snapshot) => {
      if (snapshot.exists()) {
        const updatedUserData = snapshot.data() as User;
        const isActiveVal = updatedUserData.isActive as any;
        if (isActiveVal === false || isActiveVal === 0 || isActiveVal === 'false') {
          alert("تم تعطيل هذا الحساب من قبل المسؤول. سيتم تسجيل الخروج الآن.");
          setUser(null);
          sessionStorage.removeItem('snd_user');
          return;
        }
        // Sync any updates (permissions, password, name) back to the session state
        setUser({ ...updatedUserData, id: snapshot.id });
        sessionStorage.setItem('snd_user', JSON.stringify({ ...updatedUserData, id: snapshot.id }));
      }
    }, (error) => {
      console.warn("Failed to listen to user document:", error);
    });
    return () => unsubUser();
  }, [user?.id]);

  useEffect(() => {
    const generatedAlerts: any[] = [];
    const now = Date.now();
    const warrantyDurationMs = 14 * 24 * 60 * 60 * 1000; // 14 days standard warranty

    // 1. Outstanding Invoices Check (Delivered but unpaid/partially paid)
    invoicesList.forEach(inv => {
      const total = Number(inv.totalCost || 0);
      const paid = Number(inv.amountPaid || 0);
      const disc = Number(inv.discount || 0);
      const remaining = total - disc - paid;

      if (remaining > 0.05) {
        generatedAlerts.push({
          id: `outstanding-${inv.id}`,
          type: 'outstanding',
          title: 'فاتورة مستحقة الدفع',
          message: `الفاتورة #${inv.invoiceNumber} للعميل (${inv.customerName}) متبقي عليها مبلغ ${remaining.toLocaleString('en-US')} ${inv.currency || 'USD'}`,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          customerPhone: inv.customerPhone,
          remainingAmount: remaining,
          totalCost: total,
          amountPaid: paid,
          discount: disc,
          currency: inv.currency,
          severity: remaining > 100 ? 'high' : 'medium'
        });
      }
    });

    // 2. Warranty Check on delivered items
    itemsList.forEach(item => {
      if ((item.status === '60' || item.status === 'delivered') && item.deliveredAt) {
        const deliveredTime = Number(item.deliveredAt);
        const expiryTime = deliveredTime + warrantyDurationMs;
        const diffMs = expiryTime - now;
        const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

        const formattedDate = new Date(expiryTime).toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        if (diffDays >= 0 && diffDays <= 3) {
          generatedAlerts.push({
            id: `war-exp-soon-${item.id}`,
            type: 'warranty_soon',
            title: 'ضمان ينتهي قريباً',
            message: `الجهاز (${item.deviceType} - ${item.deviceName}) للفاتورة #${item.invoiceNumber || '-'} ينتهي ضمانه خلال ${diffDays === 0 ? 'اليوم' : diffDays === 1 ? 'يوم واحد' : diffDays === 2 ? 'يومين' : `${diffDays} أيام`} بتاريخ ${formattedDate}`,
            itemId: item.id,
            deviceName: item.deviceName,
            deviceType: item.deviceType,
            invoiceNumber: item.invoiceNumber,
            expiryDate: formattedDate,
            diffDays,
            severity: 'medium'
          });
        } else if (diffDays < 0 && diffDays >= -7) {
          const expiredDaysAgo = Math.abs(diffDays);
          generatedAlerts.push({
            id: `war-expired-${item.id}`,
            type: 'warranty_expired',
            title: 'انتهى ضمان الجهاز',
            message: `الجهاز (${item.deviceType} - ${item.deviceName}) للفاتورة #${item.invoiceNumber || '-'} انتهى ضمانه منذ ${expiredDaysAgo === 1 ? 'يوم واحد' : expiredDaysAgo === 2 ? 'يومين' : `${expiredDaysAgo} أيام`} بتاريخ ${formattedDate}`,
            itemId: item.id,
            deviceName: item.deviceName,
            deviceType: item.deviceType,
            invoiceNumber: item.invoiceNumber,
            expiryDate: formattedDate,
            diffDays: expiredDaysAgo,
            severity: 'low'
          });
        }
      }
    });

    setActiveAlerts(generatedAlerts);
  }, [invoicesList, itemsList]);

  const handleSettleSubmit = async () => {
    if (!settleInvoice || !settleAmount || isNaN(Number(settleAmount))) return;
    setIsSettling(true);
    try {
      const amount = Number(settleAmount);
      const batch = writeBatch(db);
      
      const invoiceRef = doc(db, 'invoices', settleInvoice.invoiceId);
      const updatedAmountPaid = Number(settleInvoice.amountPaid || 0) + amount;
      
      batch.update(invoiceRef, {
        amountPaid: updatedAmountPaid,
        updatedAt: serverTimestamp()
      });

      const txRef = doc(collection(db, 'vault_transactions'));
      batch.set(txRef, {
        currency: settleInvoice.currency || 'USD',
        amount: amount,
        customerName: settleInvoice.customerName || 'عميل نقدي',
        invoiceNumber: String(settleInvoice.invoiceNumber),
        userName: user?.name || user?.username || 'مدير النظام',
        userId: user?.id || 'admin',
        timestamp: new Date().getTime(),
        type: 'invoice_payment',
        notes: `تسوية جزئية/كلية من خلال نافذة التنبيهات للفاتورة ${settleInvoice.invoiceNumber}`
      });

      await batch.commit();
      setSettleInvoice(null);
      setSettleAmount('');
      alert('تم تسجيل عملية الدفع والخصم من المستحقات وتحديث الخزنة بنجاح!');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء عملية السداد والخصم.');
    } finally {
      setIsSettling(false);
    }
  };

  useEffect(() => {
    setMovementView('hub');
    setEntryExitView('hub');
  }, [activeTab]);

  useEffect(() => {
    document.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  useEffect(() => {
    const applyTheme = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('snd_settings') || '{}');
        const currentAppearance = settings.appearance !== undefined ? settings.appearance : 'normal';
        if (currentAppearance === 'normal') {
          document.documentElement.classList.add('light-app');
        } else {
          document.documentElement.classList.remove('light-app');
        }
      } catch (e) {
        console.error("Theme apply failed", e);
      }
    };
    applyTheme();
    window.addEventListener('snd_settings_changed', applyTheme);
    return () => window.removeEventListener('snd_settings_changed', applyTheme);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // Check for session in localStorage
        const savedUser = sessionStorage.getItem('snd_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
          checkAutoBackup();
        }

        // Fetch Shop Config with timeout/resilience
        // We'll try to get it, if it fails we just log it and proceed
        try {
          // Cleanup legacy 'shop' document from 'settings' collection
          try {
            await deleteDoc(doc(db, 'settings', 'shop'));
            await localDb.run("DELETE FROM settings WHERE id = 'shop'");
          } catch (cleanupErr) {
            console.warn("Could not cleanup legacy shop doc:", cleanupErr);
          }

          let loadedConfig: any = null;
          try {
            const localDetails = await localDb.query("SELECT * FROM company_details WHERE id = 'main_details' OR (shopName != '' AND shopName != 'اسم المؤسسة / المركز') ORDER BY CASE WHEN id = 'main_details' THEN 0 ELSE 1 END LIMIT 1");
            if (localDetails.values && localDetails.values.length > 0) {
              const det = localDetails.values[0];
              if ((det.name || det.shopName) && det.shopName !== 'اسم المؤسسة / المركز') {
                loadedConfig = det as ShopConfig;
                setShopConfig(loadedConfig);
              }
            }
          } catch (localErr) {}

          const shopSnap = await getDoc(doc(db, 'company_details', 'main_details'));
          if (shopSnap.exists()) {
            const cloudData = shopSnap.data() as ShopConfig;
            loadedConfig = { ...loadedConfig, ...cloudData };
            setShopConfig(loadedConfig);

            // Sync Cloud company details to local SQLite DB so offline and mode switches keep full details
            try {
              await localDb.run(
                `INSERT OR REPLACE INTO company_details (
                  id, shopName, name, countryCode, phone1, phone2, landline, 
                  phone1Call, phone1Whatsapp, phone2Call, phone2Whatsapp, 
                  landlineCall, landlineWhatsapp, facebookUrl, mapUrl, 
                  email, bio, logoUrl, logo, address, updatedAt,
                  bankYerName, bankYerAccount, bankSarName, bankSarAccount, bankUsdName, bankUsdAccount, bankHolderName, liabilityCurrency,
                  fiscalYear, startDate, receiptNotes, managerName, commercialRecord, taxNumber
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  'main_details',
                  (cloudData as any).shopName || (cloudData as any).name || '',
                  (cloudData as any).name || (cloudData as any).shopName || '',
                  (cloudData as any).countryCode || '+967',
                  (cloudData as any).phone1 || '',
                  (cloudData as any).phone2 || '',
                  (cloudData as any).landline || '',
                  (cloudData as any).phone1Call ? 1 : 0,
                  (cloudData as any).phone1Whatsapp ? 1 : 0,
                  (cloudData as any).phone2Call ? 1 : 0,
                  (cloudData as any).phone2Whatsapp ? 1 : 0,
                  (cloudData as any).landlineCall ? 1 : 0,
                  (cloudData as any).landlineWhatsapp ? 1 : 0,
                  (cloudData as any).facebookUrl || '',
                  (cloudData as any).mapUrl || '',
                  (cloudData as any).email || '',
                  (cloudData as any).bio || '',
                  (cloudData as any).logoUrl || (cloudData as any).logo || '',
                  (cloudData as any).logo || (cloudData as any).logoUrl || '',
                  (cloudData as any).address || '',
                  (cloudData as any).updatedAt || new Date().toISOString(),
                  (cloudData as any).bankYerName || '',
                  (cloudData as any).bankYerAccount || '',
                  (cloudData as any).bankSarName || '',
                  (cloudData as any).bankSarAccount || '',
                  (cloudData as any).bankUsdName || '',
                  (cloudData as any).bankUsdAccount || '',
                  (cloudData as any).bankHolderName || '',
                  (cloudData as any).liabilityCurrency || 'YER',
                  (cloudData as any).fiscalYear || '',
                  (cloudData as any).startDate || '',
                  (cloudData as any).receiptNotes || '',
                  (cloudData as any).managerName || '',
                  (cloudData as any).commercialRecord || '',
                  (cloudData as any).taxNumber || ''
                ]
              );
            } catch (sqErr) {
              console.warn("Could not sync cloud company details to SQLite:", sqErr);
            }
          } else if (!loadedConfig) {
            if (savedUser) setShowSetup(true);
          }
        } catch (shopErr) {
          console.warn("Failed to fetch shop config, might be offline:", shopErr);
        }

        // Ensure default admin exists - wrap in try to prevent blocking
        try {
          const adminDoc = await getDoc(doc(db, 'users', 'primary-admin'));
          if (!adminDoc.exists()) {
            await setDoc(doc(db, 'users', 'primary-admin'), {
              username: 'admin',
              password: 'admin',
              name: 'المدير العام',
              role: 'admin',
              isPrimary: true
            });
            console.log("Default admin created");
          }
        } catch (adminErr) {
          console.warn("Could not check/create admin, might be offline:", adminErr);
        }
      } catch (e) {
        console.error("Initialization error", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    sessionStorage.setItem('snd_user', JSON.stringify(loggedInUser));
    
    // Check if shop config exists in Cloud or SQLite before prompting for setup
    try {
      const shopSnap = await getDoc(doc(db, 'company_details', 'main_details'));
      if (shopSnap.exists()) {
        const cloudData = shopSnap.data() as ShopConfig;
        setShopConfig(cloudData);
        setShowSetup(false);
        return;
      }
    } catch (e) {}

    try {
      const localDetails = await localDb.query("SELECT * FROM company_details WHERE id = 'main_details' OR (shopName != '' AND shopName != 'اسم المؤسسة / المركز') ORDER BY CASE WHEN id = 'main_details' THEN 0 ELSE 1 END LIMIT 1");
      if (localDetails.values && localDetails.values.length > 0) {
        const det = localDetails.values[0];
        if ((det.name || det.shopName) && det.id !== 'default-company') {
          setShopConfig(det as ShopConfig);
          setShowSetup(false);
          return;
        }
      }
    } catch (e) {}

    setShowSetup(true);
  };

  const handleSignOut = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    if (user) {
      try {
        const devSnap = await getDocs(collection(db, 'user_devices'));
        const nowIso = new Date().toISOString();
        const uUsername = (user.username || '').toLowerCase().trim();
        const uName = (user.name || '').toLowerCase().trim();
        const uId = (user.id || '').toLowerCase().trim();

        for (const devDoc of devSnap.docs) {
          const d = { id: devDoc.id, ...devDoc.data() } as any;
          const dLinkedName = (d.linkedUserName || '').toLowerCase().trim();
          const dLinkedId = (d.linkedUserId || '').toLowerCase().trim();
          
          const isMatch = (
            (uUsername && dLinkedName === uUsername) ||
            (uName && dLinkedName === uName) ||
            (uId && dLinkedId === uId) ||
            (uUsername && dLinkedId === uUsername) ||
            (user.linked_device_id && (d.id === user.linked_device_id || d.serialImei === user.linked_device_id))
          );
          
          if (isMatch) {
            try {
              await updateDoc(doc(db, 'user_devices', devDoc.id), {
                lastLogout: nowIso,
                networkStatus: 'غير متصل'
              });
            } catch (err) {}
          }
        }
      } catch (e) {
        console.warn('Logout status update failed:', e);
      }
    }
    setUser(null);
    sessionStorage.removeItem('snd_user');
    sessionStorage.removeItem('alertsClosed');
    setShowSignOutModal(false);
  };

  const handleSetupComplete = (config: ShopConfig) => {
    setShopConfig(config);
    setShowSetup(false);
  };

  const checkAutoBackup = async () => {
    try {
      const settings = JSON.parse(localStorage.getItem('snd_settings') || '{}');
      if (!settings.autoBackup) return;

      const lastBackup = localStorage.getItem('last_auto_backup');
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      if (lastBackup !== todayStr) {
        // Check if current time matches or passed the backupTime
        const [targetH, targetM] = settings.backupTime.split(':').map(Number);
        if (now.getHours() > targetH || (now.getHours() === targetH && now.getMinutes() >= targetM)) {
          await runBackup(settings.backupPath);
          localStorage.setItem('last_auto_backup', todayStr);
        }
      }
    } catch (e) {
      console.error("Auto backup check failed", e);
    }
  };

  const runBackup = async (path: string) => {
    try {
      // Mock backup: Get all firestore data and save as JSON
      const collections = ['invoices', 'customers', 'inventory_items'];
      const backupData: any = {};
      
      for (const col of collections) {
        const snap = await getDocs(collection(db, col));
        backupData[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      await Filesystem.writeFile({
        path: `SND_App/Backups/backup_${new Date().getTime()}.json`,
        data: JSON.stringify(backupData),
        directory: Directory.Documents,
        recursive: true,
        encoding: Encoding.UTF8
      });
      console.log("Automatic backup completed successfully");
    } catch (e) {
      console.error("Backup execution failed", e);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#0f0f0f] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (showSetup) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} shopName={shopConfig?.shopName} fiscalYear={shopConfig?.fiscalYear} activeAlertsCount={activeAlerts.length} onShowAlerts={() => setShowAllAlertsModal(true)} />;
      case 'entry-exit':
        return <EntryExit onBack={() => setActiveTab('dashboard')} user={user} view={entryExitView} setView={setEntryExitView} />;
      case 'device-movement':
        return <DeviceMovement onBack={() => setActiveTab('dashboard')} user={user} view={movementView} setView={setMovementView} />;
      case 'approval':
        return <ApprovalAndParts user={user} onBack={() => setActiveTab('dashboard')} />;
      case 'inspection':
        return <Inspection user={user} onBack={() => setActiveTab('dashboard')} />;
      case 'maintenance':
        return <Maintenance user={user} onBack={() => setActiveTab('dashboard')} />;
      case 'inventory':
        return <Inventory user={user} onBack={() => setActiveTab('dashboard')} />;
      case 'reports':
        return <Reports user={user} onBack={() => setActiveTab('dashboard')} />;
      case 'vault':
        return <Vault user={user} shopConfig={shopConfig} onBack={() => setActiveTab('dashboard')} />;
      case 'customers':
        return <Customers user={user} shopConfig={shopConfig} onBack={() => setActiveTab('dashboard')} />;
      case 'settings':
        return <Settings user={user} shopConfig={shopConfig} onShopConfigUpdate={setShopConfig} onSignOut={() => setShowSignOutModal(true)} />;
      case 'search':
        return <SearchInvoice onBack={() => setActiveTab('dashboard')} user={user} />;
      case 'device-management':
        return <DeviceManagement user={user} onBack={() => setActiveTab('dashboard')} shopConfig={shopConfig} />;
      case 'other-services':
        const storedTab = localStorage.getItem('otherServicesTab');
        let type: 'software' | 'maintenance' | 'parts' = 'software';
        if (storedTab === 'external_maintenance') type = 'maintenance';
        if (storedTab === 'spare_parts') type = 'parts';
        return <OtherServiceInvoice type={type} user={user} shopConfig={shopConfig} onBack={() => setActiveTab('dashboard')} />;
      default:
        return <Dashboard onNavigate={setActiveTab} shopName={shopConfig?.shopName} fiscalYear={shopConfig?.fiscalYear} activeAlertsCount={activeAlerts.length} onShowAlerts={() => setShowAllAlertsModal(true)} />;
    }
  };

  return (
    <SecurityGuard>
      <div className={`min-h-screen bg-[#0a0a0a] text-gray-100 font-sans selection:bg-orange-500/30 ${i18n.language === 'ar' ? 'font-arabic' : ''}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex h-screen overflow-hidden">
          {/* ... desktop navigation and main content handled below ... */}
          <aside className="w-20 lg:w-72 bg-[#0f0f0f] border-r border-white/5 flex-col hidden md:flex sticky top-0 h-screen transition-all z-50">
          <div className="p-6 flex items-center lg:justify-start justify-center gap-3">
            {shopConfig?.logoUrl ? (
              <img src={shopConfig.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-contain shadow-lg shadow-black/50" />
            ) : (
              <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
                <Router className="text-white w-6 h-6" />
              </div>
            )}
            <span className="font-black text-xl tracking-tighter text-white hidden lg:block truncate">{shopConfig?.shopName || 'SND SYSTEM'}</span>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-2 overflow-hidden">
            <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={22} />} label={t('common.dashboard')} />
            <NavItem active={activeTab === 'entry-exit'} onClick={() => setActiveTab('entry-exit')} icon={<FilePlus size={22} />} label={t('common.entryExit')} />
            <NavItem active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} icon={<CircleDollarSign size={22} />} label={t('common.vault')} />
            <NavItem active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} icon={<Users size={22} />} label={t('common.customers')} />
            <NavItem active={activeTab === 'device-movement'} onClick={() => setActiveTab('device-movement')} icon={<SettingsIcon size={22} />} label={t('common.deviceMovement')} />
            <NavItem active={activeTab === 'inspection'} onClick={() => setActiveTab('inspection')} icon={<ClipboardCheck size={22} />} label="فحص" />
            <NavItem active={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')} icon={<Wrench size={22} />} label="صيانة" />
          </nav>

          <div className="p-4 border-t border-white/5 space-y-2">
            <button 
              onClick={handleSignOut} 
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all border border-red-500/20 group font-bold"
              title={t('common.signOut')}
            >
              <LogOut size={22} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </aside>

        {/* Main View Area */}
        <main className="flex-1 flex flex-col relative bg-[#0a0a0a] overflow-hidden">
          {/* Top Bar */}
          <header className="sticky top-0 z-40 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-3 flex items-center justify-between min-h-[64px]">
            <div className="flex items-center gap-3">
              <div className="md:hidden flex items-center gap-2 -mr-1.5">
                 {shopConfig?.logoUrl ? (
                   <img src={shopConfig.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
                 ) : (
                   <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                      <Router className="text-white w-5 h-5" />
                   </div>
                 )}
              </div>

              {activeTab !== 'dashboard' && (
                (() => {
                  const isSubView = (activeTab === 'device-movement' && movementView !== 'hub') || 
                                    (activeTab === 'entry-exit' && entryExitView !== 'hub');
                  return (
                    <button 
                      onClick={() => {
                        const handlers = (window as any).backHandlers || [];
                        if (handlers.length > 0) {
                          const topHandler = handlers[handlers.length - 1];
                          if (topHandler()) return;
                        }

                        if (activeTab === 'device-movement' && movementView !== 'hub') {
                          setMovementView('hub');
                        } else if (activeTab === 'entry-exit' && entryExitView !== 'hub') {
                          setEntryExitView('hub');
                        } else {
                          setActiveTab('dashboard');
                        }
                      }}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all flex items-center justify-center"
                      title={isSubView ? "الرجوع للخلف" : "خروج للرئيسية"}
                    >
                      {isSubView ? (
                        <ArrowRight size={18} />
                      ) : (
                        <LogOut size={18} className="rotate-180 text-red-400 hover:text-red-300" />
                      )}
                    </button>
                  );
                })()
              )}

              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-cairo">
                {activeTab === 'other-services' ? 'الخدمات الإضافية' :
                 activeTab === 'device-management' ? 'إدارة الأجهزة' : 
                 activeTab === 'entry-exit' ? (
                   entryExitView === 'entry' ? 'دخول وخروج أجهزة - دخول أجهزة' :
                   entryExitView === 'exit' ? 'دخول وخروج أجهزة - خروج أجهزة' :
                   (i18n.language === 'ar' ? 'دخول وخروج أجهزة' : 'Device Entry & Exit')
                 ) :
                 activeTab === 'device-movement' ? (
                   movementView === 'inspection' ? 'قسم الصيانة - إجراء فحص' :
                   movementView === 'maintenance' ? 'قسم الصيانة - إجراء صيانة' :
                   movementView === 'approval' ? 'قسم الصيانة - انتظار الموافقة والقطع' :
                   (i18n.language === 'ar' ? 'قسم الصيانة' : 'Maintenance Department')
                 ) :
                 activeTab === 'inspection' ? (i18n.language === 'ar' ? 'فحص الأجهزة' : 'Inspection') :
                 activeTab === 'maintenance' ? (i18n.language === 'ar' ? 'صيانة الأجهزة' : 'Maintenance') :
                 activeTab === 'approval' ? (i18n.language === 'ar' ? 'انتظار الموافقة والقطع' : 'Approval & Parts') :
                 activeTab === 'vault' ? (i18n.language === 'ar' ? 'الحسابات' : 'Accounts') :
                 t(`common.${activeTab.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`)}
              </h2>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleManualSync}
                disabled={isSyncingAll}
                className={`p-2 rounded-xl transition-all relative border mr-1 cursor-pointer flex items-center justify-center disabled:opacity-50 ${
                  ProviderFactory.getMode() === 'CLOUD' 
                    ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/20'
                    : ProviderFactory.getMode() === 'LOCAL'
                      ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border-orange-500/20'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20'
                }`}
                title={
                  ProviderFactory.getMode() === 'CLOUD' ? 'مزامنة البيانات (سحابي)'
                  : ProviderFactory.getMode() === 'LOCAL' ? 'مزامنة البيانات (محلي)'
                  : 'مزامنة البيانات (تلقائي)'
                }
              >
                <RefreshCw size={18} className={isSyncingAll ? "animate-spin" : ""} />
              </button>

              <button
                onClick={() => setShowAllAlertsModal(true)}
                className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl transition-all relative border border-amber-500/20 mr-1 cursor-pointer flex items-center justify-center"
                title="التنبيهات والمستحقات"
              >
                <Bell size={18} className={activeAlerts.length > 0 ? "animate-pulse" : ""} />
                {activeAlerts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center shadow-sm">
                    {activeAlerts.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setTimeout(() => {
                    window.dispatchEvent(new Event('globalTriggerRepair'));
                  }, 300);
                }}
                className="p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-xl transition-all relative border border-orange-500/20 mr-1 cursor-pointer flex items-center justify-center"
                title="تدقيق ومطابقة السجلات"
              >
                <ShieldCheck size={18} />
              </button>

              <button onClick={handleSignOut} className="flex items-center gap-2 mr-1 md:mr-0 group relative" title={t('common.signOut')}>
                <div className="text-right hidden sm:block group-hover:text-red-400 transition-colors">
                  <p className="text-[10px] font-bold text-gray-200 line-clamp-1">{user.name}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 group-hover:bg-red-500 group-hover:text-white flex items-center justify-center transition-all relative">
                  <span className="absolute group-hover:opacity-0 transition-opacity font-black text-xs font-mono">{user.name.charAt(0)}</span>
                  <LogOut size={14} className="opacity-0 group-hover:opacity-100 absolute transition-opacity" />
                </div>
              </button>

              <div className="md:hidden flex items-center">
                 <button 
                   onClick={() => setActiveTab('settings')}
                   className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 transition-all text-gray-400 hover:text-white"
                 >
                   <MoreVertical size={20} />
                 </button>
              </div>
            </div>
          </header>

          {/* Active Alerts Banner Area Removed */}

          {/* Tab Content */}
          <div className={`flex-1 ${activeTab === 'dashboard' ? 'overflow-hidden' : 'overflow-y-auto'} ${['search', 'customers', 'inspection', 'maintenance', 'inventory', 'vault', 'device-movement', 'approval', 'entry-exit'].includes(activeTab) ? 'p-0 pb-28 md:pb-8' : 'p-4 md:p-8 pb-28 md:pb-8'}`}>
            <div className={`${['search', 'customers', 'inspection', 'maintenance', 'inventory', 'vault', 'device-movement', 'approval', 'entry-exit'].includes(activeTab) ? 'w-full' : 'max-w-7xl mx-auto'} h-full`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom Navigation - Mobile Only */}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0f0f0f]/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 py-2 px-6 flex items-center justify-around shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-2xl mobile-bottom-nav" dir="rtl">
            <MobileNavItem 
              active={activeTab === 'entry-exit'} 
              onClick={() => setActiveTab('entry-exit')} 
              icon={<ArrowRightLeft size={22} />} 
              label="دخول وخروج أجهزة"
              colorClass="text-orange-500"
            />
            <MobileNavItem 
              active={activeTab === 'inspection'} 
              onClick={() => setActiveTab('inspection')} 
              icon={<ClipboardCheck size={22} />} 
              label="فحص"
              colorClass="text-purple-500"
            />
            <div className="relative -top-3">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="w-14 h-14 bg-white dark:bg-[#1a1a1a] rounded-full flex flex-col items-center justify-center shadow-xl ring-4 ring-gray-100 dark:ring-[#0f0f0f] mobile-center-btn border border-gray-200 dark:border-white/5"
              >
                <div className="grid grid-cols-2 gap-[2px] w-[20px] h-[20px]">
                  <div className="bg-orange-600 rounded-[3px]"></div>
                  <div className="bg-blue-600 rounded-[3px]"></div>
                  <div className="bg-amber-500 rounded-[3px]"></div>
                  <div className="bg-emerald-600 rounded-[3px]"></div>
                </div>
              </button>
            </div>
            <MobileNavItem 
              active={activeTab === 'approval'} 
              onClick={() => setActiveTab('approval')} 
              icon={<Clock size={22} />} 
              label="انتظار الموافقة والقطع"
              colorClass="text-amber-500"
            />
            <MobileNavItem 
              active={activeTab === 'maintenance'} 
              onClick={() => setActiveTab('maintenance')} 
              icon={<Wrench size={22} />} 
              label="صيانة"
              colorClass="text-emerald-500"
            />
          </nav>
        </main>
      </div>
    </div>

    {/* Detailed Alerts Modal */}
    <AnimatePresence>
      {showAllAlertsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-cairo text-right" dir="rtl">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-4xl bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#141414]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">إشعارات التنبيه والضمان والمستحقات</h3>
                  <p className="text-xs text-gray-400 mt-0.5">تتبع الفواتير المتأخرة وضمانات الأجهزة النشطة والمنتهية حديثاً.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAllAlertsModal(false);
                  setSettleInvoice(null);
                }}
                className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs Selection */}
            <div className="flex border-b border-white/5 bg-[#121212] p-1 gap-1 m-4 rounded-xl">
              <button
                onClick={() => {
                  setAlertsTab('outstanding');
                  setSettleInvoice(null);
                }}
                className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  alertsTab === 'outstanding'
                    ? 'bg-amber-500 text-black font-black shadow-lg shadow-amber-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <CircleDollarSign size={16} />
                الفواتير المستحقة والديون ({activeAlerts.filter(a => a.type === 'outstanding').length})
              </button>
              <button
                onClick={() => {
                  setAlertsTab('warranty');
                  setSettleInvoice(null);
                }}
                className={`flex-1 py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  alertsTab === 'warranty'
                    ? 'bg-amber-500 text-black font-black shadow-lg shadow-amber-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Clock size={16} />
                متابعة صلاحية الضمان ({activeAlerts.filter(a => a.type.startsWith('warranty')).length})
              </button>
            </div>

            {/* Modal Body / Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
              {alertsTab === 'outstanding' ? (
                /* Outstanding Invoices Tab */
                <div>
                  {activeAlerts.filter(a => a.type === 'outstanding').length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3 opacity-60" />
                      <p className="font-bold text-sm">ممتاز! لا توجد فواتير معلقة أو ديون غير مسددة حالياً.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {settleInvoice ? (
                        /* Quick Settle Payment Form */
                        <div className="p-5 bg-white/[0.02] border border-amber-500/20 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 mb-4">
                          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h4 className="font-bold text-white text-xs sm:text-sm">سداد مالي للفاتورة #{settleInvoice.invoiceNumber}</h4>
                            <button
                              onClick={() => setSettleInvoice(null)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-xs font-bold text-gray-400">
                            <div>
                              <p>العميل:</p>
                              <p className="text-white font-black text-sm mt-1">{settleInvoice.customerName}</p>
                            </div>
                            <div>
                              <p>إجمالي الفاتورة:</p>
                              <p className="text-white font-black text-sm mt-1">{settleInvoice.totalCost.toLocaleString('en-US')} {settleInvoice.currency}</p>
                            </div>
                            <div>
                              <p>المتبقي المطلوب سداده:</p>
                              <p className="text-amber-400 font-black text-sm mt-1">{settleInvoice.remainingAmount.toLocaleString('en-US')} {settleInvoice.currency}</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1 w-full">
                              <label className="text-[11px] font-bold text-gray-400 block mb-1">المبلغ المراد سداده حالياً ({settleInvoice.currency})</label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={settleAmount}
                                  onChange={(e) => setSettleAmount(e.target.value)}
                                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 focus:border-amber-500 outline-none transition-all text-sm font-bold text-white text-right font-mono"
                                />
                                <button
                                  onClick={async () => {
                                    if (!settleInvoice.customerPhone) {
                                      alert('لا يوجد رقم هاتف مسجل لهذا العميل');
                                      return;
                                    }
                                    
                                    let hasWhatsapp = false;
                                    if (settleInvoice.customerId) {
                                      try {
                                        const custDoc = await getDoc(doc(db, 'customers', settleInvoice.customerId));
                                        if (custDoc.exists()) {
                                          hasWhatsapp = custDoc.data().hasWhatsapp !== undefined ? custDoc.data().hasWhatsapp : true;
                                        }
                                      } catch (err) {
                                        console.error('Error fetching customer for reminder:', err);
                                      }
                                    }

                                    sendUniversalReminder({
                                      customerName: settleInvoice.customerName,
                                      phone: settleInvoice.customerPhone,
                                      amount: settleInvoice.remainingAmount,
                                      currency: settleInvoice.currency || 'USD',
                                      invoiceNumber: settleInvoice.invoiceNumber,
                                      hasWhatsapp: hasWhatsapp,
                                      countryCode: shopConfig?.countryCode
                                    });
                                  }}
                                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black border border-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10"
                                  title="إرسال تذكير (واتساب أو SMS)"
                                >
                                  <MessageCircle size={16} />
                                  تذكير سداد
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {/* FIXED */}

                      <div className="overflow-x-auto border border-white/5 rounded-2xl">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-gray-400 text-xs font-bold">
                              <th className="p-4">رقم الفاتورة</th>
                              <th className="p-4">اسم العميل</th>
                              <th className="p-4">إجمالي</th>
                              <th className="p-4">المدفوع</th>
                              <th className="p-4">المتبقي</th>
                              <th className="p-4 text-center">الإجراءات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-xs">
                            {activeAlerts
                              .filter(a => a.type === 'outstanding')
                              .map(a => (
                                <tr key={a.id} className="hover:bg-white/[0.01] transition-colors">
                                  <td className="p-4 font-mono font-bold text-white">#{a.invoiceNumber}</td>
                                  <td className="p-4 text-gray-300 font-bold">{a.customerName}</td>
                                  <td className="p-4 text-gray-300 font-mono font-bold">{a.totalCost.toLocaleString('en-US')} {a.currency}</td>
                                  <td className="p-4 text-emerald-400 font-mono font-bold">{a.amountPaid.toLocaleString('en-US')} {a.currency}</td>
                                  <td className="p-4 text-amber-500 font-mono font-black">{a.remainingAmount.toLocaleString('en-US')} {a.currency}</td>
                                  <td className="p-4">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => {
                                          setSettleInvoice(a);
                                          setSettleAmount(String(a.remainingAmount));
                                        }}
                                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black rounded-lg text-[11px] font-black transition-all cursor-pointer border border-amber-500/20"
                                      >
                                        تسديد دفعة
                                      </button>
                                      <button
                                        onClick={() => {
                                          setShowAllAlertsModal(false);
                                          setActiveTab('search');
                                        }}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                      >
                                        استعراض
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Warranty Tracking Tab */
                <div>
                  {activeAlerts.filter(a => a.type.startsWith('warranty')).length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3 opacity-60" />
                      <p className="font-bold text-sm">لا توجد تنبيهات لضمانات أجهزة منتهية أو على وشك الانتهاء حالياً.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto border border-white/5 rounded-2xl">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="bg-white/5 border-b border-white/5 text-gray-400 text-xs font-bold">
                              <th className="p-4">نوع وجهاز الصيانة</th>
                              <th className="p-4">الفاتورة المرجعية</th>
                              <th className="p-4 text-center">حالة الضمان</th>
                              <th className="p-4 text-center">تاريخ انتهاء الضمان</th>
                              <th className="p-4 text-center">الإجراء</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-xs">
                            {activeAlerts
                              .filter(a => a.type.startsWith('warranty'))
                              .map(a => (
                                <tr key={a.id} className="hover:bg-white/[0.01] transition-colors">
                                  <td className="p-4 text-white font-bold">
                                    <span className="text-amber-500 text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-md ml-2">{a.deviceType}</span>
                                    {a.deviceName}
                                  </td>
                                  <td className="p-4 font-mono font-bold text-gray-300">#{a.invoiceNumber || '-'}</td>
                                  <td className="p-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                                      a.type === 'warranty_soon'
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>
                                      {a.type === 'warranty_soon' ? 'ينتهي قريباً جداً' : 'منتهي الصلاحية'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center text-gray-400 font-bold">{a.expiryDate}</td>
                                  <td className="p-4 text-center">
                                    <button
                                      onClick={() => {
                                        setShowAllAlertsModal(false);
                                        setActiveTab('search');
                                      }}
                                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                                    >
                                      تفاصيل الفاتورة
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-[#141414] text-left">
              <button
                onClick={() => {
                  setShowAllAlertsModal(false);
                  setSettleInvoice(null);
                }}
                className="p-2.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-white/5 cursor-pointer"
                title="إغلاق التنبيهات"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {showSignOutModal && (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div
          className="bg-[#1a1a1a] border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center animate-in zoom-in-95 duration-150"
          dir="rtl"
        >
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <LogOut size={22} className="rotate-180" />
          </div>
          <h3 className="text-lg font-black text-white font-cairo mb-2">تسجيل الخروج</h3>
          <p className="text-sm text-gray-400 font-cairo mb-6">هل أنت متأكد من رغبتك في تسجيل الخروج من النظام؟</p>
          <div className="flex gap-3">
            <button
              onClick={confirmSignOut}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-bold font-cairo transition-all cursor-pointer text-sm"
            >
              تسجيل الخروج
            </button>
            <button
              onClick={() => setShowSignOutModal(false)}
              className="flex-1 bg-[#242424] hover:bg-white/5 text-gray-300 py-3 rounded-2xl font-bold font-cairo border border-white/5 transition-all cursor-pointer text-sm"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    )}
    </SecurityGuard>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative ${
        active 
        ? 'bg-orange-600 text-white shadow-xl shadow-orange-900/30' 
        : 'text-gray-500 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={`${active ? 'text-white' : 'group-hover:scale-110 transition-transform'}`}>{icon}</span>
      <span className="font-bold text-sm hidden lg:block">{label}</span>
      {active && <motion.div layoutId="nav-active" className="absolute left-0 w-1 lg:hidden h-6 bg-white rounded-full translate-x-[-8px]" />}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon, label, colorClass }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, colorClass: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? colorClass : 'text-gray-400 dark:text-gray-500 hover:' + colorClass}`}
    >
      <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-gray-100 dark:bg-white/10 shadow-inner' : ''}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-tighter opacity-80`}>{label}</span>
    </button>
  );
}
