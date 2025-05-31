
'use server';

import { getDb } from '@/lib/db';
import type { Employee, Allowance, Deduction, PayrollRecord } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { getEmployees } from './employeeActions';
import { getAttendanceRecords } from './attendanceActions';
import { getLeaveRequests } from './leaveActions';
import { parse, differenceInMinutes, getDaysInMonth, isWithinInterval, format, eachDayOfInterval, isWeekend, parseISO } from 'date-fns';
import { arSA } from 'date-fns/locale'; // For Arabic day names if needed

export interface PayrollSettings {
  baseSalary?: number;
  allowances?: Allowance[];
  deductions?: Deduction[];
}

export async function getEmployeePayrollSettings(employeeId: string): Promise<PayrollSettings | null> {
  const db = await getDb();
  const employee = db.data.employees.find((emp: Employee) => emp.id === employeeId);
  if (!employee) {
    return null;
  }
  return {
    baseSalary: employee.baseSalary,
    allowances: employee.allowances,
    deductions: employee.deductions,
  };
}

export async function updateEmployeePayrollSettings(
  employeeId: string,
  settings: PayrollSettings
): Promise<Employee | null> {
  const db = await getDb();
  const employeeIndex = db.data.employees.findIndex((emp: Employee) => emp.id === employeeId);
  if (employeeIndex === -1) {
    return null;
  }

  const updatedEmployee = {
    ...db.data.employees[employeeIndex],
    baseSalary: settings.baseSalary === undefined ? db.data.employees[employeeIndex].baseSalary : settings.baseSalary,
    allowances: settings.allowances || db.data.employees[employeeIndex].allowances,
    deductions: settings.deductions || db.data.employees[employeeIndex].deductions,
  };

  db.data.employees[employeeIndex] = updatedEmployee;
  await db.write();
  revalidatePath('/payroll');
  revalidatePath(`/employees`); // In case salary info is shown there
  return updatedEmployee;
}

export async function getPayrollHistory(employeeId: string): Promise<PayrollRecord[]> {
  const db = await getDb();
  const employee = db.data.employees.find((emp: Employee) => emp.id === employeeId);
  return employee?.payrollHistory || [];
}

// Constants for payroll calculation - can be moved to settings later
const HOURS_PER_WORK_DAY = 8;
const LATE_DEDUCTION_PER_HOUR_RATE = 0.1; // Example: 10% of hourly rate deducted per late hour
const ABSENT_DEDUCTION_DAILY_RATE_FACTOR = 1; // Example: 1 day's salary deducted per absent day

export async function calculateMonthlyPayroll(
  employeeId: string,
  month: number, // 1-12
  year: number
): Promise<{ success: boolean; message: string; payrollRecord?: PayrollRecord }> {
  const db = await getDb();
  const employee = db.data.employees.find((emp: Employee) => emp.id === employeeId);

  if (!employee) {
    return { success: false, message: 'لم يتم العثور على الموظف.' };
  }
  if (employee.baseSalary === undefined || employee.baseSalary === null) {
    return { success: false, message: 'لم يتم تحديد الراتب الأساسي للموظف.' };
  }

  const allAttendance = await getAttendanceRecords();
  const allLeaves = await getLeaveRequests();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of the month

  const employeeAttendance = allAttendance.filter(
    (r) =>
      r.employeeId === employeeId &&
      isWithinInterval(parseISO(r.date), { start: startDate, end: endDate })
  );

  const employeeLeaves = allLeaves.filter(
    (l) =>
      l.employeeId === employeeId &&
      l.status === 'approved' &&
      (isWithinInterval(parseISO(l.startDate), { start: startDate, end: endDate }) ||
       isWithinInterval(parseISO(l.endDate), { start: startDate, end: endDate }))
  );
  
  const daysInMonth = getDaysInMonth(startDate);
  let workingDaysInMonth = 0;
  let approvedLeaveDays = 0;
  let actualWorkedDays = 0;
  let totalLateMinutesAggregated = 0;
  let totalAbsentDaysAggregated = 0;

  const monthDates = eachDayOfInterval({ start: startDate, end: endDate });
  
  monthDates.forEach(currentDate => {
    // Assuming Sat/Sun are weekends. This should be configurable.
    // For Syria, Friday/Saturday are weekends. Let's adjust.
    // 0 = Sunday, 6 = Saturday. Friday = 5.
    if (!isWeekend(currentDate) || (isWeekend(currentDate) && (currentDate.getDay() !== 5 && currentDate.getDay() !== 6))) { // crude weekend filter, needs proper config
        workingDaysInMonth++;
    }

    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const attendanceOnDay = employeeAttendance.find(r => r.date === dateStr);
    const leaveOnDay = employeeLeaves.find(l => 
        isWithinInterval(currentDate, {start: parseISO(l.startDate), end: parseISO(l.endDate)})
    );

    if (leaveOnDay) {
        approvedLeaveDays++;
        // If on approved leave, not considered absent for pay if leave is paid (assumption)
    } else if (attendanceOnDay) {
        actualWorkedDays++;
        if (attendanceOnDay.status === 'late') {
            // Calculate late minutes based on a standard 9 AM start for now. Needs shift integration.
            // Example: if official start is 09:00 and clockIn is 09:30, lateMinutes = 30.
            // This is a placeholder logic.
            const officialStartTime = parse(`${dateStr} 09:00`, 'yyyy-MM-dd HH:mm', new Date());
            const clockInTime = parse(`${dateStr} ${attendanceOnDay.clockIn}`, 'yyyy-MM-dd HH:mm', new Date());
            if (differenceInMinutes(clockInTime, officialStartTime) > 0) {
                 totalLateMinutesAggregated += differenceInMinutes(clockInTime, officialStartTime);
            }
        }
    } else {
        // Not on leave and no attendance record = absent (if it was a working day)
        // This needs to check if 'currentDate' was supposed to be a working day for THIS employee
        // For now, assume if not weekend and no leave/attendance, it's an absence.
         if (!isWeekend(currentDate) || (isWeekend(currentDate) && (currentDate.getDay() !== 5 && currentDate.getDay() !== 6))) {
            totalAbsentDaysAggregated++;
        }
    }
  });

  const baseSalary = employee.baseSalary || 0;
  const dailyRate = baseSalary / (workingDaysInMonth || daysInMonth); // Use workingDaysInMonth if available and > 0
  const hourlyRate = dailyRate / HOURS_PER_WORK_DAY;

  let salaryDeductionsForLateness = 0;
  if (totalLateMinutesAggregated > 0) {
      const totalLateHours = totalLateMinutesAggregated / 60;
      salaryDeductionsForLateness = totalLateHours * hourlyRate * LATE_DEDUCTION_PER_HOUR_RATE;
  }

  let salaryDeductionsForAbsence = 0;
  if (totalAbsentDaysAggregated > 0) {
      salaryDeductionsForAbsence = totalAbsentDaysAggregated * dailyRate * ABSENT_DEDUCTION_DAILY_RATE_FACTOR;
  }
  
  // Gross salary might be base salary adjusted for unpaid absences/latenesses, before allowances/other deductions
  // This is a simplified calculation. True proration for part-time or joined mid-month is more complex.
  // For simplicity, start with baseSalary and subtract absence/late deductions from it to get a form of 'earned salary'
  let earnedSalary = baseSalary - salaryDeductionsForAbsence - salaryDeductionsForLateness;
  earnedSalary = Math.max(0, earnedSalary); // Salary cannot be negative

  const totalAllowances = (employee.allowances || []).reduce((sum, item) => sum + item.amount, 0);
  const manualDeductions = (employee.deductions || []).reduce((sum, item) => sum + item.amount, 0);
  
  const totalDeductionsValue = manualDeductions + salaryDeductionsForAbsence + salaryDeductionsForLateness;

  // Net salary after *all* deductions and allowances.
  // Common practice is: Gross Salary = Base + Allowances. Then Net = Gross - Deductions.
  // Or: Net = (Base - Absence/Late Deductions) + Allowances - Manual Deductions.
  // Let's use: Net = (BaseSalary - AbsenceDeductions - LatenessDeductions) + TotalAllowances - ManualDeductions
  // The `grossSalary` field in PayrollRecord could be `BaseSalary + TotalAllowances` before specific month deductions
  // Or it could be the `earnedSalary` after absence/late penalties. This needs clarification.
  // For now:
  // grossSalary = baseSalary (as per common definition before deductions)
  // netSalary = (baseSalary - salaryDeductionsForAbsence - salaryDeductionsForLateness) + totalAllowances - manualDeductions;

  const grossSalaryCalc = baseSalary; // The contractual base before performance deductions for the month.
  const netSalaryCalc = (baseSalary - salaryDeductionsForAbsence - salaryDeductionsForLateness) + totalAllowances - manualDeductions;


  const newPayrollRecord: PayrollRecord = {
    id: uuidv4(),
    month,
    year,
    grossSalary: parseFloat(grossSalaryCalc.toFixed(2)),
    totalAllowances: parseFloat(totalAllowances.toFixed(2)),
    totalDeductions: parseFloat(totalDeductionsValue.toFixed(2)),
    netSalary: parseFloat(netSalaryCalc.toFixed(2)),
    calculationDate: new Date().toISOString(),
    attendanceSummary: {
      totalWorkingHours: actualWorkedDays * HOURS_PER_WORK_DAY, // Placeholder
      totalLateMinutes: totalLateMinutesAggregated,
      totalAbsentDays: totalAbsentDaysAggregated,
      daysInMonth: daysInMonth,
      workingDaysInMonth: workingDaysInMonth, // Based on crude weekend filter
      actualWorkedDays: actualWorkedDays,
    },
    notes: `تم الحساب بناءً على ${actualWorkedDays} أيام عمل فعلية، ${approvedLeaveDays} أيام إجازة.`,
  };

  if (!employee.payrollHistory) {
    employee.payrollHistory = [];
  }
  
  // Remove existing record for the same month/year before adding new one
  employee.payrollHistory = employee.payrollHistory.filter(p => !(p.month === month && p.year === year));
  employee.payrollHistory.push(newPayrollRecord);

  const employeeIndex = db.data.employees.findIndex((emp: Employee) => emp.id === employeeId);
  db.data.employees[employeeIndex] = employee;
  await db.write();

  revalidatePath('/payroll');
  return { success: true, message: `تم حساب وحفظ كشف راتب شهر ${month}/${year} للموظف ${employee.name} بنجاح.`, payrollRecord: newPayrollRecord };
}
