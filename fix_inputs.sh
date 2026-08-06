sed -i '601,710c\
  // 3. Currency Submit\
  const handleCurrencySubmit = async (e: React.FormEvent) => {\
    e.preventDefault();\
    if (!currencyForm.name.trim() || !currencyForm.symbol.trim()) return;\
\
    try {\
      if (currencyForm.id) {\
        await ProviderFactory.getProvider().updateDoc("fin_currencies", currencyForm.id, { name: currencyForm.name.trim(), symbol: currencyForm.symbol.trim(), decimals: Number(currencyForm.decimals), status: currencyForm.status });\
        triggerNotification("تم تحديث العملة بنجاح");\
      } else {\
        const newId = currencyForm.symbol.trim().toUpperCase();\
        await ProviderFactory.getProvider().setDoc("fin_currencies", newId, { name: currencyForm.name.trim(), symbol: currencyForm.symbol.trim(), decimals: Number(currencyForm.decimals), status: currencyForm.status });\
        triggerNotification("تم إضافة العملة بنجاح");\
      }\
      setCurrencyForm({\
        name: "",\
        symbol: "",\
        decimals: 2,\
        status: "active"\
      });\
      setShowCurrencyForm(false);\
      loadAllData();\
    } catch (err: any) {\
      setError(err.message || "فشل تشغيل العملة");\
    }\
  };\
\
  // 4. Payment Method Submit\
  const handleMethodSubmit = async (e: React.FormEvent) => {\
    e.preventDefault();\
    if (!methodForm.name.trim()) return;\
\
    try {\
      if (methodForm.id) {\
        await ProviderFactory.getProvider().updateDoc("fin_payment_methods", methodForm.id, { name: methodForm.name.trim(), description: methodForm.description.trim(), status: methodForm.status });\
        triggerNotification("تم تحديث طريقة الدفع بنجاح");\
      } else {\
        const newId = `pay-${Math.random().toString(36).substring(2, 8)}`;\
        await ProviderFactory.getProvider().setDoc("fin_payment_methods", newId, { name: methodForm.name.trim(), description: methodForm.description.trim(), status: methodForm.status });\
        triggerNotification("تم إضافة طريقة الدفع الجديدة بنجاح");\
      }\
      setMethodForm({\
        name: "",\
        description: "",\
        status: "active"\
      });\
      setShowMethodForm(false);\
      loadAllData();\
    } catch (err: any) {\
      setError(err.message || "فشل حفظ طريقة الدفع");\
    }\
  };\
\
  // Job Title Submit\
  const handleJobTitleSubmit = async (e: React.FormEvent) => {\
    e.preventDefault();\
    if (!jobTitleForm.title.trim()) return;\
\
    try {\
      const autoJobNum = jobTitles.length > 0 ? Math.max(...jobTitles.map(j => Number(j.job_number) || 0)) + 1 : 1;\
      const finalJobNum = jobTitleForm.job_number ? Number(jobTitleForm.job_number) : autoJobNum;\
\
      if (editingJobTitleId && editingJobTitleId !== "new") {\
        await ProviderFactory.getProvider().updateDoc("job_titles", editingJobTitleId, {\
          job_number: finalJobNum,\
          title: jobTitleForm.title.trim(),\
          notes: jobTitleForm.notes.trim()\
        });\
        // Update SQLite\
        await localDb.query(`UPDATE job_titles SET job_number = ?, title = ?, notes = ? WHERE id = ?`, [finalJobNum, jobTitleForm.title.trim(), jobTitleForm.notes.trim(), editingJobTitleId]);\
        triggerNotification("تم تحديث المسمى الوظيفي بنجاح");\
      } else {\
        const newId = `job-${Math.random().toString(36).substring(2, 8)}`;\
        await ProviderFactory.getProvider().setDoc("job_titles", newId, {\
          job_number: finalJobNum,\
          title: jobTitleForm.title.trim(),\
          notes: jobTitleForm.notes.trim()\
        });\
        // Insert into SQLite\
        await localDb.query(`INSERT INTO job_titles (id, job_number, title, notes) VALUES (?, ?, ?, ?)`, [newId, finalJobNum, jobTitleForm.title.trim(), jobTitleForm.notes.trim()]);\
        triggerNotification("تم إضافة المسمى الوظيفي بنجاح");\
      }\
      setJobTitleForm({ id: "", job_number: "", title: "", notes: "" });\
      setEditingJobTitleId(null);\
      loadAllData();\
    } catch (err: any) {\
      setError(err.message || "فشل حفظ المسمى الوظيفي");\
    }\
  };\
\
  const [deleteJobTitleConfirmId, setDeleteJobTitleConfirmId] = useState<string | null>(null);\
  const handleDeleteJobTitle = async (id: string) => {\
    if (deleteJobTitleConfirmId === id) {\
      try {\
        await ProviderFactory.getProvider().deleteDoc("job_titles", id);\
        await localDb.query(`DELETE FROM job_titles WHERE id = ?`, [id]);\
        triggerNotification("تم الحذف بنجاح");\
        setDeleteJobTitleConfirmId(null);\
        loadAllData();\
      } catch (err: any) {\
        setError(err.message || "فشل الحذف");\
      }\
    } else {\
      setDeleteJobTitleConfirmId(id);\
      setTimeout(() => setDeleteJobTitleConfirmId(null), 3000);\
    }\
  };\
' src/components/AccountingInputs.tsx
