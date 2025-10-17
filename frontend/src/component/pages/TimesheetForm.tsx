import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Alert,
  Paper,
  Button,
  TextField,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import { useNavigate } from 'react-router-dom';
import { useTimesheetMutations } from '../hooks/useTimesheet';
import { useAuth } from '../../context/AuthContext';
import type { DailyEntry, TaskEntry, Timesheet } from '../types/Holiday';
import type Project from '../types/project';

interface TimesheetRow {
  id: string;
  date: string;
  description: string;
  hours: string;
}

const sortRowsByDate = (rows: TimesheetRow[]): TimesheetRow[] => {
  return [...rows].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
};

// Helpers to treat YYYY-MM-DD as local dates (avoid timezone shifts)
const parseLocalYMD = (ymd: string): Date => {
  const [y, m, d] = ymd.split('-').map((v) => parseInt(v, 10));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
};

const formatLocalYMD = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const generateWeekdays = (startDate: string, endDate: string): string[] => {
  const weekdays: string[] = [];
  if (!startDate || !endDate) return weekdays;
  const start = parseLocalYMD(startDate);
  const end = parseLocalYMD(endDate);
  const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (current.getTime() <= end.getTime()) {
    const dayOfWeek = current.getDay();
    // Exclude Sunday (0) and Saturday (6)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      weekdays.push(formatLocalYMD(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return weekdays;
};

const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr) return 'Invalid Date';
  const date = parseLocalYMD(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
};

const getDraftStorageKey = (userId?: string | number, scopeId?: number | string, mode: 'new' | 'edit' = 'new') =>
  `ts_draft_${userId ?? 'anon'}_${scopeId ?? 'noscope'}_${mode}`;

interface TimesheetFormProps {
  timesheet: Timesheet | null;
  project: Project | null;
  isEditMode: boolean;
  onDataRefetch: () => void;
}

