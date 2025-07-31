import React, { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { LegacyMoment, IF_IM_GONE_OPTIONS } from '../types/legacyMoment';

interface SetMomentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (momentConfig: LegacyMoment) => void;
  currentMoment?: LegacyMoment | null;
}

const SetMomentModal: React.FC<SetMomentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  currentMoment 
}) => {
  const [selectedType, setSelectedType] = useState<'specificDate' | 'ifImGone'>(
    currentMoment?.type || 'specificDate'
  );
  const [specificDate, setSpecificDate] = useState(
    currentMoment?.type === 'specificDate' ? currentMoment.value : ''
  );
  const [ifImGoneInterval, setIfImGoneInterval] = useState(
    currentMoment?.type === 'ifImGone' ? currentMoment.value : '6months'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let momentConfig: LegacyMoment;
    
    if (selectedType === 'specificDate') {
      if (!specificDate) {
        alert('Please select a date');
        return;
      }
      const dateObj = new Date(specificDate);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      momentConfig = {
        type: 'specificDate',
        value: specificDate,
        label: `Activate on ${formattedDate}`
      };
    } else {
      const selectedOption = IF_IM_GONE_OPTIONS.find(opt => opt.value === ifImGoneInterval);
      momentConfig = {
        type: 'ifImGone',
        value: ifImGoneInterval,
        label: `Activate if inactive for ${selectedOption?.label.toLowerCase()}`
      };
    }
    
    onSubmit(momentConfig);
  };

  const handleClose = () => {
    // Reset to current values when closing
    if (currentMoment) {
      setSelectedType(currentMoment.type);
      if (currentMoment.type === 'specificDate') {
        setSpecificDate(currentMoment.value);
      } else {
        setIfImGoneInterval(currentMoment.value);
      }
    } else {
      setSelectedType('specificDate');
      setSpecificDate('');
      setIfImGoneInterval('6months');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Set Activation Moment
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
          {/* Option Selection */}
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Choose when your legacy plan should activate:
            </p>
            
            {/* Specific Date Option */}
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="momentType"
                value="specificDate"
                checked={selectedType === 'specificDate'}
                onChange={(e) => setSelectedType(e.target.value as 'specificDate')}
                className="mt-1 w-4 h-4 text-black border-gray-300 focus:ring-black focus:ring-2"
              />
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="font-medium text-gray-900">Specific Date</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Activate your legacy plan on a predetermined date
                </p>
                {selectedType === 'specificDate' && (
                  <input
                    type="date"
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                    required
                  />
                )}
              </div>
            </label>

            {/* If I'm Gone Option */}
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="radio"
                name="momentType"
                value="ifImGone"
                checked={selectedType === 'ifImGone'}
                onChange={(e) => setSelectedType(e.target.value as 'ifImGone')}
                className="mt-1 w-4 h-4 text-black border-gray-300 focus:ring-black focus:ring-2"
              />
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Clock className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="font-medium text-gray-900">If I'm Gone</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Activate if no activity is detected for a specified period
                </p>
                {selectedType === 'ifImGone' && (
                  <select
                    value={ifImGoneInterval}
                    onChange={(e) => setIfImGoneInterval(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
                    required
                  >
                    {IF_IM_GONE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </label>
          </div>

          {/* Buttons */}
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
              Set Moment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetMomentModal;