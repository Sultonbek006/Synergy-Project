export type Company = 'Synergy' | 'Amare' | 'Galassiya' | 'Perfetto';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER_SURX_AB = 'surx_ab',
  MANAGER_SURX_A2C = 'surx_a2c',
  MANAGER_QASH_AB = 'qash_ab',
  MANAGER_QASH_A2C = 'qash_a2c',
}

export interface MasterPlanItem {
  id: string;
  company: Company;        // Multi-company support
  doctorName: string;      // Col A (ФИО)
  region: string;          // Col B (Регион)
  district: string;        // Col C (Район)
  targetAmount: number;    // Col D (Сумм)
  plannedType: string;     // Col E (Форма)
  cardNumber?: string;     // Col F (Номер карты) - Optional
  workplace?: string;      // Col G (Место работы) - Optional
  specialty?: string;      // Col H (Специальность) - Optional
  phone: string;           // Col I (Номер телефо)
  group: string;           // Col J (Групп)
  managerName?: string;    // Col K (МП - Regional Manager) - Optional

  // Tracking Columns
  actualAmount: number;    // Paid by manager
  difference: number;      // target - actual
  paymentMethod?: 'Card/Click' | 'Cash/Paper'; // Added for verification
  proofImage?: string;     // Evidence (Base64)
  proofMimeType?: string;  // e.g. 'image/jpeg', 'application/pdf'
  proofFileName?: string;  // Sanitized filename
  status: string;          // Changed from enum to string to support "✅ Verified" etc.
  managerComment?: string; // Admin notes/comments for manual overrides
  lastUpdated: string;
}

export interface DashboardStats {
  totalDoctors: number;
  totalBudget: number;
  totalPaid: number;
  totalDebt: number; // Added field
  pendingCount: number;
}

export interface ManagerPermission {
  managerId: string;
  allowLate: boolean;
}

// Flexible input for column-mapped rows (A, B, C, D...)
export interface ExcelRowInput {
  [key: string]: any;
}
