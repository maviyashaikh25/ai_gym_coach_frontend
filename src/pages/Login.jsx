import React, { useState, useEffect } from "react";
import { API_BASE } from "../api";

export default function Login({ onLoginSuccess }) {
  const [athleteId, setAthleteId] = useState("");
  const [securityKey, setSecurityKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [particles, setParticles] = useState([]);

  // Generate particle coordinates for visual effect
  useEffect(() => {
    const list = [];
    for (let i = 0; i < 20; i++) {
      list.push({
        id: i,
        width: Math.random() * 4 + 2,
        height: Math.random() * 4 + 2,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2
      });
    }
    setParticles(list);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!athleteId.trim()) {
      setError("Athlete Identifier is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: athleteId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Authentication failed");
      }

      const data = await response.json();
      // Store user details in localStorage
      localStorage.setItem("user", JSON.stringify(data));
      onLoginSuccess(data);
    } catch (err) {
      setError(err.message || "Cannot connect to server. Ensure backend is reachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-gutter relative selection:bg-primary selection:text-on-primary overflow-hidden w-full">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0">
        <img
          className="w-full h-full object-cover opacity-20 filter grayscale"
          alt="A powerful cinematic wide shot of a lone athlete silhouette standing in a high-tech dark gym environment."
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAG070iZKqT4rBpIatJppSxO4JtWVG-LzbwOXyWQg1Vn4hahBvepr4Vfe0CwAXJU89nRafeKNhqBECSPBjsiQHbyCVyOrZRaRJYLPHlQlPd-VLYNX7pmydtEFFUC11XEEXvBHLEvxya5Pg656EEHhwiQDQW7HwYIR1qFIkrq1JIrm6TIm0i7DYDMonHmezRxHcbiWtN4WLNtXmd-eBpkq8JCk0u-ehUlSVWZ-qYzKGJFcY9WJy5RQA_yHvryn4byyiXSE4Us5SgvPxF"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50"></div>
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Main Content Shell */}
      <main className="relative z-10 w-full max-w-[480px]">
        {/* Brand Header */}
        <div className="text-center mb-xl">
          <h1 className="font-display-lg text-display-lg font-black text-primary drop-shadow-[0_0_15px_rgba(152,218,39,0.4)] tracking-tighter">
            AIGYM
          </h1>
          <p className="font-label-lg text-label-lg text-on-surface-variant mt-xs tracking-widest">
            ELITE PERFORMANCE HUB
          </p>
        </div>

        {/* Glassmorphic Login Card */}
        <div className="glass-card rounded-[2rem] p-xl shadow-2xl">
          <div className="mb-lg">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Welcome Back</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Initialize your biometric session.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-lg">
            {error && (
              <div className="p-3 bg-error-container/40 border border-error/20 text-error rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-base">
              <label className="font-label-lg text-label-lg text-on-surface-variant px-1" htmlFor="athlete_id">
                ATHLETE IDENTIFIER
              </label>
              <div className="group relative">
                <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-secondary transition-colors">
                  <span className="material-symbols-outlined">fingerprint</span>
                </div>
                <input
                  className="w-full bg-surface-container-lowest border border-white/10 rounded-xl py-4 pl-12 pr-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all placeholder:text-on-surface-variant/30"
                  id="athlete_id"
                  placeholder="Enter unique ID"
                  type="text"
                  value={athleteId}
                  onChange={(e) => setAthleteId(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-base">
              <label className="font-label-lg text-label-lg text-on-surface-variant px-1" htmlFor="security_key">
                SECURITY KEY
              </label>
              <div className="group relative">
                <div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none text-on-surface-variant group-focus-within:text-secondary transition-colors">
                  <span className="material-symbols-outlined">key</span>
                </div>
                <input
                  className="w-full bg-surface-container-lowest border border-white/10 rounded-xl py-4 pl-12 pr-md font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all placeholder:text-on-surface-variant/30"
                  id="security_key"
                  placeholder="••••••••••••"
                  type="password"
                  value={securityKey}
                  onChange={(e) => setSecurityKey(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
              <label className="flex items-center gap-sm cursor-pointer hover:text-on-surface transition-colors">
                <input
                  className="w-4 h-4 rounded border-white/20 bg-surface-container-low text-primary focus:ring-primary/20"
                  type="checkbox"
                  defaultChecked
                />
                Stay linked
              </label>
              <a className="hover:text-secondary transition-colors" href="#" onClick={(e) => e.preventDefault()}>
                Forgot Key?
              </a>
            </div>

            <button
              className="w-full bg-primary text-on-primary font-headline-md text-headline-md py-4 rounded-xl flex items-center justify-center gap-sm neon-glow-lime hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-wait"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span> CONNECTING...
                </>
              ) : (
                <>
                  START YOUR SESSION
                  <span className="material-symbols-outlined font-bold">bolt</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-xl">
            <div className="relative flex items-center justify-center mb-lg">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <span className="relative bg-surface-container/50 px-md font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
                Alternate Access
              </span>
            </div>

            <div className="grid grid-cols-2 gap-md">
              <button
                onClick={() => setAthleteId("google_athlete")}
                className="flex items-center justify-center gap-sm bg-surface-container-low border border-white/10 rounded-xl py-3 hover:bg-surface-bright/20 transition-all group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                <span className="font-label-lg text-label-lg text-on-surface">Google</span>
              </button>

              <button
                onClick={() => setAthleteId("apple_athlete")}
                className="flex items-center justify-center gap-sm bg-surface-container-low border border-white/10 rounded-xl py-3 hover:bg-surface-bright/20 transition-all group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="white" viewBox="0 0 24 24">
                  <path d="M17.05 20.28c-.96 0-2.04-.6-3.21-.6-1.19 0-2.11.58-3.08.58-1.6 0-4.04-2.8-4.04-6.32 0-3.32 2.06-5.08 4.02-5.08 1.05 0 1.9.7 2.76.7.83 0 1.94-.74 3.09-.74 1.25 0 2.37.66 3.02 1.62-2.52 1.48-2.11 4.39.42 5.51-.83 2-2.02 3.93-3.02 3.93zM14.9 3.12c.98-1.2 2.5-1.12 2.5-1.12s.1 1.54-.86 2.72c-.93 1.13-2.3 1-2.3 1s-.15-1.48.66-2.6z"></path>
                </svg>
                <span className="font-label-lg text-label-lg text-on-surface">Apple</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-lg text-center font-label-sm text-label-sm text-on-surface-variant flex items-center justify-center gap-lg">
          <a className="hover:text-primary transition-colors" href="#">Privacy Protocol</a>
          <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="hover:text-primary transition-colors" href="#">Neural Sync Support</a>
        </div>
      </main>

      {/* Floating Atmosphere Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-primary/20 blur-sm animate-pulse"
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}