const TimesheetForm: React.FC<TimesheetFormProps> = ({ timesheet, project, isEditMode, onDataRefetch }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateTimesheet, submitTimesheet, autoApproveTimesheet, loading: mutationLoading, error: mutationError } = useTimesheetMutations();

  const [timesheetRows, setTimesheetRows] = useState<TimesheetRow[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const effectivePeriodType = useMemo(() => {
    if (!project) return undefined;
    const p: any = project;
    return p.period_type ?? p.periodType ?? 'weekly';
  }, [project]);

  const isAutoApprove = useMemo(() => {
    if (!project) return false;
    const p: any = project;
    const val = p.auto_approve ?? p.autoApprove;
    if (typeof val === 'string') return val === '1' || val.toLowerCase() === 'true';
    return Boolean(val);
  }, [project]);

  const maxHours = useMemo(() => {
    const weeklyHours = user?.no_of_hours || 40;
    const periodType = effectivePeriodType;
    if (!periodType) return weeklyHours;

    switch (periodType) {
      case 'bi-monthly': return weeklyHours * 2;
      case 'monthly': return weeklyHours * 4;
      case 'weekly': default: return weeklyHours;
    }
  }, [user?.no_of_hours, effectivePeriodType]);

  const canEdit = useMemo(() => {
    if (!project) return false;
    if (!timesheet) return true; // Can create new
    return timesheet.status === 'draft' || timesheet.status === 'rejected';
  }, [project, timesheet]);

  const isSubmitted = timesheet?.status === 'pending' || timesheet?.status === 'approved';

  useEffect(() => {
    if (project && timesheet) {
      const weekdays = generateWeekdays(timesheet.periodStart, timesheet.periodEnd);
      setAvailableDates(weekdays);

      const scopeId = timesheet.id?.toString();
      const storageKey = getDraftStorageKey(user?.userId, scopeId, isEditMode ? 'edit' : 'new');

      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed: TimesheetRow[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Keep only rows whose dates are weekdays within the period
            const weekdaySet = new Set(weekdays);
            const filtered = parsed.filter(row => row.date && weekdaySet.has(row.date));

            // Ensure one row per weekday in the range
            const existingDates = new Set(filtered.map(r => r.date));
            const completed: TimesheetRow[] = [...filtered];
            weekdays.forEach((d, idx) => {
              if (!existingDates.has(d)) {
                completed.push({
                  id: `${Date.now()}-${idx}`,
                  date: d,
                  description: '',
                  hours: '',
                });
              }
            });

            setTimesheetRows(
              completed.length > 0
                ? sortRowsByDate(completed)
                : sortRowsByDate(
                    weekdays.map((date, index) => ({
                      id: `${Date.now()}-${index}`,
                      date,
                      description: '',
                      hours: '',
                    }))
                  )
            );
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load draft from localStorage:', e);
      }

      if (timesheet.dailyEntries && timesheet.dailyEntries.length > 0) {
        const rows: TimesheetRow[] = [];
        const weekdaySet = new Set(weekdays);
        timesheet.dailyEntries.forEach((dayEntry, dayIndex) => {
          if (!weekdaySet.has(dayEntry.date)) return; // exclude weekends/out-of-range
          dayEntry.tasks.forEach((task, taskIndex) => {
            rows.push({
              id: `${dayIndex}-${taskIndex}-${Math.random()}`,
              date: dayEntry.date,
              description: task.name || '',
              hours: task.hours.toString(),
            });
          });
        });

        // Ensure one row per weekday in the range
        const existingDates = new Set(rows.map(r => r.date));
        weekdays.forEach((d, idx) => {
          if (!existingDates.has(d)) {
            rows.push({
              id: `${Date.now()}-${idx}`,
              date: d,
              description: '',
              hours: '',
            });
          }
        });

        setTimesheetRows(
          rows.length > 0
            ? sortRowsByDate(rows)
            : sortRowsByDate(
                weekdays.map((date, index) => ({
                  id: `${Date.now()}-${index}`,
                  date,
                  description: '',
                  hours: '',
                }))
              )
        );
      } else {
        // Default to one empty row per weekday in the period
        const defaultRows: TimesheetRow[] = weekdays.map((date, index) => ({
          id: `${Date.now()}-${index}`,
          date: date,
          description: '',
          hours: '',
        }));
        setTimesheetRows(sortRowsByDate(defaultRows));
      }
    }
  }, [project, timesheet, isEditMode, user?.userId]);

  useEffect(() => {
    if (!project || !timesheet) return;
    try {
      const scopeId = timesheet.id?.toString();
      const storageKey = getDraftStorageKey(user?.userId, scopeId, isEditMode ? 'edit' : 'new');
      if (timesheetRows && timesheetRows.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(timesheetRows));
      }
    } catch (e) {
      console.error('Failed to save draft to localStorage:', e);
    }
  }, [timesheetRows, isEditMode, project, timesheet, user?.userId]);

  useEffect(() => {
    if (mutationError) {
      setMessage({ type: 'error', text: mutationError });
    }
  }, [mutationError]);

  const handleAddRow = () => {
    const newRow: TimesheetRow = {
      id: `${Date.now()}-${Math.random()}`,
      date: availableDates.length > 0 ? availableDates[0] : '',
      description: '',
      hours: '',
    };
    setTimesheetRows([...timesheetRows, newRow]);
  };

  const handleDeleteRow = (id: string) => {
    if (timesheetRows.length === 1) {
      setMessage({ type: 'error', text: 'At least one row is required' });
      return;
    }
    setTimesheetRows(timesheetRows.filter(row => row.id !== id));
  };

  const handleRowChange = (id: string, field: keyof TimesheetRow, value: string) => {
    setTimesheetRows(timesheetRows.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const preparePayload = () => {
    const validRows = timesheetRows.filter(row => row.date && row.description && row.hours && parseFloat(row.hours) > 0);
    if (validRows.length === 0) {
      setMessage({ type: 'error', text: 'Please fill in at least one complete entry' });
      return null;
    }

    const entriesByDate: Record<string, TaskEntry[]> = {};
    validRows.forEach(row => {
      if (!entriesByDate[row.date]) {
        entriesByDate[row.date] = [];
      }
      entriesByDate[row.date].push({
        name: row.description,
        hours: parseFloat(row.hours),
      });
    });

    return Object.entries(entriesByDate).map(([date, tasks]) => ({
      date,
      hours: tasks.reduce((sum, task) => sum + task.hours, 0),
      tasks,
    }));
  };

  const handleSaveDraft = async () => {
    if (!project || !timesheet) {
      setMessage({ type: 'error', text: 'No project assigned' });
      return;
    }

    const dailyEntries = preparePayload();
    if (!dailyEntries) return;

    try {
      const saveResponse = await updateTimesheet({
        id: timesheet.id,
        periodStart: timesheet.periodStart,
        periodEnd: timesheet.periodEnd,
        dailyEntries: dailyEntries,
        status: 'draft',
      });

      if (saveResponse.success) {
        setMessage({ type: 'success', text: '✅ Timesheet saved as draft!' });
        onDataRefetch();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save timesheet' });
    }
  };

  const handleSubmitTimesheet = async () => {
    if (!project || !timesheet) {
      setMessage({ type: 'error', text: 'Cannot submit. Timesheet data is not available.' });
      return;
    }

    const dailyEntries = preparePayload();
    if (!dailyEntries) return;

    if (!timesheet.id) {
      setMessage({ type: 'error', text: 'Timesheet ID is missing. Cannot submit. Please save as draft first.' });
      return;
    }

    try {
      const newStatus = isAutoApprove ? 'approved' : 'pending';
      const updateData = {
        id: timesheet.id,
        periodStart: timesheet.periodStart,
        periodEnd: timesheet.periodEnd,
        dailyEntries: dailyEntries,
        status: newStatus,
      };

      const updateResponse = await updateTimesheet(updateData);

      if (updateResponse.success) {
        setMessage({ type: 'success', text: '✅ Timesheet submitted successfully!' });
        const scopeId = timesheet.id?.toString();
        const storageKey = getDraftStorageKey(user?.userId, scopeId, isEditMode ? 'edit' : 'new');
        localStorage.removeItem(storageKey);

        setTimeout(() => navigate('/employee/history'), 2000);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to submit timesheet' });
    }
  };

  const totalHours = timesheetRows.reduce((sum, row) => {
    const hours = parseFloat(row.hours);
    return sum + (isNaN(hours) ? 0 : hours);
  }, 0);

  return (
    <Container maxWidth="xl" className="py-8">
      <div className="flex justify-between items-center mb-6">
        <Typography variant="h4" className="font-bold text-gray-900">
          {isEditMode ? 'Edit Timesheet' : 'My Current Timesheet'}
        </Typography>
        <div className="space-x-2">
          <Button variant="outlined" startIcon={<HistoryIcon />} onClick={() => navigate('/employee/timesheet-history')}>
            View History
          </Button>
        </div>
      </div>

      {isEditMode && timesheet?.status === 'rejected' && (
        <Alert severity="warning" className="mb-4">
          <strong>Editing Rejected Timesheet</strong>
          <br />
          Rejection Reason: {timesheet.rejectionReason || 'No reason provided'}
        </Alert>
      )}

      {timesheet && (
        <Alert
          severity={
            timesheet.status === 'approved' ? 'success' :
            timesheet.status === 'pending' ? 'info' :
            timesheet.status === 'rejected' ? 'error' : 'warning'
          }
          className="mb-4"
        >
          <strong>Status: {timesheet.status?.toUpperCase() || 'DRAFT'}</strong>
          {timesheet.status === 'pending' && ' - Your timesheet is waiting for approval'}
          {timesheet.status === 'approved' && ' - Your timesheet has been approved'}
          {timesheet.status === 'rejected' && ` - Rejected: ${timesheet.rejectionReason || 'No reason provided'}`}
          {(timesheet.status === 'draft' || !timesheet.status) && ' - Save your work or submit for approval'}
        </Alert>
      )}

      {project && (
        <Alert
          severity={totalHours > maxHours ? 'error' : totalHours >= maxHours * 0.8 ? 'warning' : 'info'}
          className="mb-4"
        >
          Total Hours Logged: <strong>{totalHours.toFixed(2)} / {maxHours}</strong>
          {totalHours > maxHours && ' - You have exceeded the maximum hours!'}
        </Alert>
      )}

      {message && (
        <Alert severity={message.type} className="mb-4" onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {project && (
        <Paper elevation={2} className="p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <Typography variant="h6" className="font-semibold">{project.name}</Typography>
              <Typography variant="body2" color="textSecondary">
                Period: {effectivePeriodType} | Status: Active
                {isEditMode && ` | Editing Timesheet ID: ${timesheet?.id}`}
              </Typography>
            </div>
            <Chip
              label={`${totalHours.toFixed(2)} / ${maxHours} hours`}
              color={totalHours > maxHours ? 'error' : totalHours >= maxHours * 0.8 ? 'warning' : 'success'}
              sx={{ fontSize: '1.1rem', padding: '20px 12px', fontWeight: 'bold' }}
            />
          </div>
        </Paper>
      )}

      {project && (
        <Paper elevation={3} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <Typography variant="h6">Timesheet Entries</Typography>
            <Chip label={`Total Hours: ${totalHours.toFixed(2)}`} color="primary" variant="outlined" />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 font-semibold text-gray-700 border-b pb-2">
              <div className="col-span-3">Date</div>
              <div className="col-span-7">Task / Description</div>
              <div className="col-span-1">Hours</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {timesheetRows.map((row) => (
              <div key={row.id} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-3">
                  <FormControl fullWidth size="small">
                    <Select value={row.date} onChange={(e) => handleRowChange(row.id, 'date', e.target.value)} displayEmpty disabled={!canEdit}>
                      <MenuItem value="" disabled>Select Date</MenuItem>
                      {availableDates.map((date) => (
                        <MenuItem key={date} value={date}>{formatDateForDisplay(date)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                <div className="col-span-7">
                  <TextField size="small" fullWidth placeholder="Enter task details or description" value={row.description} onChange={(e) => handleRowChange(row.id, 'description', e.target.value)} disabled={!canEdit} />
                </div>
                <div className="col-span-1">
                  <TextField type="number" size="small" fullWidth placeholder="0.0" value={row.hours} onChange={(e) => handleRowChange(row.id, 'hours', e.target.value)} inputProps={{ min: 0, step: 0.5 }} disabled={!canEdit} />
                </div>
                <div className="col-span-1 flex justify-center">
                  <IconButton color="error" size="small" onClick={() => handleDeleteRow(row.id)} disabled={timesheetRows.length === 1 || !canEdit}>
                    <DeleteIcon />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6">
            <Button variant="outlined" color="primary" onClick={handleAddRow} startIcon={<AddIcon />} disabled={!canEdit}>
              Add Row
            </Button>
            <div className="space-x-3">
              {canEdit && (
                <>
                  <Button variant="outlined" color="primary" onClick={handleSaveDraft} disabled={mutationLoading}>
                    Save Draft
                  </Button>
                  <Button variant="contained" color="success" size="large" onClick={handleSubmitTimesheet} disabled={mutationLoading || !timesheet || totalHours > maxHours}>
                    {timesheet?.status === 'rejected' ? 'Resubmit' : 'Submit'} Timesheet
                  </Button>
                </>
              )}
              {isSubmitted && (
                <Chip
                  label={`Timesheet ${timesheet?.status}`}
                  color={timesheet?.status === 'approved' ? 'success' : 'info'}
                  size="medium"
                  sx={{ fontSize: '1rem', padding: '16px 12px' }}
                />
              )}
            </div>
          </div>
        </Paper>
      )}

      {!project && (
        <Paper elevation={1} className="mt-6 p-8">
          <Typography variant="body1" color="textSecondary" align="center">
            No project assigned. Please contact your administrator.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default TimesheetForm;
