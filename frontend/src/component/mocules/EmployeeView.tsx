import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Tooltip,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  OutlinedInput,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Typography,
  Button,
  Card,
  InputAdornment,
  Avatar,
  Skeleton,
  useTheme,
  Tabs,
  Tab
} from "@mui/material";
import { alpha } from '@mui/material/styles';
import { PatternFormat } from 'react-number-format';
import type { SelectChangeEvent } from "@mui/material";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import RestoreIcon from "@mui/icons-material/RestoreOutlined";
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import type Employee from "../types/employee";
import OfferLetterEditor from './OfferLetterEditor';
import { useAuth } from '../../context/AuthContext';
import { useEmployees } from "../hooks/useEmployees";
import apiClient from '../../api/apiClient';
import ChangeHistoryDrawer from './ChangeHistoryDrawer';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

interface UserChangeLogEntry {
  id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: 'CREATE' | 'UPDATE' | 'DELETE';
  change_reason?: string | null;
  changed_at: string;
  changed_by_name?: string | null;
  changed_by_email?: string | null;
}

interface UserProjectChangeLogEntry {
  id: number;
  project_id: number;
  project_name?: string | null;
  action_type: 'ASSIGNED' | 'UNASSIGNED' | 'UPDATED';
  old_value: string | null;
  new_value: string | null;
  change_reason?: string | null;
  changed_at: string;
  changed_by_name?: string | null;
  changed_by_email?: string | null;
}

interface EmployeeChangeLogEntry {
  id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: 'CREATE' | 'UPDATE' | 'DELETE';
  change_reason?: string | null;
  changed_at: string;
  changed_by_name?: string | null;
  changed_by_email?: string | null;
}

