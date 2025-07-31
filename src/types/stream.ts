export interface Member {
  id: string;
  name: string;
  address: string;
  amount: string;
}

export interface Group {
  id: string;
  number: string;
  groupName: string;
  releaseDate: string;
  releaseType: 'monthly' | 'one-time';
  totalMembers: number;
  totalAmount: string;
  members: Member[];
  status: 'upcoming' | 'released';
}