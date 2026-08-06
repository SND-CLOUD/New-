import { useEffect } from 'react';

export function useBackHandler(isActive: boolean, onBack: () => void) {
  useEffect(() => {
    if (!isActive) return;

    const handler = () => {
      onBack();
      return true;
    };

    if (!(window as any).backHandlers) {
      (window as any).backHandlers = [];
    }

    (window as any).backHandlers.push(handler);

    return () => {
      if ((window as any).backHandlers) {
        (window as any).backHandlers = (window as any).backHandlers.filter((h: any) => h !== handler);
      }
    };
  }, [isActive, onBack]);
}
