import React from 'react';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Wallet, Plus, UserPlus } from 'lucide-react';
import AestheticNavbar from '../components/AestheticNavbar';
import StreamTable from '../components/StreamTable';
import CreateGroupModal from '../components/CreateGroupModal';
import AddMemberModal from '../components/AddMemberModal';
import { Group, Member } from '../types/stream';

const StreamPage: React.FC = () => {
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'released'>('upcoming');
  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      number: 'GRP-001',
      groupName: 'Family Trust Fund',
      releaseDate: '2025-12-25',
      releaseType: 'one-time',
      totalMembers: 2,
      totalAmount: '5,000.00 HBAR',
      status: 'upcoming',
      members: [
        {
          id: '1',
          name: 'Alice Johnson',
          address: '0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c',
          amount: '3,000.00 HBAR'
        },
        {
          id: '2',
          name: 'Bob Smith',
          address: '0x8ba1f109551bD432803012645Hac136c22C177ec',
          amount: '2,000.00 HBAR'
        }
      ]
    },
    {
      id: '2',
      number: 'GRP-002',
      groupName: 'Monthly Allowance',
      releaseDate: '',
      releaseType: 'monthly',
      totalMembers: 1,
      totalAmount: '500.00 HBAR',
      status: 'upcoming',
      members: [
        {
          id: '3',
          name: 'Charlie Brown',
          address: '0x9876543210fedcba1234567890abcdef12345678',
          amount: '500.00 HBAR'
        }
      ]
    },
    {
      id: '3',
      number: 'GRP-003',
      groupName: 'Emergency Fund',
      releaseDate: '2024-06-15',
      releaseType: 'one-time',
      totalMembers: 3,
      totalAmount: '10,000.00 HBAR',
      status: 'released',
      members: [
        {
          id: '4',
          name: 'David Wilson',
          address: '0x1357924680acebd1357924680acebd1357924680',
          amount: '4,000.00 HBAR'
        },
        {
          id: '5',
          name: 'Eva Martinez',
          address: '0x2468ace13579bdf2468ace13579bdf2468ace135',
          amount: '3,500.00 HBAR'
        },
        {
          id: '6',
          name: 'Frank Davis',
          address: '0x369cf258ad147bf369cf258ad147bf369cf258ad1',
          amount: '2,500.00 HBAR'
        }
      ]
    }
  ]);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const upcomingGroups = groups.filter(group => group.status === 'upcoming');
  const releasedGroups = groups.filter(group => group.status === 'released');

  const handleCreateGroup = (groupData: {
    groupName: string;
    releaseType: 'monthly' | 'one-time';
    releaseDate?: string;
  }) => {
    const newGroup: Group = {
      id: Date.now().toString(),
      number: `GRP-${String(groups.length + 1).padStart(3, '0')}`,
      groupName: groupData.groupName,
      releaseDate: groupData.releaseDate || '',
      releaseType: groupData.releaseType,
      totalMembers: 0,
      totalAmount: '0.00 HBAR',
      status: 'upcoming',
      members: []
    };
    
    setGroups(prev => [...prev, newGroup]);
    setShowCreateGroupModal(false);
  };

  const handleAddMember = (memberData: {
    groupId: string;
    name: string;
    address: string;
    amount: string;
  }) => {
    const newMember: Member = {
      id: Date.now().toString(),
      name: memberData.name,
      address: memberData.address,
      amount: `${memberData.amount} HBAR`
    };

    setGroups(prev => prev.map(group => {
      if (group.id === memberData.groupId) {
        const updatedMembers = [...group.members, newMember];
        const totalAmount = updatedMembers.reduce((sum, member) => {
          const amount = parseFloat(member.amount.replace(' HBAR', ''));
          return sum + amount;
        }, 0);
        
        return {
          ...group,
          members: updatedMembers,
          totalMembers: updatedMembers.length,
          totalAmount: `${totalAmount.toFixed(2)} HBAR`
        };
      }
      return group;
    }));
    
    setShowAddMemberModal(false);
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
      <main className="flex-1 px-8 pt-0">
        <div className="max-w-7xl mx-auto">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
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
              <div className="mb-8 flex justify-between items-center">
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
                <div className="flex space-x-3">
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
                <StreamTable 
                  data={activeTab === 'upcoming' ? upcomingGroups : releasedGroups} 
                />
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
