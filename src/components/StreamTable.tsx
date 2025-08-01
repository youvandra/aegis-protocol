import React from 'react';
import StreamTableRow from './StreamTableRow';
import { Group } from '../types/stream';

interface StreamTableProps {
  data: Group[];
  onDeleteGroup?: (groupId: string) => void;
}

const StreamTable: React.FC<StreamTableProps> = ({ data, onDeleteGroup }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Group Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Release Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((group) => (
                <StreamTableRow 
                  key={group.id} 
                  group={group} 
                  onDeleteGroup={onDeleteGroup}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StreamTable;