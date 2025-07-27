import React from 'react';

const StatCard = ({ title, value, icon: Icon, color, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer flex items-center gap-4 bg-white shadow-md rounded-2xl border-l-8 ${color} hover:shadow-lg transition-all duration-300 p-6 w-full min-h-[150px]`}
    >
      <div className="text-4xl">
        <Icon />
      </div>
      <div>
        <p className="text-gray-700 font-medium">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
