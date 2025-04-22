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
  submission_method: SubmissionMethod;  // submissionMethod → submission_method
  assigned_to: string[];                // assignedTo → assigned_to
  is_important: boolean;                // is_Important → is_important (大文字の I も修正)
  created_by: string;                   // createdBy → created_by
  created_at: string;                   // createdAt → created_at
}

export interface UserTaskStatus {
  user_id: string;
  task_id: string;
  is_completed: boolean;
}