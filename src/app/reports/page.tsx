
"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">إنشاء التقارير</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">تحديد معايير التقرير</CardTitle>
          <CardDescription className="font-body">
            اختر نوع التقرير، الفترة الزمنية، والمعايير الأخرى المطلوبة.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="reportType" className="font-body">نوع التقرير</Label>
            <Select>
              <SelectTrigger id="reportType" className="font-body">
                <SelectValue placeholder="اختر نوع التقرير" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payroll" className="font-body">تقرير الرواتب</SelectItem>
                <SelectItem value="attendance" className="font-body">ملخص الدوام</SelectItem>
                <SelectItem value="absence_delay" className="font-body">تقرير الغياب والتأخير</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate" className="font-body">تاريخ البدء</Label>
            <Input id="startDate" type="date" className="font-body" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate" className="font-body">تاريخ الانتهاء</Label>
            <Input id="endDate" type="date" className="font-body" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="outputCurrency" className="font-body">عملة عرض تقرير الرواتب</Label>
            <Select>
              <SelectTrigger id="outputCurrency" className="font-body">
                <SelectValue placeholder="اختر العملة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SYP" className="font-body">ليرة سورية (SYP)</SelectItem>
                <SelectItem value="USD" className="font-body">دولار أمريكي (USD)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground font-body">هذا الخيار يؤثر فقط على تقارير الرواتب.</p>
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Button className="font-body">
            توليد التقرير (عرض أولي)
          </Button>
          <Button variant="outline" className="font-body">
            <Download className="mr-2 h-4 w-4" />
            تصدير إلى CSV
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">نتائج التقرير (مثال)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground font-body">
            سيتم عرض ملخص أو البيانات الأولية للتقرير هنا بعد توليده.
          </p>
          {/* جدول أو رسم بياني لعرض نتائج التقرير */}
        </CardContent>
      </Card>
    </div>
  );
}
