
import { JSONFilePreset } from 'lowdb/node';
import type { Employee, AttendanceRecord, LeaveRequest, Shift, RawAttendanceEvent, ExchangeRate, Currency, PayrollSettings } from './constants';
import { mockEmployees, mockAttendance, mockLeaveRequests, mockRawAttendanceEvents, mockExchangeRates, CURRENCIES } from './constants';

const initialShifts: Shift[] = [
  { id: '1', name: 'الوردية الصباحية', startTime: '09:00', endTime: '17:00', gracePeriodMinutes: 15 },
  { id: '2', name: 'الوردية المسائية', startTime: '17:00', endTime: '01:00', gracePeriodMinutes: 15 },
];

interface Data {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  shifts: Shift[];
  rawAttendanceEvents: RawAttendanceEvent[];
  exchangeRates: ExchangeRate[];
}

const defaultData: Data = {
  employees: mockEmployees.map(emp => ({
    ...emp,
    payrollSettings: {
      baseSalary: emp.payrollSettings?.baseSalary || 0,
      currency: emp.payrollSettings?.currency || 'SYP',
      allowances: emp.payrollSettings?.allowances || [],
      deductions: emp.payrollSettings?.deductions || [],
    },
    payrollHistory: emp.payrollHistory || [],
  })),
  attendanceRecords: mockAttendance.map(rec => ({ 
    ...rec,
    method: rec.method || 'Manual' 
  })),
  leaveRequests: mockLeaveRequests,
  shifts: initialShifts,
  rawAttendanceEvents: mockRawAttendanceEvents,
  exchangeRates: mockExchangeRates,
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
      db.data.employees = db.data.employees.map((emp: Employee) => {
        const defaultSettings: PayrollSettings = {
          baseSalary: 0,
          currency: 'SYP',
          allowances: [],
          deductions: [],
        };
        const currentSettings = emp.payrollSettings || defaultSettings;
        return {
          ...emp,
          payrollSettings: {
            baseSalary: currentSettings.baseSalary === undefined ? 0 : currentSettings.baseSalary,
            currency: currentSettings.currency || 'SYP',
            allowances: currentSettings.allowances || [],
            deductions: currentSettings.deductions || [],
          },
          payrollHistory: emp.payrollHistory || [],
        };
      });
      // Heuristic to check if migration is needed. A more robust check might be a version number.
      if (db.data.employees.length > 0 && (db.data.employees[0].payrollSettings === undefined || db.data.employees[0].payrollSettings.currency === undefined)) {
        needsWrite = true;
      }
    }
    
    if (!db.data.attendanceRecords) {
        db.data.attendanceRecords = defaultData.attendanceRecords;
        needsWrite = true;
    } else {
        db.data.attendanceRecords = db.data.attendanceRecords.map(rec => ({
            ...rec,
            method: rec.method || 'Manual'
        }));
        if (db.data.attendanceRecords.length > 0 && db.data.attendanceRecords[0].method === undefined) {
            needsWrite = true;
        }
    }

    if (!db.data.leaveRequests || db.data.leaveRequests.length === 0) {
      db.data.leaveRequests = defaultData.leaveRequests;
      needsWrite = true;
    }
    if (!db.data.shifts || db.data.shifts.length === 0) {
      db.data.shifts = defaultData.shifts;
      needsWrite = true;
    }
    if (!db.data.rawAttendanceEvents) { 
      db.data.rawAttendanceEvents = defaultData.rawAttendanceEvents;
      needsWrite = true;
    }
     if (!db.data.exchangeRates) {
      db.data.exchangeRates = defaultData.exchangeRates;
      needsWrite = true;
    }


    if (needsWrite) {
      await db.write();
    }
    dbInstance = db;
  }
  return dbInstance;
}
