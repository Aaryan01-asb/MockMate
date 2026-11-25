import React from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export default function ScoreRadar({ radar = {} }) {
  const data = [
    { axis: 'Relevance', score: Number(radar.relevance) || 0 },
    { axis: 'Technical', score: Number(radar.technical) || 0 },
    { axis: 'Clarity', score: Number(radar.clarity) || 0 },
    { axis: 'Communication', score: Number(radar.communication) || 0 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-1">Answer Quality Breakdown</h2>
      <p className="text-xs text-slate-500 mb-4">Average scores across evaluated answers (0–10)</p>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 10]}
              tickCount={6}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#4f46e5"
              fill="#4f46e5"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Tooltip
              formatter={(value) => [`${value} / 10`, 'Score']}
              contentStyle={{
                borderRadius: '0.75rem',
                borderColor: '#e2e8f0',
                fontSize: '12px',
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
