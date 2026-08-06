export const parseDate = (dateVal: any): Date | null => {
  if (dateVal === undefined || dateVal === null || dateVal === '') return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  
  // Handle Firestore / Firestore-like / serialized JSON objects
  if (typeof dateVal === 'object') {
    if (typeof dateVal.toDate === 'function') {
      try {
        const d = dateVal.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch (e) {
        // ignore and fallback
      }
    }
    if (typeof dateVal.toISOString === 'function') {
      try {
        const d = new Date(dateVal.toISOString());
        if (!isNaN(d.getTime())) return d;
      } catch (e) {
        // ignore
      }
    }

    if (dateVal.$date) {
      const d = parseDate(dateVal.$date);
      if (d) return d;
    }

    const rawSecs = dateVal.seconds ?? dateVal._seconds ?? dateVal.secondsValue;
    if (rawSecs !== undefined && rawSecs !== null && rawSecs !== '') {
      const secs = typeof rawSecs === 'number' ? rawSecs : parseFloat(String(rawSecs));
      if (!isNaN(secs)) {
        const rawNanos = dateVal.nanoseconds ?? dateVal._nanoseconds ?? 0;
        const nanos = typeof rawNanos === 'number' ? rawNanos : parseFloat(String(rawNanos)) || 0;
        const ms = (secs > 1000000000 && secs < 3000000000) ? (secs * 1000 + nanos / 1000000) : secs;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) return d;
      }
    }

    if (dateVal.date) {
      const d = parseDate(dateVal.date);
      if (d) return d;
    }
    if (dateVal.value) {
      const d = parseDate(dateVal.value);
      if (d) return d;
    }
    if (dateVal.timestamp) {
      const d = parseDate(dateVal.timestamp);
      if (d) return d;
    }
  }

  // Handle number input
  if (typeof dateVal === 'number') {
    if (isNaN(dateVal)) return null;
    // If it's standard Unix seconds (e.g. 1719283739), convert to ms
    if (dateVal > 1000000000 && dateVal < 3000000000) {
      return new Date(dateVal * 1000);
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  }

  // Handle string input
  if (typeof dateVal === 'string') {
    let trimmed = dateVal.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'NaN' || trimmed === '---' || trimmed === '[object Object]') {
      return null;
    }

    // Convert Arabic-Indic digits to ASCII
    trimmed = trimmed.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

    // Check if it's a JSON string (e.g. '{"seconds":1715000000}' or '"2024-05-20"')
    if (trimmed.startsWith('{') || trimmed.startsWith('[') || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
      try {
        const parsedJson = JSON.parse(trimmed);
        if (parsedJson) {
          const d = parseDate(parsedJson);
          if (d) return d;
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }

    // Check DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY format
    const dmYMatch = trimmed.match(/^(\d{1,2})[/\.-](\d{1,2})[/\.-](\d{2,4})(?:\s+(.*))?$/);
    if (dmYMatch) {
      let p1 = parseInt(dmYMatch[1], 10);
      let p2 = parseInt(dmYMatch[2], 10);
      let year = parseInt(dmYMatch[3], 10);
      if (year < 100) year += 2000;

      let day = p1;
      let month = p2;

      if (p2 > 12 && p1 <= 12) {
        day = p2;
        month = p1;
      }

      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        let hours = 0, minutes = 0, seconds = 0;
        if (dmYMatch[4]) {
          const timeStr = dmYMatch[4].trim();
          const timeMatch = timeStr.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(ص|م|AM|PM|am|pm)?$/i);
          if (timeMatch) {
            hours = parseInt(timeMatch[1], 10);
            minutes = parseInt(timeMatch[2], 10);
            seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
            const ampm = timeMatch[4] ? timeMatch[4].toUpperCase() : '';
            if ((ampm === 'PM' || ampm === 'م') && hours < 12) hours += 12;
            if ((ampm === 'AM' || ampm === 'ص') && hours === 12) hours = 0;
          }
        }
        const d = new Date(year, month - 1, day, hours, minutes, seconds);
        if (!isNaN(d.getTime())) return d;
      }
    }

    // If string is purely numeric, parse as number/timestamp
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const parsedNum = parseFloat(trimmed);
      if (!isNaN(parsedNum)) {
        if (parsedNum > 1000000000 && parsedNum < 3000000000) {
          return new Date(parsedNum * 1000);
        }
        const d = new Date(parsedNum);
        if (!isNaN(d.getTime())) return d;
      }
    }
    
    // Parse standard date string
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d;
    }

    // Fallback: replace slashes with dashes (e.g., 2024/05/20 -> 2024-05-20)
    const formattedStr = trimmed.replace(/\//g, '-');
    const d2 = new Date(formattedStr);
    if (!isNaN(d2.getTime())) {
      return d2;
    }
  }

  // Fallback check
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      return d;
    }
  } catch (e) {
    // ignore
  }

  return null;
};

export const formatDateTime = (dateVal: any): string => {
  const date = parseDate(dateVal);
  if (!date) return '---';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

export const formatDate = (dateVal: any, fallbackText: string = '---'): string => {
  const d = parseDate(dateVal);
  if (!d) return fallbackText;
  try {
    return d.toLocaleDateString('ar-YE');
  } catch (e) {
    return fallbackText;
  }
};

export const formatTime = (dateVal: any, fallbackText: string = '---'): string => {
  const d = parseDate(dateVal);
  if (!d) return fallbackText;
  try {
    return d.toLocaleTimeString('ar-YE', { hour12: true, hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return fallbackText;
  }
};

export const renderSafeValue = (val: any): any => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') {
      try {
        const d = val.toDate();
        return d instanceof Date && !isNaN(d.getTime()) ? d.toLocaleDateString('ar-YE') : '---';
      } catch (e) {
        return '---';
      }
    }
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? '---' : val.toLocaleDateString('ar-YE');
    }
    if (val._isTimestamp || val.seconds !== undefined) {
      const d = parseDate(val);
      return d ? d.toLocaleDateString('ar-YE') : '---';
    }
    if (Array.isArray(val)) {
      return val.map(renderSafeValue).join(', ');
    }
    if ((val as any).$$typeof) {
      return val;
    }
    try {
      return JSON.stringify(val);
    } catch (e) {
      return String(val);
    }
  }
  return val;
};

export const parseTxDate = (tx: any): Date | null => {
  if (!tx) return null;
  return parseDate(tx.timestamp) || parseDate(tx.updatedAt) || parseDate(tx.createdAt) || parseDate(tx.date) || parseDate(tx.actionDate) || parseDate(tx.deliveredAt) || null;
};

export const formatTxDate = (tx: any, fallbackText: string = '---'): string => {
  const d = parseTxDate(tx);
  if (d) return formatDateTime(d);
  const backupRaw = String(tx?.timestamp || tx?.updatedAt || tx?.createdAt || tx?.date || fallbackText);
  return backupRaw === '[object Object]' ? fallbackText : backupRaw;
};

