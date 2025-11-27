import React from "react";

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  tooltip: string;
  color?: "blue" | "green" | "orange" | "purple";
}

const COLOR_STYLES = {
  blue: {
    border: "border-blue-100",
    text: "text-blue-600",
    bg: "bg-blue-600",
  },
  green: {
    border: "border-green-100",
    text: "text-green-600",
    bg: "bg-green-600",
  },
  orange: {
    border: "border-orange-100",
    text: "text-orange-600",
    bg: "bg-orange-600",
  },
  purple: {
    border: "border-purple-100",
    text: "text-purple-600",
    bg: "bg-purple-600",
    hover: "hover:bg-purple-600",
  },
} as const;

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  icon,
  tooltip,
  color = "blue",
}) => {
  const c = COLOR_STYLES[color];

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`
          px-3 py-1.5 rounded-lg border 
          ${c.border} ${c.text}
          ${"hover:" + c.bg} hover:text-white
          transition-transform transform 
          focus:outline-none focus:ring-2 focus:ring-offset-1 
          hover:scale-105
        `}
      >
        {icon}
      </button>

      <span
        className={`
          pointer-events-none absolute -top-9 right-0 
          hidden group-hover:block 
          px-2 py-1 rounded shadow-lg 
          ${c.bg} text-white text-xs whitespace-nowrap
        `}
      >
        {tooltip}
      </span>
    </div>
  );
};
