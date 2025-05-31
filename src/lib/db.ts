
import { JSONFilePreset } from 'lowdb/node';
import type { Employee, AttendanceRecord, LeaveRequest, Shift, PayrollRecord, Allowance, Deduction } from './constants'; // Added PayrollRecord, Allowance, Deduction
import { mockEmployees, mockAttendance, mockLeaveRequests } from './constants';

const initialShifts: Shift[] = [
  { id: '1', name: 'الوردية الصباحية', startTime: '09:00', endTime: '17:00', gracePeriodMinutes: 15 },
  { id: '2', name: 'الوردية المسائية', startTime: '17:00', endTime: '01:00', gracePeriodMinutes: 15 },
];

interface Data {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  shifts: Shift[];
  // payrollRecords are stored within each employee's payrollHistory
}

const defaultData: Data = {
  employees: mockEmployees.map(emp => ({ // Ensure mock employees have new payroll fields
    ...emp,
    baseSalary: emp.baseSalary || 0,
    allowances: emp.allowances || [],
    deductions: emp.deductions || [],
    payrollHistory: emp.payrollHistory || [],
  })),
  attendanceRecords: mockAttendance,
  leaveRequests: mockLeaveRequests,
  shifts: initialShifts,
};

let dbInstance: any;

export async function getDb() {
  if (!dbInstance) {
    const db = await JSONFilePreset<Data>('src/lib/db.json', defaultData);
    await db.read();

    let needsWrite = false;

    if (!db.data) {
      db.data = { ...defaultData };
      needsWrite = true;
    }

    if (!db.data.employees || db.data.employees.length === 0) {
      db.data.employees = defaultData.employees;
      needsWrite = true;
    } else {
      // Ensure existing employees have the new payroll fields
      db.data.employees = db.data.employees.map(emp => ({
        ...emp,
        baseSalary: emp.baseSalary === undefined ? 0 : emp.baseSalary, // default to 0 if undefined
        allowances: emp.allowances || [],
        deductions: emp.deductions || [],
        payrollHistory: emp.payrollHistory || [],
      }));
      // This check might be complex if only some employees are missing fields.
      // A simple check: if the first employee doesn't have baseSalary (might not be robust)
      if (db.data.employees.length > 0 && db.data.employees[0].baseSalary === undefined) {
        needsWrite = true; // Signal that migration/defaulting happened.
      }
    }

    if (!db.data.attendanceRecords || db.data.attendanceRecords.length === 0) {
      db.data.attendanceRecords = defaultData.attendanceRecords;
      needsWrite = true;
    }
    if (!db.data.leaveRequests || db.data.leaveRequests.length === 0) {
      db.data.leaveRequests = defaultData.leaveRequests;
      needsWrite = true;
    }
    if (!db.data.shifts || db.data.shifts.length === 0) {
      db.data.shifts = defaultData.shifts;
      needsWrite = true;
    }

    if (needsWrite) {
      await db.write();
    }
    dbInstance = db;
  }
  return dbInstance;
}
