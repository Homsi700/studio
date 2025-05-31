"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockAttendance, type AttendanceRecord, mockEmployees } from '@/lib/constants';
import { Download, Filter } from "lucide-react";

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(mockAttendance);
  const [dateFilter, setDateFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  // Add department filter if needed

  const filteredRecords = attendanceRecords.filter(record => {
    const dateMatch = dateFilter ? record.date.includes(dateFilter) : true;
    const employeeMatch = employeeFilter ? record.employeeId === employeeFilter : true;
    return dateMatch && employeeMatch;
  });

  const getStatusText = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'onTime': return <span className="text-green-600">في الوقت المحدد</span>;
      case 'late': return <span className="text-orange-500">متأخر</span>;
      case 'earlyLeave': return <span className="text-yellow-500">انصراف مبكر</span>;
      case 'absent': return <span className="text-red-600">غائب</span>;
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">سجلات الحضور</h1>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="font-headline">جدول الحضور التفصيلي</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input 
                type="date" 
                className="font-body w-full sm:w-auto"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] font-body">
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="font-body">الكل</SelectItem>
                  {mockEmployees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id} className="font-body">{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="font-body w-full sm:w-auto">
                <Filter className="mr-2 h-4 w-4" /> تطبيق الفلتر
              </Button>
              <Button className="font-body w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" /> تصدير البيانات
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">اسم الموظف</TableHead>
                <TableHead className="font-body">تاريخ الدوام</TableHead>
                <TableHead className="font-body">وقت الدخول</TableHead>
                <TableHead className="font-body">وقت الانصراف</TableHead>
                <TableHead className="font-body">المدة الإجمالية</TableHead>
                <TableHead className="font-body">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-semibold font-body">{record.employeeName}</TableCell>
                  <TableCell className="font-body">{record.date}</TableCell>
                  <TableCell className="font-body">{record.clockIn}</TableCell>
                  <TableCell className="font-body">{record.clockOut}</TableCell>
                  <TableCell className="font-body">{record.totalDuration}</TableCell>
                  <TableCell className="font-body">{getStatusText(record.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredRecords.length === 0 && (
            <p className="text-center py-4 text-muted-foreground font-body">لا توجد سجلات حضور تطابق الفلترة.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
