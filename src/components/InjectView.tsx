import React, { useState } from 'react';
import { 
  Zap, 
  Send, 
  KeyRound, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  Check, 
  RefreshCw, 
  Loader2,
  Mail,
  FileCode2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InjectHistory } from '../types.ts';

interface InjectViewProps {
  token: string | null;
  onInjectSuccess: (newHistoryItem: InjectHistory) => void;
}

export default function InjectView({
  token,
  onInjectSuccess,
}: InjectViewProps) {
  const [emailTarget, setEmailTarget] = useState('');
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // API returns values
  const [dispatchedLink, setDispatchedLink] = useState('');
  const [dispatchedCode, setDispatchedCode] = useState('');
  
  // Verification field
  const [verificationInput, setVerificationInput] = useState('');
  
  // Loading & error statuses
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Final Result status
  const [resultState, setResultState] = useState<'idle' | 'success' | 'failed'>('idle');
  const [resultMsg, setResultMsg] = useState('');

  // Handle Send verification
  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTarget) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/inject/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email_target: emailTarget }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch verification link.');
      }

      setDispatchedLink(data.verification_link);
      setDispatchedCode(data.verification_code);
      setCurrentStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during verification dispatch.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Inject Verify
  const handleVerifyInject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationInput) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/inject/verif', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email_target: emailTarget, 
          verification_code: verificationInput 
        }),
      });

      const data = await response.json();
      
      // Update global history logs
      if (data.history) {
        onInjectSuccess(data.history);
      }

      if (!response.ok) {
        setResultState('failed');
        setResultMsg(data.message || 'Injection verification failed.');
        return;
      }

      setResultState('success');
      setResultMsg(data.message || 'Verification cleared and premium active!');
    } catch (err: any) {
      setResultState('failed');
      setResultMsg(err.message || 'An error occurred during injection processing.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(dispatchedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(dispatchedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const resetForm = () => {
    setEmailTarget('');
    setCurrentStep(1);
    setVerificationInput('');
    setDispatchedLink('');
    setDispatchedCode('');
    setResultState('idle');
    setResultMsg('');
    setErrorMsg('');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.2 } }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* View Title */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple to-gold flex items-center justify-center glow-purple">
          <Zap className="h-6 w-6 text-black fill-black" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Inject Premium VIP</h2>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Bypass server authorization gates and inject premium license to target storage files.
        </p>
      </div>

      <AnimatePresence mode="wait">
        
        {/* SUCCESS RESULT SCREEN */}
        {resultState === 'success' && (
          <motion.div
            key="success-card"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-card p-8 rounded-2xl border border-emerald-500/20 text-center space-y-6 glow-purple relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-gold to-purple" />
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Premium Injected Successfully!</h3>
              <p className="font-mono text-xs text-gold antialiased font-semibold break-all bg-gold/5 px-4 py-2 rounded-xl inline-block border border-gold/10">
                Target: {emailTarget}
              </p>
            </div>

            <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              {resultMsg || 'The system gateway successfully processed the verification certificates. High speed premium access is activated.'}
            </p>

            <button
              onClick={resetForm}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple to-gold hover:opacity-90 font-semibold text-black text-sm transition shadow-lg flex items-center gap-2 mx-auto cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Perform New License Inject</span>
            </button>
          </motion.div>
        )}

        {/* FAILED RESULT SCREEN */}
        {resultState === 'failed' && (
          <motion.div
            key="failed-card"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-card p-8 rounded-2xl border border-red-500/20 text-center space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-red-500" />
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-red-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Injection Failed</h3>
              <p className="font-mono text-xs text-red-400 antialiased break-all bg-red-500/5 px-3 py-1.5 rounded-lg inline-block border border-red-500/10">
                Target: {emailTarget}
              </p>
            </div>

            <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
              {resultMsg || 'Handshake failed: Invalid credentials signature or stale token session.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 font-semibold text-white text-sm transition border border-white/10 flex items-center gap-2"
              >
                Reset form
              </button>
              <button
                onClick={() => {
                  setResultState('idle');
                  setErrorMsg('');
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 font-semibold text-white text-sm transition flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry verifying code</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* FORM STEP 1: SEND LINK */}
        {resultState === 'idle' && currentStep === 1 && (
          <motion.form
            key="step-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onSubmit={handleSendLink}
            className="glass-card p-8 rounded-3xl space-y-6 border border-white/5 shadow-2xl relative overflow-hidden"
          >
            {/* Visual glow backdrop inside the card */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gold tracking-widest uppercase font-mono">Gateway step 1</span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple" />
                <span>Assign Target Entity</span>
              </h3>
            </div>

            <div className="space-y-2">
              <label htmlFor="emailTarget" className="block text-xs font-semibold text-gray-400 tracking-wider uppercase">
                Email Target
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="emailTarget"
                  type="email"
                  required
                  placeholder="e.g. user@customer-domain.com"
                  value={emailTarget}
                  onChange={(e) => setEmailTarget(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 bg-black/35 rounded-xl border border-white/15 focus:border-purple/50 focus:ring-1 focus:ring-purple/50 text-white outline-none font-sans text-sm transition"
                />
              </div>
              <p className="text-[11px] text-gray-500 leading-normal">
                Licenses are dynamically linked to target emails via an API handshake. A bypass endpoint token will be simulated.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-sans flex items-start gap-2.5">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !emailTarget}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple to-indigo-600 hover:opacity-95 disabled:hover:opacity-100 font-bold text-white text-sm transition flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed glow-purple cursor-pointer shadow-lg active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Processing Handshake...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Verification Link</span>
                </>
              )}
            </button>
          </motion.form>
        )}

        {/* FORM STEP 2: VERIFY CODE AND INJECT */}
        {resultState === 'idle' && currentStep === 2 && (
          <motion.div
            key="step-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-6"
          >
            {/* Simulation Helpers Helper panel so they can copy-paste live! */}
            <div className="glass-card p-6 rounded-2xl border border-gold/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode2 className="h-5 w-5 text-gold" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Dispatched Payload simulation</span>
                </div>
                <span className="font-mono text-[9px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>WAITING FOR CALLBACK</span>
                </span>
              </div>
              
              <div className="space-y-2 text-xs">
                <p className="text-gray-400">
                  The bypass pipeline generated verification triggers. Since this resides inside a sandbox, you can directly copy-paste the verification elements below:
                </p>
                
                {/* Verification Code Box */}
                <div className="flex items-center justify-between gap-2 p-3 bg-black/35 rounded-xl border border-white/5 font-mono">
                  <div className="truncate">
                    <span className="text-gray-500 mr-2">CODE:</span>
                    <span className="text-gold font-bold">{dispatchedCode}</span>
                  </div>
                  <button 
                    onClick={handleCopyCode}
                    className="p-1 text-gray-400 hover:text-white transition"
                    title="Copy verification code"
                  >
                    {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                {/* Verification Link Box */}
                <div className="flex items-center justify-between gap-2 p-3 bg-black/35 rounded-xl border border-white/5 font-mono">
                  <div className="truncate pr-4 flex-1">
                    <span className="text-gray-500 mr-2">LINK:</span>
                    <span className="text-purple underline cursor-pointer hover:text-purple-300 truncate" onClick={() => setVerificationInput(dispatchedCode)}>
                      {dispatchedLink}
                    </span>
                  </div>
                  <button 
                    onClick={handleCopyLink}
                    className="p-1 text-gray-400 hover:text-white transition"
                    title="Copy verification URL"
                  >
                    {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                {/* Helpful Autofill button */}
                <button
                  onClick={() => setVerificationInput(dispatchedCode)}
                  className="w-full py-1.5 rounded-lg bg-gold/10 hover:bg-gold/15 border border-gold/10 text-[11px] font-semibold text-gold transition"
                >
                  ⚡ Fast Autofill simulated verification code
                </button>
              </div>
            </div>

            {/* Verification Form */}
            <form
              onSubmit={handleVerifyInject}
              className="glass-card p-8 rounded-3xl space-y-6 border border-white/5 shadow-2xl relative overflow-hidden"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gold tracking-widest uppercase font-mono">Gateway step 2</span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="h-5 w-5 text-purple" />
                  <span>Execute Verification Handshake</span>
                </h3>
              </div>

              <div className="space-y-2">
                <label htmlFor="verifCode" className="block text-xs font-semibold text-gray-400 tracking-wider uppercase">
                  Verify Credentials Code or Link
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <input
                    id="verifCode"
                    type="text"
                    required
                    placeholder="Paste verification link or enter VIP code..."
                    value={verificationInput}
                    onChange={(e) => setVerificationInput(e.target.value)}
                    disabled={loading}
                    className="w-full pl-11 pr-4 py-3 bg-black/35 rounded-xl border border-white/15 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 text-white outline-none font-sans text-sm transition"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-sans flex items-start gap-2.5">
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition border border-white/10"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !verificationInput}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-gold to-yellow-600 hover:opacity-95 font-bold text-black text-sm transition flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed glow-gold shadow-lg cursor-pointer active:scale-98"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>Confirming Signatures...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-black fill-black" />
                      <span>Verifikasi & Inject Premium</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
