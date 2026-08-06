import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Fingerprint, Lock, ShieldAlert } from 'lucide-react';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Device } from '@capacitor/device';

interface SecurityGuardProps {
  children: React.ReactNode;
}

export default function SecurityGuard({ children }: SecurityGuardProps) {
  const [locked, setLocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const checkSecurity = async () => {
      const savedSettings = JSON.parse(localStorage.getItem('snd_settings') || '{}');
      setSettings(savedSettings);

      try {
        const info = await Device.getInfo();
        const isWeb = info.platform === 'web';

        if (savedSettings.biometricEnabled || savedSettings.pinEnabled) {
          // Fallback for web: only lock if PIN is enabled
          if (isWeb && !savedSettings.pinEnabled) {
            setLocked(false);
            return;
          }

          setLocked(true);
          
          if (savedSettings.biometricEnabled && !isWeb) {
            const bio = await NativeBiometric.isAvailable();
            if (bio.isAvailable) {
              authenticateBiometric();
            } else if (!savedSettings.pinEnabled) {
              // Bio enabled but not available, and no PIN fallback
              setLocked(false);
            }
          }
        }
      } catch (err) {
        console.error("Security check failed", err);
        // If error during check, default to unlocked to prevent permanent lockout
        setLocked(false);
      }
    };
    checkSecurity();
  }, []);

  const authenticateBiometric = async () => {
    try {
      const info = await Device.getInfo();
      if (info.platform === 'web') {
        // Mock success for web development if we want, but better to just not lock
        return;
      }

      const result = await NativeBiometric.isAvailable();
      if (result.isAvailable) {
        const auth = await NativeBiometric.verifyIdentity({
          reason: "يرجى التحقق لفتح التطبيق",
          title: "تسجيل الدخول بالبصمة",
          subtitle: "SND System",
          description: "قم بوضع إصبعك على الحساس للمتابعة"
        });
        setLocked(false);
      }
    } catch (e) {
      console.warn("Biometric failed or cancelled", e);
      setError("فشل التحقق بالبصمة");
    }
  };

  const handlePinSubmit = () => {
    if (pinInput === settings.pinCode) {
      setLocked(false);
      setError('');
    } else {
      setError('الرمز السري غير صحيح');
      setPinInput('');
    }
  };

  if (!locked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-white font-sans rtl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xs w-full text-center space-y-8"
      >
        <div className="flex flex-col items-center space-y-4">
           <div className="w-20 h-20 bg-orange-600/10 rounded-3xl flex items-center justify-center text-orange-500 border border-orange-500/20">
              <ShieldAlert size={40} />
           </div>
           <div className="space-y-1">
              <h2 className="text-xl font-black">التطبيق مغلق</h2>
              <p className="text-sm text-gray-500">يرجى التحقق لتتمكن من الوصول للبيانات</p>
           </div>
        </div>

        {settings?.pinEnabled ? (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
               {Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className={`h-12 rounded-xl flex items-center justify-center text-2xl font-black transition-all ${pinInput.length > i ? 'bg-orange-500 text-white' : 'bg-black/40 border border-white/10 text-gray-700'}`}>
                    {pinInput.length > i ? '●' : ''}
                 </div>
               ))}
            </div>

            {error && <p className="text-xs text-red-500 font-bold animate-pulse">{error}</p>}

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                  key={num}
                  onClick={() => pinInput.length < 4 && setPinInput(p => p + num)}
                  className="h-16 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/5 text-xl font-bold transition-all active:scale-95"
                >
                  {num}
                </button>
              ))}
              <div />
              <button 
                onClick={() => pinInput.length < 4 && setPinInput(p => p + '0')}
                className="h-16 bg-white/5 rounded-2xl hover:bg-white/10 border border-white/5 text-xl font-bold transition-all active:scale-95"
              >
                0
              </button>
              <button 
                onClick={() => setPinInput(p => p.slice(0, -1))}
                className="h-16 bg-red-600/10 rounded-2xl hover:bg-red-600/20 text-red-500 font-bold transition-all active:scale-95"
              >
                ←
              </button>
            </div>

            {pinInput.length === 4 && (
              <button 
                onClick={handlePinSubmit}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black shadow-lg shadow-orange-900/40 transition-all flex items-center justify-center gap-2"
              >
                <Lock size={18} />
                تأكيد الرمز
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
             <p className="text-sm text-gray-500">تم تفعيل القفل البيومتري</p>
          </div>
        )}

        {settings?.biometricEnabled && (
          <button 
            onClick={authenticateBiometric}
            className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-orange-500 active:scale-90"
          >
            <Fingerprint size={48} />
          </button>
        )}
      </motion.div>
    </div>
  );
}
