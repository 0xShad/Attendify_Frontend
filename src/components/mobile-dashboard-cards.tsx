import {
  IconBooks,
  IconCalendar,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function MobileDashboardCards() {
  const stats = [
    {
      title: "Total Students",
      value: "156",
      change: "+12%",
      trending: "up",
      icon: IconUsers,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Active Courses",
      value: "3",
      change: "This semester",
      trending: "neutral",
      icon: IconBooks,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Today's Attendance",
      value: "87%",
      change: "+5%",
      trending: "up",
      icon: IconCalendar,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Weekly Average",
      value: "82%",
      change: "+3%",
      trending: "up",
      icon: IconTrendingUp,
      color: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="p-4 border-0 shadow-sm bg-white transition-transform duration-150 hover:scale-[0.98] active:scale-95"
        >
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              {stat.trending === "up" && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-50 text-green-700 border-0"
                >
                  {stat.change}
                </Badge>
              )}
            </div>

            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 line-clamp-1">
                {stat.title}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
