export interface Test {
  id: string;
  subject: string;
  test_date: string;
  scope: string;
  related_task_id?: string;
  teacher?: string;
  is_important: boolean;
  created_by: string;
  created_at: string;
  updated_at?: string;   // 追加
  updated_by?: string;   // 追加
}

export interface TestNotification {
  user_id: string;           // userId → user_id
  test_id: string;           // testId → test_id
  is_notification_enabled: boolean; // isNotificationEnabled → is_notification_enabled
}