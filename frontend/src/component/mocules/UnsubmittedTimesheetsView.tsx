import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';

// Mock data representing employees who haven't submitted their timesheets for the current period
const unsubmittedEmployees = [
  {
    id: 3,
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    manager: 'Jagadeesh Kandula',
  },
  {
    id: 4,
    name: 'Diana Prince',
    email: 'diana.prince@example.com',
    manager: 'Jane Doe',
  },
];

const UnsubmittedTimesheetsView = () => {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="unsubmitted timesheets table">
        <TableHead>
          <TableRow>
            <TableCell>Employee Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Project Manager</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {unsubmittedEmployees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.manager}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UnsubmittedTimesheetsView;