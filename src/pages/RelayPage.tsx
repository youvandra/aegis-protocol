import React, { useCallback, useState, useEffect, lazy } from 'react';
import { Plus, Send } from 'lucide-react';
import { RelayItem } from '../types/relay';
import { useWalletTracking } from '../hooks/useWalletTracking';
import { relayService, hederaApi } from '../lib/api';
import { useAccount, useSendTransaction, useSignTypedData } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { hederaTestnet } from '../config/wagmi';
import { hbarToWei } from '../lib/hedera';
import { errorMessage } from '../utils/errors';

// Dynamic imports
const AestheticNavbar = lazy(() => import('../components/AestheticNavbar'));
const RelayTable = lazy(() => import('../components/RelayTable'));
const CreateRelayModal = lazy(() => import('../components/CreateRelayModal'));
const Toast = lazy(() => import('../components/Toast'));

// EIP-712 payload signed by the receiver when approving a relay.
const RELAY_APPROVAL_DOMAIN = {
  name: 'AegisProtocol',
  version: '1',
  chainId: hederaTestnet.id,
} as const;

const RELAY_APPROVAL_TYPES = {
  RelayApproval: [
    { name: 'amount', type: 'uint256' },
    { name: 'topicId', type: 'string' },
    { name: 'sender', type: 'string' },
    { name: 'receiver', type: 'string' },
  ],
} as const;

const RelayPage: React.FC = () => {
  const { isConnected, hederaAccountId } = useWalletTracking();
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [showCreateRelayModal, setShowCreateRelayModal] = useState(false);
  const [relays, setRelays] = useState<RelayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const { address } = useAccount();
  const { open } = useWeb3Modal();
  const { sendTransactionAsync } = useSendTransaction();
  const { signTypedDataAsync } = useSignTypedData();

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const loadRelays = useCallback(async () => {
    if (!isConnected || !hederaAccountId) {
      setRelays([]);
      return;
    }

    setLoading(true);
    try {
      const relaysData = await relayService.getRelays();
      setRelays(relaysData);
    } catch (error) {
      console.error('Error loading relays:', error);
      setRelays([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected, hederaAccountId]);

  // Load relays when the wallet connects.
  useEffect(() => {
    loadRelays();
  }, [loadRelays]);

  // Filter relays by status for queue vs history
  const queueRelays = relays.filter(relay => 
    relay.status !== 'Complete' && relay.status !== 'Rejected' && relay.status !== 'Expired'
  );
  const historyRelays = relays.filter(relay => 
    relay.status === 'Complete' || relay.status === 'Rejected' || relay.status === 'Expired'
  );
  const handleCreateRelay = () => {
    setShowCreateRelayModal(true);
  };

  const handleCloseCreateRelayModal = () => {
    setShowCreateRelayModal(false);
  };

  const handleCreateRelaySubmit = async (receiverAddress: string, amount: string, expiresAt?: string) => {
    if (!hederaAccountId) return;
    
    try {
      // Additional validation
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setToastMessage('Please enter a valid amount greater than 0.');
        setToastType('error');
        setShowToast(true);
        return;
      }
      // Fails fast on a bad account reference, before anything is paid for.
      await hederaApi.resolveEvmAddress(receiverAddress);

      const { topicId } = await hederaApi.createTopic(
        JSON.stringify({
          type: 'RelayTx',
          sender_account_id: hederaAccountId,
          receiver_account_id: receiverAddress,
          amount: numericAmount,
        })
      );

      const newRelay = await relayService.createRelay({
        receiverAddress,
        amount: numericAmount,
        expiresAt,
        topicId,
      });

      await loadRelays();
      setShowCreateRelayModal(false);
      setToastMessage(`Relay #${newRelay.relay_number} created successfully!`);
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error creating relay:', error);
      setToastMessage(
        errorMessage(error, 'Failed to create relay. Please check your connection and try again.')
      );
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleRelayAction = async (relayId: string, action: 'approve' | 'reject' | 'execute' | 'cancel') => {
    if (!hederaAccountId) return;

    try {
      const relayDetails = relays.find((relay) => relay.id === relayId);
      if (!relayDetails?.receiver_address) {
        throw new Error('Receiver address not found for this relay.');
      }

      const { sender_address: senderAddress, receiver_address: receiverAddress, amount } = relayDetails;
      let result: Awaited<ReturnType<typeof relayService.approveRelay>>;

      switch (action) {
        case 'approve': {
          const topicId = relayDetails.topic_id;
          if (!topicId) {
            throw new Error('This relay has no consensus topic to record approval on.');
          }

          // `amount` is HBAR; the signed field is uint256, so it must be an
          // integer — sign the weibar value, not the decimal.
          const signature = await signTypedDataAsync({
            domain: RELAY_APPROVAL_DOMAIN,
            types: RELAY_APPROVAL_TYPES,
            primaryType: 'RelayApproval',
            message: {
              amount: hbarToWei(amount),
              topicId,
              sender: senderAddress,
              receiver: receiverAddress,
            },
          });

          await hederaApi.submitMessage(
            topicId,
            JSON.stringify({
              sign_data: signature,
              sign_type: 'EIP712',
              status: 'Approve',
              signer_account_id: receiverAddress,
              signer_evm_address: address,
              sign_date: new Date().toISOString(),
            })
          );

          result = await relayService.approveRelay(relayId);
          break;
        }

        case 'reject': {
          result = await relayService.rejectRelay(relayId);
          break;
        }

        case 'execute': {
          if (relayDetails.status !== "Waiting for Sender to Execute") {
            throw new Error('This relay is not ready to be executed yet.');
          }

          // Funds go straight to the receiver, never through the protocol.
          const receiverEvmAddress = await hederaApi.resolveEvmAddress(receiverAddress);
          const hash = await sendTransactionAsync({
            to: receiverEvmAddress,
            value: hbarToWei(amount),
          });

          result = await relayService.executeRelay(relayId, hash);
          break;
        }

        case 'cancel': {
          result = await relayService.cancelRelay(relayId);
          break;
        }
      }

      await loadRelays();
      setToastMessage(`Relay #${result.relay_number} ${action}d successfully!`);
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error(`Error ${action}ing relay:`, error);
      setToastMessage(errorMessage(error, `Failed to ${action} relay. Please try again.`));
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
                    currentWallet={hederaAccountId || ''}
                    onRelayAction={handleRelayAction}
                    itemsPerPage={10}
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

