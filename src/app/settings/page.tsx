"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useThemeContext } from "@/components/ThemeProvider"; // Re-using existing hook
import { Moon, Sun } from "lucide-react";


export default function SettingsPage() {
  const { theme, setTheme } = useThemeContext();

  const handleThemeChange = (isDark: boolean) => {
    setTheme(isDark ? 'dark' : 'light');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">الإعدادات العامة</h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">إعدادات المظهر</CardTitle>
          <CardDescription className="font-body">
            قم بتخصيص مظهر التطبيق.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode" className="text-base font-body">الوضع الليلي</Label>
              <p className="text-sm text-muted-foreground font-body">
                قم بتمكين أو تعطيل الوضع الليلي للتطبيق.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Sun className={`h-5 w-5 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={handleThemeChange}
                aria-label="Toggle dark mode"
              />
              <Moon className={`h-5 w-5 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">إعدادات التوقيت</CardTitle>
          <CardDescription className="font-body">
            إدارة إعدادات المنطقة الزمنية للتطبيق.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
             <div>
                <Label className="text-base font-body">المنطقة الزمنية الحالية</Label>
                <p className="text-lg font-semibold font-body mt-1">Asia/Damascus (توقيت سوريا - دمشق)</p>
             </div>
             <Button variant="outline" className="font-body" disabled>تغيير المنطقة</Button>
          </div>
           <p className="text-sm text-muted-foreground font-body">
            جميع الأوقات والتسجيلات في النظام يتم عرضها وحفظها بناءً على توقيت دمشق (UTC+3).
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">إدارة المستخدمين والصلاحيات</CardTitle>
           <CardDescription className="font-body">
            (ميزة مستقبلية) إدارة أدوار المستخدمين وصلاحيات الوصول.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground font-body">سيتم إضافة هذه الميزة قريباً.</p>
        </CardContent>
      </Card>
    </div>
  );
}
