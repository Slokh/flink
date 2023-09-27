"use client";
import { CHANNELS_BY_URL } from "@/lib/channels";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const ChannelChart = ({ url, data }: { url: string; data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        width={500}
        height={300}
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="posts" name="Posts" stackId="a" fill="white" />
        <Bar dataKey="replies" name="Replies" stackId="a" fill="red" />
      </BarChart>
    </ResponsiveContainer>
  );
};
