
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Define standard card types
export enum DashboardCardType {
  TotalEmployees = 'TotalEmployees',
  EmployeesOnDuty = 'EmployeesOnDuty',
  EmployeesOnLeave = 'EmployeesOnLeave',
  AvgWorkingHours = 'AvgWorkingHours',
  LatesAbsences = 'LatesAbsences',
}

export interface StatCardData {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  cardType: DashboardCardType; // Added cardType
}

interface StatCardProps extends StatCardData {
  onClick?: (data: StatCardData) => void;
}

export default function StatCard({ title, value, icon: Icon, description, cardType, onClick }: StatCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick({ title, value, icon: Icon, description, cardType });
    }
  };

  return (
    <Card
      onClick={onClick ? handleClick : undefined}
      className={cn(
        "transition-shadow duration-200 ease-in-out",
        onClick && "cursor-pointer hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
      role={onClick ? "button" : undefined}
      aria-label={onClick ? `View details for ${title}` : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium font-body">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-headline">{value}</div>
        {description && <p className="text-xs text-muted-foreground font-body">{description}</p>}
      </CardContent>
    </Card>
  );
}
