import React, { useEffect, useState } from 'react';
import { parseDate } from '../lib/dateUtils';
import { Device } from '@capacitor/device';
import { ProviderFactory } from '../data/ProviderFactory';
import { localDb } from '../lib/local-db';
import { UserDevice } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Coins, 
  Wallet, 
  CreditCard, 
  Check, 
  X, 
  Settings, 
  AlertCircle,
  Hash,
  Activity,
  Award,
  Smartphone,
  Wifi,
  WifiOff,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Filter,
  ArrowUpDown,
  UserCheck,
  Calendar,
  Info,
  Save,
  RotateCcw,
  Search
} from 'lucide-react';

interface FinTransactionType {
  id: string;
  name: string;
  type: 'receipt' | 'payment';
}

interface FinFund {
  id: string;
  name: string;
  type: 'cash' | 'bank';
  currency: string;
  description: string;
  status: 'active' | 'suspended';
  balance: number;
  bankAccount?: string;
}

interface FinCurrency {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  status: 'active' | 'suspended';
}

interface FinPaymentMethod {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'suspended';
}

export default function AccountingInputs() {
  const [subTab, setSubTab] = useState<'types' | 'funds' | 'currencies' | 'methods' | 'user_devices' | 'job_titles' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValidationError, setFormValidationError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States for lists
  const [txTypes, setTxTypes] = useState<FinTransactionType[]>([]);
  const [funds, setFunds] = useState<FinFund[]>([]);
  const [currencies, setCurrencies] = useState<FinCurrency[]>([]);
  const [methods, setMethods] = useState<FinPaymentMethod[]>([]);
  const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);

  // Job Title form
  const [jobTitleForm, setJobTitleForm] = useState({ id: '', job_number: '', title: '', notes: '' });
  const [editingJobTitleId, setEditingJobTitleId] = useState<string | null>(null);

  // Form states - Types
  const [typeForm, setTypeForm] = useState<{ id?: string; name: string; type: 'receipt' | 'payment' }>({
    name: '',
    type: 'receipt'
  });
  const [showTypeForm, setShowTypeForm] = useState(false);

  // Form states - Funds
  const [fundForm, setFundForm] = useState<{
    id?: string;
    name: string;
    type: 'cash' | 'bank';
    currency: string;
    description: string;
    status: 'active' | 'suspended';
    bankAccount?: string;
  }>({
    name: '',
    type: 'cash',
    currency: 'دولار',
    description: '',
    status: 'active',
    bankAccount: ''
  });
  const [showFundForm, setShowFundForm] = useState(false);

  // Form states - Currencies
  const [currencyForm, setCurrencyForm] = useState<{
    id?: string;
    name: string;
    symbol: string;
    decimals: number;
    status: 'active' | 'suspended';
  }>({
    name: '',
    symbol: '',
    decimals: 2,
    status: 'active'
  });
  const [showCurrencyForm, setShowCurrencyForm] = useState(false);

  // Form states - Methods
  const [methodForm, setMethodForm] = useState<{
    id?: string;
    name: string;
    description: string;
    status: 'active' | 'suspended';
  }>({
    name: '',
    description: '',
    status: 'active'
  });
  const [showMethodForm, setShowMethodForm] = useState(false);

  // Form states - User Devices
  const [deviceForm, setDeviceForm] = useState<{
    id?: string;
    deviceNumber: number;
    serialImei: string;
    deviceName: string;
    deviceType: "مخصص" | "عام";
    linkedUserName: string;
    status: 'نشط' | 'معطل' | 'محظور';
    networkStatus: 'متصل' | 'غير متصل';
    notes: string;
    isFrozen: boolean;
  }>({
    deviceNumber: 1001,
    serialImei: '869402051234567',
    deviceName: "جهاز الورشة الرئيسية - POS-01",
    deviceType: "عام",
    linkedUserName: 'مدير النظام',
    status: 'نشط',
    networkStatus: 'متصل',
    notes: 'جهاز نُظم رئيسي مخصص لإدخال الفواتير والمبيعات والحسابات',
    isFrozen: false
  });
  const [showDeviceForm, setShowDeviceForm] = useState(false);

  // User Device Table Filters & Sorting
  const [devSortOrder, setDevSortOrder] = useState<'asc' | 'desc'>('asc');
  const [devFilterStatus, setDevFilterStatus] = useState<string>('all');
  const [devFilterNetwork, setDevFilterNetwork] = useState<string>('all');
  const [devSearchQuery, setDevSearchQuery] = useState<string>('');
  const [systemUsers, setSystemUsers] = useState<{id: string, name: string}[]>([]);

  // Device Detail Popup Modal
  const [selectedDeviceForDetail, setSelectedDeviceForDetail] = useState<UserDevice | null>(null);
  const [isEditingDetailModal, setIsEditingDetailModal] = useState(false);
  const [detailForm, setDetailForm] = useState<UserDevice | null>(null);

  // Load Data Helper
  const loadAllData = async () => {
    setLoading(true);
    try {
      const provider = ProviderFactory.getProvider();
      const typesRes = await provider.getDocs('fin_transaction_types');
      setTxTypes(typesRes.docs.map((d: any) => ({ id: d.id, ...d.data() })) as FinTransactionType[]);
      const fundsRes = await provider.getDocs('fin_funds');
      setFunds(fundsRes.docs.map((d: any) => ({ id: d.id, ...d.data() })) as FinFund[]);
      const currRes = await provider.getDocs('fin_currencies');
      setCurrencies(currRes.docs.map((d: any) => ({ id: d.id, ...d.data() })) as FinCurrency[]);
      const methRes = await provider.getDocs('fin_payment_methods');
      setMethods(methRes.docs.map((d: any) => ({ id: d.id, ...d.data() })) as FinPaymentMethod[]);

      // Load Job Titles
      try {
        const jobsRes = await provider.getDocs('job_titles');
        let fetchedJobs = jobsRes.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];
        if (!fetchedJobs || fetchedJobs.length === 0) {
          const localJobs = await localDb.query('SELECT * FROM job_titles');
          if (localJobs && localJobs.values) fetchedJobs = localJobs.values;
        }
        setJobTitles(fetchedJobs);
      } catch (e) {
        try {
          const localJobs = await localDb.query('SELECT * FROM job_titles');
          if (localJobs && localJobs.values) setJobTitles(localJobs.values);
        } catch (lErr) {}
      }

      // Load Users for dropdown
      try {
        const usersRes = await provider.getDocs('users');
        let fetchedUsers = usersRes.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];
        if (!fetchedUsers || fetchedUsers.length === 0) {
          const localRes = await localDb.query('SELECT * FROM users');
          if (localRes && localRes.values) {
            fetchedUsers = localRes.values;
          }
        }
        setSystemUsers(fetchedUsers.map((u, idx) => ({ id: u.id || `user-${idx}`, name: u.name || u.username || `مستخدم ${idx + 1}` })));
      } catch (err) {
        try {
          const localRes = await localDb.query('SELECT * FROM users');
          setSystemUsers((localRes?.values || []).map((u: any, idx: number) => ({ id: u.id || `user-${idx}`, name: u.name || u.username || `مستخدم ${idx + 1}` })));
        } catch (lErr) {}
      }

      // Load User Devices
      try {
        const devRes = await provider.getDocs('user_devices');
        let fetchedDevs = devRes.docs.map((d: any) => ({ id: d.id, ...d.data() })) as UserDevice[];
        if (!fetchedDevs || fetchedDevs.length === 0) {
          const localRes = await localDb.query('SELECT * FROM user_devices ORDER BY deviceNumber ASC');
          if (localRes && localRes.values) {
            fetchedDevs = localRes.values as UserDevice[];
          }
        }
        setUserDevices(fetchedDevs || []);
      } catch (devErr) {
        console.warn('Failed cloud fetch user_devices, reading local DB:', devErr);
        try {
          const localRes = await localDb.query('SELECT * FROM user_devices ORDER BY deviceNumber ASC');
          setUserDevices((localRes?.values as UserDevice[]) || []);
        } catch (lErr) {}
      }

    } catch (err: any) {
      setError(err?.message || 'خطأ في تحميل البيانات المالية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const triggerNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Helper for auto-calculating next device number
  const getNextDeviceNumber = (list: UserDevice[]) => {
    if (!list || list.length === 0) return 1001;
    const nums = list.map(d => Number(d.deviceNumber) || 0).filter(n => n > 0);
    return nums.length > 0 ? Math.max(...nums) + 1 : 1001;
  };

  const prepareNewDeviceForm = async () => {
    const nextNum = getNextDeviceNumber(userDevices);
    let autoDeviceId = '';
    try {
      const devIdObj = await Device.getId();
      autoDeviceId = devIdObj?.identifier || '';
    } catch (e) {}

    setDeviceForm({
      deviceNumber: nextNum,
      serialImei: autoDeviceId || '869402051234567',
      deviceName: "جهاز الورشة الرئيسية - POS-01",
      deviceType: "عام",
      linkedUserName: 'مدير النظام',
      status: 'نشط',
      networkStatus: 'متصل',
      notes: 'جهاز نُظم مخصص لإدخال وقراءة الفواتير والحسابات',
      isFrozen: false
    });
    setFormValidationError(null);
    setShowDeviceForm(true);
  };

  // ----- SUBMIT HANDLERS -----

  // 0. User Device Submit (With Strict Mandatory Field Enforcement)
  const handleDeviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationError(null);

    // Strict validation: check mandatory fields
    if (!deviceForm.serialImei || !deviceForm.serialImei.trim()) {
      setFormValidationError('تنبيه رقابي حازم: حقل [الرقم التسلسلي أو IMEI] إلزامي ولا يمكن ترحيل البيانات وهو فارغ!');
      return;
    }
    if (!deviceForm.deviceName || !deviceForm.deviceName.trim()) {
      setFormValidationError('تنبيه رقابي حازم: حقل [اسم الجهاز في النظام] إلزامي ولا يمكن ترحيل البيانات وهو فارغ!');
      return;
    }
    if (!deviceForm.linkedUserName || !deviceForm.linkedUserName.trim()) {
      setFormValidationError('تنبيه رقابي حازم: حقل [اسم مستخدم النظام المرتبط بالجهاز] إلزامي ولا يمكن ترحيل البيانات وهو فارغ!');
      return;
    }

    try {
      const nowIso = new Date().toISOString();
      const devId = deviceForm.id || `dev-uuid-${Math.random().toString(36).substring(2, 10)}-${Date.now()}`;
      
      const newDevRecord: UserDevice = {
        id: devId,
        deviceNumber: Number(deviceForm.deviceNumber) || getNextDeviceNumber(userDevices),
        serialImei: deviceForm.serialImei.trim(),
        deviceName: deviceForm.deviceName.trim(),
        deviceType: deviceForm.deviceType,
        linkedUserName: deviceForm.linkedUserName.trim(),
        linkedUserId: deviceForm.linkedUserId || '',
        status: deviceForm.status,
        networkStatus: deviceForm.networkStatus,
        createdAt: nowIso,
        lastLogin: nowIso,
        lastLogout: 'لا يوجد',
        blockDate: deviceForm.status === 'محظور' ? nowIso : 'لا يوجد',
        createdByUserId: 'admin-01',
        createdByUserName: 'مدير النظام',
        notes: deviceForm.notes ? deviceForm.notes.trim() : 'لا توجد ملاحظات',
        isFrozen: deviceForm.isFrozen,
        updatedAt: nowIso
      };

      // 1. Save to Cloud Firestore
      await ProviderFactory.getProvider().setDoc('user_devices', devId, newDevRecord);

      // 2. Save to local SQLite
      try {
        await localDb.run(
          `INSERT OR REPLACE INTO user_devices (
            id, deviceNumber, serialImei, deviceName, deviceType, linkedUserName, linkedUserId,
            status, networkStatus, createdAt, lastLogin, lastLogout, blockDate,
            createdByUserId, createdByUserName, notes, isFrozen, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newDevRecord.id,
            newDevRecord.deviceNumber,
            newDevRecord.serialImei,
            newDevRecord.deviceName,
            newDevRecord.deviceType || "عام",
            newDevRecord.linkedUserName,
            newDevRecord.linkedUserId,
            newDevRecord.status,
            newDevRecord.networkStatus,
            newDevRecord.createdAt,
            newDevRecord.lastLogin,
            newDevRecord.lastLogout,
            newDevRecord.blockDate,
            newDevRecord.createdByUserId,
            newDevRecord.createdByUserName,
            newDevRecord.notes,
            newDevRecord.isFrozen ? 1 : 0,
            newDevRecord.updatedAt
          ]
        );
      } catch (sqlErr) {
        console.error('Local SQLite user_devices insert failed:', sqlErr);
      }

      triggerNotification('تم ترحيل وإضافة جهاز النظام بنجاح!');
      setShowDeviceForm(false);
      loadAllData();
    } catch (err: any) {
      setError(err?.message || 'فشل ترحيل إضافة الجهاز');
    }
  };

  // Detail Modal Save
  const handleSaveDetailModal = async () => {
    if (!detailForm) return;
    const serial = (detailForm.serialImei || '').trim();
    const devName = (detailForm.deviceName || '').trim();
    const user = (detailForm.linkedUserName || '').trim();

    if (!serial || !devName || !user) {
      alert('تنبيه: جميع الحقول الرئيسية (الرقم التسلسلي، اسم الجهاز، واسم المستخدم) إلزامية!');
      return;
    }

    try {
      const updatedDev: UserDevice = {
        ...detailForm,
        serialImei: serial,
        deviceName: devName,
        linkedUserName: user,
        updatedAt: new Date().toISOString()
      };

      await ProviderFactory.getProvider().setDoc('user_devices', updatedDev.id, updatedDev);
      try {
        await localDb.run(
          `INSERT OR REPLACE INTO user_devices (
            id, deviceNumber, serialImei, deviceName, deviceType, linkedUserName, linkedUserId,
            status, networkStatus, createdAt, lastLogin, lastLogout, blockDate,
            createdByUserId, createdByUserName, notes, isFrozen, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            updatedDev.id,
            updatedDev.deviceNumber,
            updatedDev.serialImei,
            updatedDev.deviceName,
            updatedDev.deviceType || "عام",
            updatedDev.linkedUserName,
            updatedDev.linkedUserId || '',
            updatedDev.status || 'نشط',
            updatedDev.networkStatus || 'متصل',
            updatedDev.createdAt || new Date().toISOString(),
            updatedDev.lastLogin || '',
            updatedDev.lastLogout || '',
            updatedDev.blockDate || '',
            updatedDev.createdByUserId || '',
            updatedDev.createdByUserName || '',
            updatedDev.notes || '',
            updatedDev.isFrozen ? 1 : 0,
            updatedDev.updatedAt
          ]
        );
      } catch (sq) {}

      setSelectedDeviceForDetail(updatedDev);
      setIsEditingDetailModal(false);
      triggerNotification('تم تحديث بيانات الجهاز بنجاح!');
      loadAllData();
    } catch (e: any) {
      alert('خطأ في حفظ التعديلات: ' + e.message);
    }
  };

  // Freeze/Unfreeze toggle handler
  const handleToggleFreeze = async (device: UserDevice) => {
    const newFrozenState = !device.isFrozen;
    const updatedDev = {
      ...device,
      isFrozen: newFrozenState,
      updatedAt: new Date().toISOString()
    };
    try {
      await ProviderFactory.getProvider().setDoc('user_devices', device.id, updatedDev);
      try {
        await localDb.run('UPDATE user_devices SET isFrozen = ? WHERE id = ?', [newFrozenState ? 1 : 0, device.id]);
      } catch (sq) {}
      
      setSelectedDeviceForDetail(updatedDev);
      setDetailForm(updatedDev);
      triggerNotification(newFrozenState ? 'تم تجميد الجهاز مؤقتاً' : 'تم إلغاء تجميد الجهاز');
      loadAllData();
    } catch (e: any) {
      alert('فشلت العملية: ' + e.message);
    }
  };

  // Permanent Block handler
  // Delete Device handler

  const handleDeleteDevice = async (deviceId: string) => {

    if (!confirm("هل أنت متأكد من حذف هذا الجهاز؟")) return;

    try {

      await ProviderFactory.getProvider().deleteDoc("user_devices", deviceId);

      try {

        await localDb.run("DELETE FROM user_devices WHERE id = ?", [deviceId]);

      } catch (sq) {}

      triggerNotification("تم حذف الجهاز بنجاح");

      setSelectedDeviceForDetail(null);

      loadAllData();

    } catch (e: any) {

      alert("فشلت العملية: " + e.message);

    }

  };


  const handleBlockDevice = async (device: UserDevice) => {
    if (!confirm('هل أنت متأكد من حظر هذا الجهاز بصفة نهائية؟ سيتم تسجيل خروج هويته من النظام.')) return;
    const nowIso = new Date().toISOString();
    const updatedDev = {
      ...device,
      status: 'محظور',
      blockDate: nowIso,
      lastLogout: nowIso,
      updatedAt: nowIso
    };
    try {
      await ProviderFactory.getProvider().setDoc('user_devices', device.id, updatedDev);
      try {
        await localDb.run('UPDATE user_devices SET status = ?, blockDate = ?, lastLogout = ? WHERE id = ?', ['محظور', nowIso, nowIso, device.id]);
      } catch (sq) {}

      setSelectedDeviceForDetail(updatedDev);
      setDetailForm(updatedDev);
      triggerNotification('تم حظر الجهاز نهائياً وتسجيل خروجه');
      loadAllData();
    } catch (e: any) {
      alert('فشل حظر الجهاز: ' + e.message);
    }
  };

  // ----- SUBMIT HANDLERS -----

  // 1. Transaction Type Submit
  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.name.trim()) return;

    try {
      if (typeForm.id) {
        // Edit
        await ProviderFactory.getProvider().updateDoc('fin_transaction_types', typeForm.id, { name: typeForm.name.trim(), type: typeForm.type });
        triggerNotification('تم تحديث نوع العملية المالية بنجاح');
      } else {
        // Add
        const newId = `rec-${Math.random().toString(36).substring(2, 8)}`;
        await ProviderFactory.getProvider().setDoc('fin_transaction_types', newId, { name: typeForm.name.trim(), type: typeForm.type });
        triggerNotification('تم إضافة نوع العملية المالية بنجاح');
      }
      setTypeForm({ name: '', type: 'receipt' });
      setShowTypeForm(false);
      loadAllData();
    } catch (err: any) {
      setError(err?.message || 'فشلت العملية');
    }
  };

  // Delete Type
  const [deleteTypeConfirmId, setDeleteTypeConfirmId] = useState<string | null>(null);

  const handleDeleteType = async (id: string) => {
    if (deleteTypeConfirmId === id) {
      try {
        await ProviderFactory.getProvider().deleteDoc('fin_transaction_types', id);
        triggerNotification('تم حذف البند بنجاح');
        setDeleteTypeConfirmId(null);
        loadAllData();
      } catch (err: any) {
        setError(err.message || 'فشلت عملية الحذف');
      }
    } else {
      setDeleteTypeConfirmId(id);
      setTimeout(() => setDeleteTypeConfirmId(null), 3000);
    }
  };

  // 2. Fund Submit
  const handleFundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundForm.name.trim()) return;

    try {
      if (fundForm.id) {
        // Edit path
        await ProviderFactory.getProvider().updateDoc('fin_funds', fundForm.id, {
          name: fundForm.name.trim(),
          type: fundForm.type,
          currency: fundForm.currency,
          description: fundForm.description.trim(),
          status: fundForm.status,
          bankAccount: fundForm.type === 'bank' ? fundForm.bankAccount?.trim() : ''
        });
        triggerNotification('تم تحديث الصندوق بنجاح');
      } else {
        // Add path
        const newId = `fund-${Math.random().toString(36).substring(2, 8)}`;
        await ProviderFactory.getProvider().setDoc('fin_funds', newId, {
          id: newId,
          name: fundForm.name.trim(),
          type: fundForm.type,
          currency: fundForm.currency,
          description: fundForm.description.trim(),
          status: fundForm.status,
          balance: 0.0, // Default balance
          bankAccount: fundForm.type === 'bank' ? fundForm.bankAccount?.trim() : ''
        });
        triggerNotification('تم إضافة الصندوق الجديد بنجاح');
      }
      setFundForm({
        name: '',
        type: 'cash',
        currency: currencies[0]?.name || 'دولار',
        description: '',
        status: 'active',
        bankAccount: ''
      });
      setShowFundForm(false);
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'فشل حفظ الصندوق');
    }
  };

  const handleToggleFundStatus = async (fund: FinFund) => {
    try {
      const newStatus = fund.status === 'active' ? 'suspended' : 'active';
      await ProviderFactory.getProvider().updateDoc('fin_funds', fund.id, { status: newStatus });
      triggerNotification(`تم ${newStatus === 'active' ? 'تفعيل' : 'إيقاف'} الصندوق بنجاح`);
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'فشل تحديث حالة الصندوق');
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteFund = async (fund: FinFund) => {
    if (deleteConfirmId === fund.id) {
      try {
        await ProviderFactory.getProvider().deleteDoc('fin_funds', fund.id);
        triggerNotification('تم حذف الصندوق بنجاح');
        setDeleteConfirmId(null);
        loadAllData();
      } catch (err: any) {
        setError(err.message || 'فشل حذف الصندوق');
      }
    } else {
      setDeleteConfirmId(fund.id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };
  // 3. Currency Submit
  const handleCurrencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currencyForm.name.trim() || !currencyForm.symbol.trim()) return;

    try {
      if (currencyForm.id) {
        await ProviderFactory.getProvider().updateDoc("fin_currencies", currencyForm.id, { name: currencyForm.name.trim(), symbol: currencyForm.symbol.trim(), decimals: Number(currencyForm.decimals), status: currencyForm.status });
        triggerNotification("تم تحديث العملة بنجاح");
      } else {
        const newId = currencyForm.symbol.trim().toUpperCase();
        await ProviderFactory.getProvider().setDoc("fin_currencies", newId, { name: currencyForm.name.trim(), symbol: currencyForm.symbol.trim(), decimals: Number(currencyForm.decimals), status: currencyForm.status });
        triggerNotification("تم إضافة العملة بنجاح");
      }
      setCurrencyForm({
        name: "",
        symbol: "",
        decimals: 2,
        status: "active"
      });
      setShowCurrencyForm(false);
      loadAllData();
    } catch (err: any) {
      setError(err.message || "فشل تشغيل العملة");
    }
  };

  // 4. Payment Method Submit
  const handleMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodForm.name.trim()) return;

    try {
      if (methodForm.id) {
        await ProviderFactory.getProvider().updateDoc("fin_payment_methods", methodForm.id, { name: methodForm.name.trim(), description: methodForm.description.trim(), status: methodForm.status });
        triggerNotification("تم تحديث طريقة الدفع بنجاح");
      } else {
        const newId = `pay-${Math.random().toString(36).substring(2, 8)}`;
        await ProviderFactory.getProvider().setDoc("fin_payment_methods", newId, { name: methodForm.name.trim(), description: methodForm.description.trim(), status: methodForm.status });
        triggerNotification("تم إضافة طريقة الدفع الجديدة بنجاح");
      }
      setMethodForm({
        name: "",
        description: "",
        status: "active"
      });
      setShowMethodForm(false);
      loadAllData();
    } catch (err: any) {
      setError(err.message || "فشل حفظ طريقة الدفع");
    }
  };

  // Job Title Submit
  const handleJobTitleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitleForm.title.trim()) return;

    try {
      const autoJobNum = jobTitles.length > 0 ? Math.max(...jobTitles.map(j => Number(j.job_number) || 0)) + 1 : 1;
      const finalJobNum = jobTitleForm.job_number ? Number(jobTitleForm.job_number) : autoJobNum;

      if (editingJobTitleId && editingJobTitleId !== "new") {
        await ProviderFactory.getProvider().updateDoc("job_titles", editingJobTitleId, {
          id: editingJobTitleId,
          job_number: finalJobNum,
          title: jobTitleForm.title.trim(),
          notes: jobTitleForm.notes.trim()
        });
        triggerNotification("تم تحديث المسمى الوظيفي بنجاح");
      } else {
        const newId = `job-${Math.random().toString(36).substring(2, 8)}`;
        await ProviderFactory.getProvider().setDoc("job_titles", newId, {
          id: newId,
          job_number: finalJobNum,
          title: jobTitleForm.title.trim(),
          notes: jobTitleForm.notes.trim()
        });
        triggerNotification("تم إضافة المسمى الوظيفي بنجاح");
      }
      setJobTitleForm({ id: "", job_number: "", title: "", notes: "" });
      setEditingJobTitleId(null);
      loadAllData();
    } catch (err: any) {
      setError(err.message || "فشل حفظ المسمى الوظيفي");
    }
  };

  const [deleteJobTitleConfirmId, setDeleteJobTitleConfirmId] = useState<string | null>(null);
  const handleDeleteJobTitle = async (id: string) => {
    if (deleteJobTitleConfirmId === id) {
      try {
        await ProviderFactory.getProvider().deleteDoc("job_titles", id);
        triggerNotification("تم الحذف بنجاح");
        setDeleteJobTitleConfirmId(null);
        loadAllData();
      } catch (err: any) {
        setError(err.message || "فشل الحذف");
      }
    } else {
      setDeleteJobTitleConfirmId(id);
      setTimeout(() => setDeleteJobTitleConfirmId(null), 3000);
    }
  };

  return (
    <div className="bg-[#141414] border border-white/5 rounded-3xl p-4 sm:p-6 w-full text-right" dir="rtl">
      
      {/* Messages */}
      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-xl flex items-center gap-2 text-sm justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-white/5 rounded-full"><X size={16} /></button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-2 text-sm">
          <Check size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {subTab !== null && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5 font-cairo">
          <button
            onClick={() => { setSubTab(null); setError(null); }}
            className="p-2.5 bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-white/5 cursor-pointer"
            title="الخروج للنافذة السابقة"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400 font-black bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              {subTab === 'types' && 'أنواع العمليات المالية'}
              {subTab === 'funds' && 'إدارة الصناديق'}
              {subTab === 'currencies' && 'إدارة العملات'}
              {subTab === 'methods' && 'إدارة طرق الدفع'}
              {subTab === 'user_devices' && 'صفحة اضافة أجهزة النظام'}
              {subTab === 'job_titles' && 'المسميات الوظيفية'}
            </span>
          </div>
        </div>
      )}

      {subTab === null && (
        <div className="space-y-6 max-w-xl mx-auto py-6 font-cairo animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-center mb-8">
            <h2 className="text-base font-black text-white">مدخلات العمليات الحسابية والتهيئة</h2>
            <p className="text-xs text-gray-400 mt-1">يرجى اختيار أحد الخيارات التالية لإدارة المدخلات والتهيئة المالية والتقنية للبرنامج.</p>
          </div>

          <div className="space-y-3">
            {/* Button 1 */}
            <button
              onClick={() => { setSubTab('types'); setError(null); }}
              className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-[#1a1a1a] border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all group text-right cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Activity size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors">أنواع وتصنيفات العمليات المالية</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">تهيئة شجرة تصنيف المقبوضات والنفقات والمصروفات المتنوعة.</p>
                </div>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg text-gray-500 group-hover:text-white transition-colors">
                <Plus size={16} />
              </div>
            </button>

            {/* Button 2 */}
            <button
              onClick={() => { setSubTab('funds'); setError(null); }}
              className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-[#1a1a1a] border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all group text-right cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Wallet size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors">إدارة الصناديق والحسابات البنكية</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">إعداد الخزائن النقدية، الكاش، وحسابات الورشة البنكية النشطة.</p>
                </div>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg text-gray-500 group-hover:text-white transition-colors">
                <Plus size={16} />
              </div>
            </button>

            {/* Button 3 */}
            <button
              onClick={() => { setSubTab('currencies'); setError(null); }}
              className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-[#1a1a1a] border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all group text-right cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Coins size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors">إدارة عملات الورشة</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">تحديد العملات المتاحة للمعاملات وأسعار الصرف المقترنة بها.</p>
                </div>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg text-gray-500 group-hover:text-white transition-colors">
                <Plus size={16} />
              </div>
            </button>

            {/* Button 4 */}
            <button
              onClick={() => { setSubTab('methods'); setError(null); }}
              className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-[#1a1a1a] border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all group text-right cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors">إدارة طرق ووسائل الدفع</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">ضبط خيارات الدفع المتاحة للزبائن (نقداً، شبكة، تحويل بنكي).</p>
                </div>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg text-gray-500 group-hover:text-white transition-colors">
                <Plus size={16} />
              </div>
            </button>

            {/* Button 5 - USER DEVICES */}
            <button
              onClick={() => { 
                setSubTab('user_devices'); 
                setError(null);
                setFormValidationError(null);
              }}
              className="w-full flex items-center justify-between p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl transition-all group text-right cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500 text-black rounded-xl group-hover:scale-110 transition-transform">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-amber-400 group-hover:text-amber-300 transition-colors">اضافة أجهزة النظام</h4>
                  <p className="text-[11px] text-gray-300 mt-0.5">صفحة اضافة أجهزة النظام وإدارة كافة أجهزة مستخدمي النظام وحظرها.</p>
                </div>
              </div>
              <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400 group-hover:text-white transition-colors">
                <Plus size={16} />
              </div>
            </button>

            {/* Button Job Titles */}
            <button
              onClick={() => { setSubTab('job_titles'); setError(null); }}
              className="w-full flex items-center justify-between p-4 bg-white/[0.02] hover:bg-[#1a1a1a] border border-white/5 hover:border-amber-500/30 rounded-2xl transition-all group text-right cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition-colors">إدارة المسميات الوظيفية</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">ادخال الوظائف في النظام لاستخدامها لاحقاً لإدارة الموظفين.</p>
                </div>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg text-gray-500 group-hover:text-white transition-colors">
                <Plus size={16} />
              </div>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500 font-cairo">جاري تحميل البيانات...</div>
      ) : (
        <>
          {/* ==================================== JOB TITLES TAB ========================== */}
          {subTab === 'job_titles' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-2xl border border-white/5">
                <div>
                  <h3 className="text-sm font-black text-white font-cairo">إدارة المسميات الوظيفية</h3>
                  <p className="text-[11px] text-gray-500 font-cairo">إعداد الوظائف مثل (مدير عام، مدير فرع، استقبال...)</p>
                </div>
                {!editingJobTitleId && !jobTitleForm.title && (
                  <button 
                    onClick={() => {
                      const nextNum = jobTitles.length > 0 ? Math.max(...jobTitles.map(j => Number(j.job_number) || 0)) + 1 : 1;
                      setJobTitleForm({ id: '', job_number: String(nextNum), title: '', notes: '' });
                      setEditingJobTitleId('new');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl transition-all font-cairo"
                  >
                    <Plus size={16} />
                    إضافة مسمى وظيفي
                  </button>
                )}
              </div>

              {(editingJobTitleId || jobTitleForm.title) && (
                <form onSubmit={handleJobTitleSubmit} className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">اسم الوظيفة <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        placeholder="مثال: مدير عام، محاسب..."
                        value={jobTitleForm.title}
                        onChange={e => setJobTitleForm({...jobTitleForm, title: e.target.value})}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">التفاصيل والملاحظات</label>
                      <input 
                        type="text"
                        placeholder="تفاصيل إضافية..."
                        value={jobTitleForm.notes}
                        onChange={e => setJobTitleForm({...jobTitleForm, notes: e.target.value})}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => { setJobTitleForm({id:'', job_number:'', title:'', notes:''}); setEditingJobTitleId(null); }} 
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      {editingJobTitleId && editingJobTitleId !== 'new' ? 'تحديث' : 'حفظ'}
                    </button>
                  </div>
                </form>
              )}

              {/* Job Titles list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {jobTitles.length === 0 ? (
                  <div className="col-span-1 sm:col-span-2 p-6 text-center text-gray-500 font-mono text-[11px] bg-[#181818] rounded-2xl border border-white/5">
                    لا توجد مسميات وظيفية مضافة بعد.
                  </div>
                ) : (
                  jobTitles.map((job, idx) => (
                    <div key={job.id || `job-${idx}`} className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex justify-between items-center group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-1 h-full bg-amber-500/50"></div>
                      <div className="pr-2">
                        <h4 className="text-xs font-black text-white font-cairo">{job.title}</h4>
                        <p className="text-[10px] text-gray-400 font-cairo mt-1">{job.notes || 'لا يوجد تفاصيل'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => {
                            setJobTitleForm(job);
                            setEditingJobTitleId(job.id);
                          }}
                          className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 cursor-pointer"
                          title="تعديل"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteJobTitle(job.id)}
                          className={`p-2 rounded-xl transition-all border border-white/5 cursor-pointer ${
                            deleteJobTitleConfirmId === job.id 
                              ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                              : 'bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400'
                          }`}
                          title={deleteJobTitleConfirmId === job.id ? "تأكيد الحذف" : "حذف"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==================================== TYPES TAB ========================== */}
          {subTab === 'types' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-2xl border border-white/5">
                <div>
                  <h3 className="text-sm font-black text-white font-cairo">شجرة تصنيف العمليات المالية</h3>
                  <p className="text-[11px] text-gray-500 font-cairo">تحديد مسميات عمليات القبض والتوريد وكذلك عمليات صرف النفقات.</p>
                </div>
                {!showTypeForm && (
                  <button 
                    onClick={() => {
                      setTypeForm({ name: '', type: 'receipt' });
                      setShowTypeForm(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl transition-all font-cairo"
                  >
                    <Plus size={16} />
                    إضافة عنصر جديد
                  </button>
                )}
              </div>

              {showTypeForm && (
                <form onSubmit={handleTypeSubmit} className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">نوع الحركة الأساسي</label>
                      <select 
                        value={typeForm.type}
                        onChange={(e) => setTypeForm({ ...typeForm, type: e.target.value as any })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                      >
                        <option value="receipt">سند القبض / إيراد</option>
                        <option value="payment">سند الصرف / مصروف</option>
                      </select>
                    </div>

                    <div className="flex-1 space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">اسم البند أو الحركة</label>
                      <input 
                        type="text"
                        placeholder="مثال: دفعة تحت الحساب"
                        value={typeForm.name}
                        onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowTypeForm(false)}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      حفظ
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Receipts */}
                <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="bg-green-600/10 border-b border-green-500/15 px-4 py-3">
                    <h4 className="text-xs font-black text-green-400 font-cairo">بنود سندات القبض (التوريد)</h4>
                  </div>
                  <div className="p-3 divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                    {txTypes.filter(t => t.type === 'receipt').map((item, idx) => (
                      <div key={item.id || `rcpt-${idx}`} className="py-2.5 flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-200 font-cairo font-medium">{item.name}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={() => {
                              setTypeForm({ id: item.id, name: item.name, type: 'receipt' });
                              setShowTypeForm(true);
                            }}
                            className="p-1 hover:bg-white/5 text-amber-500 rounded"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteType(item.id)}
                            className={`p-1 rounded transition-colors ${
                              deleteTypeConfirmId === item.id
                                ? 'bg-red-600 text-white animate-pulse'
                                : 'hover:bg-white/5 text-red-500'
                            }`}
                            title="حذف البند"
                          >
                            {deleteTypeConfirmId === item.id ? (
                              <span className="text-[10px] px-1 font-bold">متأكد؟</span>
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    {txTypes.filter(t => t.type === 'receipt').length === 0 && (
                      <div className="text-center py-6 text-gray-600 text-[11px] font-cairo">لا توجد بنود متاحة.</div>
                    )}
                  </div>
                </div>

                {/* Payments */}
                <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden">
                  <div className="bg-red-600/10 border-b border-red-500/15 px-4 py-3">
                    <h4 className="text-xs font-black text-red-400 font-cairo">بنود سندات الصرف (المصروفات)</h4>
                  </div>
                  <div className="p-3 divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                    {txTypes.filter(t => t.type === 'payment').map((item, idx) => (
                      <div key={item.id || `pymt-${idx}`} className="py-2.5 flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-200 font-cairo font-medium">{item.name}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={() => {
                              setTypeForm({ id: item.id, name: item.name, type: 'payment' });
                              setShowTypeForm(true);
                            }}
                            className="p-1 hover:bg-white/5 text-amber-500 rounded"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteType(item.id)}
                            className={`p-1 rounded transition-colors ${
                              deleteTypeConfirmId === item.id
                                ? 'bg-red-600 text-white animate-pulse'
                                : 'hover:bg-white/5 text-red-500'
                            }`}
                            title="حذف البند"
                          >
                            {deleteTypeConfirmId === item.id ? (
                              <span className="text-[10px] px-1 font-bold">متأكد؟</span>
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                    {txTypes.filter(t => t.type === 'payment').length === 0 && (
                      <div className="text-center py-6 text-gray-600 text-[11px] font-cairo">لا توجد بنود متاحة.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================== FUNDS TAB ========================== */}
          {subTab === 'funds' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-2xl border border-white/5">
                <div>
                  <h3 className="text-sm font-black text-white font-cairo">إدارة الصناديق والخزائن</h3>
                  <p className="text-[11px] text-gray-500 font-cairo font-mono">الرقم | الاسم | النوع | العملة | المبلغ</p>
                </div>
                {!showFundForm && (
                  <button 
                    onClick={() => {
                      setFundForm({
                        name: '',
                        type: 'cash',
                        currency: currencies[0]?.name || 'دولار',
                        description: '',
                        status: 'active'
                      });
                      setShowFundForm(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl transition-all font-cairo"
                  >
                    <Plus size={16} />
                    إضافة صندوق جديد
                  </button>
                )}
              </div>

              {showFundForm && (
                <form onSubmit={handleFundSubmit} className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. نوع الصندوق */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">نوع الصندوق</label>
                      <div className="flex items-center gap-6 py-2">
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="fundType" 
                            checked={fundForm.type === 'cash'} 
                            onChange={() => setFundForm({ ...fundForm, type: 'cash', bankAccount: '' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>نقدي</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="fundType" 
                            checked={fundForm.type === 'bank'} 
                            onChange={() => setFundForm({ ...fundForm, type: 'bank' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>بنك</span>
                        </label>
                      </div>
                    </div>

                    {/* 3. العملة الأساسية للصندوق */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">العملة الأساسية للصندوق</label>
                      <select 
                        value={fundForm.currency}
                        onChange={(e) => setFundForm({ ...fundForm, currency: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                      >
                        {currencies.map((c, idx) => (
                          <option key={c.id || `curr-opt-${idx}`} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* 4. اسم الصندوق */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">اسم الصندوق</label>
                      <input 
                        type="text"
                        placeholder="مثال: الصندوق اليمني"
                        value={fundForm.name}
                        onChange={(e) => setFundForm({ ...fundForm, name: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    {/* 5. رقم الحساب البنكي */}
                    <div className="space-y-1">
                      <label className={`text-xs font-bold block font-cairo mr-1 ${fundForm.type === 'bank' ? 'text-gray-400' : 'text-gray-600'}`}>رقم الحساب البنكي</label>
                      <input 
                        type="tel"
                        inputMode="tel"
                        placeholder="أدخل رقم الحساب إذا كان الصندوق بنكي"
                        value={fundForm.bankAccount || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9\- ]/g, '');
                          setFundForm({ ...fundForm, bankAccount: val });
                        }}
                        disabled={fundForm.type !== 'bank'}
                        className={`w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo outline-none transition-all ${fundForm.type === 'bank' ? 'text-white focus:border-amber-500' : 'text-gray-600 cursor-not-allowed opacity-50'}`}
                      />
                    </div>

                    {/* الحالة */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">الحالة</label>
                      <div className="flex items-center gap-6 py-2">
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="fundStatus" 
                            checked={fundForm.status === 'active'} 
                            onChange={() => setFundForm({ ...fundForm, status: 'active' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>فعال</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="fundStatus" 
                            checked={fundForm.status === 'suspended'} 
                            onChange={() => setFundForm({ ...fundForm, status: 'suspended' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>موقوف</span>
                        </label>
                      </div>
                    </div>

                    {/* 6. الوصف */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">الوصف</label>
                      <textarea 
                        rows={2}
                        placeholder="..."
                        value={fundForm.description}
                        onChange={(e) => setFundForm({ ...fundForm, description: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowFundForm(false)}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      حفظ
                    </button>
                  </div>
                </form>
              )}

              {/* Funds List Table */}
              <div className="bg-[#181818] rounded-2xl border border-white/5 overflow-hidden overflow-x-auto">
                <table className="w-full text-right border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5 text-xs text-gray-400 font-cairo font-bold">
                      <th className="py-3 px-4 text-center">الرقم</th>
                      <th className="py-3 px-4">الاسم</th>
                      <th className="py-3 px-4">النوع</th>
                      <th className="py-3 px-4">العملة</th>
                      <th className="py-3 px-4">الرصيد المتوفر</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {funds.map((f, index) => (
                      <tr key={f.id || `fund-${index}`} className="hover:bg-white/5 transition-colors text-xs text-gray-200">
                        <td className="py-3 px-4 text-center font-mono text-[11px] text-gray-400">{index + 1}</td>
                        <td className="py-3 px-4 font-bold font-cairo">{f.name}</td>
                        <td className="py-3 px-4 font-cairo">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${f.type === 'cash' ? 'bg-amber-500/15 text-amber-500' : 'bg-blue-500/15 text-blue-400'}`}>
                            {f.type === 'cash' ? 'نقدي' : 'بنك'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-cairo">{f.currency}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">{f.balance?.toLocaleString('en-US')}</td>
                        <td className="py-3 px-4 font-cairo">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${f.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {f.status === 'active' ? 'فعال' : 'موقوف'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              type="button"
                              onClick={() => {
                                setFundForm({
                                  id: f.id,
                                  name: f.name,
                                  type: f.type,
                                  currency: f.currency,
                                  description: f.description || '',
                                  status: f.status,
                                  bankAccount: f.bankAccount || ''
                                });
                                setShowFundForm(true);
                                setError(null);
                              }}
                              className="p-1.5 px-3 bg-amber-500/10 hover:bg-amber-500 hover:text-black rounded-lg text-amber-500 text-[10px] font-bold font-cairo transition-all flex items-center justify-center"
                              title="تعديل بيانات الصندوق"
                            >
                              <Edit2 size={12} className="ml-1.5" />
                              تعديل
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleToggleFundStatus(f)}
                              className={`p-1.5 px-3 rounded-lg text-[10px] font-bold font-cairo transition-all flex items-center justify-center ${f.status === 'active' ? 'bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white' : 'bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white'}`}
                              title={f.status === 'active' ? "إيقاف الصندوق" : "تفعيل الصندوق"}
                            >
                              {f.status === 'active' ? (
                                <>
                                  <X size={12} className="ml-1" />
                                  إيقاف
                                </>
                              ) : (
                                <>
                                  <Check size={12} className="ml-1" />
                                  تفعيل
                                </>
                              )}
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleDeleteFund(f)}
                              className={`p-1.5 px-3 rounded-lg text-[10px] font-bold font-cairo transition-all flex items-center justify-center ${
                                deleteConfirmId === f.id 
                                  ? 'bg-red-600 text-white animate-pulse' 
                                  : 'bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white'
                              }`}
                              title="حذف الصندوق"
                            >
                              <Trash2 size={12} className="ml-1.5" />
                              {deleteConfirmId === f.id ? 'متأكد؟' : 'حذف'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {funds.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-gray-500 font-cairo">لم يتم العثور على أي صناديق مالية.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ==================================== CURRENCIES TAB ========================== */}
          {subTab === 'currencies' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-2xl border border-white/5">
                <div>
                  <h3 className="text-sm font-black text-white font-cairo">إدارة العملات والكسور</h3>
                  <p className="text-[11px] text-gray-500 font-cairo">العملة والرمز والكسر العشري التلقائي المعين لتوفير دقة الحسابات.</p>
                </div>
                {!showCurrencyForm && (
                  <button 
                    onClick={() => {
                      setCurrencyForm({
                        name: '',
                        symbol: '',
                        decimals: 2,
                        status: 'active'
                      });
                      setShowCurrencyForm(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl transition-all font-cairo"
                  >
                    <Plus size={16} />
                    إضافة عملة جديدة
                  </button>
                )}
              </div>

              {showCurrencyForm && (
                <form onSubmit={handleCurrencySubmit} className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">اسم العملة</label>
                      <input 
                        type="text"
                        placeholder="مثال: دولار أمريكي"
                        value={currencyForm.name}
                        onChange={(e) => setCurrencyForm({ ...currencyForm, name: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">الرمز المالي</label>
                      <input 
                        type="text"
                        placeholder="مثال: USD, $, YER"
                        value={currencyForm.symbol}
                        onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">عدد الكسور العشرية</label>
                      <input 
                        type="number"
                        min="0"
                        max="5"
                        dir="ltr"
                        lang="en"
                        onFocus={e => e.target.select()}
                        value={currencyForm.decimals}
                        onChange={(e) => setCurrencyForm({ ...currencyForm, decimals: parseInt(e.target.value) || 0 })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500/30"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">الحالة</label>
                      <div className="flex items-center gap-6 py-2">
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="currStatus" 
                            checked={currencyForm.status === 'active'} 
                            onChange={() => setCurrencyForm({ ...currencyForm, status: 'active' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>نشط ومفعل</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="currStatus" 
                            checked={currencyForm.status === 'suspended'} 
                            onChange={() => setCurrencyForm({ ...currencyForm, status: 'suspended' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>موقوف</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowCurrencyForm(false)}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      حفظ
                    </button>
                  </div>
                </form>
              )}

              {/* Currencies List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {currencies.map((c, idx) => (
                  <div key={c.id || `curr-card-${idx}`} className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white font-cairo">{c.name}</span>
                        <span className="text-[10px] bg-amber-500/15 text-amber-500 px-1.5 py-0.5 rounded font-mono font-bold">{c.symbol}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-cairo">كسور عشرية: {c.decimals}</p>
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${c.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {c.status === 'active' ? 'مفعل' : 'موقوف'}
                      </span>
                    </div>

                    <button 
                      onClick={() => {
                        setCurrencyForm({
                          id: c.id,
                          name: c.name,
                          symbol: c.symbol,
                          decimals: c.decimals,
                          status: c.status
                        });
                        setShowCurrencyForm(true);
                        setError(null);
                      }}
                      className="p-2 bg-white/5 hover:bg-amber-500 hover:text-black rounded-xl text-gray-400 transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================== PAYMENT METHODS TAB ========================== */}
          {subTab === 'methods' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-2xl border border-white/5">
                <div>
                  <h3 className="text-sm font-black text-white font-cairo">طرق وسندات الدفع</h3>
                  <p className="text-[11px] text-gray-500 font-cairo">تحديد أساليب السداد المقبولة (نقدي، تحويل بنكي) للبرنامج.</p>
                </div>
                {!showMethodForm && (
                  <button 
                    onClick={() => {
                      setMethodForm({
                        name: '',
                        description: '',
                        status: 'active'
                      });
                      setShowMethodForm(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-black text-xs font-black rounded-xl transition-all font-cairo"
                  >
                    <Plus size={16} />
                    طريقة دفع جديدة
                  </button>
                )}
              </div>

              {showMethodForm && (
                <form onSubmit={handleMethodSubmit} className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">اسم طريقة الدفع</label>
                      <input 
                        type="text"
                        placeholder="مثال: تحويل بنكي مباشر"
                        value={methodForm.name}
                        onChange={(e) => setMethodForm({ ...methodForm, name: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">الحالة</label>
                      <div className="flex items-center gap-6 py-2">
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="methStatus" 
                            checked={methodForm.status === 'active'} 
                            onChange={() => setMethodForm({ ...methodForm, status: 'active' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>فعالة ونشطة</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-cairo cursor-pointer text-white">
                          <input 
                            type="radio" 
                            name="methStatus" 
                            checked={methodForm.status === 'suspended'} 
                            onChange={() => setMethodForm({ ...methodForm, status: 'suspended' })} 
                            className="text-amber-500 focus:ring-0" 
                          />
                          <span>موقوفة</span>
                        </label>
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs text-gray-400 font-bold block font-cairo mr-1">الوصف</label>
                      <input 
                        type="text"
                        placeholder="..."
                        value={methodForm.description}
                        onChange={(e) => setMethodForm({ ...methodForm, description: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-cairo text-white outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowMethodForm(false)}
                      className="px-4 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold font-cairo"
                    >
                      حفظ
                    </button>
                  </div>
                </form>
              )}

              {/* Methods list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {methods.map((m, idx) => (
                  <div key={m.id || `method-${idx}`} className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-white font-cairo">{m.name}</h4>
                      <p className="text-[10px] text-gray-400 font-cairo mt-1">{m.description || 'لا يوجد وصف'}</p>
                      <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-2 ${m.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {m.status === 'active' ? 'نشطة' : 'موقوفة'}
                      </span>
                    </div>

                    <button 
                      onClick={() => {
                        setMethodForm({
                          id: m.id,
                          name: m.name,
                          description: m.description || '',
                          status: m.status
                        });
                        setShowMethodForm(true);
                        setError(null);
                      }}
                      className="p-2 bg-[#242424] hover:bg-amber-500 hover:text-black rounded-xl text-gray-400 transition-all"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================================== USER DEVICES TAB ========================== */}
          {subTab === 'user_devices' && (
            <div className="space-y-6 animate-in fade-in duration-300 font-cairo">
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1a1a1a] p-5 rounded-2xl border border-white/5 shadow-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="text-amber-500" size={20} />
                    <h3 className="text-base font-black text-white">صفحة اضافة أجهزة النظام</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">تسجيل أجهزة مستخدمي النظام والتحكم بحالة الاتصال والحظر وتجميد الصلاحيات.</p>
                </div>
                {!showDeviceForm && (
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
                      <input 
                        type="text"
                        placeholder="البحث عن جهاز..."
                        value={devSearchQuery}
                        onChange={(e) => setDevSearchQuery(e.target.value)}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl pr-9 pl-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <button 
                      onClick={prepareNewDeviceForm}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/10 cursor-pointer shrink-0"
                    >
                      <Plus size={16} />
                      <span>إضافة جهاز نظام جديد</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Form: اضافة أجهزة النظام */}
              {showDeviceForm && (
                <form onSubmit={handleDeviceSubmit} className="bg-[#181818] border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-2xl relative animate-in slide-in-from-top-3 duration-200">
                  <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
                        <Smartphone size={18} />
                      </div>
                      <h4 className="text-sm font-black text-amber-400">نموذج اضافة جهاز نظام جديد</h4>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowDeviceForm(false)}
                      className="text-gray-400 hover:text-white p-1"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Strict Validation Alert */}
                  {formValidationError && (
                    <div className="bg-red-500/15 border border-red-500/40 text-red-400 p-3.5 rounded-xl flex items-center gap-3 text-xs font-bold animate-pulse">
                      <ShieldAlert size={20} className="shrink-0" />
                      <span>{formValidationError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. رقم الجهاز. تلقائي */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-bold block">1- رقم الجهاز (تلقائي)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={deviceForm.deviceNumber}
                          onChange={(e) => setDeviceForm({ ...deviceForm, deviceNumber: Number(e.target.value) })}
                          className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-400 outline-none focus:border-amber-500"
                        />
                        <span className="absolute left-3 top-2.5 text-[10px] text-amber-500/60 font-bold">تلقائي</span>
                      </div>
                      <p className="text-[10px] text-gray-500">يتولى النظام توليد رقم الجهاز التراكمي افتراضياً.</p>
                    </div>

                    {/* 2. الرقم التسلسلي أو IMEI */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-300 font-bold block">
                          2- الرقم التسلسلي أو IMEI <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const devIdObj = await Device.getId();
                              if (devIdObj?.identifier) {
                                setDeviceForm({ ...deviceForm, serialImei: devIdObj.identifier });
                              }
                            } catch (e) {}
                          }}
                          className="text-[10px] text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/20 flex items-center gap-1 transition-all"
                        >
                          <span>⚡ جلب معرف هذا الجهاز</span>
                        </button>
                      </div>
                      <input 
                        type="text"
                        placeholder="أدخل الرقم التسلسلي للجهاز أو IMEI..."
                        value={deviceForm.serialImei}
                        onChange={(e) => {
                          setDeviceForm({ ...deviceForm, serialImei: e.target.value });
                          if (formValidationError) setFormValidationError(null);
                        }}
                        className={`w-full bg-[#242424] border rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500 ${!deviceForm.serialImei.trim() && formValidationError ? 'border-red-500 bg-red-500/5' : 'border-white/10'}`}
                      />
                      <p className="text-[10px] text-gray-500">
                        معرف الجهاز الخاص بالنظام، السيريال، أو رقم IMEI (سيتم ربط الجهاز تلقائياً مع أو دخول للمستخدم المخصص).
                      </p>
                    </div>

                    {/* 3. اسم الجهاز في النظام */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-bold block">
                        3- اسم الجهاز في النظام <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        placeholder="أدخل اسم الجهاز المعرف..."
                        value={deviceForm.deviceName}
                        onChange={(e) => {
                          setDeviceForm({ ...deviceForm, deviceName: e.target.value });
                          if (formValidationError) setFormValidationError(null);
                        }}
                        className={`w-full bg-[#242424] border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 ${!deviceForm.deviceName.trim() && formValidationError ? 'border-red-500 bg-red-500/5' : 'border-white/10'}`}
                      />
                      <p className="text-[10px] text-gray-500">اسم الموائم للجهاز بالورشة.</p>
                    </div>



                    {/* نوع الجهاز */}

                    <div className="space-y-1">

                      <label className="text-xs text-gray-300 font-bold block">

                        نوع الجهاز

                      </label>

                      <select

                        value={deviceForm.deviceType || "عام"}

                        onChange={(e) => setDeviceForm({ ...deviceForm, deviceType: e.target.value as "مخصص" | "عام" })}

                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"

                      >

                        <option value="مخصص">مخصص</option>

                        <option value="عام">عام</option>

                      </select>

                      <p className="text-[10px] text-gray-500">هل هو مخصص لمستخدم محدد أم عام.</p>
                    </div>

                    {/* 4. اسم مستخدم النظام المرتبط بالجهاز */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-bold block">
                        4- اسم مستخدم النظام المرتبط بالجهاز <span className="text-red-500">*</span>
                      </label>
                      <select 
                        value={deviceForm.linkedUserName}
                        onChange={(e) => {
                          const selectedName = e.target.value;
                          const selectedUser = systemUsers.find(u => u.username === selectedName);
                          setDeviceForm({ ...deviceForm, linkedUserName: selectedName, linkedUserId: selectedUser ? selectedUser.id : '' });
                          if (formValidationError) setFormValidationError(null);
                        }}
                        className={`w-full bg-[#242424] border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 ${!deviceForm.linkedUserName.trim() && formValidationError ? 'border-red-500 bg-red-500/5' : 'border-white/10'}`}
                      >
                        <option value="">-- اختر مستخدم النظام --</option>
                        {systemUsers.map((u, idx) => (
                          <option key={u.id || `usr-opt1-${idx}`} value={u.username}>{u.name} ({u.username})</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-gray-500">المستخدم المخول باستخدام الجهاز.</p>
                    </div>

                    {/* 5. خيار تفعيل / الغاء تفعيل */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-bold block">5- حالة تفعيل الجهاز</label>
                      <select 
                        value={deviceForm.status === 'معطل' ? 'تعطيل' : deviceForm.isFrozen ? 'تجميد' : 'تفعيل'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'تفعيل') {
                            setDeviceForm({ ...deviceForm, status: 'نشط', isFrozen: false });
                          } else if (val === 'تجميد') {
                            setDeviceForm({ ...deviceForm, status: 'نشط', isFrozen: true });
                          } else if (val === 'تعطيل') {
                            setDeviceForm({ ...deviceForm, status: 'معطل', isFrozen: false });
                          }
                        }}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      >
                        <option value="تفعيل">تفعيل (نشط)</option>
                        <option value="تجميد">تجميد مؤقت</option>
                        <option value="تعطيل">إلغاء تفعيل (معطل)</option>
                      </select>
                    </div>

                    {/* حالة اتصال الشبكة النمطية */}
                    <div className="space-y-1">
                      <label className="text-xs text-gray-300 font-bold block">حالة اتصال الشبكة الافتراضية</label>
                      <select
                        value={deviceForm.networkStatus}
                        onChange={(e) => setDeviceForm({ ...deviceForm, networkStatus: e.target.value as any })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                      >
                        <option value="متصل">متصل بالشبكة</option>
                        <option value="غير متصل">غير متصل بالشبكة</option>
                      </select>
                    </div>

                    {/* 6. ملاحظات اختياري */}
                    <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                      <label className="text-xs text-gray-300 font-bold block">6- ملاحظات (اختياري)</label>
                      <textarea 
                        rows={2}
                        placeholder="ملاحظات تفصيلية حول موقع الجهاز أو الغرض منه..."
                        value={deviceForm.notes}
                        onChange={(e) => setDeviceForm({ ...deviceForm, notes: e.target.value })}
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 resize-none"
                      />
                      <p className="text-[10px] text-gray-500">جميع الحقول تحتوي على بيانات افتراضية قابلة للتعديل والترحيل.</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                    <button 
                      type="button" 
                      onClick={() => setShowDeviceForm(false)}
                      className="px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Save size={14} />
                      <span>ترحيل وحفظ الجهاز</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Table: جميع أجهزة مستخدمي النظام */}
              <div className="bg-[#181818] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-black text-white">جميع أجهزة مستخدمي النظام</h3>
                    <p className="text-[11px] text-gray-500">جدول استعراض وفرز وتصفية كافة الأجهزة المسجلة بالنظام.</p>
                  </div>
                  <div className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg">
                    إجمالي الأجهزة: {userDevices.length}
                  </div>
                </div>

                {/* Table Layout - Single line per row */}
                <div className="overflow-x-auto rounded-xl border border-white/5">
                  <table className="w-full text-right text-xs">
                    <thead>
                      {/* Filter Row */}
                      <tr className="bg-[#202020] border-b border-white/5">
                        <th className="p-2 w-32">
                          <button
                            type="button"
                            onClick={() => setDevSortOrder(devSortOrder === 'asc' ? 'desc' : 'asc')}
                            className="w-full py-1.5 px-2 bg-[#2a2a2a] hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white flex items-center justify-between transition-colors cursor-pointer"
                            title="ترتيب رقم الجهاز"
                          >
                            <span className="truncate">{devSortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}</span>
                            <ArrowUpDown size={12} className="text-gray-400 shrink-0 ml-1" />
                          </button>
                        </th>
                        <th className="p-2 text-center text-gray-500 font-normal text-[10px]">
                          -
                        </th>
                        <th className="p-2 text-center text-gray-500 font-normal text-[10px]">
                          -
                        </th>
                        <th className="p-2 w-32">
                          <select
                            value={devFilterStatus}
                            onChange={(e) => setDevFilterStatus(e.target.value)}
                            className="w-full py-1.5 px-1 bg-[#2a2a2a] border border-white/10 rounded-lg text-[11px] font-bold text-white outline-none focus:border-amber-500"
                          >
                            <option value="all">الكل (الحالة)</option>
                            <option value="نشط">نشط</option>
                            <option value="معطل">معطل</option>
                            <option value="محظور">محظور</option>
                          </select>
                        </th>
                        <th className="p-2 w-32">
                          <select
                            value={devFilterNetwork}
                            onChange={(e) => setDevFilterNetwork(e.target.value)}
                            className="w-full py-1.5 px-1 bg-[#2a2a2a] border border-white/10 rounded-lg text-[11px] font-bold text-white outline-none focus:border-amber-500"
                          >
                            <option value="all">الكل (الشبكة)</option>
                            <option value="متصل">متصل</option>
                            <option value="غير متصل">غير متصل</option>
                          </select>
                        </th>
                        <th className="p-2 text-center text-gray-500 font-normal text-[10px]">
                          -
                        </th>
                      </tr>
                      <tr className="bg-[#222222] text-gray-400 border-b border-white/5 font-bold uppercase text-[11px] whitespace-nowrap">
                        <th className="p-3">رقم الجهاز</th>
                        <th className="p-3">اسم الجهاز</th>
                        <th className="p-3">نوع الجهاز</th>
                        <th className="p-3">اسم المستخدم المرتبط</th>
                        <th className="p-3">حالة الجهاز</th>
                        <th className="p-3">اتصال الشبكة</th>
                        <th className="p-3 text-center">التفاصيل والتراخيص</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {userDevices
                        .filter(d => {
                          if (devFilterStatus !== 'all' && d.status !== devFilterStatus) return false;
                          if (devFilterNetwork !== 'all' && d.networkStatus !== devFilterNetwork) return false;
                          if (devSearchQuery.trim()) {
                            const q = devSearchQuery.toLowerCase();
                            const matchesName = (d.deviceName || '').toLowerCase().includes(q);
                            const matchesUser = (d.linkedUserName || '').toLowerCase().includes(q);
                            const matchesSerial = (d.serialImei || '').toLowerCase().includes(q);
                            const matchesNum = (d.deviceNumber?.toString() || '').includes(q);
                            if (!matchesName && !matchesUser && !matchesSerial && !matchesNum) return false;
                          }
                          return true;
                        })
                        .sort((a, b) => {
                          const numA = Number(a.deviceNumber) || 0;
                          const numB = Number(b.deviceNumber) || 0;
                          return devSortOrder === 'asc' ? numA - numB : numB - numA;
                        })
                        .map((device, idx) => (
                          <tr 
                            key={device.id || `dev-${idx}`} 
                            className="hover:bg-white/[0.02] transition-colors whitespace-nowrap"
                          >
                            {/* 1. رقم الجهاز */}
                            <td className="p-3 font-mono font-bold text-amber-400">
                              #{device.deviceNumber}
                            </td>

                            {/* 2. اسم الجهاز */}
                            <td className="p-3 font-bold text-white">
                              <div className="flex items-center gap-2">
                                <Smartphone size={14} className="text-gray-400 shrink-0" />
                                <span>{device.deviceName}</span>

                                {device.isFrozen && (

                                  <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-bold border border-sky-500/30">مُجمد</span>

                                )}

                              </div>

                            </td>



                            {/* 2.5 نوع الجهاز */}

                            <td className="p-3 text-gray-300">

                              <div className="flex items-center gap-1.5">

                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${device.deviceType === "مخصص" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"}`}>

                                  {device.deviceType || "عام"}

                                </span>

                              </div>

                            </td>



                            {/* 2.5 نوع الجهاز */}

                            <td className="p-3 text-gray-300">

                              <div className="flex items-center gap-1.5">

                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${device.deviceType === "مخصص" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"}`}>

                                  {device.deviceType || "عام"}

                                </span>
                                {device.isFrozen && (
                                  <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-bold border border-sky-500/30">مُجمد</span>
                                )}
                              </div>
                            </td>

                            {/* 3. اسم المستخدم */}
                            <td className="p-3 text-gray-300">
                              <div className="flex items-center gap-1.5">
                                <UserCheck size={13} className="text-emerald-400 shrink-0" />
                                <span>{device.linkedUserName}</span>
                              </div>
                            </td>

                            {/* 4. حالة الجهاز */}
                            <td className="p-3">
                              {device.status === 'نشط' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <ShieldCheck size={12} />
                                  <span>نشط</span>
                                </span>
                              )}
                              {device.status === 'معطل' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <Lock size={12} />
                                  <span>معطل</span>
                                </span>
                              )}
                              {device.status === 'محظور' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                                  <ShieldAlert size={12} />
                                  <span>محظور</span>
                                </span>
                              )}
                            </td>

                            {/* 5. اتصال الشبكة */}
                            <td className="p-3">
                              {device.networkStatus === 'متصل' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                  <span>متصل</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/10 text-gray-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                  <span>غير متصل</span>
                                </span>
                              )}
                            </td>

                            {/* 6. زر عرض */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const safeDev: UserDevice = {
                                    ...device,
                                    serialImei: device.serialImei || '',
                                    deviceName: device.deviceName || '',
                                    linkedUserName: device.linkedUserName || '',
                                    linkedUserId: device.linkedUserId || '',
                                    status: device.status || 'نشط',
                                    networkStatus: device.networkStatus || 'متصل',
                                    notes: device.notes || '',
                                  };
                                  setSelectedDeviceForDetail(safeDev);
                                  setDetailForm(safeDev);
                                  setIsEditingDetailModal(false);
                                }}
                                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Eye size={13} />
                                <span>عرض</span>
                              </button>
                            </td>
                          </tr>
                        ))}

                      {userDevices.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            لا توجد أجهزة مسجلة في النظام حالياً. اضغط على "إضافة جهاز نظام جديد" للبدء.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Popup Detail Modal: تفاصيل جهاز المستخدم */}
              {selectedDeviceForDetail && detailForm && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                  <div className="bg-[#141414] border border-amber-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative font-cairo">
                    
                    {/* Header Modal */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                          <Smartphone size={22} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-white">تفاصيل ومعلومات جهاز المستخدم</h3>
                          <p className="text-xs text-gray-400 mt-0.5">سجل الهوية والترخيص والحالة للجهاز بداخل النظام</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Top Action Button: زر تحرير للتعديل */}
                        <button
                          type="button"
                          onClick={() => setIsEditingDetailModal(!isEditingDetailModal)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${isEditingDetailModal ? 'bg-amber-500 text-black' : 'bg-white/5 hover:bg-white/10 text-amber-400 border border-amber-500/20'}`}
                        >
                          <Edit2 size={13} />
                          <span>{isEditingDetailModal ? 'وضع العرض' : 'تحرير للتعديل'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedDeviceForDetail(null)}
                          className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-all"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Modal Grid Body: 13 Required Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      
                      {/* 1. المعرف الفريد للجهاز UUID */}
                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">1. المعرف الفريد للجهاز UUID</span>
                        <div className="font-mono text-[11px] text-amber-300 font-bold truncate">
                          {detailForm.id}
                        </div>
                      </div>

                      {/* 2. رقم الجهاز */}
                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">2. رقم الجهاز (تلقائي)</span>
                        <div className="font-mono text-sm text-white font-black">
                          #{detailForm.deviceNumber}
                        </div>
                      </div>

                      {/* 3. اسم الجهاز في النظام */}
                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">3. اسم الجهاز في النظام</span>
                        {isEditingDetailModal ? (
                          <input 
                            type="text"
                            value={detailForm.deviceName || ''}
                            onChange={(e) => setDetailForm({ ...detailForm, deviceName: e.target.value })}
                            className="w-full bg-[#2a2a2a] border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
                          />
                        ) : (
                          <div className="font-bold text-white text-xs">{detailForm.deviceName || 'غير مسمى'}</div>
                        )}

                      </div>



                      {/* نوع الجهاز */}

                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1">

                        <span className="text-[10px] text-gray-400 font-bold block">نوع الجهاز</span>

                        {isEditingDetailModal ? (

                          <select

                            value={detailForm.deviceType || "عام"}

                            onChange={(e) => setDetailForm({ ...detailForm, deviceType: e.target.value as "مخصص" | "عام" })}

                            className="w-full bg-[#2a2a2a] border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs text-white outline-none"

                          >

                            <option value="مخصص">مخصص</option>

                            <option value="عام">عام</option>

                          </select>

                        ) : (

                          <div className="font-bold text-white text-xs">{detailForm.deviceType || "عام"}</div>
                        )}
                      </div>

                      {/* 4. تاريخ تسجيل الجهاز */}
                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">4. تاريخ تسجيل الجهاز</span>
                        <div className="font-mono text-gray-300">
                          {parseDate(detailForm.createdAt) ? parseDate(detailForm.createdAt)!.toLocaleString('ar-SA') : 'غير مسجل'}
                        </div>
                      </div>

                      {/* 5. حالة الجهاز */}
                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">5. حالة الجهاز</span>
                        {isEditingDetailModal ? (
                          <select
                            value={detailForm.status || 'نشط'}
                            onChange={(e) => setDetailForm({ ...detailForm, status: e.target.value as any })}
                            className="w-full bg-[#2a2a2a] border border-amber-500/40 rounded-lg px-2 py-1 text-xs text-white outline-none"
                          >
                            <option value="نشط">نشط</option>
                            <option value="معطل">معطل</option>
                            <option value="محظور">محظور</option>
                          </select>
                        ) : (
                          <div className="font-bold">
                            {detailForm.status === 'نشط' && <span className="text-emerald-400">نشط (مفعل)</span>}
                            {detailForm.status === 'معطل' && <span className="text-amber-400">معطل</span>}
                            {detailForm.status === 'محظور' && <span className="text-red-400">محظور خروج نهائي</span>}
                          </div>
                        )}
                      </div>

                      {/* 6. اخر دخول */}
                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">6. اخر دخول للنظام</span>
                        <div className="font-mono text-gray-300">
                          {parseDate(detailForm.lastLogin) ? parseDate(detailForm.lastLogin)!.toLocaleString('ar-SA') : 'لا يوجد'}
                        </div>
                      </div>

                      {/* 7. اخر خروج */}
                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">7. اخر خروج من النظام</span>
                        <div className="font-mono text-gray-300">
                          {parseDate(detailForm.lastLogout) ? parseDate(detailForm.lastLogout)!.toLocaleString('ar-SA') : 'لا يوجد'}
                        </div>
                      </div>

                      {/* 8. اتصال الشبكة */}
                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">8. اتصال الشبكة</span>
                        {isEditingDetailModal ? (
                          <select
                            value={detailForm.networkStatus || 'متصل'}
                            onChange={(e) => setDetailForm({ ...detailForm, networkStatus: e.target.value as any })}
                            className="w-full bg-[#2a2a2a] border border-amber-500/40 rounded-lg px-2 py-1 text-xs text-white outline-none"
                          >
                            <option value="متصل">متصل</option>
                            <option value="غير متصل">غير متصل</option>
                          </select>
                        ) : (
                          <div className="font-bold">
                            {detailForm.networkStatus === 'متصل' ? (
                              <span className="text-emerald-400 font-bold">متصل بالشبكة</span>
                            ) : (
                              <span className="text-gray-400 font-bold">غير متصل بالشبكة</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 9. تاريخ الخروج النهائي (الحظر) */}
                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">9. تاريخ الخروج النهائي (الحظر)</span>
                        <div className="font-mono text-red-400 font-bold">
                          {parseDate(detailForm.blockDate) ? parseDate(detailForm.blockDate)!.toLocaleString('ar-SA') : 'لا يوجد حظر'}
                        </div>
                      </div>

                      {/* 10. معرف الحساب للمستخدم المرتبط للجهاز */}
                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">10. المستخدم المرتبط ومعرفه</span>
                        {isEditingDetailModal ? (
                          <select 
                            value={detailForm.linkedUserName || ''}
                            onChange={(e) => {
                              const selectedName = e.target.value;
                              const selectedUser = systemUsers.find(u => u.username === selectedName);
                              setDetailForm({ ...detailForm, linkedUserName: selectedName, linkedUserId: selectedUser ? selectedUser.id : '' });
                            }}
                            className="w-full bg-[#2a2a2a] border border-amber-500/40 rounded-lg px-2 py-1 text-xs text-white outline-none"
                          >
                            <option value="">-- اختر مستخدم النظام --</option>
                            {systemUsers.map((u, idx) => (
                              <option key={u.id || `usr-opt2-${idx}`} value={u.username}>{u.name} ({u.username})</option>
                            ))}
                          </select>
                        ) : (
                          <div className="font-bold text-white">
                            {detailForm.linkedUserName || 'غير مرتبط'} <span className="text-[10px] text-gray-500 font-mono">({detailForm.linkedUserId || 'N/A'})</span>
                          </div>
                        )}
                      </div>

                      {/* 11. معرف الحساب لمستخدم النظام الذي أضاف الجهاز */}
                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold block">11. مُضيف الجهاز في النظام</span>
                        <div className="font-bold text-gray-300">
                          {detailForm.createdByUserName || 'مدير النظام'} <span className="text-[10px] text-gray-500 font-mono">({detailForm.createdByUserId || 'admin'})</span>
                        </div>
                      </div>

                      {/* 12. ملاحظات اختياري */}
                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1 sm:col-span-2">
                        <span className="text-[10px] text-gray-400 font-bold block">12. ملاحظات اختياري</span>
                        {isEditingDetailModal ? (
                          <textarea 
                            rows={2}
                            value={detailForm.notes || ''}
                            onChange={(e) => setDetailForm({ ...detailForm, notes: e.target.value })}
                            className="w-full bg-[#2a2a2a] border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs text-white outline-none resize-none"
                          />
                        ) : (
                          <div className="text-gray-300 text-xs">{detailForm.notes || 'لا توجد ملاحظات'}</div>
                        )}
                      </div>

                      {/* 13. الرقم التسلسلي أو IMEI + أزرار التجميد والحظر */}
                      <div className="bg-[#1c1c1c] p-4 rounded-2xl border border-amber-500/30 space-y-3 sm:col-span-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                          <div>
                            <span className="text-[10px] text-amber-400 font-black block">13. الرقم التسلسلي أو IMEI</span>
                            {isEditingDetailModal ? (
                              <input 
                                type="text"
                                value={detailForm.serialImei || ''}
                                onChange={(e) => setDetailForm({ ...detailForm, serialImei: e.target.value })}
                                className="bg-[#2a2a2a] border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-white outline-none w-full mt-1"
                              />
                            ) : (
                              <div className="font-mono text-sm font-bold text-white">{detailForm.serialImei || 'غير مسجل'}</div>
                            )}
                          </div>
                        </div>

                        {/* Action Control Buttons Inside Box */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {/* Button 1: تجميد مؤقت */}
                          <button
                            type="button"
                            onClick={() => handleToggleFreeze(selectedDeviceForDetail)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${selectedDeviceForDetail.isFrozen ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-sky-600 hover:bg-sky-500 text-white'}`}
                          >
                            {selectedDeviceForDetail.isFrozen ? <Unlock size={14} /> : <Lock size={14} />}
                            <span>{selectedDeviceForDetail.isFrozen ? 'إلغاء التجميد المؤقت' : 'تجميد مؤقت للجهاز'}</span>
                          </button>

                          {/* Button 2: حظر خروج نهائي */}
                          {/* Button 3: حذف الجهاز */}

                          <button

                            type="button"

                            onClick={() => handleDeleteDevice(selectedDeviceForDetail.id)}

                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"

                          >

                            <Trash2 size={14} />

                            <span>حذف الجهاز</span>

                          </button>


                          {selectedDeviceForDetail.status !== 'محظور' && (
                            <button
                              type="button"
                              onClick={() => handleBlockDevice(selectedDeviceForDetail)}
                              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/20"
                            >
                              <ShieldAlert size={14} />
                              <span>حظر خروج نهائي</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Modal Footer */}
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setSelectedDeviceForDetail(null)}
                        className="px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        إغلاق
                      </button>

                      {isEditingDetailModal && (
                        <button
                          type="button"
                          onClick={handleSaveDetailModal}
                          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
                        >
                          <Save size={14} />
                          <span>تعديل وحفظ التغييرات</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              )}

            </div>
          )}
        </>
      )}
    </div>
  );
}
