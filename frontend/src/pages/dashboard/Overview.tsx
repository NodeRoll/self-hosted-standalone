import React from 'react';
import { Card } from '@/components/ui/Card';

const stats = [
  { name: 'Total Applications', value: '12', change: '+2.1%', changeType: 'positive' },
  { name: 'Active Deployments', value: '24', change: '+10.5%', changeType: 'positive' },
  { name: 'Resource Usage', value: '85%', change: '-3.2%', changeType: 'negative' },
  { name: 'Uptime', value: '99.9%', change: '+0.1%', changeType: 'positive' },
];

const recentDeployments = [
  {
    id: 1,
    app: 'Frontend App',
    environment: 'Production',
    status: 'success',
    timestamp: '2 minutes ago',
  },
  {
    id: 2,
    app: 'API Service',
    environment: 'Staging',
    status: 'pending',
    timestamp: '5 minutes ago',
  },
  {
    id: 3,
    app: 'Database Migration',
    environment: 'Development',
    status: 'failed',
    timestamp: '10 minutes ago',
  },
];

const Overview = () => {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Welcome back!</h2>
        <p className="mt-2 text-sm text-gray-600">
          Here's what's happening with your applications today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
              </div>
              <div
                className={`flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  stat.changeType === 'positive'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {stat.change}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Deployments */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Deployments</h3>
        <div className="overflow-hidden bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Application
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Environment
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {recentDeployments.map((deployment) => (
                <tr key={deployment.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {deployment.app}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {deployment.environment}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        deployment.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : deployment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {deployment.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {deployment.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Graph */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">System Activity</h3>
        <Card className="p-6">
          <div className="h-[300px] w-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Activity Graph Placeholder</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
