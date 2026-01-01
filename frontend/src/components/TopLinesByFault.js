import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TopLinesByFault = () => {
  const { faultType } = useParams();
  const navigate = useNavigate();
  const [selectedLine, setSelectedLine] = useState('');
  const [period, setPeriod] = useState('Last 3 FY Years');

  const faultDisplayNames = {
    'lightning': 'LIGHTNING',
    'vegetation': 'VEGETATION',
    'forest-fire': 'FOREST FIRE',
    'hardware': 'HARDWARE FAULT',
    'bird': 'BIRD'
  };

  // Static data for each fault type
  const staticData = {
    'lightning': [
      { rank: 1, name: '132 KV AIZAWL-TIPAIMUKH', trippings: 21 },
      { rank: 2, name: '132 KV BADARPUR-KHLIEHRIAT', trippings: 18 },
      { rank: 3, name: '132 KV KOLASIB-AIZAWL', trippings: 16 },
      { rank: 4, name: '132 KV AIZAWL-KUMARGHAT', trippings: 14 },
      { rank: 5, name: '132 KV JIRIBAM-LOKTAK II', trippings: 13 },
      { rank: 6, name: '132 KV DIMAPUR-IMPHAL', trippings: 12 },
      { rank: 7, name: '400 KV SILCHAR-PARBATI I', trippings: 11 },
      { rank: 8, name: '132 KV JIRIBAM-HAFLONG', trippings: 10 },
      { rank: 9, name: '220 KV BALAKATA-ALIPURDUAR I', trippings: 10 },
      { rank: 10, name: '220 KV BALAKATA-ALIPURDUAR II', trippings: 10 }
    ],
    'forest-fire': [
      { rank: 1, name: '132 KV DOYANG-DIMAPUR I', trippings: 9 },
      { rank: 2, name: '132 KV HAFLONG-UMRANGSO', trippings: 7 },
      { rank: 3, name: '132 KV KOLASIB-AIZAWL', trippings: 5 },
      { rank: 4, name: '132 KV LOKTAK-IMPHAL II', trippings: 4 },
      { rank: 5, name: '220 KV MARIANI-MOKOKCHUNG I', trippings: 3 },
      { rank: 6, name: '220 KV MARIANI-MOKOKCHUNG II', trippings: 2 },
      { rank: 7, name: '220 KV MISA-DIMAPUR I', trippings: 2 },
      { rank: 8, name: '220 KV MISA-DIMAPUR II', trippings: 1 },
      { rank: 9, name: '400 KV BALIPARA-BONGAIGAON III', trippings: 1 }
    ],
    'hardware': [
      { rank: 1, name: '400 KV MISA-MARIANI II', trippings: 5 },
      { rank: 2, name: '132 KV DIMAPUR-IMPHAL', trippings: 3 },
      { rank: 3, name: '400 KV BALIPARA-BONGAIGAON I', trippings: 2 },
      { rank: 4, name: '132 KV BADARPUR-KHLIEHRIAT', trippings: 1 },
      { rank: 5, name: '132 KV GOIRPUR-NIRJULI', trippings: 1 },
      { rank: 6, name: '132 KV JIRIBAM-LOKTAK II', trippings: 1 },
      { rank: 7, name: '132 KV KHANDONG-KHLIEHRIAT II', trippings: 1 },
      { rank: 8, name: '132 KV ROING-TEZU', trippings: 1 },
      { rank: 9, name: '220 KV BALIPARA-SONABIL', trippings: 1 },
      { rank: 10, name: '220 KV MISA-DIMAPUR I', trippings: 1 }
    ],
    'vegetation': [
      { rank: 1, name: '132 KV AIZAWL-TIPAIMUKH', trippings: 4 },
      { rank: 2, name: '132 KV DOYANG-DIMAPUR II', trippings: 1 },
      { rank: 3, name: '132 KV KHANDONG-KHLIEHRIAT I', trippings: 1 },
      { rank: 4, name: '132 KV ROING-TEZU', trippings: 1 },
      { rank: 5, name: '400 KV BALIPARA-BONGAIGAON IV', trippings: 1 }
    ],
    'bird': [
      { rank: 1, name: '132 KV SILCHAR-IMPHAL I', trippings: 3 },
      { rank: 2, name: '220 KV MISA-MARIANI I', trippings: 2 },
      { rank: 3, name: '132 KV JIRIBAM-HAFLONG', trippings: 1 },
      { rank: 4, name: '220 KV BALIPARA-SONABIL', trippings: 1 },
      { rank: 5, name: '400 KV BONGAIGAON-SALAKATI', trippings: 1 }
    ]
  };

  const displayName = faultDisplayNames[faultType];
  const topLines = staticData[faultType] || [];

  const filteredLines = selectedLine 
    ? topLines.filter(line => line.name === selectedLine)
    : topLines;

  const handleExport = () => {
    // Create CSV
    const headers = ['Rank', 'Line Name', 'No of Trippings'];
    const rows = filteredLines.map(line => [
      line.rank,
      `"${line.name}"`,
      line.trippings
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top_10_lines_${faultType}_${period.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Modal-style container */}
        <div className="bg-white rounded-lg shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg relative">
            <button
              onClick={() => navigate('/dashboard')}
              className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 w-10 h-10 flex items-center justify-center text-xl"
            >
              ✕
            </button>
            <h1 className="text-2xl font-bold">
              TOP 10 LINES TRIPPED DUE TO {displayName}
            </h1>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Line Name:
                </label>
                <select
                  value={selectedLine}
                  onChange={(e) => setSelectedLine(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Line Name</option>
                  {topLines.map((line, index) => (
                    <option key={index} value={line.name}>{line.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fault Period:
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Last 3 FY Years</option>
                  <option>Last 1 FY Year</option>
                  <option>Last 6 Months</option>
                  <option>Current FY Year</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleExport}
                  className="w-full bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors font-semibold shadow-md"
                >
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {filteredLines.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-green-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-center font-bold w-20">#</th>
                    <th className="px-6 py-4 text-left font-bold">Line Name</th>
                    <th className="px-6 py-4 text-center font-bold w-48">No of Trippings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLines.map((line, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 text-center font-semibold text-gray-700">
                        {line.rank}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        {line.name}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-700 font-bold text-lg">
                          {line.trippings}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-lg">No data found for selected filters</p>
            </div>
          )}

          {/* Footer */}
          <div className="bg-green-600 text-white px-6 py-3 font-bold rounded-b-lg">
            SHOWING {filteredLines.length} OF {topLines.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopLinesByFault;