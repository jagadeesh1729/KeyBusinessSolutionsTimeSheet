import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { toPascalCase, shouldSkipInput } from './utils/pascalCase'
import './App.css'
import Login from './component/mocules/Login'
import ProjectManagerDashboard from './component/pages/ProjectManagerDashboard'
import AdminDashboardPage from './component/pages/AdminDashboardPage'
import EmployeeDashboardPage from './component/pages/EmployeeDashboardPage'
import ScheduleMeetingPage from './component/pages/ScheduleMeetingPage'
import ProtectedRoute from './component/utils/ProtectedRoute.tsx'
import Layout from './component/layout/Layout.tsx'
import SignupGate from './component/mocules/SignGate.tsx'
import ApprovalDashboard from './component/pages/ApprovalDashboard.tsx'
import UserTimesheetEntry from './component/pages/UserTimesheetEntry.tsx'
import TimesheetHistory from './component/pages/TimesheetHistory.tsx'
import PreviousDrafts from './component/pages/PreviousDrafts.tsx'
import OfferLetter from './component/pages/OfferLetter.tsx'
import EditableDocWrapper from './component/pages/EditableDocWrapper.tsx'
import PagedView from './component/pages/PagedView.tsx'

function App() {
  useEffect(() => {
    const handler = (ev: Event) => {
      const target = ev.target as (HTMLInputElement | HTMLTextAreaElement | null)
      if (!target) return
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return

      const el = target as HTMLInputElement | HTMLTextAreaElement
      if (shouldSkipInput(el)) return

      const original = el.value
      if (!original || /^\s*$/.test(original)) return

      const transformed = toPascalCase(original)
      if (transformed !== original) {
        const start = (el as HTMLInputElement).selectionStart ?? null
        const end = (el as HTMLInputElement).selectionEnd ?? null
        el.value = transformed
        try {
          if (start !== null && end !== null) (el as HTMLInputElement).setSelectionRange(start, end)
        } catch {}
      }
    }

    document.addEventListener('input', handler, true)
    return () => document.removeEventListener('input', handler, true)
  }, [])

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/signup" element={<SignupGate/>} />
          <Route path="/login" element={<Login />} />
          <Route path="/offer-letter" element={<EditableDocWrapper><PagedView><OfferLetter date='05/01/2020' full_name='Naga Jagadeesh Krishna Kandula' status='your Optional Practical Training (OPT) ' university='Texas Tech University' position='Software Engineer' compensation='unpaid internship' no_of_hours='twenty hours' start_date='06/11/2020' /></PagedView></EditableDocWrapper>} />

          {/* All routes inside ProtectedRoute require authentication */}
          <Route element={<ProtectedRoute />}>
            {/* Default redirect after login based on role */}
            <Route path="/" element={<></>} />

            {/* Employee/User Routes */}
      {/* Employee/User Routes */}
            <Route path="/employee" element={<EmployeeDashboardPage />}>
              <Route index element={<Navigate to="timesheet" replace />} />
              <Route path="timesheet" element={<UserTimesheetEntry />} />
              <Route path="timesheet/edit/:id" element={<UserTimesheetEntry />} />
              <Route path="drafts" element={<PreviousDrafts />} />
              <Route path="history" element={<TimesheetHistory />} />
              {/** Profile view is rendered within EmployeeDashboardPage itself based on the route; no direct element here */}
              <Route path="profile" element={<></>} />
            </Route>
            
            {/* PM Routes */}
            <Route path="/pm-dashboard" element={<ProjectManagerDashboard />}>
              <Route index element={<ApprovalDashboard />} />
              <Route path="schedule-meeting" element={<ScheduleMeetingPage />} />
            </Route>
            
            {/* Admin Routes (employer: stats + timesheets via tabs) */}
            <Route path="/admin" element={<AdminDashboardPage />} />

            {/* Removed standalone timesheets route; integrated into Admin dashboard */}
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
