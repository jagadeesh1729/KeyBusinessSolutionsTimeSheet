import { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import type { TaskEntry } from '../types/Holiday';

interface TaskEntryFormProps {
  date: string;
  existingTasks: TaskEntry[];
  onSave: (tasks: TaskEntry[]) => void;
}

const TaskEntryForm = ({ date, existingTasks, onSave }: TaskEntryFormProps) => {
  const [tasks, setTasks] = useState<TaskEntry[]>(existingTasks);
  const [taskName, setTaskName] = useState('');
  const [hours, setHours] = useState('');

  const handleAddTask = () => {
    const hoursNum = parseFloat(hours);
    if (taskName && !isNaN(hoursNum) && hoursNum > 0) {
      const newTasks = [...tasks, { name: taskName, hours: hoursNum }];
      setTasks(newTasks);
      onSave(newTasks); // Immediately save to parent state
      setTaskName('');
      setHours('');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Log Time for {new Date(date).toLocaleDateString()}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TextField
          label="Task Description"
          variant="outlined"
          size="small"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <TextField
          label="Hours"
          type="number"
          variant="outlined"
          size="small"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          sx={{ width: '100px' }}
        />
        <IconButton color="primary" onClick={handleAddTask}>
          <AddCircleOutlineIcon />
        </IconButton>
      </Box>

      {tasks.length > 0 && (
        <List dense>
          {tasks.map((task, index) => (
            <ListItem key={index} disablePadding>
              <ListItemText
                primary={task.name}
                secondary={`${task.hours} hour(s)`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default TaskEntryForm;