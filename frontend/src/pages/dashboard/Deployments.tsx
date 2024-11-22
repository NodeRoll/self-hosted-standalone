import React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const deployments = [
  {
    id: 1,
    app: 'Blog API',
    environment: 'production',
    status: 'success',
    version: 'v1.2.3',
    commit: '3b7f8a9',
    deployedBy: 'John Doe',
    deployedAt: '2 hours ago',
    duration: '45s',
    changes: [
      'Updated user authentication',
      'Fixed pagination bug',
      'Added new API endpoints',
    ],
  },
  {
    id: 2,
    app: 'Auth Service',
    environment: 'staging',
    status: 'pending',
    version: 'v2.0.1',
    commit: '9c4e2b1',
    deployedBy: 'Jane Smith',
    deployedAt: '10 minutes ago',
    duration: '1m 20s',
    changes: [
      'Implemented OAuth2 flow',
      'Updated dependencies',
      'Added unit tests',
    ],
  },
  {
    id: 3,
    app: 'Frontend App',
    environment: 'development',
    status: 'failed',
    version: 'v3.1.0',
    commit: '5d2f7c6',
    deployedBy: 'Mike Johnson',
    deployedAt: '1 hour ago',
    duration: '2m 15s',
    changes: [
      'Redesigned dashboard UI',
      'Added new features',
      'Fixed build errors',
    ],
  },
];

const Deployments = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Deployments</h2>
          <p className="mt-2 text-sm text-gray-600">
            Monitor and manage your application deployments.
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
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          New Deployment
        </Button>
      </div>

      {/* Deployments List */}
      <div className="space-y-6">
        {deployments.map((deployment) => (
          <Card key={deployment.id} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div className="flex items-center space-x-4">
                <div
                  className={`h-3 w-3 rounded-full ${
                    deployment.status === 'success'
                      ? 'bg-green-400'
                      : deployment.status === 'pending'
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                  }`}
                />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{deployment.app}</h3>
                  <p className="text-sm text-gray-500">
                    {deployment.environment} • {deployment.version}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-900">{deployment.deployedAt}</p>
                  <p className="text-sm text-gray-500">Duration: {deployment.duration}</p>
                </div>
                <Button variant="outline" size="sm">
                  View Logs
                </Button>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Deployed By</p>
                    <p className="font-medium text-gray-900">{deployment.deployedBy}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Commit</p>
                    <p className="font-medium text-gray-900">{deployment.commit}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Status</p>
                    <p
                      className={`font-medium capitalize ${
                        deployment.status === 'success'
                          ? 'text-green-600'
                          : deployment.status === 'pending'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {deployment.status}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Changes</h4>
                  <ul className="mt-2 space-y-1">
                    {deployment.changes.map((change, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {deployment.status === 'failed' && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Deployment Failed
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>Build failed due to compilation errors. Check logs for details.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Deployments;
