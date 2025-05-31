"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, CheckCircle, XCircle } from "lucide-react";
import { mockLeaveRequests, type LeaveRequest, mockEmployees } from '@/lib/constants';

export default function LeavesPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<Partial<LeaveRequest>>({});

  const handleStatusChange = (id: string, status: 'approved' | 'rejected') => {
    setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status } : req));
    // Add server action call here
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">معلق</span>;
      case 'approved': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">مقبول</span>;
      case 'rejected': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">مرفوض</span>;
      default: return '';
    }
  };
  
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRequestData: Partial<LeaveRequest> = {
      employeeId: formData.get('employeeId') as string,
      // Find employeeName based on employeeId
      employeeName: mockEmployees.find(emp => emp.id === formData.get('employeeId') as string)?.name || 'Unknown',
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      reason: formData.get('reason') as string,
      status: 'pending', // New requests are pending
    };

    setLeaveRequests(prev => [...prev, { ...newRequestData, id: String(Date.now()) } as LeaveRequest]);
    // Add server action call here
    setIsFormOpen(false);
    setCurrentRequest({});
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">إدارة الإجازات والأذونات</h1>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline">طلبات الإجازة</CardTitle>
            <Button onClick={() => setIsFormOpen(true)} className="font-body">
              <PlusCircle className="mr-2 h-4 w-4" /> تقديم طلب جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">اسم الموظف</TableHead>
                <TableHead className="font-body">تاريخ البدء</TableHead>
                <TableHead className="font-body">تاريخ الانتهاء</TableHead>
                <TableHead className="font-body">السبب</TableHead>
                <TableHead className="font-body">الحالة</TableHead>
                <TableHead className="font-body text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-semibold font-body">{request.employeeName}</TableCell>
                  <TableCell className="font-body">{request.startDate}</TableCell>
                  <TableCell className="font-body">{request.endDate}</TableCell>
                  <TableCell className="font-body">{request.reason}</TableCell>
                  <TableCell className="font-body">{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-center">
                    {request.status === 'pending' && (
                      <>
                        <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600" onClick={() => handleStatusChange(request.id, 'approved')}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleStatusChange(request.id, 'rejected')}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {leaveRequests.length === 0 && (
            <p className="text-center py-4 text-muted-foreground font-body">لا توجد طلبات إجازة حالياً.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline">تقديم طلب إجازة</DialogTitle>
            <DialogDescription className="font-body">
              يرجى ملء تفاصيل طلب الإجازة.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="employeeId" className="text-right font-body">الموظف</Label>
              <Select name="employeeId" defaultValue={currentRequest?.employeeId || ''} required>
                <SelectTrigger className="col-span-3 font-body">
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {mockEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id} className="font-body">{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right font-body">تاريخ البدء</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={currentRequest?.startDate || ''} className="col-span-3 font-body" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right font-body">تاريخ الانتهاء</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={currentRequest?.endDate || ''} className="col-span-3 font-body" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right font-body">السبب</Label>
              <Textarea id="reason" name="reason" defaultValue={currentRequest?.reason || ''} className="col-span-3 font-body" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="font-body">إلغاء</Button>
              <Button type="submit" className="font-body">تقديم الطلب</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
