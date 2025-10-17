export default interface Project {
  id: number;
  name: string;
  status: 'Active' | 'Inactive';
  start_date?: string;
  end_date?: string;
  auto_approve: boolean;
  period_type: 'weekly' | 'bi-monthly' | 'monthly';
  // Newly added/used fields
  code?: string;
  client_address?: string;
  project_description?: string;
  created_at?: string;
  updated_at?: string;
}
