
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, ArrowRight, UserPlus } from 'lucide-react';
import { User } from '../App';

interface RegisterProps {
  onRegister: (user: User) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return alert("Passwords don't match");
    const mockUser = { name, email };
    localStorage.setItem('repo_user', JSON.stringify(mockUser));
    onRegister(mockUser);
    navigate('/scan');
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full bg-[#111827]/80 backdrop-blur-xl p-12 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col items-center">
        
        <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-8 border border-cyan-500/20">
          <UserPlus className="w-8 h-8 text-cyan-400" />
        </div>
        
        <h2 className="text-4xl font-black text-white mb-10 uppercase tracking-[0.15em] text-center">
          Create Account
        </h2>

        <form onSubmit={handleRegister} className="w-full space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-black text-cyan-400 tracking-[0.2em] uppercase ml-1">Full Name</label>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                <UserIcon className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full h-16 bg-[#0b111e] border border-white/10 rounded-2xl px-16 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all text-lg"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-cyan-400 tracking-[0.2em] uppercase ml-1">Email Address</label>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full h-16 bg-[#0b111e] border border-white/10 rounded-2xl px-16 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all text-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-xs font-black text-cyan-400 tracking-[0.2em] uppercase ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-16 bg-[#0b111e] border border-white/10 rounded-2xl px-6 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all text-lg"
                required
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-cyan-400 tracking-[0.2em] uppercase ml-1">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-16 bg-[#0b111e] border border-white/10 rounded-2xl px-6 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all text-lg"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full h-16 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:to-cyan-300 text-[#0b111e] font-black rounded-2xl transition-all shadow-[0_0_40px_rgba(34,211,238,0.25)] hover:shadow-[0_0_50px_rgba(34,211,238,0.4)] flex items-center justify-center text-xl group mt-4 transform hover:-translate-y-0.5"
          >
            Create ID <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </button>
        </form>

        <p className="mt-10 text-gray-500 text-sm font-medium">
          Already active? <Link to="/login" className="text-cyan-400 hover:text-cyan-300 hover:underline ml-1 font-bold transition-colors">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
