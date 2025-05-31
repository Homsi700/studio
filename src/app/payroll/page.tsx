
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Loader2, Calculator, History, X } from "lucide-react";
import type { Employee, Allowance, Deduction, PayrollRecord, PayrollSettings } from '@/lib/constants';
import { getEmployees } from '@/actions/employeeActions';
import { updateEmployeePayrollSettings, calculateMonthlyPayroll, getPayrollHistory } from '@/actions/payrollActions';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // For Edit Salary Info Dialog
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [currentBaseSalary, setCurrentBaseSalary] = useState<number | string>('');
  const [currentAllowances, setCurrentAllowances] = useState<Allowance[]>([]);
  const [currentDeductions, setCurrentDeductions] = useState<Deduction[]>([]);

  // For Calculate Payroll Dialog
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [selectedEmployeeIdForCalc, setSelectedEmployeeIdForCalc] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth()).toString()); // Default to previous month
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [calculationResult, setCalculationResult] = useState<PayrollRecord | null>(null);

  // For Payroll History Dialog
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);


  const fetchEmployeesData = async () => {
    setIsLoading(true);
    try {
      const fetchedEmployees = await getEmployees();
      setEmployees(fetchedEmployees);
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في جلب بيانات الموظفين.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesData();
  }, []);

  const openEditModal = (employee: Employee) => {
    setCurrentEmployee(employee);
    setCurrentBaseSalary(employee.baseSalary !== undefined ? employee.baseSalary : '');
    setCurrentAllowances(employee.allowances ? JSON.parse(JSON.stringify(employee.allowances)) : []);
    setCurrentDeductions(employee.deductions ? JSON.parse(JSON.stringify(employee.deductions)) : []);
    setIsEditModalOpen(true);
  };

  const handleAddItem = (type: 'allowance' | 'deduction') => {
    const newItem = { id: uuidv4(), name: '', amount: 0 };
    if (type === 'allowance') {
      setCurrentAllowances(prev => [...prev, newItem]);
    } else {
      setCurrentDeductions(prev => [...prev, newItem]);
    }
  };

  const handleItemChange = (id: string, field: 'name' | 'amount', value: string | number, type: 'allowance' | 'deduction') => {
    const updater = type === 'allowance' ? setCurrentAllowances : setCurrentDeductions;
    updater(prev => prev.map(item => item.id === id ? { ...item, [field]: field === 'amount' ? Number(value) || 0 : value } : item));
  };
  
  const handleRemoveItem = (id: string, type: 'allowance' | 'deduction') => {
    const updater = type === 'allowance' ? setCurrentAllowances : setCurrentDeductions;
    updater(prev => prev.filter(item => item.id !== id));
  };

  const handleSavePayrollSettings = async () => {
    if (!currentEmployee) return;
    setIsSubmitting(true);
    const settings: PayrollSettings = {
      baseSalary: Number(currentBaseSalary) || 0,
      allowances: currentAllowances.filter(a => a.name.trim() !== ''),
      deductions: currentDeductions.filter(d => d.name.trim() !== ''),
    };
    try {
      const updated = await updateEmployeePayrollSettings(currentEmployee.id, settings);
      if (updated) {
        toast({ title: "نجاح", description: "تم تحديث معلومات الراتب بنجاح." });
        await fetchEmployeesData(); // Refresh employee list
        setIsEditModalOpen(false);
      } else {
        toast({ title: "خطأ", description: "فشل في تحديث معلومات الراتب.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ", description: "حدث خطأ غير متوقع.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCalculatePayroll = async () => {
    if (!selectedEmployeeIdForCalc || !selectedMonth || !selectedYear) {
        toast({ title: "خطأ", description: "يرجى اختيار الموظف والشهر والسنة.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    setCalculationResult(null);
    try {
        const result = await calculateMonthlyPayroll(selectedEmployeeIdForCalc, parseInt(selectedMonth) + 1, parseInt(selectedYear));
        if (result.success && result.payrollRecord) {
            toast({ title: "نجاح", description: result.message });
            setCalculationResult(result.payrollRecord);
            await fetchEmployeesData(); // Refresh employee data as payrollHistory is updated
        } else {
            toast({ title: "خطأ", description: result.message, variant: "destructive" });
        }
    } catch (error) {
        toast({ title: "خطأ في النظام", description: "فشل في حساب كشف الراتب.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const openHistoryModal = async (employee: Employee) => {
    setHistoryEmployee(employee);
    setIsHistoryModalOpen(true);
    setIsLoadingHistory(true);
    setPayrollHistory([]);
    try {
      const history = await getPayrollHistory(employee.id);
      setPayrollHistory(history);
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في جلب سجل الرواتب.", variant: "destructive" });
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  const months = Array.from({length: 12}, (_, i) => ({ value: i.toString(), label: new Date(0, i).toLocaleString('ar-SA', { month: 'long' }) }));
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => (currentYear - i).toString());


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">إدارة الرواتب</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">معلومات رواتب الموظفين</CardTitle>
          <CardDescription className="font-body">عرض وتعديل معلومات الرواتب الأساسية لكل موظف.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="font-body ml-2">جاري تحميل الموظفين...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body">الموظف</TableHead>
                  <TableHead className="font-body">الراتب الأساسي</TableHead>
                  <TableHead className="font-body">إجمالي البدلات</TableHead>
                  <TableHead className="font-body">إجمالي الخصومات (الافتراضية)</TableHead>
                  <TableHead className="font-body text-center">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image 
                            src={employee.avatarUrl || `https://placehold.co/40x40.png?text=${encodeURIComponent(employee.name.charAt(0))}`} 
                            alt={employee.name} width={40} height={40} className="rounded-full" data-ai-hint="person avatar" unoptimized/>
                        <span className="font-semibold font-body">{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-body">{employee.baseSalary !== undefined ? `${employee.baseSalary.toLocaleString()} د.س` : 'غير محدد'}</TableCell>
                    <TableCell className="font-body">{(employee.allowances || []).reduce((sum, a) => sum + a.amount, 0).toLocaleString()} د.س</TableCell>
                    <TableCell className="font-body">{(employee.deductions || []).reduce((sum, d) => sum + d.amount, 0).toLocaleString()} د.س</TableCell>
                    <TableCell className="text-center space-x-1">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(employee)} className="font-body">
                        <Edit className="mr-1 h-3 w-3" /> تعديل
                      </Button>
                       <Button variant="outline" size="sm" onClick={() => openHistoryModal(employee)} className="font-body">
                        <History className="mr-1 h-3 w-3" /> السجل
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="font-headline">حساب كشوف الرواتب الشهرية</CardTitle>
            <CardDescription className="font-body">
                اختر الموظف والشهر والسنة لحساب وحفظ كشف الراتب.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <Label htmlFor="calcEmployee" className="font-body">الموظف</Label>
                    <Select value={selectedEmployeeIdForCalc} onValueChange={setSelectedEmployeeIdForCalc}>
                        <SelectTrigger id="calcEmployee" className="font-body">
                            <SelectValue placeholder="اختر موظفاً" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map(emp => <SelectItem key={emp.id} value={emp.id} className="font-body">{emp.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="calcMonth" className="font-body">الشهر</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger id="calcMonth" className="font-body">
                            <SelectValue placeholder="اختر شهراً" />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map(m => <SelectItem key={m.value} value={m.value} className="font-body">{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="calcYear" className="font-body">السنة</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger id="calcYear" className="font-body">
                            <SelectValue placeholder="اختر سنة" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y} className="font-body">{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-4">
            <Button onClick={handleCalculatePayroll} disabled={isSubmitting || !selectedEmployeeIdForCalc} className="font-body">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                حساب وحفظ كشف الراتب
            </Button>
            {calculationResult && (
                <Card className="w-full">
                    <CardHeader><CardTitle className="font-headline text-lg">نتيجة الحساب لـ {employees.find(e=>e.id === selectedEmployeeIdForCalc)?.name} - {months.find(m=>m.value === selectedMonth)?.label} {selectedYear}</CardTitle></CardHeader>
                    <CardContent className="text-sm font-body space-y-1">
                        <p>الراتب الإجمالي (الأساسي): {calculationResult.grossSalary.toLocaleString()} د.س</p>
                        <p>إجمالي البدلات: {calculationResult.totalAllowances.toLocaleString()} د.س</p>
                        <p>إجمالي الخصومات (تشمل التأخير/الغياب والخصومات اليدوية): {calculationResult.totalDeductions.toLocaleString()} د.س</p>
                        <p className="font-semibold text-primary">صافي الراتب المستحق: {calculationResult.netSalary.toLocaleString()} د.س</p>
                        <p className="text-xs text-muted-foreground">ملخص الحضور: أيام العمل الفعلية: {calculationResult.attendanceSummary.actualWorkedDays}, أيام الغياب: {calculationResult.attendanceSummary.totalAbsentDays}, إجمالي دقائق التأخير: {calculationResult.attendanceSummary.totalLateMinutes}</p>
                        <p className="text-xs text-muted-foreground">ملاحظات: {calculationResult.notes}</p>
                    </CardContent>
                </Card>
            )}
        </CardFooter>
      </Card>

      {/* Edit Salary Info Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">تعديل معلومات راتب: {currentEmployee?.name}</DialogTitle>
            <DialogDescription className="font-body">
              أدخل الراتب الأساسي وقم بإدارة البدلات والخصومات المتكررة للموظف.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto px-2">
            <div>
              <Label htmlFor="baseSalary" className="font-body">الراتب الأساسي الشهري (د.س)</Label>
              <Input id="baseSalary" type="number" value={currentBaseSalary} onChange={(e) => setCurrentBaseSalary(e.target.value)} className="font-body mt-1" placeholder="مثال: 50000" />
            </div>

            {['allowance', 'deduction'].map(type => (
              <div key={type}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-headline text-lg">{type === 'allowance' ? 'البدلات' : 'الخصومات (الافتراضية/المتكررة)'}</h3>
                  <Button variant="outline" size="sm" onClick={() => handleAddItem(type as 'allowance' | 'deduction')} className="font-body">
                    <PlusCircle className="mr-1 h-4 w-4" /> إضافة {type === 'allowance' ? 'بدل' : 'خصم'}
                  </Button>
                </div>
                {(type === 'allowance' ? currentAllowances : currentDeductions).map((item, index) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center mb-2 p-2 border rounded-md">
                    <Input 
                      value={item.name} 
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value, type as 'allowance' | 'deduction')} 
                      placeholder={type === 'allowance' ? "اسم البدل (مثال: بدل سكن)" : "اسم الخصم (مثال: سلفة)"}
                      className="font-body" 
                    />
                    <Input 
                      type="number" 
                      value={item.amount} 
                      onChange={(e) => handleItemChange(item.id, 'amount', e.target.value, type as 'allowance' | 'deduction')} 
                      placeholder="المبلغ" 
                      className="font-body w-32"
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id, type as 'allowance' | 'deduction')} className="text-destructive hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(type === 'allowance' ? currentAllowances.length === 0 : currentDeductions.length === 0) && (
                    <p className="text-sm text-muted-foreground font-body">لا يوجد {type === 'allowance' ? 'بدلات' : 'خصومات'} حالياً.</p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="font-body" disabled={isSubmitting}>إلغاء</Button>
            <Button onClick={handleSavePayrollSettings} className="font-body" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              حفظ المعلومات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payroll History Dialog */}
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline">سجل الرواتب لـ: {historyEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : payrollHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">الشهر/السنة</TableHead>
                    <TableHead className="font-body">الراتب الإجمالي</TableHead>
                    <TableHead className="font-body">إجمالي البدلات</TableHead>
                    <TableHead className="font-body">إجمالي الخصومات</TableHead>
                    <TableHead className="font-body">صافي الراتب</TableHead>
                    <TableHead className="font-body">تاريخ الحساب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollHistory.sort((a,b) => new Date(b.calculationDate).getTime() - new Date(a.calculationDate).getTime()).map(record => (
                    <TableRow key={record.id}>
                      <TableCell className="font-body">{record.month}/{record.year}</TableCell>
                      <TableCell className="font-body">{record.grossSalary.toLocaleString()} د.س</TableCell>
                      <TableCell className="font-body">{record.totalAllowances.toLocaleString()} د.س</TableCell>
                      <TableCell className="font-body">{record.totalDeductions.toLocaleString()} د.س</TableCell>
                      <TableCell className="font-body font-semibold">{record.netSalary.toLocaleString()} د.س</TableCell>
                      <TableCell className="font-body">{new Date(record.calculationDate).toLocaleDateString('ar-SA')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground font-body py-4">لا يوجد سجل رواتب لهذا الموظف.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)} className="font-body">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
