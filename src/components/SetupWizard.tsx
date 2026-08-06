import React, { useState } from 'react';
import { motion } from 'motion/react';
import { doc, getDoc, setDoc } from '../firebase';
import { db } from '../firebase';
import { ShopConfig } from '../types';
import { Store, Calendar, Upload, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { localDb } from '../lib/local-db';

export default function SetupWizard({ onComplete }: { onComplete: (config: ShopConfig) => void }) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ShopConfig>({
    shopName: 'عالم الصيانة والتجارة',
    fiscalYear: new Date().getFullYear().toString(),
    startDate: new Date().toISOString().split('T')[0],
    logoUrl: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Fetch existing company details from Cloud or SQLite if present to preserve all existing shop fields
      let existing: any = {};
      try {
        const cloudSnap = await getDoc(doc(db, 'company_details', 'main_details'));
        if (cloudSnap.exists()) {
          existing = cloudSnap.data() || {};
        }
      } catch (cloudErr) {}

      if (!existing.name && !existing.shopName) {
        try {
          const localDetails = await localDb.query("SELECT * FROM company_details LIMIT 1");
          if (localDetails.values && localDetails.values.length > 0) {
            existing = localDetails.values[0] || {};
          }
        } catch (locErr) {}
      }

      // Merge user inputs with existing details so we NEVER erase existing bank accounts, phones, address, notes, etc.
      const fullDetails = {
        name: config.shopName || existing.name || existing.shopName || "عالم الصيانة والتجارة",
        shopName: config.shopName || existing.shopName || existing.name || "عالم الصيانة والتجارة",
        phone1: existing.phone1 || "",
        phone2: existing.phone2 || "",
        landline: existing.landline || "",
        address: existing.address || "",
        receiptNotes: existing.receiptNotes || "",
        managerName: existing.managerName || "",
        commercialRecord: existing.commercialRecord || "",
        taxNumber: existing.taxNumber || "",
        logo: config.logoUrl || existing.logo || existing.logoUrl || "",
        logoUrl: config.logoUrl || existing.logoUrl || existing.logo || "",
        countryCode: existing.countryCode || "+967",
        facebookUrl: existing.facebookUrl || "",
        mapUrl: existing.mapUrl || "",
        email: existing.email || "",
        bio: existing.bio || "",
        bankYerName: existing.bankYerName || "",
        bankYerAccount: existing.bankYerAccount || "",
        bankSarName: existing.bankSarName || "",
        bankSarAccount: existing.bankSarAccount || "",
        bankUsdName: existing.bankUsdName || "",
        bankUsdAccount: existing.bankUsdAccount || "",
        bankHolderName: existing.bankHolderName || "",
        liabilityCurrency: existing.liabilityCurrency || "YER",
        updatedAt: new Date().toISOString(),
        fiscalYear: config.fiscalYear || existing.fiscalYear || new Date().getFullYear().toString(),
        startDate: config.startDate || existing.startDate || new Date().toISOString().split('T')[0]
      };

      // 2. Save to Firestore
      if (JSON.stringify(fullDetails).length > 900000) {
        (fullDetails as any).logoUrl = "";
        (fullDetails as any).logo = "";
      }
      await setDoc(doc(db, 'company_details', 'main_details'), fullDetails, { merge: true });

      // 3. Save to Local DB
      try {
        await localDb.query(
          `INSERT OR REPLACE INTO company_details (
            id, shopName, name, countryCode, phone1, phone2, landline, address, receiptNotes, managerName,
            commercialRecord, taxNumber, logo, logoUrl,
            bankYerName, bankYerAccount, bankSarName, bankSarAccount,
            bankUsdName, bankUsdAccount, bankHolderName, liabilityCurrency,
            updatedAt, fiscalYear, startDate
          ) VALUES (
            'main_details', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )`,
          [
            fullDetails.shopName, fullDetails.name, fullDetails.countryCode,
            fullDetails.phone1, fullDetails.phone2, fullDetails.landline, fullDetails.address,
            fullDetails.receiptNotes, fullDetails.managerName, fullDetails.commercialRecord,
            fullDetails.taxNumber, fullDetails.logo, fullDetails.logoUrl,
            fullDetails.bankYerName, fullDetails.bankYerAccount, fullDetails.bankSarName, fullDetails.bankSarAccount,
            fullDetails.bankUsdName, fullDetails.bankUsdAccount, fullDetails.bankHolderName, fullDetails.liabilityCurrency,
            fullDetails.updatedAt, fullDetails.fiscalYear, fullDetails.startDate
          ]
        );
      } catch (localErr) {
        console.error("Local save failed in SetupWizard:", localErr);
      }

      onComplete(config);
    } catch (e) {
      console.error(e);
      alert('Error saving configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

          setConfig({ ...config, logoUrl: canvas.toDataURL("image/jpeg", 0.7) });

        };

        img.src = reader.result as string;

      };

      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-900/10 via-transparent to-transparent">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-[#1a1a1a] border border-white/5 rounded-3xl p-8 shadow-2xl space-y-8"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-600/10 text-orange-500 rounded-full text-xs font-bold uppercase tracking-wider">
            <CheckCircle size={14} />
            First Time Setup
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Configure Your Business</h1>
          <p className="text-gray-400">Let's set up your shop profile and fiscal year.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2 text-center flex flex-col items-center">
              <label className="text-xs font-bold text-gray-500 uppercase w-full text-left ml-1">Business Logo</label>
              <div className="relative group mt-2">
                <div className="w-32 h-32 rounded-2xl bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-orange-500">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <Upload className="text-gray-600" size={32} />
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="absolute -bottom-2 -right-2 p-2 bg-orange-600 rounded-lg shadow-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Shop Name</label>
              <div className="relative">
                <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input 
                  type="text" 
                  required
                  value={config.shopName}
                  onChange={(e) => setConfig({ ...config, shopName: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3 focus:border-orange-500 outline-none transition-all"
                  placeholder="عالم الصيانة والتجارة"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Fiscal Year</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input 
                  type="text" 
                  required
                  value={config.fiscalYear}
                  onChange={(e) => setConfig({ ...config, fiscalYear: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3 focus:border-orange-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Start Date</label>
              <input 
                type="date" 
                required
                value={config.startDate}
                onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:border-orange-500 outline-none transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-orange-900/20 flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : (
              <>
                Finalize Setup
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
