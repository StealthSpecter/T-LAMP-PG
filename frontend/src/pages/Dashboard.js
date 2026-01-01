import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';


const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [trippingStats, setTrippingStats] = useState(null);
  const [stateData, setStateData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const dashboardData = await api.getDashboardStats();
      setStats(dashboardData);
      
      const incidents = await api.getTrippingIncidents({});
      processTrippingStats(incidents);
      
      const states = await api.getStates();
      const lines = await api.getTransmissionLines({});
      processStateData(states, lines);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const processTrippingStats = (incidents) => {
    const currentYear = new Date().getFullYear();
    const stats = {
      lightning: 0,
      vegetation: 0,
      hardwareFault: 0,
      others: 0,
      attriToPowerGrid: 0,
      totalTrippings: incidents.length,
      currentYearTrippings: 0,
      lastYearTrippings: 0,
      thisMonthTrippings: 0,
      lastYearSameMonthTrippings: 0
    };

    const currentMonth = new Date().getMonth();

    incidents.forEach(incident => {
      const incidentDate = new Date(incident.fault_date);
      const incidentYear = incidentDate.getFullYear();
      const incidentMonth = incidentDate.getMonth();

      // Count by fault type
      if (incident.fault_type === 'LIGHTNING') stats.lightning++;
      else if (incident.fault_type === 'VEGETATION') stats.vegetation++;
      else if (incident.fault_type === 'HARDWARE FAULT') stats.hardwareFault++;
      else stats.others++;

      // Count attributed to PowerGrid
      if (incident.attributed_to_powergrid === 'YES') stats.attriToPowerGrid++;

      // Current year trippings
      if (incidentYear === currentYear) {
        stats.currentYearTrippings++;
        if (incidentMonth === currentMonth) stats.thisMonthTrippings++;
      }

      // Last year trippings
      if (incidentYear === currentYear - 1) {
        stats.lastYearTrippings++;
        if (incidentMonth === currentMonth) stats.lastYearSameMonthTrippings++;
      }
    });

    setTrippingStats(stats);
  };

  const processStateData = (states, lines) => {
    const stateMap = {};
    states.forEach(state => {
      stateMap[state.name] = {
        name: state.name,
        code: state.code,
        count: 0,
        icon: getStateIcon(state.name)
      };
    });

    lines.forEach(line => {
      if (stateMap[line.state_name]) {
        stateMap[line.state_name].count++;
      }
    });

    setStateData(Object.values(stateMap));
  };

  const getStateIcon = (stateName) => {
    const icons = {
      'Arunachal Pradesh': '🏔️',
      'Assam': '🌾',
      'Manipur': '💃',
      'Meghalaya': '🌧️',
      'Mizoram': '🌺',
      'Nagaland': '🎭',
      'Tripura': '🏛️'
    };
    return icons[stateName] || '📍';
  };

  const dashboardCards = [
    { title: 'LINE ASSET', titleHindi: 'लाइन एसेट', icon: '🎯', path: '/dashboard/line-asset', color: 'from-blue-500 to-blue-600' },
    { title: 'TRIPPING GRAPH', titleHindi: 'ट्रिपिंग ग्राफ', icon: '📊', path: '/dashboard/tripping-graph', color: 'from-green-500 to-green-600' },
    { title: 'AVAILABILITY GRAPH', titleHindi: 'उपलब्धता ग्राफ', icon: '📈', path: '/dashboard/availability-graph', color: 'from-red-500 to-red-600' },
    { title: 'GIS MAPPING', titleHindi: 'जीआईएस मैपिंग', icon: '🗺️', path: '/dashboard/gis-mapping', color: 'from-purple-500 to-purple-600' },
    { title: 'TYPE OF FAULT', titleHindi: 'फॉल्ट का प्रकार', icon: '⚠️', path: '/dashboard/fault-types', color: 'from-yellow-500 to-yellow-600' },
    { title: 'TL PERFORMANCE', titleHindi: 'टीएल प्रदर्शन', icon: '📉', path: '/dashboard/tl-performance', color: 'from-indigo-500 to-indigo-600' },
    { title: 'TL TOWER LOCATOR', titleHindi: 'टावर लोकेटर', icon: '📍', path: '/dashboard/tower-locator', color: 'from-pink-500 to-pink-600' },
    { title: 'TOTAL LINE UNDER TL OFFICE', titleHindi: 'कुल लाइनें', icon: '📋', path: '/dashboard/office-lines', color: 'from-teal-500 to-teal-600' }
  ];

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-xl">Loading dashboard...</div>
    </div>
  );

  return (
    <div className="space-y-6 bg-gray-50 pb-8">
      {/* Live Clock Display */}
      <div className="bg-white rounded-lg shadow-md p-4 text-right">
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div className="text-2xl font-bold text-blue-600">
          {new Date().toLocaleTimeString('en-IN')}
        </div>
      </div>

      {/* NERTS Transmission Line Asset Data */}
      <div className="bg-white rounded-lg shadow-xl p-6 border-t-4 border-blue-600">
        <h2 className="text-2xl font-bold text-center mb-4 text-blue-600">
          NERTS TRANSMISSION LINE ASSET DATA
        </h2>
        <h3 className="text-lg text-center mb-6 text-gray-600">
          एनईआरटीएस ट्रांसमिशन लाइन एसेट डेटा
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                <th className="border border-green-700 p-3 text-left">Category</th>
                <th className="border border-green-700 p-3 text-center font-bold text-lg">TOTAL</th>
                <th className="border border-green-700 p-3 text-center">800 kV</th>
                <th className="border border-green-700 p-3 text-center">400 kV</th>
                <th className="border border-green-700 p-3 text-center">220 kV</th>
                <th className="border border-green-700 p-3 text-center">132 kV</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 p-3 font-semibold">NO. OF TL:</td>
                <td className="border border-gray-300 p-3 text-center font-bold text-xl text-red-600">
                  {stats?.total_lines || 115}
                </td>
                <td className="border border-gray-300 p-3 text-center text-purple-600 font-bold">2</td>
                <td className="border border-gray-300 p-3 text-center text-green-600 font-bold">32</td>
                <td className="border border-gray-300 p-3 text-center text-blue-600 font-bold">19</td>
                <td className="border border-gray-300 p-3 text-center text-red-600 font-bold">62</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 p-3 font-semibold">TOTAL CKT. KM:</td>
                <td className="border border-gray-300 p-3 text-center font-bold text-xl text-red-600">
                  {stats?.total_km.toFixed(0) || 8805}
                </td>
                <td className="border border-gray-300 p-3 text-center text-purple-600 font-bold">767</td>
                <td className="border border-gray-300 p-3 text-center text-green-600 font-bold">4145</td>
                <td className="border border-gray-300 p-3 text-center text-blue-600 font-bold">1100</td>
                <td className="border border-gray-300 p-3 text-center text-red-600 font-bold">2794</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Tripping Statistics */}
      {trippingStats && (
        <div className="bg-white rounded-lg shadow-xl p-6 border-t-4 border-green-600">
          <h2 className="text-2xl font-bold text-center mb-4 text-green-600">
            TRIPPING STATISTICS OF NERTS (FY: 2025-2026)
          </h2>
          <h3 className="text-lg text-center mb-6 text-gray-600">
            एनईआरटीएस की ट्रिपिंग सांख्यिकी (वित्त वर्ष: 2025-2026)
          </h3>

          {/* Icon Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg p-6 text-center text-white shadow-lg transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-2">⚡</div>
              <div className="text-4xl font-bold">{trippingStats.lightning}</div>
              <div className="text-sm mt-2">LIGHTNING<br/>बिजली</div>
            </div>

            <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-6 text-center text-white shadow-lg transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-2">🌳</div>
              <div className="text-4xl font-bold">{trippingStats.vegetation}</div>
              <div className="text-sm mt-2">VEGETATION<br/>वनस्पति</div>
            </div>

            <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-lg p-6 text-center text-white shadow-lg transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-2">⚙️</div>
              <div className="text-4xl font-bold">{trippingStats.hardwareFault}</div>
              <div className="text-sm mt-2">HARDWARE FAULT<br/>हार्डवेयर फॉल्ट</div>
            </div>

            <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg p-6 text-center text-white shadow-lg transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-2">📚</div>
              <div className="text-4xl font-bold">{trippingStats.others}</div>
              <div className="text-sm mt-2">OTHERS<br/>अन्य</div>
            </div>

            <div className="bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-lg p-6 text-center text-white shadow-lg transform hover:scale-105 transition-transform">
              <div className="text-5xl mb-2">🏢</div>
              <div className="text-4xl font-bold">{trippingStats.attriToPowerGrid}</div>
              <div className="text-sm mt-2">ATTRI. TO POWERGRID<br/>पावरग्रिड को जिम्मेदार</div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="text-sm text-gray-600">Pending Patrolling Findings</div>
              <div className="text-sm text-gray-600">लंबित गश्त निष्कर्ष</div>
              <div className="text-2xl font-bold text-blue-600">108</div>
            </div>

            <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
              <div className="text-sm text-gray-600">Mal-operations</div>
              <div className="text-sm text-gray-600">गलत संचालन</div>
              <div className="text-2xl font-bold text-orange-600">0</div>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="text-sm text-gray-600">Successful AR</div>
              <div className="text-sm text-gray-600">सफल एआर</div>
              <div className="text-2xl font-bold text-green-600">74</div>
            </div>

            <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
              <div className="text-sm text-gray-600">Trippings Non-Attri. to PowerGrid</div>
              <div className="text-sm text-gray-600">गैर-जिम्मेदार ट्रिपिंग</div>
              <div className="text-2xl font-bold text-purple-600">130</div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="text-sm text-gray-600">Total Trippings</div>
              <div className="text-sm text-gray-600">कुल ट्रिपिंग</div>
              <div className="text-2xl font-bold text-red-600">{trippingStats.totalTrippings}</div>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - State Data and Map */}
        <div className="lg:col-span-1 space-y-6">
          {/* Statewise Line Data */}
          <div className="bg-white rounded-lg shadow-xl p-6 border-t-4 border-yellow-600">
            <h3 className="text-xl font-bold mb-4 text-yellow-600">
              STATEWISE LINE DATA
            </h3>
            <h4 className="text-sm mb-4 text-gray-600">
              राज्यवार लाइन डेटा
            </h4>
            <div className="space-y-3">
              {stateData.map((state, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{state.icon}</span>
                    <span className="font-semibold text-gray-800">{state.name}</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{state.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="bg-white rounded-lg shadow-xl p-6 border-t-4 border-green-600">
            <h3 className="text-xl font-bold mb-4 text-green-600">
              NORTHEAST REGION MAP
            </h3>
            <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🗺️</div>
              <div className="text-gray-600">
                Interactive map showing transmission lines across NER states
              </div>
              <Link 
                to="/dashboard/gis-mapping" 
                className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                View Full Map
              </Link>
            </div>
          </div>
        </div>

        {/* Middle Column - Information Dashboard Cards */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-xl p-6 text-white mb-6">
            <h2 className="text-2xl font-bold mb-2">
              INFORMATION DASHBOARD
            </h2>
            <p className="text-sm opacity-90">
              सूचना डैशबोर्ड
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {dashboardCards.map((card, index) => (
              <Link
                key={index}
                to={card.path}
                className="group"
              >
                <div className={`bg-gradient-to-br ${card.color} rounded-lg shadow-lg p-4 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer`}>
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center">
                      <div className="text-3xl mr-4">{card.icon}</div>
                      <div>
                        <div className="font-bold text-lg">{card.title}</div>
                        <div className="text-sm opacity-90">{card.titleHindi}</div>
                      </div>
                    </div>
                    <div className="opacity-75 group-hover:opacity-100 transition-opacity">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column - Analytics and Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Analytic Tools */}
          <div className="bg-white rounded-lg shadow-xl p-6 border-t-4 border-purple-600">
            <h3 className="text-xl font-bold mb-4 text-purple-600">
              ANALYTIC TOOLS
            </h3>
            <h4 className="text-sm mb-4 text-gray-600">
              विश्लेषणात्मक उपकरण
            </h4>
            <div className="space-y-2">
              <div className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <span className="text-2xl mr-3">👥</span>
                <span className="font-semibold">MANPOWER & VEHICLE</span>
              </div>
              <div className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <span className="text-2xl mr-3">⚡</span>
                <span className="font-semibold">TRIPPING</span>
              </div>
              <div className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <span className="text-2xl mr-3">💾</span>
                <span className="font-semibold">TOWER VULNERABILITY</span>
              </div>
              <div className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <span className="text-2xl mr-3">🛡️</span>
                <span className="font-semibold">RISK MITIGATION</span>
              </div>
            </div>
          </div>

          {/* Technical Documents */}
          <div className="bg-white rounded-lg shadow-xl p-6 border-t-4 border-teal-600">
            <h3 className="text-xl font-bold mb-4 text-teal-600">
              TECHNICAL DOCUMENTS
            </h3>
            <h4 className="text-sm mb-4 text-gray-600">
              तकनीकी दस्तावेज़
            </h4>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
                <span className="text-2xl mr-3">⚡</span>
                <span className="font-semibold">TRANSMISSION LINE</span>
              </div>
              <div className="flex items-center p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
                <span className="text-2xl mr-3">🛡️</span>
                <span className="font-semibold">SAFETY</span>
              </div>
            </div>
          </div>

          {/* Tripping Comparisons */}
          {trippingStats && (
            <>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-2">
                  NER TRIPPING STATS
                </h3>
                <h4 className="text-xs mb-4 opacity-90">
                  (FY: 2024-2025: ATT. TO POWERGRID)
                </h4>
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">{trippingStats.lastYearTrippings}</div>
                  <div className="text-sm">Total Trippings of Previous FY</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-xl p-6 border-t-4 border-orange-600">
                <h3 className="text-lg font-bold mb-4 text-orange-600">
                  TRIPPINGS THIS MONTH
                </h3>
                <h4 className="text-sm mb-4 text-gray-600">
                  इस महीने की ट्रिपिंग (ATT. TO POWERGRID)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-4xl font-bold text-orange-600">{trippingStats.thisMonthTrippings}</div>
                    <div className="text-sm text-gray-600 mt-2">CURRENT YEAR</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-4xl font-bold text-gray-600">{trippingStats.lastYearSameMonthTrippings}</div>
                    <div className="text-sm text-gray-600 mt-2">LAST YEAR</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top 10 Lines Section */}
      <div className="bg-white rounded-lg shadow-xl p-6 border-t-4 border-red-600">
        <h3 className="text-2xl font-bold mb-4 text-red-600">
          TOP 10 LINES CONTRIBUTING IN LAST 3 FIN YEARS
        </h3>
        <h4 className="text-lg mb-6 text-gray-600">
          पिछले 3 वित्तीय वर्षों में योगदान देने वाली शीर्ष 10 लाइनें
        </h4>
        
        
            

{/* Lightning Button */}
<Link to="/top-lines/lightning" className="flex items-center p-4 bg-yellow-50 rounded-lg hover:shadow-lg transition-all cursor-pointer">
  <span className="text-3xl mr-3">⚡</span>
  <div>
    <div className="text-sm text-gray-600">LIGHTNING</div>
    <div className="text-sm text-gray-600">बिजली</div>
  </div>
</Link>

{/* Vegetation Button */}
<Link to="/top-lines/vegetation" className="flex items-center p-4 bg-green-50 rounded-lg hover:shadow-lg transition-all cursor-pointer">
  <span className="text-3xl mr-3">🌳</span>
  <div>
    <div className="text-sm text-gray-600">VEGETATION</div>
    <div className="text-sm text-gray-600">वनस्पति</div>
  </div>
</Link>

{/* Forest Fire Button */}
<Link to="/top-lines/forest-fire" className="flex items-center p-4 bg-orange-50 rounded-lg hover:shadow-lg transition-all cursor-pointer">
  <span className="text-3xl mr-3">🔥</span>
  <div>
    <div className="text-sm text-gray-600">FOREST FIRE</div>
    <div className="text-sm text-gray-600">जंगल की आग</div>
  </div>
</Link>

{/* Hardware Fault Button */}
<Link to="/top-lines/hardware" className="flex items-center p-4 bg-red-50 rounded-lg hover:shadow-lg transition-all cursor-pointer">
  <span className="text-3xl mr-3">⚙️</span>
  <div>
    <div className="text-sm text-gray-600">HARDWARE FAULT</div>
    <div className="text-sm text-gray-600">हार्डवेयर खराबी</div>
  </div>
</Link>
  

        

        <Link 
          to="/dashboard/tripping-graph" 
          className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
        >
          View Detailed Analysis →
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
