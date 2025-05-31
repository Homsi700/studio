
'use server';

import { getDb } from '@/lib/db';
import type { Employee, PayrollSettings, Currency } from '@/lib/constants';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function getEmployees(): Promise<Employee[]> {
  const db = await getDb();
  return db.data.employees.map((emp: Employee) => ({
    ...emp,
    payrollSettings: emp.payrollSettings || { baseSalary: 0, currency: 'SYP', allowances: [], deductions: [] },
    payrollHistory: emp.payrollHistory || [],
  })) || [];
}

export async function addEmployee(
  employeeData: Omit<Employee, 'id' | 'avatarUrl' | 'hashedPin' | 'payrollSettings' | 'payrollHistory'> & { 
    avatarUrl?: string; 
    pin?: string;
    payrollSettings?: Partial<PayrollSettings>;
  }
): Promise<Employee> {
  const db = await getDb();
  let hashedPin;
  if (employeeData.pin && employeeData.pin.trim() !== '') {
    hashedPin = await bcrypt.hash(employeeData.pin, SALT_ROUNDS);
  }

  const defaultPayrollSettings: PayrollSettings = {
    baseSalary: 0,
    currency: 'SYP',
    allowances: [],
    deductions: [],
  };

  const newEmployee: Employee = {
    id: uuidv4(),
    name: employeeData.name,
    department: employeeData.department,
    jobTitle: employeeData.jobTitle,
    email: employeeData.email,
    phone: employeeData.phone,
    avatarUrl: employeeData.avatarUrl || `https://placehold.co/100x100.png?text=${encodeURIComponent(employeeData.name.charAt(0))}`,
    hashedPin,
    payrollSettings: {
      ...defaultPayrollSettings,
      ...employeeData.payrollSettings,
      baseSalary: Number(employeeData.payrollSettings?.baseSalary) || 0,
      currency: employeeData.payrollSettings?.currency || 'SYP',
    },
    payrollHistory: [],
  };
  db.data.employees.push(newEmployee);
  await db.write();
  revalidatePath('/employees');
  revalidatePath('/payroll');
  return newEmployee;
}

export async function updateEmployee(
  id: string,
  employeeData: Partial<Omit<Employee, 'id' | 'hashedPin' | 'payrollSettings' | 'payrollHistory'>> & { 
    pin?: string;
    payrollSettings?: Partial<PayrollSettings>;
  }
): Promise<Employee | null> {
  const db = await getDb();
  const employeeIndex = db.data.employees.findIndex((emp: Employee) => emp.id === id);
  if (employeeIndex === -1) {
    return null;
  }

  const existingEmployee = db.data.employees[employeeIndex];
  const updatedEmployeeData: Partial<Employee> = { ...employeeData };
  delete updatedEmployeeData.pin; 
  delete updatedEmployeeData.payrollSettings;


  if (employeeData.pin && employeeData.pin.trim() !== '') {
    updatedEmployeeData.hashedPin = await bcrypt.hash(employeeData.pin, SALT_ROUNDS);
  } else if (employeeData.pin === '') { 
    updatedEmployeeData.hashedPin = undefined;
  }
  
  const updatedPayrollSettings: PayrollSettings = {
    ...(existingEmployee.payrollSettings || { baseSalary: 0, currency: 'SYP', allowances: [], deductions: [] }), // Start with existing or default
    ...(employeeData.payrollSettings || {}), // Apply updates
  };
   // Ensure baseSalary is a number and currency has a default
  updatedPayrollSettings.baseSalary = Number(updatedPayrollSettings.baseSalary) || 0;
  updatedPayrollSettings.currency = updatedPayrollSettings.currency || 'SYP';


  const updatedEmployee: Employee = { 
      ...existingEmployee, 
      ...updatedEmployeeData,
      payrollSettings: updatedPayrollSettings,
    };

  db.data.employees[employeeIndex] = updatedEmployee;
  await db.write();
  revalidatePath('/employees');
  revalidatePath('/checkin-checkout'); 
  revalidatePath('/payroll');
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
    revalidatePath('/payroll');
    return { success: true };
  }
  return { success: false };
}
