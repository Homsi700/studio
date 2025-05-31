"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
}

const initialShifts: Shift[] = [
  { id: '1', name: 'الوردية الصباحية', startTime: '09:00', endTime: '17:00', gracePeriodMinutes: 15 },
  { id: '2', name: 'الوردية المسائية', startTime: '17:00', endTime: '01:00', gracePeriodMinutes: 15 },
];

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  // States for form dialog would go here

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">إدارة الورديات والقواعد</h1>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-headline">الورديات الحالية</CardTitle>
            <Button className="font-body">
              <PlusCircle className="mr-2 h-4 w-4" /> إضافة وردية جديدة
            </Button>
          </div>
          <CardDescription className="font-body">
            قم بإعداد الورديات المختلفة وأوقات الدوام الرسمية.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">اسم الوردية</TableHead>
                <TableHead className="font-body">وقت البدء</TableHead>
                <TableHead className="font-body">وقت الإنتهاء</TableHead>
                <TableHead className="font-body">فترة السماح (دقائق)</TableHead>
                <TableHead className="font-body text-center">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-semibold font-body">{shift.name}</TableCell>
                  <TableCell className="font-body">{shift.startTime}</TableCell>
                  <TableCell className="font-body">{shift.endTime}</TableCell>
                  <TableCell className="font-body">{shift.gracePeriodMinutes}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {shifts.length === 0 && <p className="text-center py-4 text-muted-foreground font-body">لا توجد ورديات معرفة.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">قواعد العمل الإضافي</CardTitle>
          <CardDescription className="font-body">
            حدد قواعد حساب العمل الإضافي وساعات السماح.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="overtimeMultiplier" className="font-body">معامل حساب العمل الإضافي</Label>
            <Input id="overtimeMultiplier" type="number" defaultValue="1.5" className="font-body mt-1" />
            <p className="text-sm text-muted-foreground font-body mt-1">مثال: 1.5 يعني أن ساعة العمل الإضافي تحتسب كساعة ونصف.</p>
          </div>
          <div>
            <Label htmlFor="maxLateMinutes" className="font-body">أقصى مدة تأخير مسموح بها (دقائق)</Label>
            <Input id="maxLateMinutes" type="number" defaultValue="30" className="font-body mt-1" />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="font-body">حفظ القواعد</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
