import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64 = base64data.substring(base64data.indexOf(',') + 1);
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export async function sharePdfFile(blob: Blob, filename: string, message: string, category: 'invoice' | 'report' = 'invoice'): Promise<boolean> {
  console.log('Attempting to share file:', filename, 'category:', category, 'isNative:', Capacitor.isNativePlatform());
  
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);
      
      const subFolder = category === 'invoice' ? 'فواتير' : 'تقارير';
      const appFolder = 'SND_App';
      const fullPath = `${appFolder}/${subFolder}/${filename}`;
      
      // Save file in Documents directory (persistent)
      const writeResult = await Filesystem.writeFile({
        path: fullPath,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });
      
      console.log('File written natively to:', writeResult.uri);
      
      // Share natively
      await Share.share({
        title: 'مشاركة الملف',
        text: message,
        files: [writeResult.uri],
        dialogTitle: 'مشاركة عبر',
      });
      
      return true;
    } catch (error) {
      console.error('Capacitor native share error:', error);
      // Fallback below
    }
  }

  // Web Browser Sharing / Fallback
  try {
    const file = new File([blob], filename, { type: 'application/pdf' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: filename,
        text: message,
      });
      return true;
    }
  } catch (webShareError) {
    console.warn('Web Share API failed:', webShareError);
  }

  return false;
}

/**
 * Robust WhatsApp sharing utility
 * Ensures opening the app directly on mobile or the web interface on desktop
 */
export function openWhatsApp(message: string, phone?: string, countryCode?: string) {
  const encodedText = encodeURIComponent(message);
  
  let cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const effectiveCountryCode = countryCode || localStorage.getItem('snd_country_code') || '+967';
  
  // If phone exists and doesn't already start with a likely country code (starts with 0 or is short)
  // we prepend the default country code from settings
  if (cleanPhone && effectiveCountryCode) {
    const cleanCC = effectiveCountryCode.replace(/\D/g, '');
    // If phone starts with 0, remove it and add country code
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanCC + cleanPhone.substring(1);
    } else if (cleanPhone.length < 10 && !cleanPhone.startsWith(cleanCC)) {
      // If it's a short number (local), prepend country code
      cleanPhone = cleanCC + cleanPhone;
    }
  }
  
  // Use wa.me which is the most reliable modern way to handle WhatsApp redirection
  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  // On some older Android devices or specific browser environments, 
  // the whatsapp:// protocol is more reliable for direct app opening
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Try to open using the protocol first
    const protocolUrl = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
      : `whatsapp://send?text=${encodedText}`;
      
    // Using a hidden iframe or direct location change to avoid page refresh
    window.location.href = protocolUrl;
    
    // Fallback to wa.me after a short delay if the protocol didn't work 
    // (e.g., app not installed or protocol blocked)
    setTimeout(() => {
      if (document.hasFocus()) {
        window.open(waUrl, '_blank');
      }
    }, 1500);
  } else {
    // On desktop, just use wa.me in a new tab
    window.open(waUrl, '_blank');
  }
}

/**
 * Universal Reminder Function
 * Handles the logic: WhatsApp (if possible) vs SMS
 */
export function sendUniversalReminder(options: {
  customerName: string;
  phone: string;
  amount: number;
  currency: string;
  invoiceNumber?: string;
  hasWhatsapp?: boolean;
  countryCode?: string;
}) {
  const { customerName, phone, amount, currency, invoiceNumber, hasWhatsapp, countryCode } = options;
  
  const amountStr = `${amount.toLocaleString('en-US')} ${currency || 'USD'}`;
  
  if (hasWhatsapp) {
    // WhatsApp Message: Payment alert + PDF statement mention
    let message = `عزيزي ${customerName}،\n\n`;
    message += `نود تذكيركم بأن هناك مبلغ متبقي مطلوب سداده قدره *${amountStr}* `;
    if (invoiceNumber) {
      message += `للفاتورة رقم *#${invoiceNumber}*`;
    } else {
      message += `كمديونية مستحقة في حسابكم لدينا.`;
    }
    message += `\n\nنرفق لكم طيه كشف حساب تفصيلي يوضح كافة الحركات المالية. 📂`;
    message += `\n\nشكراً لتعاملكم معنا ونسعد دائماً بخدمتكم. ✨`;
    
    openWhatsApp(message, phone, countryCode);
  } else {
    // SMS Message (Reminder + Welcome message + Remaining amount)
    const welcome = `أهلاً بك عزيزنا ${customerName}، نرحب بك في مركزنا.`;
    const reminder = `نذكرك بالمبلغ المتبقي المطلوب سداده: ${amountStr}`;
    const invoiceInfo = invoiceNumber ? ` للفاتورة #${invoiceNumber}` : '';
    const closing = `شكراً لثقتكم بنا.`;
    
    const fullSms = `${welcome} ${reminder}${invoiceInfo}. ${closing}`;
    
    const encodedText = encodeURIComponent(fullSms);
    const cleanPhone = phone.replace(/\D/g, '');
    
    window.location.href = `sms:${cleanPhone}?body=${encodedText}`;
  }
}
