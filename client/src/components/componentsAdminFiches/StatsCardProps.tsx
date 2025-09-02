import React from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'yellow' | 'amber' | 'green' | 'gray';
  isActive?: boolean;
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  isActive = false,
  onClick
}) => {
  const colorClasses = {
    blue: {
      bg: isActive ? 'bg-blue-50' : 'bg-white',
      border: isActive ? 'border-blue-200' : 'border-gray-200',
      iconBg: isActive ? 'bg-blue-100' : 'bg-blue-100',
      iconColor: 'text-blue-600',
      valueColor: isActive ? 'text-blue-600' : 'text-gray-900',
      titleColor: isActive ? 'text-blue-600' : 'text-gray-600'
    },
    purple: {
      bg: isActive ? 'bg-purple-50' : 'bg-white',
      border: isActive ? 'border-purple-200' : 'border-gray-200',
      iconBg: isActive ? 'bg-purple-100' : 'bg-purple-100',
      iconColor: 'text-purple-600',
      valueColor: isActive ? 'text-purple-600' : 'text-gray-900',
      titleColor: isActive ? 'text-purple-600' : 'text-gray-600'
    },
    yellow: {
      bg: isActive ? 'bg-yellow-50' : 'bg-white',
      border: isActive ? 'border-yellow-200' : 'border-gray-200',
      iconBg: isActive ? 'bg-yellow-100' : 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      valueColor: isActive ? 'text-yellow-600' : 'text-gray-900',
      titleColor: isActive ? 'text-yellow-600' : 'text-gray-600'
    },
    amber: {
      bg: isActive ? 'bg-amber-50' : 'bg-white',
      border: isActive ? 'border-amber-200' : 'border-gray-200',
      iconBg: isActive ? 'bg-amber-100' : 'bg-amber-100',
      iconColor: 'text-amber-600',
      valueColor: isActive ? 'text-amber-600' : 'text-gray-900',
      titleColor: isActive ? 'text-amber-600' : 'text-gray-600'
    },
    green: {
      bg: isActive ? 'bg-green-50' : 'bg-white',
      border: isActive ? 'border-green-200' : 'border-gray-200',
      iconBg: isActive ? 'bg-green-100' : 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: isActive ? 'text-green-600' : 'text-gray-900',
      titleColor: isActive ? 'text-green-600' : 'text-gray-600'
    },
    gray: {
      bg: isActive ? 'bg-gray-50' : 'bg-white',
      border: isActive ? 'border-gray-300' : 'border-gray-200',
      iconBg: isActive ? 'bg-gray-200' : 'bg-gray-100',
      iconColor: 'text-gray-600',
      valueColor: isActive ? 'text-gray-700' : 'text-gray-900',
      titleColor: isActive ? 'text-gray-700' : 'text-gray-600'
    }
  };

  const classes = colorClasses[color];

  return (
    <div
      className={`${classes.bg} ${classes.border} border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:shadow-lg' : ''
      } ${isActive ? 'shadow-sm' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${classes.iconBg}`}>
          <div className={classes.iconColor}>
            {icon}
          </div>
        </div>
        <div>
          <div className={`text-2xl font-bold ${classes.valueColor}`}>
            {value}
          </div>
          <div className={`text-sm ${classes.titleColor} font-medium`}>
            {title}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;