import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import LiveClock from './LiveClock';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
};

  const navItems = [
    { path: '/', label: 'TL Dashboard', labelHindi: 'डैशबोर्ड', icon: '📊', adminOnly: false },
    { path: '/tripping-data', label: 'Tripping Data', labelHindi: 'ट्रिपिंग डेटा', icon: '⚡', adminOnly: false },
    { path: '/availability', label: 'Availability', labelHindi: 'उपलब्धता', icon: '📈', adminOnly: false },
    { path: '/line-details', label: 'Line Details', labelHindi: 'लाइन विवरण', icon: '📋', adminOnly: true },
    { path: '/tower-locations', label: 'Tower Locations', labelHindi: 'टावर स्थान', icon: '📍', adminOnly: false },
    { path: '/ai-maintenance', label: 'AI Predictions', labelHindi: 'एआई भविष्यवाणी', icon: '🤖', adminOnly: false },
    { path: '/ai-chatbot', label: 'AI Chatbot', labelHindi: 'एआई चैटबॉट', icon: '💬', adminOnly: false }

  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-teal-700 text-white shadow-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Title */}
<div className="flex items-center space-x-4">
  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
    <img 
      src="/images/powergrid-logo.png" 
      alt="PowerGrid" 
      className="w-full h-full object-cover"
    />
  </div>
  <div>
    <h1 className="text-2xl font-bold">T-LAMP-PG</h1>
    <p className="text-sm text-blue-100">
      ट्रांसमिशन लाइन एसेट मैनेजमेंट पोर्टल - पॉवरग्रिड
    </p>
    <p className="text-xs text-blue-200 opacity-90">
      Transmission Line Asset Management Portal - PowerGrid
    </p>
  </div>
</div>
            
            
            {/* User Info and Clock */}
            <div className="flex items-center space-x-6">
              <LiveClock />
              
              {/* User Profile */}
              <div className="flex items-center space-x-3 bg-white bg-opacity-20 backdrop-blur-sm px-5 py-3 rounded-lg shadow-lg border border-white border-opacity-30">
                <div className="text-right">
                  <div className="text-sm font-bold">{user?.full_name || user?.username}</div>
                  <div className="text-xs text-blue-200">
                    {user?.designation} | {user?.department}
                  </div>
                  <div className="text-xs mt-1">
                    {isAdmin ? (
                      <span className="bg-yellow-400 text-blue-900 px-2 py-0.5 rounded font-bold">
                        👑 ADMIN
                      </span>
                    ) : (
                      <span className="bg-green-400 text-blue-900 px-2 py-0.5 rounded font-semibold">
                        👤 VIEWER
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all transform hover:scale-105 shadow-md flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-header with developer info */}
        <div className="bg-blue-950 bg-opacity-60 px-4 py-2 text-center border-t border-white border-opacity-10">
          <p className="text-xs opacity-90">
            Software Development by <span className="font-bold text-yellow-300">Information Technology Department</span>, North Eastern Region
          </p>
          <p className="text-xs opacity-75 mt-0.5">
            सॉफ्टवेयर विकास सूचना प्रौद्योगिकी विभाग द्वारा, उत्तर पूर्वी क्षेत्र
          </p>
        </div>

        {/* Navigation */}
        <nav className="bg-gradient-to-r from-blue-800 to-blue-900 shadow-inner">
          <div className="container mx-auto px-4">
            <ul className="flex space-x-1 overflow-x-auto">
              {navItems.map((item) => {
                // Hide admin-only items from non-admin users
                if (item.adminOnly && !isAdmin) return null;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-2 px-5 py-3 font-medium transition-all transform hover:scale-105 whitespace-nowrap ${
                        location.pathname === item.path
                          ? 'bg-white text-blue-900 shadow-lg rounded-t-lg'
                          : 'text-white hover:bg-blue-700 hover:shadow-md'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="text-left">
                        <div className="text-sm font-bold">{item.label}</div>
                        <div className="text-xs opacity-75">{item.labelHindi}</div>
                      </div>
                      {item.adminOnly && isAdmin && (
                        <span className="ml-2 bg-yellow-400 text-blue-900 px-1.5 py-0.5 rounded text-xs font-bold">
                          ADMIN
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white mt-12 border-t-4 border-blue-600">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            {/* About Section */}
<div>
  <div className="flex items-center space-x-3 mb-4">
    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg overflow-hidden">
      <img 
        src="/images/powergrid-logo.png" 
        alt="PowerGrid" 
        className="w-full h-full object-cover"
      />
    </div>
    <div>
      <h3 className="font-bold text-lg">T-LAMP-PG</h3>
    </div>
  </div>
  <p className="text-sm text-gray-300">
    Transmission Line Asset Management Portal for PowerGrid Corporation of India Limited.
  </p>
  <p className="text-sm text-gray-400 mt-2">
    ट्रांसमिशन लाइन एसेट मैनेजमेंट पोर्टल
  </p>
  <p className="text-xs text-gray-500 mt-3">
    A Government of India Enterprise
  </p>
</div>

            {/* Quick Links */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-blue-300">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <span>📚</span>
                    <span>Help & Support / सहायता</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <span>📖</span>
                    <span>Documentation / प्रलेखन</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <span>🔒</span>
                    <span>Privacy Policy / गोपनीयता नीति</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <span>📜</span>
                    <span>Terms of Service / सेवा की शर्तें</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* User Info & Contact */}
            <div>
              <h3 className="font-bold text-lg mb-4 text-blue-300">User Information</h3>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400">👤</span>
                    <span className="text-gray-300">Logged in as:</span>
                  </div>
                  <div className="text-white font-semibold">{user?.full_name}</div>
                  <div className="text-gray-400 text-xs">{user?.email}</div>
                  <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-700">
                    <span className="text-blue-400">🏢</span>
                    <span className="text-gray-300 text-xs">
                      {user?.designation} | {user?.department}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400">🔑</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      isAdmin ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-gray-400">
                <p>📧 Email: support@powergrid.in</p>
                <p className="mt-1">📞 Helpline: 1800-123-4567</p>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-400">
                  © {new Date().getFullYear()} Power Grid Corporation of India Limited. All Rights Reserved.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  © {new Date().getFullYear()} पावर ग्रिड कॉर्पोरेशन ऑफ इंडिया लिमिटेड। सर्वाधिकार सुरक्षित।
                </p>
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-400">
                <span>Version 1.0.0</span>
                <span>•</span>
                <span>Last Updated: {new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
