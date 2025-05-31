
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { LucideIcon } from "lucide-react";
import StatCard, { DashboardCardType, type StatCardData as StatCardClickData } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Briefcase, Clock, AlertTriangle, Search, Loader2 } from "lucide-react";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Tooltip, Legend, LineChart, Line, PieChart, Pie } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getEmployees } from '@/actions/employeeActions';
import { getAttendanceRecords } from '@/actions/attendanceActions';
import { getLeaveRequests } from '@/actions/leaveActions';
import type { Employee, AttendanceRecord, LeaveRequest } from '@/lib/constants';
import { format, parseISO, isWithinInterval, differenceInMinutes, startOfMonth, endOfMonth, isValid } from 'date-fns';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";


const weeklyAttendanceDataStatic = [
  { day: "الأحد", hours: 6 },
  { day: "الاثنين", hours: 7 },
  { day: "الثلاثاء", hours: 8 },
  { day: "الأربعاء", hours: 7.5 },
  { day: "الخميس", hours: 6.5 },
];

const employeeStatusDataStatic = [
  { name: "في الدوام", value: 65, fill: "var(--color-present)" },
  { name: "خارج الدوام", value: 25, fill: "var(--color-absent)" },
  { name: "إجازة", value: 10, fill: "var(--color-leave)" },
];

const chartConfig: ChartConfig = {
  present: { label: "في الدوام", color: "hsl(var(--chart-1))" },
  absent: { label: "خارج الدوام", color: "hsl(var(--chart-2))" },
  leave: { label: "إجازة", color: "hsl(var(--chart-3))" },
  hours: { label: "ساعات العمل", color: "hsl(var(--primary))"},
};

interface ModalContent extends StatCardClickData {}

