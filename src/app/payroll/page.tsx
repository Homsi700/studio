
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Loader2, Calculator, History, X, Settings2, Coins } from "lucide-react";
import type { Employee, Allowance, Deduction, PayrollRecord, PayrollSettings, Currency, ExchangeRate } from '@/lib/constants';
import { CURRENCIES } from '@/lib/constants';
import { getEmployees } from '@/actions/employeeActions';
import { updateEmployeePayrollSettings, calculateMonthlyPayroll, getPayrollHistory, getExchangeRates, addExchangeRate } from '@/actions/payrollActions';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [currentPayrollSettings, setCurrentPayrollSettings] = useState<PayrollSettings>({ baseSalary: 0, currency: 'SYP', allowances: [], deductions: [] });
  
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [selectedEmployeeIdForCalc, setSelectedEmployeeIdForCalc] = useState<string>('');
  const initialMonth = (new Date().getMonth()).toString(); // 0-11 for Date object, adjust if needed
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [calculationResult, setCalculationResult] = useState<PayrollRecord | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);
  const [payrollHistory, setPayrollHistory] = useState<PayrollRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isExchangeRateModalOpen, setIsExchangeRateModalOpen] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [newRateDate, setNewRateDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [newRateValue, setNewRateValue] = useState<string>('');


  const fetchPageData = async () => {
    setIsLoading(true);
    try {
      const [fetchedEmployees, fetchedRates] = await Promise.all([
        getEmployees(),
        getExchangeRates()
      ]);
      setEmployees(fetchedEmployees.map(emp => ({
        ...emp,
        payrollSettings: emp.payrollSettings || { baseSalary: 0, currency: 'SYP', allowances: [], deductions: [] }
      })));
      setExchangeRates(fetchedRates.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في جلب بيانات الصفحة.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  const openEditModal = (employee: Employee) => {
    setCurrentEmployee(employee);
    setCurrentPayrollSettings(JSON.parse(JSON.stringify(employee.payrollSettings || { baseSalary: 0, currency: 'SYP', allowances: [], deductions: [] })));
    setIsEditModalOpen(true);
  };

  const handleAddItem = (type: 'allowance' | 'deduction') => {
    const newItem = { id: uuidv4(), name: '', amount: 0 };
    setCurrentPayrollSettings(prev => ({
        ...prev,
        [type === 'allowance' ? 'allowances' : 'deductions']: [
            ...(prev[type === 'allowance' ? 'allowances' : 'deductions'] || []),
            newItem
        ]
    }));
  };

  const handleItemChange = (id: string, field: 'name' | 'amount', value: string | number, type: 'allowance' | 'deduction') => {
     setCurrentPayrollSettings(prev => ({
        ...prev,
        [type === 'allowance' ? 'allowances' : 'deductions']: (prev[type === 'allowance' ? 'allowances' : 'deductions'] || []).map(item =>
            item.id === id ? { ...item, [field]: field === 'amount' ? Number(value) || 0 : value } : item
        )
    }));
  };
  
  const handleRemoveItem = (id: string, type: 'allowance' | 'deduction') => {
    setCurrentPayrollSettings(prev => ({
        ...prev,
        [type === 'allowance' ? 'allowances' : 'deductions']: (prev[type === 'allowance' ? 'allowances' : 'deductions'] || []).filter(item => item.id !== id)
    }));
  };

  const handleSavePayrollSettings = async () => {
    if (!currentEmployee || !currentPayrollSettings) return;
    setIsSubmitting(true);
    
    const settingsToSave: PayrollSettings = {
      ...currentPayrollSettings,
      baseSalary: Number(currentPayrollSettings.baseSalary) || 0,
      currency: currentPayrollSettings.currency || 'SYP',
      allowances: (currentPayrollSettings.allowances || []).filter(a => a.name.trim() !== ''),
      deductions: (currentPayrollSettings.deductions || []).filter(d => d.name.trim() !== ''),
    };

    try {
      const updated = await updateEmployeePayrollSettings(currentEmployee.id, settingsToSave);
      if (updated) {
        toast({ title: "نجاح", description: "تم تحديث معلومات الراتب بنجاح." });
        await fetchPageData(); 
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
        const result = await calculateMonthlyPayroll(selectedEmployeeIdForCalc, parseInt(selectedMonth) + 1, parseInt(selectedYear)); // Month is 1-12 for action
        if (result.success && result.payrollRecord) {
            toast({ title: "نجاح", description: result.message });
            setCalculationResult(result.payrollRecord);
            await fetchPageData(); 
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

  const handleAddExchangeRate = async () => {
    if (!newRateDate || !newRateValue || parseFloat(newRateValue) <= 0) {
      toast({ title: "خطأ في الإدخال", description: "يرجى إدخال تاريخ صحيح وسعر صرف موجب.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await addExchangeRate({ date: newRateDate, rate: parseFloat(newRateValue) });
      toast({ title: "نجاح", description: "تم إضافة سعر الصرف بنجاح." });
      setNewRateDate(format(new Date(), 'yyyy-MM-dd'));
      setNewRateValue('');
      await fetchPageData(); 
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message || "فشل في إضافة سعر الصرف.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const months = Array.from({length: 12}, (_, i) => {
    const monthName = new Date(0, i).toLocaleString('ar-SA-u-nu-latn', { month: 'long' }); // u-nu-latn for Arabic numerals
    return { value: i.toString(), label: `${monthName} (${i + 1})` };
  });
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => (currentYear - i).toString());


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">إدارة الرواتب</h1>
        <Button variant="outline" onClick={() => setIsExchangeRateModalOpen(true)} className="font-body">
          <Coins className="mr-2 h-4 w-4" /> إدارة أسعار الصرف
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">معلومات رواتب الموظفين</CardTitle>
          <CardDescription className="font-body">عرض وتعديل معلومات الرواتب الأساسية لكل موظف.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                    <TableCell className="font-body">
                        {employee.payrollSettings?.baseSalary?.toLocaleString() || '0'} {employee.payrollSettings?.currency}
                    </TableCell>
                    <TableCell className="font-body">
                        {(employee.payrollSettings?.allowances || []).reduce((sum, a) => sum + a.amount, 0).toLocaleString()} {employee.payrollSettings?.currency}
                    </TableCell>
                    <TableCell className="font-body">
                        {(employee.payrollSettings?.deductions || []).reduce((sum, d) => sum + d.amount, 0).toLocaleString()} {employee.payrollSettings?.currency}
                    </TableCell>
                    <TableCell className="text-center space-x-1">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(employee)} className="font-body">
                        <Settings2 className="mr-1 h-3 w-3" /> تعديل الإعدادات
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
                        <p>الراتب الأساسي: {calculationResult.baseSalarySnapshot.toLocaleString()} {calculationResult.baseSalaryCurrency}</p>
                        <p>إجمالي البدلات: {calculationResult.totalAllowances.toLocaleString()} {calculationResult.baseSalaryCurrency}</p>
                        <p>إجمالي الخصومات (أداء + ثابتة): {calculationResult.totalDeductions.toLocaleString()} {calculationResult.baseSalaryCurrency}</p>
                        <p className="font-semibold">صافي الراتب ({calculationResult.baseSalaryCurrency}): {calculationResult.netSalaryInBaseCurrency.toLocaleString()} {calculationResult.baseSalaryCurrency}</p>
                        {calculationResult.netSalaryInConvertedCurrency !== undefined && calculationResult.convertedToCurrency && (
                             <p className="font-semibold text-primary">صافي الراتب ({calculationResult.convertedToCurrency}): {calculationResult.netSalaryInConvertedCurrency.toLocaleString()} {calculationResult.convertedToCurrency} (سعر الصرف: {calculationResult.exchangeRateApplied})</p>
                        )}
                        <p className="text-xs text-muted-foreground">ملخص الحضور: أيام العمل الفعلية: {calculationResult.attendanceSummary.actualWorkedDays}, أيام الغياب: {calculationResult.attendanceSummary.totalAbsentDays}, إجمالي دقائق التأخير: {calculationResult.attendanceSummary.totalLateMinutes}</p>
                        <p className="text-xs text-muted-foreground">ملاحظات: {calculationResult.notes}</p>
                    </CardContent>
                </Card>
            )}
        </CardFooter>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">تعديل إعدادات راتب: {currentEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto px-2">
            <div>
              <Label htmlFor="baseSalaryEdit" className="font-body">الراتب الأساسي الشهري</Label>
              <Input id="baseSalaryEdit" type="number" value={currentPayrollSettings.baseSalary || ''} 
                     onChange={(e) => setCurrentPayrollSettings(s => ({...s, baseSalary: parseFloat(e.target.value) || 0}))} 
                     className="font-body mt-1" placeholder="مثال: 500000" />
            </div>
            <div>
              <Label htmlFor="currencyEdit" className="font-body">عملة الراتب</Label>
              <Select value={currentPayrollSettings.currency || 'SYP'} 
                      onValueChange={(value) => setCurrentPayrollSettings(s => ({...s, currency: value as Currency}))}>
                <SelectTrigger id="currencyEdit" className="font-body mt-1">
                  <SelectValue placeholder="اختر العملة" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c} value={c} className="font-body">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {['allowances', 'deductions'].map(type => (
              <div key={type}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-headline text-lg">{type === 'allowances' ? 'البدلات' : 'الخصومات (الافتراضية/المتكررة)'}</h3>
                  <Button variant="outline" size="sm" onClick={() => handleAddItem(type as 'allowance' | 'deduction')} className="font-body">
                    <PlusCircle className="mr-1 h-4 w-4" /> إضافة
                  </Button>
                </div>
                {(currentPayrollSettings[type as 'allowances' | 'deductions'] || []).map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center mb-2 p-2 border rounded-md">
                    <Input 
                      value={item.name} 
                      onChange={(e) => handleItemChange(item.id, 'name', e.target.value, type as 'allowance' | 'deduction')} 
                      placeholder={type === 'allowances' ? "اسم البدل" : "اسم الخصم"}
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
                {(currentPayrollSettings[type as 'allowances' | 'deductions'] || []).length === 0 && (
                    <p className="text-sm text-muted-foreground font-body">لا يوجد {type === 'allowances' ? 'بدلات' : 'خصومات'} حالياً.</p>
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
                    <TableHead className="font-body">صافي الراتب ({historyEmployee?.payrollSettings?.currency})</TableHead>
                    <TableHead className="font-body">صافي الراتب (محول)</TableHead>
                    <TableHead className="font-body">تاريخ الحساب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollHistory.sort((a,b) => new Date(b.calculationDate).getTime() - new Date(a.calculationDate).getTime()).map(record => (
                    <TableRow key={record.id}>
                      <TableCell className="font-body">{record.month}/{record.year}</TableCell>
                      <TableCell className="font-body font-semibold">{record.netSalaryInBaseCurrency.toLocaleString()} {record.baseSalaryCurrency}</TableCell>
                      <TableCell className="font-body">
                        {record.netSalaryInConvertedCurrency !== undefined && record.convertedToCurrency ? 
                         `${record.netSalaryInConvertedCurrency.toLocaleString()} ${record.convertedToCurrency} (x${record.exchangeRateApplied})`
                         : 'N/A'}
                      </TableCell>
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

      <Dialog open={isExchangeRateModalOpen} onOpenChange={setIsExchangeRateModalOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle className="font-headline">إدارة أسعار صرف الدولار الأمريكي (مقابل الليرة السورية)</DialogTitle>
                <DialogDescription className="font-body">
                    أضف أسعار صرف تاريخية. سيتم استخدام أحدث سعر صرف مطابق أو سابق لتاريخ حساب الراتب.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end">
                    <div>
                        <Label htmlFor="newRateDate" className="font-body">التاريخ</Label>
                        <Input id="newRateDate" type="date" value={newRateDate} onChange={e => setNewRateDate(e.target.value)} className="font-body mt-1" />
                    </div>
                    <div>
                        <Label htmlFor="newRateValue" className="font-body">سعر 1 USD (بالـ SYP)</Label>
                        <Input id="newRateValue" type="number" value={newRateValue} onChange={e => setNewRateValue(e.target.value)} className="font-body mt-1" placeholder="مثال: 14500" />
                    </div>
                    <Button onClick={handleAddExchangeRate} disabled={isSubmitting} className="font-body sm:self-end">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4"/>} إضافة
                    </Button>
                </div>
                <Card>
                    <CardHeader><CardTitle className="text-base font-headline">أسعار الصرف الحالية (الأحدث أولاً)</CardTitle></CardHeader>
                    <CardContent className="max-h-60 overflow-y-auto">
                        {exchangeRates.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>التاريخ</TableHead><TableHead>1 USD = SYP</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {exchangeRates.map(rate => (
                                        <TableRow key={rate.id}>
                                            <TableCell>{format(parseISO(rate.date), 'yyyy/MM/dd')}</TableCell>
                                            <TableCell>{rate.rate.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : <p className="text-muted-foreground text-sm font-body">لا توجد أسعار صرف مسجلة.</p>}
                    </CardContent>
                </Card>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsExchangeRateModalOpen(false)} className="font-body">إغلاق</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}


    