"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Metric = {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon?: React.ComponentType<any>;
  color?: string;
};

export default function DashboardMetrics({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon as any;
        const changeLabel = (() => {
          // If the metric refers to semester change and value is 0, interpret as "First semester"
          try {
            const isSemesterPhrase = /this semester/i.test(metric.change);
            const leadingNumberMatch = metric.change.trim().match(/^(-?\d+(?:\.\d+)?)/);
            const leadingNumber = leadingNumberMatch ? parseFloat(leadingNumberMatch[1]) : null;
            if (isSemesterPhrase && leadingNumber === 0) return "First semester";

            // If numeric and positive, ensure a '+' prefix for clarity
            if (leadingNumber !== null && leadingNumber > 0) {
              const trimmed = metric.change.trim();
              if (/^[+]/.test(trimmed)) return trimmed;
              return `+${trimmed}`;
            }
          } catch (e) {
            // fallback to original
          }
          return metric.change;
        })();

        return (
          <Card key={index} className="@container/card">
            <CardHeader>
              <CardDescription>{metric.title}</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {metric.value}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={
                    metric.trend === "up"
                      ? "border-green-200 text-green-700 bg-green-50"
                      : metric.trend === "down"
                      ? "border-red-200 text-red-700 bg-red-50"
                      : "border-gray-200 text-gray-700 bg-gray-50"
                  }
                >
                  {metric.trend === "up" && Icon ? <Icon className="w-3 h-3 mr-1" /> : null}
                  {metric.trend === "down" && Icon ? <Icon className="w-3 h-3 mr-1" /> : null}
                  {changeLabel}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
