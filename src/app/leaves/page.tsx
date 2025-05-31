
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, CheckCircle, XCircle, Loader2, Trash2 } from "lucide-react";
import type { LeaveRequest, Employee, LeaveRequestStatus } from '@/lib/constants';
import { getLeaveRequests, addLeaveRequest, updateLeaveRequestStatus, deleteLeaveRequest } from '@/actions/leaveActions';
import { getEmployees } from '@/actions/employeeActions';
import { useToast } from "@/hooks/use-toast";

export default function LeavesPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  // No need for currentRequest in state as form will be fresh or reset
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null); // Stores ID of request being updated
  const [isDeleting, setIsDeleting] = useState<string | null>(null); // Stores ID of request being deleted
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedRequests, fetchedEmployees] = await Promise.all([
        getLeaveRequests(),
        getEmployees()
      ]);
      setLeaveRequests(fetchedRequests);
      setEmployees(fetchedEmployees);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات طلبات الإجازة أو الموظفين.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id: string, status: LeaveRequestStatus) => {
    setIsUpdatingStatus(id);
    try {
      await updateLeaveRequestStatus(id, status);
      toast({ title: "نجاح", description: `تم ${status === 'approved' ? 'قبول' : 'رفض'} الطلب بنجاح.` });
      await fetchData(); // Re-fetch to update the list
    } catch (error) {
      console.error("Failed to update leave request status:", error);
      toast({ title: "خطأ", description: "فشل في تحديث حالة الطلب.", variant: "destructive" });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteLeaveRequest(id);
      toast({ title: "نجاح", description: "تم حذف طلب الإجازة بنجاح." });
      await fetchData(); // Re-fetch to update the list
    } catch (error) {
      console.error("Failed to delete leave request:", error);
      toast({ title: "خطأ", description: "فشل في حذف طلب الإجازة.", variant: "destructive" });
    } finally {
      setIsDeleting(null);
    }
  };
  
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const employeeId = formData.get('employeeId') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const reason = formData.get('reason') as string;

    if (!employeeId || !startDate || !endDate || !reason) {
        toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    
    // Basic date validation
    if (new Date(startDate) > new Date(endDate)) {
        toast({ title: "خطأ", description: "تاريخ البدء لا يمكن أن يكون بعد تاريخ الانتهاء.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    const newRequestData = {
      employeeId,
      startDate,
      endDate,
      reason,
    };

    try {
      await addLeaveRequest(newRequestData);
      toast({ title: "نجاح", description: "تم تقديم طلب الإجازة بنجاح." });
      await fetchData(); // Re-fetch to update the list
      setIsFormOpen(false);
      // e.currentTarget.reset(); // Reset form fields
    } catch (error) {
      console.error("Failed to submit leave request:", error);
      const errorMessage = (error instanceof Error && error.message === 'Employee not found') 
        ? "الموظف المحدد غير موجود." 
        : "فشل في تقديم طلب الإجازة.";
      toast({ title: "خطأ", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: LeaveRequestStatus) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">معلق</span>;
      case 'approved': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">مقبول</span>;
      case 'rejected': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">مرفوض</span>;
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">إدارة الإجازات والأذونات</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="font-headline">طلبات الإجازة</CardTitle>
            <Button onClick={() => setIsFormOpen(true)} className="font-body" disabled={isSubmitting || isLoading}>
              <PlusCircle className="mr-2 h-4 w-4" /> تقديم طلب جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="font-body ml-2">جاري تحميل الطلبات...</p>
            </div>
          ) : (
            <>
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
                      <TableCell className="text-center space-x-1">
                        {request.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-green-500 hover:text-green-600" 
                              onClick={() => handleStatusChange(request.id, 'approved')}
                              disabled={isUpdatingStatus === request.id || isDeleting === request.id}
                            >
                              {isUpdatingStatus === request.id && request.status !== 'rejected' ? <Loader2 className="h-4 w-4 animate-spin"/> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-600" 
                              onClick={() => handleStatusChange(request.id, 'rejected')}
                              disabled={isUpdatingStatus === request.id || isDeleting === request.id}
                            >
                               {isUpdatingStatus === request.id && request.status !== 'approved' ? <Loader2 className="h-4 w-4 animate-spin"/> : <XCircle className="h-4 w-4" />}
                            </Button>
                          </>
                        )}
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive" 
                            onClick={() => handleDeleteRequest(request.id)}
                            disabled={isDeleting === request.id || isUpdatingStatus === request.id}
                          >
                           {isDeleting === request.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                          </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {leaveRequests.length === 0 && !isLoading && (
                <p className="text-center py-4 text-muted-foreground font-body">لا توجد طلبات إجازة حالياً.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsFormOpen(isOpen); }}>
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
              <Select name="employeeId" required disabled={isSubmitting}>
                <SelectTrigger className="col-span-3 font-body">
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id} className="font-body">{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right font-body">تاريخ البدء</Label>
              <Input id="startDate" name="startDate" type="date" className="col-span-3 font-body" required disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right font-body">تاريخ الانتهاء</Label>
              <Input id="endDate" name="endDate" type="date" className="col-span-3 font-body" required disabled={isSubmitting} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right font-body">السبب</Label>
              <Textarea id="reason" name="reason" className="col-span-3 font-body" required disabled={isSubmitting} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { if (!isSubmitting) setIsFormOpen(false); }} className="font-body" disabled={isSubmitting}>إلغاء</Button>
              <Button type="submit" className="font-body" disabled={isSubmitting}>
                 {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                تقديم الطلب
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
