import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Coffee } from 'lucide-react';

const AgentInfoPanel = ({ user }) => {
  const [status, setStatus] = useState('Unavailable');
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [breakTime, setBreakTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isRunning && status === 'Available') {
      interval = setInterval(() => {
        setTimer(timer => timer + 1);
        setTotalTime(total => total + 1);
      }, 1000);
    } else if (isRunning && status === 'Break') {
      interval = setInterval(() => {
        setBreakTime(breakTime => breakTime + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, status]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'Available') {
      setStatus('Available');
      setIsRunning(true);
    } else if (newStatus === 'Break') {
      setStatus('Break');
      setIsRunning(true);
    } else {
      setStatus('Unavailable');
      setIsRunning(false);
    }
  };

  const getStatusColor = (currentStatus) => {
    switch (currentStatus) {
      case 'Available': return 'bg-green-500';
      case 'Break': return 'bg-yellow-500';
      case 'Unavailable': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Agent Dashboard</h1>
      
      {/* Status Controls */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Status Control</h2>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(status)}`}></div>
            <span className="text-lg font-medium text-gray-900">Current Status: {status}</span>
          </div>
          <div className="text-2xl font-mono font-bold text-gray-900">
            {formatTime(timer)}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleStatusChange('Available')}
            disabled={status === 'Available' && isRunning}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              status === 'Available' && isRunning
                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Available</span>
          </button>

          <button
            onClick={() => handleStatusChange('Break')}
            disabled={status === 'Break' && isRunning}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              status === 'Break' && isRunning
                ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Break</span>
          </button>

          <button
            onClick={() => handleStatusChange('Unavailable')}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
          >
            <Square className="w-4 h-4" />
            <span>Unavailable</span>
          </button>
        </div>
      </div>

      {/* Time Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Work Time</h3>
          <div className="text-2xl font-bold text-gray-900">{formatTime(totalTime)}</div>
          <div className="text-sm text-gray-500 mt-1">Excluding breaks</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Break Time</h3>
          <div className="text-2xl font-bold text-gray-900">{formatTime(breakTime)}</div>
          <div className="text-sm text-gray-500 mt-1">Total break duration</div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Current Session</h3>
          <div className="text-2xl font-bold text-gray-900">{formatTime(timer)}</div>
          <div className="text-sm text-gray-500 mt-1">Active session time</div>
        </div>
      </div>

    </div>
  );
};

export default AgentInfoPanel;