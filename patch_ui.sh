sed -i '/اسم الموائم للجهاز بالورشة/a \
                    </div>\n\
\n\
                    {/* نوع الجهاز */}\n\
                    <div className="space-y-1">\n\
                      <label className="text-xs text-gray-300 font-bold block">\n\
                        نوع الجهاز\n\
                      </label>\n\
                      <select\n\
                        value={deviceForm.deviceType || "عام"}\n\
                        onChange={(e) => setDeviceForm({ ...deviceForm, deviceType: e.target.value as "مخصص" | "عام" })}\n\
                        className="w-full bg-[#242424] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"\n\
                      >\n\
                        <option value="مخصص">مخصص</option>\n\
                        <option value="عام">عام</option>\n\
                      </select>\n\
                      <p className="text-[10px] text-gray-500">هل هو مخصص لمستخدم محدد أم عام.</p>' src/components/AccountingInputs.tsx
