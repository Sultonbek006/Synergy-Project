import React from 'react';
import { Company } from '../types';
import { User } from '../services/authService';
import { LayoutDashboard, Users, Settings, LogOut, Activity, UserCircle, Building2 } from 'lucide-react';

interface SidebarProps {
  currentCompany: Company;
  onCompanyChange: (company: Company) => void;
  currentRole: string;
  onRoleChange: (role: string) => void;
  user: User | null;
  onLogout: () => void;
}

import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Sidebar: React.FC<SidebarProps> = ({
  currentCompany,
  onCompanyChange,
  currentRole,
  user,
  onLogout
}) => {
  const { t } = useLanguage();

  // Render Company Badge Style
  const getCompanyColor = (c: Company) => {
    switch (c) {
      case 'Synergy': return 'bg-blue-600';
      case 'Amare': return 'bg-purple-600';
      case 'Galassiya': return 'bg-emerald-600';
      case 'Perfetto': return 'bg-orange-600';
      default: return 'bg-slate-600';
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="w-72 bg-slate-900 text-white min-h-screen flex flex-col fixed left-0 top-0 z-50">
      {/* Brand */}
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
        <div className={`${getCompanyColor(currentCompany)} p-2 rounded-lg transition-colors duration-300`}>
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight block">PharmaRecon</span>
          <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">{currentCompany}</span>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-6 bg-slate-800/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <UserCircle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.email}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>

        {!isAdmin && (
          <div className="mt-4 px-4 py-4 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Active Context</p>
            <div className="mb-3">
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-600">
                {user?.company}
              </span>
            </div>

            <p className="text-xs text-slate-400 uppercase font-bold mb-1">{t('region')}</p>
            <p className="text-sm font-medium text-white mb-3">
              {user?.region || 'All Regions'}
            </p>

            <p className="text-xs text-slate-400 uppercase font-bold mb-1">{t('groupAccess')}</p>
            <p className="text-sm font-medium text-white">
              {user?.group_access || 'All'}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-6">
        {isAdmin ? (
          <>
            <a href="#" className="flex items-center space-x-3 bg-blue-600/90 text-white px-4 py-3 rounded-lg font-medium shadow-sm">
              <LayoutDashboard className="w-5 h-5" />
              <span>{t('adminDashboard')}</span>
            </a>
            <a href="#" className="flex items-center space-x-3 text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-lg font-medium transition-colors">
              <Settings className="w-5 h-5" />
              <span>{t('tabSetup')}</span>
            </a>
          </>
        ) : (
          <>
            <a href="#" className="flex items-center space-x-3 bg-emerald-600/90 text-white px-4 py-3 rounded-lg font-medium shadow-sm">
              <Users className="w-5 h-5" />
              <span>{t('yourTargetList')}</span>
            </a>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-slate-800">

        <div className="mb-4 bg-slate-800 p-2 rounded flex justify-center">
          <LanguageSwitcher />
        </div>

        <button
          onClick={onLogout}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm w-full hover:bg-slate-800 px-3 py-2 rounded-lg"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('logout')}</span>
        </button>
        <p className="text-xs text-slate-600 mt-3 text-center">
          © 2024 Synergy Platform
        </p>
      </div>
    </div>
  );
};
