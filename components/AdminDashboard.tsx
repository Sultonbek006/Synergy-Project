import React, { useState, useRef, useEffect } from 'react';
import { StatsCard } from './StatsCard';
import { User } from '../services/authService';
import { Company } from '../types';
import { apiGet, apiPostFormData, apiPutFormData, apiPost, getStaticUrl } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import {
  DollarSign, AlertCircle, CheckCircle2, FileSpreadsheet, LayoutDashboard,
  Calendar, Loader2, Users, Eye, PenTool, Save, RotateCcw
} from 'lucide-react';

interface AdminDashboardProps {
  user: User | null;
  currentCompany: Company;
}

type Tab = 'dashboard' | 'live' | 'correction' | 'setup' | 'audit';

interface LeaderboardItem {
  region: string;
  group_name: string;
  target: number;
  paid: number;
  debt: number;
}

interface DoctorData {
  id: number;
  company: string;
  region: string;
  district: string;
  group_name: string;
  manager_name: string;
  doctor_name: string;
  specialty: string;
  workplace: string;
  phone: string;
  card_number: string;
  target_amount: number;
  planned_type: string;
  month: number;
  status: string;
  proof_image?: string;
  amount_paid?: number;
}

interface AdminStats {
  total_doctors: number;
  total_budget: number;
  total_paid: number;
  total_debt: number;
  pending_count: number;
  verified_count: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, currentCompany }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('setup');

  // Setup Tab State
  const [selectedCompany, setSelectedCompany] = useState<Company>('Synergy');
  const [selectedMonth, setSelectedMonth] = useState<number>(12); // Default to December
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Month options for dropdowns
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Dashboard Tab State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Live View Tab State
  const [liveRegion, setLiveRegion] = useState('');
  const [liveGroup, setLiveGroup] = useState('');
  const [liveData, setLiveData] = useState<DoctorData[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);

  // Correction Tab State
  const [correctionRegion, setCorrectionRegion] = useState('');
  const [correctionGroup, setCorrectionGroup] = useState('');
  const [correctionData, setCorrectionData] = useState<DoctorData[]>([]);
  const [correctionLoading, setCorrectionLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);

  // Audit Tab State
  const [auditRegion, setAuditRegion] = useState('');
  const [auditGroup, setAuditGroup] = useState('');
  const [auditDoctorId, setAuditDoctorId] = useState<number | null>(null);
  const [auditDoctors, setAuditDoctors] = useState<DoctorData[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Load Dashboard Data
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [activeTab, selectedCompany, selectedMonth]);

  // Load Live View Data
  useEffect(() => {
    if (activeTab === 'live' && liveRegion && liveGroup) {
      loadLiveData();
    }
  }, [liveRegion, liveGroup]);

  // Load Correction Data
  useEffect(() => {
    if (activeTab === 'correction' && correctionRegion) {
      loadCorrectionData();
    }
  }, [correctionRegion, correctionGroup]);

  // Load Audit Doctors
  useEffect(() => {
    if (activeTab === 'audit' && auditRegion && auditGroup) {
      loadAuditDoctors();
    } else {
      setAuditDoctors([]);
    }
  }, [auditRegion, auditGroup]);

  // Load regions and groups for filters
  useEffect(() => {
    loadFilters();
  }, [selectedCompany, selectedMonth]);

  const loadFilters = async () => {
    try {
      const data = await apiGet<DoctorData[]>(`/admin/data?company=${selectedCompany}&month=${selectedMonth}`);
      const uniqueRegions = Array.from(new Set(data.map(d => d.region))).sort();
      const uniqueGroups = Array.from(new Set(data.map(d => d.group_name))).sort();
      setRegions(uniqueRegions);
      setGroups(uniqueGroups);
    } catch (err) {
      console.error('Failed to load filters:', err);
    }
  };

  const loadDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const [statsData, leaderboardData] = await Promise.all([
        apiGet<AdminStats>(`/admin/stats?company=${selectedCompany}&month=${selectedMonth}`),
        apiGet<LeaderboardItem[]>(`/admin/leaderboard?company=${selectedCompany}&month=${selectedMonth}`)
      ]);
      setStats(statsData);
      setLeaderboard(leaderboardData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadLiveData = async () => {
    setLiveLoading(true);
    try {
      const data = await apiGet<DoctorData[]>(
        `/admin/data?company=${selectedCompany}&region=${liveRegion}&group=${liveGroup}&month=${selectedMonth}`
      );
      setLiveData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load live data');
    } finally {
      setLiveLoading(false);
    }
  };

  const loadCorrectionData = async () => {
    setCorrectionLoading(true);
    try {
      let url = `/admin/data?company=${selectedCompany}&region=${correctionRegion}&month=${selectedMonth}`;
      if (correctionGroup) url += `&group=${correctionGroup}`;
      const data = await apiGet<DoctorData[]>(url);
      setCorrectionData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load correction data');
    } finally {
      setCorrectionLoading(false);
    }
  };

  const loadAuditDoctors = async () => {
    setAuditLoading(true);
    try {
      const data = await apiGet<DoctorData[]>(
        `/admin/data?company=${selectedCompany}&region=${auditRegion}&group=${auditGroup}&month=${selectedMonth}`
      );
      setAuditDoctors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit doctors');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('company_name', selectedCompany);
      formData.append('month', selectedMonth.toString());

      const result = await apiPostFormData<{
        success: boolean;
        message: string;
        inserted_count: number;
        errors: string[];
      }>('/admin/upload-plan', formData);

      setSuccessMsg(`✅ ${result.message}`);

      if (result.errors && result.errors.length > 0) {
        setError(`Warnings: ${result.errors.slice(0, 3).join(', ')}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process file');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdatePayment = async (planId: number) => {
    if (!editAmount || !editStatus) return;

    try {
      const formData = new FormData();
      // Remove commas if any, though type="number" shouldn't have them
      const cleanAmount = editAmount.toString().replace(/,/g, '');
      formData.append('amount_paid', String(parseInt(cleanAmount, 10) || 0));
      formData.append('status', editStatus);
      formData.append('admin_comment', 'Admin manual correction');
      if (editFile) {
        formData.append('file', editFile);
      }

      await apiPutFormData(`/admin/update-payment/${planId}`, formData);

      setSuccessMsg('✅ Payment updated successfully');
      setEditingId(null);
      loadCorrectionData();
    } catch (err: any) {
      setError(err.message || 'Failed to update payment');
    }
  };

  const formatCurrency = (amount: number, type?: string) => {
    if (type && (type.toLowerCase().includes('usd') || type.toLowerCase().includes('dollar'))) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(amount);
  };

  const formatSimpleNumber = (amount: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-8 pl-8 pb-12">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t('adminCommandCenter')}</h1>
          <p className="text-slate-500 mt-1">{t('monitorPerformance')}</p>
        </div>

        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{t('tabDashboard')}</span>
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'live' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Eye className="w-4 h-4" />
            <span>{t('tabLiveView')}</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'audit' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t('tabAudit')}</span>
          </button>
          <button
            onClick={() => setActiveTab('correction')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'correction' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <PenTool className="w-4 h-4" />
            <span>{t('tabCorrection')}</span>
          </button>
          <button
            onClick={() => setActiveTab('setup')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'setup' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Calendar className="w-4 h-4" />
            <span>{t('tabSetup')}</span>
          </button>
        </div>
      </div>

      {/* Global Filters (Company + Month) */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Global Company Filter
              </span>
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value as Company)}
              className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            >
              <option value="Synergy">Synergy</option>
              <option value="Amare">Amare</option>
              <option value="Galassiya">Galassiya</option>
              <option value="Perfetto">Perfetto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Active Month Cycle
              </span>
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full rounded-lg border-indigo-300 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium bg-indigo-50"
            >
              {monthOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {dashboardLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatsCard
                  title={t('totalTarget')}
                  value={formatCurrency(stats.total_budget)}
                  icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                  colorClass="bg-emerald-600"
                />
                <StatsCard
                  title={t('totalCollected')}
                  value={formatCurrency(stats.total_paid)}
                  icon={<CheckCircle2 className="w-6 h-6 text-blue-600" />}
                  colorClass="bg-blue-600"
                />
                <StatsCard
                  title={t('outstandingDebt')}
                  value={formatCurrency(stats.total_debt)}
                  icon={<AlertCircle className="w-6 h-6 text-red-600" />}
                  colorClass="bg-red-600"
                />
                <StatsCard
                  title={t('completion')}
                  value={`${stats.total_budget > 0 ? ((stats.total_paid / stats.total_budget) * 100).toFixed(1) : 0}%`}
                  icon={<Users className="w-6 h-6 text-purple-600" />}
                  colorClass="bg-purple-600"
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-slate-500" />
                    {t('managerPerformanceLeaderboard')}
                  </h3>
                  <span className="text-xs text-slate-500">{t('sortedByDebt')}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">{t('region')}</th>
                        <th className="px-6 py-3">{t('colGroup')}</th>
                        <th className="px-6 py-3 text-right">{t('totalTarget')}</th>
                        <th className="px-6 py-3 text-right">{t('totalCollected')}</th>
                        <th className="px-6 py-3 text-right">{t('outstandingDebt')}</th>
                        <th className="px-6 py-3 text-right">{t('completion')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leaderboard.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-900">{row.region}</td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                              {row.group_name}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-slate-600">{formatCurrency(row.target)}</td>
                          <td className="px-6 py-3 text-right font-mono text-emerald-600">{formatCurrency(row.paid)}</td>
                          <td className={`px-6 py-3 text-right font-mono font-bold ${row.debt > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                            {formatCurrency(row.debt)}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="w-24 ml-auto bg-slate-100 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${row.debt > 0 ? 'bg-blue-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min((row.paid / row.target) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 mt-1 block">{((row.paid / row.target) * 100).toFixed(0)}%</span>
                          </td>
                        </tr>
                      ))}
                      {leaderboard.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-8 text-slate-400">No data available.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <p className="text-slate-500">Select a company to view dashboard metrics</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE VIEW */}
      {activeTab === 'live' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2 text-indigo-600" />
              {t('liveManagerView')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('selectRegion')}</label>
                <select
                  className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={liveRegion}
                  onChange={(e) => setLiveRegion(e.target.value)}
                >
                  <option value="">-- {t('selectRegion')} --</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('selectGroup')}</label>
                <select
                  className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={liveGroup}
                  onChange={(e) => setLiveGroup(e.target.value)}
                >
                  <option value="">-- {t('selectGroup')} --</option>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {liveLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : liveData.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-6 py-3">{t('colGroup')}</th>
                        <th className="px-6 py-3">{t('colDistrict')}</th>
                        <th className="px-6 py-3">{t('colDoctor')}</th>
                        <th className="px-6 py-3">{t('colWorkplace')}</th>
                        <th className="px-6 py-3">{t('colSpecialty')}</th>
                        <th className="px-6 py-3">{t('colRM')}</th>
                        <th className="px-6 py-3 text-right">{t('colTarget')}</th>
                        <th className="px-6 py-3 text-center">{t('colStatus')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {liveData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/50 text-slate-800 border border-slate-200">
                              {row.group_name}
                            </span>
                          </td>
                          <td className="px-6 py-3 font-medium text-slate-900">{row.district}</td>
                          <td className="px-6 py-3 text-slate-700">{row.doctor_name}</td>
                          <td className="px-6 py-3 text-slate-600 text-xs">{row.workplace || '-'}</td>
                          <td className="px-6 py-3 text-slate-600 text-xs">{row.specialty || '-'}</td>
                          <td className="px-6 py-3 text-slate-600 text-xs">{row.manager_name || '-'}</td>
                          <td className="px-6 py-3 text-right font-mono text-emerald-700 font-medium">{formatCurrency(row.target_amount)}</td>
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm
                              ${row.status.includes('Verified') || row.status.includes('✅') ? 'bg-white text-green-700 border-green-200' :
                                row.status.includes('Underpaid') || row.status.includes('⚠️') ? 'bg-white text-red-700 border-red-200' :
                                  row.status.includes('Overpaid') ? 'bg-white text-orange-700 border-orange-200' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <p className="text-slate-400 mb-2">Select a Region and Group to view live data.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: AUDIT */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-indigo-600" />
              {t('tabAudit')}
            </h3>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('selectRegion')}</label>
                <select
                  className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={auditRegion}
                  onChange={(e) => { setAuditRegion(e.target.value); setAuditDoctorId(null); }}
                >
                  <option value="">-- {t('selectRegion')} --</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('selectGroup')}</label>
                <select
                  className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={auditGroup}
                  onChange={(e) => { setAuditGroup(e.target.value); setAuditDoctorId(null); }}
                  disabled={!auditRegion}
                >
                  <option value="">-- {t('selectGroup')} --</option>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('selectDoctor')}</label>
                <select
                  className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={auditDoctorId || ''}
                  onChange={(e) => setAuditDoctorId(Number(e.target.value))}
                  disabled={!auditGroup || auditLoading}
                >
                  <option value="">-- {t('selectDoctor')} --</option>
                  {auditDoctors.map(d => (
                    <option key={d.id} value={d.id}>{d.doctor_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Evidence View */}
            {auditDoctorId ? (
              (() => {
                const doctor = auditDoctors.find(d => d.id === auditDoctorId);
                if (!doctor) return null;
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom duration-500">
                    {/* Info Card */}
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-lg text-slate-900 mb-4">{doctor.doctor_name}</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">{t('colTarget')}</span>
                            <span className="font-mono font-medium text-slate-900">{formatCurrency(doctor.target_amount)}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-2">
                            <span className="text-slate-500">{t('colPaid')}</span>
                            <span className="font-mono font-medium text-emerald-600">{formatCurrency(doctor.amount_paid || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-slate-500">{t('colStatus')}</span>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm
                                  ${doctor.status.includes('Verified') ? 'bg-green-50 text-green-700 border-green-200' :
                                doctor.status.includes('Underpaid') ? 'bg-red-50 text-red-700 border-red-200' :
                                  'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                              {doctor.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                        <p className="font-semibold mb-1">Audit Note:</p>
                        <p>Verify that the receipt matches the doctor and target amount.</p>
                      </div>
                    </div>

                    {/* Image Card */}
                    <div className="flex flex-col h-full">
                      <h4 className="font-semibold text-slate-700 mb-2">{t('evidenceImage')}</h4>
                      <div className="flex-1 bg-slate-900 rounded-xl overflow-hidden border border-slate-300 flex items-center justify-center min-h-[400px] relative group">
                        {doctor.proof_image ? (
                          <>
                            <img
                              src={getStaticUrl(doctor.proof_image)}
                              alt="Proof"
                              className="max-w-full max-h-[600px] object-contain"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <span className="text-white font-medium bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                                {t('viewEvidence')}
                              </span>
                            </div>
                            <a
                              href={getStaticUrl(doctor.proof_image)}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 z-10"
                            />
                          </>
                        ) : (
                          <div className="text-center p-8">
                            <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                            <p className="text-slate-400 font-medium">{t('noEvidence')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400">{t('selectDoctor')} {t('viewEvidence')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CORRECTION */}
      {activeTab === 'correction' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <PenTool className="w-5 h-5 mr-2 text-indigo-600" />
              {t('correctData')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('selectRegion')}</label>
                <select
                  className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={correctionRegion}
                  onChange={(e) => setCorrectionRegion(e.target.value)}
                >
                  <option value="">-- {t('selectRegion')} --</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('selectGroup')}</label>
                <select
                  className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={correctionGroup}
                  onChange={(e) => setCorrectionGroup(e.target.value)}
                  disabled={!correctionRegion}
                >
                  <option value="">-- {t('selectGroup')} --</option>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            {correctionLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : correctionData.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-6 py-3">{t('colDoctor')}</th>
                        <th className="px-6 py-3 text-right">{t('colTarget')}</th>
                        <th className="px-6 py-3 text-right">{t('colPaid')}</th>
                        <th className="px-6 py-3">{t('colStatus')}</th>
                        <th className="px-6 py-3 text-center">{t('colActions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {correctionData.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 text-slate-700 font-medium">{row.doctor_name}</td>
                          <td className="px-6 py-3 text-right font-mono text-emerald-700">{formatCurrency(row.target_amount, row.planned_type)}</td>
                          <td className="px-6 py-3 text-right">
                            {editingId === row.id ? (
                              <input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="w-32 px-2 py-1 border border-slate-300 rounded text-sm"
                                placeholder="Amount"
                              />
                            ) : (
                              <span className="font-mono text-slate-600">{formatCurrency(row.amount_paid || 0, row.planned_type)}</span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            {editingId === row.id ? (
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="w-40 px-2 py-1 border border-slate-300 rounded text-sm"
                              >
                                <option value="">Select Status</option>
                                <option value="✅ Verified">✅ Verified</option>
                                <option value="⚠️ Underpaid">⚠️ Underpaid</option>
                                <option value="⚠️ Overpaid">⚠️ Overpaid</option>
                                <option value="Pending">Pending</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm
                                ${row.status.includes('Verified') ? 'bg-white text-green-700 border-green-200' :
                                  row.status.includes('Underpaid') ? 'bg-white text-red-700 border-red-200' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                {row.status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-center">
                            {editingId === row.id ? (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleUpdatePayment(row.id)}
                                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                  >
                                    <Save className="w-3 h-3" />
                                    {t('saveChanges')}
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="flex items-center gap-1 px-3 py-1 bg-slate-600 text-white rounded text-xs hover:bg-slate-700"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    Cancel
                                  </button>
                                </div>
                                <div className="text-xs">
                                  <label className="flex items-center justify-center gap-1 cursor-pointer text-blue-600 hover:text-blue-800">
                                    <PenTool className="w-3 h-3" />
                                    <span>{editFile ? editFile.name.slice(0, 10) + '...' : t('uploadProofAction') || 'Upload'}</span>
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept="image/*,.pdf"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setEditFile(file);
                                        if (file) setEditStatus('✅ Verified');
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingId(row.id);
                                  setEditAmount(row.amount_paid ? String(row.amount_paid) : '');
                                  setEditStatus(row.status);
                                  setEditFile(null);
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                <p className="text-slate-400 mb-2">Select a Region to view correction data.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SETUP */}
      {activeTab === 'setup' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{t('monthlyInitialization')}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Upload Master Plan Excel (12-Column)</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {t('selectTargetCompany')}
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value as Company)}
                    className="w-full rounded-lg border-slate-300 border p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  >
                    <option value="Synergy">Synergy</option>
                    <option value="Amare">Amare</option>
                    <option value="Galassiya">Galassiya</option>
                    <option value="Perfetto">Perfetto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      Target Month for Upload
                    </span>
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full rounded-lg border-indigo-300 border p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium bg-indigo-50"
                  >
                    {monthOptions.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-indigo-500 mt-1 font-medium">
                    ⚠️ All uploaded data will be tagged for {monthOptions.find(m => m.value === selectedMonth)?.label}
                  </p>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm text-indigo-800 font-medium">
                  📅 Currently uploading for: <span className="font-bold">{monthOptions.find(m => m.value === selectedMonth)?.label} {new Date().getFullYear()}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {t('uploadMasterPlanLabel')}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="block w-full max-w-md text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {loading && (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {t('simplifiedFormat')}
                </p>
              </div>

              {/* Messages */}
              {successMsg && (
                <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">{successMsg}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">{t('error')}</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  {t('howItWorks')}
                </h4>
                <ol className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start">
                    <span className="font-bold text-blue-600 mr-2">1.</span>
                    <span>{t('step1')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-blue-600 mr-2">2.</span>
                    <span>{t('step2')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-blue-600 mr-2">3.</span>
                    <span dangerouslySetInnerHTML={{ __html: t('step3') }} />
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold text-blue-600 mr-2">4.</span>
                    <span>{t('step4')}</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
