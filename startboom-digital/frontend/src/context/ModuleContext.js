import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { departmentApi } from '../services/enterpriseApi';

const ModuleContext = createContext();

export const useModules = () => {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModules must be used within ModuleProvider');
  }
  return context;
};

export const ModuleProvider = ({ children }) => {
  const { user } = useAuth();
  const [enabledModules, setEnabledModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDepartment, setUserDepartment] = useState(null);

  useEffect(() => {
    loadUserModules();
  }, [user]);

  const loadUserModules = async () => {
    try {
      setLoading(true);

      // If user is superadmin or doesn't have department, enable all modules
      if (!user || user.role === 'superadmin' || !user.department) {
        setEnabledModules(['all']); // 'all' means no filtering
        setLoading(false);
        return;
      }

      // If user is admin/manager, enable all modules
      if (user.role === 'admin' || user.role === 'manager') {
        setEnabledModules(['all']);
        setLoading(false);
        return;
      }

      // For regular employees, check department modules
      const deptId = user.department?._id || user.department;
      
      if (deptId) {
        const deptRes = await departmentApi.getById(deptId);
        const dept = deptRes.data.department || deptRes.data;
        
        setUserDepartment(dept);
        setEnabledModules(dept.modules || []);
      } else {
        // No department, show basic modules
        setEnabledModules(['clients', 'deals', 'schedules', 'tasks']);
      }
    } catch (error) {
      console.error('Failed to load modules:', error);
      // On error, show basic modules
      setEnabledModules(['clients', 'deals', 'schedules', 'tasks']);
    } finally {
      setLoading(false);
    }
  };

  const hasModule = (moduleName) => {
    // Admin/superadmin have access to everything
    if (enabledModules.includes('all')) return true;
    
    // Check if module is in enabled list
    return enabledModules.includes(moduleName);
  };

  const hasAnyModule = (moduleNames) => {
    if (enabledModules.includes('all')) return true;
    return moduleNames.some(name => enabledModules.includes(name));
  };

  const value = {
    enabledModules,
    loading,
    hasModule,
    hasAnyModule,
    userDepartment,
    isUnrestricted: enabledModules.includes('all')
  };

  return (
    <ModuleContext.Provider value={value}>
      {children}
    </ModuleContext.Provider>
  );
};

export default ModuleContext;
