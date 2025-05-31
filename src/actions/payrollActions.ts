
'use server';

import { getDb } from '@/lib/db';
import type { Employee, Allowance, Deduction, PayrollRecord, PayrollSettings, ExchangeRate, Currency } from '@/lib/constants';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { getEmployees } from './employeeActions';
import { getAttendanceRecords } from './attendanceActions';
import { getLeaveRequests } from './leaveActions';
import { parse, differenceInMinutes, getDaysInMonth, isWithinInterval, format, eachDayOfInterval, isWeekend, parseISO, lastDayOfMonth, isBefore, isEqual } from 'date-fns';
// import { arSA } from 'date-fns/locale'; // For Arabic day names if needed - not currently used directly

export async function getExchangeRates(): Promise<ExchangeRate[]> {
  const db = await getDb();
  return db.data.exchangeRates || [];
}

export async function addExchangeRate(rateData: Omit<ExchangeRate, 'id'>): Promise<ExchangeRate> {
  const db = await getDb();
  // Basic validation: ensure date is not in the future and rate is positive
  if (isBefore(new Date(), parseISO(rateData.date))) {
      throw new Error("لا يمكن إضافة سعر صرف بتاريخ مستقبلي.");
  }
  if (rateData.rate <= 0) {
      throw new Error("يجب أن يكون سعر الصرف قيمة موجبة.");
  }
  // Check if a rate for this exact date already exists
  const existingRate = db.data.exchangeRates.find((r: ExchangeRate) => r.date === rateData.date);
  if (existingRate) {
      throw new Error(`يوجد سعر صرف مسجل بالفعل لهذا التاريخ: ${rateData.date}. يرجى تعديله أو استخدام تاريخ مختلف.`);
  }

  const newRate: ExchangeRate = {
    id: uuidv4(),
    ...rateData,
  };
  db.data.exchangeRates.push(newRate);
  // Keep rates sorted by date for easier lookup
  db.data.exchangeRates.sort((a: ExchangeRate, b: ExchangeRate) => new Date(b.date).getTime() - new Date(a.date).getTime());
  await db.write();
  revalidatePath('/payroll'); // Or a dedicated settings/exchange rates page
  return newRate;
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

  const existingEmployee = db.data.employees[employeeIndex];
  const updatedEmployee: Employee = {
    ...existingEmployee,
    payrollSettings: {
      baseSalary: settings.baseSalary === undefined ? (existingEmployee.payrollSettings?.baseSalary || 0) : Number(settings.baseSalary),
      currency: settings.currency || existingEmployee.payrollSettings?.currency || 'SYP',
      allowances: settings.allowances || existingEmployee.payrollSettings?.allowances || [],
      deductions: settings.deductions || existingEmployee.payrollSettings?.deductions || [],
    }
  };

  db.data.employees[employeeIndex] = updatedEmployee;
  await db.write();
  revalidatePath('/payroll');
  revalidatePath(`/employees`); 
  return updatedEmployee;
}

export async function getPayrollHistory(employeeId: string): Promise<PayrollRecord[]> {
  const db = await getDb();
  const employee = db.data.employees.find((emp: Employee) => emp.id === employeeId);
  return employee?.payrollHistory || [];
}

// Constants for payroll calculation - can be moved to settings later
const HOURS_PER_WORK_DAY = 8; // This should be configurable per shift/employee in future
const LATE_DEDUCTION_PER_HOUR_RATE = 0.1; 
const ABSENT_DEDUCTION_DAILY_RATE_FACTOR = 1;

async function getRelevantExchangeRate(dateForRate: Date, db: any): Promise<ExchangeRate | null> {
    const rates: ExchangeRate[] = db.data.exchangeRates || [];
    if (rates.length === 0) return null;

    // Find the most recent rate that is on or before the dateForRate
    const sortedRates = rates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort descending by date
    
    for (const rate of sortedRates) {
        const rateDate = parseISO(rate.date);
        if (isBefore(rateDate, dateForRate) || isEqual(rateDate, dateForRate)) {
            return rate;
        }
    }
    // If no rate is found on or before, it means all rates are in the future, or list is empty.
    // Or, if we need the oldest rate if all are newer (should not happen if rates are added chronologically for past/present)
    // For payroll, we typically need a rate *up to* the payroll date.
    return null; // Or handle as an error: "No exchange rate found for the period"
}


