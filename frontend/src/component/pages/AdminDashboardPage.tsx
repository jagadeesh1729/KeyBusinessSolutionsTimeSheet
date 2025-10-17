import { useState } from 'react';
import { Box, Tab, Tabs, Badge, Typography, Divider } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import GroupIcon from '@mui/icons-material/Group';
import RateReviewIcon from '@mui/icons-material/RateReview';
import EmailIcon from '@mui/icons-material/Email';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DescriptionIcon from '@mui/icons-material/Description';
import TimesheetManagement from './TimesheetManagement';
import AdminApprovalDashboard from './AdminApprovalDashboard';
import TimesheetPage from './TimesheetPage';
import ProjectsView from '../mocules/ProjectsView';
import ProjectManagerView from '../mocules/ProjectManagerView';
import EmployeeView from '../mocules/EmployeeView';
import EmployeeReviewView from '../mocules/EmployeeReviewView';
import SendEmailView from '../mocules/SendEmailView';
import ExpiryWatchlist from '../mocules/ExpiryWatchlist';
import OfferLetterGenerator from '../mocules/OfferLetterGenerator';
import { useEmployeeReviewCount } from '../hooks/useEmployeeReviewCount';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`vertical-tabpanel-${index}`} aria-labelledby={`vertical-tab-${index}`} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboardPage = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const reviewCount = useEmployeeReviewCount();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'grey.100', minHeight: '100vh' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>Admin Dashboard</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Manage timesheets, projects, users, and more</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 88px)' }}>
        {/* Sidebar Navigation */}
        <Box sx={{ position: 'sticky', top: 16, alignSelf: 'flex-start' }}>
          <Box sx={{
            borderRight: 1,
            borderColor: 'divider',
            minWidth: 280,
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 2,
            p: 2,
          }}>
            <Typography variant="subtitle2" sx={{ color: 'text.secondary', px: 1, pb: 1 }}>Navigation</Typography>
            <Divider sx={{ mb: 1 }} />
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={tabIndex}
              onChange={handleTabChange}
              aria-label="Admin dashboard vertical tabs"
              sx={{
                '& .MuiTabs-indicator': {
                  left: 0,
                  width: '4px',
                  borderRadius: '4px',
                },
                '& .MuiTab-root': {
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 1,
                  minHeight: 44,
                  mb: 0.5,
                },
                '& .Mui-selected': {
                  bgcolor: 'action.selected',
                  color: 'primary.main',
                },
              }}
            >
              <Tab icon={<FactCheckIcon />} iconPosition="start" label="Timesheets" />
              <Tab icon={<AccountTreeIcon />} iconPosition="start" label="Projects" />
              <Tab icon={<SupervisorAccountIcon />} iconPosition="start" label="Project Managers" />
              <Tab icon={<GroupIcon />} iconPosition="start" label="Employees" />
              <Tab
                icon={<RateReviewIcon />}
                iconPosition="start"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    Employee Profile  Review
                    <Badge badgeContent={reviewCount} color="error" />
                  </Box>
                }
              />
              <Tab icon={<EmailIcon />} iconPosition="start" label="Send Email" />
              <Tab icon={<WarningAmberIcon />} iconPosition="start" label="Expiry Watchlist" />
            </Tabs>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3, height: '100%', overflow: 'auto' }}>
            <TabPanel value={tabIndex} index={0}><AdminApprovalDashboard /></TabPanel>
            <TabPanel value={tabIndex} index={1}><ProjectsView /></TabPanel>
            <TabPanel value={tabIndex} index={2}><ProjectManagerView /></TabPanel>
            <TabPanel value={tabIndex} index={3}><EmployeeView /></TabPanel>
            <TabPanel value={tabIndex} index={4}><EmployeeReviewView /></TabPanel>
            <TabPanel value={tabIndex} index={5}><SendEmailView /></TabPanel>
            <TabPanel value={tabIndex} index={6}><ExpiryWatchlist /></TabPanel>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboardPage;
