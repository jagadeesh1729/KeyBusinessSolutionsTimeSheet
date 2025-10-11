import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './component/mocules/Login'
import EmployeeTimesheetPage from './component/pages/EmployeeTimesheetPage'
import MyTimesheetsHistoryPage from './component/pages/MyTimesheetsHistoryPage'
import ProjectManagerDashboard from './component/pages/ProjectManagerDashboard'
import AdminDashboardPage from './component/pages/AdminDashboardPage'
import EmployeeDashboardPage from './component/pages/EmployeeDashboardPage'
import ScheduleMeetingPage from './component/pages/ScheduleMeetingPage'
import ProtectedRoute from './component/utils/ProtectedRoute'
import Layout from './component/layout/Layout.tsx'
import SignupGate from './component/mocules/SignGate.tsx'
import TimesheetPage from './component/pages/TimesheetPage.tsx'
import ApprovalDashboard from './component/pages/ApprovalDashboard.tsx'
import TimesheetManagement from './component/pages/TimesheetManagement.tsx'
import UserTimesheetEntry from './component/pages/UserTimesheetEntry.tsx'
import TimesheetHistory from './component/pages/TimesheetHistory.tsx'
import TimesheetEntry from './component/pages/UserTimesheetEntry.tsx'
import PreviousDrafts from './component/pages/PreviousDrafts.tsx'
import EmployeeProfileView from './component/mocules/EmployeeProfileView.tsx'

function App() {

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/signup" element={<SignupGate/>} />
          <Route path="/login" element={<Login />} />

          {/* All routes inside ProtectedRoute require authentication */}
          <Route element={<ProtectedRoute />}>
            {/* Default redirect after login */}
            <Route path="/" element={<Navigate to="/admin" replace />} />

            {/* Employee/User Routes */}
      {/* Employee/User Routes */}
            <Route path="/employee" element={<EmployeeDashboardPage />}>
              <Route index element={<Navigate to="timesheet" replace />} />
              <Route path="timesheet" element={<UserTimesheetEntry />} />
              <Route path="timesheet/edit/:id" element={<UserTimesheetEntry />} />
              <Route path="drafts" element={<PreviousDrafts />} />
              <Route path="history" element={<TimesheetHistory />} />
              <Route path="profile" element={<EmployeeProfileView />} />
            </Route>
            
            {/* PM Routes */}
            <Route path="/pm" element={<ProjectManagerDashboard />}>
              <Route index element={<ApprovalDashboard />} />
              <Route path="schedule-meeting" element={<ScheduleMeetingPage />} />
            </Route>
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboardPage />} >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TimesheetManagement />} />
            </Route>

            {/* Generic/Old Routes (consider refactoring or removing) */}
            <Route path="/timesheets" element={<TimesheetPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
