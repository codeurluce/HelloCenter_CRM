import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  tooltip: string;
  colorClass?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon, tooltip, colorClass = 'blue-600' }) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border border-${colorClass}-100 text-${colorClass} hover:bg-${colorClass} hover:text-white
                  transition-transform transform focus:outline-none focus:ring-2 focus:ring-offset-1 hover:scale-105`}
    >
      {icon}
    </button>
    <span className={`pointer-events-none absolute -top-9 right-0 hidden group-hover:block px-2 py-1 rounded shadow-lg bg-${colorClass} text-white text-xs whitespace-nowrap`}>
      {tooltip}
    </span>
  </div>
);
