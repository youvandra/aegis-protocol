import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Beneficiary } from '../types/beneficiary';

interface SetBeneficiariesFormProps {
  onAddBeneficiary: (beneficiary: Omit<Beneficiary, 'id'>) => void;
}

const SetBeneficiariesForm: React.FC<SetBeneficiariesFormProps> = ({ onAddBeneficiary }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [percentage, setPercentage] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const percentageNum = parseFloat(percentage);
    if (isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
      alert('Please enter a valid percentage between 0.01 and 100');
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
            placeholder="0x742d35Cc6634C0532925a3b8D4C9db96590b5b8c"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200 font-mono text-sm"
            required
          />
        </div>

        {/* Percentage Input */}
        <div>
          <label htmlFor="percentage" className="block text-sm font-medium text-gray-700 mb-2">
            Inheritance Percentage
          </label>
          <div className="relative">
            <input
              type="number"
              id="percentage"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="25"
              min="0.01"
              max="100"
              step="0.01"
              className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              required
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
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
          className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Beneficiary</span>
        </button>
      </form>
    </div>
  );
};

export default SetBeneficiariesForm;