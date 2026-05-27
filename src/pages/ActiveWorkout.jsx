import React, { useState, useEffect, useRef } from "react";
import { API_BASE } from "../api";

// Pose connections mapping from workout config
const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Shoulders & Arms
  [11, 23], [12, 24], [23, 24],                     // Torso/Hips
  [23, 25], [24, 26], [25, 27], [26, 28],            // Legs
  [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
];

export default function ActiveWorkout({ user, workout, onEndWorkout }) {
  const [reps, setReps] = useState(0);
  const [setsCompleted, setSetsCompleted] = useState(0);
  const [currentSetReps, setCurrentSetReps] = useState(0);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [poseDetected, setPoseDetected] = useState(false);
  const [metrics, setMetrics] = useState({});
  const [coachFeedback, setCoachFeedback] = useState("Connecting camera and initializing coach...");
  const [feedbackLogs, setFeedbackLogs] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const lastApiCallRef = useRef(0);

  // Helper to play base64 mp3 audio feedback
  const playAudioFeedback = (base64Audio) => {
    if (!base64Audio) return;
    try {
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      const audio = new Audio(audioUrl);
      audio.play().catch(e => console.warn("Audio autoplay blocked by browser:", e));
    } catch (err) {
      console.error("Failed to play audio feedback:", err);
    }
  };

  // Start workout session on API
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/workout/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            exercise_type: workout.id, // e.g. "Squats"
            target_sets: workout.sets,
            reps_per_set: workout.reps
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.coach_feedback) {
            setCoachFeedback(data.coach_feedback);
            setFeedbackLogs(prev => [data.coach_feedback, ...prev]);
          }
          playAudioFeedback(data.audio);
        }
      } catch (err) {
        console.error("Error starting workout session:", err);
        setCoachFeedback("Error connecting to server. Form check offline.");
      }
    };

    initSession();
  }, [user.id, workout.id, workout.sets, workout.reps]);

  // Clean up session on component unmount
  useEffect(() => {
    return () => {
      // Send end workout request
      fetch(`${API_BASE}/api/workout/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: user.id })
      }).catch(err => console.error("Error ending session:", err));

      // Stop camera
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (poseInstanceRef.current) {
        poseInstanceRef.current.close();
      }
    };
  }, [user.id]);

  // Setup MediaPipe camera and pose detection
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");

    // Drawing helper
    const drawResults = (results) => {
      const width = canvasElement.width;
      const height = canvasElement.height;

      canvasCtx.clearRect(0, 0, width, height);

      // Draw the video frame flipped for mirror effect
      canvasCtx.save();
      canvasCtx.translate(width, 0);
      canvasCtx.scale(-1, 1);
      canvasCtx.drawImage(results.image, 0, 0, width, height);
      canvasCtx.restore();

      if (results.poseLandmarks) {
        setPoseDetected(true);
        
        // Draw Skeleton Lines
        canvasCtx.lineWidth = 6;
        canvasCtx.strokeStyle = "#98da27"; // Lime Green

        POSE_CONNECTIONS.forEach(([start, end]) => {
          const p1 = results.poseLandmarks[start];
          const p2 = results.poseLandmarks[end];

          if (p1 && p2 && p1.visibility > 0.6 && p2.visibility > 0.6) {
            canvasCtx.beginPath();
            // Flipped x coordinate for mirror effect
            canvasCtx.moveTo((1 - p1.x) * width, p1.y * height);
            canvasCtx.lineTo((1 - p2.x) * width, p2.y * height);
            canvasCtx.stroke();
          }
        });

        // Draw Keypoint Joints
        results.poseLandmarks.forEach((lm) => {
          if (lm.visibility > 0.6) {
            canvasCtx.beginPath();
            canvasCtx.arc((1 - lm.x) * width, lm.y * height, 6, 0, 2 * Math.PI);
            canvasCtx.fillStyle = "#2fd9f4"; // Cyan
            canvasCtx.fill();
          }
        });
      } else {
        setPoseDetected(false);
        // Display no pose detected warning
        canvasCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
        canvasCtx.fillRect(0, 0, width, height);
        canvasCtx.fillStyle = "#ffb4ab"; // Error/Red color
        canvasCtx.font = "bold 24px Outfit, sans-serif";
        canvasCtx.textAlign = "center";
        canvasCtx.fillText("NO POSE DETECTED", width / 2, height / 2 - 15);
        canvasCtx.font = "16px Inter, sans-serif";
        canvasCtx.fillText("Please face the camera and step back", width / 2, height / 2 + 15);
      }
    };

    // Instantiate MediaPipe Pose
    const pose = new window.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    poseInstanceRef.current = pose;

    pose.onResults((results) => {
      // Render skeleton on canvas
      drawResults(results);

      // Throttling API Sync to ~6 frames/second to prevent network lag
      const now = Date.now();
      if (now - lastApiCallRef.current > 150) {
        lastApiCallRef.current = now;
        
        const landmarks = results.poseLandmarks ? results.poseLandmarks.map(lm => ({
          x: lm.x,
          y: lm.y,
          visibility: lm.visibility || 0.0
        })) : [];

        syncStateWithBackend(landmarks);
      }
    });

    // Start Camera
    const camera = new window.Camera(videoRef.current, {
      onFrame: async () => {
        await pose.send({ image: videoRef.current });
      },
      width: 640,
      height: 480
    });

    camera.start().catch(err => {
      console.error("Camera access denied:", err);
      setCoachFeedback("Camera access denied. Please allow camera permissions to start tracking.");
    });
    
    cameraRef.current = camera;

  }, [workout.id]);

  // Send landmarks coordinates to FastAPI for exercise analysis
  const syncStateWithBackend = async (landmarks) => {
    try {
      const res = await fetch(`${API_BASE}/api/workout/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          landmarks: landmarks
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      
      setReps(data.reps);
      setSetsCompleted(data.sets_completed);
      setCurrentSetReps(data.current_set_reps);
      setWorkoutCompleted(data.workout_completed);
      setMetrics(data.metrics || {});

      if (data.coach_feedback) {
        setCoachFeedback(data.coach_feedback);
        // Prepend feedback, keeping logs fresh
        setFeedbackLogs(prev => {
          if (prev[0] === data.coach_feedback) return prev;
          return [data.coach_feedback, ...prev.slice(0, 19)];
        });
      }

      playAudioFeedback(data.audio);
    } catch (err) {
      console.error("Error syncing frames:", err);
    }
  };

  const handleEndSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/workout/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: user.id })
      });
      if (res.ok) {
        const data = await res.json();
        playAudioFeedback(data.audio);
      }
    } catch (err) {
      console.error("Error closing session:", err);
    } finally {
      onEndWorkout();
    }
  };

  // Render exercise specific metrics badges
  const renderExerciseMetrics = () => {
    if (workout.id === "Squats") {
      return (
        <>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Knee Angle</p>
            <p className="text-headline-md font-black text-secondary">{metrics.knee_angle || 0}°</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Back Angle</p>
            <p className="text-headline-md font-black text-secondary">{metrics.back_angle || 0}°</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Depth Status</p>
            <p className={`text-headline-sm font-black ${metrics.depth_status === "GOOD DEPTH" ? "text-primary" : "text-error"}`}>
              {metrics.depth_status || "N/A"}
            </p>
          </div>
        </>
      );
    } else if (workout.id === "Push-ups") {
      return (
        <>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Elbow Angle</p>
            <p className="text-headline-md font-black text-secondary">{metrics.elbow_angle || 0}°</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Alignment</p>
            <p className={`text-headline-sm font-black ${metrics.body_alignment === "Good Alignment" ? "text-primary" : "text-error"}`}>
              {metrics.body_alignment || "N/A"}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Hips Status</p>
            <p className={`text-headline-sm font-black ${metrics.hip_status === "CORRECT" ? "text-primary" : "text-error"}`}>
              {metrics.hip_status || "N/A"}
            </p>
          </div>
        </>
      );
    } else if (workout.id === "Biceps Curls (Dumbbell)") {
      return (
        <>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Elbow Angle</p>
            <p className="text-headline-md font-black text-secondary">{metrics.elbow_angle || 0}°</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Elbow Drift</p>
            <p className="text-headline-sm font-black text-secondary">{metrics.shoulder_status || "N/A"}</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Swing Status</p>
            <p className={`text-headline-sm font-black ${metrics.swing_status === "STABLE" ? "text-primary" : "text-error"}`}>
              {metrics.swing_status || "N/A"}
            </p>
          </div>
        </>
      );
    } else if (workout.id === "Shoulder Press") {
      return (
        <>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Elbow Angle</p>
            <p className="text-headline-md font-black text-secondary">{metrics.elbow_angle || 0}°</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Extension</p>
            <p className="text-headline-sm font-black text-secondary">{metrics.extension_status || "N/A"}</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Back Arch</p>
            <p className={`text-headline-sm font-black ${metrics.back_arch_status === "CORRECT" ? "text-primary" : "text-error"}`}>
              {metrics.back_arch_status || "N/A"}
            </p>
          </div>
        </>
      );
    } else if (workout.id === "Lunges") {
      return (
        <>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Front Knee</p>
            <p className="text-headline-md font-black text-secondary">{metrics.front_knee_angle || 0}°</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Torso Angle</p>
            <p className="text-headline-md font-black text-secondary">{metrics.torso_angle || 0}°</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-md border border-white/5 text-center">
            <p className="text-[10px] text-on-surface-variant uppercase font-bold">Balance</p>
            <p className={`text-headline-sm font-black ${metrics.balance_status === "BALANCED" ? "text-primary" : "text-error"}`}>
              {metrics.balance_status || "N/A"}
            </p>
          </div>
        </>
      );
    }
    return null;
  };

  // Percent reps progress
  const progressPercent = Math.min(100, Math.round((currentSetReps / workout.reps) * 100));

  return (
    <div className="bg-background text-on-background font-body-md selection:bg-primary selection:text-on-primary min-h-screen overflow-hidden">
      {/* Top AppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/50 backdrop-blur-xl border-b border-white/10">
        <div className="flex justify-between items-center h-16 px-gutter max-w-container-max mx-auto">
          <div className="flex items-center gap-xl">
            <span className="font-display-lg text-display-lg font-black text-primary drop-shadow-[0_0_10px_rgba(152,218,39,0.3)]">
              AIGYM
            </span>
            <div className="hidden md:flex items-center gap-md">
              <span className="text-primary font-bold border-b-2 border-primary pb-1 font-headline-md text-headline-md">
                Current: {workout.name}
              </span>
              <span className="text-on-surface-variant font-medium font-body-md text-body-md">
                Goal: {workout.sets} Sets x {workout.reps} Reps
              </span>
            </div>
          </div>
          <div className="flex items-center gap-md">
            <button
              onClick={handleEndSession}
              className="bg-error-container text-on-error-container px-md py-sm rounded-xl font-label-lg text-label-lg hover:scale-95 active:opacity-80 transition-all flex items-center gap-xs"
            >
              <span className="material-symbols-outlined style={{ fontVariationSettings: 'FILL' 1 }}">cancel</span>
              End Session
            </button>
          </div>
        </div>
      </header>

      {/* Main workout layout */}
      <main className="pt-20 pb-lg px-gutter max-w-[1920px] mx-auto h-screen grid grid-cols-12 gap-lg overflow-hidden">
        {/* CENTRAL CAMERA FEED PANEL */}
        <section className="col-span-12 lg:col-span-8 flex flex-col gap-lg h-full overflow-hidden">
          <div className="relative flex-grow glass-card rounded-3xl overflow-hidden border-primary/20 neon-glow-primary min-h-[300px]">
            {/* Hidden video element for MediaPipe input */}
            <video
              ref={videoRef}
              className="hidden"
              width="640"
              height="480"
              playsInline
              muted
            />
            {/* Visible Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover"
              width="640"
              height="480"
            />

            {/* REC Indicator */}
            <div className="absolute top-lg left-lg flex items-center gap-xs bg-black/40 backdrop-blur-md px-md py-xs rounded-full border border-white/10">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse-red"></div>
              <span className="font-label-lg text-white text-xs tracking-wider uppercase">Live Syncing</span>
            </div>

            {/* Overlay AI Coach speechbubble */}
            {coachFeedback && (
              <div className="absolute bottom-lg left-lg right-lg bg-slate-900/90 backdrop-blur-md border border-primary/20 rounded-2xl p-md flex items-center gap-md">
                <span className="material-symbols-outlined text-primary text-3xl animate-bounce">
                  psychology
                </span>
                <div>
                  <h4 className="text-[10px] text-primary uppercase font-bold tracking-widest">
                    Apna AI Coach
                  </h4>
                  <p className="text-body-md text-white font-medium italic mt-xs">
                    "{coachFeedback}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT SIDE PANEL - STATS & FEEDBACK LOGS */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-lg h-full overflow-hidden pb-12">
          {/* Reps progress dial */}
          <div className="glass-card rounded-3xl p-lg flex flex-col items-center justify-center text-center">
            <h3 className="font-headline-md text-white mb-md">Rep Progress</h3>
            
            <div className="relative flex items-center justify-center w-40 h-40">
              {/* Circular progress track SVG */}
              <svg className="w-full h-full circle-progress" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#98da27"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                />
              </svg>
              {/* Center Metrics Texts */}
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black text-white">{currentSetReps}</span>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                  of {workout.reps} reps
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-xl w-full mt-lg">
              <div className="border-r border-white/10 text-center">
                <p className="text-[10px] text-on-surface-variant uppercase">Reps Count</p>
                <p className="text-headline-lg font-black text-primary">{reps}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-on-surface-variant uppercase">Sets Done</p>
                <p className="text-headline-lg font-black text-secondary">
                  {setsCompleted} / {workout.sets}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic metrics cards based on selected exercise */}
          <div className="grid grid-cols-3 gap-sm">
            {renderExerciseMetrics()}
          </div>

          {/* Coach live feedback logs */}
          <div className="glass-card rounded-3xl p-lg flex-grow flex flex-col min-h-[150px] overflow-hidden">
            <h3 className="font-headline-sm text-white mb-sm">Coach feedback history</h3>
            <div className="overflow-y-auto custom-scrollbar flex-grow space-y-sm pr-2 text-xs">
              {feedbackLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-lg border border-white/5 ${
                    index === 0 ? "bg-primary/5 text-primary" : "text-on-surface-variant"
                  }`}
                >
                  <p className="font-semibold text-[10px] opacity-60">
                    {index === 0 ? "Latest cue" : `Cue ${feedbackLogs.length - index}`}
                  </p>
                  <p className="italic mt-xs">"{log}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
