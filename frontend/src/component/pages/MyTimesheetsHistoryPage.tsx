import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { useLocation, Link } from 'react-router-dom';
import type { Timesheet } from '../types/Holiday';

// This component will receive submitted timesheets via navigation state
const MyTimesheetsHistoryPage = () => {
  const location = useLocation();
  // Initialize with any timesheets passed from the previous page
  const [submittedTimesheets, setSubmittedTimesheets] = useState<Timesheet[]>(location.state?.submittedTimesheets || []);

  return (
    <Box className="p-4 md:p-8">
      <Typography variant="h4" gutterBottom>
        My Submitted Timesheets
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Period</TableCell>
              <TableCell>Total Hours</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submittedTimesheets.length > 0 ? (
              submittedTimesheets.map((sheet) => (
                <TableRow key={sheet.id}>
                  <TableCell>
                    {new Date(sheet.periodStart).toLocaleDateString()} - {new Date(sheet.periodEnd).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{sheet.totalHours.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip label={sheet.status} color={sheet.status === 'approved' ? 'success' : sheet.status === 'pending' ? 'warning' : 'default'} />
                  </TableCell>
                  <TableCell>{sheet.submittedAt ? new Date(sheet.submittedAt).toLocaleString() : 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">You have not submitted any timesheets yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default MyTimesheetsHistoryPage;