import { Navigate, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { toPascalCase, shouldSkipInput } from './utils/pascalCase'
import './App.css'
import Login from './component/mocules/Login'
import ProjectManagerDashboard from './component/pages/ProjectManagerDashboard'
import AdminDashboardPage from './component/pages/AdminDashboardPage'
import EmployeeDashboardPage from './component/pages/EmployeeDashboardPage'
import ProtectedRoute from './component/utils/ProtectedRoute.tsx'
import Layout from './component/layout/Layout.tsx'
import SignupGate from './component/mocules/SignGate.tsx'
import UserTimesheetEntry from './component/pages/UserTimesheetEntry.tsx'
import TimesheetHistory from './component/pages/TimesheetHistory.tsx'
import PreviousDrafts from './component/pages/PreviousDrafts.tsx'
import OfferLetter from './component/offerletter/OfferLetter.tsx'
import AdminOfferLetterPanel from './component/offerletter/AdminOfferLetterPanel.tsx'

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
        {/* PM Dashboard - outside Layout (has its own sidebar) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/pm-dashboard" element={<ProjectManagerDashboard />} />
        </Route>

        {/* Admin Dashboard - outside Layout (has its own sidebar) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        {/* Employee Dashboard - outside Layout (has its own sidebar) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/employee" element={<EmployeeDashboardPage />}>
            <Route index element={<Navigate to="timesheet" replace />} />
            <Route path="timesheet" element={<UserTimesheetEntry />} />
            <Route path="timesheet/edit/:id" element={<UserTimesheetEntry />} />
            <Route path="drafts" element={<PreviousDrafts />} />
            <Route path="history" element={<TimesheetHistory />} />
            <Route path="profile" element={<></>} />
          </Route>
        </Route>

        <Route element={<Layout />}>
          <Route path="/signup" element={<SignupGate/>} />
          <Route path="/login" element={<Login />} />
          <Route path="/offer-letter" element={<OfferLetter date='05/01/2020' full_name='Naga Jagadeesh Krishna Kandula' status='your Optional Practical Training (OPT) ' university='Texas Tech University' position='Software Engineer' compensation='unpaid internship' no_of_hours='twenty hours' start_date='06/11/2020' />} />
          <Route path='/offer' element={<AdminOfferLetterPanel/>}/>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<></>} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}

export default App
