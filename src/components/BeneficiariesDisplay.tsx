import React from 'react';
import { Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Beneficiary } from '../types/beneficiary';

interface BeneficiariesDisplayProps {
  beneficiaries: Beneficiary[];
}

const BeneficiariesDisplay: React.FC<BeneficiariesDisplayProps> = ({ beneficiaries }) => {
  const totalPercentage = beneficiaries.reduce((sum, beneficiary) => sum + beneficiary.percentage, 0);
  const isComplete = totalPercentage === 100;
  const isOverAllocated = totalPercentage > 100;

  // Calculate circle progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (totalPercentage / 100) * circumference;

  const getStatusColor = () => {
    if (isOverAllocated) return 'text-red-600';
    if (isComplete) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = () => {
    if (isOverAllocated) return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (isComplete) return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusMessage = () => {
    if (isOverAllocated) return 'Over-allocated! Please adjust percentages.';
    if (isComplete) return 'Estate allocation complete.';
    return 'Allocation incomplete. Add more beneficiaries.';
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
        <Users className="w-6 h-6 mr-2" />
        Beneficiaries
      </h2>

      {/* Circular Progress Chart */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={isOverAllocated ? "#dc2626" : isComplete ? "#16a34a" : "#eab308"}
              strokeWidth="8"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-in-out"
            />
          </svg>
          {/* Percentage text in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getStatusColor()}`}>
              {totalPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
        
        {/* Status Message */}
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusMessage()}
          </span>
        </div>
      </div>

      {/* Beneficiaries List */}
      <div className="space-y-4">
        {beneficiaries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No beneficiaries added yet</p>
            <p className="text-xs text-gray-400 mt-1">Add your first beneficiary to get started</p>
          </div>
        ) : (
          beneficiaries.map((beneficiary) => (
            <div key={beneficiary.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{beneficiary.name}</h3>
                  <p className="text-sm text-gray-600 font-mono break-all">{beneficiary.address}</p>
                </div>
                <div className="ml-4 text-right">
                  <span className="text-lg font-bold text-gray-900">{beneficiary.percentage}%</span>
                </div>
              </div>
              {beneficiary.notes && (
                <p className="text-sm text-gray-600 mt-2 italic">{beneficiary.notes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BeneficiariesDisplay;