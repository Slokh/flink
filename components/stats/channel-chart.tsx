"use client";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";

const XAxisTick = ({ x, y, payload }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="middle"
        fill="#666"
        style={{ fontSize: "12px" }}
      >
        {format(new Date(payload.value), "MMM d, yyyy")}
      </text>
    </g>
  );
};

const YAxisTick = ({ x, y, payload }: any) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dx={-12}
        dy={4}
        textAnchor="middle"
        fill="#666"
        style={{ fontSize: "12px" }}
      >
        {payload.value}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 border rounded-md bg-foreground text-background">
        <div className="flex flex-row space-x-1 items-center">
          <div className="font-semibold text-xs text-zinc-500">Date:</div>
          <div className="text-sm">
            {format(new Date(label), "MMM d, yyyy")}
          </div>
        </div>
        <div className="flex flex-row space-x-1 items-center">
          <div className="font-semibold text-xs text-zinc-500">Posts:</div>
          <div className="text-sm">{payload[0].value}</div>
        </div>
        <div className="flex flex-row space-x-1 items-center">
          <div className="font-semibold text-xs text-zinc-500">Replies:</div>
          <div className="text-sm">{payload[1].value}</div>
        </div>
        <div className="flex flex-row space-x-1 items-center">
          <div className="font-semibold text-xs text-zinc-500">Activity:</div>
          <div className="text-sm">{payload[2].value.toFixed(0)}</div>
        </div>
      </div>
    );
  }

  return null;
};

const renderLegend = (props: any) => {
  const { payload } = props;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "12px",
      }}
    >
      {payload.map((entry: any, index: any) => (
        <div
          key={`item-${index}`}
          style={{
            color: "white",
            display: "flex",
            alignItems: "center",
            marginRight: "10px",
          }}
        >
          <svg
            width="14"
            height="14"
            style={{ display: "inline-block", marginRight: "4px" }}
          >
            <rect width="14" height="14" style={{ fill: entry.color }} />
          </svg>
          {entry.value}
        </div>
      ))}
    </div>
  );
};

export const ChannelChart = ({ data }: { data: any[] }) => {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (ref.current) {
      // @ts-ignore
      setWidth(ref.current.offsetWidth);
    }
  }, []);

  return (
    <div ref={ref} className="hidden lg:flex mb-4 items-center justify-center">
      <ComposedChart
        width={width}
        height={300}
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 5,
          bottom: 5,
        }}
      >
        <CartesianGrid stroke="#444" />
        <XAxis dataKey="timestamp" tick={<XAxisTick />} />
        <YAxis tick={<YAxisTick />} />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
        <Bar dataKey="posts" name="Posts" stackId="a" fill="#6D28D9" />
        <Bar dataKey="replies" name="Replies" stackId="a" fill="#8B5CF6" />
        <Line
          dataKey="engagement"
          name="Engagement"
          stroke="white"
          dot={false}
        />
      </ComposedChart>
    </div>
  );
};
