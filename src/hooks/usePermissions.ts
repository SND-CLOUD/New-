import { User, AppPermissions } from '../types';

export function usePermissions(currentUser: User | null, section?: keyof AppPermissions) {
  const hasPermission = (
    targetSectionOrAction: keyof AppPermissions | 'view' | 'add' | 'edit' | 'delete' | 'print', 
    maybeAction?: 'view' | 'add' | 'edit' | 'delete' | 'print'
  ): boolean => {
    if (!currentUser) return false;

    let targetSection: keyof AppPermissions | undefined = section;
    let action: 'view' | 'add' | 'edit' | 'delete' | 'print';

    if (maybeAction) {
      targetSection = targetSectionOrAction as keyof AppPermissions;
      action = maybeAction;
    } else {
      action = targetSectionOrAction as any;
    }

    if (!targetSection) {
      console.warn('hasPermission called without a section context');
      return false;
    }
    
    // Admins and Managers always have all permissions implicitly, unless explicitly revoked (but the user requested managers have all options enabled)
    if (currentUser.role === 'admin' || currentUser.role === 'manager') return true;
    
    // If no permissions object exists, default based on role
    if (!currentUser.permissions) {
      if (currentUser.role === 'data_entry') {
        if (action === 'delete' || action === 'edit') return false;
        if (
          targetSection === 'settings' || 
          targetSection === 'settings_users' || 
          targetSection === 'reports' ||
          (typeof targetSection === 'string' && targetSection.startsWith('settings_'))
        ) return false;
        return true;
      }
      return false;
    }
    
    const sectionPerms = currentUser.permissions[targetSection] as any;
    if (!sectionPerms) {
      if (typeof targetSection === 'string' && targetSection.startsWith('settings_')) {
        return !!currentUser.permissions.settings?.view;
      }
      return false;
    }
    
    return !!sectionPerms[action];
  };

  const helpers = section ? {
    canView: hasPermission(section, 'view'),
    canAdd: hasPermission(section, 'add'),
    canEdit: hasPermission(section, 'edit'),
    canDelete: hasPermission(section, 'delete'),
    canPrint: hasPermission(section, 'print'),
  } : {};

  return { hasPermission, ...helpers } as any;
}
