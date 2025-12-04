import React, { useMemo, useState, useCallback } from 'react';
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
  FormControlLabel,
  Switch,
  Typography,
  Tooltip,
  Stack,
  Avatar,
  InputAdornment,
  Skeleton,
  Card,
  useTheme,
  Button,
  Grid,
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
import FolderIcon from '@mui/icons-material/Folder';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useProjects } from '../hooks/useProjects';
import type Project from '../types/project';
import apiClient from '../../api/apiClient';
import ChangeHistoryDrawer from './ChangeHistoryDrawer';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

interface ProjectChangeLogEntry {
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

interface ProjectHistoryEntry {
  id: number;
  old_start_date: string | null;
  old_end_date: string | null;
  new_start_date: string | null;
  new_end_date: string | null;
  changed_at: string;
}

const formatDateValue = (value?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
};

const formatDateRange = (start?: string | null, end?: string | null) => {
  if (!start && !end) return '—';
  return `${formatDateValue(start)} → ${formatDateValue(end)}`;
};

const StatusBadge = ({ status }: { status: string }) => {
  const theme = useTheme();

  let color = theme.palette.text.secondary;
  let bgcolor = theme.palette.action.selected;

  if (status === 'Active') {
    color = theme.palette.success.main;
    bgcolor = alpha(theme.palette.success.main, 0.16);
  } else if (status === 'Inactive') {
    color = theme.palette.error.main;
    bgcolor = alpha(theme.palette.error.main, 0.16);
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1.5,
        py: 0.5,
        borderRadius: 1,
        bgcolor,
        color,
        fontWeight: 700,
        fontSize: '0.75rem',
        textTransform: 'uppercase'
      }}
    >
      {status}
    </Box>
  );
};

