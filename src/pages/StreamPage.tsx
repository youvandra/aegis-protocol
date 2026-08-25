import React, { useCallback, useEffect, useState, lazy } from 'react';
import { Wallet, Plus, UserPlus } from 'lucide-react';
const AestheticNavbar = lazy(() => import('../components/AestheticNavbar'));
const StreamTable = lazy(() => import('../components/StreamTable'));
const CreateGroupModal = lazy(() => import('../components/CreateGroupModal'));
const AddMemberModal = lazy(() => import('../components/AddMemberModal'));
const Toast = lazy(() => import('../components/Toast'));
import { Group } from '../types/stream';
import { useWalletTracking } from '../hooks/useWalletTracking';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { streamService, hederaApi } from '../lib/api';
import { useSendTransaction } from 'wagmi';
import { sumHbarToWei, treasuryAccountId } from '../lib/hedera';
import { errorMessage } from '../utils/errors';


const StreamPage: React.FC = () => {
  const { isConnected, hederaAccountId } = useWalletTracking();
  const { open } = useWeb3Modal();
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

  const loadGroups = useCallback(async () => {
    if (!hederaAccountId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const groupsData = await streamService.getGroups();
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [hederaAccountId]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const upcomingGroups = groups.filter(group => group.status === 'upcoming');
  const releasedGroups = groups.filter(group => group.status === 'released');

  const handleCreateGroup = async (groupData: {
    groupName: string;
    releaseDateTime?: string;
  }) => {
    if (!hederaAccountId) return;
    
    if (!groupData.releaseDateTime) {
      setToastMessage('A release date and time is required.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      const { topicId, transactionId } = await hederaApi.createTopic(
        JSON.stringify({
          group: groupData.groupName,
          releaseDateTime: groupData.releaseDateTime,
        }),
        `Create group: ${groupData.groupName} by ${hederaAccountId}`
      );

      const newGroup = await streamService.createGroup({
        groupName: groupData.groupName,
        releaseDateTime: groupData.releaseDateTime,
        topicId,
        txid: transactionId,
      });

      await loadGroups();
      setShowCreateGroupModal(false);
      setToastMessage(`Group "${newGroup.group_name}" created successfully!`);
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage(errorMessage(error, 'Failed to create group. Please try again.'));
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

    const amount = Number(memberData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setToastMessage('Amount must be a positive number.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      const newMember = await streamService.addMemberToGroup(memberData.groupId, {
        name: memberData.name,
        address: memberData.address,
        amount,
      });

      await hederaApi.submitMessage(
        memberData.topicId,
        JSON.stringify({
          type: 'add member',
          name: memberData.name,
          address: memberData.address,
          amount: `${memberData.amount} HBAR`,
        })
      );

      await loadGroups();
      setShowAddMemberModal(false);
      setToastMessage(`${newMember.name} added successfully!`);
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage(errorMessage(error, 'Failed to add member. Please try again.'));
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!hederaAccountId) return;
    
    try {
      await streamService.deleteGroup(groupId);

      await loadGroups();
      setToastMessage('Group deleted successfully!');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage(errorMessage(error, 'Failed to delete group. Please try again.'));
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleScheduleGroup = async (groupId: string) => {
    if (!hederaAccountId) return;
    
    const group = groups.find((candidate) => candidate.id === groupId);

    if (!group?.members?.length) {
      setToastMessage('Add at least one member before scheduling.');
      setToastType('error');
      setShowToast(true);
      return;
    }

    try {
      // Sum member allocations exactly, in weibar. Going through BigInt() on a
      // float total used to throw on any fractional amount.
      const value = sumHbarToWei(group.members.map((member) => member.amount));

      if (value <= 0n) {
        throw new Error('Total allocation must be greater than zero.');
      }

      const treasuryAddress = await hederaApi.resolveEvmAddress(treasuryAccountId);
      await sendTransactionAsync({ to: treasuryAddress, value });

      await streamService.scheduleGroup(groupId);

      await loadGroups();
      setToastMessage('Group scheduled successfully!');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      setToastMessage(errorMessage(error, 'Failed to schedule group. Please try again.'));
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
