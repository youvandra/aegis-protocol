import React from 'react';
import { useState, useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Wallet, Plus, UserPlus } from 'lucide-react';
import AestheticNavbar from '../components/AestheticNavbar';
import StreamTable from '../components/StreamTable';
import CreateGroupModal from '../components/CreateGroupModal';
import AddMemberModal from '../components/AddMemberModal';
import { Group, Member } from '../types/stream';
import { useWalletTracking } from '../hooks/useWalletTracking';
import { streamService } from '../lib/supabase';

const StreamPage: React.FC = () => {
  const { isConnected, address } = useWalletTracking();
  const { open } = useWeb3Modal();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'released'>('upcoming');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const loadGroups = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const groupsData = await streamService.getGroups(address);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      loadGroups();
    } else {
      setGroups([]);
      setLoading(false);
    }
  }, [address]);

  const upcomingGroups = groups.filter(group => group.status === 'upcoming');
  const releasedGroups = groups.filter(group => group.status === 'released');

  const handleCreateGroup = async (groupData: {
    groupName: string;
    releaseType: 'monthly' | 'one-time';
    releaseDate?: string;
  }) => {
    if (!address) return;
    
    try {
      const newGroup = await streamService.createGroup(
        groupData.groupName,
        groupData.releaseType,
        address,
        groupData.releaseDate
      );
      
      if (newGroup) {
        await loadGroups();
        setShowCreateGroupModal(false);
      } else {
        alert('Failed to create group. Please try again.');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    }
  };

  const handleAddMember = async (memberData: {
    groupId: string;
    name: string;
    walletAddress: string;
    amount: number;
  }) => {
    try {
      const newMember = await streamService.addMemberToGroup(
        memberData.groupId,
        memberData.name,
        memberData.walletAddress,
        Number(memberData.amount)
      );
      
      if (newMember) {
        await loadGroups();
        setShowAddMemberModal(false);
      } else {
        alert('Failed to add member. Please try again.');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member. Please try again.');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-[#D9D9D9]">
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
    </div>
  );
};

export default StreamPage;
