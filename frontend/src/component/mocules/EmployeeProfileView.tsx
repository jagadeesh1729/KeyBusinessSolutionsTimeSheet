import {
  Typography,
  Divider,
  Box,
  Stack,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import type Employee from '../types/employee';

interface EmployeeProfileViewProps {
  employee: Employee | null;
}

const EmployeeProfileView = ({ employee }: EmployeeProfileViewProps) => {
  if (!employee) return <Typography>Loading profile...</Typography>;

  const InfoItem = ({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) => (
    <div className="col-span-12 sm:col-span-6 md:col-span-4">
      <Stack direction="row" spacing={2} alignItems="center">
        {icon}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {label}
          </Typography>
          <Typography variant="body1" fontWeight="500">
            {value || 'N/A'}
          </Typography>
        </Box>
      </Stack>
    </div>
  );

  return (
    <Box>
      {/* Personal Information */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <PersonOutlineIcon color="primary" />
        <Typography variant="h6" fontWeight="bold">Personal Information</Typography>
      </Stack>
      <div className="grid grid-cols-12 gap-6">
        <InfoItem label="Full Name" value={employee.name} />
        <InfoItem label="Email" value={employee.email} icon={<EmailOutlinedIcon fontSize="small" color="action" />} />
        <InfoItem label="Phone" value={employee.phone} icon={<PhoneOutlinedIcon fontSize="small" color="action" />} />
        <InfoItem label="Location" value={employee.location} />
        <InfoItem
          label="Date of Birth"
          value={employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : 'N/A'}
        />
      </div>

      <Divider sx={{ my: 4 }} />

      {/* Employment Details */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <WorkOutlineIcon color="primary" />
        <Typography variant="h6" fontWeight="bold">Employment Details</Typography>
      </Stack>
      <div className="grid grid-cols-12 gap-6">
        <InfoItem label="Job Title" value={employee.job_title} />
        <InfoItem
          label="Role"
          value={<Typography sx={{ textTransform: 'capitalize' }}>{employee.role?.replace('_', ' ') || 'N/A'}</Typography>}
        />
        <InfoItem
          label="Employment Start Date"
          value={employee.employement_start_date ? new Date(employee.employement_start_date).toLocaleDateString() : 'N/A'}
        />
        <InfoItem label="Weekly Hours" value={employee.no_of_hours} />
        <InfoItem label="Compensation" value={employee.compensation} />
        <InfoItem label="Visa Status" value={employee.visa_status} />
      </div>

      <Divider sx={{ my: 4 }} />

      {/* Education */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <SchoolOutlinedIcon color="primary" />
        <Typography variant="h6" fontWeight="bold">Education</Typography>
      </Stack>
      <div className="grid grid-cols-12 gap-6">
        <InfoItem label="Degree" value={employee.degree} />
        <InfoItem label="College" value={employee.college_name} />
      </div>
    </Box>
  );
};

export default EmployeeProfileView;