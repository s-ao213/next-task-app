export interface Event {
  id?: string;
  title: string;
  venue: string;
  duration?: string;
  date_time: string;
  description?: string;
  items?: string;
  is_important: boolean;
  created_by: string;
  created_at?: string;
  is_for_all: boolean;
  assigned_to: string[];
}