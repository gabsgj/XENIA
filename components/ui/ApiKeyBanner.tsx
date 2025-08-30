
import React from 'react';

const ApiKeyBanner: React.FC = () => {
  const apiKey = process.env.API_KEY;

  if (apiKey) {
    return null;
  }

  return (
    <div className="bg-yellow-600 text-white text-center p-2 text-sm">
      <strong>Warning:</strong> The <code>API_KEY</code> environment variable is not set. AI features will not work. Please configure it to use the application.
    </div>
  );
};

export default ApiKeyBanner;
