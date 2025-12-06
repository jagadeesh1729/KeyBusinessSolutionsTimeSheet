import { Navigate, Route, Routes } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { toPascalCase, shouldSkipInput } from './utils/pascalCase'
import './App.css'
import Layout from './component/layout/Layout.tsx'
import ProtectedRoute from './component/utils/ProtectedRoute.tsx'

const Login = lazy(() => import('./component/mocules/Login'))
const ProjectManagerDashboard = lazy(() => import('./component/pages/ProjectManagerDashboard'))
const AdminDashboardPage = lazy(() => import('./component/pages/AdminDashboardPage'))
const EmployeeDashboardPage = lazy(() => import('./component/pages/EmployeeDashboardPage'))
const SignupGate = lazy(() => import('./component/mocules/SignGate.tsx'))
const UserTimesheetEntry = lazy(() => import('./component/pages/UserTimesheetEntry.tsx'))
const TimesheetHistory = lazy(() => import('./component/pages/TimesheetHistory.tsx'))
const PreviousDrafts = lazy(() => import('./component/pages/PreviousDrafts.tsx'))
const SupportPage = lazy(() => import('./component/pages/SupportPage.tsx'))
const OfferLetter = lazy(() => import('./component/offerletter/OfferLetter.tsx'))
const AdminOfferLetterPanel = lazy(() => import('./component/offerletter/AdminOfferLetterPanel.tsx'))

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
    <Suspense fallback={<div />}>
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
            <Route path="support" element={<SupportPage />} />
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
    </Suspense>
  )
}

export default App
