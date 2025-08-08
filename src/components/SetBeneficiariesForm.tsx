import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Beneficiary } from '../types/beneficiary';

interface SetBeneficiariesFormProps {
  onAddBeneficiary: (beneficiary: Omit<Beneficiary, 'id'>) => void;
  loading?: boolean;
  currentTotalPercentage?: number;
  existingBeneficiaries?: Beneficiary[];
}

const SetBeneficiariesForm: React.FC<SetBeneficiariesFormProps> = ({ 
  onAddBeneficiary, 
  loading = false,
  currentTotalPercentage = 0,
  existingBeneficiaries = []
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [percentage, setPercentage] = useState('');
  const [notes, setNotes] = useState('');

  // Check if address already exists in beneficiaries
  const isDuplicateAddress = !!address.trim() && existingBeneficiaries.some(
    beneficiary => beneficiary.address.toLowerCase() === address.trim().toLowerCase()
  );
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate address
    if (isDuplicateAddress) {
      alert('This wallet address has already been added as a beneficiary. Please use a different address.');
      return;
    }
    
    const percentageNum = parseFloat(percentage);
    if (isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
      alert('Please enter a valid percentage between 0.01 and 100');
      return;
    }

    // Check if adding this percentage would exceed 100%
    const newTotal = currentTotalPercentage + percentageNum;
    if (newTotal > 100) {
      const remainingPercentage = 100 - currentTotalPercentage;
      alert(`Total percentage cannot exceed 100%. You can allocate up to ${remainingPercentage.toFixed(1)}% more.`);
      return;
    }

    if (name.trim() && address.trim()) {
      onAddBeneficiary({
        name: name.trim(),
        address: address.trim(),
        percentage: percentageNum,
        notes: notes.trim(),
      });
      
      // Reset form
      setName('');
      setAddress('');
      setPercentage('');
      setNotes('');
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
        <Plus className="w-6 h-6 mr-2" />
        Set Beneficiaries
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Input */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Beneficiary Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Michael Jordan"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
            required
          />
        </div>

        {/* Address Input */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Wallet Address
          </label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0.0.6526667"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 font-mono text-sm ${
              isDuplicateAddress
                ? 'border-red-300 focus:ring-red-500 bg-red-50'
                : 'border-gray-300 focus:ring-black'
            }`}
            required
          />
          {isDuplicateAddress && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs text-red-700 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                This address is already added as a beneficiary. Please use a different address.
              </p>
            </div>
          )}
        </div>

        {/* Percentage Input */}
        <div>
          <label htmlFor="percentage" className="block text-sm font-medium text-gray-700 mb-2">
            Inheritance Percentage
          </label>
            
            {/* Allocation Status */}
            <div className="mb-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Total Allocated:</span>
                <span className={`font-semibold ${
                  currentTotalPercentage > 100 ? 'text-red-600' : 
                  currentTotalPercentage === 100 ? 'text-green-600' : 
                  'text-gray-900'
                }`}>
                  {currentTotalPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600">Remaining:</span>
                <span className={`font-semibold ${
                  (100 - currentTotalPercentage) < 0 ? 'text-red-600' : 
                  (100 - currentTotalPercentage) === 0 ? 'text-green-600' : 
                  'text-blue-600'
                }`}>
                  {Math.max(0, 100 - currentTotalPercentage).toFixed(1)}%
                </span>
              </div>
            </div>

          <div className="relative">
            <input
              type="number"
              id="percentage"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
                className={`w-full px-4 py-3 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                  currentTotalPercentage >= 100 
                    ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                    : 'border-gray-300 focus:ring-black'
                }`}
                max={Math.max(0, 100 - currentTotalPercentage)}
              step="0.01"
              required
            />
            
            {/* Dynamic Warning Messages */}
            {currentTotalPercentage >= 100 ? (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs text-red-700 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Estate is fully allocated. Remove or edit existing beneficiaries to add more.
                </p>
              </div>
            ) : currentTotalPercentage > 80 ? (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-700 flex items-center">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Almost fully allocated. Only {(100 - currentTotalPercentage).toFixed(1)}% remaining.
                </p>
              </div>
            ) : currentTotalPercentage > 0 ? (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  You can allocate up to {(100 - currentTotalPercentage).toFixed(1)}% more.
                </p>
              </div>
            ) : (
              <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs text-gray-600 flex items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                  Start by allocating a percentage of your estate.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notes Input */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional instructions or relationship details..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || isDuplicateAddress}
          className={`w-full px-6 py-3 rounded-lg transition-colors duration-200 font-medium flex items-center justify-center space-x-2 ${
            loading || isDuplicateAddress
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              <span>Add Beneficiary</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SetBeneficiariesForm;