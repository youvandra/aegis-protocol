import React, { useState, useEffect } from 'react';
import { X, Edit2 } from 'lucide-react';
import { Beneficiary } from '../types/beneficiary';

interface EditBeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (beneficiaryId: string, beneficiaryData: Omit<Beneficiary, 'id'>) => void;
  beneficiary: Beneficiary | null;
  currentTotalPercentage: number;
}

const EditBeneficiaryModal: React.FC<EditBeneficiaryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  beneficiary,
  currentTotalPercentage
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [percentage, setPercentage] = useState('');
  const [notes, setNotes] = useState('');

  // Update form when beneficiary changes
  useEffect(() => {
    if (beneficiary) {
      setName(beneficiary.name);
      setAddress(beneficiary.address);
      setPercentage(beneficiary.percentage.toString());
      setNotes(beneficiary.notes || '');
    }
  }, [beneficiary]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!beneficiary) return;
    
    const percentageNum = parseFloat(percentage);
    if (isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
      alert('Please enter a valid percentage between 0.01 and 100');
      return;
    }

    // Calculate what the new total would be (excluding current beneficiary's percentage)
    const otherBeneficiariesTotal = currentTotalPercentage - beneficiary.percentage;
    const newTotal = otherBeneficiariesTotal + percentageNum;
    
    if (newTotal > 100) {
      alert(`Total percentage cannot exceed 100%. Current total of other beneficiaries is ${otherBeneficiariesTotal.toFixed(1)}%. Maximum allowed for this beneficiary is ${(100 - otherBeneficiariesTotal).toFixed(1)}%.`);
      return;
    }

    if (name.trim() && address.trim()) {
      onSubmit(beneficiary.id, {
        name: name.trim(),
        address: address.trim(),
        percentage: percentageNum,
        notes: notes.trim(),
      });
    }
  };

  const handleClose = () => {
    if (beneficiary) {
      setName(beneficiary.name);
      setAddress(beneficiary.address);
      setPercentage(beneficiary.percentage.toString());
      setNotes(beneficiary.notes || '');
    }
    onClose();
  };

  if (!isOpen || !beneficiary) return null;

  // Calculate available percentage for this beneficiary
  const otherBeneficiariesTotal = currentTotalPercentage - beneficiary.percentage;
  const maxAllowedPercentage = 100 - otherBeneficiariesTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Edit2 className="w-5 h-5 mr-2" />
            Edit Beneficiary
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="editName" className="block text-sm font-medium text-gray-700 mb-2">
              Beneficiary Name
            </label>
            <input
              type="text"
              id="editName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Michael Jordan"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          {/* Address Input */}
          <div>
            <label htmlFor="editAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Wallet Address
            </label>
            <input
              type="text"
              id="editAddress"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 font-mono text-sm"
              required
            />
          </div>

          {/* Percentage Input */}
          <div>
            <label htmlFor="editPercentage" className="block text-sm font-medium text-gray-700 mb-2">
              Inheritance Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                id="editPercentage"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="25"
                min="0.01"
                max={maxAllowedPercentage}
                step="0.01"
                className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximum allowed: {maxAllowedPercentage.toFixed(1)}%
            </p>
          </div>

          {/* Notes Input */}
          <div>
            <label htmlFor="editNotes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="editNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional instructions or relationship details..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200 font-medium"
            >
              Update Beneficiary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBeneficiaryModal;