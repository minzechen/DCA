"use client"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ScatterChart as RechartsScatterChart,
  Scatter,
} from "recharts"

// Colors for charts
const COLORS = [
  "#3b82f6", // blue
  "#f87171", // red
  "#4ade80", // green
  "#facc15", // yellow
  "#a855f7", // purple
  "#ec4899", // pink
  "#f97316", // orange
  "#06b6d4", // cyan
]

// Bar Chart Component
interface BarChartProps {
  data: any[]
  categories: string[]
  index: string
  colors?: string[]
  showLegend?: boolean
  showTooltip?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  showGridLines?: boolean
  yAxisWidth?: number
}

export function BarChart({
  data,
  categories,
  index,
  colors = COLORS,
  showLegend = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  showGridLines = true,
  yAxisWidth = 50,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data.flatMap((series) => series.data)}
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 20,
        }}
      >
        {showGridLines && <CartesianGrid strokeDasharray="3 3" />}
        {showXAxis && <XAxis dataKey={index} />}
        {showYAxis && <YAxis width={yAxisWidth} />}
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        {data.map((series, index) => (
          <Bar key={series.name} dataKey="y" name={series.name} fill={colors[index % colors.length]} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

// Line Chart Component
interface LineChartProps {
  data: any[]
  categories: string[]
  index: string
  colors?: string[]
  showLegend?: boolean
  showTooltip?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  showGridLines?: boolean
  yAxisWidth?: number
}

export function LineChart({
  data,
  categories,
  index,
  colors = COLORS,
  showLegend = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  showGridLines = true,
  yAxisWidth = 50,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={data.flatMap((series) => series.data)}
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 20,
        }}
      >
        {showGridLines && <CartesianGrid strokeDasharray="3 3" />}
        {showXAxis && <XAxis dataKey={index} />}
        {showYAxis && <YAxis width={yAxisWidth} />}
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        {data.map((series, index) => (
          <Line
            key={series.name}
            type="monotone"
            dataKey="y"
            name={series.name}
            stroke={colors[index % colors.length]}
            activeDot={{ r: 8 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

// Pie Chart Component
interface PieChartProps {
  data: Array<{ name: string; value: number }>
  colors?: string[]
  showLegend?: boolean
  showTooltip?: boolean
}

export function PieChart({ data, colors = COLORS, showLegend = true, showTooltip = true }: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}

// Scatter Chart Component
interface ScatterChartProps {
  data: any[]
  colors?: string[]
  showLegend?: boolean
  showTooltip?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  showGridLines?: boolean
  yAxisWidth?: number
}

export function ScatterChart({
  data,
  colors = COLORS,
  showLegend = true,
  showTooltip = true,
  showXAxis = true,
  showYAxis = true,
  showGridLines = true,
  yAxisWidth = 50,
}: ScatterChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsScatterChart
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 20,
        }}
      >
        {showGridLines && <CartesianGrid strokeDasharray="3 3" />}
        {showXAxis && <XAxis dataKey="x" type="number" />}
        {showYAxis && <YAxis dataKey="y" type="number" width={yAxisWidth} />}
        {showTooltip && <Tooltip cursor={{ strokeDasharray: "3 3" }} />}
        {showLegend && <Legend />}
        {data.map((series, index) => (
          <Scatter key={series.name} name={series.name} data={series.data} fill={colors[index % colors.length]} />
        ))}
      </RechartsScatterChart>
    </ResponsiveContainer>
  )
}
