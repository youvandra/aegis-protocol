// Supabase integration removed
export const walletAccountService = {
  async upsertWalletAccount(walletAddress: string) {
    console.log('Wallet connected:', walletAddress);
    return null;
  },

  async getWalletAccount(walletAddress: string) {
    return null;
  },

  async getAllWalletAccounts() {
    return [];
  }
};