import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

const data = [
  { day: "Mon", heartRate: 72, bloodPressure: 120 },
  { day: "Tue", heartRate: 75, bloodPressure: 118 },
  { day: "Wed", heartRate: 71, bloodPressure: 122 },
  { day: "Thu", heartRate: 78, bloodPressure: 119 },
  { day: "Fri", heartRate: 74, bloodPressure: 121 },
  { day: "Sat", heartRate: 70, bloodPressure: 115 },
  { day: "Sun", heartRate: 73, bloodPressure: 118 },
]

export function VitalsChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHeart" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBP" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Area type="monotone" dataKey="heartRate" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorHeart)" name="Heart Rate" />
          <Area type="monotone" dataKey="bloodPressure" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorBP)" name="Blood Pressure (Systolic)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
