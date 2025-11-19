// src/context/AgentStatusProvider.js
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket.js";
import axiosInstance from "../api/axiosInstance.js";
import { toast } from "react-toastify";

// 🔹 Contexte Agent
const AgentStatusContext = createContext();
export const useAgentStatus = () => useContext(AgentStatusContext);

export const AgentStatusProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isInactive, setIsInactive] = useState(false);
  const [pauseForcedByAdmin, setPauseForcedByAdmin] = useState(false);

  const navigate = useNavigate();

  // 🔹 Réfs pour gérer closures et flags
  const userRef = useRef(user);
  const manualLogoutRef = useRef(false);
  const recentlyConnectedRef = useRef(false);
  const validationRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const inactivityIntervalRef = useRef(null);
  const inactivityToastShownRef = useRef(false);

  // ==========================
  // 🔹 Gestion activité
  // ==========================
  const resetActivity = () => {
    lastActivityRef.current = Date.now();
    setIsInactive(false);
  };

  const triggerForcedLogout = async () => {
    stopInactivityCheck();
    try {
      if (userRef.current?.id) {
        await axiosInstance.post("/agent/disconnect-force", { userId: userRef.current.id });
      }
    } catch (err) {
      console.warn("Erreur disconnect-force:", err);
    }

    if (socket.connected) socket.disconnect();
    localStorage.clear();
    setUser(null);
    setCurrentStatus(null);
    // toast.warn("Vous avez été déconnecté. Veuillez vous reconnecter", { autoClose: 4000, onClose: () => navigate("/login"), });
    setIsInactive(true);
  };

  const startInactivityCheck = () => {
    if (inactivityIntervalRef.current) return;
    console.log("🕒 Inactivity check started");
    inactivityIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
    if (elapsed >= 10_800_000) triggerForcedLogout(); // 3 heures (3 * 60 * 60 * 1000)
    }, 60_000);
  };

  const stopInactivityCheck = () => {
    clearInterval(inactivityIntervalRef.current);
    inactivityIntervalRef.current = null;
    console.log("🕒 Inactivity check stopped");
  };

  // ==========================
  // 🔹 Rafraîchir statut backend
  // ==========================
  const refreshStatusFromBackend = async () => {
    if (!userRef.current?.id) return;
    try {
      const res = await axiosInstance.get(`/session_agents/last-status/${userRef.current.id}`);
      setCurrentStatus(res.data?.statut_actuel || "Hors Ligne");
    } catch (err) {
      console.error("Erreur récupération statut backend :", err);
    }
  };

  // ==========================
  // 🔹 Gestion socket
  // ==========================
  const handleForcedLogout = useCallback(
    async (reason) => {
      stopInactivityCheck();
      if (recentlyConnectedRef.current) return;

      if (manualLogoutRef.current && reason === "Déconnexion volontaire") {
        manualLogoutRef.current = false;
        return;
      }

      if (reason.includes("inactivité") || reason.includes("forcée")) {
        setIsInactive(true);
        return;
      }

      toast.warn(reason, {
        autoClose: 4000,
        onClose: async () => {
          if (userRef.current?.id) {
            try {
              await axiosInstance.post("/agent/disconnect-force", { userId: userRef.current.id });
            } catch (err) {
              console.error(err);
            }
          }
          if (socket.connected) socket.disconnect();
          localStorage.clear();
          setUser(null);
          setCurrentStatus("Hors Ligne");
          navigate("/login");
        },
      });
    },
    [navigate]
  );

  const connectSocket = useCallback(
    (userId) => {
      if (!socket.connected) {
        socket.auth = { userId };
        socket.connect();
      }

      socket.off("connect");
      socket.on("connect", () => console.log("[FRONT] ✅ Socket connecté :", socket.id));

      socket.off("disconnect");
      socket.on("disconnect", () => console.log("[FRONT] ❌ Socket déconnecté :", socket.id));

      socket.off("session_closed_force");
      socket.on("session_closed_force", ({ reason }) => handleForcedLogout(reason));

      socket.off("force_pause_by_admin");
      socket.on("force_pause_by_admin", async ({ reason }) => {
        console.log("[FRONT] 📩 Pause forcée reçue :", reason);
        setPauseForcedByAdmin(true);

        toast.info(reason || "Pause forcée par l’administrateur", { autoClose: 5000 });

        try {
          if (userRef.current?.id) {
            await axiosInstance.post("/session_agents/start", {
              user_id: userRef.current.id,
              status: "Déjeuner",
              pause_type: "forcée par l'admin",
            });
          }
          await refreshStatusFromBackend();

          setTimeout(() => {
            console.log("⏳ Reload automatique lancé...");
            window.location.reload();
          }, 5500);
        } catch (err) {
          console.error("Erreur traitement pause forcée :", err);
        } finally {
          setTimeout(() => setPauseForcedByAdmin(false), 3000);
        }
      });
    },
    [handleForcedLogout]
  );

  // ==========================
  // 🔹 Détection d’inactivité
  // ==========================
  useEffect(() => {
    if (!user?.id || currentStatus !== "Disponible") return;

    const handleVisibility = () => {
      if (document.visibilityState === "visible") resetActivity();
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click", "wheel", "pointermove"];
    events.forEach((e) => window.addEventListener(e, resetActivity, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibility);

    startInactivityCheck();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetActivity, { passive: true }));
      document.removeEventListener("visibilitychange", handleVisibility);
      stopInactivityCheck();
    };
  }, [user?.id, currentStatus]);

  // ==========================
  // 🔹 Heartbeat HTTP (45s)
  // ==========================
  useEffect(() => {
    if (!user?.id) return;
    let hbInterval = null;

    const sendHeartbeat = async () => {
      try {
        await axiosInstance.post("/session_agents/heartbeat");
        console.log('💓 Heartbeat envoyé du frontend à', new Date().toLocaleString());
      } catch {
        console.warn("Heartbeat échoué");
      }
    };

    const startHeartbeat = () => {
      if (hbInterval) return;
      sendHeartbeat();
      hbInterval = setInterval(sendHeartbeat, 30_000);
    };

    const stopHeartbeat = () => {
      if (hbInterval) clearInterval(hbInterval);
      hbInterval = null;
    };

    const handleVisibilityChange = () => {
      document.visibilityState === "visible" ? startHeartbeat() : stopHeartbeat();
    };

    if (document.visibilityState === "visible") startHeartbeat();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.id]);

  // ==========================
  // 🔹 Gestion inactivité backend
  // ==========================
  useEffect(() => {
    if (isInactive && !pauseForcedByAdmin && !inactivityToastShownRef.current) {
      inactivityToastShownRef.current = true;
      toast.warn("Vous avez été déconnecté pour inactivité. Veuillez vous reconnecter.", {
        autoClose: 4000,
        onClose: () => {
          if (socket.connected) socket.disconnect();
          localStorage.clear();
          setUser(null);
          setCurrentStatus(null);
          setIsInactive(false);
          inactivityToastShownRef.current = false;
          navigate("/login");
        },
      });
    }
  }, [isInactive, pauseForcedByAdmin, navigate]);

  // ==========================
  // 🔹 Validation session au chargement
  // ==========================
  useEffect(() => {
    if (validationRef.current) return;
    validationRef.current = true;

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) return navigate("/login");

    axiosInstance.get("/users/validate", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (res.data.valid) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          userRef.current = parsed;
          connectSocket(parsed.id);
          refreshStatusFromBackend();
        } else {
          setIsInactive(true);
          // toast.warn("Vous avez été déconnecté pour inactivité.", {
          //   autoClose: 4000,
          //   onClose: () => { localStorage.clear(); setUser(null); navigate("/login"); }
          // });
        }
      })
      .catch(err => {
        console.error("[FRONT] Erreur /users/validate :", err);
        toast.warn("Votre session a expiré.", {
          autoClose: 4000,
          onClose: () => { localStorage.clear(); setUser(null); navigate("/login"); }
        });
      });
  }, [connectSocket, navigate]);

  // ==========================
  // 🔹 Revalidation retour page
  // ==========================
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== "visible" || !user?.id) return;

      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await axiosInstance.get("/users/validate", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.data.valid) {
          setIsInactive(true);
          // toast.warn("Vous avez été déconnecté pour inactivité.", {
          //   autoClose: 4000,
          //   onClose: () => {
          //     localStorage.clear();
          //     setUser(null);
          //     setCurrentStatus("Hors ligne");
          //     navigate("/login");
          //   },
          // });
        }
      } catch (err) {
        console.error("Erreur revalidation visibility :", err);
        toast.warn("Votre session a expiré.", {
          autoClose: 4000,
          onClose: () => {
            localStorage.clear();
            setUser(null);
            navigate("/login");
          },
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user?.id, navigate]);

  // ==========================
  // 🔹 Login / Logout
  // ==========================
  const loginAgent = async (userData) => {
    setUser(userData);
    userRef.current = userData;
    resetActivity();
    // startInactivityCheck();
    lastActivityRef.current = Date.now();
    recentlyConnectedRef.current = true;
    setTimeout(() => { recentlyConnectedRef.current = false; }, 5000);
    localStorage.setItem("user", JSON.stringify(userData));
    connectSocket(userData.id);

    try {
      await axiosInstance.post("/agent/connect", { userId: userData.id });
    } catch (err) {
      console.warn(err);
    }
  };

  const logoutAgent = async () => {
    manualLogoutRef.current = true;
    if (userRef.current?.id) {
      await axiosInstance.post("/agent/disconnect", { userId: userRef.current.id });
    }
    if (socket.connected) socket.disconnect();
    localStorage.clear();
    setUser(null);
    setCurrentStatus(null);
    navigate("/login");
  };

  return (
    <AgentStatusContext.Provider
      value={{
        status: currentStatus,
        setCurrentStatus,
        user,
        loginAgent,
        logoutAgent,
        handleForcedLogout,
        refreshStatusFromBackend,
      }}
    >
      {children}
    </AgentStatusContext.Provider>
  );
};

export default AgentStatusProvider;
