import { useState } from 'react';
import { Box, Paper, Typography, TextField, Grid } from '@mui/material';
import ButtonComp from '../atoms/Button';

const OfferLetterGenerator = () => {
  const [formData, setFormData] = useState({
    position: '',
    visaType: '',
    startDate: '',
    weeklyHours: '',
    performanceReview: '',
    fullName: '',
    todaysDate: new Date().toISOString().split('T')[0], // Default to today
    compensation: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    // In a real app, this would trigger a backend API call to generate and email the offer letter
    alert(`Generating and sending offer letter for ${formData.fullName}.`);
    console.log('Offer Letter Data:', formData);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Generate Offer Letter</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField name="fullName" label="Full Name" fullWidth margin="normal" value={formData.fullName} onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField name="position" label="Position" fullWidth margin="normal" value={formData.position} onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField name="compensation" label="Compensation (e.g., $XX/hour or $XX,XXX/year)" fullWidth margin="normal" value={formData.compensation} onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField name="visaType" label="Visa Type" placeholder="OPT/STEM/H1/H4" fullWidth margin="normal" value={formData.visaType} onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField name="startDate" label="Start Date" type="date" fullWidth margin="normal" InputLabelProps={{ shrink: true }} value={formData.startDate} onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField name="weeklyHours" label="Weekly Hours" type="number" fullWidth margin="normal" value={formData.weeklyHours} onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField name="performanceReview" label="Performance Review Cycle" placeholder="e.g., Annually" fullWidth margin="normal" value={formData.performanceReview} onChange={handleInputChange} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField name="todaysDate" label="Date of Offer" type="date" fullWidth margin="normal" InputLabelProps={{ shrink: true }} value={formData.todaysDate} onChange={handleInputChange} />
        </Grid>
      </Grid>
      <Box sx={{ mt: 3 }}>
        <ButtonComp text="Generate and Send Offer Letter" variant="contained" onClick={handleSubmit} />
      </Box>
    </Paper>
  );
};

export default OfferLetterGenerator;