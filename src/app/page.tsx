"use client";

import { useState } from 'react';
import type { LucideIcon } from "lucide-react";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Clock, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Tooltip, Legend, LineChart, Line, Pie, PieChart } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";


const weeklyAttendanceData = [
  { day: "الأحد", hours: 6 },
  { day: "الاثنين", hours: 7 },
  { day: "الثلاثاء", hours: 8 },
  { day: "الأربعاء", hours: 7.5 },
  { day: "الخميس", hours: 6.5 },
];

const employeeStatusData = [
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

interface ModalContentData {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
}

export default function DashboardPage() {
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContentData | null>(null);

  const handleStatCardClick = (data: ModalContentData) => {
    setModalContent(data);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">لوحة القيادة الرئيسية</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard title="إجمالي الموظفين" value="85" icon={Users} description="+5 هذا الشهر" onClick={handleStatCardClick} />
        <StatCard title="موظفون في الدوام" value="65" icon={Users} description="حالياً" onClick={handleStatCardClick} />
        <StatCard title="موظفون في إجازة" value="10" icon={Briefcase} description="اليوم" onClick={handleStatCardClick} />
        <StatCard title="متوسط ساعات العمل" value="38" icon={Clock} description="أسبوعياً" onClick={handleStatCardClick} />
        <StatCard title="تأخير/غياب" value="12" icon={AlertTriangle} description="هذا الشهر" onClick={handleStatCardClick} />
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">اتجاهات الحضور (آخر أسبوع)</CardTitle>
            <CardDescription className="font-body">متوسط ساعات العمل اليومية</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={weeklyAttendanceData} margin={{ right: 20, left: -20}}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} className="font-body"/>
                <YAxis tickLine={false} axisLine={false} tickMargin={8} className="font-body"/>
                <Tooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Legend content={({ payload }) => <div className="font-body">{payload?.map(p => p.value).join(', ')}</div>}/>
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
                <Pie data={employeeStatusData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5} />
                <Legend content={({ payload }) => <div className="font-body mt-4 flex flex-wrap gap-2 justify-center">{payload?.map(p => <span key={p.value} style={{color: p.color}}>{p.value} ({employeeStatusData.find(d => d.name === p.value)?.value}%)</span>)}</div>}/>
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
        <DialogContent className="sm:max-w-[425px]">
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
            <p className="text-5xl font-bold font-headline text-center text-primary">{modalContent?.value}</p>
            <p className="text-sm text-muted-foreground font-body mt-6 text-center">
              تفاصيل إضافية لهذه البطاقة ستكون متاحة هنا قريباً. يمكنك طلب تفاصيل محددة لعرضها.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDetailModalOpen(false)} className="font-body w-full">إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
