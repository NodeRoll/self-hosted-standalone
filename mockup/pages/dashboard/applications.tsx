import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const applications = [
  {
    id: 1,
    name: 'Blog API',
    description: 'RESTful API for the blog platform',
    status: 'running',
    version: 'v1.2.3',
    lastDeployed: '2 hours ago',
    environment: 'production',
    resourceUsage: {
      cpu: '12%',
      memory: '256MB',
      storage: '1.2GB',
    },
  },
  {
    id: 2,
    name: 'Auth Service',
    description: 'Authentication and authorization service',
    status: 'running',
    version: 'v2.0.1',
    lastDeployed: '1 day ago',
    environment: 'production',
    resourceUsage: {
      cpu: '8%',
      memory: '512MB',
      storage: '800MB',
    },
  },
  {
    id: 3,
    name: 'Frontend App',
    description: 'React-based web application',
    status: 'updating',
    version: 'v3.1.0',
    lastDeployed: '5 minutes ago',
    environment: 'staging',
    resourceUsage: {
      cpu: '15%',
      memory: '1GB',
      storage: '2.5GB',
    },
  },
];

const Applications = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Applications</h2>
            <p className="mt-2 text-sm text-gray-600">
              Manage and monitor your running applications.
            </p>
          </div>
          <Button>
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Application
          </Button>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {applications.map((app) => (
            <Card key={app.id} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      app.status === 'running'
                        ? 'bg-green-400'
                        : app.status === 'updating'
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <h3 className="text-lg font-medium text-gray-900">{app.name}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Restart
                  </Button>
                  <Button variant="outline" size="sm">
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Settings
                  </Button>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">{app.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Version</p>
                      <p className="font-medium text-gray-900">{app.version}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Environment</p>
                      <p className="font-medium text-gray-900">{app.environment}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Deployed</p>
                      <p className="font-medium text-gray-900">{app.lastDeployed}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="font-medium text-gray-900 capitalize">{app.status}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900">Resource Usage</h4>
                    <div className="mt-2 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">CPU</p>
                        <p className="text-sm font-medium text-gray-900">
                          {app.resourceUsage.cpu}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Memory</p>
                        <p className="text-sm font-medium text-gray-900">
                          {app.resourceUsage.memory}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Storage</p>
                        <p className="text-sm font-medium text-gray-900">
                          {app.resourceUsage.storage}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Applications;
