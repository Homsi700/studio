
'use server';

import { getDb } from '@/lib/db';
import type { AttendanceRecord } from '@/lib/constants';
// import { revalidatePath } from 'next/cache'; // For add/update/delete later

export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  const db = await getDb();
  return db.data.attendanceRecords || [];
}

// Future actions for adding, updating, or deleting attendance records can be added here.
// For example:
/*
export async function addAttendanceRecord(recordData: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> {
  const db = await getDb();
  const newRecord: AttendanceRecord = {
    id: Date.now().toString(), // Simple ID generation for now, consider uuid
    ...recordData,
  };
  db.data.attendanceRecords.push(newRecord);
  await db.write();
  revalidatePath('/attendance');
  return newRecord;
}
*/
