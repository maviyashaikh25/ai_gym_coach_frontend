import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ActiveWorkout from "./pages/ActiveWorkout";

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("login");
  const [activeWorkout, setActiveWorkout] = useState(null);

  // Auto-restore login session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setScreen("dashboard");
      } catch (e) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setScreen("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setScreen("login");
    setActiveWorkout(null);
  };

  const handleStartWorkout = (workoutConfig) => {
    setActiveWorkout(workoutConfig);
    setScreen("workout");
  };

  const handleEndWorkout = () => {
    setScreen("dashboard");
    setActiveWorkout(null);
  };

  // Render appropriate screen
  if (screen === "login" || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (screen === "workout" && activeWorkout) {
    return (
      <ActiveWorkout
        user={user}
        workout={activeWorkout}
        onEndWorkout={handleEndWorkout}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      onStartWorkout={handleStartWorkout}
      onLogout={handleLogout}
    />
  );
}
