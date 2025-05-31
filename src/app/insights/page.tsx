// src/app/insights/page.tsx
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle } from 'lucide-react';
import { detectAbsencePatterns, type DetectAbsencePatternsInput } from '@/ai/flows/attendance-pattern-detection';

export default function InsightsPage() {
  const [attendanceData, setAttendanceData] = useState('');
  const [absenceThreshold, setAbsenceThreshold] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const input: DetectAbsencePatternsInput = {
        attendanceData,
        absenceThreshold,
      };
      const response = await detectAbsencePatterns(input);
      setResult(response.unusualPatterns);
    } catch (err) {
      setError('حدث خطأ أثناء تحليل البيانات. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">تحليلات الحضور الذكية</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">اكتشاف أنماط الغياب غير المعتادة</CardTitle>
          <CardDescription className="font-body">
            أدخل بيانات الحضور (بتنسيق CSV: employeeId,date,clockInTime,clockOutTime) لتحليلها بواسطة الذكاء الاصطناعي.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="attendanceData" className="font-body">بيانات الحضور (CSV)</Label>
              <Textarea
                id="attendanceData"
                value={attendanceData}
                onChange={(e) => setAttendanceData(e.target.value)}
                placeholder="مثال: 123,2024-01-01,08:00,17:00&#10;456,2024-01-01,08:05,16:50"
                rows={10}
                className="mt-1 font-body [direction:ltr] text-left" // Ensure LTR for CSV data
                required
              />
            </div>
            <div>
              <Label htmlFor="absenceThreshold" className="font-body">حد الغياب/التأخير المعتبر غير عادي (شهرياً)</Label>
              <Input
                id="absenceThreshold"
                type="number"
                value={absenceThreshold}
                onChange={(e) => setAbsenceThreshold(parseInt(e.target.value, 10))}
                className="mt-1 font-body w-full sm:w-1/4"
                min="1"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="font-body">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              تحليل البيانات
            </Button>
          </CardFooter>
        </form>
      </Card>

      {result !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">نتائج التحليل</CardTitle>
          </CardHeader>
          <CardContent>
            {result === '' ? (
              <p className="font-body text-green-600">لم يتم اكتشاف أي أنماط حضور غير معتادة.</p>
            ) : (
              <pre className="p-4 bg-muted rounded-md whitespace-pre-wrap font-body">{result}</pre>
            )}
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="font-headline text-destructive flex items-center gap-2">
              <AlertTriangle /> خطأ في التحليل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-body text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
