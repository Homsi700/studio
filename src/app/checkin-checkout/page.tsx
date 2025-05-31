
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Fingerprint, Loader2, LogIn, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleClockEvent } from '@/actions/attendanceActions';

export default function CheckInCheckoutPage() {
  const [employeeIdentifier, setEmployeeIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastEventMessage, setLastEventMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (eventType: 'clockIn' | 'clockOut') => {
    if (!employeeIdentifier.trim() || !pin.trim()) {
      toast({
        title: "خطأ في الإدخال",
        description: "يرجى إدخال معرف الموظف والرقم السري.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLastEventMessage(null);
    try {
      const result = await handleClockEvent(employeeIdentifier, pin, eventType);
      if (result.success) {
        toast({
          title: "نجاح",
          description: result.message,
        });
        setLastEventMessage(`${eventType === 'clockIn' ? 'تم تسجيل الدخول:' : 'تم تسجيل الخروج:'} ${result.record?.employeeName} في ${eventType === 'clockIn' ? result.record?.clockIn : result.record?.clockOut}`);
        // Clear fields after successful event
        setEmployeeIdentifier('');
        setPin('');
      } else {
        toast({
          title: "خطأ",
          description: result.message,
          variant: "destructive",
        });
        setLastEventMessage(result.message);
      }
    } catch (error) {
      console.error(`Failed to ${eventType}:`, error);
      toast({
        title: "خطأ في النظام",
        description: `فشل في عملية ${eventType === 'clockIn' ? 'تسجيل الدخول' : 'تسجيل الخروج'}. يرجى المحاولة مرة أخرى.`,
        variant: "destructive",
      });
      setLastEventMessage(`فشل في عملية ${eventType === 'clockIn' ? 'تسجيل الدخول' : 'تسجيل الخروج'}.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <Fingerprint className="mx-auto h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline">تسجيل الدخول والخروج</CardTitle>
          <CardDescription className="font-body">
            يرجى إدخال معرف الموظف (الرقم الوظيفي أو الاسم) والرقم السري الخاص بك.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="employeeIdentifier" className="font-body text-lg">معرف الموظف (الاسم أو ID)</Label>
            <Input
              id="employeeIdentifier"
              type="text"
              placeholder="مثال: 123 أو أحمد محمود"
              value={employeeIdentifier}
              onChange={(e) => setEmployeeIdentifier(e.target.value)}
              disabled={isLoading}
              className="font-body text-base p-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin" className="font-body text-lg">الرقم السري (PIN)</Label>
            <Input
              id="pin"
              type="password"
              placeholder="ادخل رقمك السري"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              disabled={isLoading}
              className="font-body text-base p-3 [direction:ltr]"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button
            onClick={() => handleSubmit('clockIn')}
            disabled={isLoading}
            className="w-full font-body text-lg py-6 bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            تسجيل الدخول
          </Button>
          <Button
            onClick={() => handleSubmit('clockOut')}
            disabled={isLoading}
            className="w-full font-body text-lg py-6 bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogOut className="mr-2 h-5 w-5" />}
            تسجيل الخروج
          </Button>
        </CardFooter>
      </Card>
      {lastEventMessage && (
        <Card className="w-full max-w-md mt-6 p-4 text-center bg-muted">
          <p className="font-body text-muted-foreground">{lastEventMessage}</p>
        </Card>
      )}
       <p className="mt-8 text-sm text-muted-foreground font-body">
        هذه الواجهة مخصصة للموظفين لتسجيل حضورهم وانصرافهم.
      </p>
    </div>
  );
}
