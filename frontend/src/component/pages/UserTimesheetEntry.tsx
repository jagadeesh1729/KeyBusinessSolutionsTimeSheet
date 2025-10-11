import React, { useMemo } from 'react';
import {
  Container,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useAssignedProjects, useCurrentTimesheet, useTimesheetById } from '../hooks/useTimesheet';
import TimesheetForm from './TimesheetForm';

const TimesheetEntry: React.FC = () => {
  const { id } = useParams(); // Get timesheet ID from URL if editing
  const isEditMode = Boolean(id);

  const { data: projects, loading: projectsLoading, error: projectsError } = useAssignedProjects();
  const currentProject = projects && projects.length > 0 ? projects[0] : null;

  const { data: currentTimesheet, loading: currentTimesheetLoading, error: currentTimesheetError, refetch: refetchCurrent } = useCurrentTimesheet(
    !isEditMode ? currentProject?.id : undefined
  );
  const { data: editTimesheet, loading: editTimesheetLoading, error: editTimesheetError, refetch: refetchEdit } = useTimesheetById(
    isEditMode ? parseInt(id!) : undefined
  );

  const timesheet = isEditMode ? editTimesheet : currentTimesheet;
  const timesheetLoading = isEditMode ? editTimesheetLoading : currentTimesheetLoading;
  const timesheetError = isEditMode ? editTimesheetError : currentTimesheetError;

  const projectForForm = useMemo(() => {
    if (isEditMode) {
      return editTimesheet?.project || null;
    }
    return currentProject;
  }, [isEditMode, editTimesheet, currentProject]);

  if (projectsLoading || timesheetLoading) {
    return (
      <Container maxWidth="xl" className="py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <CircularProgress />
            <Typography variant="body1" className="mt-4">
              Loading timesheet...
            </Typography>
          </div>
        </div>
      </Container>
    );
  }

  if (projectsError || timesheetError) {
    return (
      <Container maxWidth="xl" className="py-8">
        <Alert severity="error">{projectsError || timesheetError}</Alert>
      </Container>
    );
  }

  return (
    <TimesheetForm
      timesheet={timesheet}
      project={projectForForm}
      isEditMode={isEditMode}
      onDataRefetch={isEditMode ? refetchEdit : () => refetchCurrent(currentProject!.id)}
    />
  );
};

export default TimesheetEntry;
