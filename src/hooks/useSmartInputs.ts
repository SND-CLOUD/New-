import { useEffect } from 'react';

export function useSmartInputs() {
  useEffect(() => {
    let hideKeyboardTimeout: any;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const input = target as HTMLInputElement | HTMLTextAreaElement;
        
        // Auto-select text on focus
        if (
          input.type === 'text' || 
          input.type === 'number' || 
          input.type === 'tel' ||
          input.type === 'email' ||
          input.type === 'password'
        ) {
          try {
            input.select();
          } catch (e) {
            // some input types don't support selection
          }
        }

        // Scroll into view to ensure it's in front of the user
        // Small timeout allows virtual keyboard to pop up first on mobile
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      
        // Handle the dropdown/datalist keyboard toggle
        // The user wants the first click on an input with a dropdown to hide the keyboard
        // and the second click to show it.
        if (target.tagName === 'INPUT') {
          const input = target as HTMLInputElement;
          
          // We look for inputs that act as comboboxes (have list attribute or specific class/data)
          const isDropdownInput = input.hasAttribute('list') || input.dataset.dropdown === 'true' || input.className.includes('autocomplete');
          
          if (isDropdownInput) {
             const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
             if (isMobile) {
                if (input.dataset.kbtoggle !== 'active') {
                   // First click: prevent keyboard by briefly setting readonly
                   // This allows datalist to open natively on some mobile browsers without keyboard
                   input.readOnly = true;
                   input.dataset.kbtoggle = 'active';
                   
                   clearTimeout(hideKeyboardTimeout);
                   hideKeyboardTimeout = setTimeout(() => {
                      input.readOnly = false;
                   }, 500); // 500ms is usually enough for the native UI to show the dropdown
                } else {
                   // Second click: keyboard will show normally because readonly is false
                   input.dataset.kbtoggle = '';
                }
             }
          }
        }
      };

      const handleInput = (e: Event) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          // Replace Arabic digits with English digits globally for all inputs
          const arabicDigits = /[٠١٢٣٤٥٦٧٨٩]/g;
          if (arabicDigits.test(target.value)) {
            const cursorPosition = target.selectionStart;
            target.value = target.value.replace(arabicDigits, (d) => {
              return String.fromCharCode(d.charCodeAt(0) - 1632 + 48); // Convert to English digits
            });
            // React handles onChange, but direct mutation might not trigger it unless we dispatch Event
            // Wait, changing target.value directly might mess up React controlled components.
            // Better to dispatch an event or let standard React handlers do it, but global works if we dispatch.
            const event = new Event('input', { bubbles: true });
            target.dispatchEvent(event);
            if (cursorPosition !== null) {
              target.setSelectionRange(cursorPosition, cursorPosition);
            }
          }
        }
      };

      document.addEventListener('focusin', handleFocusIn);
      document.addEventListener('pointerdown', handlePointerDown, { capture: true });
      document.addEventListener('input', handleInput, { capture: true });

      return () => {
        document.removeEventListener('focusin', handleFocusIn);
        document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
        document.removeEventListener('input', handleInput, { capture: true });
        clearTimeout(hideKeyboardTimeout);
      };
    }, []);
  }