export default function DashboardPage() {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);
  const [modalDetailedData, setModalDetailedData] = useState<any>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const handleStatCardClick = (data: StatCardClickData) => {
    setModalContent(data);
    setIsDetailModalOpen(true);
    setModalDetailedData(null); // Reset detailed data on new click
    setSearchTerm(''); // Reset search term for modals
  };

  useEffect(() => {
    if (isDetailModalOpen && modalContent) {
      const fetchDataForModal = async () => {
        setIsModalLoading(true);
        try {
          let data = null;
          const today = new Date();
          const todayStr = format(today, 'yyyy-MM-dd');

          switch (modalContent.cardType) {
            case DashboardCardType.TotalEmployees:
              data = await getEmployees();
              break;
            case DashboardCardType.EmployeesOnLeave:
              const leaveRequests = await getLeaveRequests();
              data = leaveRequests.filter(req => {
                if (req.status !== 'approved') return false;
                try {
                  const startDate = parseISO(req.startDate);
                  const endDate = parseISO(req.endDate);
                  return isValid(startDate) && isValid(endDate) && isWithinInterval(today, { start: startDate, end: endDate });
                } catch (e) { return false; }
              });
              break;
            case DashboardCardType.EmployeesOnDuty:
              const attendanceRecords = await getAttendanceRecords();
              const employees = await getEmployees();
              const onDutyEmployeeIds = new Set(
                attendanceRecords
                  .filter(r => r.date === todayStr && r.clockIn && !r.clockOut)
                  .map(r => r.employeeId)
              );
              data = employees.filter(emp => onDutyEmployeeIds.has(emp.id)).map(emp => {
                const record = attendanceRecords.find(r => r.employeeId === emp.id && r.date === todayStr);
                let durationSoFar = 'غير متوفر';
                if (record?.clockIn) {
                  try {
                    const clockInTime = parseISO(`${record.date}T${record.clockIn}`);
                    if(isValid(clockInTime)) {
                      const now = new Date();
                      const diffMins = differenceInMinutes(now, clockInTime);
                      const hours = Math.floor(diffMins / 60);
                      const minutes = diffMins % 60;
                      durationSoFar = `${hours} س ${minutes} د`;
                    }
                  } catch (e) { /* ignore date parsing error */ }
                }
                return { ...emp, clockInTime: record?.clockIn, durationSoFar };
              });
              break;
            case DashboardCardType.LatesAbsences:
              const allAttendance = await getAttendanceRecords();
              const currentMonthStart = startOfMonth(today);
              const currentMonthEnd = endOfMonth(today);
              data = allAttendance.filter(r => {
                if (r.status !== 'late' && r.status !== 'absent') return false;
                try {
                  const recordDate = parseISO(r.date);
                  return isValid(recordDate) && isWithinInterval(recordDate, { start: currentMonthStart, end: currentMonthEnd });
                } catch (e) { return false; }
              });
              break;
            // Add AvgWorkingHours later if time permits or simplify
            default:
              data = { message: "التفاصيل لهذه البطاقة ستكون متاحة قريباً." };
          }
          setModalDetailedData(data);
        } catch (error) {
          console.error("Failed to fetch modal data:", error);
          toast({ title: "خطأ", description: "فشل في جلب بيانات النافذة.", variant: "destructive"});
          setModalDetailedData({ error: "فشل في جلب البيانات." });
        } finally {
          setIsModalLoading(false);
        }
      };
      fetchDataForModal();
    }
  }, [isDetailModalOpen, modalContent, toast]);
  
  const filteredModalData = useMemo(() => {
    if (!modalDetailedData || !modalContent || !Array.isArray(modalDetailedData)) return modalDetailedData;

    if (searchTerm && (
        modalContent.cardType === DashboardCardType.TotalEmployees ||
        modalContent.cardType === DashboardCardType.EmployeesOnDuty
        )) {
      return modalDetailedData.filter((item: Employee) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.department && item.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.jobTitle && item.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
     if (searchTerm && (
        modalContent.cardType === DashboardCardType.EmployeesOnLeave ||
        modalContent.cardType === DashboardCardType.LatesAbsences
        )) {
       return modalDetailedData.filter((item: LeaveRequest | AttendanceRecord) =>
        item.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return modalDetailedData;
  }, [modalDetailedData, modalContent, searchTerm]);


  const renderModalContent = () => {
    if (isModalLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-body mr-2">جاري تحميل التفاصيل...</p>
        </div>
      );
    }

    if (!modalDetailedData || modalDetailedData.error) {
      return <p className="font-body text-center text-destructive">{modalDetailedData?.error || "لا توجد بيانات لعرضها."}</p>;
    }
    
    if (modalDetailedData.message) {
       return <p className="font-body text-center text-muted-foreground">{modalDetailedData.message}</p>;
    }

    switch (modalContent?.cardType) {
      case DashboardCardType.TotalEmployees:
        const employees = filteredModalData as Employee[];
        return (
          <>
            <Input
              type="search"
              placeholder="بحث بالاسم, القسم, أو المسمى الوظيفي..."
              className="mb-4 font-body"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">الصورة</TableHead>
                    <TableHead className="font-body">الاسم</TableHead>
                    <TableHead className="font-body">القسم</TableHead>
                    <TableHead className="font-body">المسمى الوظيفي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length > 0 ? employees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <Image src={emp.avatarUrl || `https://placehold.co/40x40.png?text=${emp.name.charAt(0)}`} alt={emp.name} width={40} height={40} className="rounded-full" data-ai-hint="person avatar" unoptimized/>
                      </TableCell>
                      <TableCell className="font-body font-semibold">{emp.name}</TableCell>
                      <TableCell className="font-body">{emp.department}</TableCell>
                      <TableCell className="font-body">{emp.jobTitle}</TableCell>
                    </TableRow>
                  )) : (
                     <TableRow><TableCell colSpan={4} className="text-center font-body">لا يوجد موظفون لعرضهم.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        );
      case DashboardCardType.EmployeesOnLeave:
        const leaveRequests = filteredModalData as LeaveRequest[];
        return (
           <>
            <Input
              type="search"
              placeholder="بحث باسم الموظف..."
              className="mb-4 font-body"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">اسم الموظف</TableHead>
                    <TableHead className="font-body">تاريخ البدء</TableHead>
                    <TableHead className="font-body">تاريخ الإنتهاء</TableHead>
                    <TableHead className="font-body">السبب</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.length > 0 ? leaveRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-body font-semibold">{req.employeeName}</TableCell>
                      <TableCell className="font-body">{req.startDate}</TableCell>
                      <TableCell className="font-body">{req.endDate}</TableCell>
                      <TableCell className="font-body">{req.reason}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center font-body">لا يوجد موظفون في إجازة حالياً.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        );
      case DashboardCardType.EmployeesOnDuty:
        const onDutyEmployees = filteredModalData as (Employee & { clockInTime?: string; durationSoFar?: string })[];
        return (
           <>
            <Input
              type="search"
              placeholder="بحث باسم الموظف..."
              className="mb-4 font-body"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">اسم الموظف</TableHead>
                    <TableHead className="font-body">وقت الدخول</TableHead>
                    <TableHead className="font-body">المدة المنقضية</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {onDutyEmployees.length > 0 ? onDutyEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-body font-semibold">{emp.name}</TableCell>
                      <TableCell className="font-body">{emp.clockInTime || 'N/A'}</TableCell>
                      <TableCell className="font-body">{emp.durationSoFar || 'N/A'}</TableCell>
                    </TableRow>
                  )) : (
                     <TableRow><TableCell colSpan={3} className="text-center font-body">لا يوجد موظفون في الدوام حالياً.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        );
      case DashboardCardType.LatesAbsences:
        const latesAbsencesRecords = filteredModalData as AttendanceRecord[];
        return (
          <>
            <Input
              type="search"
              placeholder="بحث باسم الموظف..."
              className="mb-4 font-body"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-body">اسم الموظف</TableHead>
                    <TableHead className="font-body">التاريخ</TableHead>
                    <TableHead className="font-body">الحالة</TableHead>
                    <TableHead className="font-body">وقت الدخول</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latesAbsencesRecords.length > 0 ? latesAbsencesRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-body font-semibold">{record.employeeName}</TableCell>
                      <TableCell className="font-body">{record.date}</TableCell>
                      <TableCell className="font-body">
                        {record.status === 'late' ? <span className="text-orange-500">متأخر</span> : <span className="text-red-600">غائب</span>}
                      </TableCell>
                      <TableCell className="font-body">{record.clockIn || 'N/A'}</TableCell>
                    </TableRow>
                  )) : (
                     <TableRow><TableCell colSpan={4} className="text-center font-body">لا يوجد تأخيرات أو غيابات هذا الشهر.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </>
        );
      case DashboardCardType.AvgWorkingHours:
         // Implement chart and data for average working hours
         return <p className="font-body text-center text-muted-foreground">تفاصيل متوسط ساعات العمل ستكون متاحة هنا قريباً. (يتطلب تحليل بيانات الحضور)</p>;
      default:
        return <p className="font-body text-center text-muted-foreground">التفاصيل لهذه البطاقة ستكون متاحة هنا قريباً.</p>;
    }
  };
  

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">لوحة القيادة الرئيسية</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="إجمالي الموظفين" value="85" icon={Users} description="+5 هذا الشهر" onClick={handleStatCardClick} cardType={DashboardCardType.TotalEmployees} />
        <StatCard title="موظفون في الدوام" value="65" icon={Users} description="حالياً" onClick={handleStatCardClick} cardType={DashboardCardType.EmployeesOnDuty} />
        <StatCard title="موظفون في إجازة" value="10" icon={Briefcase} description="اليوم" onClick={handleStatCardClick} cardType={DashboardCardType.EmployeesOnLeave} />
        <StatCard title="متوسط ساعات العمل" value="38" icon={Clock} description="أسبوعياً" onClick={handleStatCardClick} cardType={DashboardCardType.AvgWorkingHours} />
        <StatCard title="تأخير/غياب" value="12" icon={AlertTriangle} description="هذا الشهر" onClick={handleStatCardClick} cardType={DashboardCardType.LatesAbsences}/>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">اتجاهات الحضور (آخر أسبوع)</CardTitle>
            <CardDescription className="font-body">متوسط ساعات العمل اليومية</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={weeklyAttendanceDataStatic} margin={{ right: 20, left: -20}}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} className="font-body"/>
                <YAxis tickLine={false} axisLine={false} tickMargin={8} className="font-body"/>
                <Tooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Legend content={({ payload }) => <div className="font-body">{payload?.map(p => String(p.value)).join(', ')}</div>}/>
                <Line type="monotone" dataKey="hours" stroke="var(--color-hours)" strokeWidth={3} dot={false} name="ساعات العمل" />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">حالة الموظفين</CardTitle>
            <CardDescription className="font-body">توزيع الموظفين حسب حالة الدوام الحالية</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={chartConfig} className="h-[300px] w-full max-w-[300px]">
              <PieChart>
                <Tooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={employeeStatusDataStatic} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5} />
                <Legend content={({ payload }) => <div className="font-body mt-4 flex flex-wrap gap-2 justify-center">{payload?.map(p => <span key={String(p.value)} style={{color: p.color}}>{String(p.value)} ({employeeStatusDataStatic.find(d => d.name === p.value)?.value}%)</span>)}</div>}/>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">آخر التنبيهات</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 font-body">
            <li><span className="font-semibold">أحمد محمود:</span> تسجيل دخول متأخر (09:15).</li>
            <li><span className="font-semibold">فاطمة علي:</span> طلب إجازة جديد.</li>
            <li><span className="font-semibold">النظام:</span> تم تحديث سياسة الإجازات.</li>
          </ul>
        </CardContent>
      </Card>

      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-2xl"> {/* Increased width for tables */}
          <DialogHeader>
            {modalContent?.icon && <modalContent.icon className="h-7 w-7 mb-3 text-primary mx-auto" />}
            <DialogTitle className="font-headline text-center text-2xl">{modalContent?.title}</DialogTitle>
            {modalContent?.description && (
              <DialogDescription className="font-body text-center">
                {modalContent.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="py-4">
            <p className="text-5xl font-bold font-headline text-center text-primary mb-6">{modalContent?.value}</p>
            {renderModalContent()}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDetailModalOpen(false)} className="font-body w-full">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
