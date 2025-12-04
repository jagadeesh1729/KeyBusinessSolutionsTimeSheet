import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { PatternFormat } from 'react-number-format';
import { toPascalCase } from '../../utils/pascalCase';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Stack,
  Paper,
  Fade
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const EmployeeForm = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    location: '',
    no_of_hours: 0,
    start_date: '',
    end_date: '',
    visa_status: 'opt',
    college_name: '',
    college_address: '',
    degree: '',
    college_Dso_name: '',
    college_Dso_email: '',
    college_Dso_phone: '',
    date_of_birth: '',
    // Primary Emergency Contact
    primary_emergency_contact_full_name: '',
    primary_emergency_contact_relationship: '',
    primary_emergency_contact_home_phone: '',
    // Secondary Emergency Contact
    secondary_emergency_contact_full_name: '',
    secondary_emergency_contact_relationship: '',
    secondary_emergency_contact_home_phone: '',
  });

  const pascalFields = [
    'first_name', 'last_name', 'location', 
    'college_name', 'degree', 'college_address', 
    'college_Dso_name',
    'primary_emergency_contact_full_name',
    'secondary_emergency_contact_full_name'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (pascalFields.includes(name)) {
      newValue = toPascalCase(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Check all required fields
    const requiredFields = [
      'first_name', 'last_name', 'date_of_birth', 'location',
      'college_name', 'degree', 'college_address',
      'college_Dso_name', 'college_Dso_email', 'college_Dso_phone',
      'start_date', 'end_date',
      'email', 'phone', 'password'
    ];

    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

    if (missingFields.length > 0) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        date_of_birth: formData.date_of_birth || undefined,
      };
      await apiClient.post('/auth/register-employee', payload);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const SectionTitle = ({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) => (
    <Box sx={{ mb: 3, mt: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <Box sx={{ color: 'primary.main' }}>{icon}</Box>
        <Typography variant="h6" fontWeight="700" color="text.primary">
          {title}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ ml: 4.5 }}>
        {subtitle}
      </Typography>
    </Box>
  );

  const InfoItem = ({ text }: { text: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, opacity: 0.9 }}>
      <CheckCircleOutlineIcon sx={{ color: '#4fc3f7' }} />
      <Typography variant="body1" fontWeight="500">{text}</Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8f9fa' }}>
      {/* Left Panel - Branding */}
      {!isMobile && (
        <Box sx={{
          width: '400px',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #0066A4 0%, #004e7c 100%)',
          color: 'white',
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          zIndex: 10
        }}>
          <Box>
            <Box
              sx={{
                mb: 4,
                transform: 'translateY(0)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                },
              }}
            >
              <img src="./white_logo.png" alt="Key Business Solutions" style={{ height: 70, maxWidth: '100%', objectFit: 'contain' }} />
            </Box>
            <Typography variant="h6"   sx={{ mb: 2, letterSpacing: '-1px' }}>
              Employee  Registration
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 400, mb: 6 }}>
              Complete your profile to start your journey with Key Business Solutions.
            </Typography>

            <Box>
              <InfoItem text="Personal Details" />
              <InfoItem text="Education History" />
              <InfoItem text="Visa" />
              <InfoItem text="Emergency Contacts" />
              <InfoItem text="Secure Account" />
            </Box>
          </Box>

          <Typography variant="caption" sx={{ opacity: 0.5 }}>
            © 2025 Key Business Solutions. All rights reserved.
          </Typography>
        </Box>
      )}

      {/* Right Panel - Form */}
      <Box sx={{ 
        flex: 1, 
        ml: { xs: 0, md: '400px' }, 
        p: { xs: 2, md: 6, lg: 10 },
        display: 'flex',
        justifyContent: 'center'
      }}>
        <Box sx={{ width: '100%', maxWidth: '800px' }}>
          <Fade in={true} timeout={800}>
            <form onSubmit={handleSubmit}>
              {/* Mobile Logo */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 4 }}>
                <img src="./KeyLogo.png" alt="Key Business Solutions" style={{ height: 60 }} />
              </Box>

              <Box sx={{ mb: 6 }}>
                <Typography variant="h4" fontWeight="800" color="#1a202c" sx={{ mb: 1 }}>
                  Employee Registration
                </Typography>
              </Box>

              {error && <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>{success}</Alert>}

              {/* 1. Personal Information */}
              <Paper elevation={0} sx={{ p: 4, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <SectionTitle icon={<PersonIcon />} title="Personal Information" subtitle="Your basic identification details" />
                <Stack spacing={3}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                    <TextField fullWidth label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth label="Date of Birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} InputLabelProps={{ shrink: true }} required />
                    <TextField fullWidth label="Current Location" name="location" value={formData.location} onChange={handleChange} placeholder="City, State" required />
                  </Stack>
                </Stack>
              </Paper>

              {/* 2. Education */}
              <Paper elevation={0} sx={{ p: 4, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <SectionTitle icon={<SchoolIcon />} title="Education" subtitle="Academic background and DSO details" />
                <Stack spacing={3}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth label="College / University" name="college_name" value={formData.college_name} onChange={handleChange} required />
                    <TextField fullWidth label="Degree" name="degree" value={formData.degree} onChange={handleChange} placeholder="e.g. MS in CS" required />
                  </Stack>
                  <TextField fullWidth label="College Address" name="college_address" value={formData.college_address} onChange={handleChange} required />
                  
                  <Box sx={{ bgcolor: 'rgba(0, 102, 164, 0.04)', p: 3, borderRadius: 2, border: '1px dashed', borderColor: 'rgba(0, 102, 164, 0.2)' }}>
                    <Typography variant="subtitle2" fontWeight="700" color="primary" sx={{ mb: 2 }}>DSO Contact Information</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField fullWidth size="small" label="DSO Name" name="college_Dso_name" value={formData.college_Dso_name} onChange={handleChange} sx={{ bgcolor: 'white' }} required />
                      <TextField fullWidth size="small" label="DSO Email" name="college_Dso_email" type="email" value={formData.college_Dso_email} onChange={handleChange} sx={{ bgcolor: 'white' }} required />
                      <PatternFormat 
                        customInput={TextField} 
                        format="+1 (###) ###-####" 
                        mask="_" 
                        allowEmptyFormatting
                        fullWidth 
                        size="small" 
                        label="DSO Phone" 
                        name="college_Dso_phone" 
                        value={formData.college_Dso_phone} 
                        onValueChange={(v) => setFormData(p => ({ ...p, college_Dso_phone: v.formattedValue }))} 
                        sx={{ bgcolor: 'white' }} 
                        required
                      />
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              {/* 3. Immigration */}
              <Paper elevation={0} sx={{ p: 4, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <SectionTitle icon={<WorkIcon />} title="Immigration" subtitle="Work authorization status" />
                <Stack spacing={3}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, fontSize: '0.875rem' }}>Visa Status</FormLabel>
                    <RadioGroup row name="visa_status" value={formData.visa_status} onChange={handleChange}>
                      {['cpt', 'opt', 'stemopt'].map((status) => (
                        <FormControlLabel 
                          key={status} 
                          value={status} 
                          control={<Radio size="small" />} 
                          label={status.toUpperCase().replace('STEMOPT', 'STEM OPT')} 
                          sx={{ 
                            mr: 4, 
                            '& .MuiTypography-root': { fontSize: '0.9rem', fontWeight: 500 } 
                          }} 
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth label="Start Date" name="start_date" type="date" value={formData.start_date} onChange={handleChange} InputLabelProps={{ shrink: true }} helperText="OPT/CPT Start Date" required />
                    <TextField fullWidth label="End Date" name="end_date" type="date" value={formData.end_date} onChange={handleChange} InputLabelProps={{ shrink: true }} helperText="OPT/CPT End Date" required />
                  </Stack>
                </Stack>
              </Paper>

              {/* 4. Emergency Contacts */}
              <Paper elevation={0} sx={{ p: 4, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <SectionTitle icon={<ContactPhoneIcon />} title="Emergency Contacts" subtitle="Contacts in case of emergency" />
                <Stack spacing={3}>
                  {/* Primary Emergency Contact */}
                  <Box sx={{ bgcolor: 'rgba(0, 102, 164, 0.04)', p: 3, borderRadius: 2, border: '1px dashed', borderColor: 'rgba(0, 102, 164, 0.2)' }}>
                    <Typography variant="subtitle2" fontWeight="700" color="primary" sx={{ mb: 2 }}>Primary Emergency Contact</Typography>
                    <Stack spacing={2}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField fullWidth size="small" label="Full Name" name="primary_emergency_contact_full_name" value={formData.primary_emergency_contact_full_name} onChange={handleChange} sx={{ bgcolor: 'white' }} />
                        <TextField fullWidth size="small" label="Relationship" name="primary_emergency_contact_relationship" value={formData.primary_emergency_contact_relationship} onChange={handleChange} placeholder="e.g. Parent, Spouse, Sibling" sx={{ bgcolor: 'white' }} />
                      </Stack>
                      <Box sx={{ 
                        bgcolor: 'white', 
                        borderRadius: 1,
                        '& .PhoneInput': { 
                          width: '100%',
                        },
                        '& .PhoneInputInput': { 
                          width: '100%',
                          padding: '8.5px 14px',
                          fontSize: '0.875rem',
                          border: '1px solid rgba(0, 0, 0, 0.23)',
                          borderRadius: '4px',
                          outline: 'none',
                          '&:focus': {
                            borderColor: '#0066A4',
                            borderWidth: '2px',
                          }
                        },
                        '& .PhoneInputCountry': {
                          marginRight: '8px',
                        }
                      }}>
                        <PhoneInput
                          placeholder="Enter phone number"
                          value={formData.primary_emergency_contact_home_phone}
                          onChange={(value) => setFormData(p => ({ ...p, primary_emergency_contact_home_phone: value || '' }))}
                          defaultCountry="US"
                          international
                          countryCallingCodeEditable={false}
                          limitMaxLength
                        />
                        {formData.primary_emergency_contact_home_phone && !isValidPhoneNumber(formData.primary_emergency_contact_home_phone) && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                            Please enter a valid phone number
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Box>

                  {/* Secondary Emergency Contact */}
                  <Box sx={{ bgcolor: 'rgba(0, 102, 164, 0.04)', p: 3, borderRadius: 2, border: '1px dashed', borderColor: 'rgba(0, 102, 164, 0.2)' }}>
                    <Typography variant="subtitle2" fontWeight="700" color="primary" sx={{ mb: 2 }}>Secondary Emergency Contact</Typography>
                    <Stack spacing={2}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField fullWidth size="small" label="Full Name" name="secondary_emergency_contact_full_name" value={formData.secondary_emergency_contact_full_name} onChange={handleChange} sx={{ bgcolor: 'white' }} />
                        <TextField fullWidth size="small" label="Relationship" name="secondary_emergency_contact_relationship" value={formData.secondary_emergency_contact_relationship} onChange={handleChange} placeholder="e.g. Parent, Spouse, Sibling" sx={{ bgcolor: 'white' }} />
                      </Stack>
                      <Box sx={{ 
                        bgcolor: 'white', 
                        borderRadius: 1,
                        '& .PhoneInput': { 
                          width: '100%',
                        },
                        '& .PhoneInputInput': { 
                          width: '100%',
                          padding: '8.5px 14px',
                          fontSize: '0.875rem',
                          border: '1px solid rgba(0, 0, 0, 0.23)',
                          borderRadius: '4px',
                          outline: 'none',
                          '&:focus': {
                            borderColor: '#0066A4',
                            borderWidth: '2px',
                          }
                        },
                        '& .PhoneInputCountry': {
                          marginRight: '8px',
                        }
                      }}>
                        <PhoneInput
                          placeholder="Enter phone number"
                          value={formData.secondary_emergency_contact_home_phone}
                          onChange={(value) => setFormData(p => ({ ...p, secondary_emergency_contact_home_phone: value || '' }))}
                          defaultCountry="US"
                          international
                          countryCallingCodeEditable={false}
                          limitMaxLength
                        />
                        {formData.secondary_emergency_contact_home_phone && !isValidPhoneNumber(formData.secondary_emergency_contact_home_phone) && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                            Please enter a valid phone number
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              {/* 5. Account */}
              <Paper elevation={0} sx={{ p: 4, mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <SectionTitle icon={<ContactMailIcon />} title="Account Setup" subtitle="Your login credentials" />
                <Stack spacing={3}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField fullWidth label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
                    <PatternFormat 
                      customInput={TextField} 
                      format="+1 (###) ###-####" 
                      mask="_" 
                      allowEmptyFormatting
                      fullWidth 
                      label="Phone Number" 
                      name="phone" 
                      value={formData.phone} 
                      onValueChange={(v) => setFormData(p => ({ ...p, phone: v.formattedValue }))} 
                      required 
                    />
                  </Stack>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              </Paper>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, mb: 8 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/login')}
                  sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Back to Login
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  endIcon={!loading && <ArrowForwardIcon />}
                  sx={{
                    px: 6,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(90deg, #0066A4 0%, #00BCE4 100%)',
                    boxShadow: '0 4px 12px rgba(0, 102, 164, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #005282 0%, #009bc2 100%)',
                      boxShadow: '0 6px 16px rgba(0, 102, 164, 0.4)',
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit'}
                </Button>
              </Box>
            </form>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
};

export default EmployeeForm;
