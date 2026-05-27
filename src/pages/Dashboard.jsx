import React, { useState, useEffect } from "react";
import { API_BASE } from "../api";

export default function Dashboard({ user, onStartWorkout, onLogout }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Custom states for exercise configuration
  const [exercises, setExercises] = useState([
    { id: "Squats", name: "Squats", desc: "Targets Quads & Glutes", sets: 3, reps: 12, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7QoJ8GLpS5k6-cIGtv7-wEUbLbNUXII6mO9nhBx1fRE3JTaOl9xP-7uquFQh9Weq18y_gvheCIX2mtWsbMj7Mxk-F7Mv7hPZI8EoB6EL_maiB9B8QoJIbKF5v0049iPxzt0HiwPmLik_jGMWU0lBnY28aVwSnW_LI0fG8lQfyviL9ghnq-rh_rqpR90BUWkcFq4-pT3QVUSw0gnJnGVX42Hhdn5OganiXds-2DGCMR8IgnKwMqAEoRisaJ6kQ7rouj8r3KzJXR26k" },
    { id: "Push-ups", name: "Push-ups", desc: "Targets Chest & Triceps", sets: 3, reps: 15, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBeG3NueCVn9pcn1sLJo6Qjiw7BJoUUw-2nGS2Tqg9t0L6GqZbRNHx7-XqCMYqZbaZpYRWnLCGbfmWURXlCZGcEiX39sa7kXKqMeU5FwacFRQxen406dtazxNdA_EBwIiYpLE2NP5uL4XbrtYarZ-VuW80QGBfc1aKRwsp_f4NKIkQ1D7QgLIoTtuQUvbVcLBiaWdHLJsKTXVFMsG234ZvHnaCO5r8vkYIF_jkKMwPi8AZ_xamNd36zwOdpEaYXQmGkK7p6QFux8uZE" },
    { id: "Biceps Curls (Dumbbell)", name: "Biceps Curls", desc: "Targets Bicep Peaks", sets: 3, reps: 12, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwtUqyE-o8pXh8Q_nZRXYXB0bNoLO-vAFabmdUvmG5q3HZ8PTaQQrFjkp8GOJEX9BuXAqRWI8CNDOekK2LcO-m_bkxU509GmdRrOfwIwkCXhc1F4zdCsXZxmLLeOK8lfCPUBKLSYfM5q_Mth8rQCImUrsIGEGR6DO5OUs3AnvgYKhBLNPbLP6-f87sN0NOlM0zVn0nWsVHxrZt8trufPnSuzMwzzbRwl48KgDTXQCXL2hZBdHcNH9K2WsL_KiXqaV_IutSEJM1yjv8" },
    { id: "Shoulder Press", name: "Shoulder Press", desc: "Targets Deltoids", sets: 3, reps: 10, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgMscPjYROIHl6R1yo4s7U0wP09eF6yy8JFU_05KMpnDyBz7EYL8F7fkQSqusoy7VVCk2lCO2O_eNTJ9wwFvmdhsGYcBsCJAab8KinFbyrQEr21thxkFcxyBCkm_YOB7RC1Cy3UeBDiVhU_txGulY4ntC-q5rHPJMsb-WWhVGkrBzR3Tn35g9a5Bt5D69rn-CWn9-w7Iiqk8JmnOnAfiRYZVzapzm3PHEnTo7JQ2fFZqWShJYIlranbExoiZpPA516ik3vs2agvrnb" },
    { id: "Lunges", name: "Lunges", desc: "Targets Legs & Core", sets: 3, reps: 10, image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAG070iZKqT4rBpIatJppSxO4JtWVG-LzbwOXyWQg1Vn4hahBvepr4Vfe0CwAXJU89nRafeKNhqBECSPBjsiQHbyCVyOrZRaRJYLPHlQlPd-VLYNX7pmydtEFFUC11XEEXvBHLEvxya5Pg656EEHhwiQDQW7HwYIR1qFIkrq1JIrm6TIm0i7DYDMonHmezRxHcbiWtN4WLNtXmd-eBpkq8JCk0u-ehUlSVWZ-qYzKGJFcY9WJy5RQA_yHvryn4byyiXSE4Us5SgvPxF" }
  ]);

  // Fetch workout history from backend
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/history/${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch history");
        const data = await res.ok ? await res.json() : [];
        setHistory(data);
      } catch (err) {
        console.error(err);
        setError("Could not load workout history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user.id]);

  const handleUpdateSets = (id, newSets) => {
    setExercises(prev =>
      prev.map(ex => (ex.id === id ? { ...ex, sets: Math.max(1, parseInt(newSets) || 1) } : ex))
    );
  };

  const handleUpdateReps = (id, newReps) => {
    setExercises(prev =>
      prev.map(ex => (ex.id === id ? { ...ex, reps: Math.max(1, parseInt(newReps) || 1) } : ex))
    );
  };

  const handleDeleteExercise = (id) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
  };

  // Calculate stats
  const totalReps = history.reduce((sum, item) => sum + (item.reps || 0), 0);
  const totalHours = (history.reduce((sum, item) => sum + (item.time || 0), 0) / 3600).toFixed(1);
  const totalSessions = history.length;

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/50 backdrop-blur-xl border-b border-white/10 h-16">
        <div className="flex justify-between items-center h-full px-gutter max-w-container-max mx-auto">
          <div className="flex items-center gap-md">
            <span className="font-display-lg text-display-lg font-black text-primary drop-shadow-[0_0_10px_rgba(152,218,39,0.3)]">
              AIGYM
            </span>
          </div>
          <div className="flex items-center gap-md">
            <button 
              onClick={onLogout}
              className="text-on-surface-variant hover:text-error transition-colors duration-300 font-label-sm mr-4"
            >
              Logout
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors duration-300">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors duration-300">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-white/10 overflow-hidden flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className="fixed left-0 h-full w-64 z-50 hidden lg:flex flex-col p-lg space-y-md bg-surface-container/50 backdrop-blur-2xl border-r border-white/10 shadow-2xl shadow-primary/5 pt-20">
        <div className="mb-xl">
          <h2 className="font-headline-sm text-headline-sm font-bold text-primary">AI COACH</h2>
          <p className="font-label-lg text-label-lg text-on-surface-variant opacity-70">Elite Performance</p>
        </div>
        <nav className="flex-grow space-y-sm">
          <a className="flex items-center gap-md bg-primary/10 text-primary rounded-xl px-md py-sm border-l-4 border-primary translate-x-1 transition-transform" href="#" onClick={(e) => e.preventDefault()}>
            <span className="material-symbols-outlined">home</span>
            <span className="font-label-lg text-label-lg">Home</span>
          </a>
          <a className="flex items-center gap-md text-on-surface-variant px-md py-sm hover:bg-surface-bright/20 hover:text-on-surface transition-all" href="#" onClick={(e) => e.preventDefault()}>
            <span className="material-symbols-outlined">fitness_center</span>
            <span className="font-label-lg text-label-lg">Train</span>
          </a>
          <a className="flex items-center gap-md text-on-surface-variant px-md py-sm hover:bg-surface-bright/20 hover:text-on-surface transition-all" href="#" onClick={(e) => e.preventDefault()}>
            <span className="material-symbols-outlined">history_edu</span>
            <span className="font-label-lg text-label-lg">Log</span>
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="lg:ml-64 pt-20 pb-20 lg:pb-lg px-gutter max-w-container-max">
        <div className="mb-xl">
          <h1 className="font-display-lg text-display-lg text-white font-black mb-xs">
            Welcome back, {user.username}!
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Ready to break your records today? AI Coach has prepared a session based on your profile.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-lg items-start">
          {/* Left Column: Plan Your Workout */}
          <div className="xl:col-span-7 space-y-lg">
            <section className="glass-card rounded-2xl p-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-lg">
                  <h2 className="font-headline-md text-headline-md text-white">Plan Your Workout</h2>
                  <span className="bg-secondary-container/20 text-secondary px-sm py-xs rounded text-[12px] font-bold tracking-widest uppercase">
                    Custom Routine
                  </span>
                </div>

                <div className="space-y-md">
                  {exercises.length === 0 ? (
                    <div className="p-6 text-center text-on-surface-variant">
                      No exercises in plan. Add one to begin.
                    </div>
                  ) : (
                    exercises.map((ex) => (
                      <div
                        key={ex.id}
                        className="flex flex-col md:flex-row items-center gap-md p-md bg-surface-container-low rounded-xl border border-white/5 hover:border-primary/30 transition-all group"
                      >
                        <div className="w-16 h-16 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0">
                          <img
                            alt={ex.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            src={ex.image}
                          />
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-label-lg text-label-lg text-white">{ex.name}</h3>
                          <p className="text-on-surface-variant text-[12px]">{ex.desc}</p>
                        </div>
                        <div className="flex items-center gap-sm">
                          <div className="flex flex-col">
                            <label className="text-[10px] text-on-surface-variant uppercase font-bold px-1">Sets</label>
                            <input
                              className="w-16 bg-surface-container-highest border border-white/10 rounded-lg px-2 py-2 text-center text-primary focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none"
                              type="number"
                              value={ex.sets}
                              onChange={(e) => handleUpdateSets(ex.id, e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col">
                            <label className="text-[10px] text-on-surface-variant uppercase font-bold px-1">Reps</label>
                            <input
                              className="w-16 bg-surface-container-highest border border-white/10 rounded-lg px-2 py-2 text-center text-primary focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none"
                              type="number"
                              value={ex.reps}
                              onChange={(e) => handleUpdateReps(ex.id, e.target.value)}
                            />
                          </div>
                          <button
                            onClick={() => onStartWorkout(ex)}
                            className="ml-2 px-3 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:scale-105 transition-all"
                          >
                            GO
                          </button>
                          <button
                            onClick={() => handleDeleteExercise(ex.id)}
                            className="w-10 h-10 flex items-center justify-center text-error opacity-40 hover:opacity-100 transition-opacity"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* AI Insight Banner */}
            <div className="bg-secondary/10 border border-secondary/20 rounded-2xl p-md flex items-center gap-md">
              <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <div>
                <p className="font-label-lg text-label-lg text-secondary">AI Coach Suggestion</p>
                <p className="text-on-surface-variant text-[12px]">
                  Based on your performance trend, I recommend practicing Squats and Push-ups at a steady depth today.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Workout History & Stats */}
          <div className="xl:col-span-5 flex flex-col gap-lg h-full">
            {/* Workout History List */}
            <section className="glass-card rounded-2xl p-lg flex flex-col h-full flex-grow">
              <div className="flex items-center justify-between mb-lg">
                <h2 className="font-headline-md text-headline-md text-white">Workout History</h2>
                <span className="text-secondary text-label-sm font-bold flex items-center gap-xs">
                  Logged Sets
                </span>
              </div>

              <div className="space-y-md overflow-y-auto max-h-[350px] custom-scrollbar pr-2">
                {loading ? (
                  <div className="p-6 text-center text-on-surface-variant animate-pulse">
                    Loading history logs...
                  </div>
                ) : history.length === 0 ? (
                  <div className="p-6 text-center text-on-surface-variant">
                    No workout history records found.
                  </div>
                ) : (
                  history.map((h, index) => {
                    const dateObj = new Date(h.created_at);
                    const day = dateObj.getDate() || index + 1;
                    const month = dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase() || "OCT";
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-md p-md border-b border-white/5 hover:bg-white/5 transition-all rounded-lg"
                      >
                        <div className="text-center w-12 flex-shrink-0">
                          <span className="block text-primary font-bold text-headline-sm leading-none">
                            {day}
                          </span>
                          <span className="text-[10px] text-on-surface-variant uppercase font-bold">
                            {month}
                          </span>
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-label-lg text-label-lg text-white">{h.exercise_name}</h4>
                          <p className="text-[12px] text-on-surface-variant">
                            {h.sets} set{h.sets > 1 ? "s" : ""} • {h.reps} total reps • {h.time}s duration
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-secondary font-bold">+{h.reps} reps</span>
                          <p className="text-[10px] text-on-surface-variant uppercase">Logged</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Aggregated Stats at the Bottom of History */}
              <div className="mt-auto pt-lg grid grid-cols-3 gap-md border-t border-white/10">
                <div className="text-center">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-xs">Total Reps</p>
                  <p className="text-headline-sm font-black text-primary">{totalReps}</p>
                  <div className="h-1 w-8 bg-primary/20 mx-auto mt-xs rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-2/3"></div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-xs">Hours</p>
                  <p className="text-headline-sm font-black text-secondary">{totalHours}</p>
                  <div className="h-1 w-8 bg-secondary/20 mx-auto mt-xs rounded-full overflow-hidden">
                    <div className="h-full bg-secondary w-3/4"></div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-xs">Sessions</p>
                  <p className="text-headline-sm font-black text-white">{totalSessions}</p>
                  <div className="h-1 w-8 bg-white/20 mx-auto mt-xs rounded-full overflow-hidden">
                    <div className="h-full bg-white w-full"></div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
