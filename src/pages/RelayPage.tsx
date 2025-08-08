import React, { useState, useEffect, lazy } from 'react';
import { Plus, Send } from 'lucide-react';
import { RelayItem } from '../types/relay';
import { useWalletTracking } from '../hooks/useWalletTracking';
import { relayService } from '../lib/supabase';
import { AccountId, Client, PrivateKey, TopicCreateTransaction, TopicId, TopicMessageSubmitTransaction } from '@hashgraph/sdk';
import { parseEther } from 'viem';
import { useSendTransaction } from 'wagmi';

// Dynamic imports
const AestheticNavbar = lazy(() => import('../components/AestheticNavbar'));
const RelayTable = lazy(() => import('../components/RelayTable'));
const CreateRelayModal = lazy(() => import('../components/CreateRelayModal'));
const Toast = lazy(() => import('../components/Toast'));

// Your account ID and private key from string value
const MY_ACCOUNT_ID = AccountId.fromString(import.meta.env.VITE_HEDERA_ACCOUNT_ID!);
const MY_PRIVATE_KEY = PrivateKey.fromStringECDSA(import.meta.env.VITE_HEDERA_PRIVATE_KEY!);
const RelayPage: React.FC = () => {
  const { isConnected, hederaAccountId } = useWalletTracking();
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [showCreateRelayModal, setShowCreateRelayModal] = useState(false);
  const [relays, setRelays] = useState<RelayItem[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Load relays when wallet connects
  useEffect(() => {
    if (isConnected && hederaAccountId) {
      loadRelays();
    } else {
      setRelays([]);
    }
  }, [isConnected, hederaAccountId]);

  const loadRelays = async () => {
    if (!hederaAccountId) return;
    
    setLoading(true);
    try {
      const relaysData = await relayService.getRelays(hederaAccountId);
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
      const client = Client.forTestnet();
      client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

      const relayTxJson = JSON.stringify({
        type: "RelayTx",
        sender_account_id: hederaAccountId,
        receiver_account_id: receiverAddress,
        amount: numericAmount,
      });

      const tx = await new TopicCreateTransaction()
        .setTopicMemo(relayTxJson)
        .freezeWith(client)
        .sign(MY_PRIVATE_KEY);
      
      const submitTx = await tx.execute(client);
      const receipt = await submitTx.getReceipt(client);
      const topic_id = receipt.topicId!.toString();

      const newRelay = await relayService.createRelay(
        hederaAccountId,
        receiverAddress,
        numericAmount,
        expiresAt,
        topic_id,
      );


      
      if (newRelay) {
        setShowCreateRelayModal(false);
        setToastMessage('Relay created successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        console.error('Failed to create relay - no data returned');
        setToastMessage('Failed to create relay. Please check your inputs and try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error creating relay:', error);
      setToastMessage('Failed to create relay. Please check your connection and try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleRelayAction = async (relayId: string, action: 'approve' | 'reject' | 'execute' | 'cancel') => {
    if (!hederaAccountId) return;
    
    try {
      let result = null;
      const client = Client.forTestnet();
      client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);
      // Fetch relay details to get receiverAddress
      const relayDetails = relays.find(r => r.id === relayId);
      if (!relayDetails || !relayDetails.receiver_address) {
        throw new Error('Receiver address not found for this relay.');
      }
      const senderAddress = relayDetails.sender_address;
      const receiverAddress = relayDetails.receiver_address;
      const amount = relayDetails.amount;
      const topicId = relayDetails.topic_id!;


      const getAccountByIdParams = {
        idOrAliasOrEvmAddress: receiverAddress,       //Fill in the account ID or alias or EVM address
         limit: 1,                              //Fill in the number of transactions to return
         order: "desc",                          //Fill the result ordering
       };
          
          //Get account by ID/alias/EVM address
      const getAccountByIdResponse = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${getAccountByIdParams.idOrAliasOrEvmAddress}?limit=${getAccountByIdParams.limit}&order=${getAccountByIdParams.order}`
      );
      const getAccountByIdResponseJson = await getAccountByIdResponse.json();

      const address = getAccountByIdResponseJson.evm_address; // Use the account ID from the response
      
      switch (action) {
        case 'approve':
            const domain = {
              name: "AegisProtocol",
              version: "1",
              chainId: 296,
            };

            const types = {
              EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
              ],
              RelayApproval: [
                { name: "type", type: "string" },
                { name: "amount", type: "uint256" },
                { name: "topicId", type: "string" },
                { name: "sender", type: "string" },
                { name: "receiver", type: "string" },
              ],
            };

            const value = {
              type: "EIP712Domain",
              amount: amount,
              topicId: topicId,
              sender: senderAddress,
              receiver: receiverAddress,
            };

            const signature = await window.ethereum.request({
              method: "eth_signTypedData_v4",
              params: [
                window.ethereum.selectedAddress,
                JSON.stringify({
                  domain,
                  types,
                  primaryType: "RelayApproval",
                  message: value,
                }),
              ],
            });

            const approvalMessage = JSON.stringify({
              sign_data: signature,
              sign_type: "EIP712Domain",
              status: "Approve",
              signer_account_id: receiverAddress,
              signer_evm_address: address,
              sign_date: new Date().toISOString(),
            });

            const txTopicMessageSubmit = new TopicMessageSubmitTransaction()
            .setTopicId(TopicId.fromString(topicId))
            .setMessage(approvalMessage);
          await txTopicMessageSubmit.execute(client);

          result = await relayService.approveRelay(relayId, hederaAccountId);
          break;
        case 'reject':
          result = await relayService.rejectRelay(relayId, hederaAccountId);
          break;
        case 'execute':
          try {

              const value = parseEther(amount.toString());
              const hash = await sendTransactionAsync({ to: address, value });
              result = await relayService.executeRelay(relayId, hederaAccountId, hash);
            } catch (err) {
              console.error("Gagal mengirim transaksi:", err);
            }
            break;
          case 'cancel':
            result = await relayService.cancelRelay(relayId, hederaAccountId);
            break;
        }

      if (result) {
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

