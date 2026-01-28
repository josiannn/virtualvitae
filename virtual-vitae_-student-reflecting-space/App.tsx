
import React, { useState, useEffect } from 'react';
import { UserDetails, Vent, AppView } from './types';
import FloatingParticles from './components/FloatingParticles';
import { getEmpatheticResponse } from './services/geminiService';

const ADVISOR_EMAIL = "josiah.lau1@det.nsw.edu.au";
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@det\.nsw\.edu\.au$/i;

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('onboarding');
  const [user, setUser] = useState<UserDetails>({ firstName: '', lastName: '', email: '' });
  const [ventText, setVentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);
  const [history, setHistory] = useState<Vent[]>([]);
  const [emailError, setEmailError] = useState(false);

  // Helper to get the unique storage key for the current user
  const getStorageKey = (email: string) => `soulcanvas_history_${email.toLowerCase().trim()}`;

  // Load history dynamically when entering the venting view (after email is confirmed)
  useEffect(() => {
    if (view !== 'onboarding' && user.email) {
      const saved = localStorage.getItem(getStorageKey(user.email));
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse history");
          setHistory([]);
        }
      } else {
        setHistory([]);
      }
    }
  }, [view, user.email]);

  // Save history whenever it changes, specifically for the active profile
  useEffect(() => {
    if (view !== 'onboarding' && user.email) {
      localStorage.setItem(getStorageKey(user.email), JSON.stringify(history));
    }
  }, [history, view, user.email]);

  const handleEmailChange = (val: string) => {
    setUser({ ...user, email: val });
    if (val && !EMAIL_REGEX.test(val)) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.firstName.trim() && user.lastName.trim() && EMAIL_REGEX.test(user.email)) {
      setView('venting');
    }
  };

  const handleReset = () => {
    setVentText('');
    setCurrentResponse(null);
  };

  const handleSwitchProfile = () => {
    if (confirm('Return to the entry screen? Your current session reflections are archived locally.')) {
      setView('onboarding');
      setVentText('');
      setCurrentResponse(null);
      setHistory([]);
    }
  };

  const handleEmailAdvisor = () => {
    const subject = encodeURIComponent(`Student Vent Reflection: ${user.firstName} ${user.lastName}`);
    const body = encodeURIComponent(`Hello Mr. Lau,\n\nI am sharing my thoughts from Virtual Vitae.\n\nMy Vent:\n"${ventText}"\n\nReflection received:\n"${currentResponse}"\n\nRegards,\n${user.firstName} ${user.lastName}\n(${user.email})`);
    window.location.href = `mailto:${ADVISOR_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = async () => {
    if (!ventText.trim()) return;

    setIsSubmitting(true);
    const response = await getEmpatheticResponse(ventText, user.firstName);
    
    const newVent: Vent = {
      id: Date.now().toString(),
      content: ventText,
      timestamp: Date.now(),
      aiResponse: response,
      userDetails: { ...user },
    };

    setHistory((prev) => [newVent, ...prev]);
    setCurrentResponse(response);
    setIsSubmitting(false);
  };

  const isFormValid = user.firstName.trim() && user.lastName.trim() && EMAIL_REGEX.test(user.email);

  const renderOnboarding = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 animate-fadeIn">
      <div className="glass p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-white/40">
        <h1 className="text-4xl font-bold font-brand text-indigo-900 mb-2">Virtual Vitae</h1>
        <p className="text-gray-600 mb-8 font-light">Student Reflecting Space</p>
        
        <form onSubmit={handleStart} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-indigo-900 mb-1 ml-1 tracking-widest uppercase">First Name</label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all bg-white/50 text-sm"
                value={user.firstName}
                onChange={(e) => setUser({ ...user, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-indigo-900 mb-1 ml-1 tracking-widest uppercase">Last Name</label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all bg-white/50 text-sm"
                value={user.lastName}
                onChange={(e) => setUser({ ...user, lastName: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-indigo-900 mb-1 ml-1 tracking-widest uppercase">School Email (@det.nsw.edu.au)</label>
            <input
              required
              type="email"
              placeholder="name@det.nsw.edu.au"
              className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:outline-none transition-all bg-white/50 text-sm ${emailError ? 'border-red-300 focus:ring-red-400' : 'border-indigo-100 focus:ring-indigo-400'}`}
              value={user.email}
              onChange={(e) => handleEmailChange(e.target.value)}
            />
            {emailError && <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold italic">Please use a valid @det.nsw.edu.au address.</p>}
          </div>

          <div className="space-y-3 mt-6">
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3">
               <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                 <span className="font-bold">⚠️ UNMONITORED:</span> This space is private and not monitored by school staff. If you need help, your entries are only seen by Mr. Lau if you choose to email him.
               </p>
            </div>
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
               <p className="text-[10px] text-indigo-800 leading-relaxed font-medium">
                 <span className="font-bold">🛡️ PRIVACY:</span> Your reflections are unique and stored to your email address. Previous reflections will load automatically once you enter your details.
               </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full font-semibold py-4 rounded-xl shadow-lg transition-all active:scale-95 mt-4 ${isFormValid ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}`}
          >
            Enter Sanctuary
          </button>
        </form>
      </div>
    </div>
  );

  const renderVenting = () => (
    <div className="flex flex-col items-center justify-start min-h-[80vh] px-4 pt-10 animate-fadeIn relative">
      <div className="max-w-3xl w-full">
        <header className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-brand font-bold text-indigo-900 leading-tight">Reflecting on My Day</h2>
            <p className="text-gray-500 font-light text-sm">{user.firstName} {user.lastName} • {user.email}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSwitchProfile}
              className="bg-white/40 hover:bg-white/60 px-4 py-2 rounded-full text-indigo-400 text-[10px] font-bold border border-indigo-50 transition-all tracking-wider uppercase"
            >
              Logout 🔒
            </button>
            <button 
              onClick={() => setView('history')}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-full text-white text-[10px] font-bold shadow-md transition-all tracking-wider uppercase"
            >
              Archives 📖
            </button>
          </div>
        </header>

        <div className="glass rounded-3xl p-1 shadow-inner border border-white/50 relative">
          <textarea
            value={ventText}
            onChange={(e) => setVentText(e.target.value)}
            placeholder="This space is yours. No one will see your reflection unless you choose to let them read it. Write until you feel lighter."
            className="w-full h-72 p-8 bg-transparent resize-none border-none focus:ring-0 text-lg text-gray-800 placeholder-gray-400 font-light leading-relaxed"
          />
          <div className="absolute bottom-4 right-6 text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-60">
            Unmonitored Space
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-8 justify-between">
          <button
            onClick={handleReset}
            className="px-6 py-3 rounded-xl border border-gray-300 text-gray-500 hover:bg-white transition-colors font-medium text-xs uppercase tracking-wider"
          >
            Reset Space
          </button>
          
          <button
            disabled={!ventText.trim() || isSubmitting}
            onClick={handleSubmit}
            className={`px-10 py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-3 uppercase tracking-wider text-sm ${
              !ventText.trim() || isSubmitting 
                ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {isSubmitting ? 'Processing...' : 'Submit & Reflect'}
          </button>
        </div>

        {currentResponse && (
          <div className="mt-12 p-10 glass rounded-3xl border border-indigo-200 shadow-2xl animate-slideUp">
             <div className="flex items-center gap-2 mb-6">
                <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
                <h4 className="text-indigo-900 font-bold text-xs uppercase tracking-[0.2em]">Personal Reflection</h4>
             </div>
            <p className="text-gray-700 leading-relaxed text-lg mb-8 font-light italic border-l-2 border-indigo-100 pl-6">
              {currentResponse}
            </p>
            
            <div className="border-t border-indigo-100 pt-8 mt-4">
              <h5 className="text-[10px] font-bold text-gray-400 mb-6 uppercase tracking-[0.2em]">Next Steps & Support</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-white/40 rounded-2xl border border-white/60">
                  <h6 className="font-bold text-red-600 text-xs mb-2 uppercase tracking-wider">Are you in immediate danger?</h6>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    If you are in immediate danger, please call <span className="font-bold">000</span>. You can also contact <span className="font-bold">headspace</span> on <span className="font-bold">1800 650 890</span> for support.
                  </p>
                </div>
                <div className="p-5 bg-indigo-600/5 rounded-2xl border border-indigo-100 flex flex-col justify-between">
                  <div>
                    <h6 className="font-bold text-indigo-900 text-xs mb-2 uppercase tracking-wider">Year Advisor Contact</h6>
                    <p className="text-xs text-gray-500 leading-relaxed italic">"Reach out to Mr. Lau if you'd like school-based support."</p>
                  </div>
                  <button 
                    onClick={handleEmailAdvisor}
                    className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                  >
                    Send to Mr. Lau
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-10 flex justify-center">
                <button 
                    onClick={() => { setVentText(''); setCurrentResponse(null); }}
                    className="text-[10px] font-bold text-gray-400 hover:text-indigo-600 uppercase tracking-[0.3em] transition-colors"
                >
                    + Start New Reflection
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="flex flex-col items-center justify-start min-h-[80vh] px-4 pt-10 animate-fadeIn">
      <div className="max-w-3xl w-full">
        <header className="flex flex-col mb-12">
          <div className="flex justify-between items-center w-full">
            <button 
              onClick={() => setView('venting')}
              className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-2 uppercase tracking-widest"
            >
               <span>← Return</span>
            </button>
            <h2 className="text-xl font-brand font-bold text-indigo-900 tracking-[0.2em] uppercase">Archives</h2>
            <button 
              onClick={() => { if(confirm(`Permanently delete all session history for ${user.email}?`)) setHistory([]); }}
              className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-widest"
            >
              Purge
            </button>
          </div>
          <div className="mt-4 bg-indigo-600/5 border border-indigo-100/50 rounded-xl px-4 py-2 self-center">
             <p className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase">
                Dynamically loaded for: <span className="text-indigo-900">{user.email}</span>
             </p>
          </div>
        </header>

        {history.length === 0 ? (
          <div className="text-center py-24 opacity-30">
            <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-xs">No Records Found for this profile</p>
          </div>
        ) : (
          <div className="space-y-8 pb-32">
            {history.map((v) => (
              <div key={v.id} className="glass p-8 rounded-3xl shadow-sm border border-white/50 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">
                    {new Date(v.timestamp).toLocaleDateString()} — {new Date(v.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="text-gray-800 mb-8 font-light leading-relaxed text-sm">{v.content}</p>
                {v.aiResponse && (
                  <div className="bg-white/60 p-5 rounded-2xl text-xs border-l-2 border-indigo-600 shadow-inner">
                    <p className="text-gray-600 font-medium leading-relaxed italic">"{v.aiResponse}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main className="relative z-10 min-h-screen py-8">
      <FloatingParticles />
      
      {view !== 'onboarding' && (
          <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 glass px-1 py-1 rounded-full flex gap-1 shadow-2xl z-50 transition-all border border-white/60">
             <button 
                onClick={() => setView('venting')}
                className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'venting' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-indigo-600'}`}
             >
                Canvas
             </button>
             <button 
                onClick={() => setView('history')}
                className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${view === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-indigo-600'}`}
             >
                History
             </button>
          </nav>
      )}

      {view === 'onboarding' && renderOnboarding()}
      {view === 'venting' && renderVenting()}
      {view === 'history' && renderHistory()}

      <footer className="mt-auto pt-20 pb-20 text-center text-[9px] text-gray-300 px-4 font-bold uppercase tracking-[0.3em]">
        <p>DET NSW Well-being System • Contact: {ADVISOR_EMAIL}</p>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 1s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
      `}</style>
    </main>
  );
};

export default App;
