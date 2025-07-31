export interface RelayItem {
  id: string;
  number: string;
  type: 'receive' | 'send';
  amount: string;
  timeCreated: string;
  status: '1 out of 3' | '2 out of 3' | '3 out of 3';
  details?: {
    fromAddress?: string;
    toAddress?: string;
    transactionHash?: string;
    gasUsed?: string;
  };
}