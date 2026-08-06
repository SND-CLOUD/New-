sed -i '/const handleBlockDevice = async/i \
  // Delete Device handler\n\
  const handleDeleteDevice = async (deviceId: string) => {\n\
    if (!confirm("هل أنت متأكد من حذف هذا الجهاز؟")) return;\n\
    try {\n\
      await ProviderFactory.getProvider().deleteDoc("user_devices", deviceId);\n\
      try {\n\
        await localDb.run("DELETE FROM user_devices WHERE id = ?", [deviceId]);\n\
      } catch (sq) {}\n\
      triggerNotification("تم حذف الجهاز بنجاح");\n\
      setSelectedDeviceForDetail(null);\n\
      loadAllData();\n\
    } catch (e: any) {\n\
      alert("فشلت العملية: " + e.message);\n\
    }\n\
  };\n\
' src/components/AccountingInputs.tsx
