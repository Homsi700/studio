import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Users, CalendarDays, Briefcase, Settings, Lightbulb, GanttChartSquare } from 'lucide-react';

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
  { href: '/insights', label: 'تحليلات الحضور', icon: Lightbulb, tooltip: 'Insights' },
  { href: '/settings', label: 'الإعدادات', icon: Settings, tooltip: 'Settings' },
];

export interface Employee {
  id: string;
  name: string;
  department: string;
  jobTitle: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  totalDuration: string;
  status: 'onTime' | 'late' | 'earlyLeave' | 'absent';
}

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string; // Kept for easier display, but can be looked up if needed
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveRequestStatus;
}

// Mock data is kept for reference or fallback, but app will primarily use db.json
export const mockEmployees: Employee[] = [
  { id: '1', name: 'أحمد محمود', department: 'التكنولوجيا', jobTitle: 'مهندس برمجيات', email: 'ahmad.m@example.com', phone: '0912345678', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: '2', name: 'فاطمة علي', department: 'الموارد البشرية', jobTitle: 'مسؤول موارد بشرية', email: 'fatima.a@example.com', phone: '0987654321', avatarUrl: 'https://placehold.co/100x100.png' },
  { id: '3', name: 'خالد وليد', department: 'التسويق', jobTitle: 'أخصائي تسويق', email: 'khaled.w@example.com', phone: '0911223344', avatarUrl: 'https://placehold.co/100x100.png' },
];

export const mockAttendance: AttendanceRecord[] = [
  { id: 'att1', employeeId: '1', employeeName: 'أحمد محمود', date: '2024-07-28', clockIn: '09:00', clockOut: '17:00', totalDuration: '8 ساعات', status: 'onTime' },
  { id: 'att2', employeeId: '2', employeeName: 'فاطمة علي', date: '2024-07-28', clockIn: '09:15', clockOut: '17:00', totalDuration: '7 ساعات 45 دقيقة', status: 'late' },
  { id: 'att3', employeeId: '1', employeeName: 'أحمد محمود', date: '2024-07-27', clockIn: '08:55', clockOut: '16:30', totalDuration: '7 ساعات 35 دقيقة', status: 'earlyLeave' },
];

export const mockLeaveRequests: LeaveRequest[] = [
  { id: 'leave1', employeeId: '3', employeeName: 'خالد وليد', startDate: '2024-08-01', endDate: '2024-08-05', reason: 'إجازة سنوية', status: 'pending' },
  { id: 'leave2', employeeId: '1', employeeName: 'أحمد محمود', startDate: '2024-07-29', endDate: '2024-07-29', reason: 'موعد طبي', status: 'approved' },
];
