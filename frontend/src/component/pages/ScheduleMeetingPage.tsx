import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Grid,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ButtonComp from '../atoms/Button';
import CustomListItem from '../mocules/CustomListItem';
import type Employee from '../types/employee';

// Mock data representing employees assigned to the current PM
const mockMyTeam: Employee[] = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-0101',
    title: 'Software Engineer',
    job_title: 'Software Engineer',
    project: [{ id: 1, name: 'Project A', status: 'Active', start_date: '2023-01-01', end_date: '2023-12-31' }],
    college_name: null,
    college_address: null,
    degree: 'B.Tech',
    job_start_date: '2023-01-15',
    expiry_date: '2025-01-15',
    date_of_birth: '1995-05-20',
  },
  {
    id: 2,
    first_name: 'Alice',
    last_name: 'Smith',
    email: 'alice.smith@example.com',
    phone: '555-0102',
    title: 'Intern',
    job_title: 'Software Engineer Intern',
    project: [{ id: 1, name: 'Project A', status: 'Active', start_date: '2023-01-01', end_date: '2023-12-31' }],
    college_name: 'State University',
    college_address: '123 University Ave',
    degree: 'B.S. Computer Science',
    job_start_date: '2024-06-01',
    expiry_date: '2024-08-31',
    date_of_birth: '2002-08-10',
  },
];

const ScheduleMeetingPage = () => {
  const [meetingDetails, setMeetingDetails] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    agenda: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMeetingDetails({ ...meetingDetails, [e.target.name]: e.target.value });
  };

  const handleScheduleMeeting = () => {
    // In a real app, this would be an API call to save the meeting and send invites
    alert(`Meeting "${meetingDetails.title}" scheduled for ${meetingDetails.date} at ${meetingDetails.time}. Invites will be sent to ${mockMyTeam.length} employees.`);
    console.log('Meeting Details:', meetingDetails);
    console.log('Invited Employees:', mockMyTeam);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CustomListItem />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Schedule a Team Meeting
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Meeting Details</Typography>
              <TextField name="title" label="Meeting Title" fullWidth margin="normal" value={meetingDetails.title} onChange={handleInputChange} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField name="date" label="Date" type="date" fullWidth margin="normal" InputLabelProps={{ shrink: true }} value={meetingDetails.date} onChange={handleInputChange} />
                </Grid>
                <Grid item xs={6}>
                  <TextField name="time" label="Time" type="time" fullWidth margin="normal" InputLabelProps={{ shrink: true }} value={meetingDetails.time} onChange={handleInputChange} />
                </Grid>
              </Grid>
              <TextField name="location" label="Location / Meeting Link" fullWidth margin="normal" value={meetingDetails.location} onChange={handleInputChange} />
              <TextField name="agenda" label="Agenda / Description" fullWidth multiline rows={4} margin="normal" value={meetingDetails.agenda} onChange={handleInputChange} />
              <Box sx={{ mt: 2 }}>
                <ButtonComp text="Schedule Meeting" variant="contained" onClick={handleScheduleMeeting} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Invited Employees ({mockMyTeam.length})</Typography>
              <List>
                {mockMyTeam.map((employee) => (
                  <ListItem key={employee.id}>
                    <ListItemIcon><PersonIcon /></ListItemIcon>
                    <ListItemText primary={`${employee.first_name} ${employee.last_name}`} secondary={employee.email} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ScheduleMeetingPage;