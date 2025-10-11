import { useState } from 'react';
import { Box, Tab, Tabs, Typography, Badge } from '@mui/material';
import ProjectManagerView from '../mocules/ProjectManagerView';
import EmployeeView from '../mocules/EmployeeView';
import EmployeeReviewView from '../mocules/EmployeeReviewView';
import SendEmailView from '../mocules/SendEmailView';
import OfferLetterGenerator from '../mocules/OfferLetterGenerator';
import ExpiryWatchlist from '../mocules/ExpiryWatchlist';
import ProjectsView from '../mocules/ProjectsView';
import { useEmployeeReviewCount } from '../hooks/useEmployeeReviewCount';

// Icons for tabs
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import GroupIcon from '@mui/icons-material/Group';
import RateReviewIcon from '@mui/icons-material/RateReview';
import EmailIcon from '@mui/icons-material/Email';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DescriptionIcon from '@mui/icons-material/Description';

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
      <Box sx={{ display: 'flex', height: 'calc(100vh - 48px)' }}>
        {/* Sidebar Navigation */}
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="Admin dashboard vertical tabs"
          sx={{
            borderRight: 1,
            borderColor: 'divider',
            minWidth: 260,
            bgcolor: 'background.paper',
            boxShadow: 3,
            borderRadius: 2,
            p: 1,
            '& .MuiTabs-indicator': {
              left: 0,
              width: '4px',
              borderRadius: '4px',
            },
          }}
        >
          <Tab icon={<AccountTreeIcon />} iconPosition="start" label="Projects" sx={{ justifyContent: 'flex-start', mb: 1 }} />
          <Tab icon={<SupervisorAccountIcon />} iconPosition="start" label="Project Managers" sx={{ justifyContent: 'flex-start', mb: 1 }} />
          <Tab icon={<GroupIcon />} iconPosition="start" label="Employees" sx={{ justifyContent: 'flex-start', mb: 1 }} />
          <Tab
            icon={<RateReviewIcon />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                Employee Review
                <Badge badgeContent={reviewCount} color="error" />
              </Box>
            }
            sx={{ justifyContent: 'flex-start', mb: 1 }}
          />
          <Tab icon={<EmailIcon />} iconPosition="start" label="Send Email" sx={{ justifyContent: 'flex-start', mb: 1 }} />
          <Tab icon={<WarningAmberIcon />} iconPosition="start" label="Expiry Watchlist" sx={{ justifyContent: 'flex-start', mb: 1 }} />
          <Tab icon={<DescriptionIcon />} iconPosition="start" label="Offer Letters" sx={{ justifyContent: 'flex-start', mb: 1 }} />
        </Tabs>

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, ml: 3 }}>
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3, height: '100%', overflow: 'auto' }}>
            <TabPanel value={tabIndex} index={0}><ProjectsView /></TabPanel>
            <TabPanel value={tabIndex} index={1}><ProjectManagerView /></TabPanel>
            <TabPanel value={tabIndex} index={2}><EmployeeView /></TabPanel>
            <TabPanel value={tabIndex} index={3}><EmployeeReviewView /></TabPanel>
            <TabPanel value={tabIndex} index={4}><SendEmailView /></TabPanel>
            <TabPanel value={tabIndex} index={5}><ExpiryWatchlist /></TabPanel>
            <TabPanel value={tabIndex} index={6}><OfferLetterGenerator /></TabPanel>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboardPage;