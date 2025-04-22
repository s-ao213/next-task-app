export interface Test {
  id: string;
  subject: string;
  test_date: string;       // date → test_date に変更
  scope: string;
  related_task_id?: string;
  teacher?: string;
  is_important: boolean;
  created_by: string;
  created_at: string;
}

export interface TestNotification {
  user_id: string;           // userId → user_id
  test_id: string;           // testId → test_id
  is_notification_enabled: boolean; // isNotificationEnabled → is_notification_enabled
}