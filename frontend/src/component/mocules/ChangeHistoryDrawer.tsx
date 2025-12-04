import React, { useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

export interface ChangeHistoryEntry {
  id: string | number;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  changeType?: string;
  changedAt?: string;
  changedBy?: string | null;
  changeReason?: string | null;
}

export interface ChangeHistorySection {
  title: string;
  emptyLabel: string;
  entries: ChangeHistoryEntry[];
}

interface ChangeHistoryDrawerProps {
  open: boolean;
  title: string;
  sections: ChangeHistorySection[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
}

const formatDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  
  return `${month}/${day}/${year} ${hour12}:${minutes} ${ampm}`;
};

const getFullDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[date.getDay()];
  
  return `${dayName}, ${month}/${day}/${year} ${hour12}:${minutes}:${seconds} ${ampm}`;
};

const renderValue = (value?: string | null) => {
  if (value === undefined || value === null || value === '') {
    return <span className="text-gray-400 italic text-xs">Empty</span>;
  }
  return value;
};

const getChangeTypeConfig = (changeType?: string) => {
  switch (changeType?.toUpperCase()) {
    case 'CREATE':
    case 'ASSIGNED':
      return {
        bgColor: '#dcfce7',
        textColor: '#166534',
        borderColor: '#86efac',
        icon: <AddCircleOutlineIcon sx={{ fontSize: 12 }} />,
        label: changeType === 'ASSIGNED' ? 'Assigned' : 'Created'
      };
    case 'DELETE':
    case 'UNASSIGNED':
      return {
        bgColor: '#fee2e2',
        textColor: '#991b1b',
        borderColor: '#fca5a5',
        icon: <RemoveCircleOutlineIcon sx={{ fontSize: 12 }} />,
        label: changeType === 'UNASSIGNED' ? 'Unassigned' : 'Deleted'
      };
    case 'UPDATE':
    case 'UPDATED':
    default:
      return {
        bgColor: '#dbeafe',
        textColor: '#1e40af',
        borderColor: '#93c5fd',
        icon: <SwapHorizIcon sx={{ fontSize: 12 }} />,
        label: 'Updated'
      };
  }
};

const getInitials = (name?: string | null) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Compact Change Row Component
const ChangeRow: React.FC<{ entry: ChangeHistoryEntry }> = ({ entry }) => {
  const theme = useTheme();
  const config = getChangeTypeConfig(entry.changeType);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1.5,
        border: '1px solid',
        borderColor: 'divider',
        mb: 1.5,
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.3),
          boxShadow: `0 2px 6px ${alpha(theme.palette.primary.main, 0.06)}`,
        },
      }}
    >
      {/* Row Content */}
      <Box sx={{ p: 1.5 }}>
        {/* Top line: Field name + Change type badge */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flex: 1 }}>
            <Typography 
              variant="body2" 
              fontWeight={600}
              sx={{ 
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {entry.field}
            </Typography>
            <Chip
              icon={config.icon}
              label={config.label}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.65rem',
                fontWeight: 600,
                bgcolor: config.bgColor,
                color: config.textColor,
                border: `1px solid ${config.borderColor}`,
                '& .MuiChip-icon': {
                  color: config.textColor,
                  ml: 0.5,
                },
                '& .MuiChip-label': {
                  px: 0.5,
                },
              }}
            />
          </Stack>
        </Stack>

        {/* Value change: Old → New in a compact format */}
        <Stack 
          direction="row" 
          alignItems="center"
          spacing={1}
          sx={{ 
            mb: 1,
            py: 0.75,
            px: 1,
            bgcolor: alpha(theme.palette.grey[100], 0.5),
            borderRadius: 1,
          }}
        >
          {/* Old Value */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              py: 0.5,
              px: 1,
              bgcolor: alpha(theme.palette.error.main, 0.05),
              borderRadius: 0.75,
              border: '1px dashed',
              borderColor: alpha(theme.palette.error.main, 0.2),
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                color: entry.oldValue ? 'text.secondary' : 'text.disabled',
                wordBreak: 'break-word',
                fontSize: '0.75rem',
                lineHeight: 1.4,
                display: 'block',
              }}
            >
              {renderValue(entry.oldValue)}
            </Typography>
          </Box>

          {/* Arrow */}
          <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />

          {/* New Value */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              py: 0.5,
              px: 1,
              bgcolor: alpha(theme.palette.success.main, 0.05),
              borderRadius: 0.75,
              border: '1px solid',
              borderColor: alpha(theme.palette.success.main, 0.25),
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                color: entry.newValue ? 'text.primary' : 'text.disabled',
                wordBreak: 'break-word',
                fontSize: '0.75rem',
                lineHeight: 1.4,
                fontWeight: entry.newValue ? 500 : 400,
                display: 'block',
              }}
            >
              {renderValue(entry.newValue)}
            </Typography>
          </Box>
        </Stack>

        {/* Bottom line: Timestamp + Changed by */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <ScheduleIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
            <Tooltip title={getFullDateTime(entry.changedAt)} arrow>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', cursor: 'help' }}>
                {formatDateTime(entry.changedAt)}
              </Typography>
            </Tooltip>
          </Stack>
          
          {entry.changedBy && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Tooltip title={entry.changedBy} arrow>
                <Avatar
                  sx={{
                    width: 18,
                    height: 18,
                    fontSize: '0.55rem',
                    fontWeight: 600,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                  }}
                >
                  {getInitials(entry.changedBy)}
                </Avatar>
              </Tooltip>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {entry.changedBy}
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* Change Reason (if present) */}
        {entry.changeReason && (
          <Box
            sx={{
              mt: 1,
              py: 0.5,
              px: 1,
              bgcolor: alpha(theme.palette.info.main, 0.05),
              borderRadius: 0.75,
              borderLeft: '2px solid',
              borderColor: 'info.main',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              <strong>Reason:</strong> {entry.changeReason}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Empty State Component
const EmptyState: React.FC<{ message: string }> = ({ message }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        py: 6,
        px: 3,
        textAlign: 'center',
        bgcolor: alpha(theme.palette.grey[100], 0.5),
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'divider',
      }}
    >
      <HistoryIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
      <Typography variant="body2" color="text.disabled">
        {message}
      </Typography>
    </Box>
  );
};

const ChangeHistoryDrawer: React.FC<ChangeHistoryDrawerProps> = ({
  open,
  title,
  sections,
  loading = false,
  error = null,
  onClose,
}) => {
  const theme = useTheme();

  // Combine all entries from all sections, sorted by date (most recent first)
  const allEntries = useMemo(() => {
    const combined: ChangeHistoryEntry[] = [];
    sections.forEach(section => {
      combined.push(...section.entries);
    });
    // Sort by changedAt descending (most recent first)
    return combined.sort((a, b) => {
      const dateA = a.changedAt ? new Date(a.changedAt).getTime() : 0;
      const dateB = b.changedAt ? new Date(b.changedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [sections]);

  const totalEntries = allEntries.length;

  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          maxWidth: '100vw',
          bgcolor: '#f8fafc',
        }
      }}
    >
      {/* Fixed Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <Stack 
          direction="row" 
          alignItems="center" 
          justifyContent="space-between" 
          sx={{ px: 2.5, py: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1.5,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HistoryIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {totalEntries} {totalEntries === 1 ? 'change' : 'changes'} recorded
              </Typography>
            </Box>
          </Stack>
          <IconButton 
            onClick={onClose} 
            size="small"
            aria-label="close"
            sx={{
              bgcolor: alpha(theme.palette.grey[500], 0.08),
              '&:hover': { bgcolor: alpha(theme.palette.grey[500], 0.15) },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* Error State */}
      {error && (
        <Box sx={{ p: 2 }}>
          <Alert 
            severity="error" 
            sx={{ 
              borderRadius: 1.5,
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Loading State */}
      {loading ? (
        <Box 
          sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            py: 8,
          }}
        >
          <CircularProgress size={32} thickness={4} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontSize: '0.8rem' }}>
            Loading changes...
          </Typography>
        </Box>
      ) : (
        /* Content Area - Single column of all changes */
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
          {allEntries.length === 0 ? (
            <EmptyState message="No changes recorded yet" />
          ) : (
            <div>
              {allEntries.map((entry) => (
                <ChangeRow key={`${entry.id}-${entry.field}-${entry.changedAt}`} entry={entry} />
              ))}
            </div>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default ChangeHistoryDrawer;
