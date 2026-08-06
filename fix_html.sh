sed -i '/<span>{device.deviceName}<\/span>/,/<\/div>/ c\
                                <span>{device.deviceName}</span>\n\
                                {device.isFrozen && (\n\
                                  <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-bold border border-sky-500/30">مُجمد</span>\n\
                                )}\n\
                              </div>\n\
                            </td>\n\
\n\
                            {/* 2.5 نوع الجهاز */}\n\
                            <td className="p-3 text-gray-300">\n\
                              <div className="flex items-center gap-1.5">\n\
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${device.deviceType === "مخصص" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"}`}>\n\
                                  {device.deviceType || "عام"}\n\
                                </span>\n\
                              </div>' src/components/AccountingInputs.tsx
