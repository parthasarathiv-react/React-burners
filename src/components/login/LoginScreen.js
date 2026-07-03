import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, Clock, ShieldCheck, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

function LoginScreen() {
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [time, setTime] = useState(new Date());
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [inactiveWarning, setInactiveWarning] = useState('');

  const navigate = useNavigate();
  const { login, availableRoles, loading } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async () => {
    if (!selectedUser) {
      toast.error('Please enter username');
      return;
    }
    if (!password) {
      toast.error('Please enter password');
      return;
    }

    setIsLoggingIn(true);

    try {
      const result = await login(selectedUser, password);

      // if (result && result.success) {
      //   navigate('/dashboard');
      // } else {
      //   toast.error(result?.message);
      // }
      if (result && result.success) {
        navigate('/dashboard');
      } else {
        const message = result?.message || '';

        if (message.toLowerCase().includes('inactive')) {
          setInactiveWarning(message);
        } else {
          toast.error(message);
        }
      }
    }
    //  catch (err) {
    //   toast.error(err?.message);
    // } 

    catch (err) {
      const message = err?.message || 'Login failed';

      if (message.toLowerCase().includes('inactive')) {
        setInactiveWarning(message);
      } else {
        toast.error(message);
      }
    }
    finally {
      setIsLoggingIn(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#010a25] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-100/50">Initializing Secure Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-white">
      <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(0deg,rgba(0,0,0,0.42),transparent)]" />

      <main className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex min-h-[36vh] flex-col justify-between px-6 py-7 sm:px-10 lg:min-h-screen lg:px-14 lg:py-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/cd-logo.png"
                alt="Raster DICOM Burner"
                className="h-14 w-11 object-contain drop-shadow-[0_10px_22px_rgba(255,107,20,0.3)]"
              />
              <div>
                <p className="text-xl font-bold leading-tight text-white">Raster DICOM Burner</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-100/70">
                  Medical Imaging Solutions
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-cyan-50/70 backdrop-blur sm:flex">
              <Clock size={16} />
              <span>
                {time.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' '}
                {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="max-w-2xl py-12 lg:py-0">

            <h1 className="max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Burn, Track, and manage DICOM studies with confidence.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-cyan-50/68">
              Login to continue to the diagnostic suite and prepare patient imaging media for reliable delivery.
            </p>
          </div>

          <div className="hidden text-xs text-cyan-50/42 lg:block">
            &copy; Raster Images 2026. All Rights Reserved.
          </div>
        </section>

        <section className="flex items-center justify-center px-5 pb-8 sm:px-8 lg:px-14 lg:py-10">
          <Card className="relative w-full max-w-[400px]  rounded-[28px] border-cyan-100/38 bg-[#07172e]/78 text-white shadow-[0_28px_90px_rgba(0,0,0,0.44),0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_0_rgba(255,255,255,0.42),inset_0_-1px_0_rgba(125,211,252,0.12)] backdrop-blur-2xl">
            <img
              src="/assets/cd-logo.png"
              alt=""
              className="pointer-events-none absolute -right-4 -top-20 h-48 w-auto drop-shadow-[0_10px_22px_rgba(255,107,20,0.3)]"
            />
            <CardHeader className="p-10">
              <CardDescription className="text-lg font-semibold uppercase tracking-[0.24em] text-cyan-100/58">
                Welcome back
              </CardDescription>
              <CardTitle className="mt-3 text-3xl font-semibold text-white">Login</CardTitle>
            </CardHeader>

            <CardContent className="relative p-7 pt-0 sm:p-9 sm:pt-0">
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label className="ml-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/62">
                    Username
                  </Label>
                  <div className="relative">
                    <Input
                      icon={User}
                      className="h-10 rounded-2xl border-white/18 bg-white/[0.095] py-3 pl-12 pr-4 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_12px_28px_rgba(0,0,0,0.16)] backdrop-blur-md transition placeholder:text-cyan-100/38 focus-visible:border-cyan-200/80 focus-visible:bg-white/[0.14] focus-visible:ring-cyan-200/20"
                      placeholder="Enter username"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="ml-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-100/62">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      icon={Lock}
                      className="h-10 rounded-2xl border-white/18 bg-white/[0.095] py-3 pl-12 pr-12 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_12px_28px_rgba(0,0,0,0.16)] backdrop-blur-md transition placeholder:text-cyan-100/38 focus-visible:border-cyan-200/80 focus-visible:bg-white/[0.14] focus-visible:ring-cyan-200/20"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-100/58 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <Button
                  type="button"
                  disabled={isLoggingIn}
                  className="mt-2 h-14 w-full rounded-2xl bg-[linear-gradient(180deg,#ffb33f_0%,#f05a24_100%)] text-lg font-bold text-white shadow-[0_16px_34px_rgba(240,90,36,0.28)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={handleLogin}
                >
                  {isLoggingIn ? (
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <>
                      Log In
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
      {inactiveWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-[linear-gradient(90deg,transparent,#f59e0b,#eab308,#f59e0b,transparent)]" />

          <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-500/10 blur-2xl pointer-events-none" />

          <div className="relative px-8 pb-8 pt-10 text-center">
            <div className="animate-warn-ring mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-yellow-400/50 bg-yellow-500/10 shadow-[0_0_28px_rgba(234,179,8,0.3)]">
              <TriangleAlert className="h-10 w-10 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
            </div>

            <h3 className="text-2xl font-extrabold tracking-tight text-yellow-400 drop-shadow-[0_0_12px_rgba(234,179,8,0.45)]">
              Account Inactive
            </h3>

            <div className="mx-auto mt-1 h-px w-16 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

            <p className="mt-4 text-sm leading-6 text-white/80">
              {inactiveWarning}
            </p>

            <Button
              className="mt-7 h-12 w-full rounded-2xl bg-[linear-gradient(180deg,#fbbf24,#d97706)] text-sm font-bold text-black shadow-[0_8px_24px_rgba(234,179,8,0.35)] transition hover:brightness-110 active:scale-[0.98]"
              onClick={() => setInactiveWarning('')}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginScreen;
