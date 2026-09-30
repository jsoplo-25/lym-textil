import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { TaskState, Task } from './taskTypes';

const initialState: TaskState = {
  tasks: [
    {
      id: 'tsk-1',
      title: 'Client Review & Feedback',
      category: 'Landing page redesign',
      timeRange: 'Today 10:00 PM - 11:45 PM',
      completed: true,
      assignees: [
        { id: 'u1', name: 'Sarah', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
        { id: 'u2', name: 'Alex', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
      ],
    },
    {
      id: 'tsk-2',
      title: 'Textile Production Audit',
      category: 'Control de Calidad L&M',
      timeRange: 'Tomorrow 09:00 AM - 11:00 AM',
      completed: false,
      assignees: [
        { id: 'u3', name: 'Mike', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
      ],
    },
    {
      id: 'tsk-3',
      title: 'Supplier Inventory Sync',
      category: 'Procesos Textiles',
      timeRange: 'Thursday 02:00 PM - 04:30 PM',
      completed: false,
      assignees: [],
    }
  ],
  activities: [
    {
      id: 'act-1',
      title: 'Project onboarding',
      platform: 'Google Meeting',
      startTime: '07:30',
      endTime: '09:45',
      color: 'lime',
      members: [
        { id: 'm1', name: 'John', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' }
      ],
      extraMembersCount: 2,
    },
    {
      id: 'act-2',
      title: 'Design research',
      platform: 'Figma file',
      startTime: '09:30',
      endTime: '11:45',
      color: 'slate',
      members: [
        { id: 'm2', name: 'Anna', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80' }
      ],
      extraMembersCount: 5,
    },
    {
      id: 'act-3',
      title: 'Coffee break',
      platform: 'Co&Co Café',
      startTime: '12:00',
      endTime: '01:30',
      color: 'purple',
      members: [],
    }
  ],
  metrics: {
    tasksDone: 2543,
    hoursSavedPercentage: 82,
  },
};

export const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    toggleTask: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.completed = !task.completed;
      }
    },
    addTask: (state, action: PayloadAction<Omit<Task, 'id'>>) => {
      const newTask: Task = {
        ...action.payload,
        id: `tsk-${Date.now()}`,
      };
      state.tasks.unshift(newTask);
      state.metrics.tasksDone += 1;
    },
  },
});

export const { toggleTask, addTask } = taskSlice.actions;
export default taskSlice.reducer;
