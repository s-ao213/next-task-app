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
  submission_method: SubmissionMethod;
  assigned_to: string[];                
  is_important: boolean;                
  created_by: string;                   
  created_at: string;
  assigned_user_id?: string | null;    // このプロパティを追加
}

export interface UserTaskStatus {
  user_id: string;
  task_id: string;
  is_completed: boolean;
}