"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, Search } from "lucide-react";
import { mockEmployees, type Employee } from '@/lib/constants';
import Image from 'next/image';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Partial<Employee> | null>(null);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = () => {
    setCurrentEmployee({});
    setIsFormOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setCurrentEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    // Add server action call here
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newEmployeeData: Partial<Employee> = {
      name: formData.get('name') as string,
      department: formData.get('department') as string,
      jobTitle: formData.get('jobTitle') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
    };

    if (currentEmployee && currentEmployee.id) { // Editing
      setEmployees(prev => prev.map(emp => emp.id === currentEmployee.id ? { ...emp, ...newEmployeeData } as Employee : emp));
    } else { // Adding
      setEmployees(prev => [...prev, { ...newEmployeeData, id: String(Date.now()) } as Employee]);
    }
    // Add server action call here
    setIsFormOpen(false);
    setCurrentEmployee(null);
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">الصورة</TableHead>
                <TableHead className="font-body">الاسم</TableHead>
                <TableHead className="font-body">القسم</TableHead>
                <TableHead className="font-body">المسمى الوظيفي</TableHead>
                <TableHead className="font-body">البريد الإلكتروني</TableHead>
                <TableHead className="font-body">الهاتف</TableHead>
                <TableHead className="font-body text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <Image src={employee.avatarUrl || "https://placehold.co/40x40.png"} alt={employee.name} width={40} height={40} className="rounded-full" data-ai-hint="person avatar" />
                  </TableCell>
                  <TableCell className="font-semibold font-body">{employee.name}</TableCell>
                  <TableCell className="font-body">{employee.department}</TableCell>
                  <TableCell className="font-body">{employee.jobTitle}</TableCell>
                  <TableCell className="font-body">{employee.email}</TableCell>
                  <TableCell className="font-body">{employee.phone}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => handleEditEmployee(employee)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteEmployee(employee.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredEmployees.length === 0 && (
            <p className="text-center py-4 text-muted-foreground font-body">لا يوجد موظفون.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline">{currentEmployee?.id ? 'تعديل موظف' : 'إضافة موظف جديد'}</DialogTitle>
            <DialogDescription className="font-body">
              {currentEmployee?.id ? 'قم بتحديث بيانات الموظف.' : 'أدخل بيانات الموظف الجديد.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right font-body">الاسم</Label>
              <Input id="name" name="name" defaultValue={currentEmployee?.name || ''} className="col-span-3 font-body" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right font-body">القسم</Label>
              <Input id="department" name="department" defaultValue={currentEmployee?.department || ''} className="col-span-3 font-body" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="jobTitle" className="text-right font-body">المسمى الوظيفي</Label>
              <Input id="jobTitle" name="jobTitle" defaultValue={currentEmployee?.jobTitle || ''} className="col-span-3 font-body" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right font-body">البريد الإلكتروني</Label>
              <Input id="email" name="email" type="email" defaultValue={currentEmployee?.email || ''} className="col-span-3 font-body" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right font-body">الهاتف</Label>
              <Input id="phone" name="phone" defaultValue={currentEmployee?.phone || ''} className="col-span-3 font-body" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="font-body">إلغاء</Button>
              <Button type="submit" className="font-body">حفظ</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
