import React from "react";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-xl mb-4 mx-auto animate-pulse">
          <img
            src={"coffee-logo-bean-64.png"}
            className="w-16 h-16 rounded-full"
          />
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Coffee.ai...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
