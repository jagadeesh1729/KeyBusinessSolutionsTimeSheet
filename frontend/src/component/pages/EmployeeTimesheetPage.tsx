import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Default styling
import {
  Box,
  Paper,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
} from '@mui/material';
import type {
  CalenderViewFromAdmin,
  DateString,
  TimesheetEntryOptionA,
  Timesheet,
} from '../types/Holiday';
import { isHoliday, isWeekday, toDateString } from '../types/Holiday';
import TaskEntryForm from '../mocules/TaskEntryForm';
import ButtonComp from '../atoms/Button';
import { useNavigate } from 'react-router-dom';

// Mock data - this would come from your backend for the logged-in employee
const mockAdminData: CalenderViewFromAdmin = {
  startDate: '2025-9-28',
  endDate: '2025-10-05',
  holidays: [{ id: '1', date: '2025-10-02', reason: 'Independence Day' }],
  autoApprove: false, // Added missing property
  periodType: 'weekly', // Added missing property
  weekend: [], // This can be calculated on the fly
};

const employeeMaxHours = 10; // This would also come from the employee's profile

const EmployeeTimesheetPage = () => {
  const [timesheet, setTimesheet] = useState<Record<DateString, TimesheetEntryOptionA>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timesheetStatus, setTimesheetStatus] = useState<'draft' | 'pending'>('draft');
  const navigate = useNavigate();

  const totalHoursLogged = Object.values(timesheet).reduce(
    (total, entry) =>
      total + (entry.tasks?.reduce((taskTotal, task) => taskTotal + task.hours, 0) || 0),
    0
  );

  const handleDayClick = (date: Date) => {
    const dateStr = toDateString(date);
    if (isWeekday(date) && !isHoliday(dateStr, mockAdminData.holidays)) {
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
    const otherDaysHours = Object.entries(timesheet)
      .filter(([key]) => key !== dateStr)
      .reduce((total, [, entry]) => total + (entry.hours || 0), 0);

    if (otherDaysHours + newHoursForDay > employeeMaxHours) {
      alert(`Cannot log hours. Total would exceed the maximum of ${employeeMaxHours} hours.`);
      // Optionally revert the tasks for the day if the limit is exceeded
      return;
    }

    setTimesheet((prev) => ({
      ...prev,
      [dateStr]: {
        date: dateStr,
        tasks: tasks,
        hours: newHoursForDay,
      },
    }));
  };

  const handleSubmitTimesheet = () => {
    // This is where you would make an API call to post the timesheet data
    const newSubmission: Timesheet = {
      id: Date.now(), // Temporary ID
      employeeId: 123, // Mock employee ID
      periodStart: mockAdminData.startDate,
      periodEnd: mockAdminData.endDate,
      status: 'pending',
      totalHours: totalHoursLogged,
      entries: Object.values(timesheet),
      dailyEntries: Object.values(timesheet),
      createdAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      periodType: 'weekly',
    };

    alert('Timesheet submitted for approval!');
    setTimesheetStatus('pending');

    // Redirect to the history page, passing the new submission
    navigate('/my-timesheets', { state: { submittedTimesheets: [newSubmission] } });
  };

  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const dateStr = toDateString(date);
      const startDate = new Date(mockAdminData.startDate);
      const endDate = new Date(mockAdminData.endDate);

      // Disable if outside the start/end date range, it's a weekend, or a holiday
      return date < startDate || date > endDate || !isWeekday(date) || isHoliday(dateStr, mockAdminData.holidays);
    }
    return false;
  };

  const allEntries = Object.values(timesheet).flatMap(entry => 
    entry.tasks.map(task => ({ date: entry.date, ...task }))
  );

  return (
    <Box className="p-4 md:p-8">
      <Typography variant="h4" gutterBottom>My Timesheet</Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        Total Hours Logged: {totalHoursLogged.toFixed(2)} / {employeeMaxHours}
      </Alert>
      <Paper elevation={3} className="p-4">
        <Calendar
          onClickDay={handleDayClick}
          tileDisabled={tileDisabled}
          minDate={new Date(mockAdminData.startDate)}
          maxDate={new Date(mockAdminData.endDate)}
        />
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <ButtonComp text="Submit Timesheet" variant="contained" onClick={handleSubmitTimesheet} disabled={timesheetStatus === 'pending' || totalHoursLogged === 0} />
      </Box>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Logged Entries</Typography>
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
          <ButtonComp text="Close" onClick={handleCloseModal} />
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeTimesheetPage;
