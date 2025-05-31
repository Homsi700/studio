import { JSONFilePreset } from 'lowdb/node';
import type { Employee, AttendanceRecord, LeaveRequest } from './constants';
import { mockEmployees, mockAttendance, mockLeaveRequests, navItems as allNavItems } from './constants'; // Assuming shifts are part of constants too

// Define the structure for shifts if not already in constants.ts
// For now, I'll assume a basic shift structure.
export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
}

const initialShifts: Shift[] = [
  { id: '1', name: 'الوردية الصباحية', startTime: '09:00', endTime: '17:00', gracePeriodMinutes: 15 },
  { id: '2', name: 'الوردية المسائية', startTime: '17:00', endTime: '01:00', gracePeriodMinutes: 15 },
];


interface Data {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  shifts: Shift[];
}

const defaultData: Data = {
  employees: mockEmployees,
  attendanceRecords: mockAttendance,
  leaveRequests: mockLeaveRequests,
  shifts: initialShifts, // Using a local initialShifts or import from constants if available
};

let dbInstance: any; // Low<Data> type is tricky with JSONFilePreset initialization timing

export async function getDb() {
  if (!dbInstance) {
    // Use JSONFilePreset for simpler setup
    // It handles initial read and provides `db.data` and `db.write()`
    const db = await JSONFilePreset<Data>('src/lib/db.json', defaultData);
    
    // Perform an explicit read to load data from file if it exists
    await db.read();

    // Ensure default data is written if the file was empty or collections are missing
    // JSONFilePreset initializes with defaultData if file doesn't exist or is empty.
    // We can add a check if specific collections are empty and seed them.
    if (!db.data || !db.data.employees || db.data.employees.length === 0) {
      db.data = { ...defaultData, ...db.data }; // Merge to preserve other potential data
      db.data.employees = mockEmployees; // Ensure employees are seeded
    }
    if (!db.data.attendanceRecords || db.data.attendanceRecords.length === 0) {
      db.data.attendanceRecords = mockAttendance;
    }
    if (!db.data.leaveRequests || db.data.leaveRequests.length === 0) {
      db.data.leaveRequests = mockLeaveRequests;
    }
     if (!db.data.shifts || db.data.shifts.length === 0) {
      db.data.shifts = initialShifts; // Or your mockShifts from constants
    }
    await db.write();
    dbInstance = db;
  }
  return dbInstance;
}
