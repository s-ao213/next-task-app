export interface Test {
    id: string;
    subject: string;
    date: string;
    scope: string;
    relatedTaskId?: string;
    teacher?: string;
    isImportant: boolean;
    createdBy: string;
    createdAt: string;
  }
  
  export interface TestNotification {
    userId: string;
    testId: string;
    isNotificationEnabled: boolean;
  }