export async function calculateMonthlyPayroll(
  employeeId: string,
  month: number, // 1-12
  year: number
): Promise<{ success: boolean; message: string; payrollRecord?: PayrollRecord }> {
  const db = await getDb();
  const employee = db.data.employees.find((emp: Employee) => emp.id === employeeId);

  if (!employee || !employee.payrollSettings) {
    return { success: false, message: 'لم يتم العثور على الموظف أو إعدادات راتبه.' };
  }
  if (employee.payrollSettings.baseSalary === undefined || employee.payrollSettings.baseSalary === null) {
    return { success: false, message: 'لم يتم تحديد الراتب الأساسي للموظف.' };
  }
  if (!employee.payrollSettings.currency) {
    return { success: false, message: 'لم يتم تحديد عملة الراتب الأساسي للموظف.' };
  }

  const { baseSalary, currency: baseCurrency, allowances = [], deductions: fixedDeductions = [] } = employee.payrollSettings;

  const allAttendance = await getAttendanceRecords();
  const allLeaves = await getLeaveRequests();

  const periodStartDate = new Date(year, month - 1, 1);
  const periodEndDate = lastDayOfMonth(periodStartDate);

  // Get exchange rate for the period (e.g., end of month rate)
  const exchangeRateInfo = await getRelevantExchangeRate(periodEndDate, db);
  let usdToSypRate: number | undefined = undefined;
  if (baseCurrency === 'USD' || baseCurrency === 'SYP') { // Need rate if converting
      if (!exchangeRateInfo) {
          return { success: false, message: `لم يتم العثور على سعر صرف للدولار مقابل الليرة السورية للفترة المحددة (${format(periodEndDate, 'yyyy-MM-dd')}). يرجى إضافته.` };
      }
      usdToSypRate = exchangeRateInfo.rate;
  }


  const employeeAttendance = allAttendance.filter(
    (r) =>
      r.employeeId === employeeId &&
      isWithinInterval(parseISO(r.date), { start: periodStartDate, end: periodEndDate })
  );

  const employeeLeaves = allLeaves.filter(
    (l) =>
      l.employeeId === employeeId &&
      l.status === 'approved' &&
      (isWithinInterval(parseISO(l.startDate), { start: periodStartDate, end: periodEndDate }) ||
       isWithinInterval(parseISO(l.endDate), { start: periodStartDate, end: periodEndDate }))
  );
  
  const daysInMonth = getDaysInMonth(periodStartDate);
  let workingDaysInMonth = 0;
  let approvedLeaveDays = 0;
  let actualWorkedDays = 0;
  let totalLateMinutesAggregated = 0;
  let totalAbsentDaysAggregated = 0;

  const monthDates = eachDayOfInterval({ start: periodStartDate, end: periodEndDate });
  
  // Simplified working day calculation (assumes Mon-Thu work, Fri/Sat weekend for Syria as an example)
  // This needs to be configurable based on company policy / shifts
  monthDates.forEach(currentDate => {
    const dayOfWeek = currentDate.getDay(); // 0 (Sun) to 6 (Sat)
    if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Not Friday or Saturday
        workingDaysInMonth++;
    }

    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const attendanceOnDay = employeeAttendance.find(r => r.date === dateStr);
    const leaveOnDay = employeeLeaves.find(l => 
        isWithinInterval(currentDate, {start: parseISO(l.startDate), end: parseISO(l.endDate)})
    );

    if (leaveOnDay) { // Assuming approved leave is paid and counts as a working day for salary calc, but not for "actual work" metrics
        approvedLeaveDays++;
    } else if (attendanceOnDay) {
        actualWorkedDays++;
        if (attendanceOnDay.status === 'late') {
            // Placeholder: actual lateness calculation requires shift data
            // For now, assume any record with status 'late' means some lateness.
            // This should be replaced by actual minutes from shift comparison.
            const officialStartTime = parse(`${dateStr} 09:00`, 'yyyy-MM-dd HH:mm', new Date()); // Placeholder
            const clockInTime = parse(`${dateStr} ${attendanceOnDay.clockIn}`, 'yyyy-MM-dd HH:mm', new Date());
            if (isValid(clockInTime) && isValid(officialStartTime) && differenceInMinutes(clockInTime, officialStartTime) > 0) {
                 totalLateMinutesAggregated += differenceInMinutes(clockInTime, officialStartTime);
            }
        }
    } else {
        // If it's a working day (not weekend, not on leave) and no attendance, it's an absence
        if (dayOfWeek !== 5 && dayOfWeek !== 6) {
            totalAbsentDaysAggregated++;
        }
    }
  });

  const dailyRate = baseSalary / (workingDaysInMonth || daysInMonth); 
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
  
  let earnedSalaryBeforeAllowances = baseSalary - salaryDeductionsForAbsence - salaryDeductionsForLateness;
  earnedSalaryBeforeAllowances = Math.max(0, earnedSalaryBeforeAllowances); 

  const totalAllowancesValue = allowances.reduce((sum, item) => sum + item.amount, 0);
  const totalFixedDeductionsValue = fixedDeductions.reduce((sum, item) => sum + item.amount, 0);
  
  const totalPerformanceDeductions = salaryDeductionsForAbsence + salaryDeductionsForLateness;
  const overallTotalDeductions = totalFixedDeductionsValue + totalPerformanceDeductions;

  const netSalaryInBase = earnedSalaryBeforeAllowances + totalAllowancesValue - totalFixedDeductionsValue;
  
  let netSalaryInConverted: number | undefined = undefined;
  let convertedCurrencyVal: Currency | undefined = undefined;

  if (usdToSypRate) {
    if (baseCurrency === 'SYP') {
        netSalaryInConverted = netSalaryInBase / usdToSypRate;
        convertedCurrencyVal = 'USD';
    } else if (baseCurrency === 'USD') {
        netSalaryInConverted = netSalaryInBase * usdToSypRate;
        convertedCurrencyVal = 'SYP';
    }
  }


  const newPayrollRecord: PayrollRecord = {
    id: uuidv4(),
    employeeId: employee.id,
    month,
    year,
    baseSalarySnapshot: baseSalary,
    baseSalaryCurrency: baseCurrency,
    grossSalary: parseFloat(baseSalary.toFixed(2)), // Typically base salary before month-specific deductions, or base + allowances. For now, using baseSalary.
    totalAllowances: parseFloat(totalAllowancesValue.toFixed(2)),
    totalDeductions: parseFloat(overallTotalDeductions.toFixed(2)),
    netSalaryInBaseCurrency: parseFloat(netSalaryInBase.toFixed(2)),
    exchangeRateApplied: usdToSypRate,
    convertedToCurrency: convertedCurrencyVal,
    netSalaryInConvertedCurrency: netSalaryInConverted !== undefined ? parseFloat(netSalaryInConverted.toFixed(2)) : undefined,
    calculationDate: new Date().toISOString(),
    attendanceSummary: {
      totalWorkingHours: actualWorkedDays * HOURS_PER_WORK_DAY, 
      totalLateMinutes: totalLateMinutesAggregated,
      totalAbsentDays: totalAbsentDaysAggregated,
      daysInMonth: daysInMonth,
      workingDaysInMonth: workingDaysInMonth, 
      actualWorkedDays: actualWorkedDays,
    },
    notes: `تم الحساب بناءً على ${actualWorkedDays} أيام عمل فعلية، ${approvedLeaveDays} أيام إجازة. سعر الصرف المستخدم (USD to SYP): ${usdToSypRate || 'N/A'}`,
  };

  if (!employee.payrollHistory) {
    employee.payrollHistory = [];
  }
  
  employee.payrollHistory = employee.payrollHistory.filter(p => !(p.month === month && p.year === year));
  employee.payrollHistory.push(newPayrollRecord);

  const employeeIndex = db.data.employees.findIndex((emp_item: Employee) => emp_item.id === employeeId);
  if (employeeIndex !== -1) {
    db.data.employees[employeeIndex] = employee;
    await db.write();
  }


  revalidatePath('/payroll');
  return { success: true, message: `تم حساب وحفظ كشف راتب شهر ${month}/${year} للموظف ${employee.name} بنجاح.`, payrollRecord: newPayrollRecord };
}

