// src/pages/employee/TimesheetPage.tsx
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  Container,
  Typography,
  Tabs,
  Tab,
  Box,
  Alert,
  Paper,
  Dialog,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import TimesheetHistory from './TimesheetHistory';
import TaskEntryForm from '../mocules/TaskEntryForm';
import { 
  useCurrentTimesheet, 
  useAssignedProjects,
  useTimesheetMutations 
} from "../hooks/useTimesheet";
import { isHoliday, isWeekday, toDateString } from '../types/Holiday';
import type { DateString, TimesheetEntryOptionA } from '../types/Holiday';
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`timesheet-tabpanel-${index}`}
      aria-labelledby={`timesheet-tab-${index}`}
      {...other}
    >
      {value === index && <Box className="p-3">{children}</Box>}
    </div>
  );
};

const TimesheetPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [timesheet, setTimesheet] = useState<Record<DateString, TimesheetEntryOptionA>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // For Admin dashboard, we fetch ALL projects, not just assigned ones.
  // The useAssignedProjects hook can be adapted or a new one created.
  // Assuming useAssignedProjects can take a URL override or we have a different hook for admins.
  const { data: projects, loading: projectsLoading, error: projectsError } = useAssignedProjects('/api/projects'); // Admin gets all projects
  const { data: currentTimesheet, loading: timesheetLoading, refetch: refetchTimesheet } = useCurrentTimesheet(selectedProjectId || undefined);
  const { updateTimesheet, submitTimesheet, loading: mutationLoading, error: mutationError } = useTimesheetMutations();

  // Auto-select first project when projects load
  React.useEffect(() => {
    if (projects && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Sync existing timesheet entries from API into local editable state
  React.useEffect(() => {
    if (!currentTimesheet?.dailyEntries) return;
    const merged: Record<DateString, TimesheetEntryOptionA> = {};
    for (const entry of currentTimesheet.dailyEntries) {
      merged[entry.date as DateString] = {
        date: entry.date as DateString,
        tasks: entry.tasks || [],
        hours: entry.hours || 0,
      };
    }
    setTimesheet(prev => ({
      // Keep any unsaved local edits, but overlay server data as baseline
      ...merged,
      ...prev,
    }));
  }, [currentTimesheet?.id]);

  // Show mutation errors
  React.useEffect(() => {
    if (mutationError) {
      setMessage({ type: 'error', text: mutationError });
    }
  }, [mutationError]);

  const totalHoursLogged = Object.values(timesheet).reduce(
    (total, entry) => total + (entry.tasks?.reduce((taskTotal, task) => taskTotal + task.hours, 0) || 0),
    0
  );

  const selectedProject = projects?.find(p => p.id === selectedProjectId);
  const periodStart = currentTimesheet?.periodStart ? new Date(currentTimesheet.periodStart) : new Date();
  const periodEnd = currentTimesheet?.periodEnd ? new Date(currentTimesheet.periodEnd) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const handleProjectChange = (event: any) => {
    setSelectedProjectId(event.target.value);
  };

  const handleDayClick = (date: Date) => {
    const dateStr = toDateString(date);
    if (isWeekday(date) && selectedProjectId) {
      setSelectedDate(date);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const handleSaveTasks = (tasks: TimesheetEntryOptionA['tasks']) => {
    if (!selectedDate) return;

    const dateStr = toDateString(selectedDate);
    const newHoursForDay = tasks.reduce((sum, task) => sum + task.hours, 0);

    setTimesheet((prev) => ({
      ...prev,
      [dateStr]: {
        date: dateStr,
        tasks: tasks,
        hours: newHoursForDay,
      },
    }));
    
    setMessage({ type: 'success', text: 'Tasks saved successfully' });
    handleCloseModal();
  };

  const handleSubmitTimesheet = async () => {
    if (!selectedProjectId || totalHoursLogged === 0) return;
    
    try {
      // Convert timesheet data to API format
      const dailyEntries = Object.values(timesheet).map(entry => ({
        date: entry.date,
        hours: entry.hours,
        tasks: entry.tasks
      }));
      
      // Create or update timesheet
      setMessage({ type: 'success', text: 'Timesheet submitted successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit timesheet' });
    }
  };

  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      return date < periodStart || date > periodEnd || !isWeekday(date);
    }
    return false;
  };

  const allEntries = Object.values(timesheet).flatMap(entry => (
    entry.tasks?.map(task => ({ date: entry.date, ...task })) || []
  ));

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" className="font-bold text-gray-900 mb-6">
        My Timesheets
      </Typography>

      {message && (
        <Alert 
          severity={message.type} 
          className="mb-4" 
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {projectsError && (
        <Alert severity="error" className="mb-4">
          {projectsError}
        </Alert>
      )}

      {(projectsLoading || timesheetLoading) && (
        <Alert severity="info" className="mb-4">Loading timesheet data...</Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Current Timesheet" />
          <Tab label="Timesheet History" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box>
          {!projectsLoading && (!projects || projects.length === 0) && (
            <Alert severity="info" className="mb-4">No assigned projects found.</Alert>
          )}
          <FormControl fullWidth className="mb-4">
            <InputLabel>Select Project</InputLabel>
            <Select
              value={selectedProjectId || ''}
              onChange={handleProjectChange}
              label="Select Project"
            >
              {(projects || []).map(project => (
                <MenuItem key={project.id} value={project.id} disabled={project.status !== 'Active'}>
                  {project.name} ({project.period_type})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedProjectId && (
            <>
              <Alert severity="info" className="mb-4">
                Total Hours Logged: {totalHoursLogged.toFixed(2)}
              </Alert>
              
              <Paper elevation={3} className="p-4 mb-4">
                <Calendar
                  onClickDay={handleDayClick}
                  tileDisabled={tileDisabled}
                  minDate={periodStart}
                  maxDate={periodEnd}
                />
              </Paper>

              <Box className="flex justify-end mb-4">
                <Button 
                  variant="contained" 
                  onClick={handleSubmitTimesheet}
                  disabled={totalHoursLogged === 0}
                >
                  Submit Timesheet
                </Button>
              </Box>

              <Typography variant="h6" className="mb-4">Logged Entries</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Task Description</TableCell>
                      <TableCell align="right">Hours</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allEntries.length > 0 ? (
                      allEntries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                          <TableCell>{entry.name}</TableCell>
                          <TableCell align="right">{entry.hours.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center">No entries logged yet.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TimesheetHistory />
      </TabPanel>

      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogContent>
          {selectedDate && (
            <TaskEntryForm
              date={toDateString(selectedDate)}
              existingTasks={timesheet[toDateString(selectedDate)]?.tasks || []}
              onSave={handleSaveTasks}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TimesheetPage;
