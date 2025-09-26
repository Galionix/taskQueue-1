import React from 'react';
import { Link } from 'react-router-dom';
import { Monitor } from 'lucide-react';

const BrowsersMenuItem: React.FC = () => {
  return (
    <Link
      to="/browsers"
      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <Monitor size={20} />
      <span>Браузеры</span>
    </Link>
  );
};

export default BrowsersMenuItem;
