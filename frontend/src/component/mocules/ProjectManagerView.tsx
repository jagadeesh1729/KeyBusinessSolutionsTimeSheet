import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  OutlinedInput,
  Typography,
  Tooltip,
  Stack,
  Avatar,
  InputAdornment,
  Skeleton,
  Card,
  useTheme,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import RestoreIcon from '@mui/icons-material/RestoreOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import { PatternFormat } from 'react-number-format';
import { useProjectManagers } from "../hooks/useProjectManagers";
import type Employee from "../types/employee";
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

const ProjectManagerView = () => {
  const theme = useTheme();
  const {
    managers,
    inactiveManagers,
    availableProjects,
    loading,
    error,
    isModalOpen,
    editingManager,
    formData,
    handleOpenModal,
    handleDuplicate,
    handleCloseModal,
    handleFormChange,
    handleProjectSelection,
    handleSave,
    handleDeactivate,
    handleReactivate,
  } = useProjectManagers();
  
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([]);
  const [pmEmployees, setPMEmployees] = useState<Record<number, Employee[]>>({});
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<{ id: number; name: string } | null>(null);
  const [userLogs, setUserLogs] = useState<UserChangeLogEntry[]>([]);
  const [projectLogs, setProjectLogs] = useState<UserProjectChangeLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
    if (managers.length > 0) {
      managers.forEach(manager => fetchPMEmployees(manager.id));
    }
  }, [managers]);

  const fetchEmployees = async () => {
    try {
      const response = await apiClient.get('/users/employees-without-pm');
      setAvailableEmployees(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchPMEmployees = async (pmId: number) => {
    try {
      const response = await apiClient.get(`/users/pm-employees/${pmId}`);
      const employees = response.data.data || [];
      setPMEmployees(prev => ({ ...prev, [pmId]: employees }));
      return employees;
    } catch (error) {
      console.error('Failed to fetch PM employees:', error);
      return [];
    }
  };

  const handleEmployeeSelection = (event: any) => {
    const value = event.target.value;
    setSelectedEmployeeIds(value);
  };

  const handleSaveWithEmployees = async () => {
    await handleSave();
    if (selectedEmployeeIds.length >= 0 && editingManager) {
      try {
        await apiClient.post('/users/assign-employees-to-pm', {
          pm_id: editingManager.id,
          employee_ids: selectedEmployeeIds
        });
        await fetchEmployees();
        await fetchPMEmployees(editingManager.id);
      } catch (error) {
        console.error('Failed to assign employees:', error);
      }
    }
  };

  const handleOpenModalWithEmployees = async (manager: any) => {
    handleOpenModal(manager);
    if (manager) {
      const currentEmployees = await fetchPMEmployees(manager.id);
      setSelectedEmployeeIds(currentEmployees.map(emp => emp.id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  const filteredManagers = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return managers.filter(
      (m: any) =>
        m.first_name.toLowerCase().includes(term) ||
        m.last_name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term)
    );
  }, [managers, searchQuery]);

  const filteredInactiveManagers = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return inactiveManagers.filter(
      (m: any) =>
        m.first_name.toLowerCase().includes(term) ||
        m.last_name.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term)
    );
  }, [inactiveManagers, searchQuery]);

  const currentManagers = tabValue === 0 ? filteredManagers : filteredInactiveManagers;

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: 'manager',
      header: 'Manager Details',
      accessorKey: 'first_name',
      size: 280,
      cell: ({ row }) => {
        const manager = row.original;
        return (
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main,
                fontWeight: 'bold',
              }}
            >
              {manager.first_name?.[0]}{manager.last_name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                {manager.first_name} {manager.last_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {manager.id}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      id: 'projects',
      header: 'Projects',
      accessorFn: (row) => row.project?.map((p: any) => p.name).join(', ') || '',
      size: 260,
      cell: ({ row }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {row.original.project?.length ? (
            row.original.project.map((p: any) => (
              <Chip
                key={p.id}
                label={p.name}
                size="small"
                variant="outlined"
                sx={{ borderRadius: 1, borderColor: theme.palette.divider }}
              />
            ))
          ) : (
            <Typography variant="caption" color="text.disabled">No Projects</Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'employees',
      header: 'Employees',
      accessorFn: (row) => (pmEmployees[row.id] || []).length,
      size: 260,
      cell: ({ row }) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {(pmEmployees[row.original.id] || []).length > 0 ? (
            (pmEmployees[row.original.id] || []).map((emp) => (
              <Chip
                key={emp.id}
                label={`${emp.first_name ?? ((emp as any).name?.split(' ')[0] || '')} ${emp.last_name ?? ((emp as any).name?.split(' ').slice(1).join(' ') || '')}`}
                size="small"
                color="primary"
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  fontWeight: 500,
                  borderRadius: 1,
                  border: 'none',
                }}
              />
            ))
          ) : (
            <Typography variant="caption" color="text.disabled">No Employees</Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 200,
      enableSorting: false,
      enableResizing: false,
      cell: ({ row }) => {
        const manager = row.original;
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {tabValue === 0 ? (
              <>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenModalWithEmployees(manager);
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Duplicate">
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDuplicate(manager);
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Deactivate">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeactivate(manager.id);
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
                    handleReactivate(manager.id);
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
  ], [theme, tabValue, pmEmployees, handleOpenModalWithEmployees, handleDuplicate, handleDeactivate, handleReactivate]);

  const table = useReactTable({
    data: currentManagers,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: 'onChange',
  });

  const fetchUserLogs = useCallback(async (userId: number) => {
    try {
      setLogsLoading(true);
      const response = await apiClient.get(`/users/${userId}/change-logs`);
      setUserLogs(response.data.changeLogs || []);
      setProjectLogs(response.data.projectChangeLogs || []);
      setLogsError(null);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Unable to load change history.';
      setLogsError(message);
      setUserLogs([]);
      setProjectLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const handleManagerRowClick = (manager: any) => {
    setLogTarget({ id: manager.id, name: `${manager.first_name} ${manager.last_name}`.trim() });
    setLogDrawerOpen(true);
    fetchUserLogs(manager.id);
  };

  const handleCloseLogs = () => {
    setLogDrawerOpen(false);
    setLogTarget(null);
    setUserLogs([]);
    setProjectLogs([]);
    setLogsError(null);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={3} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight="700" color="text.primary">
            Project Managers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage project managers and their assignments
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenModalWithEmployees(null)}
          sx={{
            height: 48,
            px: 3,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: theme.shadows[4]
          }}
        >
          Add Manager
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
            placeholder="Search by name or email..."
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
          <Tab label={`Active (${managers.length})`} />
          <Tab label={`Inactive (${inactiveManagers.length})`} />
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
                  <TableCell><Skeleton width={150} /></TableCell>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={40} sx={{ ml: 'auto' }} /></TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  onClick={() => handleManagerRowClick(row.original)}
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
                      {tabValue === 0 ? 'No Active Managers Found' : 'No Inactive Managers Found'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
                      {searchQuery ? `No results for "${searchQuery}"` : (tabValue === 0 ? 'Use the button above to add a new manager.' : 'No deactivated managers available.')}
                    </Typography>
                    {!searchQuery && tabValue === 0 && (
                      <Button variant="outlined" onClick={() => handleOpenModalWithEmployees(null)}>
                        Add Project Manager
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingManager ? 'Edit Project Manager' : 'Add New Project Manager'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField autoFocus name="first_name" label="First Name" fullWidth value={formData.first_name || ''} onChange={handleFormChange} />
              <TextField name="last_name" label="Last Name" fullWidth value={formData.last_name || ''} onChange={handleFormChange} />
            </Stack>
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
            <FormControl fullWidth>
              <InputLabel id="pm-projects-select-label">Assign Projects</InputLabel>
              <Select
                labelId="pm-projects-select-label"
                multiple
                value={(formData as any).project_ids || []}
                onChange={handleProjectSelection}
                input={<OutlinedInput id="select-multiple-chip-pm" label="Assign Projects" />}
                renderValue={(selected: number[]) => (<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{availableProjects.filter(p=>selected.includes(p.id)).map((p) => (<Chip key={p.id} label={p.name} size="small" />))}</Box>)}
              >
                {availableProjects.map((project) => {
                  const assignedByOther = managers.some(m => m.id !== (editingManager?.id || 0) && (m.project || []).some(p => p.id === project.id));
                  return (
                    <MenuItem key={project.id} value={project.id} disabled={assignedByOther}>
                      {project.name}{assignedByOther ? ' (Assigned to another PM)' : ''}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="pm-employees-select-label">Assign Employees</InputLabel>
              <Select
                labelId="pm-employees-select-label"
                multiple
                value={selectedEmployeeIds}
                onChange={handleEmployeeSelection}
                input={<OutlinedInput id="select-multiple-chip-employees" label="Assign Employees" />}
                renderValue={(selected: number[]) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {[...availableEmployees, ...(editingManager ? pmEmployees[editingManager.id] || [] : [])]
                      .filter((emp, index, self) => selected.includes(emp.id) && self.findIndex(e => e.id === emp.id) === index)
                      .map((emp) => (<Chip key={emp.id} label={`${emp.first_name ?? ((emp as any).name?.split(' ')[0]||'')} ${emp.last_name ?? ((emp as any).name?.split(' ').slice(1).join(' ')||'')}`} size="small" />))}
                  </Box>
                )}
              >
                {availableEmployees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>{`${employee.first_name ?? ((employee as any).name?.split(' ')[0]||'')} ${employee.last_name ?? ((employee as any).name?.split(' ').slice(1).join(' ')||'')}`} - {employee.email}</MenuItem>
                ))}
                {editingManager && (pmEmployees[editingManager.id] || []).map((employee) => (
                  <MenuItem key={`assigned-${employee.id}`} value={employee.id}>{`${employee.first_name ?? ((employee as any).name?.split(' ')[0]||'')} ${employee.last_name ?? ((employee as any).name?.split(' ').slice(1).join(' ')||'')}`} - {employee.email} (Currently Assigned)</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button onClick={handleSaveWithEmployees} variant="contained" sx={{ px: 3 }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

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
              id: `manager-log-${log.id}`,
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
              id: `manager-project-log-${log.id}`,
              field: `Project ${log.project_name || log.project_id}`,
              oldValue: log.old_value ?? (log.action_type === 'UNASSIGNED' ? 'Assigned' : '—'),
              newValue: log.new_value ?? (log.action_type === 'ASSIGNED' ? 'Assigned' : '—'),
              changeType: log.action_type,
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

export default ProjectManagerView;
