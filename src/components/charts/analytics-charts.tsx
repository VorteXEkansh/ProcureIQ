"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatInr } from "@/lib/format";

const palette = ["#174f48", "#3d7169", "#6c938c", "#b57a18", "#d2a453", "#87918d", "#b5bcb8"];

const currencyTick = (value: number) => formatInr(value);

export function SpendTrendChart({ data }: { data: Array<{ label: string; value: number }> }) {
  return (
    <div className="chart" role="img" aria-label="Monthly procurement spend trend">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <defs><linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#174f48" stopOpacity={0.22} /><stop offset="95%" stopColor="#174f48" stopOpacity={0.01} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#e4e7e2" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#7c8582", fontSize: 10 }} minTickGap={28} />
          <YAxis tickFormatter={currencyTick} axisLine={false} tickLine={false} tick={{ fill: "#7c8582", fontSize: 10 }} width={62} />
          <Tooltip formatter={(value) => [formatInr(Number(value), false), "Spend"]} contentStyle={{ borderRadius: 9, borderColor: "#dfe3de", fontSize: 12 }} />
          <Area type="monotone" dataKey="value" stroke="#174f48" strokeWidth={2.2} fill="url(#spendFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizontalBarChart({ data, valueLabel = "Spend" }: { data: Array<{ label: string; value: number }>; valueLabel?: string }) {
  return (
    <div className="chart" role="img" aria-label={`${valueLabel} by category`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 3, right: 12, bottom: 3, left: 5 }}>
          <CartesianGrid horizontal={false} stroke="#e4e7e2" />
          <XAxis type="number" tickFormatter={currencyTick} axisLine={false} tickLine={false} tick={{ fill: "#7c8582", fontSize: 10 }} />
          <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={94} tick={{ fill: "#59635f", fontSize: 10 }} />
          <Tooltip formatter={(value) => [formatInr(Number(value), false), valueLabel]} contentStyle={{ borderRadius: 9, borderColor: "#dfe3de", fontSize: 12 }} />
          <Bar dataKey="value" radius={[0, 5, 5, 0]}>{data.map((entry, index) => <Cell key={entry.label} fill={palette[index % palette.length]} />)}</Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ParetoChart({ data }: { data: Array<{ label: string; spend: number; cumulative: number }> }) {
  return (
    <div className="chart" role="img" aria-label="Pareto chart with spend and cumulative share">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 8 }}>
          <CartesianGrid vertical={false} stroke="#e4e7e2" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#7c8582", fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis yAxisId="left" tickFormatter={currencyTick} axisLine={false} tickLine={false} tick={{ fill: "#7c8582", fontSize: 9 }} width={58} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(value) => `${value}%`} axisLine={false} tickLine={false} tick={{ fill: "#7c8582", fontSize: 9 }} width={35} />
          <Tooltip formatter={(value, name) => [name === "spend" ? formatInr(Number(value), false) : `${Number(value).toFixed(1)}%`, name === "spend" ? "Spend" : "Cumulative share"]} />
          <ReferenceLine yAxisId="right" y={80} stroke="#b57a18" strokeDasharray="4 4" />
          <Bar yAxisId="left" dataKey="spend" fill="#6c938c" radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#a66e16" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RiskSpendChart({ data }: { data: Array<{ name: string; risk: number; spend: number; size: number }> }) {
  return (
    <div className="chart" role="img" aria-label="Supplier risk versus spend bubble chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <CartesianGrid stroke="#e4e7e2" />
          <XAxis type="number" dataKey="risk" name="Risk" domain={[0, 100]} tickFormatter={(v) => `${v}`} tick={{ fontSize: 10 }} label={{ value: "Operational risk", position: "insideBottom", offset: -7, fontSize: 10 }} />
          <YAxis type="number" dataKey="spend" name="Spend" tickFormatter={currencyTick} tick={{ fontSize: 10 }} width={62} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value, name) => [name === "Spend" ? formatInr(Number(value), false) : Number(value).toFixed(1), name]} />
          <Scatter data={data} fill="#174f48" shape="circle" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WaterfallBars({ items }: { items: Array<{ label: string; value: number; tone?: string }> }) {
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  return <div className="waterfall" role="img" aria-label="Cost waterfall">{items.map((item) => <div key={item.label}><span>{item.label}</span><div><i className={item.tone ?? ""} style={{ width: `${Math.max(3, Math.abs(item.value) / max * 100)}%` }} /></div><strong className="numeric">{formatInr(item.value, false)}</strong></div>)}</div>;
}
