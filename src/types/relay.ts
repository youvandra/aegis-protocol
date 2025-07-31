export interface RelayItem {
  id: string;
  number: string;
  type: 'receive' | 'send';
  amount: string;
  timeCreated: string;
  status: 'Request Initiated' | 'Waiting for Receiver\'s Approval' | 'Waiting for Sender to Execute' | 'Complete' | 'Rejected';
  details?: {
    fromAddress?: string;
    toAddress?: string;
    transactionHash?: string;
    gasUsed?: string;
  };
}