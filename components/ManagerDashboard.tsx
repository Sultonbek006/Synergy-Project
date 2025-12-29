import React, { useEffect, useState, useRef } from 'react';
import { StatsCard } from './StatsCard';
import { getManagerDoctors, verifyPayment, DoctorFromAPI } from '../services/dataService';
import { User } from '../services/authService';
import { DollarSign, ListChecks, PieChart, Upload, Search, CheckCircle, AlertTriangle, FileText, Smartphone, Loader2, Calendar } from 'lucide-react';

interface ManagerDashboardProps {
  user: User | null;
}

import { useLanguage } from '../context/LanguageContext';

const formatPaymentType = (type: string) => {
  if (!type) return '-';
  const t = type.toLowerCase();
  if (t.includes('карта') || t.includes('card')) return 'Card';
  if (t.includes('зачёт') || t.includes('cash')) return 'Cash';
  if (t.includes('накопительный') || t.includes('nakop')) return 'Nakop';
  if (t.includes('usd') || t.includes('dollar')) return 'Dollar';
  return type;
};

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user }) => {
  const { t } = useLanguage();

  // -- STATE --
  const [doctors, setDoctors] = useState<DoctorFromAPI[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number>(12); // Default to December

  // Month options for dropdown
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

  // Verification state
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'Cash'>('Card');
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ success: boolean, message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load doctors on mount and when month changes
  useEffect(() => {
    loadDoctors();
  }, [selectedMonth]);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getManagerDoctors(selectedMonth);
      setDoctors(data);
      // Reset selected doctor when month changes
      setSelectedDoctorId(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load doctors');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const stats = {
    myTotalBudget: doctors.reduce((acc, curr) => acc + curr.target_amount, 0),
    myPaid: doctors.reduce((acc, curr) => acc + (curr.amount_paid || 0), 0), // Sum paid amounts from all doctors
    count: doctors.length
  };

  const remainingBudget = stats.myTotalBudget - stats.myPaid;

  const formatCurrency = (amount: number, type?: string) => {
    if (type && (type.toLowerCase().includes('usd') || type.toLowerCase().includes('dollar'))) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(amount);
  };

  const formatSimpleNumber = (amount: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
  };

  // Handle verification
  const handleVerify = async () => {
    if (!selectedDoctorId || !verificationFile) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const result = await verifyPayment(verificationFile, selectedDoctorId, paymentMethod);

      setAnalysisResult({
        success: true,
        message: result.message
      });

      // Reload doctors to get updated status
      await loadDoctors();

      // Reset form
      setSelectedDoctorId(null);
      setVerificationFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      setAnalysisResult({
        success: false,
        message: error.message || 'Verification failed'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRowStyle = (status: string) => {
    if (status.includes('Verified') || status.includes('✅')) return 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-500';
    if (status.includes('Underpaid') || status.includes('⚠️')) return 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500';
    if (status.includes('Overpaid')) return 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-500';
    return 'hover:bg-slate-50 border-l-4 border-l-transparent';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Error Loading Data</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter & Sort
  const filteredDoctors = doctors
    .filter(d => d.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.doctor_name.localeCompare(b.doctor_name));

  const sortedDropdown = [...doctors].sort((a, b) => a.doctor_name.localeCompare(b.doctor_name));

  return (
    <div className="space-y-8 pl-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('managerDashboard')}</h1>
        <p className="text-slate-500">
          {t('loggedInAs')}: <span className="font-semibold text-slate-700">{user?.email}</span>
        </p>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          {t('region')}: {user?.region} | {t('groupAccess')}: {user?.group_access}
        </p>
      </div>

      {/* Month Selector */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Active Month Cycle</h3>
              <p className="text-xs text-slate-500">Select which month you are working on</p>
            </div>
          </div>
          <div className="flex-1 md:max-w-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full rounded-lg border-indigo-300 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium bg-white"
            >
              {monthOptions.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-medium">
            📅 Viewing: <span className="font-bold">{monthOptions.find(m => m.value === selectedMonth)?.label}</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title={t('yourTotalBudget')}
          value={formatCurrency(stats.myTotalBudget)}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          colorClass="bg-emerald-600"
        />
        <StatsCard
          title={t('doctorsInGroup')}
          value={stats.count}
          icon={<ListChecks className="w-6 h-6 text-blue-600" />}
          colorClass="bg-blue-600"
        />
        <StatsCard
          title={t('paidTotalBudget')}
          value={`${formatSimpleNumber(stats.myPaid)} / ${formatSimpleNumber(stats.myTotalBudget)}`}
          icon={<PieChart className="w-6 h-6 text-purple-600" />}
          colorClass="bg-purple-600"
          caption={`${t('remaining')}: ${formatCurrency(remainingBudget)}`}
        />
      </div>

      {/* VERIFICATION SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Search className="w-5 h-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{t('paymentVerification')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('selectDoctor')}</label>
              <select
                className="w-full rounded-lg border-slate-300 border p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={selectedDoctorId || ''}
                onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
              >
                <option value="">{t('chooseDoctor')}</option>
                {sortedDropdown.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.doctor_name} (Target: {formatCurrency(d.target_amount, d.planned_type)}) - {d.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t('paymentMethod')}</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-slate-50 w-full">
                  <input
                    type="radio"
                    name="method"
                    checked={paymentMethod === 'Card'}
                    onChange={() => setPaymentMethod('Card')}
                    className="text-indigo-600"
                  />
                  <Smartphone className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{t('cardClick')}</span>
                </label>
                <label className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-slate-50 w-full">
                  <input
                    type="radio"
                    name="method"
                    checked={paymentMethod === 'Cash'}
                    onChange={() => setPaymentMethod('Cash')}
                    className="text-indigo-600"
                  />
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{t('cashReceipt')}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t('uploadProof')}</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setVerificationFile(e.target.files?.[0] || null)}
                ref={fileInputRef}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <button
              onClick={handleVerify}
              disabled={!selectedDoctorId || !verificationFile || isAnalyzing}
              className={`w-full py-3 rounded-lg font-medium text-white shadow-sm flex items-center justify-center space-x-2
                  ${(!selectedDoctorId || !verificationFile || isAnalyzing) ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('analyzing')}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('verifyPayment')}</span>
                </>
              )}
            </button>
          </div>

          {/* Result Area */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 flex flex-col justify-center items-center text-center">
            {!analysisResult && !isAnalyzing && (
              <div className="text-slate-400">
                <Upload className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a doctor and upload a receipt to start the AI verification process.</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-indigo-600 animate-pulse">
                <Search className="w-12 h-12 mx-auto mb-3" />
                <p className="font-medium">{t('extractingData')}</p>
                <p className="text-xs mt-2 text-slate-500">{t('connectingAI')}</p>
              </div>
            )}

            {analysisResult && (
              <div className={`w-full p-4 rounded-lg border ${analysisResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {analysisResult.success ? <CheckCircle className="w-8 h-8 mx-auto mb-2" /> : <AlertTriangle className="w-8 h-8 mx-auto mb-2" />}
                <p className="font-bold mb-1">{analysisResult.success ? t('success') : 'REJECTED'}</p>
                <p className="text-sm">{analysisResult.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-slate-800">{t('yourTargetList')} ({filteredDoctors.length})</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none w-48"
              />
            </div>
          </div>
          <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
            {t('filter')}: {user?.region} / {user?.group_access}
          </div>
        </div>

        {doctors.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="mb-2">{t('noDoctorsFound')}</p>
            <p className="text-xs text-slate-400">
              {t('expectedExcel')}: Region="{user?.region}", Group="{user?.group_access === 'AB' ? 'A, B' : user?.group_access === 'A2C' ? 'A2, C' : user?.group_access}"
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3">{t('colGroup')}</th>
                  <th className="px-6 py-3">{t('colDistrict')}</th>
                  <th className="px-6 py-3">{t('colDoctor')}</th>
                  <th className="px-6 py-3">{t('colWorkplace')}</th>
                  <th className="px-6 py-3">{t('colSpecialty')}</th>
                  <th className="px-6 py-3 text-mono">{t('colPhone')}</th>
                  <th className="px-6 py-3">{t('colType')}</th>
                  <th className="px-6 py-3 text-right">{t('colTarget')}</th>
                  <th className="px-6 py-3 text-right">{t('colPaid') || 'Paid'}</th>
                  <th className="px-6 py-3 text-center">{t('colStatus')}</th>
                  <th className="px-6 py-3 text-left">{t('colRM')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoctors.map((row) => (
                  <tr key={row.id} className={`${getRowStyle(row.status)} transition-all duration-300`}>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm">
                        {row.group_name}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">{row.district}</td>
                    <td className="px-6 py-3 text-slate-700">{row.doctor_name}</td>
                    <td className="px-6 py-3 text-slate-600 text-xs">{row.workplace || '-'}</td>
                    <td className="px-6 py-3 text-slate-600 text-xs">{row.specialty || '-'}</td>
                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{row.phone}</td>
                    <td className="px-6 py-3 text-slate-600 font-medium whitespace-nowrap text-xs">
                      {formatPaymentType(row.planned_type)}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-emerald-700 font-medium">{formatCurrency(row.target_amount, row.planned_type)}</td>
                    <td className="px-6 py-3 text-right font-mono text-blue-700 font-medium">{formatCurrency(row.amount_paid || 0, row.planned_type)}</td>
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
                    <td className="px-6 py-3 text-left text-xs text-slate-600">{row.manager_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
