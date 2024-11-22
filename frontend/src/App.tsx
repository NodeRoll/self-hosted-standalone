import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from '@/components/layout/DashboardLayout';

// Pages
import Overview from '@/pages/dashboard/Overview';
import Applications from '@/pages/dashboard/Applications';
import Deployments from '@/pages/dashboard/Deployments';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />
        
        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route path="overview" element={<Overview />} />
          <Route path="applications" element={<Applications />} />
          <Route path="deployments" element={<Deployments />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App
