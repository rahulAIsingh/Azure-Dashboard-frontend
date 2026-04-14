import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Sun, Moon, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await login(email, password);
    setLoading(false);

    if (success) {
      navigate("/dashboard", { replace: true });
    } else {
      setError("Invalid email or password. Try admin@company.com / admin123");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden transition-colors duration-1000" 
         style={{ backgroundColor: theme === 'dark' ? '#070b14' : '#F4F7FB' }}>
      
      {/* --- INJECTED FIX: Override Browser Autofill Shadows --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
          -webkit-background-clip: text;
          -webkit-text-fill-color: ${theme === 'dark' ? '#f8fafc' : '#1e293b'} !important;
          transition: background-color 5000s ease-in-out 0s;
          box-shadow: inset 0 0 20px 20px transparent !important;
        }
      `}} />

      {/* --- Atmosphere Layer: Aurora Orbs --- */}
      <motion.div 
        animate={{ 
          x: [0, 40, 0], 
          y: [0, 30, 0],
          scale: [1, 1.1, 1] 
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className={`absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-40 mix-blend-screen pointer-events-none ${theme === 'dark' ? 'bg-blue-600/20' : 'bg-blue-400/20'}`} 
      />
      <motion.div 
        animate={{ 
          x: [0, -40, 0], 
          y: [0, -30, 0],
          scale: [1, 1.1, 1] 
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className={`absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] opacity-30 mix-blend-screen pointer-events-none ${theme === 'dark' ? 'bg-indigo-600/20' : 'bg-indigo-300/20'}`} 
      />

      {/* --- Logo Background Top Left --- */}
      <div className="absolute top-8 left-10 z-40 transform hover:scale-105 transition-transform duration-300">
        <svg width="180" height="50" viewBox="0 0 200 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="32" y1="18" x2="20" y2="38" stroke={theme === 'dark' ? '#334155' : '#888'} strokeWidth="2.5" />
          <line x1="20" y1="38" x2="30" y2="52" stroke={theme === 'dark' ? '#334155' : '#888'} strokeWidth="2.5" />
          <circle cx="36" cy="14" r="13" fill="#F9C12E" className="drop-shadow-sm" />
          <circle cx="16" cy="38" r="9" fill="#4FC3C8" className="drop-shadow-sm" />
          <circle cx="31" cy="53" r="6.5" fill="#3B9EE4" className="drop-shadow-sm" />
          <text x="56" y="44" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="23" letterSpacing="0.5" fill={theme === 'dark' ? '#f8fafc' : '#1e293b'}>KAVITECH</text>
        </svg>
      </div>

      {/* --- Theme Toggle --- */}
      <button
        onClick={toggleTheme}
        className="absolute top-8 right-10 z-50 p-3 rounded-full glass-card border-white/20 hover:scale-110 active:scale-95 transition-all duration-300 shadow-xl group"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5 text-yellow-400 group-hover:rotate-45 transition-transform" />
        ) : (
          <Moon className="h-5 w-5 text-primary group-hover:-rotate-12 transition-transform" />
        )}
      </button>

      {/* --- Main Login Container --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
        className={`w-full max-w-[1080px] rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row border transition-all duration-700 relative z-20 ${
          theme === 'dark' 
            ? 'bg-[#111827] border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,1),0_0_60px_rgba(59,130,246,0.15)]' 
            : 'bg-white border-slate-200 shadow-[0_45px_100px_-20px_rgba(0,0,0,0.15)]'
        }`}
        style={{ minHeight: '620px' }}
      >
        
        {/* Luminous Inner Ring for Dark Mode */}
        {theme === 'dark' && (
          <div className="absolute inset-0 rounded-[2.5rem] border border-white/5 pointer-events-none z-30" />
        )}

        {/* Left Side: Form */}
        <div className="w-full md:w-[42%] p-10 md:p-14 flex flex-col justify-center relative z-10">
          <div className="max-w-[320px] w-full mx-auto md:mx-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.25em] text-primary uppercase">FinOps Dashboard</span>
            </div>
            <h1 className={`text-4xl lg:text-6xl font-black mb-4 tracking-tighter transition-colors duration-500 leading-[1] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              <span className="text-primary">Cloud Cost</span> Dashboard
            </h1>
            <p className={`text-[14px] mb-12 leading-relaxed transition-colors duration-500 font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage and optimize your cloud spend.
            </p>

            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Simple Input - Email */}
              <div className="space-y-2 group">
                <label className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${theme === 'dark' ? 'text-slate-600 group-focus-within:text-primary' : 'text-slate-400 group-focus-within:text-primary'}`}>Email Address</label>
                <div className={`relative border-b-2 pb-2 transition-all duration-300 ease-out flex items-center ${theme === 'dark' ? 'border-slate-800 group-focus-within:border-primary' : 'border-slate-100 group-focus-within:border-primary'}`}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className={`w-full bg-transparent border-none focus:ring-0 p-0 text-[16px] font-bold outline-none transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100 placeholder:text-slate-800' : 'text-slate-800 placeholder:text-slate-300'}`}
                    required
                  />
                </div>
              </div>

              {/* Simple Input - Password */}
              <div className="space-y-2 group">
                <div className="flex items-center justify-between">
                  <label className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${theme === 'dark' ? 'text-slate-600 group-focus-within:text-primary' : 'text-slate-400 group-focus-within:text-primary'}`}>Password</label>
                </div>
                <div className={`relative border-b-2 pb-2 flex items-center transition-all duration-300 ease-out ${theme === 'dark' ? 'border-slate-800 group-focus-within:border-primary' : 'border-slate-100 group-focus-within:border-primary'}`}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full bg-transparent border-none focus:ring-0 p-0 text-[16px] font-bold outline-none transition-colors duration-300 ${theme === 'dark' ? 'text-slate-100 placeholder:text-slate-800' : 'text-slate-800 placeholder:text-slate-300'}`}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`transition-colors duration-300 ${theme === 'dark' ? 'text-slate-700 hover:text-primary' : 'text-slate-300 hover:text-primary'}`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold">
                 <div className="flex items-center gap-2">
                   <input type="checkbox" className="rounded border-slate-300 accent-primary" id="remember" />
                   <label htmlFor="remember" className={theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}>Remember me</label>
                 </div>
                 <button type="button" className="text-primary hover:underline transition-all">Forgot Password?</button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[11px] text-red-500 font-bold bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-primary hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-primary/30 transition-all font-bold text-xs tracking-[0.1em] h-12 flex items-center justify-center gap-2 group"
                >
                  {loading ? 'AUTHENTICATING...' : (
                    <>
                      <span>SIGN IN</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        →
                      </motion.div>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Illustration Section (Restored for 100% Clarity) */}
        <div className={`hidden md:flex flex-1 items-center justify-center relative transition-colors duration-700 ${theme === 'dark' ? 'bg-slate-950/40 border-l border-white/5' : 'bg-white border-l border-slate-100'}`}>
          <div className="w-full h-full relative group flex items-center justify-center p-8 lg:p-12">
             {/* Subtle Glow behind image */}
             <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-all duration-1000" />
             
             <img 
               src="/image1.jpg" 
               alt="Dashboard Illustration" 
               className="w-full h-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-[1.03] drop-shadow-xl"
             />
          </div>
        </div>

      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 text-[10px] items-center gap-4 flex tracking-widest font-black uppercase z-20 transition-colors duration-500">
         <span className={theme === 'dark' ? 'text-slate-700' : 'text-slate-400'}>© 2026 KAVITECH</span>
         <div className={`h-1 w-1 rounded-full ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-300'}`} />
         <span className={theme === 'dark' ? 'text-slate-700' : 'text-slate-400'}>Terms of Service</span>
         <div className={`h-1 w-1 rounded-full ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-300'}`} />
         <span className={theme === 'dark' ? 'text-slate-700' : 'text-slate-400'}>Privacy Policy</span>
      </div>

    </div>
  );
}
