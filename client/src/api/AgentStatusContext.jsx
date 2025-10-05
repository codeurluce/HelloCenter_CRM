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
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const userRef = useRef(user);
  const manualLogoutRef = useRef(false);
  const recentlyConnectedRef = useRef(false);

  // 📡 Gestion des déconnexions forcées
  const handleForcedLogout = useCallback(
    async (reason) => {
      if (recentlyConnectedRef.current) return;

      if (manualLogoutRef.current && reason === "Déconnexion volontaire") {
        manualLogoutRef.current = false;
        return;
      }

      toast.warn(reason || "Déconnexion forcée.", {
        autoClose: 4000,
        onClose: async () => {
          try {
            if (userRef.current?.id) {
              await axiosInstance.post("/agent/disconnect-force", {
                userId: userRef.current.id,
              });
            }
          } catch (err) {
            console.error(err);
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

  // 🔌 Gestion socket
  const connectSocket = useCallback(
    (userId) => {
      if (!socket.connected) {
        socket.auth = { userId };
        socket.connect();
      }

      socket.off("connect");
      socket.on("connect", () =>
        console.log("[FRONT] ✅ Socket connecté :", socket.id)
      );

      socket.off("disconnect");
      socket.on("disconnect", () =>
        console.log("[FRONT] ❌ Socket déconnecté :", socket.id)
      );

      socket.off("session_closed_force");
      socket.on("session_closed_force", ({ reason }) => {
        console.log("[FRONT] 📩 Déconnexion forcée :", reason);
        handleForcedLogout(reason);
      });
    },
    [handleForcedLogout]
  );

  // 🔐 Validation et récupération user via /me
  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          userRef.current = currentUser;
          connectSocket(currentUser.id);
        } else {
          toast.warn("Votre session a expiré. Veuillez vous reconnecter.", {
            autoClose: 4000,
            onClose: () => {
              localStorage.clear();
              setUser(null);
              navigate("/login");
            },
          });
        }
      } catch (err) {
        console.error("[FRONT] Erreur récupération utilisateur :", err);
        localStorage.clear();
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [connectSocket, navigate]);

  // 🔁 Heartbeat
  useEffect(() => {
    if (!user?.id) return;
    const sendHeartbeat = async () => {
      try {
        await axiosInstance.post("/session_agents/heartbeat", {});
      } catch {
        console.warn("Heartbeat échoué");
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 25_000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // 🔐 Login agent (appelé depuis Login.jsx)
  const loginAgent = async (userData) => {
    setUser(userData);
    userRef.current = userData;
    recentlyConnectedRef.current = true;
    setTimeout(() => (recentlyConnectedRef.current = false), 5000);
    connectSocket(userData.id);
    try {
      await axiosInstance.post("/agent/connect", { userId: userData.id });
    } catch (err) {
      console.warn(err);
    }
  };

  // 🚪 Logout
  const logoutAgent = async () => {
    manualLogoutRef.current = true;
    if (userRef.current?.id) {
      await axiosInstance.post("/agent/disconnect-force", {
        userId: userRef.current.id,
      });
    }
    if (socket.connected) socket.disconnect();
    localStorage.clear();
    setUser(null);
    setCurrentStatus(null);
    navigate("/login");
  };

  if (loading) return null; // ou un spinner global si tu veux

  return (
    <AgentStatusContext.Provider
      value={{
        user,
        status: currentStatus,
        setCurrentStatus,
        loginAgent,
        logoutAgent,
      }}
    >
      {children}
    </AgentStatusContext.Provider>
  );
};

export default AgentStatusProvider;