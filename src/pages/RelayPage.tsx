import React from 'react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import AestheticNavbar from '../components/AestheticNavbar';
import RelayTable from '../components/RelayTable';
import { RelayItem } from '../types/relay';

const RelayPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');

  // Sample data for queue
  const queueData: RelayItem[] = [
    {
      id: '1',
      number: 'RLY-001',
      type: 'send',
      amount: '1,250.50 HBAR',
      timeCreated: '2025-01-27 14:30:25',
      status: '1 out of 3',
      details: {
        toAddress: '0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c',
        transactionHash: '0x1234567890abcdef...',
        gasUsed: '21,000'
      }
    },
    {
      id: '2',
      number: 'RLY-002',
      type: 'receive',
      amount: '500.00 HBAR',
      timeCreated: '2025-01-27 13:15:10',
      status: '2 out of 3',
      details: {
        fromAddress: '0x8ba1f109551bD432803012645Hac136c22C177ec',
        transactionHash: '0xabcdef1234567890...',
        gasUsed: '21,000'
      }
    }
  ];

  // Sample data for history
  const historyData: RelayItem[] = [
    {
      id: '3',
      number: 'RLY-003',
      type: 'send',
      amount: '2,000.00 HBAR',
      timeCreated: '2025-01-26 16:45:30',
      status: '3 out of 3',
      details: {
        toAddress: '0x9876543210fedcba...',
        transactionHash: '0xfedcba0987654321...',
        gasUsed: '21,000'
      }
    },
    {
      id: '4',
      number: 'RLY-004',
      type: 'receive',
      amount: '750.25 HBAR',
      timeCreated: '2025-01-25 09:20:15',
      status: '3 out of 3',
      details: {
        fromAddress: '0x1357924680acebd...',
        transactionHash: '0x2468ace13579bdf...',
        gasUsed: '21,000'
      }
    }
  ];

  const handleCreateRelay = () => {
    // TODO: Implement create relay functionality
    console.log('Create relay clicked');
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-[#D9D9D9]">
      <AestheticNavbar 
        leftLinkPath="/legacy"
        leftLinkText="Legacy"
        roomName="Relay"
        rightLinkPath="/data"
        rightLinkText="Data"
      />
      <main className="flex-1 px-8 pt-0 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Create Button */}
          <div className="mb-8 flex justify-between items-start">
            <h1 className="text-7xl md:text-9xl font-light text-black tracking-tight leading-none">
              <span className="font-normal">relay</span>
            </h1>
            <button
              onClick={handleCreateRelay}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Create Relay</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-white/80 backdrop-blur-sm rounded-lg p-1 w-fit">
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === 'queue'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                Queue
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === 'history'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                History
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="mb-8">
            <RelayTable 
              data={activeTab === 'queue' ? queueData : historyData} 
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default RelayPage;
