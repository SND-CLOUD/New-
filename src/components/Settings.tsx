import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, updateDoc, deleteDoc, addDoc, serverTimestamp } from '../firebase';
import { Save, RefreshCw, Smartphone, Database, Languages, LogOut, Shield, Fingerprint, Lock, Clock, HardDrive, Download, Archive, Upload, RotateCcw, FileText, User as UserIcon, Tag, X, Cpu, Calculator, ArrowLeft, ArrowRight, Edit, Phone, Mail, Facebook, MapPin, Store, ChevronLeft, Globe, Settings as SettingsIcon, CheckCircle, XCircle } from 'lucide-react';
import { localDb } from '../lib/local-db';
import { FirebaseProviderInstance } from '../data/FirebaseProvider';
import { LocalProviderInstance } from '../data/LocalProvider';
import { ProviderFactory } from '../data/ProviderFactory';
import { SyncEngine } from '../data/SyncEngine';
import { User, ShopConfig } from '../types';
import UserManagement from './UserManagement';
import EngineersTable from './EngineersTable';
import CategoriesTable from './CategoriesTable';
import DeviceManagement from './DeviceManagement';
import AccountingInputs from './AccountingInputs';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Device } from '@capacitor/device';
import { NativeBiometric } from 'capacitor-native-biometric';
import { exportBackupFile, restoreBackupData, archiveOldData, getFormattedBackupTimestamp } from '../lib/backup';
import { usePermissions } from '../hooks/usePermissions';
import { useBackHandler } from '../hooks/useBackHandler';

const STATIC_HYBRID_TABLES = [
  'company_details', 'settings', 'users', 'engineers', 'user_devices',
  'device_categories', 'device_models', 'fin_transaction_types', 'fin_funds',
  'fin_currencies', 'fin_payment_methods', 'job_titles'
];

const DYNAMIC_HYBRID_TABLES = [
  'customers', 'invoices', 'invoice_items', 'vault_transactions',
  'maintenance_actions', 'approval_actions', 'inventory_items', 'document_outputs'
];

const DEFAULT_HYBRID_TABLES = [
  ...STATIC_HYBRID_TABLES,
  ...DYNAMIC_HYBRID_TABLES
];

const TABLE_ARABIC_NAMES: Record<string, string> = {
  company_details: 'بيانات المحل والشركات',
  settings: 'إعدادات الضبط والسياسات',
  users: 'مستخدمو النظام والصلاحيات',
  engineers: 'المهندسون والفنيون',
  user_devices: 'أجهزة مستخدمي النظام',
  device_categories: 'أنواع وتصنيفات الأجهزة',
  device_models: 'موديلات الماركات والأجهزة',
  fin_transaction_types: 'أنواع الحركات المالية',
  fin_funds: 'الخزائن والحسابات البنكية',
  fin_currencies: 'العملات وأسعار الصرف',
  fin_payment_methods: 'طرق ووسائل الدفع',
  job_titles: 'المسميات الوظيفية',
  customers: 'سجلات وبيانات العملاء',
  invoices: 'فواتير المبيعات والصيانة',
  invoice_items: 'عناصر وبنود الفواتير',
  vault_transactions: 'سندات وحركات الخزينة',
  maintenance_actions: 'إجراءات ومراحل الصيانة',
  approval_actions: 'موافقات وإشعارات الصيانة',
  inventory_items: 'قطع الغيار والمخزون',
  document_outputs: 'الوثائق والمستندات المخرجة',
};

