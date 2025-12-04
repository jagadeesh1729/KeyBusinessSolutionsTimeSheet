import {
  Typography,
  Box,
  Stack,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Divider,
  useTheme,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import ContactPhoneOutlinedIcon from '@mui/icons-material/ContactPhoneOutlined';
import type Employee from '../types/employee';
import { formatPhoneDisplay } from '../../utils/phoneFormat';

interface EmployeeProfileViewProps {
  employee: Employee | null;
}

const EmployeeProfileView = ({ employee }: EmployeeProfileViewProps) => {
  const theme = useTheme();

  if (!employee) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">Loading profile...</Typography>
      </Box>
    );
  }

  const InfoCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.1)' } }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            bgcolor: 'primary.main', 
            color: 'white',
            display: 'flex',
            boxShadow: '0 4px 12px rgba(0,102,164,0.2)'
          }}>
            {icon}
          </Box>
          <Typography variant="h6" fontWeight="700" color="#1a202c">
            {title}
          </Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );

  const InfoItem = ({ label, value, icon, fullWidth = false }: { label: string; value: React.ReactNode; icon?: React.ReactNode; fullWidth?: boolean }) => (
    <Grid size={{ xs: 12, sm: fullWidth ? 12 : 6 }}>
      <Box sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          {icon && <Box sx={{ color: 'primary.main', display: 'flex', opacity: 0.8 }}>{icon}</Box>}
          <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.7rem' }}>
            {label}
          </Typography>
        </Stack>
        <Typography variant="subtitle1" fontWeight="600" color="text.primary" sx={{ fontSize: '1rem' }}>
          {value || <Typography component="span" color="text.disabled" sx={{ fontStyle: 'italic' }}>Not Provided</Typography>}
        </Typography>
      </Box>
    </Grid>
  );

  const getInitials = (first: string, last: string) => {
    return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', p: 1 }}>
      {/* Header Section */}
      <Card sx={{ mb: 4, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', background: 'linear-gradient(135deg, #0066A4 0%, #004e7c 100%)', color: 'white', overflow: 'visible' }}>
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 120, 
                height: 120, 
                border: '4px solid rgba(255,255,255,0.2)',
                bgcolor: 'white',
                color: '#0066A4',
                fontSize: '3rem',
                fontWeight: '800',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
              }}
            >
              {getInitials(employee.first_name, employee.last_name)}
            </Avatar>
            <Box sx={{ ml: { md: 4 }, mt: { xs: 2, md: 0 }, textAlign: { xs: 'center', md: 'left' }, flex: 1 }}>
              <Typography variant="h3" fontWeight="800" color="inherit" gutterBottom sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
                {employee.first_name} {employee.last_name}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" justifyContent={{ xs: 'center', md: 'flex-start' }}>
                <Chip 
                  icon={<WorkOutlineIcon sx={{ fontSize: 18, color: 'white !important' }} />} 
                  label={employee.job_title || 'Employee'} 
                  sx={{ 
                    fontWeight: 700, 
                    px: 1, 
                    height: 32, 
                    bgcolor: 'rgba(255,255,255,0.15)', 
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                />
                <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  <EmailOutlinedIcon fontSize="small" color="inherit" />
                  <Typography variant="body1" fontWeight="500">{employee.email}</Typography>
                </Stack>
                {employee.phone && (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    <PhoneOutlinedIcon fontSize="small" color="inherit" />
                    <Typography variant="body1" fontWeight="500">{formatPhoneDisplay(employee.phone)}</Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoCard title="Personal Details" icon={<PersonOutlineIcon />}>
            <Grid container spacing={2}>
              <InfoItem 
                label="Full Name" 
                value={`${employee.first_name} ${employee.last_name}`} 
                icon={<BadgeOutlinedIcon fontSize="small" />}
                fullWidth
              />
              <InfoItem 
                label="Date of Birth" 
                value={employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : null} 
                icon={<CalendarTodayOutlinedIcon fontSize="small" />}
              />
              <InfoItem 
                label="Location" 
                value={employee.location} 
                icon={<LocationOnOutlinedIcon fontSize="small" />}
              />
            </Grid>
          </InfoCard>
        </Grid>

        {/* Employment Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoCard title="Employment Information" icon={<WorkOutlineIcon />}>
            <Grid container spacing={2}>
              <InfoItem label="Job Title" value={employee.job_title} />
              <InfoItem 
                label="Role" 
                value={<Chip label={employee.role?.replace('_', ' ') || 'N/A'} size="small" color="default" variant="outlined" sx={{ textTransform: 'capitalize', fontWeight: 600 }} />} 
              />
              <InfoItem 
                label="Start Date" 
                value={employee.employement_start_date ? new Date(employee.employement_start_date).toLocaleDateString() : null} 
              />
              <InfoItem label="Weekly Hours" value={employee.no_of_hours ? `${employee.no_of_hours} Hours` : null} />
              <InfoItem label="Compensation" value={employee.compensation} />
              <InfoItem label="Visa Status" value={employee.visa_status?.toUpperCase()} />
            </Grid>
          </InfoCard>
        </Grid>

        {/* Education */}
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoCard title="Education" icon={<SchoolOutlinedIcon />}>
            <Grid container spacing={2}>
              <InfoItem 
                label="Degree" 
                value={employee.degree} 
                fullWidth
              />
              <InfoItem 
                label="University / College" 
                value={employee.college_name} 
                icon={<AccountBalanceOutlinedIcon fontSize="small" />}
                fullWidth
              />
            </Grid>
          </InfoCard>
        </Grid>

        {/* College DSO */}
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoCard title="College DSO Contact" icon={<SchoolOutlinedIcon />}>
            <Grid container spacing={2}>
              <InfoItem 
                label="DSO Name" 
                value={(employee as any).college_Dso_name} 
                fullWidth
              />
              <InfoItem 
                label="DSO Email" 
                value={(employee as any).college_Dso_email} 
                icon={<EmailOutlinedIcon fontSize="small" />}
              />
              <InfoItem 
                label="DSO Phone" 
                value={formatPhoneDisplay((employee as any).college_Dso_phone)} 
                icon={<PhoneOutlinedIcon fontSize="small" />}
              />
            </Grid>
          </InfoCard>
        </Grid>

        {/* Primary Emergency Contact */}
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoCard title="Primary Emergency Contact" icon={<ContactPhoneOutlinedIcon />}>
            <Grid container spacing={2}>
              <InfoItem 
                label="Full Name" 
                value={(employee as any).primary_emergency_contact_full_name} 
                icon={<BadgeOutlinedIcon fontSize="small" />}
                fullWidth
              />
              <InfoItem 
                label="Relationship" 
                value={(employee as any).primary_emergency_contact_relationship} 
              />
              <InfoItem 
                label="Home Phone" 
                value={(employee as any).primary_emergency_contact_home_phone} 
                icon={<PhoneOutlinedIcon fontSize="small" />}
              />
            </Grid>
          </InfoCard>
        </Grid>

        {/* Secondary Emergency Contact */}
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoCard title="Secondary Emergency Contact" icon={<ContactPhoneOutlinedIcon />}>
            <Grid container spacing={2}>
              <InfoItem 
                label="Full Name" 
                value={(employee as any).secondary_emergency_contact_full_name} 
                icon={<BadgeOutlinedIcon fontSize="small" />}
                fullWidth
              />
              <InfoItem 
                label="Relationship" 
                value={(employee as any).secondary_emergency_contact_relationship} 
              />
              <InfoItem 
                label="Home Phone" 
                value={(employee as any).secondary_emergency_contact_home_phone} 
                icon={<PhoneOutlinedIcon fontSize="small" />}
              />
            </Grid>
          </InfoCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeProfileView;
