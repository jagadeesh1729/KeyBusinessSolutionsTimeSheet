import { useState } from 'react';
import { Box, Paper, Typography, TextField } from '@mui/material';
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
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12 sm:col-span-6">
          <TextField name="fullName" label="Full Name" fullWidth margin="normal" value={formData.fullName} onChange={handleInputChange} />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <TextField name="position" label="Position" fullWidth margin="normal" value={formData.position} onChange={handleInputChange} />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <TextField name="compensation" label="Compensation (e.g., $XX/hour or $XX,XXX/year)" fullWidth margin="normal" value={formData.compensation} onChange={handleInputChange} />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <TextField name="visaType" label="Visa Type" placeholder="OPT/STEM/H1/H4" fullWidth margin="normal" value={formData.visaType} onChange={handleInputChange} />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <TextField name="startDate" label="Start Date" type="date" fullWidth margin="normal" InputLabelProps={{ shrink: true }} value={formData.startDate} onChange={handleInputChange} />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <TextField name="weeklyHours" label="Weekly Hours" type="number" fullWidth margin="normal" value={formData.weeklyHours} onChange={handleInputChange} />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <TextField name="performanceReview" label="Performance Review Cycle" placeholder="e.g., Annually" fullWidth margin="normal" value={formData.performanceReview} onChange={handleInputChange} />
        </div>
        <div className="col-span-12 sm:col-span-6">
          <TextField name="todaysDate" label="Date of Offer" type="date" fullWidth margin="normal" InputLabelProps={{ shrink: true }} value={formData.todaysDate} onChange={handleInputChange} />
        </div>
      </div>
      <Box sx={{ mt: 3 }}>
        <ButtonComp text="Generate and Send Offer Letter" variant="contained" onClick={handleSubmit} />
      </Box>
    </Paper>
  );
};

export default OfferLetterGenerator;
