
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, CalendarDays, Briefcase, Settings, Lightbulb, GanttChartSquare, Fingerprint, Wallet, TrendingUp, Landmark } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltip?: string;
}

export const navItems: NavItem[] = [
  { href: '/', label: 'لوحة القيادة', icon: LayoutDashboard, tooltip: 'Dashboard' },
  { href: '/employees', label: 'إدارة الموظفين', icon: Users, tooltip: 'Employees' },
  { href: '/attendance', label: 'سجلات الحضور', icon: CalendarDays, tooltip: 'Attendance' },
  { href: '/leaves', label: 'إدارة الإجازات', icon: Briefcase, tooltip: 'Leaves' },
  { href: '/shifts', label: 'إدارة الورديات', icon: GanttChartSquare, tooltip: 'Shifts' },
  { href: '/payroll', label: 'إدارة الرواتب', icon: Wallet, tooltip: 'Payroll' },
  { href: '/reports', label: 'التقارير', icon: TrendingUp, tooltip: 'Reports' },
  { href: '/insights', label: 'تحليلات الحضور', icon: Lightbulb, tooltip: 'Insights' },
  { href: '/checkin-checkout', label: 'تسجيل الدخول/الخروج', icon: Fingerprint, tooltip: 'Check-in/Out' },
  { href: '/settings', label: 'الإعدادات', icon: Settings, tooltip: 'Settings' },
];

export type Currency = 'SYP' | 'USD';
export const CURRENCIES: Currency[] = ['SYP', 'USD'];

export interface ExchangeRate {
  id: string;
  date: string; // YYYY-MM-DD
  rate: number; // Represents 1 USD to SYP value, e.g., 14500
}

export interface Allowance {
  id: string;
  name: string;
  amount: number; // Amount in the employee's base currency
}

export interface Deduction {
  id: string;
  name: string;
  amount: number; // Amount in the employee's base currency
}

export interface PayrollSettings {
  baseSalary?: number;
  currency?: Currency;
  allowances?: Allowance[];
  deductions?: Deduction[];
}

export interface PayrollRecord {
  id: string;
  employeeId: string; // Added for easier lookup if needed
  month: number; // 1-12
  year: number;
  
  baseSalarySnapshot: number; // Snapshot of base salary at time of calculation
  baseSalaryCurrency: Currency; // Employee's base currency

  grossSalary: number; // Calculated gross salary in base currency
  totalAllowances: number; // In base currency
  totalDeductions: number; // Includes fixed deductions and situational (lates/absences), in base currency
  netSalaryInBaseCurrency: number;
  
  exchangeRateApplied?: number; // e.g., USD_to_SYP rate used
  convertedToCurrency?: Currency; // The currency it was converted to (opposite of base)
  netSalaryInConvertedCurrency?: number;

  calculationDate: string; // ISO date string
  attendanceSummary: {
    totalWorkingHours?: number; 
    totalLateMinutes?: number;
    totalAbsentDays?: number;
    daysInMonth?: number;
    workingDaysInMonth?: number; 
    actualWorkedDays?: number;
  };
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  jobTitle: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  hashedPin?: string;
  payrollSettings?: PayrollSettings; // Consolidated payroll info
  payrollHistory?: PayrollRecord[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // HH:MM
  clockOut: string | null; // HH:MM or null if still clocked in
  totalDuration: string | null; // "X hours Y minutes" or null
  status: 'onTime' | 'late' | 'earlyLeave' | 'absent' | 'onDuty';
  method?: 'PIN' | 'Fingerprint' | 'Manual'; 
  deviceId?: string; 
}

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveRequestStatus;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
}

export interface RawAttendanceEvent {
  id: string;
  employeeId: string;
  timestamp: string; 
  type: 'clockIn' | 'clockOut' | 'unknown'; 
  method: 'Fingerprint' | 'OtherExternal' | 'PIN'; 
  deviceId?: string; 
}

export interface ExternalAttendanceData {
  employeeId: string;
  timestamp: string; 
  eventType: 'clockIn' | 'clockOut' | 'unknown';
  deviceSecret: string;
  deviceId?: string;
}

// Mock data - ensure payroll fields are optional or have defaults
export const mockEmployees: Employee[] = [
  { 
    id: '1', name: 'أحمد محمود', department: 'التكنولوجيا', jobTitle: 'مهندس برمجيات', email: 'ahmad.m@example.com', phone: '0912345678', avatarUrl: 'https://placehold.co/100x100.png',
    payrollSettings: { baseSalary: 750000, currency: 'SYP', allowances: [{id: 'alw1', name: 'بدل سكن', amount:100000}], deductions: [] },
    payrollHistory: []
  },
  { 
    id: '2', name: 'فاطمة علي', department: 'الموارد البشرية', jobTitle: 'مسؤول موارد بشرية', email: 'fatima.a@example.com', phone: '0987654321', avatarUrl: 'https://placehold.co/100x100.png',
    payrollSettings: { baseSalary: 500, currency: 'USD', allowances: [], deductions: [] },
    payrollHistory: []
  },
  { 
    id: '3', name: 'خالد وليد', department: 'التسويق', jobTitle: 'أخصائي تسويق', email: 'khaled.w@example.com', phone: '0911223344', avatarUrl: 'https://placehold.co/100x100.png',
    payrollSettings: { baseSalary: 0, currency: 'SYP' },
    payrollHistory: []
  },
];

export const mockAttendance: AttendanceRecord[] = [
  { id: 'att1', employeeId: '1', employeeName: 'أحمد محمود', date: '2024-07-28', clockIn: '09:00', clockOut: '17:00', totalDuration: '8 ساعات', status: 'onTime', method: 'PIN' },
  { id: 'att2', employeeId: '2', employeeName: 'فاطمة علي', date: '2024-07-28', clockIn: '09:15', clockOut: '17:00', totalDuration: '7 ساعات 45 دقيقة', status: 'late', method: 'PIN' },
  { id: 'att3', employeeId: '1', employeeName: 'أحمد محمود', date: '2024-07-27', clockIn: '08:55', clockOut: '16:30', totalDuration: '7 ساعات 35 دقيقة', status: 'earlyLeave', method: 'PIN' },
];

export const mockLeaveRequests: LeaveRequest[] = [
  { id: 'leave1', employeeId: '3', employeeName: 'خالد وليد', startDate: '2024-08-01', endDate: '2024-08-05', reason: 'إجازة سنوية', status: 'pending' },
  { id: 'leave2', employeeId: '1', employeeName: 'أحمد محمود', startDate: '2024-07-29', endDate: '2024-07-29', reason: 'موعد طبي', status: 'approved' },
];

export const mockRawAttendanceEvents: RawAttendanceEvent[] = []; 
export const mockExchangeRates: ExchangeRate[] = [
  { id: 'rate1', date: '2024-01-01', rate: 13000 },
  { id: 'rate2', date: '2024-07-01', rate: 14500 },
];
