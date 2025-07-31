import React from 'react';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Shield, Clock } from 'lucide-react';
import AestheticNavbar from '../components/AestheticNavbar';
import SetBeneficiariesForm from '../components/SetBeneficiariesForm';
import BeneficiariesDisplay from '../components/BeneficiariesDisplay';
import SetMomentModal from '../components/SetMomentModal';
import { Beneficiary } from '../types/beneficiary';
import { LegacyMoment } from '../types/legacyMoment';

const LegacyPage: React.FC = () => {
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [legacyMoment, setLegacyMoment] = useState<LegacyMoment | null>(null);
  const [showSetMomentModal, setShowSetMomentModal] = useState(false);

  const handleAddBeneficiary = (beneficiaryData: Omit<Beneficiary, 'id'>) => {
    const newBeneficiary: Beneficiary = {
      ...beneficiaryData,
      id: Date.now().toString(), // Simple ID generation
    };
    setBeneficiaries(prev => [...prev, newBeneficiary]);
  };

  const handleSetMomentSubmit = (momentConfig: LegacyMoment) => {
    setLegacyMoment(momentConfig);
    setShowSetMomentModal(false);
  };

  const handleCloseSetMomentModal = () => {
    setShowSetMomentModal(false);
  };

  return (
    <div className="min-h-screen relative flex flex-col bg-[#D9D9D9]">
      <AestheticNavbar 
        leftLinkPath="/schedule"
        leftLinkText="Schedule"
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
                  Secure Access Required
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Legacy planning and inheritance features require wallet authentication. 
                  Connect your wallet to access secure estate planning tools.
                </p>
                <button
                  onClick={() => open()}
                  className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
                >
                  Connect Wallet
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

              <div className="flex gap-8">
              {/* Left Side - Set Beneficiaries Form */}
              <div className="w-1/2">
                <SetBeneficiariesForm onAddBeneficiary={handleAddBeneficiary} />
              </div>
              
              {/* Right Side - Beneficiaries Display */}
              <div className="w-1/2">
                <BeneficiariesDisplay 
                  beneficiaries={beneficiaries} 
                  legacyMoment={legacyMoment}
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
