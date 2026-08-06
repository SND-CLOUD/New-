sed -i '/<div className="font-bold text-white text-xs">{detailForm.deviceName || .غير مسمى.}<\/div>/a \
                        )}\n\
                      </div>\n\
\n\
                      {/* نوع الجهاز */}\n\
                      <div className="bg-[#1c1c1c] p-3 rounded-2xl border border-white/5 space-y-1">\n\
                        <span className="text-[10px] text-gray-400 font-bold block">نوع الجهاز</span>\n\
                        {isEditingDetailModal ? (\n\
                          <select\n\
                            value={detailForm.deviceType || "عام"}\n\
                            onChange={(e) => setDetailForm({ ...detailForm, deviceType: e.target.value as "مخصص" | "عام" })}\n\
                            className="w-full bg-[#2a2a2a] border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs text-white outline-none"\n\
                          >\n\
                            <option value="مخصص">مخصص</option>\n\
                            <option value="عام">عام</option>\n\
                          </select>\n\
                        ) : (\n\
                          <div className="font-bold text-white text-xs">{detailForm.deviceType || "عام"}</div>' src/components/AccountingInputs.tsx
