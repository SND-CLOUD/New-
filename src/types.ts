export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export interface Customer {
  id?: string;
  customerNumber?: number;
  name: string;
  phone1: string;
  phone2?: string;
  companyName?: string;
  email?: string;
  notes?: string;
  createdAt: any;
  hasWhatsapp?: boolean;
  liabilityCurrency?: string;
}

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  currency: string;
  totalCost: number;
  amountPaid: number;
  discount?: number;
  tax?: number;
  status: '10' | '20' | '30' | '40' | '50' | '60' | 'new' | 'in_progress' | 'ready' | 'delivered' | string;
  createdAt: any;
  updatedAt: any;
  printCount?: number;
}

export interface InvoiceItem {
  id?: string;
  invoiceId: string;
  categoryId?: string;
  deviceName?: string;
  invoiceNumber?: string;
  deviceType: string;
  quantity: number;
  faultType: string;
  deviceNotes?: string;
  technicalNotes?: string;
  cost: number;
  createdAt?: any;
  status: '10' | '20' | '30' | '40' | '50' | '60' | 'new' | 'inspected' | 'ready' | 'unrepairable' | 'delivered' | string;
  subStatus?: 'intact' | 'unrepairable' | 'refused' | 'ready' | string;
  source?: 'inspection' | 'maintenance' | string;
  customerProblem?: string;
  engineerReport?: string;
  failureReason?: string;
  unitCost?: number;
  deliveredAt?: any;
  recipientName?: string;
  createdBy?: string; 
  technician?: string; 
  updatedAt?: any;
  updatedBy?: string; 
  customerName?: string;
  customerId?: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  isDefault?: boolean;
}

export interface DeviceType {
  id: string;
  name: string;
}

export interface AppPermissions {
  inventory: { view: boolean; add: boolean; edit: boolean; delete: boolean; print: boolean; advancedView?: boolean };
  vault: { view: boolean; add: boolean; edit: boolean; delete: boolean; print: boolean; advancedView?: boolean };
  customers: { view: boolean; add: boolean; edit: boolean; delete: boolean; print: boolean; advancedView?: boolean };
  invoices: { view: boolean; add: boolean; edit: boolean; delete: boolean; print: boolean; advancedView?: boolean };
  reports: { view: boolean; print: boolean; advancedView?: boolean };
  settings: { view: boolean; edit: boolean; advancedView?: boolean };
  settings_main_data: { view: boolean; add: boolean; edit: boolean; delete: boolean; print: boolean; advancedView?: boolean };
  settings_devices_engineers: { view: boolean; add: boolean; edit: boolean; delete: boolean; print: boolean; advancedView?: boolean };
  settings_device_management: { view: boolean; add: boolean; edit: boolean; delete: boolean; print: boolean; advancedView?: boolean };
  settings_users: { view: boolean; add: boolean; edit: boolean; delete: boolean; print: boolean; advancedView?: boolean };
  settings_hybrid_db?: { view: boolean; edit: boolean; advancedView?: boolean };
}

export interface User {
  id?: string;
  userNumber?: number;
  username: string;
  password?: string;
  name: string;
  job_title_id?: string;
  phone?: string;
  email?: string;
  account_status?: 'نشط' | 'معطل' | 'موقوف';
  network_status?: 'متصل' | 'غير متصل';
  linked_device_id?: string;
  device_access_type?: 'عام' | 'مخصص';
  last_device_id?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  last_logout?: string;
  created_by_user_id?: string;
  notes?: string;
  role: 'admin' | 'manager' | 'data_entry';
  isPrimary?: boolean;
  isActive?: boolean;
  permissions?: AppPermissions;
  webauthn?: {
    credentials: {
      id: string;
      publicKey: string;
      counter: number;
    }[];
  };
}

export interface VaultTransaction {
  linkedTxId?: string;
  id?: string;
  currency: string;
  amount: number;
  customerName: string;
  invoiceNumber: string;
  userName: string;
  userNumber?: number;
  userId: string;
  timestamp: any;
  type: 'invoice_payment' | 'manual_entry';
  notes?: string;
}

export interface Engineer {
  id?: string;
  name: string;
}

export interface MaintenanceAction {
  id?: string;
  engineerName: string;
  actionDate: any;
  notes?: string;
  updates: {
    itemId: string;
    oldStatus: string;
    newStatus: string;
    deviceType: string;
    quantity: number;
  }[];
  createdAt: any;
  userId: string;
  userName: string;
}

