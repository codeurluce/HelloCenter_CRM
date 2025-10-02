// AgentStatusProvider.js
import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import socket from "../socket.js";
import axiosInstance from "../api/axiosInstance.js";
import { toast } from "react-toastify";

const AgentStatusContext = createContext();
export const useAgentStatus = () => useContext(AgentStatusContext);

export const AgentStatusProvider = ({ children }) => {
  const [status, setStatus] = useState("Hors ligne");
  const [user, setUser] = useState(null);
  const [isInactive, setIsInactive] = useState(false);
  const navigate = useNavigate();
  const userRef = useRef(user);
  const intervalRef = useRef(null);
  const manualLogoutRef = useRef(false);
  const recentlyConnectedRef = useRef(false);

  // 🔁 Heartbeat HTTP toutes les 25s (source de vérité pour last_ping)
  useEffect(() => {
    if (!user?.id) return;

    const sendHeartbeat = async () => {
      try {
        await axiosInstance.post('/session_agents/heartbeat', {});
      } catch (err) {
        console.warn("Heartbeat échoué – vérification de session nécessaire");
        // Optionnel : appeler /users/validate ici si besoin
      }
    };

    sendHeartbeat();
    const hbInterval = setInterval(sendHeartbeat, 25_000);
    return () => clearInterval(hbInterval);
  }, [user?.id]);

  // 🚨 Gestion de la déconnexion forcée (via socket ou validation)
  useEffect(() => {
    if (isInactive) {
      toast.warn("Vous avez été déconnecté pour inactivité. Veuillez vous reconnecter.", {
        onClose: () => {
          if (socket.connected) socket.disconnect();
          localStorage.clear();
          setUser(null);
          setStatus("Hors ligne");
          setIsInactive(false);
          navigate("/login");
        }
      });
    }
  }, [isInactive, navigate]);

  // 📡 Gestion des déconnexions forcées (socket)
  const handleForcedLogout = useCallback(async (reason) => {

    // ✅ Ignorer les déconnexions forcées juste après connexion
  if (recentlyConnectedRef.current) {
    console.log("[FRONT] Ignoré session_closed_force (connexion récente)");
    return;
  }
    if (manualLogoutRef.current && reason === "Déconnexion volontaire") {
      manualLogoutRef.current = false;
      return;
    }

    if (reason.includes("inactivité") || reason.includes("forcée")) {
      setIsInactive(true);
      return;
    }

    toast.warn(reason, {
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
        setStatus("Hors ligne");
        navigate("/login");
      },
    });
  }, [navigate]);

  // 🔌 Socket.IO
  const connectSocket = useCallback((userId) => {
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
  }, [handleForcedLogout]);

  // 🔄 Validation au chargement
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    console.log("[FRONT] Chargement : user =", storedUser, "token =", !!token);

    if (storedUser && token) {
    axiosInstance.get('/users/validate', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      console.log("[FRONT] /users/validate réponse :", JSON.stringify(res.data));
      console.log("[FRONT] /users/validate réponse :", res.data);
      if (res.data.valid) {
        console.log("[FRONT] Session valide → reconnecter");
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        userRef.current = parsedUser;
        connectSocket(parsedUser.id);
      } else {
        console.log("[FRONT] Session invalide → déconnexion");
        localStorage.clear();
        setUser(null);
        navigate('/login');
      }
    })
    .catch(err => {
      console.error("[FRONT] Erreur /users/validate :", err);
      localStorage.clear();
      setUser(null);
      navigate('/login');
    });
  } else {
    console.log("[FRONT] Pas de user/token → login");
    navigate('/login');
  }
}, [connectSocket, navigate]);

  // 🔐 Login
  const loginAgent = async (userData) => {
    setUser(userData);
    userRef.current = userData;
     recentlyConnectedRef.current = true;
     setTimeout(() => {
    recentlyConnectedRef.current = false;
  }, 5000);

    setStatus("Hors ligne");
    localStorage.setItem("user", JSON.stringify(userData));
    connectSocket(userData.id);
    try {
      await axiosInstance.post("/agent/connect", { userId: userData.id });
    } catch (err) {
      console.warn(err);
    }
  };

  // 🚪 Logout volontaire
  const logoutAgent = async () => {
    manualLogoutRef.current = true;
    if (userRef.current?.id) {
      await axiosInstance.post("/agent/disconnect-force", { userId: userRef.current.id });
      // socket.emit("agent_disconnected", { userId: userRef.current.id });
    }
    if (socket.connected) socket.disconnect();
    localStorage.clear();
    setUser(null);
    setStatus("Hors ligne");
    navigate("/login");
  };

  return (
    <AgentStatusContext.Provider
      value={{
        status,
        setStatus,
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