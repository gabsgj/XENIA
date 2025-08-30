
export interface Topic {
  topicName: string;
  subTopics: string[];
  mastery?: number; // 0-100
}

export interface Syllabus {
  courseName: string;
  topics: Topic[];
}

export interface StudyTask {
  id: string;
  day: number;
  task: string;
  topic: string;
  type: 'review' | 'practice' | 'read';
  isCompleted: boolean;
  estimatedTime: number; // in minutes
}

export interface StudyPlan {
  startDate: string; // ISO string
  duration: number; // in days
  tasks: StudyTask[];
}

export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  tasksCompleted: number;
  achievements: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string; image?: string }[];
  timestamp: number;
}
