import React from 'react';
import { Card } from '../../components/ui/Card';

const Settings: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Settings</h1>
          <button className="bg-primary text-white px-4 py-2 rounded-md">
            Save Changes
          </button>
        </div>

        {/* General Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">General Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Instance Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-md border"
                placeholder="My NodeRoll Instance"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Domain</label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-md border"
                placeholder="noderoll.example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time Zone</label>
              <select className="w-full px-3 py-2 rounded-md border">
                <option>UTC</option>
                <option>America/New_York</option>
                <option>Europe/London</option>
                <option>Asia/Tokyo</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Security</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">GitHub OAuth</label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  className="px-3 py-2 rounded-md border"
                  placeholder="Client ID"
                />
                <input
                  type="password"
                  className="px-3 py-2 rounded-md border"
                  placeholder="Client Secret"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="twoFactor" className="rounded border-gray-300" />
              <label htmlFor="twoFactor" className="text-sm font-medium">
                Enable Two-Factor Authentication
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="audit" className="rounded border-gray-300" />
              <label htmlFor="audit" className="text-sm font-medium">
                Enable Audit Logging
              </label>
            </div>
          </div>
        </Card>

        {/* Deployment Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Deployment</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Default Node.js Version</label>
              <select className="w-full px-3 py-2 rounded-md border">
                <option>18.x LTS</option>
                <option>20.x LTS</option>
                <option>21.x Current</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Build Cache Duration</label>
              <select className="w-full px-3 py-2 rounded-md border">
                <option>24 hours</option>
                <option>48 hours</option>
                <option>7 days</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="autoUpdate" className="rounded border-gray-300" />
              <label htmlFor="autoUpdate" className="text-sm font-medium">
                Enable Automatic Updates
              </label>
            </div>
          </div>
        </Card>

        {/* Resource Limits */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Resource Limits</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Default CPU Limit (cores)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-md border"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Default Memory Limit (MB)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-md border"
                placeholder="512"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Storage Quota per App (GB)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 rounded-md border"
                placeholder="10"
              />
            </div>
          </div>
        </Card>

        {/* Email Notifications */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Email Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="deployNotif" className="rounded border-gray-300" />
              <label htmlFor="deployNotif" className="text-sm font-medium">
                Deployment Status
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="errorNotif" className="rounded border-gray-300" />
              <label htmlFor="errorNotif" className="text-sm font-medium">
                Error Alerts
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="updateNotif" className="rounded border-gray-300" />
              <label htmlFor="updateNotif" className="text-sm font-medium">
                System Updates
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Additional Email Recipients
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 rounded-md border"
                placeholder="email@example.com, another@example.com"
              />
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-200">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
          <div className="space-y-4">
            <button className="w-full px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50">
              Reset All Settings
            </button>
            <button className="w-full px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">
              Delete All Data
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
