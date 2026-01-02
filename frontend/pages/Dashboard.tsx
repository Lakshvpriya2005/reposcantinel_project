import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface Finding {
  id: string;
  issue: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  filePath: string;
  lineNumber: number;
  insight: string;
  recommendation: string;
}
interface DashboardData {
  projectName: string;
  scanDate: string;
  filesScanned: number;
  linesOfCode: number;
  riskScore: number;
  totalFindings: number;
  criticalThreats: number;
  languageSplit: Record<string, number>;
  severityTrends: { severity: string; count: number }[]; // Keeping the type, but removing the chart display
  findings: Finding[];
  scanId: number;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [detail, setDetail] = useState<Finding | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Fetches current dashboard data, consistent with the /dashboard route
        const res = await fetch('http://localhost:5000/api/dashboard/current');
        const json = await res.json();
        if (!json.success) {
          setError(json.message || 'No data');
        } else {
          setData(json.data);
        }
      } catch {
        setError('Failed to fetch dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-4 border-cyan-400"></div>
      </div>
    );
  if (error || !data)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">{error || 'No data available'}</p>
      </div>
    );

  // Chart data (only Pie chart data is now needed for display)
  const pieLabels = Object.keys(data.languageSplit);
  const pieValues = Object.values(data.languageSplit);
  const pieColors = ['#06b6d4', '#8b5cf6', '#f59e0b', '#22c55e'];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* header & downloads */}
        <div className="bg-slate-800/40 backdrop-blur-xl p-6 rounded-3xl border border-slate-700/50 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">{data.projectName}</h1>
            <div className="flex space-x-4 text-slate-400 text-sm mt-2">
              <span>{data.scanDate}</span>
              <span>{data.filesScanned} files</span>
              <span>{data.linesOfCode.toLocaleString()} lines</span>
            </div>
          </div>
          <div className="space-x-2">
            <DownloadBtn format="PDF" onClick={() => download('pdf', data.scanId, data.projectName)} />
            <DownloadBtn format="CSV" onClick={() => download('csv', data.scanId, data.projectName)} />
          </div>
        </div>

        {/* risk/ findings / critical */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Unified Risk Score" value={data.riskScore} unit="/100" color="cyan">
            {data.riskScore <= 30
              ? 'Low risk'
              : data.riskScore <= 60
              ? 'Moderate risk'
              : 'High risk'}
          </StatCard>
          <StatCard title="Total Findings" value={data.totalFindings} color="purple">
            +{data.totalFindings - data.findings.length} since last
          </StatCard>
          <StatCard title="Critical Threats" value={data.criticalThreats.toString().padStart(2, '0')} color="red">
            Immediate action
          </StatCard>
        </div>

        {/* charts */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6"> {/* Changed to md:grid-cols-1 as only one chart remains */}
          <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50">
            <h3 className="text-white mb-4">Language Split</h3>
            {/* Wrapper div to control pie chart size */}
            <div className="max-w-xs mx-auto">
              <Pie
                data={{
                  labels: pieLabels,
                  datasets: [{ data: pieValues, backgroundColor: pieColors }],
                }}
              />
            </div>
          </div>
          {/* Severity Trends chart removed as requested */}
        </div>

        {/* scan results */}
        <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-lg">Scan Results</h3>
            <button
              className="text-cyan-400 text-sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `View All ${data.totalFindings}`}
            </button>
          </div>
          <div
            className={`space-y-3 overflow-auto ${
              showAll ? 'max-h-screen' : 'max-h-64'
            }`}
          >
            {data.findings.map((f) => (
              <div
                key={f.id}
                className="flex justify-between items-center bg-slate-700/30 p-3 rounded-xl"
              >
                <div>
                  <p className="text-white font-medium">{f.issue}</p>
                  <p className="text-slate-400 text-xs">
                    {f.filePath}:{f.lineNumber}
                  </p>
                </div>
                <button
                  className="text-cyan-400 text-sm"
                  onClick={() => setDetail(f)}
                >
                  DETAIL →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-xl max-w-md w-full relative">
            <button
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
              onClick={() => setDetail(null)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-white mb-2">{detail.issue}</h2>
            <p className="text-slate-300 mb-2">
              <strong>Severity:</strong> {detail.severity}
            </p>
            <p className="text-slate-300 mb-2">
              <strong>File:</strong> {detail.filePath}:{detail.lineNumber}
            </p>
            <p className="text-slate-300 mb-4">
              <strong>Insight:</strong> {detail.insight}
            </p>
            <p className="text-slate-300">
              <strong>Recommendation:</strong> {detail.recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

/* Helpers */

function StatCard({
  title,
  value,
  unit,
  children,
  color,
}: {
  title: string;
  value: number | string;
  unit?: string;
  children: React.ReactNode;
  color: 'cyan' | 'purple' | 'red';
}) {
  const colors = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
  } as const;
  return (
    <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/50">
      <h4 className="text-slate-400 uppercase text-sm mb-2">{title}</h4>
      <div className={`text-4xl font-bold ${colors[color]}`}>
        {value} <span className="text-slate-400 text-xl">{unit}</span>
      </div>
      <p className={`mt-2 text-sm ${colors[color]}`}>{children}</p>
    </div>
  );
}

function DownloadBtn({
  format,
  onClick,
}: {
  format: 'PDF' | 'CSV';
  onClick(): void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-white bg-gradient-to-r ${
        format === 'PDF'
          ? 'from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500'
          : 'from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600'
      }`}
    >
      Download {format}
    </button>
  );
}

async function download(
  fmt: 'pdf' | 'csv',
  scanId: number,
  projectName: string
) {
  try {
    const resp = await fetch(
      `http://localhost:5000/api/scan/${scanId}/download/${fmt}`
    );
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan_report_${projectName}.${fmt}`;
    a.click();
  } catch {
    alert(`Failed to download ${fmt.toUpperCase()}.`);
  }
}
