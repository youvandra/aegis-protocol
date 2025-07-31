import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User interface for the database
export interface User {
  id: string;
  wallet_address: string;
  chain_id?: number;
  first_connected_at: string;
  last_connected_at: string;
  connection_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Wallet account service for managing user data
export const walletAccountService = {
  async upsertWalletAccount(walletAddress: string, chainId?: number): Promise<User | null> {
    try {
      // First, try to get existing user
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error fetching user:', fetchError);
        return null;
      }

      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            last_connected_at: new Date().toISOString(),
            connection_count: existingUser.connection_count + 1,
            chain_id: chainId,
            is_active: true,
          })
          .eq('wallet_address', walletAddress.toLowerCase())
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user:', updateError);
          return null;
        }

        console.log('Updated existing user:', updatedUser);
        return updatedUser;
      } else {
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            wallet_address: walletAddress.toLowerCase(),
            chain_id: chainId,
            first_connected_at: new Date().toISOString(),
            last_connected_at: new Date().toISOString(),
            connection_count: 1,
            is_active: true,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user:', insertError);
          return null;
        }

        console.log('Created new user:', newUser);
        return newUser;
      }
    } catch (error) {
      console.error('Error in upsertWalletAccount:', error);
      return null;
    }
  },

  async getWalletAccount(walletAddress: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // User not found
          return null;
        }
        console.error('Error fetching wallet account:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getWalletAccount:', error);
      return null;
    }
  },

  async getAllWalletAccounts(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('last_connected_at', { ascending: false });

      if (error) {
        console.error('Error fetching all wallet accounts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllWalletAccounts:', error);
      return [];
    }
  },

  async setUserInactive(walletAddress: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('wallet_address', walletAddress.toLowerCase());

      if (error) {
        console.error('Error setting user inactive:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in setUserInactive:', error);
      return false;
    }
  }
};