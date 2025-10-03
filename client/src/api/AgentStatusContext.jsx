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
  // ----------------------------
  // 🔧 States & Refs
  // ----------------------------
  const [status, setStatus] = useState("Hors ligne");
  const [user, setUser] = useState(null);
  const [isInactive, setIsInactive] = useState(false);

  const navigate = useNavigate();
  const userRef = useRef(user);
  const manualLogoutRef = useRef(false);
  const recentlyConnectedRef = useRef(false);
  const validationRef = useRef(false);

  // ----------------------------
  // 📡 Socket management
  // ----------------------------
  const handleForcedLogout = useCallback(
    async (reason) => {
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
          setStatus("Hors ligne");
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

  // ----------------------------
  // 🕒 Gestion de l'inactivité utilisateur
  // ----------------------------
  useEffect(() => {
    if (!user?.id || status !== "Disponible") return;

    let inactivityTimer;

    const markInactive = async () => {
      try {
        await axiosInstance.post("/agent/stopSession", { user_id: user.id });
        await axiosInstance.post("/agent/startSession", {
          user_id: user.id,
          status: "Absent technique",
        });
        setStatus("Absent technique");
      } catch (err) {
        console.error("Erreur mise en pause technique :", err);
      }
    };

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(markInactive, 60_000); // 60s d’inactivité
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((e) => window.addEventListener(e, resetTimer, true));

    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer, true));
      clearTimeout(inactivityTimer);
    };
  }, [user?.id, status]);

  // ----------------------------
  // 🔁 Heartbeat HTTP toutes les 25s
  // ----------------------------
  useEffect(() => {
    if (!user?.id) return;

    const sendHeartbeat = async () => {
      try {
        await axiosInstance.post("/session_agents/heartbeat", {});
      } catch (err) {
        console.warn("Heartbeat échoué – vérification de session nécessaire");
      }
    };

    sendHeartbeat();
    const hbInterval = setInterval(sendHeartbeat, 25_000);
    return () => clearInterval(hbInterval);
  }, [user?.id]);

  // ----------------------------
  // 🚨 Gestion de la déconnexion forcée (inactivité)
  // ----------------------------
  useEffect(() => {
    if (isInactive) {
      toast.warn(
        "Vous avez été déconnecté pour inactivité. Veuillez vous reconnecter.",
        {
          autoClose: 4000,
          onClose: () => {
            if (socket.connected) socket.disconnect();
            localStorage.clear();
            setUser(null);
            setStatus("Hors ligne");
            setIsInactive(false);
            navigate("/login");
          },
        }
      );
    }
  }, [isInactive, navigate]);

  // ----------------------------
  // 🔄 Validation au chargement (1 seule fois)
  // ----------------------------
  useEffect(() => {
    if (validationRef.current) return;
    validationRef.current = true;

    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      axiosInstance
        .get("/users/validate", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data.valid) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            userRef.current = parsedUser;
            connectSocket(parsedUser.id);
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

  // ----------------------------
  // 👁️ Revalidation quand l'onglet redevient visible
  // ----------------------------
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
                  setStatus("Hors ligne");
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

  // ----------------------------
  // 🔐 Login / Logout
  // ----------------------------
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
    setStatus("Hors ligne");
    navigate("/login");
  };

  // ----------------------------
  // ⬅️ Context Provider
  // ----------------------------
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
