import React from 'react';

const StatCard = ({ title, value, subtext, icon, trend, color = 'brand' }) => {
  const colorMap = {
    brand: 'from-brand-500/20 to-indigo-500/5 text-brand-400 border-brand-500/20',
    cyan: 'from-cyan-500/20 to-teal-500/5 text-cyan-400 border-cyan-500/20',
    emerald: 'from-emerald-500/20 to-green-500/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/20 to-yellow-500/5 text-amber-400 border-amber-500/20',
    purple: 'from-purple-500/20 to-pink-500/5 text-purple-400 border-purple-500/20',
  };

  const selectedColor = colorMap[color] || colorMap.brand;

  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br ${selectedColor} border backdrop-blur-md shadow-lg transition-transform hover:-translate-y-1 duration-200`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-slate-900/60 shadow-inner">
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {value}
        </div>
        {subtext && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
