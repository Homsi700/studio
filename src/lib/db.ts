
import { JSONFilePreset } from 'lowdb/node';
import type { Employee, AttendanceRecord, LeaveRequest, Shift, RawAttendanceEvent } from './constants';
import { mockEmployees, mockAttendance, mockLeaveRequests, mockRawAttendanceEvents } from './constants';

const initialShifts: Shift[] = [
  { id: '1', name: 'الوردية الصباحية', startTime: '09:00', endTime: '17:00', gracePeriodMinutes: 15 },
  { id: '2', name: 'الوردية المسائية', startTime: '17:00', endTime: '01:00', gracePeriodMinutes: 15 },
];

interface Data {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  shifts: Shift[];
  rawAttendanceEvents: RawAttendanceEvent[]; // New collection for raw events
}

const defaultData: Data = {
  employees: mockEmployees.map(emp => ({
    ...emp,
    baseSalary: emp.baseSalary || 0,
    allowances: emp.allowances || [],
    deductions: emp.deductions || [],
    payrollHistory: emp.payrollHistory || [],
  })),
  attendanceRecords: mockAttendance.map(rec => ({ // ensure mock records have method
    ...rec,
    method: rec.method || 'Manual' // Default to Manual if not specified
  })),
  leaveRequests: mockLeaveRequests,
  shifts: initialShifts,
  rawAttendanceEvents: mockRawAttendanceEvents, // Initialize with empty array
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

    // Ensure employees have new payroll fields
    if (!db.data.employees || db.data.employees.length === 0) {
      db.data.employees = defaultData.employees;
      needsWrite = true;
    } else {
      db.data.employees = db.data.employees.map(emp => ({
        ...emp,
        baseSalary: emp.baseSalary === undefined ? 0 : emp.baseSalary,
        allowances: emp.allowances || [],
        deductions: emp.deductions || [],
        payrollHistory: emp.payrollHistory || [],
      }));
      if (db.data.employees.length > 0 && db.data.employees[0].baseSalary === undefined) {
        needsWrite = true;
      }
    }
    
    // Ensure attendanceRecords have method field
    if (!db.data.attendanceRecords) {
        db.data.attendanceRecords = defaultData.attendanceRecords;
        needsWrite = true;
    } else {
        db.data.attendanceRecords = db.data.attendanceRecords.map(rec => ({
            ...rec,
            method: rec.method || 'Manual' // Default if missing
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
    if (!db.data.rawAttendanceEvents) { // Check for the new collection
      db.data.rawAttendanceEvents = defaultData.rawAttendanceEvents;
      needsWrite = true;
    }


    if (needsWrite) {
      await db.write();
    }
    dbInstance = db;
  }
  return dbInstance;
}
