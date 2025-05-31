
'use server';

import { getDb } from '@/lib/db';
import type { LeaveRequest, LeaveRequestStatus, Employee } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export async function getLeaveRequests(): Promise<LeaveRequest[]> {
  const db = await getDb();
  return db.data.leaveRequests || [];
}

export async function addLeaveRequest(
  requestData: Omit<LeaveRequest, 'id' | 'employeeName' | 'status'> & { employeeId: string }
): Promise<LeaveRequest> {
  const db = await getDb();
  
  // Find employee name from employees data
  const employee = db.data.employees.find((emp: Employee) => emp.id === requestData.employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  const newRequest: LeaveRequest = {
    id: uuidv4(),
    ...requestData,
    employeeName: employee.name,
    status: 'pending',
  };
  db.data.leaveRequests.push(newRequest);
  await db.write();
  revalidatePath('/leaves');
  return newRequest;
}

export async function updateLeaveRequestStatus(
  id: string,
  status: LeaveRequestStatus
): Promise<LeaveRequest | null> {
  const db = await getDb();
  const requestIndex = db.data.leaveRequests.findIndex((req: LeaveRequest) => req.id === id);
  if (requestIndex === -1) {
    return null;
  }
  db.data.leaveRequests[requestIndex].status = status;
  await db.write();
  revalidatePath('/leaves');
  return db.data.leaveRequests[requestIndex];
}

export async function deleteLeaveRequest(id: string): Promise<{ success: boolean }> {
  const db = await getDb();
  const initialLength = db.data.leaveRequests.length;
  db.data.leaveRequests = db.data.leaveRequests.filter((req: LeaveRequest) => req.id !== id);
  if (db.data.leaveRequests.length < initialLength) {
    await db.write();
    revalidatePath('/leaves');
    return { success: true };
  }
  return { success: false };
}