export default function Settings({ user, shopConfig, onShopConfigUpdate, onSignOut }: { user: User, shopConfig: ShopConfig | null, onShopConfigUpdate?: (config: any) => void, onSignOut?: () => void }) {
  const { t, i18n } = useTranslation();
  const { hasPermission } = usePermissions(user);
  const hasHybridDbPermission = user.role === 'admin' || user.role === 'manager' || !!user.permissions?.settings_hybrid_db?.view;

  const canShowCategory = (catId: string) => {
    if (catId === 'general' || catId === 'security') return true;
    if (catId === 'accounting-inputs') return hasPermission('settings_main_data', 'view');
    if (catId === 'categories-engineers') return hasPermission('settings_devices_engineers', 'view');
    
    if (catId === 'users') return true;
    return true;
  };
  
  const [invoiceCounter, setInvoiceCounter] = useState(0);
  const [customerCounter, setCustomerCounter] = useState(0);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<{ active: boolean; value: number; label: string }>({ active: false, value: 0, label: '' });
  const [activeTab, setActiveTab ] = useState<'main' | 'general' | 'security' | 'backup' | 'users' | 'categories-engineers' | 'accounting-inputs' | 'advanced-management'>('main');
  const [backupSubTab, setBackupSubTab] = useState<'list' | 'stats' | 'backup_manual' | 'export' | 'import' | 'archive' | 'reset' | 'audit'>('list');
  const [advancedDbView, setAdvancedDbView] = useState<'list' | 'stats' | 'backup_manual' | 'export' | 'import' | 'archive' | 'reset' | 'audit'>('list');
  const [advancedTab, setAdvancedTab] = useState<'database' | 'devices'>('database');
  const [advancedDbSubTab, setAdvancedDbSubTab] = useState<'sync' | 'backup'>('sync');
  const [backupLoading, setBackupLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Shop details states
  const [activeCategoriesEngineersModal, setActiveCategoriesEngineersModal] = useState<'categories' | 'engineers' | null>(null);
  const [activeAccountingInputsModal, setActiveAccountingInputsModal] = useState<'accounting' | 'details' | 'backup' | null>(null);
  const [activeAdvancedManagementModal, setActiveAdvancedManagementModal] = useState<'database-sync' | 'database-backup' | 'devices' | null>(null);
  const [generalSubTab, setGeneralSubTab] = useState<'language' | 'details' | 'advanced' | 'database'>('language');
  const [activeGeneralModal, setActiveGeneralModal] = useState<'language' | 'details' | 'advanced' | 'database' | null>(null);
  
  // Database configuration states
  const [dbMode, setDbMode] = useState<'LOCAL' | 'CLOUD' | 'AUTO'>('LOCAL');
  const [hybridDbType, setHybridDbType] = useState<'none' | 'CLOUD' | 'LOCAL'>('none');
  const [hybridAdvancedTab, setHybridAdvancedTab] = useState<'reset' | 'transfer'>('reset');
  const [hybridSelectedTables, setHybridSelectedTables] = useState<string[]>(DEFAULT_HYBRID_TABLES);
  const [preciseResetLoading, setPreciseResetLoading] = useState(false);
  const [dataTransferLoading, setDataTransferLoading] = useState(false);
  const [hybridResult, setHybridResult] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [showHybridAdvancedModal, setShowHybridAdvancedModal] = useState(false);
  const [activeProvider, setActiveProvider] = useState<'LOCAL' | 'CLOUD'>('LOCAL');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [appearance, setAppearance] = useState<'normal' | 'dark'>('normal');
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | '80mm'>('A4');
  const [shopName, setShopName] = useState('عالم الصيانة والتجارة');
  const [countryCode, setCountryCode] = useState('+967');
  const [phone1, setPhone1] = useState('');
  const [phone2, setPhone2] = useState('');
  const [landline, setLandline] = useState('');
  const [phone1Call, setPhone1Call] = useState(false);
  const [phone1Whatsapp, setPhone1Whatsapp] = useState(false);
  const [phone2Call, setPhone2Call] = useState(false);
  const [phone2Whatsapp, setPhone2Whatsapp] = useState(false);
  const [landlineCall, setLandlineCall] = useState(false);
  const [landlineWhatsapp, setLandlineWhatsapp] = useState(false);
  const [facebookUrl, setFacebookUrl] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [isEditingShop, setIsEditingShop] = useState(false);

  // Bank Accounts
  const [bankYerName, setBankYerName] = useState('');
  const [bankYerAccount, setBankYerAccount] = useState('');
  const [bankSarName, setBankSarName] = useState('');
  const [bankSarAccount, setBankSarAccount] = useState('');
  const [bankUsdName, setBankUsdName] = useState('');
  const [bankUsdAccount, setBankUsdAccount] = useState('');
  const [bankHolderName, setBankHolderName] = useState('');
  const [liabilityCurrency, setLiabilityCurrency] = useState('YER');
  const [managerName, setManagerName] = useState('');
  const [commercialRecord, setCommercialRecord] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');

  // Audit States
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResults, setAuditResults] = useState<{
    lastChecked: Date | null;
    invoiceCounter: { registered: number; actualMax: number; conflict: boolean };
    otherInvoiceCounter: { registered: number; actualMax: number; conflict: boolean };
    customerCounter: { registered: number; actualMax: number; conflict: boolean };
    missingInvoiceNumbers: any[];
    missingOtherInvoiceNumbers: any[];
    missingCustomerNumbers: any[];
    totalDiscrepancies: any[];
    statusDiscrepancies: any[];
    paymentImbalances: any[];
    orphanedItems: any[];
    emptyInvoices: any[];
    itemSyncDiscrepancies: any[];
    missingInCloudItems: any[];
    missingInLocalItems: any[];
  } | null>(null);
  const [repairProgress, setRepairProgress] = useState<{
    status: 'idle' | 'running' | 'completed' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // Security States
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pinCode, setPinCode] = useState('');

  // Backup States
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupTime, setBackupTime] = useState('00:00');
  const [backupPath, setBackupPath] = useState('Documents/SND_Backups');
  const [backupCustomName, setBackupCustomName] = useState(() => getFormattedBackupTimestamp());
  const [backupCount, setBackupCount] = useState(0);

  const [deviceUUID, setDeviceUUID] = useState('');
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [dbSchemas, setDbSchemas] = useState<Record<string, string[]>>({});

  const [statsData, setStatsData] = useState({
    invoices: 0,
    customers: 0,
    maintenance: 0,
    support: 0
  });

  const refreshStats = async () => {

    try {
      const { ProviderFactory } = await import('../data/ProviderFactory');
      const provider = ProviderFactory.getProvider();
      
      const invoicesSnap = await provider.getDocs('invoices');
      const customersSnap = await provider.getDocs('customers');
      const maintenanceSnap = await provider.getDocs('maintenance_actions');
      
      setStatsData({
        invoices: invoicesSnap.docs?.length || 0,
        customers: customersSnap.docs?.length || 0,
        maintenance: maintenanceSnap.docs?.length || 0,
        support: 0
      });
    } catch (e) {
      console.error('Error fetching statistics:', e);
    }
  };

  const isSettingsDeepView = activeTab !== 'main' || activeGeneralModal !== null || activeCategoriesEngineersModal !== null || activeAccountingInputsModal !== null || activeAdvancedManagementModal !== null;
  const handleCloseDeepView = () => {
    if (advancedDbView !== 'list') {
      setAdvancedDbView('list');
    } else if (backupSubTab !== 'list') {
      setBackupSubTab('list');
    } else if (activeGeneralModal !== null) {
      setActiveGeneralModal(null);
    } else if (activeCategoriesEngineersModal !== null) {
      setActiveCategoriesEngineersModal(null);
    } else if (activeAccountingInputsModal !== null) {
      setActiveAccountingInputsModal(null);
    } else if (activeAdvancedManagementModal !== null) {
      setActiveAdvancedManagementModal(null);
    } else {
      setActiveTab('main');
    }
  };
  
  useBackHandler(isSettingsDeepView, handleCloseDeepView);

  useEffect(() => {
    // Keep this for legacy if something else triggers it, though not strictly needed anymore
    (window as any).isSettingsDeepView = isSettingsDeepView;
    window.addEventListener('closeSettingsDeepView', handleCloseDeepView);
    return () => {
      (window as any).isSettingsDeepView = false;
      window.removeEventListener('closeSettingsDeepView', handleCloseDeepView);
    };
  }, [isSettingsDeepView, activeTab, activeGeneralModal, activeCategoriesEngineersModal, activeAccountingInputsModal, activeAdvancedManagementModal]);

  useEffect(() => {
    const fetch = async () => {
      let uuid = localStorage.getItem('snd_hybrid_device_uuid');
      if (!uuid) {
        uuid = crypto.randomUUID();
        localStorage.setItem('snd_hybrid_device_uuid', uuid);
      }
      setDeviceUUID(uuid);

      const s = await getDoc(doc(db, 'settings', 'app'));
      const data = s.data();
      setInvoiceCounter(data?.lastInvoiceNumber || 0);
      setCustomerCounter(data?.lastCustomerNumber || 0);
      
      const localSettings = JSON.parse(localStorage.getItem('snd_settings') || '{}');
      setBiometricEnabled(localSettings.biometricEnabled || false);
      setPinEnabled(localSettings.pinEnabled || false);
      setPinCode(localSettings.pinCode || '');
      setAutoBackup(localSettings.autoBackup || false);
      setBackupTime(localSettings.backupTime || '00:00');
      setBackupPath(localSettings.backupPath || 'Documents/SND_Backups');
      setBackupCustomName(localSettings.backupCustomName || getFormattedBackupTimestamp());
      setAppearance(localSettings.appearance || 'normal');
      setPrintPaperSize(localSettings.printPaperSize || 'A4');

      await refreshStats();

  
    try {
        const localDetails = await localDb.query("SELECT * FROM company_details WHERE id = 'main_details' OR (shopName != '' AND shopName != 'اسم المؤسسة / المركز') ORDER BY CASE WHEN id = 'main_details' THEN 0 ELSE 1 END LIMIT 1");
        if (localDetails.values && localDetails.values.length > 0) {
          const detail = localDetails.values[0];
          setShopName(detail.shopName || 'عالم الصيانة والتجارة');
          setCountryCode(detail.countryCode || '+967');
          setPhone1(detail.phone1 || '');
          setPhone2(detail.phone2 || '');
          setLandline(detail.landline || '');
          setPhone1Call(detail.phone1Call === 1);
          setPhone1Whatsapp(detail.phone1Whatsapp === 1);
          setPhone2Call(detail.phone2Call === 1);
          setPhone2Whatsapp(detail.phone2Whatsapp === 1);
          setLandlineCall(detail.landlineCall === 1);
          setLandlineWhatsapp(detail.landlineWhatsapp === 1);
          setFacebookUrl(detail.facebookUrl || '');
          setMapUrl(detail.mapUrl || '');
          setEmail(detail.email || '');
          setBio(detail.bio || '');
          setLogoUrl(detail.logoUrl || '');
          setAddress(detail.address || '');
          setBankYerName(detail.bankYerName || '');
          setBankYerAccount(detail.bankYerAccount || '');
          setBankSarName(detail.bankSarName || '');
          setBankSarAccount(detail.bankSarAccount || '');
          setBankUsdName(detail.bankUsdName || '');
          setBankUsdAccount(detail.bankUsdAccount || '');
          setBankHolderName(detail.bankHolderName || '');
          setLiabilityCurrency(detail.liabilityCurrency || 'YER');
          setManagerName(detail.managerName || 'اسم المدير');
          setCommercialRecord(detail.commercialRecord || '123456');
          setTaxNumber(detail.taxNumber || '1234567890');
          setReceiptNotes(detail.receiptNotes || 'ملاحظات الفاتورة');
        }
      } catch (localErr) {
        console.warn("Failed to fetch local company details from SQLite:", localErr);
      }

  
    try {
        const shopSnap = await getDoc(doc(db, 'company_details', 'main_details'));
        if (shopSnap.exists()) {
          const shopData = shopSnap.data();
          setShopName(shopData.shopName || 'عالم الصيانة والتجارة');
          setCountryCode(shopData.countryCode || '+967');
          localStorage.setItem('snd_country_code', shopData.countryCode || '+967');
          setPhone1(shopData.phone1 || '');
          setPhone2(shopData.phone2 || '');
          setLandline(shopData.landline || '');
          setPhone1Call(shopData.phone1Call ?? false);
          setPhone1Whatsapp(shopData.phone1Whatsapp ?? false);
          setPhone2Call(shopData.phone2Call ?? false);
          setPhone2Whatsapp(shopData.phone2Whatsapp ?? false);
          setLandlineCall(shopData.landlineCall ?? false);
          setLandlineWhatsapp(shopData.landlineWhatsapp ?? false);
          setFacebookUrl(shopData.facebookUrl || '');
          setMapUrl(shopData.mapUrl || '');
          setEmail(shopData.email || '');
          setBio(shopData.bio || '');
          setLogoUrl(shopData.logoUrl || '');
          setAddress(shopData.address || '');
          setBankYerName(shopData.bankYerName || '');
          setBankYerAccount(shopData.bankYerAccount || '');
          setBankSarName(shopData.bankSarName || '');
          setBankSarAccount(shopData.bankSarAccount || '');
          setBankUsdName(shopData.bankUsdName || '');
          setBankUsdAccount(shopData.bankUsdAccount || '');
          setBankHolderName(shopData.bankHolderName || '');
          setLiabilityCurrency(shopData.liabilityCurrency || 'YER');
          setManagerName(shopData.managerName || 'اسم المدير');
          setCommercialRecord(shopData.commercialRecord || '123456');
          setTaxNumber(shopData.taxNumber || '1234567890');
          setReceiptNotes(shopData.receiptNotes || 'ملاحظات الفاتورة');

          // Save/Sync to local SQLite table "company_details" as well
      
    try {
            await localDb.run(
              `INSERT OR REPLACE INTO company_details (
                id, shopName, name, countryCode, phone1, phone2, landline, 
                phone1Call, phone1Whatsapp, phone2Call, phone2Whatsapp, 
                landlineCall, landlineWhatsapp, facebookUrl, mapUrl, 
                email, bio, logoUrl, logo, address, updatedAt,
                bankYerName, bankYerAccount, bankSarName, bankSarAccount, bankUsdName, bankUsdAccount, bankHolderName,
                fiscalYear, startDate, receiptNotes, managerName, commercialRecord, taxNumber
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                'main_details',
                String(shopData.shopName || shopData.name || 'عالم الصيانة والتجارة'),
                String(shopData.name || shopData.shopName || 'عالم الصيانة والتجارة'),
                String(shopData.countryCode || '+967'),
                String(shopData.phone1 || ''),
                String(shopData.phone2 || ''),
                String(shopData.landline || ''),
                shopData.phone1Call ? 1 : 0,
                shopData.phone1Whatsapp ? 1 : 0,
                shopData.phone2Call ? 1 : 0,
                shopData.phone2Whatsapp ? 1 : 0,
                shopData.landlineCall ? 1 : 0,
                shopData.landlineWhatsapp ? 1 : 0,
                String(shopData.facebookUrl || ''),
                String(shopData.mapUrl || ''),
                String(shopData.email || ''),
                String(shopData.bio || ''),
                String(shopData.logoUrl || shopData.logo || ''),
                String(shopData.logo || shopData.logoUrl || ''),
                String(shopData.address || ''),
                new Date().toISOString(),
                String(shopData.bankYerName || ''),
                String(shopData.bankYerAccount || ''),
                String(shopData.bankSarName || ''),
                String(shopData.bankSarAccount || ''),
                String(shopData.bankUsdName || ''),
                String(shopData.bankUsdAccount || ''),
                String(shopData.bankHolderName || ''),
                String(shopData.fiscalYear || new Date().getFullYear().toString()),
                shopData.startDate?.toDate ? shopData.startDate.toDate().toISOString().split('T')[0] : String(shopData.startDate || new Date().toISOString().split('T')[0]),
                String(shopData.receiptNotes || 'ملاحظات الفاتورة'),
                String(shopData.managerName || 'اسم المدير'),
                String(shopData.commercialRecord || '123456'),
                String(shopData.taxNumber || '1234567890')
              ]
            );
          } catch (syncErr) {
            console.error("Failed to sync Firebase shop settings to local SQLite:", syncErr);
          }
        }
      } catch (shopErr) {
        console.warn("Failed to fetch shop settings from Firebase:", shopErr);
      }

  
    try {
        const { ProviderFactory } = await import('../data/ProviderFactory');
        setDbMode(ProviderFactory.getMode());
        setActiveProvider(ProviderFactory.getActiveProviderType());
      } catch (dbErr) {
        console.warn("Failed to load database provider factory settings:", dbErr);
      }
    };
    fetch();
    refreshBackupCount();
  }, []);

  useEffect(() => {
    const handleTriggerRepair = () => {
      setActiveTab('advanced-management');
      setActiveAdvancedManagementModal('database-backup');
      setAdvancedDbView('audit');
      setTimeout(() => {
        runDatabaseAudit();
      }, 300);
    };
    window.addEventListener('globalTriggerRepair', handleTriggerRepair);
    return () => window.removeEventListener('globalTriggerRepair', handleTriggerRepair);
  }, []);

  const refreshBackupCount = async () => {

    try {
      const info = await Device.getInfo();
      if (info.platform !== 'web') {
        const result = await Filesystem.readdir({
          path: backupPath,
          directory: Directory.Documents,
        });
        setBackupCount(result.files.length);
      } else {
        setBackupCount(0);
      }
    } catch (e) {
      setBackupCount(0);
    }
  };

  const handleSaveDbMode = async (mode: 'LOCAL' | 'CLOUD' | 'AUTO') => {
    setDbMode(mode);

    try {
      const { ProviderFactory } = await import('../data/ProviderFactory');
      ProviderFactory.setMode(mode);
    } catch (err) {
      console.error("Failed to save database mode:", err);
    }
  };

  const handleSyncNow = async () => {
    setSyncLoading(true);
    setSyncResult({ type: null, message: '' });

    try {
      const { SyncEngine } = await import('../data/SyncEngine');
      const res = await SyncEngine.syncAll();
      if (res.success) {
        setSyncResult({ type: 'success', message: res.message });
        await refreshStats();
      } else {
        setSyncResult({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setSyncResult({ type: 'error', message: err.message || 'حدث خطأ غير متوقع أثناء المزامنة.' });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSelectBackupFolder = async () => {
    if ('showDirectoryPicker' in window) {
  
    try {
        const dirHandle = await (window as any).showDirectoryPicker();
        if (dirHandle && dirHandle.name) {
          setBackupPath(`Documents/SND_Backups/${dirHandle.name}`);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.warn('Directory picker cancelled or error:', e);
        }
      }
    } else {
      const userPath = prompt('أدخل مسار تخزين النسخ الاحتياطية على جهازك:', backupPath);
      if (userPath !== null && userPath.trim()) {
        setBackupPath(userPath.trim());
      }
    }
  };

  const handleExportBackup = async () => {
    setBackupLoading(true);

    try {
      const res = await exportBackupFile(backupCustomName, backupPath);
      alert(res.message);
    } catch (e: any) {
      alert('خطأ أثناء التصدير: ' + (e?.message || e));
    } finally {
      setBackupLoading(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('تحذير: سيتم استبدال جميع البيانات الحالية بالبيانات الموجودة في هذا الملف. هل أنت متأكد من المتابعة؟')) {
      e.target.value = '';
      return;
    }
    
    setBackupLoading(true);

    try {
      const text = await file.text();
      await restoreBackupData(text);
      alert('تم استعادة النسخة الاحتياطية بنجاح! سيتم إعادة تحميل الصفحة.');
      window.location.reload();
    } catch (err: any) {
      alert('فشل الاستعادة: ملف غير صالح أو تالف.');
    } finally {
      setBackupLoading(false);
      e.target.value = '';
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('تحذير: سيتم مسح الفواتير المسلمة والمرتجعة التي مضى عليها أكثر من 12 شهر بشكل نهائي من قاعدة البيانات. هل تريد المتابعة؟')) return;
    
    setBackupLoading(true);

    try {
      const res = await archiveOldData(12); // archive older than 12 months
      alert(res.message);
    } catch (err: any) {
      alert('فشل في عملية الأرشفة: ' + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const getAuditStatusText = (status: string) => {
    const s = String(status || '').toLowerCase().trim();
    if (['10', 'new'].includes(s)) return 'دخول جديد (10)';
    if (['20', 'testing', 'inspected'].includes(s)) return 'قيد الفحص والتشخيص (20)';
    if (s === '21') return 'فحص مرحلي 1 (21)';
    if (s === '22') return 'فحص مرحلي 2 (22)';
    if (['30', 'awaiting_approval'].includes(s)) return 'انتظار الموافقة والقطع (30)';
    if (['35', 'awaiting_parts'].includes(s)) return 'انتظار قطع الغيار (35)';
    if (['40', 'repairing'].includes(s)) return 'قيد الصيانة (40)';
    if (['50', 'ready', 'intact', 'unrepairable', 'refused'].includes(s)) return 'جاهز للتسليم (50)';
    if (['60', 'delivered'].includes(s)) return 'تم التسليم (60)';
    if (['70', 'cancelled'].includes(s)) return 'إلغاء العملية (70)';
    return status || 'غير محدد';
  };

  const normalizeStatusCode = (status: any): string => {
    const s = String(status || '').toLowerCase().trim();
    if (['60', 'delivered'].includes(s)) return '60';
    if (['50', 'ready', 'intact', 'unrepairable', 'refused'].includes(s)) return '50';
    if (['40', 'repairing'].includes(s)) return '40';
    if (['35', 'awaiting_parts'].includes(s)) return '35';
    if (['30', 'awaiting_approval'].includes(s)) return '30';
    if (s === '22') return '22';
    if (s === '21') return '21';
    if (['20', 'testing', 'inspected'].includes(s)) return '20';
    if (['70', 'cancelled'].includes(s)) return '70';
    if (['10', 'new'].includes(s)) return '10';
    return s || '10';
  };

  const deriveExpectedInvoiceStatus = (items: any[], currentInvStatus: string): string => {
    if (!items || items.length === 0) return currentInvStatus || '10';

    const normalizedItems = items.map(it => normalizeStatusCode(it.status));

    if (normalizedItems.every(st => st === '60')) {
      return currentInvStatus === 'delivered' ? 'delivered' : '60';
    }

    if (normalizedItems.every(st => st === '70')) {
      return '70';
    }

    const activeItems = normalizedItems.filter(st => st !== '70');
    const itemsToEvaluate = activeItems.length > 0 ? activeItems : normalizedItems;

    if (itemsToEvaluate.every(st => st === '50' || st === '60')) {
      return currentInvStatus === 'ready' ? 'ready' : '50';
    }

    const numericRanks: Record<string, number> = {
      '10': 10,
      '20': 20,
      '21': 21,
      '22': 22,
      '30': 30,
      '35': 35,
      '40': 40
    };

    let maxRank = 0;
    let maxCode = '10';

    itemsToEvaluate.forEach(st => {
      const rank = numericRanks[st] || 10;
      if (rank > maxRank) {
        maxRank = rank;
        maxCode = st;
      }
    });

    if (maxCode === '40' && currentInvStatus === 'repairing') return 'repairing';
    if (maxCode === '20' && (currentInvStatus === 'testing' || currentInvStatus === 'inspected')) return currentInvStatus;
    if (maxCode === '10' && currentInvStatus === 'new') return 'new';

    return maxCode;
  };

  const runDatabaseAudit = async () => {
    setIsAuditing(true);
    setRepairProgress({ status: 'idle', message: '' });

    try {
      const invoicesRes = await localDb.query('SELECT * FROM invoices');
      const dbInvoices = invoicesRes.values || [];
      
      const itemsRes = await localDb.query('SELECT * FROM invoice_items');
      const dbItems = itemsRes.values || [];
      
      const txRes = await localDb.query('SELECT * FROM vault_transactions');
      const dbTransactions = txRes.values || [];
      
      const customersRes = await localDb.query('SELECT * FROM customers');
      const dbCustomers = customersRes.values || [];

      // Query Cloud DB records for cross-database alignment check if connected
      let cloudItems: any[] = [];
      let cloudInvoices: any[] = [];
  
    try {
        const cloudItemsSnap = await FirebaseProviderInstance.getDocs('invoice_items');
        cloudItems = cloudItemsSnap.docs ? cloudItemsSnap.docs.map((d: any) => d.data()) : (cloudItemsSnap || []);
        
        const cloudInvoicesSnap = await FirebaseProviderInstance.getDocs('invoices');
        cloudInvoices = cloudInvoicesSnap.docs ? cloudInvoicesSnap.docs.map((d: any) => d.data()) : (cloudInvoicesSnap || []);
      } catch (cErr) {
        console.warn('Cloud database unreachable or offline during audit:', cErr);
      }

      // Check missing / mismatched invoice_items between Cloud & Local
      const itemSyncDiscrepancies: any[] = [];
      const missingInCloudItems: any[] = [];
      const missingInLocalItems: any[] = [];

      if (cloudItems.length > 0 || cloudInvoices.length > 0) {
        const localItemsById = new Map(dbItems.map((it: any) => [it.id, it]));
        const cloudItemsById = new Map(cloudItems.map((it: any) => [it.id, it]));

        dbItems.forEach((it: any) => {
          if (!cloudItemsById.has(it.id)) {
            missingInCloudItems.push(it);
          }
        });

        cloudItems.forEach((it: any) => {
          if (!localItemsById.has(it.id)) {
            missingInLocalItems.push(it);
          }
        });

        const localItemsByInv: Record<string, any[]> = {};
        dbItems.forEach((it: any) => {
          if (!localItemsByInv[it.invoiceId]) localItemsByInv[it.invoiceId] = [];
          localItemsByInv[it.invoiceId].push(it);
        });

        const cloudItemsByInv: Record<string, any[]> = {};
        cloudItems.forEach((it: any) => {
          if (!cloudItemsByInv[it.invoiceId]) cloudItemsByInv[it.invoiceId] = [];
          cloudItemsByInv[it.invoiceId].push(it);
        });

        const allInvIds = new Set([...Object.keys(localItemsByInv), ...Object.keys(cloudItemsByInv)]);
        allInvIds.forEach((invId) => {
          const lCount = (localItemsByInv[invId] || []).length;
          const cCount = (cloudItemsByInv[invId] || []).length;
          if (lCount !== cCount) {
            const parentInv = dbInvoices.find((i: any) => i.id === invId) || cloudInvoices.find((i: any) => i.id === invId);
            itemSyncDiscrepancies.push({
              id: invId,
              invoiceNumber: parentInv?.invoiceNumber || 'غير معروف',
              localCount: lCount,
              cloudCount: cCount
            });
          }
        });
      }

      const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
      const settingsData = settingsDoc.data();
      const registeredLastInvoice = Number(settingsData?.lastInvoiceNumber) || 0;
      const registeredLastOtherInvoice = Number(settingsData?.lastOtherInvoiceNumber) || 0;
      const registeredLastCustomer = Number(settingsData?.lastCustomerNumber) || 0;

      let maxInvoiceNum = 0;
      const missingInvoiceNumbers: any[] = [];
      let maxOtherInvoiceNum = 0;
      const missingOtherInvoiceNumbers: any[] = [];
      dbInvoices.forEach((inv: any) => {
        const invNumStr = String(inv.invoiceNumber || '').trim();
        const isMissingOrInvalid = !invNumStr || invNumStr === '0' || invNumStr === 'NaN' || invNumStr === 'undefined';
        
        if (isMissingOrInvalid) {
          const t = inv.invoiceType || inv.templateType || inv.type || '';
          if (t === 'sale_software' || t === 'sale_parts' || t === 'sale_maintenance' || t.startsWith('sale_') || t === 'software' || t === 'parts' || t === 'maintenance') {
            missingOtherInvoiceNumbers.push(inv);
          } else {
            missingInvoiceNumbers.push(inv);
          }
        } else {
          if (invNumStr.startsWith('O-')) {
            const num = parseInt(invNumStr.replace('O-', ''), 10);
            if (!isNaN(num) && num > maxOtherInvoiceNum) {
              maxOtherInvoiceNum = num;
            }
          } else {
            const num = parseInt(invNumStr, 10);
            if (!isNaN(num) && num > maxInvoiceNum) {
              maxInvoiceNum = num;
            }
          }
        }
      });

      let maxCustomerNum = 0;
      const missingCustomerNumbers: any[] = [];
      dbCustomers.forEach((cust: any) => {
        const custNumStr = String(cust.customerNumber || '').trim();
        const isMissingOrInvalid = !custNumStr || custNumStr === '0' || custNumStr === 'NaN' || custNumStr === 'undefined';
        
        if (isMissingOrInvalid) {
          missingCustomerNumbers.push(cust);
        } else {
          const num = parseInt(custNumStr, 10);
          if (!isNaN(num) && num > maxCustomerNum) {
            maxCustomerNum = num;
          }
        }
      });

      const invoiceCounterConflict = registeredLastInvoice !== maxInvoiceNum || missingInvoiceNumbers.length > 0;
      const otherInvoiceCounterConflict = registeredLastOtherInvoice !== maxOtherInvoiceNum || missingOtherInvoiceNumbers.length > 0;
      const customerCounterConflict = registeredLastCustomer !== maxCustomerNum || missingCustomerNumbers.length > 0;

      const totalDiscrepancies: any[] = [];
      const statusDiscrepancies: any[] = [];

      const invoiceItemGroups: Record<string, any[]> = {};
      dbItems.forEach((item: any) => {
        if (!invoiceItemGroups[item.invoiceId]) {
          invoiceItemGroups[item.invoiceId] = [];
        }
        invoiceItemGroups[item.invoiceId].push(item);
      });

      dbInvoices.forEach((inv: any) => {
        const items = invoiceItemGroups[inv.id] || [];
        const computedTotal = items.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
        if (Math.abs(computedTotal - Number(inv.totalCost)) > 0.01) {
          totalDiscrepancies.push({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            currentTotal: inv.totalCost,
            computedTotal
          });
        }

        const expectedStatus = deriveExpectedInvoiceStatus(items, inv.status);

        if (inv.status !== expectedStatus) {
          statusDiscrepancies.push({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            currentStatus: inv.status,
            expectedStatus
          });
        }
      });

      const paymentImbalances: any[] = [];
      const txGroupsByInvoiceNum: Record<string, any[]> = {};
      dbTransactions.forEach((tx: any) => {
        if (tx.type === 'receipt' && tx.invoiceNumber) {
          const invNum = String(tx.invoiceNumber).trim();
          if (!txGroupsByInvoiceNum[invNum]) {
            txGroupsByInvoiceNum[invNum] = [];
          }
          txGroupsByInvoiceNum[invNum].push(tx);
        }
      });

      dbInvoices.forEach((inv: any) => {
        const txs = txGroupsByInvoiceNum[String(inv.invoiceNumber).trim()] || [];
        const computedPaid = txs.reduce((sum, tx) => sum + (Number(tx.liabilityAmount) || Number(tx.amount) || 0), 0);
        if (Math.abs(computedPaid - Number(inv.amountPaid)) > 0.01) {
          paymentImbalances.push({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName,
            currency: inv.currency,
            amountPaidOnInvoice: inv.amountPaid,
            amountInLedger: computedPaid,
            status: inv.status,
            totalCost: inv.totalCost
          });
        }
      });

      const orphanedItems: any[] = [];
      const invoiceIdsSet = new Set(dbInvoices.map((inv: any) => inv.id));
      const cloudInvoiceIdsSet = new Set((cloudInvoices || []).map((inv: any) => inv.id));
      dbItems.forEach((item: any) => {
        if (!invoiceIdsSet.has(item.invoiceId) && !cloudInvoiceIdsSet.has(item.invoiceId)) {
          orphanedItems.push(item);
        }
      });

      const emptyInvoices: any[] = [];
      dbInvoices.forEach((inv: any) => {
        if (!invoiceItemGroups[inv.id] || invoiceItemGroups[inv.id].length === 0) {
          emptyInvoices.push(inv);
        }
      });

      setAuditResults({
        lastChecked: new Date(),
        invoiceCounter: {
          registered: registeredLastInvoice,
          actualMax: maxInvoiceNum,
          conflict: invoiceCounterConflict
        },
        otherInvoiceCounter: {
          registered: registeredLastOtherInvoice,
          actualMax: maxOtherInvoiceNum,
          conflict: otherInvoiceCounterConflict
        },
        customerCounter: {
          registered: registeredLastCustomer,
          actualMax: maxCustomerNum,
          conflict: customerCounterConflict
        },
        missingInvoiceNumbers,
        missingOtherInvoiceNumbers,
        missingCustomerNumbers,
        totalDiscrepancies,
        statusDiscrepancies,
        paymentImbalances,
        orphanedItems,
        emptyInvoices,
        itemSyncDiscrepancies,
        missingInCloudItems,
        missingInLocalItems
      });
    } catch (e: any) {
      console.error('Audit calculations failed:', e);
    } finally {
      setIsAuditing(false);
    }
  };

  const repairAllDiscrepancies = async () => {
    if (!auditResults) return;
    setRepairProgress({ status: 'running', message: 'جاري تسوية البيانات وتحديث قواعد الفحص التلقائي...' });

    try {
      const itemsRes = await localDb.query('SELECT * FROM invoice_items');
      const dbItems = itemsRes.values || [];

      let step = 1;
      const totalSteps = 7;

      if (auditResults.invoiceCounter.conflict || (auditResults.missingInvoiceNumbers && auditResults.missingInvoiceNumbers.length > 0)) {
        setRepairProgress({ status: 'running', message: `[${step}/${totalSteps}] جاري ترقيم وتصحيح عدّاد الفواتير...` });
        let currentMax = auditResults.invoiceCounter.actualMax;
        if (auditResults.missingInvoiceNumbers && auditResults.missingInvoiceNumbers.length > 0) {
          for (const inv of auditResults.missingInvoiceNumbers) {
            currentMax++;
            await updateDoc(doc(db, 'invoices', inv.id), { invoiceNumber: String(currentMax) });
            const matchingItems = dbItems.filter((it: any) => it.invoiceId === inv.id);
            for (const item of matchingItems) {
              await updateDoc(doc(db, 'invoice_items', item.id), { invoiceNumber: String(currentMax) });
            }
          }
        }
        await setDoc(doc(db, 'settings', 'app'), { lastInvoiceNumber: currentMax }, { merge: true });
        setInvoiceCounter(currentMax);
      }
      
      if (auditResults.otherInvoiceCounter?.conflict || (auditResults.missingOtherInvoiceNumbers && auditResults.missingOtherInvoiceNumbers.length > 0)) {
        setRepairProgress({ status: 'running', message: `[${step}/${totalSteps}] جاري ترقيم وتصحيح عدّاد فواتير المبيعات...` });
        let currentMax = auditResults.otherInvoiceCounter.actualMax;
        if (auditResults.missingOtherInvoiceNumbers && auditResults.missingOtherInvoiceNumbers.length > 0) {
          for (const inv of auditResults.missingOtherInvoiceNumbers) {
            currentMax++;
            const newNum = `O-${currentMax}`;
            await updateDoc(doc(db, 'invoices', inv.id), { invoiceNumber: newNum });
            const matchingItems = dbItems.filter((it: any) => it.invoiceId === inv.id);
            for (const item of matchingItems) {
              await updateDoc(doc(db, 'invoice_items', item.id), { invoiceNumber: newNum });
            }
          }
        }
        await setDoc(doc(db, 'settings', 'app'), { lastOtherInvoiceNumber: currentMax }, { merge: true });
      }
      step++;

      if (auditResults.customerCounter.conflict || (auditResults.missingCustomerNumbers && auditResults.missingCustomerNumbers.length > 0)) {
        setRepairProgress({ status: 'running', message: `[${step}/${totalSteps}] جاري ترقيم وتصحيح عدّاد العملاء...` });
        let currentMax = auditResults.customerCounter.actualMax;
        if (auditResults.missingCustomerNumbers && auditResults.missingCustomerNumbers.length > 0) {
          for (const cust of auditResults.missingCustomerNumbers) {
            currentMax++;
            await updateDoc(doc(db, 'customers', cust.id), { customerNumber: currentMax });
          }
        }
        await setDoc(doc(db, 'settings', 'app'), { lastCustomerNumber: currentMax }, { merge: true });
        setCustomerCounter(currentMax);
      }
      step++;

      if (
        (auditResults.itemSyncDiscrepancies && auditResults.itemSyncDiscrepancies.length > 0) ||
        (auditResults.missingInCloudItems && auditResults.missingInCloudItems.length > 0) ||
        (auditResults.missingInLocalItems && auditResults.missingInLocalItems.length > 0)
      ) {
        setRepairProgress({ status: 'running', message: `[${step}/${totalSteps}] جاري توحيد ومزامنة أجهزة الفواتير (invoice_items) بين السحابي والمحلي...` });
        
        for (const item of (auditResults.missingInCloudItems || [])) {
          await FirebaseProviderInstance.setDoc('invoice_items', item.id, item);
          const localInvRes = await LocalProviderInstance.getDoc('invoices', item.invoiceId);
          if (localInvRes.exists()) {
            await FirebaseProviderInstance.setDoc('invoices', item.invoiceId, localInvRes.data(), { merge: true });
          }
        }

        for (const item of (auditResults.missingInLocalItems || [])) {
          await LocalProviderInstance.setDoc('invoice_items', item.id, item, undefined, 'BYPASS_OUTBOX');
          const cloudInvRes = await FirebaseProviderInstance.getDoc('invoices', item.invoiceId);
          if (cloudInvRes.exists()) {
            await LocalProviderInstance.setDoc('invoices', item.invoiceId, cloudInvRes.data(), undefined, 'BYPASS_OUTBOX');
          }
        }
      }
      step++;

      if (auditResults.totalDiscrepancies.length > 0 || (auditResults.itemSyncDiscrepancies && auditResults.itemSyncDiscrepancies.length > 0)) {
        setRepairProgress({ status: 'running', message: `[${step}/${totalSteps}] إعادة احتساب ومطابقة مجاميع الفواتير بناءً على أجهزتها الحقيقية...` });
        
        const localItemsSnap = await LocalProviderInstance.getDocs('invoice_items');
        const localItems = localItemsSnap.docs ? localItemsSnap.docs.map((d: any) => d.data()) : (localItemsSnap || []);
        
        const localInvoicesSnap = await LocalProviderInstance.getDocs('invoices');
        const localInvoices = localInvoicesSnap.docs ? localInvoicesSnap.docs.map((d: any) => d.data()) : (localInvoicesSnap || []);

        for (const inv of localInvoices) {
          const invItems = localItems.filter((it: any) => it.invoiceId === inv.id);
          if (invItems.length > 0) {
            const sumCost = invItems.reduce((sum: number, it: any) => sum + (Number(it.cost) || 0), 0);
            if (Math.abs(Number(inv.totalCost) - sumCost) > 0.01) {
              await LocalProviderInstance.updateDoc('invoices', inv.id, { totalCost: sumCost });
          
    try {
                await FirebaseProviderInstance.updateDoc('invoices', inv.id, { totalCost: sumCost });
              } catch (e) {}
            }
          }
        }
      }
      step++;

      if (auditResults.statusDiscrepancies.length > 0) {
        setRepairProgress({ status: 'running', message: `[${step}/${totalSteps}] مزامنة الحالة الفنية لـ ${auditResults.statusDiscrepancies.length} فواتير...` });
        for (const item of auditResults.statusDiscrepancies) {
      
    try {
            await updateDoc(doc(db, 'invoices', item.id), { status: item.expectedStatus });
          } catch (e) {
            console.warn("Failed updating cloud invoice status", e);
          }
      
    try {
            await localDb.run("UPDATE invoices SET status = ? WHERE id = ?", [item.expectedStatus, item.id]);
            await LocalProviderInstance.updateDoc('invoices', item.id, { status: item.expectedStatus });
          } catch (e) {
            console.warn("Failed updating local invoice status", e);
          }
        }
      }
      step++;

      if (auditResults.paymentImbalances.length > 0) {
        setRepairProgress({ status: 'running', message: `[${step}/${totalSteps}] موازنة وتسجيل المعاملات المالية المفقودة لـ ${auditResults.paymentImbalances.length} حالة...` });
        for (const item of auditResults.paymentImbalances) {
          if (item.amountInLedger === 0 && item.amountPaidOnInvoice > 0) {
            const txId = `tx_audit_${item.invoiceNumber}_${Math.random().toString(36).substring(2, 6)}`;
            const txData = {
              id: txId,
              currency: item.currency,
              amount: Number(item.amountPaidOnInvoice),
              customerName: item.customerName || 'عميل نقدي',
              invoiceNumber: String(item.invoiceNumber),
              userName: user.name || 'المدير العام',
              userNumber: 1,
              userId: user.id || 'primary-admin',
              timestamp: serverTimestamp(),
              type: 'receipt',
              notes: `قيد تسوية لمطابقة المدفوع بالفاتورة #${item.invoiceNumber}`
            };
            await addDoc(collection(db, 'vault_transactions'), txData);
        
    try {
              await LocalProviderInstance.setDoc('vault_transactions', txId, {
                ...txData,
                timestamp: new Date().toISOString()
              }, undefined, 'BYPASS_OUTBOX');
            } catch (e) {}
          } else if (item.amountInLedger > 0 && item.amountPaidOnInvoice !== item.amountInLedger) {
            let newStatus = item.status;
            if (item.amountInLedger >= item.totalCost) {
              newStatus = 'delivered';
            }
            await updateDoc(doc(db, 'invoices', item.id), { 
              amountPaid: item.amountInLedger,
              status: newStatus
            });
        
    try {
              await localDb.run("UPDATE invoices SET amountPaid = ?, status = ? WHERE id = ?", [item.amountInLedger, newStatus, item.id]);
            } catch (e) {}
          }
        }
      }
      step++;

      if (auditResults.orphanedItems.length > 0) {
        setRepairProgress({ status: 'running', message: `[${step}/${totalSteps}] حذف وإزالة ${auditResults.orphanedItems.length} قطعة غيار يتيمة...` });
        for (const item of auditResults.orphanedItems) {
          await deleteDoc(doc(db, 'invoice_items', item.id));
        }
      }
      step++;


      // Recalculate fund balances
      setRepairProgress({ status: 'running', message: `[${step}/${totalSteps}] إعادة احتساب أرصدة الصناديق من القيود المالية...` });
  
    try {
        const txsSnap = await FirebaseProviderInstance.getDocs('vault_transactions');
        const cloudTxs = txsSnap.docs ? txsSnap.docs.map(d => d.data()) : [];
        const fundsSnap = await FirebaseProviderInstance.getDocs('fin_funds');
        const cloudFunds = fundsSnap.docs ? fundsSnap.docs.map(d => d.data()) : [];
        
        for (const fund of cloudFunds) {
          const fundTxs = cloudTxs.filter(tx => tx.fundId === fund.id);
          let newBalance = 0;
          fundTxs.forEach(tx => {
            if (tx.type === 'receipt') {
              newBalance += Math.abs(Number(tx.amount || 0));
            } else if (tx.type === 'payment') {
              newBalance -= Math.abs(Number(tx.amount || 0));
            }
          });
          
          await updateDoc(doc(db, 'fin_funds', fund.id), { balance: newBalance });
          await localDb.run('UPDATE fin_funds SET balance = ? WHERE id = ?', [newBalance, fund.id]);
        }
      } catch (e) {
        console.error('Failed to recalculate funds:', e);
      }
      step++;

      setRepairProgress({ status: 'completed', message: 'تم التحديث وتسوية وتوحيد أجهزة الفواتير وقواعد الاختلافات بنجاح! جميع أرقام العدادات والمعاملات والأجهزة تتوافق 100% بين القاعدة المحلية والمخدم السحابي.' });
      await runDatabaseAudit();
      await refreshStats();
    } catch (e: any) {
      console.error('Auto repair failed:', e);
      setRepairProgress({ status: 'error', message: `حدث خطأ أثناء الإصلاح: ${e.message || e}` });
    }
  };

  const handleSaveSettings = async () => {
    const settings = {
      biometricEnabled,
      pinEnabled,
      pinCode,
      autoBackup,
      backupTime,
      backupPath,
      backupCustomName,
      appearance,
      printPaperSize
    };
    localStorage.setItem('snd_settings', JSON.stringify(settings));

    // Update biometric credentials secure storage

    try {
      const info = await Device.getInfo();
      if (biometricEnabled) {
        if (info.platform === 'web') {
          localStorage.setItem('snd_bio_credentials', JSON.stringify({
            username: user.username,
            password: user.password
          }));
          localStorage.setItem('snd_has_bio_credentials', 'true');
        } else {
          await NativeBiometric.setCredentials({
            username: user.username,
            password: user.password,
            server: 'com.snd.maintenance'
          });
          localStorage.setItem('snd_has_bio_credentials', 'true');
        }
      } else {
        if (info.platform === 'web') {
          localStorage.removeItem('snd_bio_credentials');
          localStorage.removeItem('snd_has_bio_credentials');
        } else {
          try {
            await NativeBiometric.deleteCredentials({
              server: 'com.snd.maintenance'
            });
          } catch (e) {}
          localStorage.removeItem('snd_has_bio_credentials');
        }
      }
    } catch (err) {
      console.warn("Could not sync biometric credentials in Settings:", err);
    }

    setDoc(doc(db, 'settings', 'app'), { 
      appSettings: settings,
      lastInvoiceNumber: Number(invoiceCounter),
      lastCustomerNumber: Number(customerCounter)
    }, { merge: true });
    alert(t('settings.saved'));
    window.dispatchEvent(new Event('snd_settings_changed'));
  };

  const handleSave = async () => {
    setSaving(true);
    let SE: any = null;
    try {
      await setDoc(doc(db, 'settings', 'app'), { lastInvoiceNumber: Number(invoiceCounter) }, { merge: true });
      alert(t('settings.saved'));
    } catch (e) {
      console.error(e);
    } finally {
      if (typeof SE !== "undefined" && SE) SE.resumeSync();
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut();
    } else {
      sessionStorage.removeItem('snd_user');
      window.location.reload();
    }
  };

  const resetAllDataTemp = async (bypassConfirm = false) => {
    console.log('ResetAllDataTemp started executing', { bypassConfirm });
    if (!bypassConfirm) {
      setShowResetConfirm(true);
      return;
    }

    let SE: any = null;
    try {
      SE = (await import("../data/SyncEngine")).SyncEngine;
      if (SE && typeof SE.acquireGlobalLock === 'function') {
        await SE.acquireGlobalLock('FACTORY_RESET');
      } else if (SE && typeof SE.pauseSync === 'function') {
        SE.pauseSync();
      }
    } catch (e) {}

    try {
      setSaving(true);
      console.log('Starting factory reset process...');
      setProgress({ active: true, value: 10, label: 'جاري تهيئة النظام...' });

      const dbMode = ProviderFactory.getMode();

      // 1. Clear Firestore collections (if in CLOUD or AUTO mode)
      if (dbMode === 'CLOUD' || dbMode === 'AUTO') {
        try {
          const collectionsToClear = [
            'invoices', 'invoice_items', 'customers', 'maintenance_actions', 
            'approval_actions', 'vault_transactions', 
            'inventory_items', 'document_outputs', 'fin_transaction_types',
            'fin_funds', 'fin_currencies', 'fin_payment_methods', 'user_devices',
            'job_titles', 'device_categories', 'device_models', 'engineers'
          ];
          
          let colIdx = 0;
          for (const colName of collectionsToClear) {
            colIdx++;
            const percent = Math.round(10 + (colIdx / collectionsToClear.length) * 35);
            setProgress({ active: true, value: percent, label: `جاري تهيئة السحاب: ${colName}...` });
            const snap = await getDocs(collection(db, colName));
            for (const docSnap of snap.docs) {
              await deleteDoc(docSnap.ref).catch(e => console.warn(`Error deleting doc ${docSnap.id}:`, e));
            }
          }

          // Clear all users in Firestore and reset primary admin
          setProgress({ active: true, value: 45, label: 'جاري تهيئة حسابات المستخدمين في السحاب...' });
          const usersSnap = await getDocs(collection(db, 'users'));
          for (const docSnap of usersSnap.docs) {
            if (docSnap.id === 'primary-admin') {
              await setDoc(docSnap.ref, {
                id: 'primary-admin',
                username: 'admin',
                password: 'admin',
                name: 'المدير العام',
                role: 'admin',
                isPrimary: true,
                userNumber: 100,
                isActive: true
              });
            } else {
              await deleteDoc(docSnap.ref).catch(e => console.warn(`Error deleting user doc ${docSnap.id}:`, e));
            }
          }
          await setDoc(doc(db, 'users', 'primary-admin'), {
            id: 'primary-admin',
            username: 'admin',
            password: 'admin',
            name: 'المدير العام',
            role: 'admin',
            isPrimary: true,
            userNumber: 100,
            isActive: true
          });

          // Reset Counter settings in Firestore
          await setDoc(doc(db, 'settings', 'app'), { 
            lastInvoiceNumber: 0, 
            lastCustomerNumber: 0
          }, { merge: true });

        } catch (fsErr) {
          console.warn('Firestore reset failed/skipped:', fsErr);
        }
      }

      // 2. Clear Local SQLite (if in LOCAL or AUTO mode)
      if (dbMode === 'LOCAL' || dbMode === 'AUTO') {
        setProgress({ active: true, value: 50, label: 'جاري تنظيف قاعدة البيانات المحلية...' });
        const tablesToClear = [
          'invoices', 'invoice_items', 'customers', 'maintenance_actions', 
          'approval_actions', 'vault_transactions', 
          'inventory_items', 'document_outputs', 'fin_transaction_types',
          'fin_funds', 'fin_currencies', 'fin_payment_methods', 'user_devices',
          'job_titles', 'device_categories', 'device_models', 'engineers'
        ];
        
        let tableIdx = 0;
        for (const table of tablesToClear) {
          tableIdx++;
          const percent = Math.round(50 + (tableIdx / tablesToClear.length) * 35);
          setProgress({ active: true, value: percent, label: `جاري تنظيف جدول: ${table}...` });
          
          try {
            await localDb.run(`DELETE FROM ${table}`);
            await localDb.run(`DELETE FROM outbox WHERE tableName = ?`, [table]).catch(() => {});
          } catch (e) {
            console.error(`Error clearing table ${table}`, e);
          }
        }

        // Clear all users in SQLite and insert primary admin
        try {
          await localDb.run(`DELETE FROM users`);
          await localDb.run(`INSERT INTO users (id, username, password, name, role, isPrimary, userNumber, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
            ['primary-admin', 'admin', 'admin', 'المدير العام', 'admin', 1, 100, 1]);
        } catch (e) {
          console.error(`Error resetting users in SQLite`, e);
        }

        // Reset funds balances
        try {
          await localDb.run(`UPDATE fin_funds SET balance = 0`);
        } catch (e) {
          console.error('Error resetting funds balances', e);
        }
      }

      // 3. Clear LocalStorage settings
      localStorage.removeItem('snd_has_bio_credentials');
      localStorage.removeItem('snd_bio_credentials');
      localStorage.setItem('snd_db_seeded', 'true');
      sessionStorage.removeItem('alertsClosed');
      sessionStorage.removeItem('snd_user');

      setProgress({ active: false, value: 100, label: 'تم الحذف بنجاح!' });
      setSaving(false);
      
      // Show custom success status modal
      setResetStatus({ type: 'success', message: 'تمت تهيئة النظام وتصفير كافة البيانات بنجاح! سيتم إعادة تشغيل التطبيق تلقائياً بعد ثانيتين لإتمام العملية...' });
      setTimeout(() => {
        window.location.reload();
      }, 2500);
      
    } catch (e: any) {
      console.error('Error during resetAllDataTemp:', e);
      setSaving(false);
      setProgress({ active: false, value: 0, label: '' });
      setResetStatus({ type: 'error', message: 'حدث خطأ غير متوقع أثناء تهيئة النظام: ' + (e.message || e) });
    } finally {
      if (SE) {
        try {
          if (typeof SE.releaseGlobalLock === 'function') {
            await SE.releaseGlobalLock();
          } else if (typeof SE.resumeSync === 'function') {
            SE.resumeSync();
          }
        } catch (err) {}
      }
    }
  };

  const handlePreciseReset = async () => {
    if (hybridDbType === 'none') return;
    
    setPreciseResetLoading(true);
    setHybridResult({ type: null, message: '' });

    let SE: any = null;
    try {
      SE = (await import("../data/SyncEngine")).SyncEngine;
      if (SE && typeof SE.acquireGlobalLock === 'function') {
        await SE.acquireGlobalLock('PRECISE_RESET');
      } else if (SE && typeof SE.pauseSync === 'function') {
        SE.pauseSync();
      }
    } catch (e) {}
    
    const targetIsCloud = hybridDbType === 'CLOUD';
    const dbLabel = targetIsCloud ? 'السحابية' : 'المحلية';
    
    setProgress({ active: true, value: 5, label: `جاري التهيئة الدقيقة للقاعدة ${dbLabel}...` });

    const failures: string[] = [];

    try {
      const mainTables = [
        'invoices', 'invoice_items', 'customers', 'maintenance_actions', 
        'approval_actions', 'vault_transactions', 'inventory_items', 'document_outputs'
      ];
      const categoryTables = ['device_categories', 'device_models'];
      const engineerTables = ['engineers'];
      const shopTables = ['company_details', 'settings'];
      const financialTables = ['fin_transaction_types', 'fin_funds', 'fin_currencies', 'fin_payment_methods', 'user_devices', 'job_titles'];

      const allTables = hybridSelectedTables;

      if (targetIsCloud) {
        // 1. Clear CLOUD tables
        let idx = 0;
        for (const table of allTables) {
          idx++;
          const percent = Math.round(5 + (idx / allTables.length) * 60);
          setProgress({ active: true, value: percent, label: `جاري مسح السحاب: ${table}...` });
          
          if (table === 'users') continue; // Handled separately

          try {
            const snap = await FirebaseProviderInstance.getDocs(table);
            for (const docSnap of snap.docs) {
              await FirebaseProviderInstance.deleteDoc(table, docSnap.id);
            }
          } catch (e: any) {
            console.error(`Error clearing Firestore table ${table}:`, e);
            failures.push(`جدول ${table}: ${e.message || e}`);
          }
        }

        // Re-create settings/app in CLOUD
        if (allTables.includes('settings')) {
          setProgress({ active: true, value: 75, label: 'جاري إعادة ضبط العدادات في السحاب...' });
          try {
            await FirebaseProviderInstance.setDoc('settings', 'app', { 
              lastInvoiceNumber: 0, 
              lastCustomerNumber: 0
            });
          } catch (e: any) {
            console.error('Failed to reset app settings in Firestore:', e);
            failures.push(`إعادة تعيين العدادات: ${e.message || e}`);
          }
        }

        // Clear users except primary admin in CLOUD
        if (allTables.includes('users')) {
          setProgress({ active: true, value: 85, label: 'جاري تهيئة حسابات المستخدمين في السحاب...' });
          try {
            const usersSnap = await FirebaseProviderInstance.getDocs('users');
            for (const docSnap of usersSnap.docs) {
              if (docSnap.id === 'primary-admin') {
                await FirebaseProviderInstance.setDoc('users', 'primary-admin', {
                  id: 'primary-admin',
                  username: 'admin',
                  password: 'admin',
                  name: 'المدير العام',
                  role: 'admin',
                  isPrimary: true,
                  userNumber: 100,
                  isActive: true
                });
              } else {
                await FirebaseProviderInstance.deleteDoc('users', docSnap.id);
              }
            }
          } catch (e: any) {
            console.error('Failed to reset users in Firestore:', e);
            failures.push(`تهيئة المستخدمين: ${e.message || e}`);
          }
        }

      } else {
        // 2. Clear LOCAL tables
        let idx = 0;
        for (const table of allTables) {
          idx++;
          const percent = Math.round(5 + (idx / allTables.length) * 60);
          setProgress({ active: true, value: percent, label: `جاري مسح جدول المحلي: ${table}...` });
          
          if (table === 'users') continue; // Handled separately

          try {
            await localDb.run(`DELETE FROM ${table}`);
            await localDb.run(`DELETE FROM outbox WHERE tableName = ?`, [table]).catch(() => {});
          } catch (e: any) {
            console.error(`Error clearing SQLite table ${table}:`, e);
            failures.push(`جدول ${table}: ${e.message || e}`);
          }
        }

        // Clear users except primary admin in LOCAL
        if (allTables.includes('users')) {
          setProgress({ active: true, value: 75, label: 'جاري تهيئة حسابات المستخدمين في المحلي...' });
          try {
            await localDb.run(`DELETE FROM users`);
            await localDb.run(`INSERT INTO users (id, username, password, name, role, isPrimary, userNumber, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
              ['primary-admin', 'admin', 'admin', 'المدير العام', 'admin', 1, 100, 1]);
          } catch (e: any) {
            console.error(`Error resetting users in SQLite:`, e);
            failures.push(`تهيئة المستخدمين: ${e.message || e}`);
          }
        }

        // Reset local funds balances
        if (allTables.includes('fin_funds')) {
          setProgress({ active: true, value: 85, label: 'جاري إعادة تعيين الخزائن...' });
          try {
            await localDb.run(`UPDATE fin_funds SET balance = 0`);
          } catch (e: any) {
            console.error('Error resetting funds balances in SQLite:', e);
            failures.push(`إعادة تعيين الخزائن: ${e.message || e}`);
          }
        }
      }

      // Common final tasks
      setProgress({ active: true, value: 95, label: 'جاري إنهاء العملية...' });
      localStorage.removeItem('snd_has_bio_credentials');
      localStorage.removeItem('snd_bio_credentials');
      localStorage.setItem('snd_db_seeded', 'true');
      sessionStorage.removeItem('alertsClosed');
      sessionStorage.removeItem('snd_user');

      setProgress({ active: false, value: 100, label: '' });
      setPreciseResetLoading(false);
      
      if (failures.length > 0) {
        setHybridResult({ 
          type: 'error', 
          message: `حدثت بعض الأخطاء أثناء التهيئة الدقيقة لـ ${dbLabel}:\n` + failures.join('\n')
        });
      } else {
        setHybridResult({ 
          type: 'success', 
          message: `تمت التهيئة الدقيقة لجميع جداول ومكونات القاعدة ${dbLabel} بنجاح! سيتم إعادة تحميل التطبيق تلقائياً بعد ثانيتين...` 
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 2500);
      }

    } catch (error: any) {
      console.error('Error during precise reset:', error);
      setProgress({ active: false, value: 0, label: '' });
      setPreciseResetLoading(false);
      setHybridResult({ 
        type: 'error', 
        message: `فشلت التهيئة الدقيقة: ${error.message || error}` 
      });
    } finally {
      if (SE) {
        try {
          if (typeof SE.releaseGlobalLock === 'function') {
            await SE.releaseGlobalLock();
          } else if (typeof SE.resumeSync === 'function') {
            SE.resumeSync();
          }
        } catch (err) {}
      }
    }
  };

  const handleTransferData = async () => {
    if (hybridDbType === 'none') return;
    
    setDataTransferLoading(true);
    setHybridResult({ type: null, message: '' });
    setProgress({ active: true, value: 5, label: 'جاري بدء عملية نقل البيانات...' });

    const failures: string[] = [];

    let SE: any = null;
    try {
      SE = (await import("../data/SyncEngine")).SyncEngine;
      if (SE && typeof SE.acquireGlobalLock === 'function') {
        await SE.acquireGlobalLock('DATA_TRANSFER');
      } else if (SE && typeof SE.pauseSync === 'function') {
        SE.pauseSync();
      }
    } catch (e) {}

    try {
      const defaultTables = [
        'company_details',
        'customers',
        'invoices',
        'invoice_items',
        'vault_transactions',
        'maintenance_actions',
        'device_categories',
        'device_models',
        'approval_actions',
        'settings',
        'users',
        'engineers',
        'inventory_items',
        'fin_transaction_types',
        'fin_funds',
        'fin_currencies',
        'fin_payment_methods',
        'document_outputs',
        'user_devices',
        'job_titles'
      ];
      
      const tables = hybridSelectedTables;

      const sourceIsCloud = hybridDbType === 'CLOUD';
      const sourceLabel = sourceIsCloud ? 'السحابية' : 'المحلية';
      const destLabel = sourceIsCloud ? 'المحلية' : 'السحابية';

      // 0. Check if source database has any user/business data
      setProgress({ active: true, value: 3, label: `جاري التحقق من وجود بيانات في القاعدة المصدر (${sourceLabel})...` });
      const businessTables = [
        'company_details',
        'customers',
        'invoices',
        'invoice_items',
        'vault_transactions',
        'maintenance_actions',
        'device_categories',
        'device_models',
        'approval_actions',
        'engineers',
        'inventory_items',
        'document_outputs',
        'job_titles'
      ];

      let totalBusinessRecords = 0;
      for (const table of businessTables) {
        try {
          if (sourceIsCloud) {
            const snap = await FirebaseProviderInstance.getDocs(table);
            totalBusinessRecords += snap.docs.length;
          } else {
            const snap = await LocalProviderInstance.getDocs(table);
            totalBusinessRecords += snap.docs.length;
          }
        } catch (e) {
          console.warn(`Error checking if source table ${table} is empty:`, e);
        }
      }

      if (totalBusinessRecords === 0) {
        setProgress({ active: false, value: 0, label: '' });
        setDataTransferLoading(false);
        setHybridResult({ 
          type: 'error', 
          message: `عذراً، قاعدة البيانات المصدر (${sourceLabel}) فارغة تماماً ولا تحتوي على أي بيانات أو فواتير أو عملاء لنقلها!` 
        });
        return;
      }

      let tableIdx = 0;
      for (const table of tables) {
        tableIdx++;
        const percent = Math.round(5 + (tableIdx / tables.length) * 90);
        setProgress({ 
          active: true, 
          value: percent, 
          label: `جاري نقل جدول ${table} من القاعدة ${sourceLabel} إلى ${destLabel}...` 
        });

        // 1. Fetch from source
        let records: any[] = [];
        try {
          if (sourceIsCloud) {
            const snap = await FirebaseProviderInstance.getDocs(table);
            records = snap.docs.map((d: any) => d.data());
          } else {
            const snap = await LocalProviderInstance.getDocs(table);
            records = snap.docs.map((d: any) => d.data());
          }
        } catch (e: any) {
          console.error(`Error reading table ${table} from source ${sourceLabel}:`, e);
          failures.push(`فشل قراءة جدول ${table}: ${e.message || e}`);
          continue; // Skip copying if read failed
        }

        // 2. Clear destination table first so we don't merge old with new!
        if (sourceIsCloud) {
          // Destination is LOCAL: Clear local SQLite table
          try {
            await localDb.run(`DELETE FROM ${table}`);
          } catch (e: any) {
            console.error(`Error clearing local table ${table} before transfer:`, e);
            failures.push(`فشل تصفير جدول المحلي ${table}: ${e.message || e}`);
          }
        } else {
          // Destination is CLOUD: Clear Firestore collection
          try {
            const targetSnap = await FirebaseProviderInstance.getDocs(table);
            for (const docSnap of targetSnap.docs) {
              await FirebaseProviderInstance.deleteDoc(table, docSnap.id);
            }
          } catch (e: any) {
            console.error(`Error clearing cloud table ${table} before transfer:`, e);
            failures.push(`فشل تصفير جدول السحاب ${table}: ${e.message || e}`);
          }
        }

        // 3. Write records to destination
        for (const record of records) {
          if (!record || !record.id) continue;
          try {
            if (sourceIsCloud) {
              // CLOUD -> LOCAL: Bypass outbox queuing to prevent loop
              await LocalProviderInstance.setDoc(table, record.id, record, undefined, 'BYPASS_OUTBOX');
            } else {
              // LOCAL -> CLOUD
              await FirebaseProviderInstance.setDoc(table, record.id, record);
            }
          } catch (e: any) {
            console.error(`Error writing record to destination table ${table}:`, e);
            failures.push(`فشل كتابة سجل في جدول ${table}: ${e.message || e}`);
          }
        }
      }

      try {
        const targetProvider = sourceIsCloud ? LocalProviderInstance : FirebaseProviderInstance;
        const targetInvoicesSnap = await targetProvider.getDocs('invoices');
        let maxInv = 0;
        targetInvoicesSnap.docs.forEach((d: any) => {
          const num = parseInt(d.data()?.invoiceNumber, 10);
          if (!isNaN(num) && num > maxInv) maxInv = num;
        });

        const targetCustomersSnap = await targetProvider.getDocs('customers');
        let maxCust = 0;
        targetCustomersSnap.docs.forEach((d: any) => {
          const num = parseInt(d.data()?.customerNumber, 10);
          if (!isNaN(num) && num > maxCust) maxCust = num;
        });

        await targetProvider.setDoc('settings', 'app', {
          lastInvoiceNumber: maxInv,
          lastCustomerNumber: maxCust
        }, { merge: true }, 'BYPASS_OUTBOX');
      } catch (err) {
        console.warn('Failed to recalibrate target counters after transfer:', err);
      }

      setProgress({ active: false, value: 100, label: '' });
      setDataTransferLoading(false);

      if (failures.length > 0) {
        setHybridResult({ 
          type: 'error', 
          message: `اكتملت عملية نقل البيانات مع وجود بعض المشاكل:\n` + failures.slice(0, 10).join('\n') + (failures.length > 10 ? '\n...وغيرها' : '')
        });
      } else {
        setHybridResult({ 
          type: 'success', 
          message: `تم بنجاح نقل كافة البيانات من القاعدة ${sourceLabel} إلى القاعدة ${destLabel} وتحديث جميع السجلات بشكل متطابق ونظيف!` 
        });
      }
    } catch (error: any) {
      console.error('Error during data transfer:', error);
      setProgress({ active: false, value: 0, label: '' });
      setDataTransferLoading(false);
      setHybridResult({ 
        type: 'error', 
        message: `حدث خطأ أثناء نقل البيانات: ${error.message || error}` 
      });
    } finally {
      if (SE) {
        try {
          if (typeof SE.releaseGlobalLock === 'function') {
            await SE.releaseGlobalLock();
          } else if (typeof SE.resumeSync === 'function') {
            SE.resumeSync();
          }
        } catch (err) {}
      }
    }
  };



  const categories = [
    { id: 'general', title: t('settings.general'), icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'advanced-management', title: 'إدارة متقدمة', icon: SettingsIcon, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { id: 'accounting-inputs', title: 'مدخلات البيانات الرئيسية', icon: Calculator, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'categories-engineers', title: 'تصنيفات الأجهزة والمهندسين', icon: Cpu, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { id: 'users', title: t('settings.users'), icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { id: 'security', title: t('settings.security'), icon: Shield, color: 'text-orange-500', bg: 'bg-orange-500/10' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 h-full overflow-y-auto pb-20 sm:pb-8">
      {/* Progress Overlay */}
      {progress.active && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-white font-bold mb-4">{progress.label}</h3>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
               <motion.div 
                 className="h-full bg-blue-500"
                 initial={{ width: 0 }}
                 animate={{ width: `${progress.value}%` }}
               />
            </div>
            <p className="text-gray-500 text-xs mt-2">{Math.round(progress.value)}%</p>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => (
          !canShowCategory(cat.id) ? null : (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setActiveTab(cat.id as any)}
              className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-[1.25rem] border border-white/5 hover:border-white/10 transition-all text-left rtl:text-right group shadow-lg"
            >
              <div className={`p-2.5 ${cat.bg} ${cat.color} rounded-xl group-hover:scale-105 transition-transform`}>
                <cat.icon size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-white">{cat.title}</h3>
                <p className="text-[9px] text-gray-500 mt-0.5">إعدادات القسم وتحكم متقدم</p>
              </div>
              <div className="text-gray-600 group-hover:text-white transition-colors text-sm">
                 {i18n.language === 'ar' ? '←' : '→'}
              </div>
            </motion.button>
          )
        ))}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSignOut}
          className="col-span-full mt-2 flex items-center justify-center p-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-[1.5rem] border border-red-500/20 transition-all font-bold shadow-lg group"
          title={t('common.signOut')}
        >
          <LogOut size={24} className="group-hover:scale-110 transition-transform" />
        </motion.button>
      </div>

      {/* Independent Window / Modal Overlay */}
      <AnimatePresence>
        {activeTab !== 'main' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-8 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121212] w-full max-w-4xl h-screen sm:h-auto sm:max-h-[90vh] rounded-none sm:rounded-[2rem] border-0 sm:border sm:border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Unified Header */}
              <div className="flex items-center px-4 py-3 border-b border-white/10 bg-[#121212]/80 backdrop-blur-xl z-20 sticky top-0" dir="rtl">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setActiveTab('main')}
                    className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
                  >
                    <ArrowRight size={18} />
                  </button>
                  <div>
                    <h1 className="text-lg font-black text-white m-0 p-0">
                      {activeTab === 'general' && t('settings.general')}
                      {activeTab === 'accounting-inputs' && 'مدخلات البيانات الرئيسية'}
                      {activeTab === 'security' && t('settings.security')}
                      {activeTab === 'users' && t('settings.users')}
                      {activeTab === 'categories-engineers' && 'تصنيفات الأجهزة والمهندسين'}
                      
                      {activeTab === 'advanced-management' && 'إدارة متقدمة'}
                    </h1>
                  </div>
                </div>
              </div>

              {/* Modal Content - Fixed, No Scroll */}
              <div className="flex-1 overflow-y-auto p-3 md:p-4 pb-28 sm:pb-8">
                {!canShowCategory(activeTab) ? (
                  <div className="text-center py-12 text-gray-400 font-cairo" dir="rtl">
                    <p className="text-lg font-bold">عذراً، ليس لديك صلاحية للوصول إلى هذا القسم.</p>
                  </div>
                ) : (
                  <>
                    {activeTab === 'general' && (
                  <div className="space-y-6 pb-8 text-right font-cairo" dir="rtl">
                    {/* Vertical list of general settings options */}
                    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto pt-4">
                      {/* 1. Language Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setGeneralSubTab('language');
                          setActiveGeneralModal('language');
                        }}
                        className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-orange-500/30 rounded-2xl transition-all group text-right shadow-lg cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-orange-600/10 text-orange-500 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all">
                            <Languages size={22} />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">اللغة والتحديث</h3>
                            <p className="text-xs text-gray-400 mt-1">تعديل لغة واجهة النظام وتحديث الإعدادات العامة</p>
                          </div>
                        </div>
                        <ChevronLeft size={20} className="text-gray-500 group-hover:text-white group-hover:translate-x-[-4px] transition-all" />
                      </button>

                      {/* 2. Advanced Settings Option */}
                      <button
                        type="button"
                        onClick={() => {
                          setGeneralSubTab('advanced');
                          setActiveGeneralModal('advanced');
                        }}
                        className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-orange-500/30 rounded-2xl transition-all group text-right shadow-lg cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-orange-600/10 text-orange-500 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-all">
                            <SettingsIcon size={22} />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">ضبط متقدم</h3>
                            <p className="text-xs text-gray-400 mt-1">تخصيص المظهر العام للنظام وإعدادات الطباعة الافتراضية</p>
                          </div>
                        </div>
                        <ChevronLeft size={20} className="text-gray-500 group-hover:text-white group-hover:translate-x-[-4px] transition-all" />
                      </button>

                    </div>

                    {/* Modals for general settings options */}
                    <AnimatePresence>
                      {activeGeneralModal !== null && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-sm">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#181818] border-0 sm:border sm:border-white/10 rounded-none sm:rounded-3xl p-6 sm:p-8 w-full max-w-4xl h-full sm:h-[85vh] shadow-2xl relative overflow-y-auto flex flex-col text-right font-cairo"
                            dir="rtl"
                          >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                              <h3 className="text-lg font-black text-white flex items-center gap-2">
                                {activeGeneralModal === 'language' && <Languages className="text-orange-500" size={20} />}
                                {activeGeneralModal === 'advanced' && <SettingsIcon className="text-orange-500" size={20} />}
                                {activeGeneralModal === 'database' && <Database className="text-orange-500" size={20} />}
                                {activeGeneralModal === 'language' && 'اللغة والتحديث'}
                                {activeGeneralModal === 'advanced' && 'ضبط إعدادات متقدمة والمظهر'}
                                {activeGeneralModal === 'database' && 'إعدادات قاعدة البيانات والمزامنة المتقدمة'}
                              </h3>
                              <button
                                type="button"
                                onClick={() => setActiveGeneralModal(null)}
                                className="p-2.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-white/5 cursor-pointer"
                                title="خروج / إغلاق"
                              >
                                <X size={20} />
                              </button>
                            </div>

                            {/* Modal Content container */}
                            <div className="flex-1 overflow-y-auto pr-1">
                              {activeGeneralModal === 'language' && (
                      <section className="space-y-6 animate-in fade-in duration-200">
                         <div className="p-5 md:p-6 bg-white/5 rounded-[1.5rem] sm:rounded-3xl border border-white/5 space-y-4">
                            <div className="flex items-center justify-between rtl:flex-row-reverse">
                               <h3 className="font-bold text-white text-lg">{t('settings.language')}</h3>
                               <button 
                                 onClick={handleSave}
                                 disabled={saving}
                                 className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg"
                               >
                                 {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                                 {t('settings.update')}
                               </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <button 
                                 onClick={() => i18n.changeLanguage('en')}
                                 className={`py-6 rounded-2.5xl border-2 font-bold transition-all ${i18n.language.startsWith('en') ? 'bg-orange-600/10 border-orange-600 text-orange-500 shadow-xl' : 'bg-black/20 border-white/5 text-gray-500 hover:text-white'}`}
                               >
                                 English
                               </button>
                               <button 
                                 onClick={() => i18n.changeLanguage('ar')}
                                 className={`py-6 rounded-2.5xl border-2 font-bold transition-all ${i18n.language.startsWith('ar') ? 'bg-orange-600/10 border-orange-600 text-orange-500 shadow-xl' : 'bg-black/20 border-white/5 text-gray-500 hover:text-white'}`}
                               >
                                 <span className="font-arabic">العربية</span>
                               </button>
                            </div>
                         </div>
                      </section>
                    )}
                    {activeGeneralModal === 'advanced' && (
                      <div className="space-y-6 animate-in fade-in duration-200 text-right">
                        {/* Header Box */}
                        <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-white text-lg">ضبط إعدادات متقدمة</h3>
                            <p className="text-xs text-gray-500 mt-1">تخصيص المظهر العام للنظام وإعدادات الطباعة الافتراضية</p>
                          </div>
                          <button
                            type="button"
                            onClick={handleSaveSettings}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all"
                          >
                            <Save size={16} />
                            حفظ الإعدادات المتقدمة
                          </button>
                        </div>

                        {/* Form elements inside Card */}
                        <div className="p-5 md:p-8 bg-white/5 rounded-[1.5rem] sm:rounded-3xl border border-white/5 space-y-6">
                          
                          {/* Row 1: المظهر العام */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-white/5">
                            <div>
                               <span className="font-bold text-white text-base">المظهر العام</span>
                               <p className="text-xs text-gray-500 mt-0.5">اختر المظهر المفضل لواجهة المستخدم للنظام</p>
                            </div>
                            <div className="flex gap-2 bg-black/40 p-1 rounded-xl border border-white/5 self-start sm:self-center">
                               <button
                                 type="button"
                                 onClick={() => setAppearance('normal')}
                                 className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${appearance === 'normal' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                               >
                                 عادي (مضيء)
                               </button>
                               <button
                                 type="button"
                                 onClick={() => setAppearance('dark')}
                                 className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${appearance === 'dark' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                               >
                                 مظلم (ليلي)
                               </button>
                            </div>
                          </div>

                          {/* Row 2: إعداد الطباعة */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 font-cairo">
                            <div>
                               <span className="font-bold text-white text-base">إعداد الطباعة والورق</span>
                               <p className="text-xs text-gray-500 mt-0.5">تحديد مقاس الورق الافتراضي عند طباعة الفواتير والسندات</p>
                            </div>
                            <div className="flex gap-2">
                               <select
                                 value={printPaperSize}
                                 onChange={(e) => setPrintPaperSize(e.target.value as 'A4' | '80mm')}
                                 className="bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-orange-500/50 appearance-none text-right font-bold pl-8"
                               >
                                  <option value="A4" className="bg-[#1c1c1c]">صفحة كاملة (عريض A4)</option>
                                  <option value="80mm" className="bg-[#1c1c1c]">ورق حراري (لفافة 80mm)</option>
                               </select>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}
                    {activeGeneralModal === 'database' && (
                      <div className="space-y-6 animate-in fade-in duration-200 text-right font-cairo">
                        {/* Header Box */}
                        <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-white text-lg">مصدر البيانات وقاعدة البيانات</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              اختر ما إذا كان التطبيق يستخدم قاعدة بيانات محلية، أو قاعدة بيانات سحابية (Firebase)، أو وضعاً تلقائياً وهجيناً يقوم بالتحويل تلقائياً عند انقطاع الإنترنت.
                            </p>
                          </div>
                        </div>

                        {/* Mode selectors */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <button
                            type="button"
                            onClick={() => handleSaveDbMode('LOCAL')}
                            className={`p-6 rounded-3xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${dbMode === 'LOCAL' ? 'bg-orange-600/10 border-orange-600 text-orange-500 shadow-xl' : 'bg-black/20 border-white/5 text-gray-400 hover:text-white hover:border-white/10'}`}
                          >
                            <HardDrive size={28} />
                            <div className="text-center">
                              <span className="block font-bold text-sm">إصدار محلي (LOCAL)</span>
                              <span className="text-[10px] text-gray-500 block mt-1">تشغيل البيانات محلياً على الهاتف/المتصفح عبر SQLite</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveDbMode('CLOUD')}
                            className={`p-6 rounded-3xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${dbMode === 'CLOUD' ? 'bg-orange-600/10 border-orange-600 text-orange-500 shadow-xl' : 'bg-black/20 border-white/5 text-gray-400 hover:text-white hover:border-white/10'}`}
                          >
                            <Globe size={28} />
                            <div className="text-center">
                              <span className="block font-bold text-sm">إصدار سحابي (CLOUD)</span>
                              <span className="text-[10px] text-gray-500 block mt-1">تخزين البيانات مباشرة على السحابة (Firebase Firestore)</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveDbMode('AUTO')}
                            className={`p-6 rounded-3xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-3 cursor-pointer ${dbMode === 'AUTO' ? 'bg-orange-600/10 border-orange-600 text-orange-500 shadow-xl' : 'bg-black/20 border-white/5 text-gray-400 hover:text-white hover:border-white/10'}`}
                          >
                            <Cpu size={28} />
                            <div className="text-center">
                              <span className="block font-bold text-sm">وضع تلقائي وهجين (AUTO)</span>
                              <span className="text-[10px] text-gray-500 block mt-1">استخدام السحابة عند توفر الإنترنت، والتبديل للمحلي عند انقطاعه</span>
                            </div>
                          </button>
                        </div>

                        {/* Status Card */}
                        <div className="p-5 md:p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                          <h4 className="font-bold text-white text-sm">الحالة والتشخيص الفعلي</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-black/30 rounded-2xl border border-white/5 flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-orange-600/10 text-orange-500">
                                <HardDrive size={18} />
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 block">مصدر البيانات النشط حالياً</span>
                                <span className="text-sm font-bold text-white">
                                  {activeProvider === 'CLOUD' ? 'السحابة (Firebase)' : 'قاعدة البيانات المحلية (SQLite)'}
                                </span>
                              </div>
                            </div>

                            <div className="p-4 bg-black/30 rounded-2xl border border-white/5 flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-orange-600/10 text-orange-500">
                                <Globe size={18} />
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 block">حالة اتصال الشبكة</span>
                                <span className={`text-sm font-bold ${navigator.onLine ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {navigator.onLine ? 'متصل بالإنترنت' : 'غير متصل بالإنترنت'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Sync Card */}
                        <div className="p-5 md:p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="font-bold text-white text-sm">مزامنة البيانات السحابية والمحلية</h4>
                              <p className="text-[10px] text-gray-500 mt-1">تزامن السجلات بين قاعدة البيانات المحلية والسحابة (ثنائي الاتجاه)</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleSyncNow}
                              disabled={syncLoading}
                              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md self-start sm:self-center"
                            >
                              {syncLoading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                              مزامنة الآن
                            </button>
                          </div>

                          {syncResult.type && (
                            <div className={`p-4 rounded-xl text-xs font-bold border ${syncResult.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                              {syncResult.message}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-8 pb-8">
                     <section className="bg-white/5 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 overflow-hidden">
                        <div className="p-5 md:p-8 border-b border-white/5 flex items-center justify-between rtl:flex-row-reverse">
                           <div className="flex items-center gap-3 rtl:flex-row-reverse">
                             <Shield className="text-orange-500" size={24} />
                             <h2 className="font-bold text-xl text-white">{t('settings.security')}</h2>
                           </div>
                           <button 
                             onClick={handleSaveSettings}
                             className="bg-orange-600 hover:bg-orange-700 text-white px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xl"
                           >
                             <Save size={18} /> {t('settings.update')}
                           </button>
                        </div>
                        <div className="p-5 md:p-8 space-y-8 rtl:text-right">
                           <div className="flex items-center justify-between p-5 md:p-6 bg-black/40 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5">
                             <div className="flex items-center gap-4">
                               <div className="p-4 bg-orange-600/10 text-orange-500 rounded-2xl"><Fingerprint size={32}/></div>
                               <div>
                                 <p className="font-black text-white text-lg">{t('settings.biometricLock')}</p>
                                 <p className="text-xs text-gray-500">تسجيل دخول آمن بواسطة البصمة أو الوجه</p>
                                 <DeviceSupportWarning type="biometric" />
                               </div>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer scale-125 mx-4">
                               <input 
                                 type="checkbox" 
                                 checked={biometricEnabled} 
                                 onChange={async (e) => {
                                   const checked = e.target.checked;
                                   if (checked) {
                                     const info = await Device.getInfo();
                                     if (info.platform === 'web') {
                                       alert('البصمة غير مدعومة في متصفح الويب. يرجى استخدام PIN بدلاً من ذلك.');
                                       return;
                                     }
                                     const bio = await NativeBiometric.isAvailable();
                                     if (!bio.isAvailable) {
                                       alert('جهازك لا يدعم التحقق البيومتري أو لم يتم إعداده.');
                                       return;
                                     }
                                   }
                                   setBiometricEnabled(checked);
                                 }} 
                                 className="sr-only peer" 
                               />
                               <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                             </label>
                           </div>

                           <div className="space-y-6">
                             <div className="flex items-center justify-between p-6 bg-black/40 rounded-[2rem] border border-white/5">
                               <div className="flex items-center gap-4">
                                 <div className="p-4 bg-orange-600/10 text-orange-500 rounded-2xl"><Lock size={32}/></div>
                                 <div>
                                   <p className="font-black text-white text-lg">{t('settings.pinLock')}</p>
                                   <p className="text-xs text-gray-500">قفل التطبيق برمز حماية (PIN) خاص</p>
                                 </div>
                               </div>
                               <label className="relative inline-flex items-center cursor-pointer scale-125 mx-4">
                                 <input type="checkbox" checked={pinEnabled} onChange={(e) => setPinEnabled(e.target.checked)} className="sr-only peer" />
                                 <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                               </label>
                             </div>
                             
                             {pinEnabled && (
                               <motion.div 
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 className="p-5 md:p-8 bg-black/60 rounded-[1.5rem] sm:rounded-[2.5rem] border border-orange-500/30 text-center space-y-6"
                               >
                                 <label className="text-xs text-orange-500 font-black uppercase tracking-widest">تحديد الرمز السري الجديد</label>
                                 <div className="max-w-[240px] mx-auto">
                                   <input 
                                     type="password" 
                                     maxLength={4}
                                     value={pinCode}
                                     onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                                     placeholder="****"
                                     className="w-full bg-black border-2 border-white/10 rounded-2xl px-6 py-5 text-center text-5xl tracking-[0.4em] focus:border-orange-500 outline-none text-white font-mono shadow-2xl"
                                   />
                                 </div>
                                 <p className="text-[10px] text-gray-500">سيتم طلب هذا الرمز عند فتح التطبيق</p>
                               </motion.div>
                             )}
                           </div>
                        </div>
                     </section>
                  </div>
                )}

                {activeTab === 'users' && activeTab !== 'main' && (
                  <div className="pb-8">
                    <UserManagement currentUser={user} />
                  </div>
                )}

                {activeTab === 'categories-engineers' && (
                  <div className="space-y-6 pb-8 text-right font-cairo" dir="rtl">
                    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto pt-4">
                      {/* 1. Engineers Option */}
                      <button
                        type="button"
                        onClick={() => setActiveCategoriesEngineersModal('engineers')}
                        className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/30 rounded-2xl transition-all group text-right shadow-lg cursor-pointer mx-4 md:mx-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <UserIcon size={22} />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">إدارة المهندسين والفنيين</h3>
                            <p className="text-xs text-gray-400 mt-1">إضافة، تعديل، أو حذف بيانات المهندسين والفنيين</p>
                          </div>
                        </div>
                        <ChevronLeft size={20} className="text-gray-500 group-hover:text-white group-hover:translate-x-[-4px] transition-all" />
                      </button>

                      {/* 2. Categories Option */}
                      <button
                        type="button"
                        onClick={() => setActiveCategoriesEngineersModal('categories')}
                        className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/30 rounded-2xl transition-all group text-right shadow-lg cursor-pointer mx-4 md:mx-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <Tag size={22} />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">تصنيفات الأجهزة</h3>
                            <p className="text-xs text-gray-400 mt-1">إدارة أنواع وموديلات الأجهزة للصيانة</p>
                          </div>
                        </div>
                        <ChevronLeft size={20} className="text-gray-500 group-hover:text-white group-hover:translate-x-[-4px] transition-all" />
                      </button>
                    </div>

                    {/* Modals for categories-engineers options */}
                    <AnimatePresence>
                      {activeCategoriesEngineersModal !== null && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-sm">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#1a1a1a] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-[2rem] border border-white/10 shadow-2xl flex flex-col p-4 md:p-6 overflow-hidden"
                            dir="rtl"
                          >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 shrink-0">
                              <h3 className="text-lg font-black text-white flex items-center gap-2">
                                {activeCategoriesEngineersModal === 'engineers' && <UserIcon className="text-emerald-500" size={20} />}
                                {activeCategoriesEngineersModal === 'categories' && <Tag className="text-emerald-500" size={20} />}
                                {activeCategoriesEngineersModal === 'engineers' && 'إدارة المهندسين والفنيين'}
                                {activeCategoriesEngineersModal === 'categories' && 'تصنيفات الأجهزة'}
                              </h3>
                              <button
                                type="button"
                                onClick={() => setActiveCategoriesEngineersModal(null)}
                                className="p-2.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-white/5 cursor-pointer"
                              >
                                <X size={20} />
                              </button>
                            </div>

                            {/* Modal Content container */}
                            <div className="flex-1 overflow-y-auto pr-1">
                              {activeCategoriesEngineersModal === 'engineers' && (
                                <div className="animate-in fade-in duration-200 h-full">
                                  <EngineersTable />
                                </div>
                              )}
                              {activeCategoriesEngineersModal === 'categories' && (
                                <div className="animate-in fade-in duration-200 h-full">
                                  <CategoriesTable />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                )}



                {activeTab === 'accounting-inputs' && (
                  <div className="space-y-6 pb-8 text-right font-cairo" dir="rtl">
                    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto pt-4">
                      {/* 1. Accounting Inputs Option */}
                      <button
                        type="button"
                        onClick={() => setActiveAccountingInputsModal('accounting')}
                        className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all group text-right shadow-lg cursor-pointer mx-4 md:mx-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-amber-600/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                            <Calculator size={22} />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">مدخلات العمليات الحسابية</h3>
                            <p className="text-xs text-gray-400 mt-1">تحديد العملات، طرق الدفع وتصنيفات الحركات</p>
                          </div>
                        </div>
                        <ChevronLeft size={20} className="text-gray-500 group-hover:text-white group-hover:translate-x-[-4px] transition-all" />
                      </button>

                      {/* 2. Shop Details Option */}
                      <button
                        type="button"
                        onClick={() => setActiveAccountingInputsModal('details')}
                        className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all group text-right shadow-lg cursor-pointer mx-4 md:mx-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-amber-600/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                            <Store size={22} />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">تفاصيل ومعلومات المحل</h3>
                            <p className="text-xs text-gray-400 mt-1">تحديد مسمى وعنوان المحل، أرقام التواصل وروابط التواصل الاجتماعي</p>
                          </div>
                        </div>
                        <ChevronLeft size={20} className="text-gray-500 group-hover:text-white group-hover:translate-x-[-4px] transition-all" />
                      </button>

                    </div>

                    {/* Modals for accounting-inputs options */}
                    <AnimatePresence>
                      {activeAccountingInputsModal !== null && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-sm">
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#1a1a1a] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-[2rem] border border-white/10 shadow-2xl flex flex-col p-4 md:p-6 overflow-hidden"
                            dir="rtl"
                          >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 shrink-0">
                              <h3 className="text-lg font-black text-white flex items-center gap-2">
                                {activeAccountingInputsModal === 'accounting' && <Calculator className="text-amber-500" size={20} />}
                                {activeAccountingInputsModal === 'details' && <Store className="text-amber-500" size={20} />}
                                {activeAccountingInputsModal === 'backup' && <Database className="text-amber-500" size={20} />}
                                {activeAccountingInputsModal === 'accounting' && 'مدخلات العمليات الحسابية'}
                                {activeAccountingInputsModal === 'details' && 'تفاصيل ومعلومات المحل'}
                                {activeAccountingInputsModal === 'backup' && t('settings.maintenance')}
                              </h3>
                              <button
                                type="button"
                                onClick={() => setActiveAccountingInputsModal(null)}
                                className="p-2.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-white/5 cursor-pointer"
                              >
                                <X size={20} />
                              </button>
                            </div>

                            {/* Modal Content container */}
                            <div className="flex-1 overflow-y-auto pr-1">
                              {activeAccountingInputsModal === 'accounting' && (
                                <div className="animate-in fade-in duration-200 h-full">
                                  <AccountingInputs />
                                </div>
                              )}
                    {activeAccountingInputsModal === 'details' && (
                      <div className="space-y-6 animate-in fade-in duration-200 text-right">
                        {/* Header with Edit Action */}
                        <div className="p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-white text-lg">تفاصيل ومعلومات المحل</h3>
                            <p className="text-xs text-gray-500 mt-1">تعديل معلومات المحل، طريقة التواصل والشعار العام للمطبوعات</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingShop(!isEditingShop);
                            }}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${isEditingShop ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'}`}
                          >
                            <Edit size={14} />
                            {isEditingShop ? 'إلغاء التعديل' : 'تحرير والبدء بالاعداد'}
                          </button>
                        </div>

                        {/* Details Editable Form */}
                        <div className="p-6 md:p-8 bg-white/5 rounded-3xl border border-white/5 space-y-6">
                          {/* Main Row / Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Shop Name - COMPULSORY */}
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-xs font-bold text-gray-400 block">اسم المحل (إجباري) <span className="text-red-500">*</span></label>
                              <div className="relative">
                                <Store className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                  type="text"
                                  required
                                  disabled={!isEditingShop}
                                  value={shopName}
                                  onChange={(e) => setShopName(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-3.5 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                  placeholder="عالم الصيانة والتجارة"
                                />
                              </div>
                            </div>

                            {/* Country Code Selection */}
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-xs font-bold text-gray-400 block">رمز الدولة الافتراضي (لإرسال الواتساب)</label>
                              <div className="relative">
                                <Globe className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <select
                                  disabled={!isEditingShop}
                                  value={countryCode}
                                  onChange={(e) => setCountryCode(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-3.5 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
                                >
                                  <option value="+967">اليمن (+967)</option>
                                  <option value="+966">السعودية (+966)</option>
                                  <option value="+971">الإمارات (+971)</option>
                                  <option value="+965">الكويت (+965)</option>
                                  <option value="+974">قطر (+974)</option>
                                  <option value="+968">عمان (+968)</option>
                                  <option value="+973">البحرين (+973)</option>
                                  <option value="+962">الأردن (+962)</option>
                                  <option value="+963">سوريا (+963)</option>
                                  <option value="+964">العراق (+964)</option>
                                  <option value="+961">لبنان (+961)</option>
                                  <option value="+20">مصر (+20)</option>
                                  <option value="+218">ليبيا (+218)</option>
                                  <option value="+216">تونس (+216)</option>
                                  <option value="+212">المغرب (+212)</option>
                                  <option value="+249">السودان (+249)</option>
                                  <option value="+213">الجزائر (+213)</option>
                                </select>
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                  <ChevronLeft size={16} className="-rotate-90" />
                                </div>
                              </div>
                              <p className="text-[10px] text-gray-500 mr-2 italic">سيتم إضافة هذا الرمز تلقائياً لأي رقم هاتف لا يبدأ برمز دولي عند الإرسال.</p>
                            </div>

                            {/* Main Phone Number */}
                            <div className="space-y-4 p-4 bg-black/25 rounded-2xl border border-white/5">
                              <label className="text-xs font-bold text-gray-400 block">رقم جوال رئيسي</label>
                              <div className="relative">
                                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                  type="tel"
                                  disabled={!isEditingShop}
                                  value={phone1}
                                  onChange={(e) => setPhone1(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                  placeholder="مثال: 0500000000"
                                />
                              </div>
                              {/* Option Services for Phone 1 */}
                              <div className="flex gap-4 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                                  <input
                                    type="checkbox"
                                    disabled={!isEditingShop}
                                    checked={phone1Call}
                                    onChange={(e) => setPhone1Call(e.target.checked)}
                                    className="rounded border-white/10 text-orange-500 focus:ring-orange-500 bg-black/40 w-4 h-4"
                                  />
                                  <span>رمز اتصال</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                                  <input
                                    type="checkbox"
                                    disabled={!isEditingShop}
                                    checked={phone1Whatsapp}
                                    onChange={(e) => setPhone1Whatsapp(e.target.checked)}
                                    className="rounded border-white/10 text-orange-500 focus:ring-orange-500 bg-black/40 w-4 h-4"
                                  />
                                  <span>رمز واتساب</span>
                                </label>
                              </div>
                            </div>

                            {/* Secondary Phone Number */}
                            <div className="space-y-4 p-4 bg-black/25 rounded-2xl border border-white/5">
                              <label className="text-xs font-bold text-gray-400 block">رقم جوال ثانوي</label>
                              <div className="relative">
                                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                  type="tel"
                                  disabled={!isEditingShop}
                                  value={phone2}
                                  onChange={(e) => setPhone2(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                  placeholder="رقم هاتف جوال آخر"
                                />
                              </div>
                              {/* Option Services for Phone 2 */}
                              <div className="flex gap-4 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                                  <input
                                    type="checkbox"
                                    disabled={!isEditingShop}
                                    checked={phone2Call}
                                    onChange={(e) => setPhone2Call(e.target.checked)}
                                    className="rounded border-white/10 text-orange-500 focus:ring-orange-500 bg-black/40 w-4 h-4"
                                  />
                                  <span>رمز اتصال</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                                  <input
                                    type="checkbox"
                                    disabled={!isEditingShop}
                                    checked={phone2Whatsapp}
                                    onChange={(e) => setPhone2Whatsapp(e.target.checked)}
                                    className="rounded border-white/10 text-orange-500 focus:ring-orange-500 bg-black/40 w-4 h-4"
                                  />
                                  <span>رمز واتساب</span>
                                </label>
                              </div>
                            </div>

                            {/* Landline Phone Number */}
                            <div className="space-y-4 p-4 bg-black/25 rounded-2xl border border-white/5">
                              <label className="text-xs font-bold text-gray-400 block">رقم التلفون الأرضي</label>
                              <div className="relative">
                                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                  type="tel"
                                  disabled={!isEditingShop}
                                  value={landline}
                                  onChange={(e) => setLandline(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                  placeholder="مثال: 0110000000"
                                />
                              </div>
                              {/* Option Services for Landline */}
                              <div className="flex gap-4 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                                  <input
                                    type="checkbox"
                                    disabled={!isEditingShop}
                                    checked={landlineCall}
                                    onChange={(e) => setLandlineCall(e.target.checked)}
                                    className="rounded border-white/10 text-orange-500 focus:ring-orange-500 bg-black/40 w-4 h-4"
                                  />
                                  <span>رمز اتصال</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                                  <input
                                    type="checkbox"
                                    disabled={!isEditingShop}
                                    checked={landlineWhatsapp}
                                    onChange={(e) => setLandlineWhatsapp(e.target.checked)}
                                    className="rounded border-white/10 text-orange-500 focus:ring-orange-500 bg-black/40 w-4 h-4"
                                  />
                                  <span>رمز واتساب</span>
                                </label>
                              </div>
                            </div>

                            {/* Email Address */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-400 block">البريد الإلكتروني</label>
                              <div className="relative">
                                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                  type="email"
                                  disabled={!isEditingShop}
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-3.5 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                  placeholder="example@domain.com"
                                />
                              </div>
                            </div>

                            {/* Facebook page */}
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-400 block">صفحة فيسبوك</label>
                              <div className="relative">
                                <Facebook className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                  type="text"
                                  disabled={!isEditingShop}
                                  value={facebookUrl}
                                  onChange={(e) => setFacebookUrl(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-3.5 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                  placeholder="https://facebook.com/yourpage"
                                />
                              </div>
                            </div>

                            {/* Map Location */}
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-xs font-bold text-gray-400 block">الموقع على الخريطة</label>
                              <div className="relative">
                                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                  type="text"
                                  disabled={!isEditingShop}
                                  value={mapUrl}
                                  onChange={(e) => setMapUrl(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-3.5 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                  placeholder="أو رابط خرائط قوقل مابز"
                                />
                              </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-xs font-bold text-gray-400 block">العنوان بالتفصيل</label>
                              <div className="relative">
                                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                  type="text"
                                  disabled={!isEditingShop}
                                  value={address}
                                  onChange={(e) => setAddress(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-2xl pr-12 pl-4 py-3.5 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                  placeholder="مثال: صنعاء - شارع حده - عمارة البركة الدور الأول"
                                />
                              </div>
                            </div>

                            {/* Logo Upload */}
                            <div className="space-y-2 md:col-span-2 text-center flex flex-col items-center">
                              <label className="text-xs font-bold text-gray-400 w-full text-right block mb-1">شعار المحل للمطبوعات والتقارير</label>
                              <div className={`relative group mt-2 ${!isEditingShop ? 'opacity-80' : ''}`}>
                                <div className="w-36 h-36 rounded-2xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-orange-500">
                                  {logoUrl ? (
                                    <img src={logoUrl} alt="الشعار" className="w-full h-full object-contain p-2" />
                                  ) : (
                                    <Upload className="text-gray-600" size={32} />
                                  )}
                                </div>
                                {isEditingShop && (
                                  <>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          const reader = new FileReader();

                                          reader.onloadend = () => {

                                            const img = new Image();

                                            img.onload = () => {

                                              const canvas = document.createElement("canvas");

                                              const MAX_WIDTH = 300;

                                              const MAX_HEIGHT = 300;

                                              let width = img.width;

                                              let height = img.height;

                                              if (width > height) {

                                                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }

                                              } else {

                                                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }

                                              }

                                              canvas.width = width;

                                              canvas.height = height;

                                              const ctx = canvas.getContext("2d");

                                              ctx?.drawImage(img, 0, 0, width, height);

                                              setLogoUrl(canvas.toDataURL("image/jpeg", 0.7));

                                            };

                                            img.src = reader.result as string;

                                          };

                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="absolute -bottom-2 -right-2 p-2 bg-orange-600 rounded-lg shadow-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Upload size={16} />
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Bank Accounts */}
                            <div className="md:col-span-2 mt-4">
                              <h3 className="text-sm font-bold text-white mb-4 border-b border-white/10 pb-2">الحسابات البنكية (تظهر في الفواتير - اختياري)</h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* YER Bank */}
                                <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold text-xs">YER</div>
                                    <span className="text-sm font-bold text-gray-300">حساب بنكي ريال</span>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 block">اسم الحساب</label>
                                    <input
                                      type="text"
                                      disabled={!isEditingShop}
                                      value={bankYerName}
                                      onChange={(e) => setBankYerName(e.target.value)}
                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-50 text-sm"
                                      placeholder="مثال: بنك الكريمي - ريال"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 block">رقم الحساب</label>
                                    <input
                                      type="tel"
                                      inputMode="tel"
                                      disabled={!isEditingShop}
                                      value={bankYerAccount}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9\- ]/g, '');
                                        setBankYerAccount(val);
                                      }}
                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-50 text-sm font-mono text-left"
                                      placeholder="XXX-XXXX-XXXX"
                                      dir="ltr"
                                    />
                                  </div>
                                </div>

                                {/* SAR Bank */}
                                <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-xs">SAR</div>
                                    <span className="text-sm font-bold text-gray-300">حساب بنكي سعودي</span>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 block">اسم الحساب</label>
                                    <input
                                      type="text"
                                      disabled={!isEditingShop}
                                      value={bankSarName}
                                      onChange={(e) => setBankSarName(e.target.value)}
                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-50 text-sm"
                                      placeholder="مثال: بنك الكريمي - سعودي"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 block">رقم الحساب</label>
                                    <input
                                      type="tel"
                                      inputMode="tel"
                                      disabled={!isEditingShop}
                                      value={bankSarAccount}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9\- ]/g, '');
                                        setBankSarAccount(val);
                                      }}
                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-50 text-sm font-mono text-left"
                                      placeholder="XXX-XXXX-XXXX"
                                      dir="ltr"
                                    />
                                  </div>
                                </div>

                                {/* USD Bank */}
                                <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold text-xs">USD</div>
                                    <span className="text-sm font-bold text-gray-300">حساب بنكي دولار</span>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 block">اسم الحساب</label>
                                    <input
                                      type="text"
                                      disabled={!isEditingShop}
                                      value={bankUsdName}
                                      onChange={(e) => setBankUsdName(e.target.value)}
                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-50 text-sm"
                                      placeholder="مثال: بنك الكريمي - دولار"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 block">رقم الحساب</label>
                                    <input
                                      type="tel"
                                      inputMode="tel"
                                      disabled={!isEditingShop}
                                      value={bankUsdAccount}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9\- ]/g, '');
                                        setBankUsdAccount(val);
                                      }}
                                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-50 text-sm font-mono text-left"
                                      placeholder="XXX-XXXX-XXXX"
                                      dir="ltr"
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-6 space-y-2">
                                <label className="text-xs font-bold text-gray-400 block">اسم صاحب الحسابات البنكية (يظهر بداية سطر الحسابات في الفاتورة)</label>
                                <input
                                  type="text"
                                  disabled={!isEditingShop}
                                  value={bankHolderName}
                                  onChange={(e) => setBankHolderName(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-50 text-sm"
                                  placeholder="اسم صاحب الحساب (مثال: مؤسسة عالم الصيانة)"
                                />
                              </div>

                              <div className="mt-6 space-y-2">
                                <label className="text-xs font-bold text-gray-400 block">العملة الرئيسية</label>
                                <select
                                  disabled={!isEditingShop}
                                  value={liabilityCurrency}
                                  onChange={(e) => setLiabilityCurrency(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-50 text-sm"
                                >
                                  <option value="YER">ريال يمني</option>
                                  <option value="SAR">ريال سعودي</option>
                                  <option value="USD">دولار أمريكي</option>
                                </select>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-gray-400 block">اسم المدير</label>
                                  <input
                                    type="text"
                                    disabled={!isEditingShop}
                                    value={managerName}
                                    onChange={(e) => setManagerName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-50 text-sm"
                                    placeholder="اسم المدير"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-gray-400 block">السجل التجاري</label>
                                  <input
                                    type="text"
                                    disabled={!isEditingShop}
                                    value={commercialRecord}
                                    onChange={(e) => setCommercialRecord(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-50 text-sm font-mono text-left"
                                    placeholder="السجل التجاري"
                                    dir="ltr"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-gray-400 block">الرقم الضريبي</label>
                                  <input
                                    type="text"
                                    disabled={!isEditingShop}
                                    value={taxNumber}
                                    onChange={(e) => setTaxNumber(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-50 text-sm font-mono text-left"
                                    placeholder="الرقم الضريبي"
                                    dir="ltr"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-bold text-gray-400 block">ملاحظات الفاتورة</label>
                                  <input
                                    type="text"
                                    disabled={!isEditingShop}
                                    value={receiptNotes}
                                    onChange={(e) => setReceiptNotes(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-50 text-sm"
                                    placeholder="ملاحظات تظهر أسفل الفاتورة"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Description / Summary of Services */}
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-xs font-bold text-gray-400 block">نبذة مختصرة عن المحل وما الخدمات التي يقدمها</label>
                              <textarea
                                disabled={!isEditingShop}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 focus:border-orange-500 outline-none transition-all text-white disabled:opacity-60 disabled:cursor-not-allowed resize-none text-sm leading-relaxed"
                                placeholder="محل متخصص في الصيانة وبيع التجارة العامة وقطع الغيار..."
                              />
                            </div>

                          </div>

                          {/* Submit Action Block */}
                          <div className="border-t border-white/5 pt-6 flex justify-end">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!shopName.trim()) {
                                  alert("اسم المحل إجباري!");
                                  return;
                                }
                                setSaving(true);
                            
    try {
                                  const updatedConfig = {
                                    id: 'main_details',
                                    shopName: shopName.trim(),
                                    countryCode: countryCode.trim(),
                                    phone1: phone1.trim(),
                                    phone2: phone2.trim(),
                                    landline: landline.trim(),
                                    phone1Call,
                                    phone1Whatsapp,
                                    phone2Call,
                                    phone2Whatsapp,
                                    landlineCall,
                                    landlineWhatsapp,
                                    facebookUrl: facebookUrl.trim(),
                                    mapUrl: mapUrl.trim(),
                                    email: email.trim(),
                                    bio: bio.trim(),
                                    logoUrl,
                                    address: address.trim(),
                                    bankYerName: bankYerName.trim(),
                                    bankYerAccount: bankYerAccount.trim(),
                                    bankSarName: bankSarName.trim(),
                                    bankSarAccount: bankSarAccount.trim(),
                                    bankUsdName: bankUsdName.trim(),
                                    bankUsdAccount: bankUsdAccount.trim(),
                                    bankHolderName: bankHolderName.trim(),
                                    liabilityCurrency: liabilityCurrency,
                                    managerName: managerName.trim(),
                                    commercialRecord: commercialRecord.trim(),
                                    taxNumber: taxNumber.trim(),
                                    receiptNotes: receiptNotes.trim(),
                                    fiscalYear: shopConfig?.fiscalYear || new Date().getFullYear().toString(),
                                    startDate: shopConfig?.startDate || new Date().toISOString().split('T')[0],
                                    updatedAt: new Date().toISOString()
                                  };

                                  if (JSON.stringify(updatedConfig).length > 900000) {

                                    (updatedConfig as any).logoUrl = "";

                                    (updatedConfig as any).logo = "";

                                  }
                                  await setDoc(doc(db, 'company_details', 'main_details'), updatedConfig, { merge: true });
                                  localStorage.setItem('snd_country_code', updatedConfig.countryCode);

                                  // Save/Sync to local SQLite table "company_details" as well
                              
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
                                        updatedConfig.shopName,
                                        updatedConfig.shopName, // map to name
                                        updatedConfig.countryCode,
                                        updatedConfig.phone1,
                                        updatedConfig.phone2,
                                        updatedConfig.landline,
                                        updatedConfig.phone1Call ? 1 : 0,
                                        updatedConfig.phone1Whatsapp ? 1 : 0,
                                        updatedConfig.phone2Call ? 1 : 0,
                                        updatedConfig.phone2Whatsapp ? 1 : 0,
                                        updatedConfig.landlineCall ? 1 : 0,
                                        updatedConfig.landlineWhatsapp ? 1 : 0,
                                        updatedConfig.facebookUrl,
                                        updatedConfig.mapUrl,
                                        updatedConfig.email,
                                        updatedConfig.bio,
                                        updatedConfig.logoUrl,
                                        updatedConfig.logoUrl, // map to logo
                                        updatedConfig.address,
                                        updatedConfig.updatedAt,
                                        updatedConfig.bankYerName,
                                        updatedConfig.bankYerAccount,
                                        updatedConfig.bankSarName,
                                        updatedConfig.bankSarAccount,
                                        updatedConfig.bankUsdName,
                                        updatedConfig.bankUsdAccount,
                                        updatedConfig.bankHolderName,
                                        updatedConfig.liabilityCurrency,
                                        updatedConfig.fiscalYear,
                                        updatedConfig.startDate,
                                        updatedConfig.receiptNotes,
                                        updatedConfig.managerName,
                                        updatedConfig.commercialRecord,
                                        updatedConfig.taxNumber
                                      ]
                                    );
                                  } catch (sqliteErr) {
                                    console.error("Failed to save to SQLite company_details table:", sqliteErr);
                                  }

                                  if (onShopConfigUpdate) {
                                    onShopConfigUpdate(updatedConfig);
                                  }
                                  setIsEditingShop(false);
                                  alert("تم حفظ تفاصيل ومعلومات المحل بنجاح!");
                                } catch (e: any) {
                                  console.error(e);
                                  alert("خطأ أثناء حفظ تفاصيل المحل: " + e.message);
                                } finally {
                                  SyncEngine.resumeSync();
                                  setSaving(false);
                                }
                              }}
                              disabled={!isEditingShop || saving}
                              className={`px-8 py-3.5 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl transition-all ${
                                !isEditingShop 
                                  ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed opacity-50' 
                                  : 'bg-orange-600 hover:bg-orange-700 text-white cursor-pointer active:scale-[0.98]'
                              }`}
                            >
                              {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                              حفظ المعلومات
                            </button>
                          </div>

                        </div>
                      </div>
                    )}
                {activeAccountingInputsModal === 'backup' && (
                  <div className="space-y-3 pb-4">
                    {backupSubTab === 'list' ? (
                      <div className="space-y-2">
                        {/* Stats Block */}
                        <motion.button
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => setBackupSubTab('stats')}
                          className="w-full bg-white/5 text-white p-3.5 rounded-[1.2rem] border border-white/10 flex items-center gap-3 shadow-xl relative group overflow-hidden"
                        >
                          <div className="flex-1 rtl:text-right">
                             <h3 className="text-base font-bold font-cairo">إحصائيات وقاعدة البيانات</h3>
                             <div className="mt-1 space-y-0.5">
                                <div className="flex items-center justify-end gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                   <span>{statsData.invoices + statsData.customers + statsData.maintenance}</span>
                                   <span>:إجمالي السجلات</span>
                                   <RefreshCw size={8} className="text-gray-500" />
                                </div>
                                <div className="flex items-center justify-end gap-2 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                   <span>{((statsData.invoices + statsData.customers + statsData.maintenance) * 0.012).toFixed(3)} MB</span>
                                   <span>:الحجم الكلي</span>
                                   <RefreshCw size={8} className="text-gray-500" />
                                </div>
                             </div>
                          </div>
                          <div className="p-2.5 bg-blue-600/10 text-blue-500 rounded-xl">
                             <Database size={22} />
                          </div>
                        </motion.button>

                        {/* Audit & Repair Block */}
                        <motion.button
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => {
                            setBackupSubTab('audit');
                            runDatabaseAudit();
                          }}
                          className="w-full bg-orange-600/10 text-orange-500 p-3.5 rounded-[1.2rem] border border-orange-500/20 flex items-center gap-3 shadow-xl relative group overflow-hidden"
                        >
                          <div className="flex-1 rtl:text-right">
                             <h3 className="text-base font-bold font-cairo text-orange-450">مربع تدقيق ومطابقة البيانات (Audit)</h3>
                             <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">فحص ومعالجة التضاربات بين عدادات البرنامج وسجلات قاعدة البيانات</p>
                          </div>
                          <div className="p-2.5 bg-orange-600/15 text-orange-500 rounded-xl group-hover:scale-105 transition-transform">
                             <Shield size={22} />
                          </div>
                        </motion.button>

                        {/* Backup Block */}
                        <motion.button
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => setBackupSubTab('backup_manual')}
                          className="w-full bg-white/5 text-white p-3.5 rounded-[1.2rem] border border-white/10 flex items-center gap-3 shadow-xl relative group overflow-hidden"
                        >
                          <div className="flex-1 rtl:text-right">
                             <h3 className="text-base font-bold font-cairo">النسخ الاحتياطي</h3>
                             <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">نسخ محلي وتلقائي للبيانات</p>
                          </div>
                          <div className="p-2.5 bg-purple-600/10 text-purple-500 rounded-xl">
                             <Database size={22} />
                          </div>
                        </motion.button>

                        {/* Export Block */}
                        <motion.button
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => setBackupSubTab('export')}
                          className="w-full bg-white/5 text-white p-3.5 rounded-[1.2rem] border border-white/10 flex items-center gap-3 shadow-xl relative group overflow-hidden"
                        >
                          <div className="flex-1 rtl:text-right">
                             <h3 className="text-base font-bold font-cairo">تصدير بلاس</h3>
                             <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">تصدير شامل ومنظم للسجلات</p>
                          </div>
                          <div className="p-2.5 bg-emerald-600/10 text-emerald-500 rounded-xl">
                             <Download size={22} />
                          </div>
                        </motion.button>

                        {/* Import Block */}
                        <motion.button
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => setBackupSubTab('import')}
                          className="w-full bg-white/5 text-white p-3.5 rounded-[1.2rem] border border-white/10 flex items-center gap-3 shadow-xl relative group overflow-hidden"
                        >
                          <div className="flex-1 rtl:text-right">
                             <h3 className="text-base font-bold font-cairo">الاستيراد والاستعادة</h3>
                             <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">استعادة أو دمج بيانات سابقة</p>
                          </div>
                          <div className="p-2.5 bg-orange-600/10 text-orange-500 rounded-xl">
                             <Upload size={22} />
                          </div>
                        </motion.button>

                        {/* Archive Block */}
                        <motion.button
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          onClick={() => setBackupSubTab('archive')}
                          className="w-full bg-white/5 text-white p-3.5 rounded-[1.2rem] border border-white/10 flex items-center gap-3 shadow-xl relative group overflow-hidden"
                        >
                          <div className="flex-1 rtl:text-right">
                             <h3 className="text-base font-bold font-cairo">أرشفة الملفات</h3>
                             <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">مسح وتفريغ السجلات المنتهية</p>
                          </div>
                          <div className="p-2.5 bg-gray-600/10 text-gray-500 rounded-xl">
                             <Archive size={22} />
                          </div>
                        </motion.button>


                        {/* Reset Block */}
                        <motion.button
                          whileHover={{ scale: 1.005 }}
                          whileTap={{ scale: 0.995 }}
                          type="button"
                          onClick={() => {
                            console.log('Manual click on Reset Button');
                            resetAllDataTemp();
                          }}
                          className="w-full bg-red-500/10 text-red-500 p-5 rounded-[1.2rem] border border-red-500/20 flex items-center gap-3 shadow-xl mt-4 cursor-pointer active:bg-red-500/20"
                        >
                          <div className="flex-1 text-right rtl:text-right">
                             <h3 className="text-base font-bold font-cairo">تهيئة النظام (ضبط المصنع)</h3>
                             <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest mt-0.5 select-none">Factory Wipe & Data Reset</p>
                          </div>
                          <div className="p-3 bg-red-500 text-white rounded-xl shadow-lg">
                             <RotateCcw size={24} />
                          </div>
                        </motion.button>
                        <div className="h-10" /> {/* Extra space at the bottom */}
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                      >
                          <button 
                            onClick={() => setBackupSubTab('list')}
                            className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 mb-4"
                            title="العودة للقائمة"
                          >
                             <ArrowRight size={18} />
                          </button>

                         {backupSubTab === 'backup_manual' && (
                            <section className="bg-white/5 rounded-[1.5rem] border border-white/10 overflow-hidden shadow-2xl">
                               <div className="p-5 md:p-8 border-b border-white/5 bg-gradient-to-br from-emerald-600/10 to-transparent flex items-center justify-between rtl:flex-row-reverse">
                                  <div className="flex items-center gap-4 rtl:flex-row-reverse">
                                    <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg ring-2 ring-emerald-600/20">
                                      <Database size={24} />
                                    </div>
                                    <div className="rtl:text-right">
                                      <h2 className="font-mono text-xl font-black text-white uppercase tracking-tighter">النسخ الاحتياطي</h2>
                                      <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Control Panel</p>
                                    </div>
                                  </div>
                               </div>
                               <div className="p-5 md:p-8 space-y-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <div className="p-5 bg-black/40 rounded-[1.5rem] border border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                           <div className="flex items-center gap-3">
                                              <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-xl"><Clock size={24} /></div>
                                              <span className="font-bold text-sm text-white">النسخ التلقائي</span>
                                           </div>
                                           <label className="relative inline-flex items-center cursor-pointer scale-110">
                                              <input type="checkbox" checked={autoBackup} onChange={e => setAutoBackup(e.target.checked)} className="sr-only peer" />
                                              <div className="w-12 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
                                           </label>
                                        </div>
                                        {autoBackup && (
                                           <div className="space-y-2 pt-2 border-t border-white/5">
                                              <label className="text-[9px] text-gray-400 uppercase font-black tracking-widest block rtl:text-right">وقت النسخ</label>
                                              <input type="time" value={backupTime} onChange={e => setBackupTime(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-2xl font-mono text-center focus:border-emerald-500 outline-none" />
                                           </div>
                                        )}
                                     </div>
                                     <div className="p-5 bg-black/40 rounded-[1.5rem] border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                           <div className="flex items-center gap-3">
                                              <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-xl"><HardDrive size={24} /></div>
                                              <span className="font-bold text-sm text-white">مسار التخزين</span>
                                           </div>
                                           <button
                                             type="button"
                                             onClick={handleSelectBackupFolder}
                                             className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                           >
                                             <HardDrive size={14} />
                                             <span>اختيار المسار</span>
                                           </button>
                                        </div>
                                        <input 
                                          type="text" 
                                          value={backupPath} 
                                          onChange={e => setBackupPath(e.target.value)}
                                          className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-gray-300 focus:border-emerald-500 outline-none" 
                                          placeholder="Documents/SND_Backups"
                                        />
                                        <p className="text-[10px] text-gray-500 leading-tight">
                                          يتم الحفظ في مجلد مستقل بذاكرة الجهاز ولا يتم حذفه عند إزالة التطبيق.
                                        </p>
                                     </div>
                                  </div>

                                  {/* Custom Backup Filename Box */}
                                  <div className="p-5 bg-black/40 rounded-[1.5rem] border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-purple-600/10 text-purple-400 rounded-xl">
                                          <FileText size={20} />
                                        </div>
                                        <div>
                                          <span className="font-bold text-sm text-white block">اسم ملف النسخة الاحتياطية</span>
                                          <span className="text-[10px] text-gray-400">التاريخ والوقت افتراضياً (قابل للتغيير بحسب رغبتك)</span>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setBackupCustomName(getFormattedBackupTimestamp())}
                                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer"
                                        title="إعادة تعيين التاريخ والوقت الحالي"
                                      >
                                        <RotateCcw size={12} />
                                        <span>إعادة التعيين</span>
                                      </button>
                                    </div>

                                    <div className="flex items-center bg-black/60 border border-white/15 rounded-xl overflow-hidden focus-within:border-purple-500 transition-all dir-ltr" dir="ltr">
                                      <span className="px-3 py-2.5 bg-purple-950/60 text-purple-300 text-xs font-mono font-bold select-none border-r border-white/10">
                                        snd_backup_
                                      </span>
                                      <input
                                        type="text"
                                        value={backupCustomName}
                                        onChange={(e) => setBackupCustomName(e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        className="w-full bg-transparent px-3 py-2.5 text-white font-mono text-sm outline-none font-bold"
                                        placeholder="202608050443"
                                      />
                                      <span className="px-3 py-2.5 bg-purple-950/60 text-purple-300 text-xs font-mono font-bold select-none border-l border-white/10">
                                        .json
                                      </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                                      <span>اسم الملف الكامل: <strong className="text-purple-300 font-mono" dir="ltr">snd_backup_{backupCustomName || getFormattedBackupTimestamp()}.json</strong></span>
                                      <span className="text-gray-500">انقر على النص لتظليله واستبداله</span>
                                    </div>
                                  </div>

                                  <div className="flex gap-4">
                                     <button onClick={handleSaveSettings} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-[1.5rem] font-bold text-base shadow-2xl transition-all active:scale-95 cursor-pointer">حفظ الإعدادات</button>
                                     <button 
                                       disabled={backupLoading}
                                       onClick={handleExportBackup} 
                                       className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-[1.5rem] font-bold text-base shadow-2xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                     >
                                       {backupLoading ? 'جاري النسخ...' : 'نسخ احتياطي الآن'}
                                     </button>
                                  </div>
                               </div>
                            </section>
                         )}

                         {backupSubTab === 'export' && (
                            <section className="bg-white/5 rounded-[1.5rem] border border-white/10 p-5 text-center space-y-4">
                               <div className="p-4 bg-emerald-600/10 text-emerald-500 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                                  <Download size={28} />
                               </div>
                               <div>
                                  <h3 className="text-xl font-black text-white font-cairo">تصدير بلاس</h3>
                                  <p className="text-gray-500 mt-1 text-[10px]">تجهيز ملف شامل لجميع بيانات النظام بتنسيق JSON</p>
                               </div>
                               <button 
                                 disabled={backupLoading}
                                 onClick={handleExportBackup} 
                                 className="bg-white text-black px-6 py-2.5 rounded-lg font-black text-xs hover:scale-105 active:scale-95 transition-transform flex items-center gap-2 mx-auto disabled:opacity-50"
                               >
                                  <Download size={16} />
                                  <span>{backupLoading ? 'جاري التصدير...' : 'بدء التصـدير'}</span>
                               </button>
                            </section>
                         )}

                         {backupSubTab === 'import' && (
                            <section className="bg-white/5 rounded-[1.5rem] border border-white/10 p-5 text-center space-y-4">
                               <div className="p-4 bg-orange-600/10 text-orange-500 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                                  <Upload size={28} />
                               </div>
                               <div>
                                  <h3 className="text-xl font-black text-white font-cairo">الاستيراد والاستعادة</h3>
                                  <p className="text-gray-500 mt-1 text-[10px]">اختر ملف النسخة الاحتياطية لاستعادة السجلات</p>
                               </div>
                               <label className={`max-w-xs mx-auto border border-dashed border-white/20 p-4 rounded-xl hover:border-orange-500/50 transition-colors cursor-pointer group block ${backupLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                                  <FileText className="mx-auto text-gray-600 group-hover:text-orange-500 transition-colors" size={32} />
                                  <p className="mt-2 text-[9px] text-gray-500">{backupLoading ? 'جاري الاستعادة...' : 'اختر الملف من الذاكرة'}</p>
                                  <input 
                                    type="file" 
                                    accept=".json"
                                    className="hidden"
                                    onChange={handleImportBackup}
                                  />
                               </label>
                            </section>
                         )}

                         {backupSubTab === 'archive' && (
                            <section className="bg-white/5 rounded-[1.5rem] border border-white/10 p-5 text-center space-y-4">
                               <div className="p-4 bg-gray-600/10 text-gray-400 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                                  <Archive size={28} />
                               </div>
                               <div>
                                  <h3 className="text-xl font-black text-white font-cairo">أرشفة الملفات</h3>
                                  <p className="text-gray-500 mt-1 text-[10px]">نقل السجلات القديمة المنتهية لقاعدة بيانات الأرشيف</p>
                               </div>
                               <div className="flex justify-center max-w-sm mx-auto">
                                  <button 
                                    disabled={backupLoading}
                                    onClick={handleArchive}
                                    className="bg-white/10 text-white font-black rounded-lg px-8 py-3 hover:bg-white/20 transition-all text-xs disabled:opacity-50"
                                  >
                                    {backupLoading ? 'جاري التنفيذ...' : 'مسح السجلات المنتهية (أقدم من 12 شهر)'}
                                  </button>
                               </div>
                            </section>
                         )}

                         {backupSubTab === 'stats' && (
                            <section className="bg-white/5 rounded-[1.5rem] border border-white/10 p-4 space-y-4">
                               <div className="flex items-center gap-3 rtl:flex-row-reverse">
                                  <div className="p-3 bg-blue-600 text-white rounded-lg shadow-xl"><Database size={20} /></div>
                                  <div className="rtl:text-right">
                                     <h3 className="text-lg font-black text-white font-cairo">تفاصيل قاعدة البيانات</h3>
                                     <p className="text-[8px] text-gray-500">فحص الحالة وتوافر البيانات</p>
                                  </div>
                               </div>
                               <div className="grid grid-cols-2 gap-2">
                                  {[
                                     { label: 'الفواتير المسجلة', value: statsData.invoices, icon: FileText, color: 'text-blue-500' },
                                     { label: 'العملاء المسجلين', value: statsData.customers, icon: Smartphone, color: 'text-purple-500' },
                                     { label: 'عمليات الصيانة', value: statsData.maintenance, icon: RefreshCw, color: 'text-orange-500' },
                                     { label: 'رقم الفاتورة القادمة', value: invoiceCounter + 1, icon: Shield, color: 'text-emerald-500' },
                                  ].map((stat, i) => (
                                     <div key={i} className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col items-center text-center gap-1.5">
                                        <stat.icon className={stat.color} size={16} />
                                        <span className="text-sm font-black text-white">{stat.value}</span>
                                        <span className="text-[7px] text-gray-500 uppercase font-black">{stat.label}</span>
                                     </div>
                                  ))}
                               </div>
                            </section>
                         )}

                         {backupSubTab === 'audit' && (
                            <section className="bg-white/5 rounded-[1.5rem] border border-white/10 p-5 space-y-6 rtl:text-right text-gray-200">
                              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3 rtl:flex-row-reverse">
                                  <div className="p-3 bg-orange-600/15 text-orange-500 rounded-xl">
                                    <Shield size={24} />
                                  </div>
                                  <div className="rtl:text-right">
                                    <h3 className="text-lg font-bold text-white font-cairo">تدقيق ومطابقة السجلات الفعلية (Interactive Database Audit)</h3>
                                    <p className="text-xs text-gray-400">تحقق ومقارنة العدادات المسجلة في واجهة الإعدادات والعمليات المالية مع سجلات خادم قاعدة البيانات</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={runDatabaseAudit} 
                                  disabled={isAuditing}
                                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                                >
                                  <RefreshCw size={14} className={isAuditing ? "animate-spin" : ""} />
                                  <span>تحديث الفحص</span>
                                </button>
                              </div>

                              {isAuditing ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-4">
                                  <RefreshCw size={36} className="animate-spin text-orange-500" />
                                  <p className="text-sm text-gray-400 font-bold">جاري تشغيل خوارزميات الفحص والمطابقة لجميع عناصر قاعدة البيانات...</p>
                                </div>
                              ) : auditResults ? (
                                <div className="space-y-6">
                                  {repairProgress.message && (
                                    <div className={`p-4 rounded-2xl border text-xs font-bold ${
                                      repairProgress.status === 'running' ? 'bg-orange-600/10 border-orange-500/30 text-orange-400 font-mono' :
                                      repairProgress.status === 'completed' ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 font-bold' :
                                      repairProgress.status === 'error' ? 'bg-red-600/10 border-red-500/30 text-red-400 font-bold' : 'bg-white/5 border-white/10 text-white'
                                    }`}>
                                      <p>{repairProgress.message}</p>
                                    </div>
                                  )}

                                  <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gradient-to-r from-orange-600/10 to-amber-600/5 rounded-2.5xl border border-orange-500/15 gap-4">
                                    <div className="text-right flex-1 select-none">
                                      <p className="text-white font-black text-sm">تسوية وتصحيح التضاربات تلقائياً</p>
                                      <p className="text-xs text-gray-400 mt-1">تقوم الأداة بمطابقة العدادات، موازنة حركات الصندوق المتصلة بالفواتير الحالية، وتسوية وتصفية مجاميع وعلاقات الفواتير بكبسة زر واحدة.</p>
                                    </div>
                                    <button
                                      onClick={repairAllDiscrepancies}
                                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl font-black text-xs shadow-xl transition-all text-center shrink-0"
                                    >
                                      إصلاح وتصحيح التضاربات تلقائياً
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-white">عداد تسلسل الفواتير</span>
                                        {auditResults.invoiceCounter.conflict ? (
                                          <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-black">تضارب مكتشف</span>
                                        ) : (
                                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black">سليم</span>
                                        )}
                                      </div>
                                      <div className="text-xs space-y-1 text-gray-400 text-right">
                                        <p>العداد المسجل بالإعدادات: <strong className="text-white font-mono">{auditResults.invoiceCounter.registered}</strong></p>
                                        <p>أعلى رقم فاتورة فعلي باللائحة: <strong className="text-white font-mono">{auditResults.invoiceCounter.actualMax}</strong></p>
                                      </div>
                                    </div>

                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-white">عداد تسلسل أرقام العملاء</span>
                                        {auditResults.customerCounter.conflict ? (
                                          <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-black">تضارب مكتشف</span>
                                        ) : (
                                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black">سليم</span>
                                        )}
                                      </div>
                                      <div className="text-xs space-y-1 text-gray-400 text-right">
                                        <p>العداد المسجل بالإعدادات: <strong className="text-white font-mono">{auditResults.customerCounter.registered}</strong></p>
                                        <p>أعلى رقم تسلسلي للعملاء باللائحة: <strong className="text-white font-mono">{auditResults.customerCounter.actualMax}</strong></p>
                                      </div>
                                    </div>

                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-white">مطابقة قيمة الفاتورة ومجاميع الأجهزة</span>
                                        {auditResults.totalDiscrepancies.length > 0 ? (
                                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black">{auditResults.totalDiscrepancies.length} تباينات</span>
                                        ) : (
                                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black">سليم</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-400">يتحقق من دقة اجمالي سعر الفاتورة الأم مقارنة بمجموع تكلفة أجهزة الصيانة المسجلة بداخلها.</p>
                                      {auditResults.totalDiscrepancies.length > 0 && (
                                        <div className="max-h-24 overflow-y-auto space-y-1.5 p-2 bg-black/40 rounded-xl font-mono text-[10px] text-red-300 text-right">
                                          {auditResults.totalDiscrepancies.map((d: any, idx: number) => (
                                            <p key={idx}>فاتورة #{d.invoiceNumber}: الفاتورة ({d.currentTotal}) ↔ المجموع الحقيقي ({d.computedTotal})</p>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-white">مطابقة الحالات والوضع الفني للعمليات</span>
                                        {auditResults.statusDiscrepancies.length > 0 ? (
                                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-black">{auditResults.statusDiscrepancies.length} اختلافات</span>
                                        ) : (
                                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black">سليم</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-400">فحص ملخص الفاتورة الخارجي ومطابقته بذكاء بمراحل الصيانة الفنية الفردية الملحقة.</p>
                                      {auditResults.statusDiscrepancies.length > 0 && (
                                        <div className="max-h-24 overflow-y-auto space-y-1.5 p-2 bg-black/30 rounded-xl font-mono text-[10px] text-amber-300 text-right">
                                          {auditResults.statusDiscrepancies.map((d: any, idx: number) => (
                                            <p key={idx}>فاتورة #{d.invoiceNumber}: مسجل [{getAuditStatusText(d.currentStatus)}] ↔ الفعلي [{getAuditStatusText(d.expectedStatus)}]</p>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-white">تطابق الصندوق والمدفوعات</span>
                                        {auditResults.paymentImbalances.length > 0 ? (
                                          <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-black">{auditResults.paymentImbalances.length} عدم تطابق</span>
                                        ) : (
                                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black">سليم</span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-400">مقارنة وتدقيق المدفوعات المسجلة بالفاتورة مقابل القيود المقبوضة فعلياً في صندوق الخزينة الحقيقية.</p>
                                      {auditResults.paymentImbalances.length > 0 && (
                                        <div className="max-h-28 overflow-y-auto space-y-1.5 p-2 bg-black/30 rounded-xl font-mono text-[10px] text-red-300 text-right">
                                          {auditResults.paymentImbalances.map((d: any, idx: number) => (
                                            <p key={idx}>فاتورة #{d.invoiceNumber}: الفاتورة ({d.amountPaidOnInvoice}) ↔ المقبوض بالصندوق ({d.amountInLedger})</p>
                                          ))}
                                        </div>
                                      )}
                                    </div>

                                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-sm text-white">السجلات اليتيمة والتالفة</span>
                                        {(auditResults.orphanedItems.length > 0 || auditResults.emptyInvoices.length > 0) ? (
                                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-black">تباينات مكتشفة</span>
                                        ) : (
                                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black">سليم</span>
                                        )}
                                      </div>
                                      <div className="text-xs space-y-1 text-gray-400 text-right">
                                        <p>قطع غيار صيانة يتيمة بلا فواتير رئيسية: <strong className="text-white font-mono">{auditResults.orphanedItems.length}</strong></p>
                                        <p>فواتير فارغة كلياً بلا أجهزة مسجلة: <strong className="text-white font-mono">{auditResults.emptyInvoices.length}</strong></p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-12 text-gray-500 select-none">
                                   يرجى النقر فوق "تحديث الفحص" لبدء مراجعة قواعد البيانات والعمليات المتراكمة وتحقيق السلامة.
                                </div>
                              )}
                            </section>
                          )}
                      </motion.div>
                    )}
                  </div>
                )}


                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {activeTab === 'advanced-management' && (
  <div className="space-y-6 pb-8 text-right font-cairo" dir="rtl">
    <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto pt-4">
      {/* 1. Database and Sync Option */}
      <button
        type="button"
        onClick={() => {
          setAdvancedTab('database');
          setAdvancedDbSubTab('sync');
          setActiveAdvancedManagementModal('database-sync');
          setAdvancedDbView('list');
        }}
        className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-all group text-right shadow-lg cursor-pointer mx-4 md:mx-0"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <RefreshCw size={22} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">قاعدة البيانات والمزامنة</h3>
            <p className="text-xs text-gray-400 mt-1">إعدادات الاتصال وقاعدة البيانات الحالية والمزامنة المباشرة</p>
          </div>
        </div>
        <ChevronLeft size={20} className="text-gray-500 group-hover:text-white group-hover:translate-x-[-4px] transition-all" />
      </button>

      {/* 2. Backup Option */}
      <button
        type="button"
        onClick={() => {
          setAdvancedTab('database');
          setAdvancedDbSubTab('backup');
          setActiveAdvancedManagementModal('database-backup');
          setAdvancedDbView('list');
        }}
        className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-all group text-right shadow-lg cursor-pointer mx-4 md:mx-0"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Database size={22} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">نسخ البيانات والمزامنة</h3>
            <p className="text-xs text-gray-400 mt-1">النسخ الاحتياطي اليدوي والتلقائي والأرشفة واستعادة البيانات</p>
          </div>
        </div>
        <ChevronLeft size={20} className="text-gray-500 group-hover:text-white group-hover:translate-x-[-4px] transition-all" />
      </button>

      {/* 3. Devices Management Option */}
      <button
        type="button"
        onClick={() => {
          setAdvancedTab('devices');
          setActiveAdvancedManagementModal('devices');
        }}
        className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/[0.08] border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-all group text-right shadow-lg cursor-pointer mx-4 md:mx-0"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <Cpu size={22} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">إدارة الأجهزة المعتمدة</h3>
            <p className="text-xs text-gray-400 mt-1">الأجهزة المرتبطة بحسابك وصلاحيات الدخول والمزامنة</p>
          </div>
        </div>
        <ChevronLeft size={20} className="text-gray-500 group-hover:text-white group-hover:translate-x-[-4px] transition-all" />
      </button>
    </div>

    {/* Modals for advanced-management options */}
    <AnimatePresence>
      {activeAdvancedManagementModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#1a1a1a] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-5xl sm:rounded-[2rem] border border-white/10 shadow-2xl flex flex-col p-4 md:p-6 overflow-hidden"
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 shrink-0">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                {activeAdvancedManagementModal === 'database-sync' && <RefreshCw className="text-indigo-500" size={20} />}
                {activeAdvancedManagementModal === 'database-backup' && <Database className="text-indigo-500" size={20} />}
                {activeAdvancedManagementModal === 'devices' && <Cpu className="text-indigo-500" size={20} />}
                {activeAdvancedManagementModal === 'database-sync' && 'قاعدة البيانات والمزامنة'}
                {activeAdvancedManagementModal === 'database-backup' && 'نسخ البيانات والمزامنة'}
                {activeAdvancedManagementModal === 'devices' && 'إدارة الأجهزة المعتمدة'}
              </h3>
              <button
                onClick={() => setActiveAdvancedManagementModal(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              >
                <X size={20} className="text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Modal Content container */}
            <div className="flex-1 overflow-y-auto pr-1">
              {activeAdvancedManagementModal === 'database-sync' && (
                <div className="animate-in fade-in duration-200">
                  <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Three Database Mode Selector Boxes at the Very Top */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <button
                                type="button"
                                onClick={() => handleSaveDbMode('LOCAL')}
                                className={`p-5 rounded-2xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                  dbMode === 'LOCAL'
                                    ? 'bg-orange-600/10 border-orange-600 text-orange-500 shadow-xl'
                                    : 'bg-black/20 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                                }`}
                              >
                                <HardDrive size={24} className={dbMode === 'LOCAL' ? 'text-orange-500' : 'text-gray-400'} />
                                <div className="text-center">
                                  <span className="block font-bold text-xs">إصدار محلي (LOCAL)</span>
                                  <span className="text-[9px] text-gray-500 block mt-0.5">SQLite على الجهاز</span>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSaveDbMode('CLOUD')}
                                className={`p-5 rounded-2xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                  dbMode === 'CLOUD'
                                    ? 'bg-orange-600/10 border-orange-600 text-orange-500 shadow-xl'
                                    : 'bg-black/20 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                                }`}
                              >
                                <Globe size={24} className={dbMode === 'CLOUD' ? 'text-orange-500' : 'text-gray-400'} />
                                <div className="text-center">
                                  <span className="block font-bold text-xs">إصدار سحابي (CLOUD)</span>
                                  <span className="text-[9px] text-gray-500 block mt-0.5">Firebase Firestore</span>
                                </div>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSaveDbMode('AUTO')}
                                className={`p-5 rounded-2xl border-2 font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                                  dbMode === 'AUTO'
                                    ? 'bg-orange-600/10 border-orange-600 text-orange-500 shadow-xl'
                                    : 'bg-black/20 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                                }`}
                              >
                                <Cpu size={24} className={dbMode === 'AUTO' ? 'text-orange-500' : 'text-gray-400'} />
                                <div className="text-center">
                                  <span className="block font-bold text-xs">وضع هجين (AUTO)</span>
                                  <span className="text-[9px] text-gray-500 block mt-0.5">تحويل سحابي/محلي تلقائي</span>
                                </div>
                              </button>
                            </div>

                        {/* 2. Status & Sync */}
                        <div className="p-5 md:p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                          <h4 className="font-bold text-white text-sm">الحالة والتشخيص الفعلي والمزامنة</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-black/30 rounded-2xl border border-white/5 flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-orange-600/10 text-orange-500">
                                <HardDrive size={18} />
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 block">مصدر البيانات النشط حالياً</span>
                                <span className="text-sm font-bold text-white">
                                  {activeProvider === 'CLOUD' ? 'السحابة (Firebase)' : 'قاعدة البيانات المحلية (SQLite)'}
                                </span>
                              </div>
                            </div>

                            <div className="p-4 bg-black/30 rounded-2xl border border-white/5 flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-orange-600/10 text-orange-500">
                                <Globe size={18} />
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 block">حالة اتصال الشبكة</span>
                                <span className={`text-sm font-bold ${navigator.onLine ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {navigator.onLine ? 'متصل بالإنترنت' : 'غير متصل بالإنترنت'}
                                </span>
                              </div>
                            </div>

                            {dbMode === 'AUTO' && (
                              <div className="p-4 bg-black/30 rounded-2xl border border-white/5 flex items-center gap-3 sm:col-span-2">
                                <div className="p-2 rounded-lg bg-indigo-600/10 text-indigo-500">
                                  <Fingerprint size={18} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <span className="text-xs text-gray-500 block">معرّف الجهاز (UUID) في الوضع الهجين</span>
                                  <div className="flex items-center justify-between gap-2 mt-1">
                                    <span className="text-sm font-mono font-bold text-white truncate">{deviceUUID}</span>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(deviceUUID);
                                        alert('تم نسخ المعرّف');
                                      }}
                                      className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs transition-colors shrink-0"
                                    >
                                      نسخ
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <h4 className="font-bold text-white text-xs">مزامنة البيانات السحابية والمحلية</h4>
                              <p className="text-[10px] text-gray-500 mt-0.5">تزامن السجلات بين قاعدة البيانات المحلية والسحابة (ثنائي الاتجاه)</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleSyncNow}
                              disabled={syncLoading}
                              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md self-start sm:self-center"
                            >
                              {syncLoading ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                              مزامنة الآن
                            </button>
                          </div>

                          {syncResult.type && (
                            <div className={`p-4 rounded-xl text-xs font-bold border ${syncResult.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                              {syncResult.message}
                            </div>
                          )}

                          {/* 3. Hybrid Advanced Actions Button (Visible only in AUTO mode to users with permission) */}
                          {dbMode === 'AUTO' && hasHybridDbPermission && (
                            <div className="mt-4 space-y-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setHybridResult({ type: null, message: '' });
                                  setShowHybridAdvancedModal(true);
                                }}
                                className="w-full flex items-center justify-between p-4 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/25 hover:border-orange-500/40 rounded-2xl transition-all font-cairo cursor-pointer group text-right"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 bg-orange-500 text-white rounded-xl shadow-[0_0_12px_rgba(249,115,22,0.3)] group-hover:scale-105 transition-transform">
                                    <Cpu size={18} />
                                  </div>
                                  <div className="text-right">
                                    <span className="block text-sm font-bold text-white">صندوق التحكم المتقدم بالوضع الهجين</span>
                                    <span className="block text-[10px] text-gray-400 mt-0.5">إدارة التهيئة الدقيقة ونقل البيانات بين القواعد السحابية والمحلية</span>
                                  </div>
                                </div>
                                <ChevronLeft size={18} className="text-orange-500 group-hover:-translate-x-1 transition-transform" />
                              </button>
                            </div>
                          )}
                        </div>
                        </div>
                </div>
              )}
              {activeAdvancedManagementModal === 'database-backup' && (
                <div className="animate-in fade-in duration-200">
                  {advancedDbView === 'list' ? (
                    <div className="space-y-6 animate-in fade-in duration-200">
                            {/* 3. Maintenance Tools Grid */}
                            <div className="p-5 md:p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                          <h4 className="font-bold text-white text-sm">أدوات الصيانة والنسخ الاحتياطي</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Stats */}
                            <button
                              type="button"
                              onClick={() => setAdvancedDbView('stats')}
                              className="flex items-center gap-3 p-4 bg-[#1e1e1e] hover:bg-[#252525] rounded-2xl border border-white/5 hover:border-orange-500/30 text-right transition-all group shadow-md"
                            >
                              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                <Database size={20} />
                              </div>
                              <div className="flex-1">
                                <span className="block text-sm font-bold text-white">إحصائيات البيانات</span>
                                <span className="block text-[10px] text-gray-500 mt-0.5">تفاصيل وحجم قاعدة البيانات الحالية</span>
                              </div>
                            </button>

                            {/* Audit & Repair */}
                            <button
                              type="button"
                              onClick={() => {
                                setAdvancedDbView('audit');
                                runDatabaseAudit();
                              }}
                              className="flex items-center gap-3 p-4 bg-[#1e1e1e] hover:bg-[#252525] rounded-2xl border border-white/5 hover:border-orange-500/30 text-right transition-all group shadow-md"
                            >
                              <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                                <Shield size={20} />
                              </div>
                              <div className="flex-1">
                                <span className="block text-sm font-bold text-white">تدقيق ومطابقة السجلات</span>
                                <span className="block text-[10px] text-gray-500 mt-0.5">فحص تضاربات العدادات والعمليات وإصلاحها تلقائياً</span>
                              </div>
                            </button>

                            {/* Backup */}
                            <button
                              type="button"
                              onClick={() => setAdvancedDbView('backup_manual')}
                              className="flex items-center gap-3 p-4 bg-[#1e1e1e] hover:bg-[#252525] rounded-2xl border border-white/5 hover:border-orange-500/30 text-right transition-all group shadow-md"
                            >
                              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                                <HardDrive size={20} />
                              </div>
                              <div className="flex-1">
                                <span className="block text-sm font-bold text-white">النسخ الاحتياطي واليدوي</span>
                                <span className="block text-[10px] text-gray-500 mt-0.5">إعداد النسخ التلقائي وبدء نسخ فوري</span>
                              </div>
                            </button>

                            {/* Export */}
                            <button
                              type="button"
                              onClick={() => setAdvancedDbView('export')}
                              className="flex items-center gap-3 p-4 bg-[#1e1e1e] hover:bg-[#252525] rounded-2xl border border-white/5 hover:border-orange-500/30 text-right transition-all group shadow-md"
                            >
                              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                <Download size={20} />
                              </div>
                              <div className="flex-1">
                                <span className="block text-sm font-bold text-white">تصدير بلاس JSON</span>
                                <span className="block text-[10px] text-gray-500 mt-0.5">تصدير ملف شامل ومنظم لكافة البيانات</span>
                              </div>
                            </button>

                            {/* Import */}
                            <button
                              type="button"
                              onClick={() => setAdvancedDbView('import')}
                              className="flex items-center gap-3 p-4 bg-[#1e1e1e] hover:bg-[#252525] rounded-2xl border border-white/5 hover:border-orange-500/30 text-right transition-all group shadow-md"
                            >
                              <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl">
                                <Upload size={20} />
                              </div>
                              <div className="flex-1">
                                <span className="block text-sm font-bold text-white">الاستيراد والاستعادة</span>
                                <span className="block text-[10px] text-gray-500 mt-0.5">استعادة السجلات من ملف نسخة احتياطية</span>
                              </div>
                            </button>

                            {/* Archive */}
                            <button
                              type="button"
                              onClick={() => setAdvancedDbView('archive')}
                              className="flex items-center gap-3 p-4 bg-[#1e1e1e] hover:bg-[#252525] rounded-2xl border border-white/5 hover:border-orange-500/30 text-right transition-all group shadow-md"
                            >
                              <div className="p-3 bg-gray-500/10 text-gray-400 rounded-xl">
                                <Archive size={20} />
                              </div>
                              <div className="flex-1">
                                <span className="block text-sm font-bold text-white">أرشفة السجلات القديمة</span>
                                <span className="block text-[10px] text-gray-500 mt-0.5">مسح ونقل السجلات الأقدم من سنة للأرشيف</span>
                              </div>
                            </button>

                            {/* Factory Reset */}
                            <button
                              type="button"
                              onClick={() => {
                                console.log('Advanced DB - Reset Button clicked');
                                resetAllDataTemp();
                              }}
                              className="flex items-center gap-3 p-4 bg-red-500/5 hover:bg-red-500/10 rounded-2xl border border-red-500/10 hover:border-red-500/30 text-right transition-all group shadow-md col-span-full cursor-pointer"
                            >
                              <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                                <RotateCcw size={20} />
                              </div>
                              <div className="flex-1">
                                <span className="block text-sm font-bold text-red-500">تهيئة النظام (ضبط المصنع)</span>
                                <span className="block text-[10px] text-red-400/75 mt-0.5">تحذير: مسح وتصفير كافة بيانات ومبيعات وإعدادات النظام نهائياً</span>
                              </div>
                            </button>
                          </div>
                        </div>
                        </div>
                  ) : (
                    <motion.div
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="space-y-4"
                            >
                              {/* Subview Back Button */}
                              <button
                                type="button"
                                onClick={() => setAdvancedDbView('list')}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 flex items-center gap-2 text-xs font-bold cursor-pointer"
                              >
                                <ArrowRight size={14} />
                                <span>العودة للوحة تحكم البيانات</span>
                              </button>

                        {advancedDbView === 'stats' && (
                          <section className="bg-white/5 rounded-[1.5rem] border border-white/10 p-5 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="p-3 bg-blue-600 text-white rounded-lg shadow-xl"><Database size={20} /></div>
                              <div>
                                <h3 className="text-lg font-black text-white font-cairo">تفاصيل قاعدة البيانات</h3>
                                <p className="text-[10px] text-gray-500 mt-0.5">فحص حجم البيانات وإجمالي السجلات</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                              {[
                                { label: 'الفواتير المسجلة', value: statsData.invoices, icon: FileText, color: 'text-blue-500' },
                                { label: 'العملاء المسجلين', value: statsData.customers, icon: Smartphone, color: 'text-purple-500' },
                                { label: 'عمليات الصيانة', value: statsData.maintenance, icon: RefreshCw, color: 'text-orange-500' },
                                { label: 'رقم الفاتورة القادمة', value: invoiceCounter + 1, icon: Shield, color: 'text-emerald-500' },
                              ].map((stat, i) => (
                                <div key={i} className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col items-center text-center gap-1.5 shadow-md">
                                  <stat.icon className={stat.color} size={20} />
                                  <span className="text-lg font-black text-white">{stat.value}</span>
                                  <span className="text-[10px] text-gray-500 uppercase font-black">{stat.label}</span>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {advancedDbView === 'backup_manual' && (
                          <section className="bg-white/5 rounded-[1.5rem] border border-white/10 overflow-hidden shadow-2xl">
                             <div className="p-5 border-b border-white/5 bg-gradient-to-br from-emerald-600/10 to-transparent flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg ring-2 ring-emerald-600/20">
                                    <Database size={24} />
                                  </div>
                                  <div>
                                    <h2 className="font-mono text-lg font-black text-white uppercase tracking-tighter">إعدادات ومسار النسخ الاحتياطي</h2>
                                    <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">Automatic & Manual Backups</p>
                                  </div>
                                </div>
                             </div>
                             <div className="p-5 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="p-5 bg-black/40 rounded-[1.5rem] border border-white/5 space-y-4">
                                      <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                            <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-xl"><Clock size={24} /></div>
                                            <span className="font-bold text-sm text-white">النسخ التلقائي</span>
                                         </div>
                                         <label className="relative inline-flex items-center cursor-pointer scale-110">
                                            <input type="checkbox" checked={autoBackup} onChange={e => setAutoBackup(e.target.checked)} className="sr-only peer" />
                                            <div className="w-12 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
                                         </label>
                                      </div>
                                      {autoBackup && (
                                         <div className="space-y-2 pt-2 border-t border-white/5">
                                            <label className="text-[9px] text-gray-400 uppercase font-black tracking-widest block text-right">توقيت إجراء النسخ اليومي</label>
                                            <input type="time" value={backupTime} onChange={e => setBackupTime(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-2xl font-mono text-center focus:border-emerald-500 outline-none" />
                                         </div>
                                      )}
                                   </div>
                                   <div className="p-5 bg-black/40 rounded-[1.5rem] border border-white/5 space-y-3">
                                      <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                            <div className="p-3 bg-emerald-600/10 text-emerald-500 rounded-xl"><HardDrive size={24} /></div>
                                            <span className="font-bold text-sm text-white">مسار حفظ الملفات على الجهاز</span>
                                         </div>
                                         <button
                                           type="button"
                                           onClick={handleSelectBackupFolder}
                                           className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                         >
                                           <HardDrive size={14} />
                                           <span>اختيار المسار</span>
                                         </button>
                                      </div>
                                      <input 
                                        type="text" 
                                        value={backupPath} 
                                        onChange={e => setBackupPath(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-gray-300 focus:border-emerald-500 outline-none" 
                                        placeholder="Documents/SND_Backups"
                                      />
                                      <p className="text-[10px] text-gray-500 leading-tight">
                                        ملاحظة: المجلد المحفوظ مستمر ولا يتم حذفه عند إزالة التطبيق.
                                      </p>
                                   </div>
                                </div>

                                {/* Custom Backup Filename Box */}
                                <div className="p-5 bg-black/40 rounded-[1.5rem] border border-white/5 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2.5 bg-purple-600/10 text-purple-400 rounded-xl">
                                        <FileText size={20} />
                                      </div>
                                      <div>
                                        <span className="font-bold text-sm text-white block">اسم ملف النسخة الاحتياطية</span>
                                        <span className="text-[10px] text-gray-400">التاريخ والوقت افتراضياً (قابل للتغيير بحسب رغبتك)</span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setBackupCustomName(getFormattedBackupTimestamp())}
                                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer"
                                      title="إعادة تعيين التاريخ والوقت الحالي"
                                    >
                                      <RotateCcw size={12} />
                                      <span>إعادة التعيين</span>
                                    </button>
                                  </div>

                                  <div className="flex items-center bg-black/60 border border-white/15 rounded-xl overflow-hidden focus-within:border-purple-500 transition-all dir-ltr" dir="ltr">
                                    <span className="px-3 py-2.5 bg-purple-950/60 text-purple-300 text-xs font-mono font-bold select-none border-r border-white/10">
                                      snd_backup_
                                    </span>
                                    <input
                                      type="text"
                                      value={backupCustomName}
                                      onChange={(e) => setBackupCustomName(e.target.value)}
                                      onFocus={(e) => e.target.select()}
                                      className="w-full bg-transparent px-3 py-2.5 text-white font-mono text-sm outline-none font-bold"
                                      placeholder="202608050443"
                                    />
                                    <span className="px-3 py-2.5 bg-purple-950/60 text-purple-300 text-xs font-mono font-bold select-none border-l border-white/10">
                                      .json
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                                    <span>اسم الملف الكامل: <strong className="text-purple-300 font-mono" dir="ltr">snd_backup_{backupCustomName || getFormattedBackupTimestamp()}.json</strong></span>
                                    <span className="text-gray-500">انقر على النص لتظليله واستبداله</span>
                                  </div>
                                </div>

                                <div className="flex gap-4">
                                   <button onClick={handleSaveSettings} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95 cursor-pointer">حفظ إعدادات المزامنة</button>
                                   <button
                                     disabled={backupLoading}
                                     onClick={handleExportBackup} 
                                     className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                                   >
                                     {backupLoading ? 'جاري تصدير نسخة...' : 'نسخ احتياطي فوري الآن'}
                                   </button>
                                </div>
                             </div>
                          </section>
                        )}

                        {advancedDbView === 'export' && (
                          <section className="bg-white/5 rounded-[1.5rem] border border-white/10 p-8 text-center space-y-4">
                             <div className="p-4 bg-emerald-600/10 text-emerald-500 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                                <Download size={28} />
                             </div>
                             <div>
                                <h3 className="text-xl font-black text-white font-cairo">تصدير بلاس شامل</h3>
                                <p className="text-gray-500 mt-1 text-[11px] max-w-sm mx-auto leading-relaxed">تجهيز وتحميل ملف شامل يحتوي على كافة الحركات المالية، سجلات الصيانة، قاعدة بيانات المهندسين، والعملاء بتنسيق JSON للنسخ الخارجي.</p>
                             </div>
                             <button 
                               disabled={backupLoading}
                               onClick={handleExportBackup} 
                               className="bg-white text-black px-8 py-3 rounded-xl font-black text-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto disabled:opacity-50 cursor-pointer"
                             >
                                <Download size={16} />
                                <span>{backupLoading ? 'جاري تصدير الملف...' : 'بدء تجهيز وتحميل الملف'}</span>
                             </button>
                          </section>
                        )}

                        {advancedDbView === 'import' && (
                          <section className="bg-white/5 rounded-[1.5rem] border border-white/10 p-8 text-center space-y-4">
                             <div className="p-4 bg-orange-600/10 text-orange-500 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                                <Upload size={28} />
                             </div>
                             <div>
                                <h3 className="text-xl font-black text-white font-cairo">استعادة البيانات</h3>
                                <p className="text-gray-500 mt-1 text-[11px] max-w-sm mx-auto leading-relaxed">قم برفع ملف النسخ الاحتياطي (JSON) لإعادة بناء السجلات الحالية. تنبيه: سيؤدي الاستيراد إلى دمج أو استبدال البيانات الحالية.</p>
                             </div>
                             <label className={`max-w-xs mx-auto border border-dashed border-white/20 p-6 rounded-2xl hover:border-orange-500/50 transition-colors cursor-pointer group block ${backupLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <FileText className="mx-auto text-gray-600 group-hover:text-orange-500 transition-colors" size={32} />
                                <p className="mt-2 text-xs text-gray-500">{backupLoading ? 'جاري تحليل واستعادة قاعدة البيانات...' : 'انقر هنا لتحديد ملف النسخ (.json)'}</p>
                                <input 
                                  type="file" 
                                  accept=".json"
                                  className="hidden"
                                  onChange={handleImportBackup}
                                />
                             </label>
                          </section>
                        )}

                        {advancedDbView === 'archive' && (
                          <section className="bg-white/5 rounded-[1.5rem] border border-white/10 p-8 text-center space-y-4">
                             <div className="p-4 bg-gray-600/10 text-gray-400 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                                <Archive size={28} />
                             </div>
                             <div>
                                <h3 className="text-xl font-black text-white font-cairo">أرشفة الملفات والسجلات القديمة</h3>
                                <p className="text-gray-500 mt-1 text-[11px] max-w-sm mx-auto leading-relaxed">تصفية السجلات القديمة من شاشة الصيانة والعمليات النشطة لتسريع تحميل البرنامج، ونقل كافة البيانات المنتهية التي مضى عليها 12 شهراً إلى أرشيف محلي منفصل.</p>
                             </div>
                             <div className="flex justify-center max-w-sm mx-auto">
                                <button 
                                  disabled={backupLoading}
                                  onClick={handleArchive}
                                  className="bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black rounded-xl px-8 py-3.5 transition-all text-xs disabled:opacity-50 cursor-pointer"
                                >
                                  {backupLoading ? 'جاري الأرشفة الآن...' : 'بدء نقل وأرشفة العمليات القديمة (> 12 شهر)'}
                                </button>
                             </div>
                          </section>
                        )}

                        {advancedDbView === 'audit' && (
                          <section className="bg-white/5 rounded-[1.5rem] border border-white/10 p-5 space-y-6 text-gray-200">
                            <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 pb-4 gap-4">
                              <div className="flex items-center gap-3">
                                <div className="p-3 bg-orange-600/15 text-orange-500 rounded-xl">
                                  <Shield size={24} />
                                </div>
                                <div>
                                  <h3 className="text-base font-bold text-white font-cairo">تدقيق ومطابقة السجلات الفعلية (Interactive Database Audit)</h3>
                                  <p className="text-[10px] text-gray-400 font-bold">فحص سلامة العدادات والعمليات وتطابق السحابة والتحقق من سلامة الجداول المالية.</p>
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={runDatabaseAudit} 
                                disabled={isAuditing}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer self-end sm:self-auto"
                              >
                                <RefreshCw size={14} className={isAuditing ? "animate-spin" : ""} />
                                <span>تحديث الفحص</span>
                              </button>
                            </div>

                            {isAuditing ? (
                              <div className="py-12 flex flex-col items-center justify-center gap-4">
                                <RefreshCw size={36} className="animate-spin text-orange-500" />
                                <p className="text-xs text-gray-400 font-bold">جاري مراجعة سلامة وتطابق العدادات ومجاميع السجلات...</p>
                              </div>
                            ) : auditResults ? (
                              <div className="space-y-6">
                                {repairProgress.message && (
                                  <div className={`p-4 rounded-2xl border text-xs font-bold ${
                                    repairProgress.status === 'running' ? 'bg-orange-600/10 border-orange-500/30 text-orange-400 font-mono' :
                                    repairProgress.status === 'completed' ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-400 font-bold' :
                                    repairProgress.status === 'error' ? 'bg-red-600/10 border-red-500/30 text-red-400 font-bold' : 'bg-white/5 border-white/10 text-white'
                                  }`}>
                                    <p>{repairProgress.message}</p>
                                  </div>
                                )}

                                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gradient-to-r from-orange-600/10 to-amber-600/5 rounded-2.5xl border border-orange-500/15 gap-4">
                                  <div className="text-right flex-1">
                                    <p className="text-white font-black text-sm">تسوية وتصحيح التضاربات تلقائياً</p>
                                    <p className="text-[10px] text-gray-400 mt-1">تعديل عداد الفواتير والعملاء، موازنة حركات الصندوق المتصلة بالصيانة، وتسوية مجاميع العلاقات بكبسة زر واحدة.</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={repairAllDiscrepancies}
                                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl font-black text-xs shadow-xl transition-all text-center shrink-0 cursor-pointer"
                                  >
                                    إصلاح وتصحيح التضاربات تلقائياً
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-sm text-white">عداد تسلسل الفواتير</span>
                                      {auditResults.invoiceCounter.conflict ? (
                                        <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-black">تضارب مكتشف</span>
                                      ) : (
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black">سليم</span>
                                      )}
                                    </div>
                                    <div className="text-xs space-y-1 text-gray-400">
                                      <p>العداد المسجل بالإعدادات: <strong className="text-white font-mono">{auditResults.invoiceCounter.registered}</strong></p>
                                      <p>أعلى رقم فاتورة فعلي باللائحة: <strong className="text-white font-mono">{auditResults.invoiceCounter.actualMax}</strong></p>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-sm text-white">عداد تسلسل أرقام العملاء</span>
                                      {auditResults.customerCounter.conflict ? (
                                        <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-black">تضارب مكتشف</span>
                                      ) : (
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black">سليم</span>
                                      )}
                                    </div>
                                    <div className="text-xs space-y-1 text-gray-400">
                                      <p>العداد المسجل بالإعدادات: <strong className="text-white font-mono">{auditResults.customerCounter.registered}</strong></p>
                                      <p>أعلى رقم تسلسلي للعملاء باللائحة: <strong className="text-white font-mono">{auditResults.customerCounter.actualMax}</strong></p>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-sm text-white">مطابقة قيمة الفاتورة ومجاميع الأجهزة</span>
                                      {auditResults.totalDiscrepancies.length > 0 ? (
                                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[10px] font-black">{auditResults.totalDiscrepancies.length} تباينات</span>
                                      ) : (
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black">سليم</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400">التحقق من مجموع أسعار الأجهزة الملحقة مقابل اجمالي الفاتورة العام.</p>
                                    {auditResults.totalDiscrepancies.length > 0 && (
                                      <div className="max-h-24 overflow-y-auto space-y-1.5 p-2 bg-black/40 rounded-xl font-mono text-[10px] text-red-300">
                                        {auditResults.totalDiscrepancies.map((d: any, idx: number) => (
                                          <p key={idx}>فاتورة #{d.invoiceNumber}: الفاتورة ({d.currentTotal}) ↔ المجموع الحقيقي ({d.computedTotal})</p>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-sm text-white">مطابقة الحالات والوضع الفني للعمليات</span>
                                      {auditResults.statusDiscrepancies.length > 0 ? (
                                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-black">{auditResults.statusDiscrepancies.length} اختلافات</span>
                                      ) : (
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black">سليم</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400">مراجعة الحالة الخارجية للفاتورة ومطابقتها بمراحل العمليات الفنية الفردية.</p>
                                    {auditResults.statusDiscrepancies.length > 0 && (
                                      <div className="max-h-24 overflow-y-auto space-y-1.5 p-2 bg-black/30 rounded-xl font-mono text-[10px] text-amber-300">
                                        {auditResults.statusDiscrepancies.map((d: any, idx: number) => (
                                          <p key={idx}>فاتورة #{d.invoiceNumber}: مسجل [{getAuditStatusText(d.currentStatus)}] ↔ الفعلي [{getAuditStatusText(d.expectedStatus)}]</p>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-sm text-white">تطابق الصندوق والمدفوعات</span>
                                      {auditResults.paymentImbalances.length > 0 ? (
                                        <span className="px-2.5 py-1 bg-red-500/10 text-red-500 rounded-lg text-[10px] font-black">{auditResults.paymentImbalances.length} عدم تطابق</span>
                                      ) : (
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black">سليم</span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-400">مقارنة وتدقيق المقبوض الفعلي في صندوق الخزينة مع اجمالي المدفوعات بالفاتورة.</p>
                                    {auditResults.paymentImbalances.length > 0 && (
                                      <div className="max-h-28 overflow-y-auto space-y-1.5 p-2 bg-black/30 rounded-xl font-mono text-[10px] text-red-300">
                                        {auditResults.paymentImbalances.map((d: any, idx: number) => (
                                          <p key={idx}>فاتورة #{d.invoiceNumber}: الفاتورة ({d.amountPaidOnInvoice}) ↔ المقبوض بالصندوق ({d.amountInLedger})</p>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-sm text-white">السجلات اليتيمة والتالفة</span>
                                      {(auditResults.orphanedItems.length > 0 || auditResults.emptyInvoices.length > 0) ? (
                                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-black">تباينات مكتشفة</span>
                                      ) : (
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black">سليم</span>
                                      )}
                                    </div>
                                    <div className="text-xs space-y-1 text-gray-400">
                                      <p>قطع غيار يتيمة بلا فواتير رئيسية: <strong className="text-white font-mono">{auditResults.orphanedItems.length}</strong></p>
                                      <p>فواتير فارغة كلياً بلا أجهزة مسجلة: <strong className="text-white font-mono">{auditResults.emptyInvoices.length}</strong></p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-12 text-gray-500 select-none">
                                 يرجى النقر فوق "تحديث الفحص" لبدء مراجعة قواعد البيانات وتحقيق السلامة.
                              </div>
                            )}
                          </section>
                        )}
                            </motion.div>
                  )}
                </div>
              )}
              {activeAdvancedManagementModal === 'devices' && (
                <div className="animate-in fade-in duration-200 h-full">
                  <DeviceManagement user={user} onBack={() => setActiveAdvancedManagementModal(null)} shopConfig={shopConfig} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
)}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Dialog for Reset Confirmation */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#1a1a1a] w-full max-w-md rounded-[2rem] border border-red-500/30 shadow-2xl p-6 text-center space-y-6"
            >
              <div className="p-4 bg-red-500/10 text-red-500 rounded-full w-20 h-20 mx-auto flex items-center justify-center border border-red-500/20 shadow-inner">
                <RotateCcw size={40} className="animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white font-cairo">تأكيد تهيئة النظام بالكامل؟</h3>
                <p className="text-gray-400 text-sm font-cairo leading-relaxed">
                  تحذير: سيتم حذف كافة البيانات من التطبيق نهائياً (بما في ذلك الفواتير، العملاء، الحركات المالية، الإعدادات، والحسابات الإضافية) وتصفير جميع العدادات والمبيعات. لا يمكن التراجع عن هذا الإجراء!
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetConfirm(false);
                    resetAllDataTemp(true); // Bypass and run deletion
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-xl font-bold font-cairo transition-all shadow-lg active:scale-95 cursor-pointer"
                >
                  نعم، احذف كل شيء
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-xl font-bold font-cairo transition-all active:scale-95 border border-white/10 cursor-pointer"
                >
                  إلغاء الأمر
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Custom Reset Status Modal */}
        {resetStatus.type && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-[2rem] border p-6 text-center space-y-6 ${
                resetStatus.type === 'success' 
                  ? 'bg-[#121212] border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]' 
                  : 'bg-[#121212] border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]'
              }`}
            >
              <div className={`p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center border shadow-inner ${
                resetStatus.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {resetStatus.type === 'success' ? <CheckCircle size={40} className="animate-bounce" /> : <XCircle size={40} />}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white font-cairo">
                  {resetStatus.type === 'success' ? 'تمت تهيئة النظام!' : 'فشل الإجراء'}
                </h3>
                <p className="text-gray-350 text-sm font-cairo leading-relaxed">
                  {resetStatus.message}
                </p>
              </div>

              {resetStatus.type === 'error' && (
                <button
                  type="button"
                  onClick={() => setResetStatus({ type: null, message: '' })}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold font-cairo transition-all cursor-pointer"
                >
                  حسناً
                </button>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Hybrid Advanced Control Toolbox Modal */}
        {showHybridAdvancedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#161616] w-full max-w-2xl rounded-[2.5rem] border border-orange-500/20 shadow-2xl overflow-hidden font-cairo flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-white/5 bg-[#1a1a1a] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-600/15 text-orange-500 rounded-2xl">
                    <Cpu size={24} className="animate-pulse" />
                  </div>
                  <div className="text-right">
                    <h3 className="font-black text-white text-lg font-cairo">صندوق التحكم المتقدم بالوضع الهجين</h3>
                    <p className="text-xs text-gray-400 mt-0.5">التهيئة الدقيقة ونقل البيانات بين القواعد السحابية والمحلية</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHybridAdvancedModal(false)}
                  className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                {/* Tabs */}
                <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setHybridAdvancedTab('transfer');
                      setHybridDbType('none');
                      setHybridResult({ type: null, message: '' });
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${hybridAdvancedTab === 'transfer' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    نقل بيانات
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHybridAdvancedTab('reset');
                      setHybridDbType('none');
                      setHybridResult({ type: null, message: '' });
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${hybridAdvancedTab === 'reset' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                  >
                    تهيئة دقيقة
                  </button>
                </div>

                {/* Select Database */}
                <div className="p-4 md:p-5 bg-white/5 rounded-2xl space-y-3 text-right">
                  <label className="text-xs font-bold text-gray-300 block">حدد نوع قاعدة البيانات المستهدفة كـ (القاعدة 1):</label>
                  <select
                    value={hybridDbType}
                    onChange={(e) => {
                      setHybridDbType(e.target.value as 'none' | 'CLOUD' | 'LOCAL');
                      setHybridResult({ type: null, message: '' });
                    }}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:border-orange-500 outline-none transition-all font-cairo text-right"
                  >
                    <option value="none">حدد نوع القاعدة المستهدفة كقاعدة 1</option>
                    <option value="CLOUD">قاعدة بيانات سحابية (CLOUD)</option>
                    <option value="LOCAL">قاعدة بيانات محلية (LOCAL)</option>
                  </select>
                </div>

                {/* Table Customization List */}
                <div className="mt-4 bg-black/30 border border-white/5 rounded-2xl p-4 text-right">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 pb-4 border-b border-white/5 gap-3">
                    <div>
                      <span className="text-sm font-bold text-white block">الجداول المشمولة في الإجراء</span>
                      <span className="text-xs text-gray-400">حدد الجداول المطلوبة من القائمة ({hybridSelectedTables.length} محدد من {DEFAULT_HYBRID_TABLES.length})</span>
                    </div>

                    {/* 3 Selection Controls: الكل / الثابتة / المتغيرة */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                      {/* الكل */}
                      <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        DEFAULT_HYBRID_TABLES.every(t => hybridSelectedTables.includes(t))
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}>
                        <input
                          type="checkbox"
                          checked={DEFAULT_HYBRID_TABLES.every(t => hybridSelectedTables.includes(t))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setHybridSelectedTables([...DEFAULT_HYBRID_TABLES]);
                            } else {
                              setHybridSelectedTables([]);
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-orange-500 focus:ring-orange-500 bg-black/50 border-white/20 cursor-pointer"
                        />
                        <span>الكل</span>
                        <span className="text-[10px] opacity-70">({DEFAULT_HYBRID_TABLES.length})</span>
                      </label>

                      {/* الثابتة */}
                      <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        STATIC_HYBRID_TABLES.every(t => hybridSelectedTables.includes(t))
                          ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}>
                        <input
                          type="checkbox"
                          checked={STATIC_HYBRID_TABLES.every(t => hybridSelectedTables.includes(t))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setHybridSelectedTables(prev => Array.from(new Set([...prev, ...STATIC_HYBRID_TABLES])));
                            } else {
                              setHybridSelectedTables(prev => prev.filter(t => !STATIC_HYBRID_TABLES.includes(t)));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-blue-500 focus:ring-blue-500 bg-black/50 border-white/20 cursor-pointer"
                        />
                        <span>الثابتة</span>
                        <span className="text-[10px] opacity-70">({STATIC_HYBRID_TABLES.length})</span>
                      </label>

                      {/* المتغيرة */}
                      <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        DYNAMIC_HYBRID_TABLES.every(t => hybridSelectedTables.includes(t))
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}>
                        <input
                          type="checkbox"
                          checked={DYNAMIC_HYBRID_TABLES.every(t => hybridSelectedTables.includes(t))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setHybridSelectedTables(prev => Array.from(new Set([...prev, ...DYNAMIC_HYBRID_TABLES])));
                            } else {
                              setHybridSelectedTables(prev => prev.filter(t => !DYNAMIC_HYBRID_TABLES.includes(t)));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-emerald-500 bg-black/50 border-white/20 cursor-pointer"
                        />
                        <span>المتغيرة</span>
                        <span className="text-[10px] opacity-70">({DYNAMIC_HYBRID_TABLES.length})</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Table List split by category */}
                  <div className="space-y-4">
                    {/* 1. Static Tables */}
                    <div>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                          الجداول الثابتة (بيانات المراجع والتهيئات)
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {STATIC_HYBRID_TABLES.filter(t => hybridSelectedTables.includes(t)).length} / {STATIC_HYBRID_TABLES.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {STATIC_HYBRID_TABLES.map(tableName => (
                          <label key={tableName} className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/5 transition-all cursor-pointer group">
                            <div className="flex flex-col text-right">
                              <span className="text-[11px] font-mono font-bold text-gray-200 group-hover:text-white transition-colors">{tableName}</span>
                              <span className="text-[10px] text-gray-400">{TABLE_ARABIC_NAMES[tableName] || tableName}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={hybridSelectedTables.includes(tableName)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setHybridSelectedTables(prev => [...prev, tableName]);
                                } else {
                                  setHybridSelectedTables(prev => prev.filter(t => t !== tableName));
                                }
                              }}
                              className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 bg-black/50 border-white/20 cursor-pointer"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 2. Dynamic Tables */}
                    <div>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                          الجداول المتغيرة (الحركات والعمليات اليومية)
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {DYNAMIC_HYBRID_TABLES.filter(t => hybridSelectedTables.includes(t)).length} / {DYNAMIC_HYBRID_TABLES.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {DYNAMIC_HYBRID_TABLES.map(tableName => (
                          <label key={tableName} className="flex items-center justify-between bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/5 transition-all cursor-pointer group">
                            <div className="flex flex-col text-right">
                              <span className="text-[11px] font-mono font-bold text-gray-200 group-hover:text-white transition-colors">{tableName}</span>
                              <span className="text-[10px] text-gray-400">{TABLE_ARABIC_NAMES[tableName] || tableName}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={hybridSelectedTables.includes(tableName)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setHybridSelectedTables(prev => [...prev, tableName]);
                                } else {
                                  setHybridSelectedTables(prev => prev.filter(t => t !== tableName));
                                }
                              }}
                              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-black/50 border-white/20 cursor-pointer"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div>
                  {/* Action 1: Precise Reset */}
                  {hybridAdvancedTab === 'reset' && (
                  <div className="flex flex-col gap-3 p-5 bg-red-500/5 rounded-3xl border border-red-500/10 hover:border-red-500/20 transition-all text-right">
                    <div className="flex-1 space-y-1">
                      <span className="block text-sm font-black text-red-500">التهيئة الدقيقة للبيانات</span>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {hybridDbType === 'none' 
                          ? 'يرجى تحديد نوع قاعدة البيانات لتفعيل التهيئة.'
                          : hybridDbType === 'CLOUD'
                          ? 'سيتم مسح البيانات وتصفير العدادات تماماً من السحابة (للجداول المحددة فقط).'
                          : 'سيتم مسح البيانات وتصفير أرصدة الخزائن تماماً من قاعدة البيانات المحلية (للجداول المحددة فقط).'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePreciseReset}
                      disabled={hybridDbType === 'none' || preciseResetLoading}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md font-cairo mt-2"
                    >
                      {preciseResetLoading ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                      تنفيذ الإجراء
                    </button>
                  </div>
                  )}

                  {/* Action 2: Transfer Data */}
                  {hybridAdvancedTab === 'transfer' && (
                  <div className="flex flex-col gap-3 p-5 bg-orange-600/5 rounded-3xl border border-orange-500/10 hover:border-orange-500/20 transition-all text-right">
                    <div className="flex-1 space-y-1">
                      <span className="block text-sm font-black text-orange-500">نقل ومزامنة البيانات</span>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {hybridDbType === 'none'
                          ? 'يرجى تحديد نوع قاعدة البيانات لتفعيل نقل البيانات.'
                          : hybridDbType === 'CLOUD'
                          ? 'سيتم نقل كافة السجلات ومحتويات الجداول المحددة بالكامل من السحابة (القاعدة 1) إلى قاعدة البيانات المحلية (القاعدة 2).'
                          : 'سيتم نقل كافة السجلات ومحتويات الجداول المحددة بالكامل من المحلية (القاعدة 1) إلى السحابية (القاعدة 2).'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleTransferData}
                      disabled={hybridDbType === 'none' || dataTransferLoading}
                      className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-30 disabled:hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md font-cairo mt-2"
                    >
                      {dataTransferLoading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                      تنفيذ الإجراء
                    </button>
                  </div>
                  )}
                </div>

                {/* Progress Indicators inside the Modal */}
                {(preciseResetLoading || dataTransferLoading) && (
                  <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl flex items-center justify-center gap-3 text-orange-500 text-xs font-bold font-cairo">
                    <RefreshCw size={16} className="animate-spin" />
                    <span>جاري معالجة العملية الجارية... يرجى عدم إغلاق هذه النافذة.</span>
                  </div>
                )}

                {/* Status Result Message */}
                {hybridResult.type && (
                  <div className={`p-4 md:p-5 rounded-2xl text-xs font-bold border text-right font-cairo leading-relaxed ${
                    hybridResult.type === 'success' 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/25 shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                  }`}>
                    {hybridResult.message}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 md:p-6 bg-[#1a1a1a] border-t border-white/5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowHybridAdvancedModal(false)}
                  className="bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 px-6 rounded-xl text-xs font-cairo transition-all cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {/* Local Database Schema Modal */}
        {showSchemaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#111111] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
              dir="rtl"
            >
              <div className="p-5 md:p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#111111]/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                    <Database size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white font-cairo">مستكشف قاعدة البيانات المحلية</h2>
                    <p className="text-xs text-gray-400 mt-1 font-cairo">جداول النظام والحقول المنشأة في قاعدة SQLite</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSchemaModal(false)}
                  className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {Object.entries(dbSchemas).map(([tableName, columns]) => {
                  const cols = columns as string[];
                  return (
                  <div key={tableName} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <h3 className="text-indigo-400 font-bold mb-3 flex items-center gap-2">
                      <Database size={16} />
                      {tableName}
                      <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded-full mr-auto">
                        {cols.length} حقول
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {cols.map(col => (
                        <span key={col} className="bg-black/50 border border-white/5 px-2 py-1 rounded-lg text-xs font-mono text-gray-300">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )})}
                
                {Object.keys(dbSchemas).length === 0 && (
                  <div className="text-center py-10 text-gray-500">
                    لا توجد جداول أو لم يتم تهيئة القاعدة
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Hybrid Custom Selection Modal */}
        
      </AnimatePresence>
    </div>
  );
}

function DeviceSupportWarning({ type }: { type: 'biometric' | 'pin' }) {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      const info = await Device.getInfo();
      if (info.platform === 'web' && type === 'biometric') {
        setSupported(false);
        return;
      }
      if (type === 'biometric') {
    
    try {
          const bio = await NativeBiometric.isAvailable();
          setSupported(bio.isAvailable);
        } catch {
          setSupported(false);
        }
      } else {
        setSupported(true);
      }
    };
    check();
  }, [type]);

  if (supported === false) {
    return (
      <p className="text-[10px] text-red-400 font-bold mt-1 animate-pulse">
        ⚠️ هذا الجهاز لا يدعم {type === 'biometric' ? 'البصمة' : 'PIN'}
      </p>
    );
  }
  return null;
}
