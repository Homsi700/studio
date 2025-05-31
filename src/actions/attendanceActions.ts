
'use server';

import { getDb } from '@/lib/db';
import type { AttendanceRecord, Employee, ExternalAttendanceData, RawAttendanceEvent } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { format, differenceInMinutes, parse, isValid, parseISO } from 'date-fns';

export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  const db = await getDb();
  return db.data.attendanceRecords || [];
}

function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

function calculateDuration(clockIn: string, clockOut: string, date: string): string | null {
  const clockInTime = parse(`${date} ${clockIn}`, 'yyyy-MM-dd HH:mm', new Date());
  const clockOutTime = parse(`${date} ${clockOut}`, 'yyyy-MM-dd HH:mm', new Date());

  if (!isValid(clockInTime) || !isValid(clockOutTime)) {
      return null;
  }

  const diffMins = differenceInMinutes(clockOutTime, clockInTime);
  if (diffMins < 0) return null;

  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;
  return `${hours} ساعة و ${minutes} دقيقة`;
}


export async function handleClockEvent(
  employeeIdentifier: string,
  pin: string,
  eventType: 'clockIn' | 'clockOut'
): Promise<{ success: boolean; message: string; record?: AttendanceRecord }> {
  const db = await getDb();
  const employees: Employee[] = db.data.employees || [];
  const attendanceRecords: AttendanceRecord[] = db.data.attendanceRecords || [];

  const employee = employees.find(
    (emp) => emp.id === employeeIdentifier || emp.name.toLowerCase() === employeeIdentifier.toLowerCase()
  );

  if (!employee) {
    return { success: false, message: 'لم يتم العثور على الموظف.' };
  }

  if (!employee.hashedPin) {
    return { success: false, message: 'لم يتم تعيين رقم سري لهذا الموظف. يرجى مراجعة المسؤول.' };
  }

  const isPinValid = await bcrypt.compare(pin, employee.hashedPin);
  if (!isPinValid) {
    return { success: false, message: 'الرقم السري غير صحيح.' };
  }

  const clockEventTime = new Date();
  const todayDateStr = format(clockEventTime, 'yyyy-MM-dd');
  const currentTimeStr = formatTime(clockEventTime);

  if (eventType === 'clockIn') {
    const existingOpenRecord = attendanceRecords.find(
      (r) => r.employeeId === employee.id && r.date === todayDateStr && r.clockOut === null
    );
    if (existingOpenRecord) {
      return { success: false, message: 'لقد قمت بتسجيل الدخول بالفعل اليوم ولم تقم بالخروج بعد.' };
    }
    
    const newRecord: AttendanceRecord = {
      id: uuidv4(),
      employeeId: employee.id,
      employeeName: employee.name,
      date: todayDateStr,
      clockIn: currentTimeStr,
      clockOut: null,
      totalDuration: null,
      status: 'onDuty', 
      method: 'PIN', // Record method
    };
    db.data.attendanceRecords.push(newRecord);
    await db.write();
    revalidatePath('/attendance');
    revalidatePath('/'); 
    return { success: true, message: `تم تسجيل الدخول بنجاح في ${currentTimeStr}.`, record: newRecord };
  } else { // clockOut
    const openRecordIndex = attendanceRecords.findIndex(
      (r) => r.employeeId === employee.id && r.date === todayDateStr && r.clockOut === null
    );

    if (openRecordIndex === -1) {
      return { success: false, message: 'لم تقم بتسجيل الدخول اليوم أو لقد قمت بالخروج بالفعل.' };
    }

    const recordToUpdate = attendanceRecords[openRecordIndex];
    recordToUpdate.clockOut = currentTimeStr;
    recordToUpdate.totalDuration = calculateDuration(recordToUpdate.clockIn, currentTimeStr, recordToUpdate.date);
    recordToUpdate.status = recordToUpdate.totalDuration ? 'onTime' : 'earlyLeave'; // Simplified status
    // method was set at clockIn, deviceId might be added if relevant for PIN kiosk

    db.data.attendanceRecords[openRecordIndex] = recordToUpdate;
    await db.write();
    revalidatePath('/attendance');
    revalidatePath('/');
    return { success: true, message: `تم تسجيل الخروج بنجاح في ${currentTimeStr}.`, record: recordToUpdate };
  }
}

export async function recordExternalAttendance(
  data: ExternalAttendanceData
): Promise<{ success: boolean; message: string; eventId?: string }> {
  const db = await getDb();

  // 1. Validate secret key
  if (data.deviceSecret !== process.env.FINGERPRINT_WEBHOOK_SECRET) {
    console.error("Unauthorized attempt to record external attendance: Invalid secret key.");
    // In a real scenario, you might not want to give too specific errors for security reasons
    return { success: false, message: "Unauthorized access." };
  }

  // 2. Basic data validation
  if (!data.employeeId || !data.timestamp || !data.eventType) {
    console.error("Invalid external attendance data received:", data);
    return { success: false, message: "Missing required attendance data." };
  }

  let eventTimestamp: Date;
  try {
    eventTimestamp = parseISO(data.timestamp);
    if (!isValid(eventTimestamp)) {
      throw new Error("Invalid timestamp format");
    }
  } catch (error) {
    console.error("Invalid timestamp format in external attendance data:", data.timestamp);
    return { success: false, message: "Invalid timestamp format. Expected ISO string." };
  }

  // 3. Check if employee exists
  const employeeExists = db.data.employees.some((emp: Employee) => emp.id === data.employeeId);
  if (!employeeExists) {
    console.warn(`Attempt to record external attendance for non-existent employee ID: ${data.employeeId}`);
    return { success: false, message: "Employee not found in system." };
  }

  const newRawEvent: RawAttendanceEvent = {
    id: uuidv4(),
    employeeId: data.employeeId,
    timestamp: eventTimestamp.toISOString(),
    type: data.eventType,
    method: 'Fingerprint', // Assuming fingerprint, could be 'OtherExternal'
    deviceId: data.deviceId || 'UnknownDevice',
  };

  db.data.rawAttendanceEvents.push(newRawEvent);
  await db.write();

  console.log(`External attendance event recorded for ${data.employeeId} (${data.eventType}) at ${newRawEvent.timestamp} via ${newRawEvent.method}.`);
  
  // Revalidate paths that might display this raw data or aggregated data from it
  revalidatePath('/'); // Dashboard might show recent activities
  revalidatePath('/attendance'); // Attendance page might be enhanced to show raw logs or use them

  return { success: true, message: "External attendance event recorded successfully.", eventId: newRawEvent.id };
}
