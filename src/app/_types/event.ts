export interface Event {
    id: string;
    title: string;
    venue: string;
    duration?: string;
    dateTime: string;
    assignedTo: string[]; // User IDs
    description?: string;
    items?: string;
    isImportant: boolean;
    createdBy: string;
    createdAt: string;
  }