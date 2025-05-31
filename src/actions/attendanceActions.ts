
'use server';

import { getDb } from '@/lib/db';
import type { AttendanceRecord, Employee } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { format, differenceInMinutes, parse, isValid } from 'date-fns';

export async function getAttendanceRecords(): Promise<AttendanceRecord[]> {
  const db = await getDb();
  return db.data.attendanceRecords || [];
}

function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

function calculateDuration(clockIn: string, clockOut: string, date: string): string | null {
  // Ensure date is part of parsing for accurate time objects
  const clockInTime = parse(`${date} ${clockIn}`, 'yyyy-MM-dd HH:mm', new Date());
  const clockOutTime = parse(`${date} ${clockOut}`, 'yyyy-MM-dd HH:mm', new Date());

  if (!isValid(clockInTime) || !isValid(clockOutTime)) {
      return null;
  }

  const diffMins = differenceInMinutes(clockOutTime, clockInTime);
  if (diffMins < 0) return null; // clock out before clock in

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

  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const currentTimeStr = formatTime(new Date());

  if (eventType === 'clockIn') {
    const existingOpenRecord = attendanceRecords.find(
      (r) => r.employeeId === employee.id && r.date === todayDateStr && r.clockOut === null
    );
    if (existingOpenRecord) {
      return { success: false, message: 'لقد قمت بتسجيل الدخول بالفعل اليوم.' };
    }
    // Check if already clocked in and out today, to prevent multiple full entries for the same day.
    // This might be a business rule to refine later (e.g. allow multiple shifts)
    const existingCompleteRecordToday = attendanceRecords.find(
      (r) => r.employeeId === employee.id && r.date === todayDateStr && r.clockOut !== null
    );
     if (existingCompleteRecordToday) {
       //This rule might need adjustment depending on company policy for multiple clock-ins per day
      // return { success: false, message: 'لقد قمت بتسجيل الدخول والخروج بالفعل لهذا اليوم.' };
    }


    const newRecord: AttendanceRecord = {
      id: uuidv4(),
      employeeId: employee.id,
      employeeName: employee.name,
      date: todayDateStr,
      clockIn: currentTimeStr,
      clockOut: null,
      totalDuration: null,
      status: 'onDuty', // Status can be updated to 'late' later based on shift rules
    };
    db.data.attendanceRecords.push(newRecord);
    await db.write();
    revalidatePath('/attendance');
    revalidatePath('/'); // Revalidate dashboard
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
    // Status can be updated to 'earlyLeave' or 'onTime' based on shift rules
    // For now, just set it to onTime if duration exists, else keep as is or set specific.
    // This needs refinement with shift logic. Defaulting to onTime is a placeholder.
    recordToUpdate.status = recordToUpdate.totalDuration ? 'onTime' : 'earlyLeave'; // Simplified status

    db.data.attendanceRecords[openRecordIndex] = recordToUpdate;
    await db.write();
    revalidatePath('/attendance');
    revalidatePath('/'); // Revalidate dashboard
    return { success: true, message: `تم تسجيل الخروج بنجاح في ${currentTimeStr}.`, record: recordToUpdate };
  }
}
