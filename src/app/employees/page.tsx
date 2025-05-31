
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Search, Loader2 } from "lucide-react";
import type { Employee, Currency, PayrollSettings } from '@/lib/constants';
import { CURRENCIES } from '@/lib/constants';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from '@/actions/employeeActions';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";


export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee> & { payrollSettings?: Partial<PayrollSettings> } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const fetchedEmployees = await getEmployees();
      setEmployees(fetchedEmployees);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast({ title: "خطأ", description: "فشل في جلب بيانات الموظفين.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.department && emp.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (emp.jobTitle && emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddEmployee = () => {
    setCurrentEmployee({ payrollSettings: { currency: 'SYP', baseSalary: 0 } });
    setIsFormOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setCurrentEmployee({
      ...employee,
      payrollSettings: employee.payrollSettings || { currency: 'SYP', baseSalary: 0 }
    });
    setIsFormOpen(true);
  };

  const handleDeleteEmployee = async (id: string) => {
    const employeeToDelete = employees.find(emp => emp.id === id);
    if (employeeToDelete) setCurrentEmployee(employeeToDelete);
    setIsSubmitting(true);
    try {
      await deleteEmployee(id);
      toast({ title: "نجاح", description: "تم حذف الموظف بنجاح." });
      await fetchEmployees(); 
    } catch (error) {
      console.error("Failed to delete employee:", error);
      toast({ title: "خطأ", description: "فشل في حذف الموظف.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setCurrentEmployee(null); 
    }
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const employeeData = {
      name: formData.get('name') as string,
      department: formData.get('department') as string,
      jobTitle: formData.get('jobTitle') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      pin: formData.get('pin') as string,
      payrollSettings: {
        baseSalary: parseFloat(formData.get('baseSalary') as string) || 0,
        currency: formData.get('currency') as Currency || 'SYP',
      }
    };

    try {
      if (currentEmployee && currentEmployee.id) { 
        await updateEmployee(currentEmployee.id, employeeData);
        toast({ title: "نجاح", description: "تم تعديل بيانات الموظف بنجاح." });
      } else { 
        await addEmployee(employeeData);
        toast({ title: "نجاح", description: "تمت إضافة الموظف بنجاح." });
      }
      await fetchEmployees(); 
      setIsFormOpen(false);
      setCurrentEmployee(null);
    } catch (error) {
      console.error("Failed to save employee:", error);
      toast({ title: "خطأ", description: "فشل في حفظ بيانات الموظف.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">إدارة الموظفين</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="font-headline">قائمة الموظفين</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="بحث..." 
                  className="pl-10 w-full sm:w-64 font-body"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={handleAddEmployee} className="font-body">
                <PlusCircle className="mr-2 h-4 w-4" /> إضافة موظف
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="font-body ml-2">جاري تحميل الموظفين...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">الصورة</TableHead>
                    <TableHead className="font-body">الاسم</TableHead>
                    <TableHead className="font-body">القسم</TableHead>
                    <TableHead className="font-body">المسمى الوظيفي</TableHead>
                    <TableHead className="font-body">الراتب الأساسي</TableHead>
                    <TableHead className="font-body text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Image 
                          src={employee.avatarUrl || `https://placehold.co/40x40.png?text=${encodeURIComponent(employee.name.charAt(0))}`} 
                          alt={employee.name} 
                          width={40} height={40} 
                          className="rounded-full" 
                          data-ai-hint="person avatar"
                          unoptimized 
                        />
                      </TableCell>
                      <TableCell className="font-semibold font-body">{employee.name}</TableCell>
                      <TableCell className="font-body">{employee.department}</TableCell>
                      <TableCell className="font-body">{employee.jobTitle}</TableCell>
                      <TableCell className="font-body">
                        {employee.payrollSettings?.baseSalary?.toLocaleString() || '0'} {employee.payrollSettings?.currency || 'SYP'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleEditEmployee(employee)} disabled={isSubmitting}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteEmployee(employee.id)} disabled={isSubmitting && currentEmployee?.id === employee.id}>
                           {isSubmitting && currentEmployee?.id === employee.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredEmployees.length === 0 && !isLoading && (
                <p className="text-center py-4 text-muted-foreground font-body">لا يوجد موظفون.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsFormOpen(isOpen); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline">{currentEmployee?.id ? 'تعديل موظف' : 'إضافة موظف جديد'}</DialogTitle>
            <DialogDescription className="font-body">
              {currentEmployee?.id ? 'قم بتحديث بيانات الموظف.' : 'أدخل بيانات الموظف الجديد.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right font-body">الاسم</Label>
              <Input id="name" name="name" defaultValue={currentEmployee?.name || ''} className="col-span-3 font-body" required disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right font-body">القسم</Label>
              <Input id="department" name="department" defaultValue={currentEmployee?.department || ''} className="col-span-3 font-body" required disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jobTitle" className="text-right font-body">المسمى الوظيفي</Label>
              <Input id="jobTitle" name="jobTitle" defaultValue={currentEmployee?.jobTitle || ''} className="col-span-3 font-body" required disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right font-body">البريد الإلكتروني</Label>
              <Input id="email" name="email" type="email" defaultValue={currentEmployee?.email || ''} className="col-span-3 font-body" required disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right font-body">الهاتف</Label>
              <Input id="phone" name="phone" defaultValue={currentEmployee?.phone || ''} className="col-span-3 font-body" disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pin" className="text-right font-body">الرقم السري (PIN)</Label>
              <Input id="pin" name="pin" type="password" placeholder={currentEmployee?.id ? "اتركه فارغاً لعدم التغيير" : "4-6 أرقام"} className="col-span-3 font-body" disabled={isSubmitting} pattern="\d{4,6}" title="يجب أن يكون الرقم السري من 4 إلى 6 أرقام"/>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baseSalary" className="text-right font-body">الراتب الأساسي</Label>
              <Input id="baseSalary" name="baseSalary" type="number" defaultValue={currentEmployee?.payrollSettings?.baseSalary || 0} className="col-span-3 font-body" disabled={isSubmitting} step="any" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right font-body">عملة الراتب</Label>
              <Select name="currency" defaultValue={currentEmployee?.payrollSettings?.currency || 'SYP'} disabled={isSubmitting}>
                <SelectTrigger className="col-span-3 font-body">
                  <SelectValue placeholder="اختر العملة" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c} className="font-body">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="font-body" disabled={isSubmitting}>إلغاء</Button>
              <Button type="submit" className="font-body" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                حفظ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
