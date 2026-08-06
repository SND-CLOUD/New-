sed -i '/<th className="p-3">اسم الجهاز<\/th>/a \
                        <th className="p-3">نوع الجهاز</th>' src/components/AccountingInputs.tsx

sed -i '/<span>{device.deviceName}<\/span>/a \
                              </div>\n\
                            </td>\n\
\n\
                            {/* 2.5 نوع الجهاز */}\n\
                            <td className="p-3 text-gray-300">\n\
                              <div className="flex items-center gap-1.5">\n\
                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${device.deviceType === "مخصص" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-gray-500/10 text-gray-400 border border-gray-500/20"}`}>\n\
                                  {device.deviceType || "عام"}\n\
                                </span>' src/components/AccountingInputs.tsx
