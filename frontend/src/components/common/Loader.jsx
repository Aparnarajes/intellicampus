import React from 'react';

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
      <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium animate-pulse">Loading IntelliCampus...</p>
    </div>
  );
};

export default Loader;