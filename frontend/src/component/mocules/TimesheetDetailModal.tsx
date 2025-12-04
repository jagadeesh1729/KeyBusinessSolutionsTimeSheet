import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  DialogActions,
} from '@mui/material';
import ButtonComp from '../atoms/Button';
import type { Timesheet } from '../types/Holiday';

interface TimesheetDetailModalProps {
  open: boolean;
  onClose: () => void;
  timesheet: (Timesheet & { employeeName?: string }) | null;
}

const TimesheetDetailModal = ({ open, onClose, timesheet }: TimesheetDetailModalProps) => {
  if (!timesheet) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Timesheet Details</DialogTitle>
      <DialogContent>
        {timesheet.employeeName && (
          <Typography variant="h6">{timesheet.employeeName}</Typography>
        )}
        <Typography variant="subtitle1" gutterBottom>
          Period: {new Date(timesheet.periodStart).toLocaleDateString()} - {new Date(timesheet.periodEnd).toLocaleDateString()}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Total Hours: {timesheet.totalHours.toFixed(2)}
        </Typography>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Task</TableCell>
                <TableCell align="right">Hours</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(timesheet.entries ?? timesheet.dailyEntries ?? []).flatMap(entry => entry.tasks.map((task, index) => (
                <TableRow key={`${entry.date}-${index}`}>
                  <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                  <TableCell>{task.name}</TableCell>
                  <TableCell align="right">{task.hours.toFixed(2)}</TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <ButtonComp text="Close" onClick={onClose} />
      </DialogActions>
    </Dialog>
  );
};

export default TimesheetDetailModal;
