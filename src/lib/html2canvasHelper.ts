export const parseOklch = (str: string) => {
  if (!str) return null;
  const cleaned = str.trim().toLowerCase();
  const match = cleaned.match(/(?:oklch|oklab)\s*\(([^)]+)\)/i);
  if (!match) return null;
  
  const inner = match[1];
  // Split by comma, slash, or whitespace
  const parts = inner.split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;

  let l = parseFloat(parts[0]);
  if (parts[0].endsWith('%')) {
    l = parseFloat(parts[0]) / 100;
  }
  let c = parseFloat(parts[1]);
  if (parts[1].endsWith('%')) {
    c = parseFloat(parts[1]) / 100;
  }
  let h = parseFloat(parts[2]);
  if (parts[2].endsWith('deg')) {
    h = parseFloat(parts[2]);
  } else if (parts[2].endsWith('rad')) {
    h = parseFloat(parts[2]) * (180 / Math.PI);
  } else if (parts[2].endsWith('turn')) {
    h = parseFloat(parts[2]) * 360;
  }

  let alpha = 1;
  if (parts.length >= 4) {
    if (parts[3].endsWith('%')) {
      alpha = parseFloat(parts[3]) / 100;
    } else {
      alpha = parseFloat(parts[3]);
    }
  }

  return { l, c, h, alpha, isOklab: cleaned.startsWith('oklab') };
};

export const oklchToRgb = (oklchStr: string): string => {
  const parsed = parseOklch(oklchStr);
  if (!parsed) return oklchStr;

  let { l, c, h, alpha, isOklab } = parsed;

  l = Math.max(0, Math.min(1, l));

  let a = 0;
  let b = 0;

  if (isOklab) {
    a = c;
    b = h;
  } else {
    const hRad = (h * Math.PI) / 180;
    a = c * Math.cos(hRad);
    b = c * Math.sin(hRad);
  }

  // Convert OKLAB to LMS
  const l_lms = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_lms = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_lms = l - 0.0894841775 * a - 1.2914855480 * b;

  // Cube LMS to get linear LMS
  const l_cube = l_lms * l_lms * l_lms;
  const m_cube = m_lms * m_lms * m_lms;
  const s_cube = s_lms * s_lms * s_lms;

  // Convert linear LMS to linear sRGB
  const r_lin = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
  const g_lin = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
  const b_lin = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

  // Helper to convert linear channel to sRGB channel
  const pivot = (v: number) => {
    if (v <= 0.0031308) {
      return 12.92 * v;
    }
    return 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  };

  const r = Math.max(0, Math.min(255, Math.round(pivot(r_lin) * 255)));
  const g = Math.max(0, Math.min(255, Math.round(pivot(g_lin) * 255)));
  const b_val = Math.max(0, Math.min(255, Math.round(pivot(b_lin) * 255)));

  if (alpha === 1) {
    return `rgb(${r}, ${g}, ${b_val})`;
  } else {
    return `rgba(${r}, ${g}, ${b_val}, ${alpha})`;
  }
};

const oklchCache = new Map<string, string>();

export const convertOklchToRgb = (color: string): string => {
  if (!color || (!color.includes('oklch') && !color.includes('oklab'))) return color;
  const trimmed = color.trim();
  if (oklchCache.has(trimmed)) {
    return oklchCache.get(trimmed)!;
  }
  const converted = oklchToRgb(trimmed);
  oklchCache.set(trimmed, converted);
  return converted;
};

export const cleanOklchInStyleText = (text: string): string => {
  return text;
};

