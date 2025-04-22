export interface Event {
  id: string;
  title: string;
  venue: string;
  duration?: string;
  date_time: string;      // dateTime → date_time に修正
  assigned_to: string[];  
  description?: string;
  items?: string;
  is_important: boolean;
  created_by: string;
  created_at: string;
}