const ProjectsView = () => {
  const theme = useTheme();
  const {
    projects,
    inactiveProjects,
    loading,
    error,
    isModalOpen,
    editingProject,
    formData,
    handleOpenModal,
    handleCloseModal,
    handleDuplicate,
    handleFormChange,
    handleSave,
    handleDeactivate,
    handleReactivate,
  } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<{ id: number; name: string } | null>(null);
  const [projectLogs, setProjectLogs] = useState<ProjectChangeLogEntry[]>([]);
  const [dateHistory, setDateHistory] = useState<ProjectHistoryEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'No Date';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return 'No Date';
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredProjects = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return projects.filter(
      (p: any) =>
        p.name.toLowerCase().includes(term) ||
        (p.code && p.code.toLowerCase().includes(term))
    );
  }, [projects, searchQuery]);

  const filteredInactiveProjects = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return inactiveProjects.filter(
      (p: any) =>
        p.name.toLowerCase().includes(term) ||
        (p.code && p.code.toLowerCase().includes(term))
    );
  }, [inactiveProjects, searchQuery]);

  const currentProjects = tabValue === 0 ? filteredProjects : filteredInactiveProjects;

  const columns = useMemo<ColumnDef<Project>[]>(() => [
    {
      id: 'details',
      header: 'Project Details',
      accessorKey: 'name',
      size: 320,
      cell: ({ row }) => {
        const project = row.original;
        return (
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                borderRadius: 2,
              }}
              variant="rounded"
            >
              <FolderIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                {project.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {project.code || 'NO CODE'}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      size: 150,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'timeline',
      header: 'Timeline',
      accessorFn: (row) => row.start_date || '',
      size: 260,
      sortingFn: (rowA, rowB, columnId) => {
        const a = new Date(rowA.getValue(columnId) as string).getTime();
        const b = new Date(rowB.getValue(columnId) as string).getTime();
        return a - b;
      },
      cell: ({ row }) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary">
            {`${formatDate(row.original.start_date)} - ${formatDate(row.original.end_date)}`}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'period',
      header: 'Period',
      accessorKey: 'period_type',
      size: 150,
      cell: ({ row }) => (
        <Chip
          label={row.original.period_type || 'Weekly'}
          size="small"
          variant="outlined"
          sx={{ borderRadius: 1, borderColor: theme.palette.divider }}
        />
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 160,
      enableSorting: false,
      enableResizing: false,
      cell: ({ row }) => {
        const project = row.original;
        return (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {tabValue === 0 ? (
              <>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenModal(project);
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
                      handleDuplicate(project);
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
                      handleDeactivate(project.id);
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
                    handleReactivate(project.id);
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
  ], [theme, tabValue, handleOpenModal, handleDuplicate, handleDeactivate, handleReactivate]);

  const table = useReactTable({
    data: currentProjects,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
  });

  const fetchProjectLogs = useCallback(async (projectId: number) => {
    try {
      setLogsLoading(true);
      const response = await apiClient.get(`/projects/${projectId}/change-logs`);
      setProjectLogs(response.data.changeLogs || []);
      setDateHistory(response.data.dateHistory || []);
      setLogsError(null);
    } catch (error: any) {
      const message = error?.response?.data?.message ?? 'Unable to load change history.';
      setLogsError(message);
      setProjectLogs([]);
      setDateHistory([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const handleRowClick = (project: Project) => {
    setLogTarget({ id: project.id, name: project.name });
    setLogDrawerOpen(true);
    fetchProjectLogs(project.id);
  };

  const handleCloseLogs = () => {
    setLogDrawerOpen(false);
    setLogTarget(null);
    setProjectLogs([]);
    setDateHistory([]);
    setLogsError(null);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, margin: '0 auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" mb={3} spacing={2}>
        <Box>
          <Typography variant="h4" fontWeight="700" color="text.primary">
            Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your ongoing projects and timelines
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
          New Project
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
            placeholder="Search project name or code..."
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
          <Tab label={`Active (${projects.length})`} />
          <Tab label={`Inactive (${inactiveProjects.length})`} />
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
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={150} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
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
                      {tabValue === 0 ? 'No Active Projects Found' : 'No Inactive Projects Found'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
                      {searchQuery ? `No results for "${searchQuery}"` : (tabValue === 0 ? 'Get started by creating your first project.' : 'No deactivated projects available.')}
                    </Typography>
                    {!searchQuery && tabValue === 0 && (
                      <Button variant="outlined" onClick={() => handleOpenModal(null)}>
                        Create Project
                      </Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingProject ? 'Edit Project' : 'Create New Project'}
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={3}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>Project Overview</Typography>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        autoFocus
                        name="name"
                        label="Project Name"
                        placeholder="e.g. Website Revamp"
                        fullWidth
                        required
                        value={formData.name || ''}
                        onChange={handleFormChange}
                      />
                      {editingProject ? (
                        <TextField
                          name="code"
                          label="Code"
                          fullWidth
                          disabled
                          value={(formData as any).code || ''}
                          sx={{ maxWidth: { sm: 150 } }}
                        />
                      ) : (
                        <TextField
                          name="code"
                          label="Code (Optional)"
                          placeholder="PRJ-001"
                          fullWidth
                          value={(formData as any).code || ''}
                          onChange={handleFormChange}
                          sx={{ maxWidth: { sm: 150 } }}
                        />
                      )}
                    </Stack>
                    <TextField
                      name="project_description"
                      label="Description"
                      fullWidth
                      multiline
                      minRows={3}
                      value={(formData as any).project_description || ''}
                      onChange={handleFormChange}
                      placeholder="Briefly describe the project scope..."
                    />
                  </Stack>
                </Card>

                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>Scheduling & Location</Typography>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        name="start_date"
                        label="Start Date"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={formData.start_date || ''}
                        onChange={handleFormChange}
                      />
                      <TextField
                        name="end_date"
                        label="End Date"
                        type="date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={formData.end_date || ''}
                        onChange={handleFormChange}
                      />
                    </Stack>
                    <TextField
                      name="client_address"
                      label="Client Address"
                      placeholder="123 Market St, San Francisco"
                      fullWidth
                      value={(formData as any).client_address || ''}
                      onChange={handleFormChange}
                    />
                  </Stack>
                </Card>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Stack spacing={3}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>Settings</Typography>
                  <Stack spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select name="status" value={formData.status || 'Active'} label="Status" onChange={(e) => handleFormChange(e as any)}>
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>Period Type</InputLabel>
                      <Select name="period_type" value={formData.period_type || 'weekly'} label="Period Type" onChange={(e) => handleFormChange(e as any)}>
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="bi-monthly">Bi-Monthly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Card>

                <Card variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>Options</Typography>
                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="auto_approve"
                          checked={formData.auto_approve || false}
                          onChange={handleFormChange}
                          color="primary"
                        />
                      }
                      label={<Typography variant="body2">Auto-approve Timesheets</Typography>}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          name="signature_required"
                          checked={(formData as any).signature_required ?? true}
                          onChange={handleFormChange}
                          color="primary"
                        />
                      }
                      label={<Typography variant="body2">Require Signatures</Typography>}
                    />
                  </Stack>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseModal} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!formData.name}
            sx={{ px: 3 }}
          >
            {editingProject ? 'Save Changes' : 'Create Project'}
          </Button>
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
            title: 'Field Changes',
            emptyLabel: 'No change logs captured yet.',
            entries: projectLogs.map((log) => ({
              id: `log-${log.id}`,
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

export default ProjectsView;



