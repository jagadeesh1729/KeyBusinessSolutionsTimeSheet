import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  ListSubheader,
  CircularProgress,
  Alert,
} from '@mui/material';
import ButtonComp from '../atoms/Button';
import { useEmailRecipients } from '../hooks/useEmailRecipients';

const SendEmailView = () => {
  const { projectManagers, employees, loading, error } = useEmailRecipients();
  const [emailDetails, setEmailDetails] = useState({ recipient: '', subject: '', body: '' });
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  useEffect(() => {
    // Update the recipient field whenever the selected emails change
    setEmailDetails((prev) => ({
      ...prev,
      recipient: selectedEmails.join(', '),
    }));
  }, [selectedEmails]);

  const handleToggleEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const currentIndex = prev.indexOf(email);
      const newSelected = [...prev];

      if (currentIndex === -1) {
        newSelected.push(email);
      } else {
        newSelected.splice(currentIndex, 1);
      }
      return newSelected;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailDetails({ ...emailDetails, [e.target.name]: e.target.value });
  };

  const handleSendEmail = () => {
    // In a real app, this would be an API call to your backend email service
    alert(`Sending email to ${emailDetails.recipient} with subject "${emailDetails.subject}"`);
    console.log('Email Details:', emailDetails);
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>Select Recipients</Typography>
          <List dense sx={{ width: '100%', bgcolor: 'background.paper', maxHeight: 400, overflow: 'auto' }}>
            <ListSubheader>Project Managers ({projectManagers.length})</ListSubheader>
            {projectManagers.map((pm) => (
              <ListItem key={`pm-${pm.id}`} secondaryAction={<Checkbox edge="end" onChange={() => handleToggleEmail(pm.email)} checked={selectedEmails.indexOf(pm.email) !== -1} />}>
                <ListItemText primary={pm.name} secondary={pm.email} />
              </ListItem>
            ))}
            <ListSubheader>Employees ({employees.length})</ListSubheader>
            {employees.map((emp) => (
              <ListItem key={`emp-${emp.id}`} secondaryAction={<Checkbox edge="end" onChange={() => handleToggleEmail(emp.email)} checked={selectedEmails.indexOf(emp.email) !== -1} />}>
                <ListItemText primary={emp.name} secondary={emp.email} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>
      <Grid item xs={12} md={7}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Compose Email</Typography>
          <TextField
            name="recipient"
            label="Recipient(s)"
            fullWidth
            margin="normal"
            value={emailDetails.recipient}
            onChange={handleInputChange}
            InputProps={{
              readOnly: true, // Make it read-only as it's populated by selection
            }}
          />
          <TextField name="subject" label="Subject" fullWidth margin="normal" value={emailDetails.subject} onChange={handleInputChange} />
          <TextField name="body" label="Body" fullWidth multiline rows={8} margin="normal" value={emailDetails.body} onChange={handleInputChange} />
          <Box sx={{ mt: 2 }}>
            <ButtonComp text="Send Email" variant="contained" onClick={handleSendEmail} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default SendEmailView;