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

const AgentStatusContext = createContext();
export const useAgentStatus = () => useContext(AgentStatusContext);

export const AgentStatusProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInactive, setIsInactive] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [pauseForcedByAdmin, setPauseForcedByAdmin] = useState(false);

  const navigate = useNavigate();
  const userRef = useRef(user);
  const manualLogoutRef = useRef(false);
  const recentlyConnectedRef = useRef(false);
  const validationRef = useRef(false);

  // 🔄 Rafraîchir le statut depuis le backend
  const refreshStatusFromBackend = async () => {
    if (!userRef.current?.id) return;
    try {
      const res = await axiosInstance.get(`/session_agents/last-status/${userRef.current.id}`);
      const backendStatus = res.data?.statut_actuel || "Hors Ligne";
      setCurrentStatus(backendStatus);
    } catch (err) {
      console.error("Erreur récupération statut backend :", err);
    }
  };

  // 📡 Gestion des déconnexions forcées (socket)
  const handleForcedLogout = useCallback(
    async (reason) => {
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
              await axiosInstance.post("/agent/disconnect-force", {
                userId: userRef.current.id,
              });
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

  // 🔌 Socket
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

      // 🧠 Pause forcée par admin
      socket.off("force_pause_by_admin");
      socket.on("force_pause_by_admin", async ({ reason }) => {
        console.log("[FRONT] 📩 Pause forcée reçue :", reason);
        setPauseForcedByAdmin(true); // bloque toast inactivité

        toast.info(reason || "Pause forcée par l’administrateur", { autoClose: 5000 });

        try {
          // Démarrer la session "Déjeuner" forcée
          if (userRef.current?.id) {
            await axiosInstance.post("/session_agents/start", {
              user_id: userRef.current.id,
              status: "Déjeuner",
              pause_type: "forcée par l'admin",
            });
          }

          // Synchroniser avec le backend pour récupérer le vrai statut
          await refreshStatusFromBackend();

          // Attendre que le toast s'affiche avant de recharger la page 
          setTimeout(() => {
            console.log("⏳ Reload automatique lancé...");
            window.location.reload();
          }, 5500); // 5.5 secondes = le temps du toast
        } catch (err) {
          console.error("Erreur traitement pause forcée :", err);
        } finally {
          // réactiver l’inactivité après 2-3 secondes
          setTimeout(() => setPauseForcedByAdmin(false), 3000);
        }
      });
    },
    [handleForcedLogout]
  );

  // 🕒 Détection d'inactivité → SEULEMENT si "Disponible"
  useEffect(() => {
    if (!user?.id || currentStatus !== "Disponible") return;

    let inactivityTimer;

    const triggerForcedLogout = () => {
      axiosInstance.post("/agent/disconnect-force", { userId: user.id }).catch(console.error);
      if (socket.connected) socket.disconnect();
      localStorage.clear();
      setUser(null);
      setCurrentStatus(null);
      toast.warn("Vous avez été déconnecté pour inactivité. Veuillez vous reconnecter.", {
        autoClose: 4000,
        onClose: () => navigate("/login"),
      });
    };

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(triggerForcedLogout, 600_000); // 10 min
    };

    const events = [
      "mousedown", "mousemove", "keypress", "scroll",
      "touchstart", "click", "wheel", "pointermove"
    ];

    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer, { passive: true }));
      clearTimeout(inactivityTimer);
    };
  }, [user?.id, currentStatus, navigate]);

  // 🔁 Heartbeat HTTP toutes les 25s
  useEffect(() => {
    if (!user?.id) return;
    const sendHeartbeat = async () => {
      try { await axiosInstance.post("/session_agents/heartbeat", {}); } 
      catch { console.warn("Heartbeat échoué"); }
    };
    sendHeartbeat();
    const hbInterval = setInterval(sendHeartbeat, 25_000);
    return () => clearInterval(hbInterval);
  }, [user?.id]);

  // 🚨 Gestion déconnexion forcée (inactivité backend)
  useEffect(() => {
    if (isInactive && !pauseForcedByAdmin) {
      toast.warn("Vous avez été déconnecté pour inactivité. Veuillez vous reconnecter.", {
        autoClose: 4000,
        onClose: () => {
          if (socket.connected) socket.disconnect();
          localStorage.clear();
          setUser(null);
          setCurrentStatus(null);
          setIsInactive(false);
          navigate("/login");
        },
      });
    }
  }, [isInactive, pauseForcedByAdmin, navigate]);

  // 🔄 Validation au chargement
  useEffect(() => {
    if (validationRef.current) return;
    validationRef.current = true;

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      axiosInstance
        .get("/users/validate", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (res.data.valid) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            userRef.current = parsed;
            connectSocket(parsed.id);

            // récupérer le statut depuis le backend au démarrage
            refreshStatusFromBackend();
          } else {
            toast.warn("Vous avez été déconnecté pour inactivité.", {
              autoClose: 4000,
              onClose: () => { localStorage.clear(); setUser(null); navigate("/login"); },
            });
          }
        })
        .catch((err) => {
          console.error("[FRONT] Erreur /users/validate :", err);
          toast.warn("Votre session a expiré.", {
            autoClose: 4000,
            onClose: () => { localStorage.clear(); setUser(null); navigate("/login"); },
          });
        });
    } else {
      navigate("/login");
    }
  }, [connectSocket, navigate]);

  // 👁️ Revalidation au retour
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && user?.id) {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
          const res = await axiosInstance.get("/users/validate", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.data.valid) {
            toast.warn("Vous avez été déconnecté pour inactivité.", {
              autoClose: 4000,
              onClose: () => {
                localStorage.clear();
                setUser(null);
                setCurrentStatus("Hors ligne");
                navigate("/login");
              },
            });
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
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.id, navigate]);

  // 🔐 Login / Logout
  const loginAgent = async (userData) => {
    setUser(userData);
    userRef.current = userData;
    recentlyConnectedRef.current = true;
    setTimeout(() => { recentlyConnectedRef.current = false; }, 5000);
    localStorage.setItem("user", JSON.stringify(userData));
    connectSocket(userData.id);
    try {
      await axiosInstance.post("/agent/connect", { userId: userData.id });
    } catch (err) { console.warn(err); }
  };

  const logoutAgent = async () => {
    manualLogoutRef.current = true;
    if (userRef.current?.id) {
      await axiosInstance.post("/agent/disconnect-force", { userId: userRef.current.id });
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
