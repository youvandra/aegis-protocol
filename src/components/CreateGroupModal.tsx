import React, { useState } from 'react';
import { X, Users, Clock, AlertTriangle } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (groupData: {
    groupName: string;
    releaseDateTime?: string;
  }) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [groupName, setGroupName] = useState('');
  const [releaseDateTime, setReleaseDateTime] = useState('');
  const [dateTimeError, setDateTimeError] = useState('');

  // Get current time for validation
  const getCurrentTime = () => {
    return new Date().toISOString().slice(0, 16);
  };

  // Validate release time
  const validateReleaseTime = (dateTimeValue: string) => {
    if (!dateTimeValue) {
      setDateTimeError('');
      return true;
    }

    const inputDate = new Date(dateTimeValue);
    const now = new Date();
    
    if (inputDate.getTime() <= now.getTime()) {
      setDateTimeError('Release time must be in the future');
      return false;
    }
    
    setDateTimeError('');
    return true;
  };

  // Handle release time change with validation
  const handleReleaseDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReleaseDateTime(value);
    validateReleaseTime(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate release time
    if (releaseDateTime && !validateReleaseTime(releaseDateTime)) {
      return;
    }
    
    if (groupName.trim() && releaseDateTime) {
      // Convert local time to UTC for storage
      const localDate = new Date(releaseDateTime);
      const utcDateTime = localDate.toISOString();
      
      onSubmit({
        groupName: groupName.trim(),
        releaseDateTime: utcDateTime
      });
      
      // Reset form
      setGroupName('');
      setReleaseDateTime('');
      setDateTimeError('');
    }
  };

  const handleClose = () => {
    setGroupName('');
    setReleaseDateTime('');
    setDateTimeError('');
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
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Create Group
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
          {/* Group Name Input */}
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Family Trust Fund"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all duration-200"
              required
            />
          </div>

          {/* Date Input */}
          <div>
            <label htmlFor="releaseDateTime" className="block text-sm font-medium text-gray-700 mb-2">
              Release Date & Time 
            </label>
            
            <input
              type="datetime-local"
              id="releaseDateTime"
              value={releaseDateTime}
              onChange={handleReleaseDateTimeChange}
              min={getCurrentTime()}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                dateTimeError 
                  ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                  : 'border-gray-300 focus:ring-black'
              }`}
              required
            />
            
            {/* Error Message */}
            {dateTimeError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <p className="text-xs text-red-700">{dateTimeError}</p>
                </div>
              </div>
            )}
            
            {/* Success Message */}
            {!dateTimeError && releaseDateTime && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-xs text-green-700 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Valid release time set
                </p>
              </div>
            )}
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
              disabled={!!dateTimeError}
              className={`flex-1 px-4 py-2 rounded-md transition-colors duration-200 font-medium ${
                dateTimeError
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;