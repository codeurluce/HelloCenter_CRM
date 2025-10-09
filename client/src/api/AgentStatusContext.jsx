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
import { getCurrentUser } from "../api/authAPI.js";
import { toast } from "react-toastify";

const AgentStatusContext = createContext();
export const useAgentStatus = () => useContext(AgentStatusContext);

export const AgentStatusProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInactive, setIsInactive] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);

  const navigate = useNavigate();
  const userRef = useRef(user);
  const manualLogoutRef = useRef(false);
  const recentlyConnectedRef = useRef(false);
  const validationRef = useRef(false);

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
      socket.on("connect", () => {
        console.log("[FRONT] ✅ Socket connecté :", socket.id);
      });

      socket.off("disconnect");
      socket.on("disconnect", () => {
        console.log("[FRONT] ❌ Socket déconnecté :", socket.id);
      });

      socket.off("session_closed_force");
      socket.on("session_closed_force", ({ reason }) => {
        console.log("[FRONT] 📩 session_closed_force reçu →", reason);
        handleForcedLogout(reason);
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
      inactivityTimer = setTimeout(triggerForcedLogout, 600_000); // 10 minutes d'inactivité en mode disponible
    };

    const events = [
      "mousedown",   // Quand un bouton de la souris est pressé (clic gauche, droit ou molette)
      "mousemove",   // Quand la souris bouge sur la page
      "keypress",    // Quand une touche du clavier est enfoncée (déprécié, on utilise souvent "keydown")
      "scroll",      // Quand l’utilisateur fait défiler la page (barre de défilement, molette ou swipe)
      "touchstart",  // Quand un utilisateur touche l’écran sur mobile/tablette
      "click",       // Quand un clic complet est effectué (mousedown + mouseup)
      "wheel",       // Quand l’utilisateur fait tourner la molette de la souris
      "pointermove"  // Déplacement de tout type de pointeur (souris, stylet, tactile)
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
      try {
        await axiosInstance.post("/session_agents/heartbeat", {});
      } catch (err) {
        console.warn("Heartbeat échoué");
      }
    };

    sendHeartbeat();
    const hbInterval = setInterval(sendHeartbeat, 25_000);
    return () => clearInterval(hbInterval);
  }, [user?.id]);

  // 🚨 Gestion déconnexion forcée (inactivité backend)
  useEffect(() => {
    if (isInactive) {
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
  }, [isInactive, navigate]);

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
          } else {
            toast.warn(
              "Vous avez été déconnecté pour inactivité. Veuillez vous reconnecter.",
              {
                autoClose: 4000,
                onClose: () => {
                  localStorage.clear();
                  setUser(null);
                  navigate("/login");
                },
              }
            );
          }
        })
        .catch((err) => {
          console.error("[FRONT] Erreur /users/validate :", err);
          toast.warn("Votre session a expiré. Veuillez vous reconnecter.", {
            autoClose: 4000,
            onClose: () => {
              localStorage.clear();
              setUser(null);
              navigate("/login");
            },
          });
        });
    } else {
      navigate("/login");
    }
  }, [connectSocket, navigate]);

  // 👁️ Revalidation au retour (Ctrl+Shift+T, veille…)
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
            toast.warn(
              "Vous avez été déconnecté pour inactivité. Veuillez vous reconnecter.",
              {
                autoClose: 4000,
                onClose: () => {
                  localStorage.clear();
                  setUser(null);
                  setCurrentStatus("Hors ligne");
                  navigate("/login");
                },
              }
            );
          }
        } catch (err) {
          console.error("Erreur revalidation visibility :", err);
          toast.warn("Votre session a expiré. Veuillez vous reconnecter.", {
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
    } catch (err) {
      console.warn(err);
    }
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
      }}
    >
      {children}
    </AgentStatusContext.Provider>
  );
};

export default AgentStatusProvider;