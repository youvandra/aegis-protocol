export interface RelayItem {
  id: string;
  relay_number: string;
  sender_address: string;
  receiver_address: string;
  amount: number;
  status: 'Request Initiated' | 'Waiting for Receiver\'s Approval' | 'Waiting for Sender to Execute' | 'Complete' | 'Rejected' | 'Expired';
  transaction_hash?: string;
  gas_used?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}