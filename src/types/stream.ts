export interface Member {
  id: string;
  group_id: string;
  name: string;
  wallet_address: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  number: string;
  group_number: string;
  group_name: string;
  release_date: string | null;
  release_type: 'monthly' | 'one-time';
  total_members: number;
  total_amount: number;
  wallet_address: string;
  members: Member[];
  status: 'upcoming' | 'released';
  created_at: string;
  updated_at: string;
}