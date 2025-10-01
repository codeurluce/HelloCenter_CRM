import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../socket.js";
import axiosInstance from "../api/axiosInstance.js";
import { toast } from "react-toastify";

const AgentStatusContext = createContext();
export const useAgentStatus = () => useContext(AgentStatusContext);

export const AgentStatusProvider = ({ children }) => {
  const [status, setStatus] = useState("Hors ligne");
  const [user, setUser] = useState(null);
  const [isInactive, setIsInactive] = useState(false); // Etat inactivité
  const navigate = useNavigate();
  const userRef = useRef(user);
  const intervalRef = useRef(null);
  const manualLogoutRef = useRef(false);

  // Gestion popup alerte inactivité
  // useEffect(() => {
  //   if (isInactive) {
  //     Swal.fire({
  //       title: "Déconnecté pour inactivité",
  //       text: "Vous avez été déconnecté pour inactivité. Veuillez vous reconnecter.",
  //       icon: "warning",
  //       confirmButtonText: "OK",
  //     }).then(() => {
  //       // vider localStorage et rediriger vers login
  //       if (socket.connected) socket.disconnect();
  //       localStorage.clear();
  //       setUser(null);
  //       setStatus("Hors ligne");
  //       setIsInactive(false);
  //       navigate("/login");
  //     });
  //   }
  // }, [isInactive, navigate]);
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

  // Gestion des déconnexions forcées reçues via socket
  const handleForcedLogout = useCallback(async (reason) => {
    if (manualLogoutRef.current && reason === "Déconnexion volontaire") {
      manualLogoutRef.current = false;
      console.log("[FRONT] Déconnexion volontaire locale reçue, popup masquée");
      return;
    }

    if (reason.includes("inactivité") || reason.includes("forcée")) {
      setIsInactive(true);
      return;
    }

    localStorage.setItem("lastLogoutReason", reason);
    toast.warn(reason, {   // toast.warn pour un message d'alerte
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

  // Connexion socket avec écouteurs nettoyés
  const connectSocket = useCallback(
    (userId) => {
      if (!socket.connected) {
        socket.auth = { userId };
        socket.connect();
      }

      socket.off("connect");
      socket.on("connect", () => {
        console.log("[FRONT] ✅ Socket connecté :", socket.id);
        socket.emit("heartbeat", { userId });
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          if (socket.connected) {
            socket.emit("heartbeat", { userId });
            console.log(`[FRONT] heartbeat emit userId=${userId}`);
          }
        }, 5000);
      });

      socket.off("disconnect");
      socket.on("disconnect", () => {
        console.log("[FRONT] ❌ Socket déconnecté :", socket.id);
        clearInterval(intervalRef.current);
      });

      socket.off("session_closed_force");
      socket.on("session_closed_force", ({ reason }) => {
        console.log("[FRONT] 📩 Event session_closed_force reçu →", reason);
        handleForcedLogout(reason);
      });
    },
    [handleForcedLogout]
  );

  // Au chargement, valider session avant reconnexion
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      const parsedUser = JSON.parse(storedUser);

      axiosInstance.get('/users/validate', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.data.valid) {
          setUser(parsedUser);
          userRef.current = parsedUser;
          connectSocket(parsedUser.id);
        } else {
          localStorage.clear();
          setUser(null);
          navigate('/login');
        }
      }).catch(() => {
        localStorage.clear();
        setUser(null);
        navigate('/login');
      });
    }
  }, [connectSocket, navigate]);

  // Gestion login
  const loginAgent = async (userData) => {
    setUser(userData);
    userRef.current = userData;
    setStatus("Hors ligne");
    localStorage.setItem("user", JSON.stringify(userData));
    connectSocket(userData.id);

    try {
      await axiosInstance.post("/agent/connect", { userId: userData.id });
    } catch (err) {
      console.warn(err);
    }
  };

  // Gestion logout volontaire
  const logoutAgent = async () => {
    manualLogoutRef.current = true;
    if (userRef.current?.id) {
      await axiosInstance.post("/agent/disconnect-force", {
        userId: userRef.current.id,
      });
      socket.emit("agent_disconnected", { userId: userRef.current.id });
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