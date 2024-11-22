import React from 'react';
import { Card } from '../../components/ui/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Monitoring: React.FC = () => {
  // Mock data for the charts
  const cpuData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    value: Math.floor(Math.random() * 100),
  }));

  const memoryData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    value: Math.floor(Math.random() * 16),
  }));

  const networkData = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    incoming: Math.floor(Math.random() * 100),
    outgoing: Math.floor(Math.random() * 100),
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Monitoring</h1>
          <div className="flex space-x-4">
            <select className="px-3 py-2 rounded-md border">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
            <button className="bg-primary text-white px-4 py-2 rounded-md">
              Export Data
            </button>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">CPU Usage</h3>
            <div className="text-3xl font-bold">45%</div>
            <div className="text-sm text-muted-foreground">4 cores / 3.2GHz</div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Memory Usage</h3>
            <div className="text-3xl font-bold">8.2GB</div>
            <div className="text-sm text-muted-foreground">of 16GB</div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-2">Network I/O</h3>
            <div className="text-3xl font-bold">2.4MB/s</div>
            <div className="text-sm text-muted-foreground">↑ 1.2MB/s ↓ 1.2MB/s</div>
          </Card>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* CPU Usage Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">CPU Usage Over Time</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cpuData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis unit="%" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Memory Usage Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Memory Usage Over Time</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={memoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis unit="GB" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#16a34a"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Network I/O Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Network I/O Over Time</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={networkData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis unit="MB/s" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    name="Incoming"
                    dataKey="incoming"
                    stroke="#dc2626"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    name="Outgoing"
                    dataKey="outgoing"
                    stroke="#9333ea"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Monitoring;
