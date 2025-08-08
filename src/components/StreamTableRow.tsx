import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, Trash2, Play, ExternalLink } from 'lucide-react';
import { Group } from '../types/stream';
import ConfirmationDialog from './ConfirmationDialog';



interface StreamTableRowProps {
  group: Group;
  onDeleteGroup?: (groupId: string) => void;
  onScheduledGroup?: (groupId: string) => void;
}

const StreamTableRow: React.FC<StreamTableRowProps> = ({ group, onDeleteGroup, onScheduledGroup }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showScheduledDialog, setShowScheduledDialog] = useState(false);
  

  const formatReleaseDate = (releaseDate: string | null) => {
    if (releaseDate) {
      // Parse the UTC date and convert to local timezone for display
      const date = new Date(releaseDate);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Format in user's local timezone
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      });
    }
    return 'Not set';
  };

  const handleDeleteGroup = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row expansion when clicking delete
    setShowDeleteDialog(true);
  };

  const handleScheduledGroup = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row expansion when clicking schedule
    setShowScheduledDialog(true);
  };

  const confirmDelete = () => {
    onDeleteGroup?.(group.id);
    setShowDeleteDialog(false);
  };

  const confirmSchedule = async () => {
    onScheduledGroup?.(group.id);
    setShowScheduledDialog(false);
  };

  return (
    <>
      <tr 
      className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
      onClick={() => setIsExpanded(!isExpanded)}
      >
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        <div className="flex items-center">
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 mr-2 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 mr-2 text-gray-400" />
        )}
        {group.topic_id}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {group.group_name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center">
        <Calendar className="w-4 h-4 mr-2 text-gray-600" />
        {formatReleaseDate(group.release_date)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {group.total_members || 0}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
        {group.total_amount || 0} HBAR
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {(group.status === 'upcoming' && group.scheduled === null && onDeleteGroup) && (
        <div className="flex items-center space-x-2">
          <button
          onClick={() => window.open(`https://hashscan.io/testnet/topic/${group.topic_id}`, '_blank')}
          className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1"
          title="Go to link"
          >
          <ExternalLink className="w-4 h-4" />
          </button>
          {onScheduledGroup && (
          <button
          onClick={handleScheduledGroup}
          className="text-gray-400 hover:text-green-600 transition-colors duration-200 p-1"
          title="Schedule group now"
          >
          <Play className="w-4 h-4" />
          </button>
          )}
          <button
          onClick={handleDeleteGroup}
          className="text-gray-400 hover:text-red-600 transition-colors duration-200 p-1"
          title="Delete group"
          >
          <Trash2 className="w-4 h-4" />
          </button>
        </div>
        )}
        {group.status === 'released' || group.scheduled === true && (
        <div className="flex items-center space-x-2">
          
            <button
            className="text-white p-1"
            disabled
            >
            <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.open(`https://hashscan.io/testnet/topic/${group.topic_id}`, '_blank')}
              className="text-gray-400 hover:text-blue-600 transition-colors duration-200 p-1"
              title="Go to link"
              >
            <ExternalLink className="w-4 h-4" />
          </button>
            <button
            className="text-white p-1"
            disabled
            >
            <Trash2 className="w-4 h-4" />
            </button>
        </div>
        )}
      </td>
      </tr>
      {isExpanded && (
      <tr className="bg-gray-50">
        <td colSpan={6} className="px-6 py-4">
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 mb-3">
            Members ({group.members.length})
            {group.scheduled && (
              <span className="ml-2 px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
                Scheduled
              </span>
            )}
          </h4>
          {group.members.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No members added yet</p>
          ) : (
          <div className="space-y-2">
            {group.members.map((member) => (
            <div key={member.id} className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex justify-between items-start">
              <div className="flex-1">
                <h5 className="font-medium text-gray-900">{member.name}</h5>
                <p className="text-xs text-gray-600 font-mono break-all">{member.wallet_address}</p>
              </div>
              <div className="ml-4 text-right">
                <span className="text-sm font-semibold text-gray-900">{member.amount} HBAR</span>
              </div>
              </div>
            </div>
            ))}
          </div>
          )}
        </div>
        </td>
      </tr>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
      isOpen={showDeleteDialog}
      title="Delete Group"
      message={`Are you sure you want to delete the group "${group.group_name}"? This action cannot be undone and will remove all members from this group.`}
      confirmText="Delete"
      cancelText="Cancel"
      type="danger"
      onConfirm={confirmDelete}
      onCancel={() => setShowDeleteDialog(false)}
      />

      {/* Schedule Confirmation Dialog */}
      <ConfirmationDialog
      isOpen={showScheduledDialog}
      title="Schedule Group"
      message={`Are you sure you want to schedule the group "${group.group_name}" now? This will set the release date and make the group ready for future release. You won't be able to modify the group after scheduling.`}
      confirmText="Schedule now"
      cancelText="Cancel"
      type="warning"
      onConfirm={confirmSchedule}
      onCancel={() => setShowScheduledDialog(false)}
      />
    </>
  );
};

export default StreamTableRow;