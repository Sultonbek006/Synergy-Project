/**
 * Data Service
 * Handles all data operations with the Backend API
 */

import { apiGet, apiPostFormData, API_BASE_URL, getStaticUrl } from './api';
import { MasterPlanItem, DashboardStats, ManagerPermission } from '../types';

// ==================== LOCAL STORAGE KEYS ====================
const STORAGE_KEY = 'pharma_master_plan_v3';
const PERMISSIONS_KEY = 'pharma_permissions_v1';

// ==================== TYPES ====================

export interface DoctorFromAPI {
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
  proof_image?: string;  // Path to proof image (if verified)
  amount_paid?: number;  // Amount paid (for stats calculation)
}

export interface VerifyResult {
  success: boolean;
  message: string;
  extracted_amount: number;
  new_status: string;
}

export interface AdminStats {
  total_doctors: number;
  total_budget: number;
  total_paid: number;
  total_debt: number;
  pending_count: number;
  verified_count: number;
}

// ==================== LEGACY FUNCTIONS (For AdminDashboard compatibility) ====================

export const getMasterPlan = (): MasterPlanItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error("Error loading master plan:", error);
    return [];
  }
};

export const saveMasterPlan = (data: MasterPlanItem[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const updateMasterPlanItem = (updatedItem: MasterPlanItem): MasterPlanItem[] => {
  const currentData = getMasterPlan();
  const newData = currentData.map(item => item.id === updatedItem.id ? updatedItem : item);
  saveMasterPlan(newData);
  return newData;
};

export const getManagerPermissions = (): ManagerPermission[] => {
  try {
    const stored = localStorage.getItem(PERMISSIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error("Error loading permissions:", error);
    return [];
  }
};

export const saveManagerPermissions = (permissions: ManagerPermission[]): void => {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
};

// Legacy Excel processing (for AdminDashboard)
export const processExcelFile = async (file: File, company?: string): Promise<MasterPlanItem[]> => {
  // This is now handled by the backend, but keeping for compatibility
  // We'll call the backend API
  try {
    const result = await uploadMasterPlan(file, company || 'Synergy', 12);
    if (result.success) {
      // Return empty array, data is in DB now
      return [];
    }
    throw new Error('Upload failed');
  } catch (e) {
    throw e;
  }
};

export const calculateStats = (data: MasterPlanItem[] | DoctorFromAPI[]): DashboardStats => {
  if (data.length === 0) {
    return {
      totalDoctors: 0,
      totalBudget: 0,
      totalPaid: 0,
      totalDebt: 0,
      pendingCount: 0,
    };
  }

  // Check if it's MasterPlanItem or DoctorFromAPI
  const firstItem = data[0];
  if ('targetAmount' in firstItem) {
    // MasterPlanItem
    const items = data as MasterPlanItem[];
    return {
      totalDoctors: items.length,
      totalBudget: items.reduce((sum, item) => sum + item.targetAmount, 0),
      totalPaid: items.reduce((sum, item) => sum + item.actualAmount, 0),
      totalDebt: items.reduce((sum, item) => sum + (item.difference > 0 ? item.difference : 0), 0),
      pendingCount: items.filter(i => i.status === 'Pending').length
    };
  } else {
    // DoctorFromAPI
    const items = data as DoctorFromAPI[];
    return {
      totalDoctors: items.length,
      totalBudget: items.reduce((sum, d) => sum + d.target_amount, 0),
      totalPaid: items.reduce((sum, d) => sum + (d.amount_paid || 0), 0),
      totalDebt: items.reduce((sum, d) => sum + (d.target_amount - (d.amount_paid || 0)), 0),
      pendingCount: items.filter(d => d.status === 'Pending').length,
    };
  }
};

// ==================== MANAGER API FUNCTIONS ====================

/**
 * Get doctors for current manager
 * Backend already filters by company, region, and group access
 * @param month - Optional month filter (1-12)
 */
export const getManagerDoctors = async (month?: number): Promise<DoctorFromAPI[]> => {
  let endpoint = '/manager/doctors';
  if (month) {
    endpoint += `?month=${month}`;
  }
  return apiGet<DoctorFromAPI[]>(endpoint);
};

/**
 * Verify a payment using AI
 * @param file - The proof image/PDF
 * @param planId - The master plan item ID
 * @param paymentMethod - 'Card' or 'Cash'
 */
export const verifyPayment = async (
  file: File,
  planId: number,
  paymentMethod: string
): Promise<VerifyResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('plan_id', planId.toString());
  formData.append('payment_method', paymentMethod);

  return apiPostFormData<VerifyResult>('/manager/verify', formData);
};

// ==================== ADMIN API FUNCTIONS ====================

/**
 * Get admin statistics
 * @param company - Optional company filter
 * @param region - Optional region filter
 */
export const getAdminStats = async (
  company?: string,
  region?: string
): Promise<AdminStats> => {
  let endpoint = '/admin/stats';
  const params = new URLSearchParams();

  if (company) params.append('company', company);
  if (region) params.append('region', region);

  const queryString = params.toString();
  if (queryString) {
    endpoint += `?${queryString}`;
  }

  return apiGet<AdminStats>(endpoint);
};

/**
 * Upload Excel file to populate master plan
 * @param file - Excel file
 * @param companyName - Company name
 * @param month - Month number (1-12)
 */
export const uploadMasterPlan = async (
  file: File,
  companyName: string,
  month: number = 12
): Promise<{ success: boolean; inserted_count: number; errors: string[] }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('company_name', companyName);
  formData.append('month', month.toString());

  return apiPostFormData('/admin/upload-plan', formData);
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (): Promise<any[]> => {
  return apiGet('/admin/users');
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Convert API doctor to frontend format
 */
export const mapDoctorToFrontend = (doc: DoctorFromAPI) => ({
  id: doc.id.toString(),
  company: doc.company,
  doctorName: doc.doctor_name,
  region: doc.region,
  district: doc.district,
  targetAmount: doc.target_amount,
  plannedType: doc.planned_type,
  cardNumber: doc.card_number,
  workplace: doc.workplace,
  specialty: doc.specialty,
  phone: doc.phone,
  group: doc.group_name,
  managerName: doc.manager_name,
  actualAmount: 0,
  difference: doc.target_amount,
  status: doc.status,
  lastUpdated: new Date().toISOString(),
});

/**
 * Get proof image URL
 */
export const getProofImageUrl = (path: string): string => {
  return getStaticUrl(path);
};

// Re-export API_BASE_URL for components that need it
export { API_BASE_URL, getStaticUrl };
