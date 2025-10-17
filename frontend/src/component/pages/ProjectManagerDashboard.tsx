import { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import GroupIcon from '@mui/icons-material/Group';
import EventIcon from '@mui/icons-material/Event';
import BusinessOutline from '@mui/icons-material/BusinessOutlined';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ApprovalDashboard from './ApprovalDashboard';
import MyTeamView from '../mocules/MyTeamView';
import ScheduleMeetingPage from './ScheduleMeetingPage';
import MyProjectsView from '../mocules/MyProjectsView';

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

const ProjectManagerDashboard = () => {
  const [tabIndex, setTabIndex] = useState(0);

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
          aria-label="Project Manager dashboard vertical tabs"
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
          <Tab icon={<FactCheckIcon />} iconPosition="start" label="Timesheet Approvals" sx={{ justifyContent: 'flex-start', mb: 1 }} />
          <Tab icon={<GroupIcon />} iconPosition="start" label="My Team" sx={{ justifyContent: 'flex-start', mb: 1 }} />
          <Tab icon={<BusinessOutline />} iconPosition="start" label="My Projects" sx={{ justifyContent: 'flex-start', mb: 1 }}/>
          <Tab icon={<EventIcon />} iconPosition="start" label="Schedule Meeting" sx={{ justifyContent: 'flex-start', mb: 1 }} />
        </Tabs>

        {/* Main Content Area */}
        <Box sx={{ flexGrow: 1, ml: 3 }}>
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3, height: '100%', overflow: 'auto' }}>
            <TabPanel value={tabIndex} index={0}><ApprovalDashboard /></TabPanel>
            <TabPanel value={tabIndex} index={2}><MyProjectsView /></TabPanel>
            <TabPanel value={tabIndex} index={1}><MyTeamView /></TabPanel>
            <TabPanel value={tabIndex} index={3}><ScheduleMeetingPage /></TabPanel>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectManagerDashboard;