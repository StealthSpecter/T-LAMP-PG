import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AIModelMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const data = await api.getAIModelMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-8">Loading model metrics...</div>;

  if (metrics?.error) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>{metrics.error}</strong>
            </p>
            <p className="text-sm text-yellow-600 mt-1">{metrics.message}</p>
            <p className="text-xs text-yellow-500 mt-1">
              Current samples: {metrics.current_samples}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  const riskData = [
    { name: 'Low Risk', value: metrics.risk_distribution.low },
    { name: 'Medium Risk', value: metrics.risk_distribution.medium },
    { name: 'High Risk', value: metrics.risk_distribution.high }
  ];

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 0.8) return 'bg-green-100';
    if (score >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`rounded-lg shadow p-6 ${getScoreBg(metrics.accuracy)}`}>
          <div className="text-sm text-gray-600 mb-1">Accuracy</div>
          <div className={`text-3xl font-bold ${getScoreColor(metrics.accuracy)}`}>
            {(metrics.accuracy * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-2">Overall correctness</div>
        </div>

        <div className={`rounded-lg shadow p-6 ${getScoreBg(metrics.precision)}`}>
          <div className="text-sm text-gray-600 mb-1">Precision</div>
          <div className={`text-3xl font-bold ${getScoreColor(metrics.precision)}`}>
            {(metrics.precision * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-2">Positive prediction accuracy</div>
        </div>

        <div className={`rounded-lg shadow p-6 ${getScoreBg(metrics.recall)}`}>
          <div className="text-sm text-gray-600 mb-1">Recall</div>
          <div className={`text-3xl font-bold ${getScoreColor(metrics.recall)}`}>
            {(metrics.recall * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-2">Coverage of actual positives</div>
        </div>

        <div className={`rounded-lg shadow p-6 ${getScoreBg(metrics.f1_score)}`}>
          <div className="text-sm text-gray-600 mb-1">F1 Score</div>
          <div className={`text-3xl font-bold ${getScoreColor(metrics.f1_score)}`}>
            {(metrics.f1_score * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-2">Harmonic mean</div>
        </div>
      </div>

      {/* Data Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature Importance */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Feature Importance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.feature_importance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="importance" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={riskData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {riskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dataset Info */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Dataset Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-sm text-gray-600">Total Samples</div>
            <div className="text-2xl font-bold text-blue-600">{metrics.total_samples}</div>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <div className="text-sm text-gray-600">Training Samples</div>
            <div className="text-2xl font-bold text-green-600">{metrics.training_samples}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <div className="text-sm text-gray-600">Test Samples</div>
            <div className="text-2xl font-bold text-purple-600">{metrics.test_samples}</div>
          </div>
        </div>
      </div>

      {/* Model Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded">
        <h4 className="font-bold text-blue-900 mb-2">📊 Model Information</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Algorithm: Random Forest Classifier (100 trees)</li>
          <li>• Features: {metrics.feature_importance.length} predictive factors</li>
          <li>• Training Method: Supervised Learning with historical data</li>
          <li>• Update Frequency: Retrain when new data is added</li>
        </ul>
      </div>
    </div>
  );
};

export default AIModelMetrics;
