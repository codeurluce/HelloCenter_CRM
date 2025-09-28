import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import socket from "../socket";
import axiosInstance from "../api/axiosInstance";
import { closeSession } from "./saveSessionToDB.js";

const AgentStatusContext = createContext();
export const useAgentStatus = () => useContext(AgentStatusContext);

const INACTIVITY_TIMEOUT_MS = 2.5 * 60 * 1000; // 2,5 min

export const AgentStatusProvider = ({ children }) => {
  const [status, setStatus] = useState("Hors ligne");
  const [user, setUser] = useState(null);
  const inactivityTimerRef = useRef(null);
  const navigate = useNavigate();

  // --- 🔹 refs pour debug / latest values
  const statusRef = useRef(status);
  const userRef = useRef(user);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { userRef.current = user; }, [user]);

  // --- 🔹 Déconnexion forcée
  const handleForcedLogout = useCallback(async (reason = "déconnexion") => {
    console.log("[DEBUG] handleForcedLogout appelé, raison:", reason);
    console.log("[DEBUG] user au moment logout:", userRef.current);
    console.log("[DEBUG] status au moment logout:", statusRef.current);

    Swal.fire({
      title: "Déconnecté",
      text: reason.includes("inactivité")
        ? "Vous avez été déconnecté pour inactivité."
        : "Votre session a été fermée.",
      icon: "warning",
      confirmButtonText: "OK",
    });

    if (userRef.current?.id) {
      try {
        console.log("[DEBUG] Fermeture session backend...");
        await closeSession({ user_id: userRef.current.id });

        console.log("[DEBUG] Appel /agent/disconnect");
        await axiosInstance.post('/agent/disconnect', { userId: userRef.current.id });

        console.log("[DEBUG] Notification socket agent_disconnected");
        socket.emit("agent_disconnected", { userId: userRef.current.id });
      } catch (err) {
        console.error("[ERROR] Erreur fermeture session backend :", err);
      }
    }

    if (socket.connected) {
      console.log("[DEBUG] Déconnexion socket frontend");
      socket.disconnect();
    }

    localStorage.clear();
    setUser(null);
    setStatus("Hors ligne");
    navigate("/login");
  }, [navigate]);

  // --- 🔹 Timer d’inactivité
  const resetInactivityTimer = useCallback(() => {
    console.log("[DEBUG] resetInactivityTimer appelé");
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      console.log("[DEBUG] Timer précédent annulé");
    }

    inactivityTimerRef.current = setTimeout(() => {
      console.log("[DEBUG] Timer expiré, statut actuel:", statusRef.current);
      if (statusRef.current === "Disponible") {
        console.log("[DEBUG] Appel handleForcedLogout depuis timer");
        handleForcedLogout("inactivité > 2,5 min");
      } else {
        console.log("[DEBUG] Statut non disponible, pas de déconnexion");
      }
    }, INACTIVITY_TIMEOUT_MS);

    console.log("[DEBUG] Timer réinitialisé pour 2,5 min");
  }, [handleForcedLogout]);

  // --- 🔹 Connexion / Déconnexion socket
  const connectSocket = useCallback((userId) => {
    if (!socket.connected) {
      console.log("[DEBUG] Connexion socket pour userId:", userId);
      socket.auth = { userId };
      socket.connect();
    }
  }, []);

  const disconnectSocket = useCallback(() => {
    if (socket.connected) {
      console.log("[DEBUG] Déconnexion socket manuelle");
      socket.disconnect();
    }
  }, []);

  // --- 🔹 Heartbeat toutes les 30s
useEffect(() => {
  if (!user?.id) return;
  const interval = setInterval(() => {
    // prefer socket emit
    if (socket.connected) {
      socket.emit('heartbeat');
      console.log('[FRONT] heartbeat emit');
    } else {
      // fallback: HTTP ping
      axiosInstance.post('/api/session_agents/ping', { user_id: user.id })
        .then(() => console.log('[FRONT] ping http ok'))
        .catch(() => console.warn('[FRONT] ping http failed'));
    }
  }, 30_000);
  return () => clearInterval(interval);
}, [user]);


useEffect(() => {
  const onBeforeUnload = () => {
    const userId = JSON.parse(localStorage.getItem('user'))?.id;
    if (!userId) return;
    const data = JSON.stringify({ user_id: userId });
    const url = '/api/session_agents/stop';
    // sendBeacon expects a Blob or FormData
    navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
    console.log('[FRONT] sendBeacon stopSession envoyé');
  };
  window.addEventListener('beforeunload', onBeforeUnload);
  return () => window.removeEventListener('beforeunload', onBeforeUnload);
}, []);

  // --- 🔹 Événements socket
  useEffect(() => {
    socket.on("connect", () => console.log("✅ Socket connecté :", socket.id));
    socket.on("disconnect", (reason) => console.log("❌ Socket déconnecté :", reason));
    socket.on("session_closed_force", ({ reason }) => {
      console.log("[DEBUG] session_closed_force reçu du serveur, raison:", reason);
      handleForcedLogout(reason || "déconnexion forcée par le serveur");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("session_closed_force");
    };
  }, [handleForcedLogout]);

  // --- 🔹 Suivi activité utilisateur
  useEffect(() => {
    const events = ["mousemove", "keydown", "click"];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [resetInactivityTimer]);

  // --- 🔹 Fermer session au refresh / fermeture
  useEffect(() => {
    const handleBeforeUnload = async () => {
      console.log("[DEBUG] beforeunload déclenché");
      if (userRef.current?.id && statusRef.current === "Disponible") {
        try {
          console.log("[DEBUG] Fermeture session côté serveur avant unload");
          await closeSession({ user_id: userRef.current.id });
          socket.emit("agent_disconnected", { userId: userRef.current.id });
        } catch (err) {
          console.error("[ERROR] beforeunload session non fermée", err);
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // --- 🔹 Login
  const loginAgent = async (userData, fromReconnect = false) => {
    console.log("[DEBUG] loginAgent appelé pour", userData);
    setUser(userData);
    setStatus("Disponible");
    localStorage.setItem("user", JSON.stringify(userData));
    connectSocket(userData.id);

    if (fromReconnect) {
      try {
        const { data } = await axiosInstance.get(
          `/session_agents/user/live/${userData.id}`
        );
        console.log("✅ Session restaurée depuis BD :", data);
      } catch (err) {
        console.warn("Aucune session live trouvée :", err);
      }
    }
  };

  // --- 🔹 Logout manuel
  const logoutAgent = async () => handleForcedLogout("Déconnexion manuelle");

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
