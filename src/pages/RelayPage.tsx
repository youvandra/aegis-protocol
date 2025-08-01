import React from 'react';
import { useState, useEffect } from 'react';
import { Plus, Send } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import AestheticNavbar from '../components/AestheticNavbar';
import RelayTable from '../components/RelayTable';
import CreateRelayModal from '../components/CreateRelayModal';
import Toast from '../components/Toast';
import { RelayItem } from '../types/relay';
import { useWalletTracking } from '../hooks/useWalletTracking';
import { relayService } from '../lib/supabase';

const RelayPage: React.FC = () => {
  const { isConnected, address } = useWalletTracking();
  const { open } = useWeb3Modal();
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [showCreateRelayModal, setShowCreateRelayModal] = useState(false);
  const [relays, setRelays] = useState<RelayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Load relays when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadRelays();
    } else {
      setRelays([]);
    }
  }, [isConnected, address]);

  const loadRelays = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      console.log('Loading relays for wallet:', address);
      const relaysData = await relayService.getRelays(address);
      console.log('Loaded relays:', relaysData);
      setRelays(relaysData);
    } catch (error) {
      console.error('Error loading relays:', error);
      setRelays([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter relays by status for queue vs history
  const queueRelays = relays.filter(relay => 
    relay.status !== 'Complete' && relay.status !== 'Rejected'
  );
  const historyRelays = relays.filter(relay => 
    relay.status === 'Complete' || relay.status === 'Rejected'
  );
  const handleCreateRelay = () => {
    setShowCreateRelayModal(true);
  };

  const handleCloseCreateRelayModal = () => {
    setShowCreateRelayModal(false);
  };

  const handleCreateRelaySubmit = async (receiverAddress: string, amount: string) => {
    if (!address) return;
    
    try {
      console.log('Creating relay:', { receiverAddress, amount });
      const newRelay = await relayService.createRelay(
        address,
        receiverAddress,
        parseFloat(amount)
      );
      
      if (newRelay) {
        console.log('Relay created successfully:', newRelay);
        await loadRelays();
        setShowCreateRelayModal(false);
        setToastMessage('Relay created successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        console.error('Failed to create relay - no data returned');
        setToastMessage('Failed to create relay. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error creating relay:', error);
      setToastMessage('Failed to create relay. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleRelayAction = async (relayId: string, action: 'approve' | 'reject' | 'execute' | 'cancel') => {
    if (!address) return;
    
    try {
      let result = null;
      
      switch (action) {
        case 'approve':
          result = await relayService.approveRelay(relayId, address);
          break;
        case 'reject':
          result = await relayService.rejectRelay(relayId, address);
          break;
        case 'execute':
          // In a real implementation, this would trigger the actual blockchain transaction
          const mockTxHash = '0x' + Math.random().toString(16).substr(2, 40);
          result = await relayService.executeRelay(relayId, address, mockTxHash, '21,000');
          break;
        case 'cancel':
          result = await relayService.cancelRelay(relayId, address);
          break;
      }
      
      if (result) {
        console.log(`Relay ${action} successful:`, result);
        await loadRelays();
        setToastMessage(`Relay ${action}d successfully!`);
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage(`Failed to ${action} relay. Please try again.`);
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error(`Error ${action}ing relay:`, error);
      setToastMessage(`Failed to ${action} relay. Please try again.`);
      setToastType('error');
      setShowToast(true);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-[#F8F8F8]">
      <AestheticNavbar 
        leftLinkPath="/legacy"
        leftLinkText="Legacy"
        roomName="Relay"
        rightLinkPath="/stream"
        rightLinkText="Stream"
      />
      <main className="flex-1 px-4 sm:px-8 pt-0 pb-8">
        <div className="max-w-7xl mx-auto">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl max-w-md">
                <Send className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Smart Way to Agree
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Relay enables synchronized smart transfers—no middleman, no delay.
                </p>
                <button
                  onClick={() => open()}
                  className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                >
                  Relay the Signal
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header with Tabs and Create Button */}
              <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Tab Navigation */}
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
                
                {/* Create Button */}
                <button
                  onClick={handleCreateRelay}
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center space-x-2 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Relay</span>
                </button>
              </div>

              {/* Table */}
              <div className="mb-8">
                {loading ? (
                  <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading relays...</p>
                  </div>
                ) : (
                  <RelayTable 
                    data={activeTab === 'queue' ? queueRelays : historyRelays}
                    currentWallet={address || ''}
                    onRelayAction={handleRelayAction}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </main>
      
      {/* Create Relay Modal */}
      <CreateRelayModal
        isOpen={showCreateRelayModal}
        onClose={handleCloseCreateRelayModal}
        onSubmit={handleCreateRelaySubmit}
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

export default RelayPage;
