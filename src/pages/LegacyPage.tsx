import { useState, useEffect, lazy } from 'react';
import { Shield, Clock, HeartPulse } from 'lucide-react';
import { useChainId } from 'wagmi';
import { useWalletTracking } from '../hooks/useWalletTracking';
import { Beneficiary } from '../types/beneficiary';
import { LegacyMoment } from '../types/legacyMoment';
import { legacyService, walletAccountService } from '../lib/supabase';
import { formatDuration } from '../utils/time';

// Dynamic imports
const AestheticNavbar = lazy(() => import('../components/AestheticNavbar'));
const SetBeneficiariesForm = lazy(() => import('../components/SetBeneficiariesForm'));
const BeneficiariesDisplay = lazy(() => import('../components/BeneficiariesDisplay'));
const EditBeneficiaryModal = lazy(() => import('../components/EditBeneficiaryModal'));
const SetMomentModal = lazy(() => import('../components/SetMomentModal'));
const Toast = lazy(() => import('../components/Toast'));
const ConfirmationDialog = lazy(() => import('../components/ConfirmationDialog'));

const LegacyPage: React.FC = () => {
  const { isConnected, hederaAccountId } = useWalletTracking();
  const chainId = useChainId();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [legacyMoment, setLegacyMoment] = useState<LegacyMoment | null>(null);
  const [showSetMomentModal, setShowSetMomentModal] = useState(false);
  const [showEditBeneficiaryModal, setShowEditBeneficiaryModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showMomentConfirmation, setShowMomentConfirmation] = useState(false);
  const [showHeartbeatConfirmation, setShowHeartbeatConfirmation] = useState(false);
  const [pendingDeleteBeneficiaryId, setPendingDeleteBeneficiaryId] = useState<string | null>(null);
  const [pendingMomentConfig, setPendingMomentConfig] = useState<LegacyMoment | null>(null);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [loading, setLoading] = useState(false);
  const [heartbeatLoading, setHeartbeatLoading] = useState(false);
  const [legacyPlanId, setLegacyPlanId] = useState<string | null>(null);
  const [lastConnectedAt, setLastConnectedAt] = useState<string | null>(null);
  const [timeInactive, setTimeInactive] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  // Calculate current total percentage
  const currentTotalPercentage = beneficiaries.reduce((sum, beneficiary) => sum + beneficiary.percentage, 0);

  // Load legacy plan and beneficiaries when wallet connects
  useEffect(() => {
    if (isConnected && hederaAccountId) {
      loadLegacyData();
    } else {
      // Reset data when wallet disconnects
      setBeneficiaries([]);
      setLegacyMoment(null);
      setLegacyPlanId(null);
    }
  }, [isConnected, hederaAccountId]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Update time inactive every minute
  useEffect(() => {
    if (!lastConnectedAt) return;

    const updateTimeInactive = () => {
      const now = new Date();
      const lastConnected = new Date(lastConnectedAt);
      const timeDiff = now.getTime() - lastConnected.getTime();
      setTimeInactive(formatDuration(timeDiff));
    };

    // Update immediately
    updateTimeInactive();

    // Update every minute
    const interval = setInterval(updateTimeInactive, 60000);

    return () => clearInterval(interval);
  }, [lastConnectedAt]);

  const loadLegacyData = async () => {
    if (!hederaAccountId) return;
    
    setLoading(true);
    try {
      
      // Load legacy plan
      const legacyPlan = await legacyService.getLegacyPlan(hederaAccountId);
      if (legacyPlan) {
        setLegacyPlanId(legacyPlan.id);
        setLegacyMoment({
          type: legacyPlan.moment_type,
          value: legacyPlan.moment_value,
          label: legacyPlan.moment_label,
        });
        
        // Load beneficiaries for this plan
        const beneficiariesData = await legacyService.getBeneficiaries(legacyPlan.id);
        setBeneficiaries(beneficiariesData);
      }

      // Load user's last connected timestamp
      const userData = await walletAccountService.getWalletAccount(hederaAccountId);
      if (userData) {
        setLastConnectedAt(userData.last_connected_at);
      }
    } catch (error) {
      console.error('Error loading legacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBeneficiary = async (beneficiaryData: Omit<Beneficiary, 'id'>) => {
    if (!hederaAccountId) return;
    
    // Check if adding this beneficiary would exceed 100%
    const currentTotal = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
    const newTotal = currentTotal + beneficiaryData.percentage;
    
    if (newTotal > 100) {
      const remainingPercentage = 100 - currentTotal;
      setToastMessage(`Total percentage cannot exceed 100%. You can allocate up to ${remainingPercentage.toFixed(1)}% more.`);
      setToastType('error');
      setShowToast(true);
      return;
    }
    
    try {
      let currentLegacyPlanId = legacyPlanId;
      
      // If no legacy plan exists, create a default one
      if (!currentLegacyPlanId) {
        const defaultMoment: LegacyMoment = {
          type: 'ifImGone',
          value: '6months',
          label: 'Activate if inactive for 6 months'
        };
        
        const newPlan = await legacyService.createOrUpdateLegacyPlan(hederaAccountId, defaultMoment);
        if (!newPlan) {
          setToastMessage('Failed to create legacy plan. Please try again.');
          setToastType('error');
          setShowToast(true);
          return;
        }
        
        currentLegacyPlanId = newPlan.id;
        setLegacyPlanId(currentLegacyPlanId);
        setLegacyMoment(defaultMoment);
      }
      
      // Add beneficiary to the plan
      const newBeneficiary = await legacyService.addBeneficiary(currentLegacyPlanId, beneficiaryData);
      if (newBeneficiary) {
        setBeneficiaries(prev => [...prev, newBeneficiary]);
        setToastMessage('Beneficiary added successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage('Failed to add beneficiary. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error adding beneficiary:', error);
      setToastMessage('Failed to add beneficiary. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleSetMomentSubmit = async (momentConfig: LegacyMoment) => {
    // Store the moment config and show confirmation
    setPendingMomentConfig(momentConfig);
    setShowSetMomentModal(false);
    setShowMomentConfirmation(true);
  };

  const confirmSetMoment = async () => {
    if (!hederaAccountId || !pendingMomentConfig) return;
    
    try {
      const updatedPlan = await legacyService.createOrUpdateLegacyPlan(hederaAccountId, pendingMomentConfig);
      if (updatedPlan) {
        setLegacyMoment(pendingMomentConfig);
        setLegacyPlanId(updatedPlan.id);
        setShowMomentConfirmation(false);
        setPendingMomentConfig(null);
        setToastMessage('Activation moment set successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage('Failed to set moment. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error setting moment:', error);
      setToastMessage('Failed to set moment. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const cancelSetMoment = () => {
    setShowMomentConfirmation(false);
    setPendingMomentConfig(null);
  };

  const handleCloseSetMomentModal = () => {
    setShowSetMomentModal(false);
  };

  const handleEditBeneficiary = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setShowEditBeneficiaryModal(true);
  };

  const handleCloseEditBeneficiaryModal = () => {
    setShowEditBeneficiaryModal(false);
    setEditingBeneficiary(null);
  };

  const handleUpdateBeneficiary = async (beneficiaryId: string, beneficiaryData: Omit<Beneficiary, 'id'>) => {
    if (!hederaAccountId) return;
    
    try {
      const updatedBeneficiary = await legacyService.updateBeneficiary(beneficiaryId, beneficiaryData);
      if (updatedBeneficiary) {
        setBeneficiaries(prev => 
          prev.map(b => b.id === beneficiaryId ? updatedBeneficiary : b)
        );
        handleCloseEditBeneficiaryModal();
        setToastMessage('Beneficiary updated successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage('Failed to update beneficiary. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error updating beneficiary:', error);
      setToastMessage('Failed to update beneficiary. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDeleteBeneficiary = async (beneficiaryId: string) => {
    if (!hederaAccountId) return;
    
    // Store the beneficiary ID and show confirmation dialog
    setPendingDeleteBeneficiaryId(beneficiaryId);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteBeneficiary = async () => {
    if (!hederaAccountId || !pendingDeleteBeneficiaryId) return;
    
    try {
      const success = await legacyService.deleteBeneficiary(pendingDeleteBeneficiaryId);
      if (success) {
        setBeneficiaries(prev => prev.filter(b => b.id !== pendingDeleteBeneficiaryId));
        setShowDeleteConfirmation(false);
        setPendingDeleteBeneficiaryId(null);
        setToastMessage('Beneficiary deleted successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage('Failed to delete beneficiary. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error deleting beneficiary:', error);
      setToastMessage('Failed to delete beneficiary. Please try again.');
      setToastType('error');
      setShowToast(true);
    }
  };

  const cancelDeleteBeneficiary = () => {
    setShowDeleteConfirmation(false);
    setPendingDeleteBeneficiaryId(null);
  };

  const handleHeartbeatClick = () => {
    setShowHeartbeatConfirmation(true);
  };

  const confirmHeartbeat = async () => {
    if (!hederaAccountId) return;
    
    setHeartbeatLoading(true);
    try {
      const updatedUser = await walletAccountService.upsertWalletAccount(hederaAccountId, chainId);
      
      if (updatedUser) {
        setLastConnectedAt(updatedUser.last_connected_at);
        setShowHeartbeatConfirmation(false);
        setToastMessage('Activity refreshed successfully!');
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage('Failed to refresh activity. Please try again.');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error refreshing heartbeat:', error);
      setToastMessage('Failed to refresh activity. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setHeartbeatLoading(false);
    }
  };

  const cancelHeartbeat = () => {
    setShowHeartbeatConfirmation(false);
  };

  // Get the beneficiary being deleted for the confirmation dialog
  const beneficiaryToDelete = beneficiaries.find(b => b.id === pendingDeleteBeneficiaryId);

  return (
    <div className="min-h-screen relative flex flex-col bg-[#F8F8F8]">
      <AestheticNavbar 
        leftLinkPath="/stream"
        leftLinkText="Stream"
        roomName="Legacy"
        rightLinkPath="/relay"
        rightLinkText="Relay"
      />
      <main className="flex-1 px-8 pt-0">
        <div className="max-w-7xl mx-auto">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl max-w-md">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  Secure My Legacy
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Build a trustless legacy that activates when the time is right.
                  No lawyers, no paperwork—just secure, automated distribution.
                </p>
                <button
                  onClick={() => open()}
                  className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                >
                  Set Beneficiaries
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Action Buttons and Time Display */}
              <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Time Inactive Display */}
                <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-3 shadow-md">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Inactive for:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {timeInactive || 'Loading...'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleHeartbeatClick}
                    disabled={heartbeatLoading}
                    className={`px-6 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center space-x-2 ${
                      heartbeatLoading
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    {heartbeatLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Refreshing...</span>
                      </>
                    ) : (
                      <>
                        <HeartPulse className="w-5 h-5" />
                        <span>Heartbeat</span>
                      </>
                    )}
                  </button>
                <button
                  onClick={() => setShowSetMomentModal(true)}
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium flex items-center space-x-2"
                >
                  <Clock className="w-5 h-5" />
                  <span>Set Moment</span>
                </button>
                </div>
              </div>

            <div className="flex flex-col md:flex-row md:gap-8 gap-6">
              {/* Left Side - Set Beneficiaries Form */}
              <div className="w-full md:w-1/2">
                <SetBeneficiariesForm 
                  onAddBeneficiary={handleAddBeneficiary}
                  loading={loading}
                  currentTotalPercentage={currentTotalPercentage}
                  existingBeneficiaries={beneficiaries}
                />
              </div>
              
              {/* Right Side - Beneficiaries Display */}
              <div className="w-full md:w-1/2">
                <BeneficiariesDisplay 
                  beneficiaries={beneficiaries} 
                  legacyMoment={legacyMoment}
                  loading={loading}
                  onEditBeneficiary={handleEditBeneficiary}
                  onDeleteBeneficiary={handleDeleteBeneficiary}
                />
              </div>
            </div>
            </>
          )}
        </div>
      </main>
      
      {/* Set Moment Modal */}
      <SetMomentModal
        isOpen={showSetMomentModal}
        onClose={handleCloseSetMomentModal}
        onSubmit={handleSetMomentSubmit}
        currentMoment={legacyMoment}
      />
      
      {/* Edit Beneficiary Modal */}
      <EditBeneficiaryModal
        isOpen={showEditBeneficiaryModal}
        onClose={handleCloseEditBeneficiaryModal}
        onSubmit={handleUpdateBeneficiary}
        beneficiary={editingBeneficiary}
        currentTotalPercentage={currentTotalPercentage}
      />
      
      {/* Delete Beneficiary Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirmation}
        title="Delete Beneficiary"
        message={beneficiaryToDelete ? `Are you sure you want to delete "${beneficiaryToDelete.name}"? This action cannot be undone and will remove them from your legacy plan.` : 'Are you sure you want to delete this beneficiary?'}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDeleteBeneficiary}
        onCancel={cancelDeleteBeneficiary}
      />

      {/* Set Moment Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showMomentConfirmation}
        title="Set Activation Moment"
        message={`Are you sure you want to set the activation moment to "${pendingMomentConfig?.label}"? This will determine when your legacy plan becomes active.`}
        confirmText="Set Moment"
        cancelText="Cancel"
        type="warning"
        onConfirm={confirmSetMoment}
        onCancel={cancelSetMoment}
      />
      
      {/* Heartbeat Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showHeartbeatConfirmation}
        title="Refresh Activity"
        message="This will update your last activity timestamp and reset your inactivity period. Your legacy plan activation countdown will restart from this moment."
        confirmText="Refresh Activity"
        cancelText="Cancel"
        type="info"
        onConfirm={confirmHeartbeat}
        onCancel={cancelHeartbeat}
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

export default LegacyPage;
