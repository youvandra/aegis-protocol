import React, { useEffect, useState, lazy } from 'react';
import { Wallet, Plus, UserPlus } from 'lucide-react';
const AestheticNavbar = lazy(() => import('../components/AestheticNavbar'));
const StreamTable = lazy(() => import('../components/StreamTable'));
const CreateGroupModal = lazy(() => import('../components/CreateGroupModal'));
const AddMemberModal = lazy(() => import('../components/AddMemberModal'));
const Toast = lazy(() => import('../components/Toast'));
import { Group } from '../types/stream';
import { useWalletTracking } from '../hooks/useWalletTracking';
import { streamService } from '../lib/supabase';
import { Client, TopicCreateTransaction, PrivateKey, AccountId, TopicMessageSubmitTransaction } from "@hashgraph/sdk";
import { parseEther } from 'viem';
import { useSendTransaction } from 'wagmi';
// Heder testnet client setup
let client;
const MY_ACCOUNT_ID = AccountId.fromString(import.meta.env.VITE_HEDERA_ACCOUNT_ID!);
const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(import.meta.env.VITE_HEDERA_PRIVATE_KEY!);
client = Client.forTestnet();
client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);


const StreamPage: React.FC = () => {
  const { isConnected, hederaAccountId } = useWalletTracking();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'released'>('upcoming');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const { sendTransactionAsync } = useSendTransaction();
  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const groupsData = await streamService.getGroups(hederaAccountId || '');
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [hederaAccountId]);

  const upcomingGroups = groups.filter(group => group.status === 'upcoming');
  const releasedGroups = groups.filter(group => group.status === 'released');

  const handleCreateGroup = async (groupData: {
    groupName: string;
    releaseDateTime?: string;
  }) => {
    if (!hederaAccountId) return;
    
    try {
      const tx = await new TopicCreateTransaction()
        .setTopicMemo(JSON.stringify({
          group: groupData.groupName,
          releaseDateTime: groupData.releaseDateTime,
        })
       ).setTransactionMemo(`Create group: ${groupData.groupName} by ${hederaAccountId}`)
        .freezeWith(client)
        .sign(MY_PRIVATE_KEY);

      const submitTx = await tx.execute(client);
      const receipt = await submitTx.getReceipt(client);
      const topicId = receipt.topicId!.toString();
      const txid = submitTx.transactionId!.toString();

      const newGroup = await streamService.createGroup(
        topicId,
        txid,
        groupData.groupName,
        hederaAccountId,
        groupData.releaseDateTime!
      );
      
      
      if (newGroup) {
        await loadGroups();
        setShowCreateGroupModal(false);
        setToastMessage('Group created successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage('Failed to create group. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Failed to create group. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleAddMember = async (memberData: {
    topicId: string;
    groupId: string;
    name: string;
    address: string;
    amount: string;
  }) => {
    // Validate member data before processing
    if (!memberData.groupId || !memberData.name || !memberData.address || !memberData.amount) {
      console.error('Invalid member data:', memberData);
      setToastMessage('Please fill in all required fields.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      const newMember = await streamService.addMemberToGroup(
        memberData.topicId,
        memberData.groupId,
        memberData.name,
        memberData.address,
        Number(memberData.amount)
      );

      const tx = new TopicMessageSubmitTransaction()
        .setTopicId(memberData.topicId)
        .setMessage(JSON.stringify({
          type: "add member",
          name: memberData.name,
          address: memberData.address,
          amount: memberData.amount + " HBAR"
            })
        );

      const submitTx = await tx.execute(client);
      await submitTx.getReceipt(client);
      
      if (newMember) {
        await loadGroups();
        setShowAddMemberModal(false);
        setToastMessage('Member added successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage('Failed to add member. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Failed to add member. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!hederaAccountId) return;
    
    try {
      const success = await streamService.deleteGroup(groupId, hederaAccountId);
      
      if (success) {
        setToastMessage('Group deleted successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage('Failed to delete group. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Failed to delete group. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleScheduleGroup = async (groupId: string) => {
    if (!hederaAccountId) return;
    
    try {
      const getAccountByIdParams = {
          idOrAliasOrEvmAddress: import.meta.env.VITE_HEDERA_ACCOUNT_ID,
          limit: 1,
          order: "desc",
        };

        //Get account by ID/alias/EVM address
        const getAccountByIdResponse = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/accounts/${getAccountByIdParams.idOrAliasOrEvmAddress}?limit=${getAccountByIdParams.limit}&order=${getAccountByIdParams.order}`
        );
        const getAccountByIdResponseJson = await getAccountByIdResponse.json();

      const address = getAccountByIdResponseJson.evm_address;
      // Calculate total_amount from group members
      const group = groups.find(g => g.id === groupId);
      const total_amount = group
        ? group.members?.reduce((sum, member) => sum + Number(member.amount || 0), 0)
        : 0;
      const value = BigInt(total_amount);
      await sendTransactionAsync({ to: address, value: parseEther(value.toString()) });
      const scheduledGroup = await streamService.scheduledGroup(groupId, hederaAccountId);

      if (scheduledGroup) {
        await loadGroups();
        setToastMessage('Group scheduled successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage('Failed to schedule group. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      setToastMessage('Failed to release group. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };


  return (
    <div className="min-h-screen relative flex flex-col bg-[#F8F8F8]">
      <AestheticNavbar 
        leftLinkPath="/relay"
        leftLinkText="Relay"
        roomName="Stream"
        rightLinkPath="/legacy"
        rightLinkText="Legacy"
      />
      <main className="flex-1 px-4 sm:px-8 pt-0">
        <div className="max-w-7xl mx-auto">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl max-w-md">
                <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Transfer Streams
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Automate asset transfers with precise timing and logic.
                  Stream wealth to the right people, exactly when it matters.
                </p>
                <button
                  onClick={() => open()}
                  className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                >
                  Create Stream
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header with Tabs and Action Buttons */}
              <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-white/80 backdrop-blur-sm rounded-lg p-1 w-fit">
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                      activeTab === 'upcoming'
                        ? 'bg-black text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setActiveTab('released')}
                    className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                      activeTab === 'released'
                        ? 'bg-black text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    Released
                  </button>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    onClick={() => setShowCreateGroupModal(true)}
                    className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-2 font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Group</span>
                  </button>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2 font-medium"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Add Member</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="mb-8">
                {loading ? (
                  <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading groups...</p>
                  </div>
                ) : (
                  <StreamTable 
                    data={activeTab === 'upcoming' ? upcomingGroups : releasedGroups} 
                    onDeleteGroup={handleDeleteGroup}
                    onScheduleGroup={handleScheduleGroup}
                    itemsPerPage={10}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </main>
      
      {/* Create Group Modal */}
        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          onSubmit={handleCreateGroup}
        />
        
        {/* Add Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        onSubmit={handleAddMember}
        onCreateGroup={() => {
          setShowAddMemberModal(false);
          setShowCreateGroupModal(true);
        }}
        groups={groups}
      />
      
      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default StreamPage;
