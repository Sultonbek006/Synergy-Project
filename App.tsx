import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { AdminDashboard } from './components/AdminDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { LoginPage } from './components/LoginPage';
import { isLoggedIn, getCurrentUser, logout, User } from './services/authService';
import { MasterPlanItem, Company } from './types';

import { LanguageProvider, useLanguage } from './context/LanguageContext';

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company>('Synergy');
  const [isLoading, setIsLoading] = useState(true);
  const [masterPlan, setMasterPlan] = useState<MasterPlanItem[]>([]);
  const { t } = useLanguage();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      if (isLoggedIn()) {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
        if (currentUser?.company) {
          setCurrentCompany(currentUser.company as Company);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsAuthenticated(true);
    if (currentUser?.company) {
      setCurrentCompany(currentUser.company as Company);
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Main application
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        currentCompany={currentCompany}
        onCompanyChange={setCurrentCompany}
        currentRole={user?.role || 'manager'}
        onRoleChange={() => { }}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-72 p-8 transition-all duration-200">
        <div className="max-w-7xl mx-auto">
          {user?.role === 'admin' ? (
            <AdminDashboard
              user={user}
              currentCompany={currentCompany}
            />
          ) : (
            <ManagerDashboard
              user={user}
            />
          )}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;