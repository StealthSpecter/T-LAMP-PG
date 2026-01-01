import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import AIModelMetrics from './AIModelMetrics';

const AIPredictiveMaintenance = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [activeTab, setActiveTab] = useState('predictions');

  useEffect(() => {
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    try {
      const response = await api.getAIPredictions();  // Use the specific method
      setPredictions(response.predictions);
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const trainModel = async () => {
    if (!window.confirm('This will retrain the AI model. Continue?')) return;
    
    setTraining(true);
    try {
      const response = await api.trainAIModel();  // Use the specific method
      alert('Model trained successfully!');
      fetchPredictions();
    } catch (err) {
      alert('Failed to train model: ' + (err.response?.data?.detail || err.message));
    } finally {
      setTraining(false);
    }
  };

  const getRiskBadge = (risk) => {
    const badges = {
      0: { label: 'Low Risk', color: 'bg-green-100 text-green-800' },
      1: { label: 'Medium Risk', color: 'bg-yellow-100 text-yellow-800' },
      2: { label: 'High Risk', color: 'bg-red-100 text-red-800' }
    };
    return badges[risk] || badges[0];
  };

  if (loading) return <div className="text-center p-8">Loading AI predictions...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <span className="mr-3">🤖</span>
              AI PREDICTIVE MAINTENANCE
            </h1>
            <p className="text-sm opacity-90">
              Machine Learning powered maintenance predictions
            </p>
          </div>
          <button
            onClick={trainModel}
            disabled={training}
            className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all disabled:opacity-50"
          >
            {training ? 'Training...' : '🎓 Train Model'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">High Risk Lines</div>
          <div className="text-3xl font-bold text-red-600">
            {predictions.filter(p => p.predicted_risk === 2).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Medium Risk Lines</div>
          <div className="text-3xl font-bold text-yellow-600">
            {predictions.filter(p => p.predicted_risk === 1).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Low Risk Lines</div>
          <div className="text-3xl font-bold text-green-600">
            {predictions.filter(p => p.predicted_risk === 0).length}
          </div>
        </div>
      </div>

      {/* Predictions Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            Maintenance Recommendations
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Line Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Voltage Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age (Years)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recent Incidents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {predictions
                .sort((a, b) => b.predicted_risk - a.predicted_risk)
                .map((pred, index) => {
                  const risk = getRiskBadge(pred.predicted_risk);
                  return (
                    <tr key={pred.line_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-2xl">{index + 1}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold">
                        {pred.line_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pred.voltage_level}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pred.line_age.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-red-600 font-bold">
                          {pred.recent_incidents}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${risk.color}`}>
                          {risk.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{ width: `${pred.risk_probability * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {(pred.risk_probability * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AIPredictiveMaintenance;
