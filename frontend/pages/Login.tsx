
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Chrome } from 'lucide-react';
import { User } from '../App';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const mockUser = { name: email.split('@')[0], email };
    localStorage.setItem('repo_user', JSON.stringify(mockUser));
    onLogin(mockUser);
    navigate('/scan');
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full bg-[#111827]/80 backdrop-blur-xl p-12 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col items-center">
        
        <form onSubmit={handleLogin} className="w-full space-y-10">
          {/* Email Input */}
          <div className="space-y-4">
            <label className="text-xs font-black text-cyan-400 tracking-[0.2em] uppercase ml-1">
              Email ID
            </label>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full h-16 bg-[#0b111e] border border-white/10 rounded-2xl px-16 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all text-lg"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-4">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-black text-cyan-400 tracking-[0.2em] uppercase">
                Password
              </label>
              <button type="button" className="text-[10px] font-black text-gray-400 hover:text-white uppercase tracking-widest transition-colors">
                Recover?
              </button>
            </div>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-16 bg-[#0b111e] border border-white/10 rounded-2xl px-16 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all text-lg"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full h-16 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:to-cyan-300 text-[#0b111e] font-black rounded-2xl transition-all shadow-[0_0_40px_rgba(34,211,238,0.25)] hover:shadow-[0_0_50px_rgba(34,211,238,0.4)] flex items-center justify-center text-xl group transform hover:-translate-y-0.5"
          >
            Enter System <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </form>

        {/* Divider */}
        <div className="w-full relative my-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-[#111827] px-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
              Third-Party Auth
            </span>
          </div>
        </div>

        {/* Social Auth */}
        <button className="w-full h-16 bg-[#0b111e] border border-white/5 rounded-2xl text-white font-bold flex items-center justify-center hover:bg-white/[0.05] transition-all text-lg group">
          <Chrome className="w-6 h-6 mr-3 text-cyan-400 group-hover:rotate-12 transition-transform" />
          Continue with Google
        </button>

        <p className="mt-10 text-gray-500 text-sm font-medium">
          New user? <Link to="/register" className="text-cyan-400 hover:text-cyan-300 hover:underline ml-1 font-bold transition-colors">Create an account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
