"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BarChartCard({
  title,
  data,
  dataKey = "count",
  xKey,
  layout = "horizontal",
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  dataKey?: string;
  xKey: string;
  layout?: "horizontal" | "vertical";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout={layout}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            {layout === "vertical" ? (
              <>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11 }} width={100} />
              </>
            ) : (
              <>
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              </>
            )}
            <Tooltip />
            <Bar dataKey={dataKey} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
