export default interface Project {
  id: number;
  name: string;
  status: 'Active' | 'Inactive';
  start_date?: string;
  end_date?: string;
  auto_approve: boolean;
  period_type: 'weekly' | 'bi-monthly' | 'monthly';
}

