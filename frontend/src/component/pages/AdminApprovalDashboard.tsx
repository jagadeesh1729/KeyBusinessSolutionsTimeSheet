import React, { useState, useMemo, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Avatar,
  Tooltip,
  IconButton,
  Button,
} from '@mui/material';
import {
  Visibility,
  Refresh,
  HourglassEmpty,
  CheckCircleOutline,
  ErrorOutline,
} from '@mui/icons-material';
import { useAdminTimesheetsByStatus } from '../hooks/useTimesheet';
import { timesheetAPI } from '../../api/timesheetapi';
import type { Timesheet } from '../types/Holiday';

interface EnhancedTimesheet extends Omit<Timesheet, 'status' | 'totalHours'> {
  employee_name?: string;
  employee_email?: string;
  project_name?: string;
  period_type?: string;
  auto_approve?: boolean;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  totalHours?: number;
  submittedAt?: string;
}

const STATUS_CONFIG = {
  pending: {
    color: 'warning' as const,
    icon: <HourglassEmpty fontSize="small" />,
    label: 'Pending Review',
  },
  approved: {
    color: 'success' as const,
    icon: <CheckCircleOutline fontSize="small" />,
    label: 'Approved',
  },
  rejected: {
    color: 'error' as const,
    icon: <ErrorOutline fontSize="small" />,
    label: 'Rejected',
  },
  draft: {
    color: 'default' as const,
    icon: <HourglassEmpty fontSize="small" />,
    label: 'Draft',
  },
} as const;

const AdminApprovalDashboard: React.FC = () => {
  //'status', 'enum(\'draft\',\'pending\',\'approved\',\'rejected\')', 'NO', 'MUL', 'draft', ''
  const [selectedStatus, setSelectedStatus] = useState<'pending' | 'approved' | 'rejected' | 'not-submitted'>('pending');
  const normalizedStatus: 'pending' | 'approved' | 'rejected' = selectedStatus === 'not-submitted' ? 'pending' : selectedStatus;
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [appliedFrom, setAppliedFrom] = useState<string | undefined>(undefined);
  const [appliedTo, setAppliedTo] = useState<string | undefined>(undefined);
  const { data: timesheets, loading, error, refetch } = useAdminTimesheetsByStatus(normalizedStatus, appliedFrom, appliedTo);

  const enhancedTimesheets = useMemo(() => (timesheets as EnhancedTimesheet[]) || [], [timesheets]);

  const [notSubmittedItems, setNotSubmittedItems] = useState<any[]>([]);
  useEffect(() => {
    const fetchNS = async () => {
      try {
        const useCustom = Boolean(appliedFrom || appliedTo);
        const sd = appliedFrom || appliedTo || undefined;
        const ed = appliedTo || appliedFrom || undefined;
        const res = await timesheetAPI.getTimesheetDetails({ status: 'not-submitted', range: useCustom ? 'custom' : 'all', startDate: sd, endDate: ed });
        setNotSubmittedItems(res.data.items || []);
      } catch {
        setNotSubmittedItems([]);
      }
    };
    if (selectedStatus === 'not-submitted') fetchNS();
  }, [selectedStatus, appliedFrom, appliedTo]);

  const getStatusChip = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        variant="outlined"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl" className="py-8">
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
          <CircularProgress size={64} className="mb-6" />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Loading admin approvals...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className="py-8">
      <Box className="mb-6 flex items-center justify-between">
        <Typography variant="h4" className="font-bold text-gray-900">Timesheets (All Employees)</Typography>
        <Box className="flex items-center gap-2">
          <Chip label="Pending" onClick={() => setSelectedStatus('pending')} color={selectedStatus==='pending'?'warning':'default'} variant={selectedStatus==='pending'?'filled':'outlined'} />
          <Chip label="Approved" onClick={() => setSelectedStatus('approved')} color={selectedStatus==='approved'?'success':'default'} variant={selectedStatus==='approved'?'filled':'outlined'} />
          <Chip label="Rejected" onClick={() => setSelectedStatus('rejected')} color={selectedStatus==='rejected'?'error':'default'} variant={selectedStatus==='rejected'?'filled':'outlined'} />
          <Chip label="Draft" onClick={() => setSelectedStatus('not-submitted')} color={selectedStatus==='not-submitted'?'default':'default'} variant={selectedStatus==='not-submitted'?'filled':'outlined'} />
          <Tooltip title="Refresh">
            <IconButton onClick={async () => {
              if (selectedStatus === 'not-submitted') {
                try {
                  const useCustom = Boolean(appliedFrom || appliedTo);
                  const sd = appliedFrom || appliedTo || undefined;
                  const ed = appliedTo || appliedFrom || undefined;
                  const res = await timesheetAPI.getTimesheetDetails({ status: 'not-submitted', range: useCustom ? 'custom' : 'all', startDate: sd, endDate: ed });
                  setNotSubmittedItems(res.data.items || []);
                } catch {
                  setNotSubmittedItems([]);
                }
              } else {
                await refetch();
              }
            }}><Refresh /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filter Bar */}
      <Box className="mb-4 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 justify-between">
        <Box className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-700 mb-1">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              const sd = dateFrom || dateTo || undefined;
              const ed = dateTo || dateFrom || undefined;
              setAppliedFrom(sd);
              setAppliedTo(ed);
            }}
            sx={{ textTransform: 'none' }}
          >
            Apply
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setAppliedFrom(undefined);
              setAppliedTo(undefined);
            }}
            sx={{ textTransform: 'none' }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" className="mb-4">{error}</Alert>
      )}

      <Card elevation={3} className="mb-6">
        <CardContent>
          <Typography variant="h6" className="mb-2">{selectedStatus === 'not-submitted' ? 'Draft' : (selectedStatus.charAt(0).toUpperCase()+selectedStatus.slice(1))} Timesheets</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Employment Start</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Period Start</TableCell>
                  <TableCell>Period End</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(selectedStatus==='not-submitted' ? notSubmittedItems : enhancedTimesheets).map((ts, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 28, height: 28 }}>{((ts.employee_name||ts.employeeName||'??') as string).trim().split(' ').map((s:string)=>s[0]).join('').slice(0,2).toUpperCase()}</Avatar>
                        <Typography>{ts.employee_name || ts.employeeName || ts.employee?.name || '-'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{ts.employee_email || ts.employeeEmail || ts.employee?.email || '-'}</TableCell>
                    <TableCell>{(() => { const d = (ts as any).employmentStartDate || ts.employement_start_date || ts.employment_start_date; return d ? new Date(d).toLocaleDateString() : '-'; })()}</TableCell>
                    <TableCell>{ts.project_name || ts.projectName || ts.project?.name || '-'}</TableCell>
                    <TableCell>{(ts.periodStart||ts.period_start) ? new Date(ts.periodStart||ts.period_start).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{(ts.periodEnd||ts.period_end) ? new Date(ts.periodEnd||ts.period_end).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{getStatusChip(selectedStatus==='not-submitted' ? 'draft' : ts.status)}</TableCell>
                    <TableCell align="right">
                      {selectedStatus!=='not-submitted' && (
                        <Tooltip title="View details">
                          <IconButton size="small"><Visibility fontSize="small" /></IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {((selectedStatus==='not-submitted' ? notSubmittedItems.length : enhancedTimesheets.length) === 0) && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Alert severity="info">No records found.</Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AdminApprovalDashboard;
