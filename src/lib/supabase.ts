import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface WalletAccount {
  id: string;
  wallet_address: string;
  first_connected_at: string;
  last_connected_at: string;
  connection_count: number;
  created_at: string;
  updated_at: string;
}

export const walletAccountService = {
  async upsertWalletAccount(walletAddress: string): Promise<WalletAccount | null> {
    try {
      // First, try to get existing account
      const { data: existingAccount } = await supabase
        .from('wallet_accounts')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (existingAccount) {
        // Update existing account
        const { data, error } = await supabase
          .from('wallet_accounts')
          .update({
            last_connected_at: new Date().toISOString(),
            connection_count: existingAccount.connection_count + 1
          })
          .eq('wallet_address', walletAddress)
          .select()
          .single();

        if (error) {
          console.error('Error updating wallet account:', error);
          return null;
        }
        return data;
      } else {
        // Create new account
        const { data, error } = await supabase
          .from('wallet_accounts')
          .insert({
            wallet_address: walletAddress,
            first_connected_at: new Date().toISOString(),
            last_connected_at: new Date().toISOString(),
            connection_count: 1
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating wallet account:', error);
          return null;
        }
        return data;
      }
    } catch (error) {
      console.error('Error in upsertWalletAccount:', error);
      return null;
    }
  },

  async getWalletAccount(walletAddress: string): Promise<WalletAccount | null> {
    try {
      const { data, error } = await supabase
        .from('wallet_accounts')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        console.error('Error fetching wallet account:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error in getWalletAccount:', error);
      return null;
    }
  },

  async getAllWalletAccounts(): Promise<WalletAccount[]> {
    try {
      const { data, error } = await supabase
        .from('wallet_accounts')
        .select('*')
        .order('last_connected_at', { ascending: false });

      if (error) {
        console.error('Error fetching wallet accounts:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error in getAllWalletAccounts:', error);
      return [];
    }
  }
};