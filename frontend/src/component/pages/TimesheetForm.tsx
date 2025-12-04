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
  Box,
  Stack,
  Card,
  CardContent,
  Grid,
  Divider,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
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
  console.log('TimesheetForm received project prop:', project);
  const theme = useTheme();
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

  const projectCode = useMemo(() => {
    if (!project) return '';
    const p: any = project;
    // Be flexible with possible naming from API
    return p.code ?? p.project_code ?? p.projectCode ?? '';
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header Section */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
              {isEditMode ? 'Edit Timesheet' : 'Current Timesheet'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isEditMode ? 'Update your timesheet entries below.' : 'Manage your weekly hours and tasks.'}
            </Typography>
          </Box>
          <Button 
            variant="outlined" 
            startIcon={<HistoryIcon />} 
            onClick={() => navigate('/employee/history')}
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none', 
              fontWeight: 600,
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.05) }
            }}
          >
            View History
          </Button>
        </Box>

        {/* Alerts Section */}
        <Stack spacing={2}>
          {isEditMode && timesheet?.status === 'rejected' && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Editing Rejected Timesheet</Typography>
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
              sx={{ borderRadius: 2 }}
            >
              <strong>Status: {timesheet.status?.toUpperCase() || 'DRAFT'}</strong>
              {timesheet.status === 'pending' && ' - Your timesheet is waiting for approval'}
              {timesheet.status === 'approved' && ' - Your timesheet has been approved'}
              {timesheet.status === 'rejected' && ` - Rejected: ${timesheet.rejectionReason || 'No reason provided'}`}
              {(timesheet.status === 'draft' || !timesheet.status) && ' - Save your work or submit for approval'}
            </Alert>
          )}
          {message && (
            <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ borderRadius: 2 }}>
              {message.text}
            </Alert>
          )}
        </Stack>

        {/* Project Info Card */}
        {project && (
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 3, 
              border: '1px solid', 
              borderColor: 'divider'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={1}>
                    <Box 
                      sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main'
                      }}
                    >
                      <WorkOutlineIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight="700" color="text.primary">
                        {project.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Project Code: {projectCode || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                    <Chip 
                      icon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
                      label={`Period: ${effectivePeriodType}`} 
                      size="small" 
                      variant="outlined" 
                      sx={{ borderRadius: 1.5 }}
                    />
                    <Chip 
                      icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                      label={`${totalHours.toFixed(2)} / ${maxHours} hrs`}
                      color={totalHours > maxHours ? 'error' : totalHours >= maxHours * 0.8 ? 'warning' : 'success'}
                      variant="filled"
                      sx={{ borderRadius: 1.5, fontWeight: 600 }}
                    />
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Timesheet Entries Card */}
        {project ? (
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 3, 
              border: '1px solid', 
              borderColor: 'divider',
              overflow: 'visible' 
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="700">Timesheet Entries</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />} 
                  onClick={handleAddRow} 
                  disabled={!canEdit}
                  sx={{ 
                    borderRadius: 2, 
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': { boxShadow: 'none' }
                  }}
                >
                  Add Entry
                </Button>
              </Box>

              <Stack spacing={2}>
                {/* Header Row */}
                <Box 
                  sx={{ 
                    display: { xs: 'none', md: 'flex' }, 
                    px: 3, 
                    py: 1.5, 
                    bgcolor: alpha(theme.palette.primary.main, 0.04), 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ width: '25%' }}>Date</Typography>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ width: '55%' }}>Task / Description</Typography>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ width: '10%', textAlign: 'center' }}>Hours</Typography>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ width: '10%', textAlign: 'center' }}>Action</Typography>
                </Box>

                {/* Rows */}
                {timesheetRows.map((row) => (
                  <Paper 
                    key={row.id} 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': { 
                        borderColor: 'primary.main', 
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
                      <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                        <FormControl fullWidth size="small">
                          <Select 
                            value={row.date} 
                            onChange={(e) => handleRowChange(row.id, 'date', e.target.value)} 
                            displayEmpty 
                            disabled={!canEdit}
                            sx={{ bgcolor: 'background.paper' }}
                          >
                            <MenuItem value="" disabled>Select Date</MenuItem>
                            {availableDates.map((date) => (
                              <MenuItem key={date} value={date}>{formatDateForDisplay(date)}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                      <Box sx={{ width: { xs: '100%', md: '55%' } }}>
                        <TextField 
                          size="small" 
                          fullWidth 
                          placeholder="Enter task details or description" 
                          value={row.description} 
                          onChange={(e) => handleRowChange(row.id, 'description', e.target.value)} 
                          disabled={!canEdit}
                          sx={{ bgcolor: 'background.paper' }}
                        />
                      </Box>
                      <Box sx={{ width: { xs: '100%', md: '10%' } }}>
                        <TextField 
                          type="number" 
                          size="small" 
                          fullWidth 
                          placeholder="0.0" 
                          value={row.hours} 
                          onChange={(e) => handleRowChange(row.id, 'hours', e.target.value)} 
                          inputProps={{ min: 0, step: 0.5, style: { textAlign: 'center' } }} 
                          disabled={!canEdit}
                          sx={{ bgcolor: 'background.paper' }}
                        />
                      </Box>
                      <Box sx={{ width: { xs: '100%', md: '10%' }, display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Delete Entry">
                          <span>
                            <IconButton 
                              color="error" 
                              size="small" 
                              onClick={() => handleDeleteRow(row.id)} 
                              disabled={timesheetRows.length === 1 || !canEdit}
                              sx={{ 
                                bgcolor: alpha(theme.palette.error.main, 0.1), 
                                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) } 
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Stack>

              {/* Footer Actions */}
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2, borderTop: '1px solid', borderColor: 'divider', pt: 3 }}>
                {canEdit && (
                  <>
                    <Button 
                      variant="outlined" 
                      startIcon={<SaveIcon />} 
                      onClick={handleSaveDraft} 
                      disabled={mutationLoading}
                      sx={{ borderRadius: 2, px: 3, textTransform: 'none' }}
                    >
                      Save Draft
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<SendIcon />}
                      onClick={handleSubmitTimesheet} 
                      disabled={mutationLoading || !timesheet || totalHours > maxHours}
                      sx={{ 
                        borderRadius: 2, 
                        px: 4, 
                        textTransform: 'none', 
                        boxShadow: 'none',
                        '&:hover': { boxShadow: 'none' }
                      }}
                    >
                      {timesheet?.status === 'rejected' ? 'Resubmit Timesheet' : 'Submit Timesheet'}
                    </Button>
                  </>
                )}
                {isSubmitted && (
                  <Chip
                    label={`Timesheet ${timesheet?.status}`}
                    color={timesheet?.status === 'approved' ? 'success' : 'info'}
                    variant="filled"
                    sx={{ fontSize: '1rem', height: 40, px: 2, borderRadius: 2, fontWeight: 600 }}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Card 
            elevation={0}
            sx={{ 
              mt: 4, 
              borderRadius: 3, 
              textAlign: 'center', 
              py: 8, 
              bgcolor: 'background.paper', 
              border: '1px dashed', 
              borderColor: 'divider' 
            }}
          >
            <CardContent>
              <Box 
                sx={{ 
                  display: 'inline-flex',
                  p: 3,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.text.secondary, 0.05),
                  mb: 2
                }}
              >
                <AssignmentLateIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              </Box>
              <Typography variant="h5" color="text.primary" gutterBottom fontWeight="600">
                No Project Assigned
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                You are not currently assigned to any active projects. Please contact your manager or administrator to get started with timesheet entries.
              </Typography>
              <Button variant="outlined" color="primary" sx={{ borderRadius: 2, textTransform: 'none' }}>
                Contact Support
              </Button>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  );
};

export default TimesheetForm;
