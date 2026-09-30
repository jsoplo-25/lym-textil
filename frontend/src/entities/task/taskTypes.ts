export interface Task {
  id: string;
  title: string;
  category: string;
  timeRange: string;
  completed: boolean;
  assignees?: { id: string; name: string; avatarUrl: string }[];
}

export interface ActivitySchedule {
  id: string;
  title: string;
  platform: string;
  startTime: string; // e.g. "07:30"
  endTime: string;   // e.g. "09:30"
  color: 'lime' | 'slate' | 'purple' | 'blue';
  members: { id: string; name: string; avatarUrl: string }[];
  extraMembersCount?: number;
}

export interface TaskState {
  tasks: Task[];
  activities: ActivitySchedule[];
  metrics: {
    tasksDone: number;
    hoursSavedPercentage: number;
  };
}
