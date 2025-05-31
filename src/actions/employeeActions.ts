
'use server';

import { getDb } from '@/lib/db';
import type { Employee } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function getEmployees(): Promise<Employee[]> {
  const db = await getDb();
  return db.data.employees || [];
}

export async function addEmployee(
  employeeData: Omit<Employee, 'id' | 'avatarUrl' | 'hashedPin'> & { avatarUrl?: string; pin?: string }
): Promise<Employee> {
  const db = await getDb();
  let hashedPin;
  if (employeeData.pin && employeeData.pin.trim() !== '') {
    hashedPin = await bcrypt.hash(employeeData.pin, SALT_ROUNDS);
  }

  const newEmployee: Employee = {
    id: uuidv4(),
    name: employeeData.name,
    department: employeeData.department,
    jobTitle: employeeData.jobTitle,
    email: employeeData.email,
    phone: employeeData.phone,
    avatarUrl: employeeData.avatarUrl || `https://placehold.co/100x100.png?text=${encodeURIComponent(employeeData.name.charAt(0))}`,
    hashedPin,
  };
  db.data.employees.push(newEmployee);
  await db.write();
  revalidatePath('/employees');
  return newEmployee;
}

export async function updateEmployee(
  id: string,
  employeeData: Partial<Omit<Employee, 'id' | 'hashedPin'> & { pin?: string }>
): Promise<Employee | null> {
  const db = await getDb();
  const employeeIndex = db.data.employees.findIndex((emp: Employee) => emp.id === id);
  if (employeeIndex === -1) {
    return null;
  }

  const existingEmployee = db.data.employees[employeeIndex];
  const updatedEmployeeData: Partial<Employee> = { ...employeeData };
  delete updatedEmployeeData.pin; // Remove plain PIN from data to be spread

  if (employeeData.pin && employeeData.pin.trim() !== '') {
    updatedEmployeeData.hashedPin = await bcrypt.hash(employeeData.pin, SALT_ROUNDS);
  } else if (employeeData.pin === '') { // Explicitly clearing PIN
    updatedEmployeeData.hashedPin = undefined;
  }


  const updatedEmployee = { ...existingEmployee, ...updatedEmployeeData };
  db.data.employees[employeeIndex] = updatedEmployee;
  await db.write();
  revalidatePath('/employees');
  revalidatePath('/checkin-checkout'); // In case employee data affects check-in
  return updatedEmployee;
}

export async function deleteEmployee(id: string): Promise<{ success: boolean }> {
  const db = await getDb();
  const initialLength = db.data.employees.length;
  db.data.employees = db.data.employees.filter((emp: Employee) => emp.id !== id);
  if (db.data.employees.length < initialLength) {
    await db.write();
    revalidatePath('/employees');
    revalidatePath('/checkin-checkout');
    return { success: true };
  }
  return { success: false };
}
