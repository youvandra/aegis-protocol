import { createClient } from '@supabase/supabase-js';
import { Group, Member } from '../types/stream';
import { Beneficiary } from '../types/beneficiary';
import { LegacyMoment } from '../types/legacyMoment';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Set up auth context for wallet-based authentication
export const setWalletAuthContext = (walletAddress: string) => {
  // Set the wallet address in the auth context for RLS policies
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      // Create a custom JWT claim for wallet address
      const customClaims = {
        wallet_address: walletAddress.toLowerCase()
      };
      
      // Set the custom claims in the request context
      supabase.rest.headers = {
        ...supabase.rest.headers,
        'X-Wallet-Address': walletAddress.toLowerCase()
      };
    }
  });
};

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
}

// Stream service for managing groups and members
export const streamService = {
  async createGroup(
    groupName: string,
    releaseType: 'monthly' | 'one-time',
    walletAddress: string,
    releaseDate?: string
  ): Promise<Group | null> {
    try {
      // Set wallet address in headers for RLS
      const headers = {
        'X-Wallet-Address': walletAddress.toLowerCase()
      };
      
      const { data, error } = await supabase
        .from('groups')
        .insert({
          group_name: groupName,
          release_type: releaseType,
          release_date: releaseDate || null,
          wallet_address: walletAddress.toLowerCase(),
          total_members: 0,
          total_amount: 0,
          status: 'upcoming'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating group:', error);
        return null;
      }

      return {
        ...data,
        number: data.group_number,
        groupName: data.group_name,
        releaseDate: data.release_date,
        releaseType: data.release_type,
        totalMembers: data.total_members,
        totalAmount: data.total_amount,
        members: []
      };
    } catch (error) {
      console.error('Error in createGroup:', error);
      return null;
    }
  },

  async getGroups(walletAddress: string): Promise<Group[]> {
    try {
      console.log('Fetching groups for wallet:', walletAddress);
      
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          *,
          members (*)
        `)
        .order('created_at', { ascending: false });

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        return [];
      }

      if (!groupsData || groupsData.length === 0) {
        return [];
      }

      console.log('Raw groups data:', groupsData);
      
      // Transform the data to match the Group interface
      const transformedGroups: Group[] = groupsData.map(group => ({
        id: group.id,
        number: group.group_number,
        group_number: group.group_number,
        group_name: group.group_name,
        release_date: group.release_date,
        release_type: group.release_type,
        total_members: group.total_members,
        total_amount: group.total_amount,
        wallet_address: group.wallet_address,
        status: group.status,
        created_at: group.created_at,
        updated_at: group.updated_at,
        // Legacy interface compatibility
        groupName: group.group_name,
        releaseDate: group.release_date,
        releaseType: group.release_type,
        totalMembers: group.total_members,
        totalAmount: group.total_amount,
        members: Array.isArray(group.members) ? group.members : []
      }));

      console.log('Transformed groups:', transformedGroups);
      return transformedGroups;
    } catch (error) {
      console.error('Error in getGroups:', error);
      return [];
    }
  },

  async addMemberToGroup(
    groupId: string,
    name: string,
    memberWalletAddress: string,
    amount: number
  ): Promise<Member | null> {
    try {
      // Validate inputs
      if (!groupId || !name || !memberWalletAddress || !amount) {
        console.error('Missing required parameters:', { groupId, name, memberWalletAddress, amount });
        return null;
      }

      console.log('Adding member to group:', { groupId, name, memberWalletAddress, amount });
      
      const { data, error } = await supabase
        .from('members')
        .insert({
          group_id: groupId,
          name: name,
          wallet_address: memberWalletAddress.toLowerCase(),
          amount: amount
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding member:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        return null;
      }

      console.log('Member added successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in addMemberToGroup:', error);
      return null;
    }
  }
};

// Legacy plan interface for the database
export interface LegacyPlan {
  id: string;
  wallet_address: string;
  moment_type: 'specificDate' | 'ifImGone';
  moment_value: string;
  moment_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Legacy service for managing legacy plans and beneficiaries
export const legacyService = {
  async createOrUpdateLegacyPlan(
    walletAddress: string,
    momentConfig: LegacyMoment
  ): Promise<LegacyPlan | null> {
    try {
      console.log('Creating/updating legacy plan:', { walletAddress, momentConfig });
      
      // First, check if a legacy plan already exists for this wallet
      const { data: existingPlan, error: fetchError } = await supabase
        .from('legacy_plans')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('is_active', true)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing legacy plan:', fetchError);
        return null;
      }

      if (existingPlan) {
        // Update existing plan
        const { data, error } = await supabase
          .from('legacy_plans')
          .update({
            moment_type: momentConfig.type,
            moment_value: momentConfig.value,
            moment_label: momentConfig.label,
          })
          .eq('id', existingPlan.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating legacy plan:', error);
          return null;
        }

        console.log('Updated legacy plan:', data);
        return data;
      } else {
        // Create new plan
        const { data, error } = await supabase
          .from('legacy_plans')
          .insert({
            wallet_address: walletAddress.toLowerCase(),
            moment_type: momentConfig.type,
            moment_value: momentConfig.value,
            moment_label: momentConfig.label,
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating legacy plan:', error);
          return null;
        }

        console.log('Created new legacy plan:', data);
        return data;
      }
    } catch (error) {
      console.error('Error in createOrUpdateLegacyPlan:', error);
      return null;
    }
  },

  async getLegacyPlan(walletAddress: string): Promise<LegacyPlan | null> {
    try {
      const { data, error } = await supabase
        .from('legacy_plans')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No legacy plan found
          return null;
        }
        console.error('Error fetching legacy plan:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getLegacyPlan:', error);
      return null;
    }
  },

  async addBeneficiary(
    legacyPlanId: string,
    beneficiaryData: Omit<Beneficiary, 'id'>
  ): Promise<Beneficiary | null> {
    try {
      console.log('Adding beneficiary:', { legacyPlanId, beneficiaryData });
      
      const { data, error } = await supabase
        .from('beneficiaries')
        .insert({
          legacy_plan_id: legacyPlanId,
          name: beneficiaryData.name,
          wallet_address: beneficiaryData.address.toLowerCase(),
          percentage: beneficiaryData.percentage,
          notes: beneficiaryData.notes || '',
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding beneficiary:', error);
        return null;
      }

      // Transform database format to component format
      const transformedBeneficiary: Beneficiary = {
        id: data.id,
        name: data.name,
        address: data.wallet_address,
        percentage: Number(data.percentage),
        notes: data.notes || '',
      };

      console.log('Added beneficiary:', transformedBeneficiary);
      return transformedBeneficiary;
    } catch (error) {
      console.error('Error in addBeneficiary:', error);
      return null;
    }
  },

  async getBeneficiaries(legacyPlanId: string): Promise<Beneficiary[]> {
    try {
      const { data, error } = await supabase
        .from('beneficiaries')
        .select('*')
        .eq('legacy_plan_id', legacyPlanId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching beneficiaries:', error);
        return [];
      }

      // Transform database format to component format
      const transformedBeneficiaries: Beneficiary[] = (data || []).map(beneficiary => ({
        id: beneficiary.id,
        name: beneficiary.name,
        address: beneficiary.wallet_address,
        percentage: Number(beneficiary.percentage),
        notes: beneficiary.notes || '',
      }));

      return transformedBeneficiaries;
    } catch (error) {
      console.error('Error in getBeneficiaries:', error);
      return [];
    }
  },

  async deleteBeneficiary(beneficiaryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('beneficiaries')
        .delete()
        .eq('id', beneficiaryId);

      if (error) {
        console.error('Error deleting beneficiary:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteBeneficiary:', error);
      return false;
    }
  }
};