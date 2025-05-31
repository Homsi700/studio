'use server';

import { getDb } from '@/lib/db';
import type { Employee } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export async function getEmployees(): Promise<Employee[]> {
  const db = await getDb();
  return db.data.employees || [];
}

export async function addEmployee(employeeData: Omit<Employee, 'id' | 'avatarUrl'> & { avatarUrl?: string }): Promise<Employee> {
  const db = await getDb();
  const newEmployee: Employee = {
    id: uuidv4(),
    ...employeeData,
    avatarUrl: employeeData.avatarUrl || `https://placehold.co/100x100.png?text=${encodeURIComponent(employeeData.name.charAt(0))}`
  };
  db.data.employees.push(newEmployee);
  await db.write();
  revalidatePath('/employees');
  return newEmployee;
}

export async function updateEmployee(id: string, employeeData: Partial<Omit<Employee, 'id'>>): Promise<Employee | null> {
  const db = await getDb();
  const employeeIndex = db.data.employees.findIndex((emp: Employee) => emp.id === id);
  if (employeeIndex === -1) {
    return null;
  }
  const updatedEmployee = { ...db.data.employees[employeeIndex], ...employeeData };
  db.data.employees[employeeIndex] = updatedEmployee;
  await db.write();
  revalidatePath('/employees');
  return updatedEmployee;
}

export async function deleteEmployee(id: string): Promise<{ success: boolean }> {
  const db = await getDb();
  const initialLength = db.data.employees.length;
  db.data.employees = db.data.employees.filter((emp: Employee) => emp.id !== id);
  if (db.data.employees.length < initialLength) {
    await db.write();
    revalidatePath('/employees');
    return { success: true };
  }
  return { success: false };
}