export const applyPrintStylesAndGetRestoreFn = (printArea: HTMLElement): () => void => {
  const originalStyles = new Map<HTMLElement, { bg: string, color: string, border: string }>();
  const elements = printArea.querySelectorAll('*');
  
  elements.forEach((el) => {
    if (el instanceof HTMLElement) {
      let classes = el.className;
      if (typeof classes === 'string' && classes) {
        const orig = { bg: el.style.backgroundColor, color: el.style.color, border: el.style.borderColor };
        let modified = false;

        // Backgrounds
        if (classes.includes('bg-gray-50 ') || classes.includes('bg-gray-50/') || classes.endsWith('bg-gray-50')) {
          el.style.backgroundColor = '#f9fafb'; modified = true;
        } else if (classes.includes('bg-gray-100') || classes.includes('bg-gray-100/')) {
          el.style.backgroundColor = '#f3f4f6'; modified = true;
        } else if (classes.includes('bg-gray-200') || classes.includes('bg-gray-200/')) {
          el.style.backgroundColor = '#e5e7eb'; modified = true;
        } else if (classes.includes('bg-gray-300')) {
          el.style.backgroundColor = '#d1d5db'; modified = true;
        } else if (classes.includes('bg-rose-50/') || classes.includes('bg-rose-50 ') || classes.endsWith('bg-rose-50')) {
          el.style.backgroundColor = '#fff1f2'; modified = true;
        } else if (classes.includes('bg-emerald-50/') || classes.includes('bg-emerald-50 ') || classes.endsWith('bg-emerald-50')) {
          el.style.backgroundColor = '#ecfdf5'; modified = true;
        } else if (classes.includes('bg-blue-50/') || classes.includes('bg-blue-50 ') || classes.endsWith('bg-blue-50')) {
          el.style.backgroundColor = '#eff6ff'; modified = true;
        } else if (classes.includes('bg-amber-50') || classes.includes('bg-orange-50')) {
          el.style.backgroundColor = '#fffbeb'; modified = true;
        } else if (classes.includes('bg-white')) {
          el.style.backgroundColor = '#ffffff'; modified = true;
        } else if (classes.includes('bg-black/40')) {
          el.style.backgroundColor = '#9ca3af'; modified = true;
        } else if (classes.includes('bg-black/5')) {
          el.style.backgroundColor = '#f3f4f6'; modified = true;
        } else if (classes.includes('bg-gray-800')) {
          el.style.backgroundColor = '#1f2937'; modified = true;
        }

        // Text colors
        if (classes.includes('text-gray-400')) {
          el.style.color = '#9ca3af'; modified = true;
        } else if (classes.includes('text-gray-500')) {
          el.style.color = '#6b7280'; modified = true;
        } else if (classes.includes('text-gray-600')) {
          el.style.color = '#4b5563'; modified = true;
        } else if (classes.includes('text-gray-700')) {
          el.style.color = '#374151'; modified = true;
        } else if (classes.includes('text-gray-800')) {
          el.style.color = '#1f2937'; modified = true;
        } else if (classes.includes('text-gray-900') || classes.includes('text-gray-950')) {
          el.style.color = '#111827'; modified = true;
        } else if (classes.includes('text-rose-500')) {
          el.style.color = '#f43f5e'; modified = true;
        } else if (classes.includes('text-rose-700')) {
          el.style.color = '#be123c'; modified = true;
        } else if (classes.includes('text-rose-800')) {
          el.style.color = '#9f1239'; modified = true;
        } else if (classes.includes('text-rose-900')) {
          el.style.color = '#881337'; modified = true;
        } else if (classes.includes('text-emerald-400')) {
          el.style.color = '#34d399'; modified = true;
        } else if (classes.includes('text-emerald-700')) {
          el.style.color = '#047857'; modified = true;
        } else if (classes.includes('text-emerald-800')) {
          el.style.color = '#065f46'; modified = true;
        } else if (classes.includes('text-emerald-900')) {
          el.style.color = '#064e3b'; modified = true;
        } else if (classes.includes('text-amber-500') || classes.includes('text-orange-500') || classes.includes('text-orange-400')) {
          el.style.color = '#f59e0b'; modified = true;
        } else if (classes.includes('text-white')) {
          el.style.color = '#ffffff'; modified = true;
        } else if (classes.includes('text-black')) {
          el.style.color = '#000000'; modified = true;
        }

        // Border colors
        if (classes.includes('border-gray-200')) {
          el.style.borderColor = '#e5e7eb'; modified = true;
        } else if (classes.includes('border-gray-300')) {
          el.style.borderColor = '#d1d5db'; modified = true;
        } else if (classes.includes('border-gray-400')) {
          el.style.borderColor = '#9ca3af'; modified = true;
        } else if (classes.includes('border-gray-900') || classes.includes('border-gray-950')) {
          el.style.borderColor = '#111827'; modified = true;
        } else if (classes.includes('border-white')) {
          el.style.borderColor = '#ffffff'; modified = true;
        } else if (classes.includes('border-black') || classes.includes('divide-black')) {
          el.style.borderColor = '#000000'; modified = true;
        }

        if (modified) {
          originalStyles.set(el, orig);
        }
      }
    }
  });

  return () => {
    originalStyles.forEach((val, el) => {
      el.style.backgroundColor = val.bg;
      el.style.color = val.color;
      el.style.borderColor = val.border;
    });
  };
};

export const sanitizeElementInlineStyles = (element: HTMLElement) => {
  const allElements = [element, ...Array.from(element.querySelectorAll('*'))];
  allElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      const styleAttr = el.getAttribute('style');
      if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('color-mix'))) {
        el.setAttribute('style', cleanOklchInStyleText(styleAttr));
      }
      
      // Fix arabic text rendering issue in html2canvas
      el.style.letterSpacing = 'normal';
      el.style.setProperty('letter-spacing', 'normal', 'important');
      
      if (typeof el.className === 'string') {
        el.className = el.className.replace(/tracking-tight/g, 'tracking-normal').replace(/tracking-wide/g, 'tracking-normal');
        el.className = el.className.replace(/leading-tight/g, 'leading-normal').replace(/leading-none/g, 'leading-normal');
      }
    }
  });
};

let styleBackups: Array<{ element: HTMLStyleElement; originalText: string }> = [];
let createdStyles: HTMLStyleElement[] = [];
let disabledLinks: Array<{ link: HTMLLinkElement; parent: Node | null; nextSibling: Node | null }> = [];

export const restoreDocumentStyles = (): void => {
  // Clear backups
  styleBackups = [];
  createdStyles = [];
  disabledLinks = [];
};

export const sanitizeDocumentStyles = async (): Promise<() => void> => {
  return () => {};
};