const EmployeeView = () => {
  const theme = useTheme();
  const {
    employees,
    inactiveEmployees,
    availableProjects,
    availableManagers,
    pmProjectsOptions,
    loading,
    error,
    isModalOpen,
    editingEmployee,
    formData,
    handleOpenModal,
    handleCloseModal,
    handleFormChange,
    handleProjectSingleSelect,
    handleSave,
    handleDelete,
    handleReactivate,
  } = useEmployees();
  const { user } = useAuth();
  const [offerOpen, setOfferOpen] = React.useState(false);
  const [offerEmployee, setOfferEmployee] = React.useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<{ id: number; name: string } | null>(null);
  const [userLogs, setUserLogs] = useState<UserChangeLogEntry[]>([]);
  const [projectLogs, setProjectLogs] = useState<UserProjectChangeLogEntry[]>([]);
  const [employeeLogs, setEmployeeLogs] = useState<EmployeeChangeLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const openOffer = (emp: Employee) => { setOfferEmployee(emp); setOfferOpen(true); };
  const closeOffer = () => { setOfferOpen(false); setOfferEmployee(null); };

  const handleProjectSelectChange = (event: SelectChangeEvent<number[]>) => {
    const selectedProjectIds = event.target.value as number[];
    handleFormChange({
      target: {
        name: 'project_ids',
        value: selectedProjectIds,
        type: 'select'
      }
    } as any);
  };

  const handleManagerSelectChange = (event: SelectChangeEvent<number>) => {
    const selectedManagerId = event.target.value as number;
    const selectedManager = availableManagers.find(m => m.id === selectedManagerId);
    handleFormChange({
      target: {
        name: 'project_manager_id',
        value: selectedManagerId,
        type: 'select'
      }
    } as any);
  };

  const filteredEmployees = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return employees.filter(
      (e: any) =>
        e.first_name.toLowerCase().includes(term) ||
        e.last_name.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        (e.job_title && e.job_title.toLowerCase().includes(term))
    );
  }, [employees, searchQuery]);

  const filteredInactiveEmployees = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return inactiveEmployees.filter(
      (e: any) =>
        e.first_name.toLowerCase().includes(term) ||
        e.last_name.toLowerCase().includes(term) ||
        e.email.toLowerCase().includes(term) ||
        (e.job_title && e.job_title.toLowerCase().includes(term))
    );
  }, [inactiveEmployees, searchQuery]);

  const fetchUserLogs = useCallback(async (userId: number) => {
    try {
      setLogsLoading(true);
      const response = await apiClient.get(`/users/${userId}/change-logs`);
      setUserLogs(response.data.changeLogs || []);
      setProjectLogs(response.data.projectChangeLogs || []);
      setEmployeeLogs(response.data.employeeChangeLogs || []);
      setLogsError(null);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Unable to load change history.';
      setLogsError(message);
      setUserLogs([]);
      setProjectLogs([]);
      setEmployeeLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const handleRowClick = (employee: Employee) => {
    setLogTarget({ id: employee.id, name: `${employee.first_name} ${employee.last_name}`.trim() });
    setLogDrawerOpen(true);
    fetchUserLogs(employee.id);
  };

  const handleCloseLogs = () => {
    setLogDrawerOpen(false);
    setLogTarget(null);
    setUserLogs([]);
    setProjectLogs([]);
    setEmployeeLogs([]);
    setLogsError(null);
  };

  const currentEmployees = tabValue === 0 ? filteredEmployees : filteredInactiveEmployees;

  const columns = useMemo<ColumnDef<Employee>[]>(() => [
    {
      id: 'employee',
      header: 'Employee Details',
      accessorKey: 'first_name',
      size: 300,
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.main,
                fontWeight: 'bold',
              }}
            >
              {employee.first_name?.[0]}{employee.last_name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                {employee.first_name} {employee.last_name}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                <EmailIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">
                  {employee.email}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        );
      },
    },
    {
      id: 'jobTitle',
      header: 'Job Title',
      accessorFn: (row) => row.job_title || '',
      size: 160,
      cell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <WorkIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary">
            {row.original.job_title || 'N/A'}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'manager',
      header: 'Project Manager',
      accessorFn: (row) => row.project_manager?.first_name || '',
      size: 200,
      cell: ({ row }) => (
        row.original.project_manager ? (
          <Chip
            avatar={<Avatar sx={{ width: 24, height: 24 }}>{row.original.project_manager.first_name[0]}</Avatar>}
            label={`${row.original.project_manager.first_name} ${row.original.project_manager.last_name}`}
            variant="outlined"
            size="small"
          />
        ) : (
          <Typography variant="caption" color="text.disabled">Unassigned</Typography>
        )
      ),
    },
    {
      id: 'projects',
      header: 'Projects',
      accessorFn: (row) => row.project?.map((p) => p.name).join(', ') || '',
      size: 260,
      cell: ({ row }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {row.original.project?.length ? (
            row.original.project.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  borderRadius: 1,
                }}
              />
            ))
          ) : (
            <Typography variant="caption" color="text.disabled">No Projects</Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 220,
      enableSorting: false,
      enableResizing: false,
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {tabValue === 0 ? (
              <>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenModal(employee);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Offer Letter">
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      openOffer(employee);
                    }}
                  >
                    <DescriptionIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Deactivate">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(employee.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Tooltip title="Reactivate">
                <IconButton
                  size="small"
                  color="success"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleReactivate(employee.id);
                  }}
                >
                  <RestoreIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        );
      },
    },
  ], [theme, tabValue, handleOpenModal, openOffer, handleDelete, handleReactivate]);

  const table = useReactTable({
    data: currentEmployees,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: 'onChange',
  });

  return (
    <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={3} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight="700" color="text.primary">
            Employees
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage employee records and assignments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModal(null)}
          sx={{
            height: 48,
            px: 3,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: theme.shadows[4]
          }}
        >
          Add Employee
        </Button>
      </Stack>

      {error && (
        <Box mb={2}>
          <Alert severity="error" variant="filled" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        </Box>
      )}

      <Card sx={{ mb: 3, p: 2, borderRadius: 2, boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search by name, email, or job title..."
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 500 }}
          />
          <Tooltip title="Filter list">
            <IconButton>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ '& .MuiTab-root': { textTransform: 'none' } }}
        >
          <Tab label={`Active (${employees.length})`} />
          <Tab label={`Inactive (${inactiveEmployees.length})`} />
        </Tabs>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
        <Table sx={{ tableLayout: 'fixed' }}>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    colSpan={header.colSpan}
                    onClick={header.column.getToggleSortingHandler()}
                    sx={{
                      fontWeight: 600,
                      color: 'text.secondary',
                      userSelect: 'none',
                      width: header.getSize(),
                      position: 'relative',
                      cursor: header.column.getCanSort() ? 'pointer' : 'default',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc'
                        ? 'ASC'
                        : header.column.getIsSorted() === 'desc'
                          ? 'DESC'
                          : ''}
                    </Stack>
                    {header.column.getCanResize() && (
                      <Box
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        sx={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          height: '100%',
                          width: '4px',
                          cursor: 'col-resize',
                          zIndex: 1,
                        }}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Stack direction="row" spacing={2}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box>
                        <Skeleton width={120} />
                        <Skeleton width={60} />
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={120} /></TableCell>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={40} sx={{ ml: 'auto' }} /></TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  onClick={() => handleRowClick(row.original)}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} sx={{ width: cell.column.getSize() }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getVisibleFlatColumns().length} align="center" sx={{ py: 8 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="text.primary">
                      {tabValue === 0 ? 'No Active Employees Found' : 'No Inactive Employees Found'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
                      {searchQuery ? `No results for "${searchQuery}"` : (tabValue === 0 ? 'Use the button above to add a new employee.' : 'No deactivated employees available.')}
                    </Typography>
                    {!searchQuery && tabValue === 0 && (
                      <Button variant="outlined" onClick={() => handleOpenModal(null)}>
                        Add Employee
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField autoFocus name="first_name" label="First Name" fullWidth value={formData.first_name || ''} onChange={handleFormChange} />
              <TextField name="last_name" label="Last Name" fullWidth value={formData.last_name || ''} onChange={handleFormChange} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField name="email" label="Email" type="email" fullWidth value={formData.email || ''} onChange={handleFormChange} />
              <PatternFormat
                format="+1 (###) ###-####"
                mask="_"
                allowEmptyFormatting
                value={formData.phone || ''}
                onValueChange={(vals) => {
                  handleFormChange({ target: { name: 'phone', value: vals.formattedValue } } as any);
                }}
                customInput={TextField}
                name="phone"
                label="Phone"
                fullWidth
              />
            </Stack>
            
            <Typography variant="subtitle2" color="primary" sx={{ pt: 1 }}>Job Details</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField name="job_title" label="Job Title" fullWidth value={formData.job_title || ''} onChange={handleFormChange} />
              <TextField name="compensation" label="Compensation" fullWidth value={formData.compensation || ''} onChange={handleFormChange} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField name="job_start_date" label="Job Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.job_start_date?.split('T')[0] || ''} onChange={handleFormChange} />
              <TextField name="end_date" label="End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.end_date?.split('T')[0] || ''} onChange={handleFormChange} />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField name="no_of_hours" label="Number of Hours" type="number" fullWidth value={formData.no_of_hours || ''} onChange={handleFormChange} />
              <TextField name="visa_status" label="Visa Status" fullWidth value={formData.visa_status || ''} onChange={handleFormChange} />
            </Stack>
            <TextField name="job_duties" label="Job Duties" fullWidth multiline rows={3} value={formData.job_duties || ''} onChange={handleFormChange} />

            <Typography variant="subtitle2" color="primary" sx={{ pt: 1 }}>Education</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField name="college_name" label="College Name" fullWidth value={formData.college_name || ''} onChange={handleFormChange} />
              <TextField name="degree" label="Degree" fullWidth value={formData.degree || ''} onChange={handleFormChange} />
            </Stack>
            <TextField name="college_address" label="College Address" fullWidth value={formData.college_address || ''} onChange={handleFormChange} />
            
            <Typography variant="subtitle2" color="primary" sx={{ pt: 1 }}>DSO Contact</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField name="college_Dso_name" label="DSO Name" fullWidth value={(formData as any).college_Dso_name || ''} onChange={handleFormChange} />
              <TextField name="college_Dso_email" label="DSO Email" type="email" fullWidth value={(formData as any).college_Dso_email || ''} onChange={handleFormChange} />
              <PatternFormat
                format="+1 (###) ###-####"
                mask="_"
                allowEmptyFormatting
                value={(formData as any).college_Dso_phone || ''}
                onValueChange={(vals) => {
                  handleFormChange({ target: { name: 'college_Dso_phone', value: vals.formattedValue } } as any);
                }}
                customInput={TextField}
                name="college_Dso_phone"
                label="DSO Phone"
                fullWidth
              />
            </Stack>

            <Typography variant="subtitle2" color="primary" sx={{ pt: 1 }}>Primary Emergency Contact</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField name="primary_emergency_contact_full_name" label="Full Name" fullWidth value={(formData as any).primary_emergency_contact_full_name || ''} onChange={handleFormChange} />
              <TextField name="primary_emergency_contact_relationship" label="Relationship" fullWidth value={(formData as any).primary_emergency_contact_relationship || ''} onChange={handleFormChange} placeholder="e.g. Parent, Spouse" />
            </Stack>
            <TextField 
              name="primary_emergency_contact_home_phone" 
              label="Home Phone (with extension)" 
              fullWidth 
              value={(formData as any).primary_emergency_contact_home_phone || ''} 
              onChange={handleFormChange} 
              placeholder="e.g. +1 (123) 456-7890 or +91 98765 43210"
            />

            <Typography variant="subtitle2" color="primary" sx={{ pt: 1 }}>Secondary Emergency Contact</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField name="secondary_emergency_contact_full_name" label="Full Name" fullWidth value={(formData as any).secondary_emergency_contact_full_name || ''} onChange={handleFormChange} />
              <TextField name="secondary_emergency_contact_relationship" label="Relationship" fullWidth value={(formData as any).secondary_emergency_contact_relationship || ''} onChange={handleFormChange} placeholder="e.g. Parent, Spouse" />
            </Stack>
            <TextField 
              name="secondary_emergency_contact_home_phone" 
              label="Home Phone (with extension)" 
              fullWidth 
              value={(formData as any).secondary_emergency_contact_home_phone || ''} 
              onChange={handleFormChange} 
              placeholder="e.g. +1 (123) 456-7890 or +91 98765 43210"
            />

            <Typography variant="subtitle2" color="primary" sx={{ pt: 1 }}>Assignment</Typography>
            {/* Read-only PM info */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">Current Project Manager</Typography>
              <Typography variant="body2" fontWeight={500}>
                {formData.project_manager ? `${formData.project_manager.first_name} ${formData.project_manager.last_name}` : 'None'}
              </Typography>
            </Box>
            
            {/* Admin can pick exactly one project from the associated PM's projects */}
            <FormControl fullWidth disabled={!formData.project_manager && !formData.project_manager_id}>
              <InputLabel id="employee-project-select-label">Select Project (from PM)</InputLabel>
              <Select
                labelId="employee-project-select-label"
                value={(formData as any).selected_project_id || ''}
                label="Select Project (from PM)"
                onChange={(e: any) => handleProjectSingleSelect(e)}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {pmProjectsOptions.map((project) => (
                  <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ px: 3 }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {offerEmployee && (
        <OfferLetterEditor
          open={offerOpen}
          employee={offerEmployee}
          adminName={user?.name || 'Admin'}
          onClose={closeOffer}
        />
      )}

      <ChangeHistoryDrawer
        open={logDrawerOpen}
        onClose={handleCloseLogs}
        title={logTarget ? `${logTarget.name} History` : 'Change History'}
        loading={logsLoading}
        error={logsError}
        sections={[
          {
            title: 'User Changes',
            emptyLabel: 'No changes recorded yet.',
            entries: userLogs.map((log) => ({
              id: `user-log-${log.id}`,
              field: log.field_name,
              oldValue: log.old_value,
              newValue: log.new_value,
              changeType: log.change_type,
              changeReason: log.change_reason ?? undefined,
              changedAt: log.changed_at,
              changedBy: log.changed_by_name || log.changed_by_email || null,
            })),
          },
          {
            title: 'Project Assignments',
            emptyLabel: 'No project assignment changes recorded.',
            entries: projectLogs.map((log) => ({
              id: `project-log-${log.id}`,
              field: `Project ${log.project_name || log.project_id}`,
              oldValue: log.old_value ?? (log.action_type === 'UNASSIGNED' ? 'Assigned' : '—'),
              newValue: log.new_value ?? (log.action_type === 'ASSIGNED' ? 'Assigned' : '—'),
              changeType: log.action_type,
              changeReason: log.change_reason ?? undefined,
              changedAt: log.changed_at,
              changedBy: log.changed_by_name || log.changed_by_email || null,
            })),
          },
          {
            title: 'Employee Profile Changes',
            emptyLabel: 'No employee profile changes recorded.',
            entries: employeeLogs.map((log) => ({
              id: `employee-log-${log.id}`,
              field: log.field_name,
              oldValue: log.old_value,
              newValue: log.new_value,
              changeType: log.change_type,
              changeReason: log.change_reason ?? undefined,
              changedAt: log.changed_at,
              changedBy: log.changed_by_name || log.changed_by_email || null,
            })),
          },
        ]}
      />
    </Box>
  );
};

export default EmployeeView;