export interface ShopConfig {
  shopName: string;
  fiscalYear: string;
  logoUrl?: string;
  startDate: string;
  phone1?: string;
  phone2?: string;
  landline?: string;
  countryCode?: string;
  phone1Call?: boolean;
  phone1Whatsapp?: boolean;
  phone2Call?: boolean;
  phone2Whatsapp?: boolean;
  landlineCall?: boolean;
  landlineWhatsapp?: boolean;
  facebookUrl?: string;
  mapUrl?: string;
  email?: string;
  bio?: string;
  address?: string;
  bankYerName?: string;
  bankYerAccount?: string;
  bankSarName?: string;
  bankSarAccount?: string;
  bankUsdName?: string;
  bankUsdAccount?: string;
  bankHolderName?: string;
  liabilityCurrency?: string;
  managerName?: string;
  commercialRecord?: string;
  taxNumber?: string;
  receiptNotes?: string;
}

export interface UserDevice {
  id: string; // المعرف الفريد للجهاز UUID
  deviceNumber: number; // رقم الجهاز. تلقائي
  serialImei: string; // الرقم التسلسلي أو imei
  deviceName: string;
  deviceType?: "مخصص" | "عام"; // اسم الجهاز في النظام
  linkedUserName: string; // اسم مستخدم النظام المرتبط بالجهاز
  linkedUserId?: string; // معرف الحساب للمستخدم المرتبط بالجهاز
  status: 'نشط' | 'معطل' | 'محظور' | string; // حالة الجهاز
  networkStatus: 'متصل' | 'غير متصل' | string; // اتصال الشبكة
  createdAt: any; // تاريخ تسجيل الجهاز
  lastLogin?: any; // اخر دخول
  lastLogout?: any; // اخر خروج
  blockDate?: any; // تاريخ الخروج النهائي (الحظر)
  createdByUserId?: string; // معرف الحساب لمستخدم النظام الذي أضاف الجهاز في النظام
  createdByUserName?: string; // اسم مستخدم النظام الذي أضاف الجهاز
  notes?: string; // ملاحظات اختياري
  isFrozen?: boolean; // خيار تجميد مؤقت
  updatedAt?: any;
}

/**
 * Checks if an item belongs to in-shop physical device maintenance
 * Excludes items from Other Services (software services, outside maintenance, parts sales/accessories)
 */
export function isShopMaintenanceItem(item: any): boolean {
  if (!item) return false;

  const source = String(item.source || '').toLowerCase().trim();
  if (
    source.startsWith('sale_') ||
    source.includes('software') ||
    source.includes('outside') ||
    source.includes('external') ||
    source.includes('parts') ||
    source.includes('accessory') ||
    source.includes('other_service') ||
    item.isOtherService === true
  ) {
    return false;
  }

  const invType = String(item.invoiceType || '').toLowerCase().trim();
  if (
    invType.startsWith('sale_') ||
    invType.includes('software') ||
    invType.includes('outside') ||
    invType.includes('parts')
  ) {
    return false;
  }

  const fault = String(item.faultType || '').toLowerCase().trim();
  const devType = String(item.deviceType || '').toLowerCase().trim();
  if (
    fault.includes('صيانة خارجية') ||
    fault.includes('خدمات برمجية') ||
    fault.includes('بيع قطع') ||
    devType.includes('صيانة خارجية') ||
    devType.includes('خدمات برمجية') ||
    devType.includes('بيع قطع')
  ) {
    return false;
  }

  return true;
}

/**
 * Checks if an item is an ACTIVE physical device currently in the shop for maintenance.
 * Must be a shop maintenance item AND not delivered, returned, or cancelled.
 */
export function isInShopMaintenanceDevice(item: any): boolean {
  if (!isShopMaintenanceItem(item)) return false;

  const status = String(item.status || '').toLowerCase().trim();
  if (['delivered', '60', 'returned', '70', 'cancelled', 'ملغاة', 'تم التسليم', 'معاد', 'مرتجع'].includes(status)) {
    return false;
  }

  if (item.subStatus && ['delivered', '60', 'returned', '70', 'cancelled'].includes(String(item.subStatus).toLowerCase().trim())) {
    return false;
  }

  return true;
}

