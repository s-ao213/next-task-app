export enum SubmissionMethod {
    GOOGLE_CLASSROOM = 'Google Classroom',
    TEAMS = 'Teams',
    MOODLE = 'Moodle',
    PAPER = '紙（対面）',
    OTHER = 'その他'
  }
  
  export interface Task {
    id: string;
    subject: string;
    title: string;
    description?: string;
    deadline: string;
    submissionMethod: SubmissionMethod;
    assignedTo: string[]; // User IDs
    isImportant: boolean;
    createdBy: string;
    createdAt: string;
  }
  
  export interface UserTaskStatus {
    userId: string;
    taskId: string;
    isCompleted: boolean;
  }