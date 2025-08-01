import { useState, useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Shield, Clock } from 'lucide-react';
import AestheticNavbar from '../components/AestheticNavbar';
import SetBeneficiariesForm from '../components/SetBeneficiariesForm';
import BeneficiariesDisplay from '../components/BeneficiariesDisplay';
import EditBeneficiaryModal from '../components/EditBeneficiaryModal';
import SetMomentModal from '../components/SetMomentModal';
import { Beneficiary } from '../types/beneficiary';
import { LegacyMoment } from '../types/legacyMoment';
import { useWalletTracking } from '../hooks/useWalletTracking';
import { legacyService } from '../lib/supabase';

const LegacyPage: React.FC = () => {
  const { isConnected, address } = useWalletTracking();
  const { open } = useWeb3Modal();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [legacyMoment, setLegacyMoment] = useState<LegacyMoment | null>(null);
  const [showSetMomentModal, setShowSetMomentModal] = useState(false);
  const [showEditBeneficiaryModal, setShowEditBeneficiaryModal] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [loading, setLoading] = useState(false);
  const [legacyPlanId, setLegacyPlanId] = useState<string | null>(null);

  // Load legacy plan and beneficiaries when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      loadLegacyData();
    } else {
      // Reset data when wallet disconnects
      setBeneficiaries([]);
      setLegacyMoment(null);
      setLegacyPlanId(null);
    }
  }, [isConnected, address]);

  const loadLegacyData = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      console.log('Loading legacy data for wallet:', address);
      
      // Load legacy plan
      const legacyPlan = await legacyService.getLegacyPlan(address);
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
    } catch (error) {
      console.error('Error loading legacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBeneficiary = async (beneficiaryData: Omit<Beneficiary, 'id'>) => {
    if (!address) return;
    
    // Check if adding this beneficiary would exceed 100%
    const currentTotal = beneficiaries.reduce((sum, b) => sum + b.percentage, 0);
    const newTotal = currentTotal + beneficiaryData.percentage;
    
    if (newTotal > 100) {
      const remainingPercentage = 100 - currentTotal;
      alert(`Total percentage cannot exceed 100%. You can allocate up to ${remainingPercentage.toFixed(1)}% more.`);
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
        
        const newPlan = await legacyService.createOrUpdateLegacyPlan(address, defaultMoment);
        if (!newPlan) {
          alert('Failed to create legacy plan. Please try again.');
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
      } else {
        alert('Failed to add beneficiary. Please try again.');
      }
    } catch (error) {
      console.error('Error adding beneficiary:', error);
      alert('Failed to add beneficiary. Please try again.');
    }
  };

  const handleSetMomentSubmit = async (momentConfig: LegacyMoment) => {
    if (!address) return;
    
    try {
      const updatedPlan = await legacyService.createOrUpdateLegacyPlan(address, momentConfig);
      if (updatedPlan) {
        setLegacyMoment(momentConfig);
        setLegacyPlanId(updatedPlan.id);
        setShowSetMomentModal(false);
      } else {
        alert('Failed to set moment. Please try again.');
      }
    } catch (error) {
      console.error('Error setting moment:', error);
      alert('Failed to set moment. Please try again.');
    }
  };

  const handleCloseSetMomentModal = () => {
    setShowSetMomentModal(false);
  };

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
              {/* Set Moment Button */}
              <div className="mb-8 flex flex-col items-end">
                <button
                  onClick={() => setShowSetMomentModal(true)}
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium flex items-center space-x-2"
                >
                  <Clock className="w-5 h-5" />
                  <span>Set Moment</span>
                </button>
                
                {/* Current Moment Display */}
                {legacyMoment && (
                  <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Current Setting:</span>
                      <span className="text-sm text-gray-900">{legacyMoment.label}</span>
                    </div>
                  </div>
                )}
              </div>

            <div className="flex flex-col md:flex-row md:gap-8 gap-6">
              {/* Left Side - Set Beneficiaries Form */}
              <div className="w-full md:w-1/2">
                <SetBeneficiariesForm 
                  onAddBeneficiary={handleAddBeneficiary}
                  loading={loading}
                />
              </div>
              
              {/* Right Side - Beneficiaries Display */}
              <div className="w-full md:w-1/2">
                <BeneficiariesDisplay 
                  beneficiaries={beneficiaries} 
                  legacyMoment={legacyMoment}
                  loading={loading}
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
    </div>
  );
};

export default LegacyPage;
