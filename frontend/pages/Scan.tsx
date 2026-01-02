import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Scan: React.FC = () => {
  const [repo, setRepo] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [scanning, setScanning] = useState(false);
  const nav = useNavigate();

  const handleScan = async () => {
    if (!repo) {
      setError('Please enter a repository URL');
      return;
    }
    setError('');
    setScanning(true);
    setProgress(0);

    const steps = [
      'Validating repository…',
      'Cloning repository…',
      'Scanning files…',
      'Analyzing vulnerabilities…',
      'Generating report…',
    ];
    for (let i = 0; i < steps.length; i++) {
      setStep(steps[i]);
      setProgress(((i + 1) / steps.length) * 100);
      // simulate each step
      // you can poll your real scan-status endpoint here
      await new Promise((r) => setTimeout(r, 800));
    }

    try {
      const res = await fetch('http://localhost:5000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositoryUrl: repo }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || 'Scan failed');
        setScanning(false);
        return;
      }
      // final 100%
      setProgress(100);
      setStep('Scan complete!');
      setTimeout(() => {
        nav('/dashboard'); // Navigates to the /dashboard route
      }, 700);
    } catch (e) {
      setError('Backend error — is the server running?');
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-8 w-full max-w-3xl border border-slate-700/50 space-y-6">
        <h1 className="text-4xl font-bold text-white text-center">Vulnerability Scan</h1>
        <p className="text-slate-300 text-center">
          Enter a GitHub repo URL to start static analysis.
        </p>

        <div className="flex space-x-4">
          <input
            type="url"
            placeholder="https://github.com/username/repo"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            disabled={scanning}
            className="flex-1 px-4 py-3 bg-slate-700 rounded-xl border border-slate-600 focus:outline-none focus:border-cyan-400 text-white"
          />
          <button
            disabled={scanning}
            onClick={handleScan}
            className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 rounded-xl text-white font-semibold disabled:opacity-50"
          >
            {scanning ? 'Scanning…' : 'Start Scan'}
          </button>
        </div>

        {error && (
          <div className="text-red-400 bg-red-500/20 rounded-xl p-2">{error}</div>
        )}

        {scanning && (
          <div className="space-y-2">
            <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-slate-300">{step}</p>
            <p className="text-center text-white font-bold">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scan;
