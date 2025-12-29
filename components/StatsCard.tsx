import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  caption?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, colorClass, caption }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${colorClass} bg-opacity-10`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {caption && (
          <p className="text-xs text-slate-400 mt-1 font-medium">{caption}</p>
        )}
      </div>
    </div>
  );
};