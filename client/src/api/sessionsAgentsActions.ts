// sessionsAgentsActions
import axios from "./axiosInstance";

export interface Session {
  id: number;
  user_id: number;
  status: string;
  start_time: string; // ISO timestamp
  end_time?: string;
  duration?: number; // en secondes ou minutes
  pause_type?: string;
  created_at?: string;
  user?: {
    firstname: string;
    lastname: string;
    email: string;
  };
}

export interface FetchSessionsOptions {
  agentIds?: number[];
  statuses?: string[];
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
}

// Récupère les sessions depuis le backend avec filtres
export const fetchSessions = async (options: FetchSessionsOptions = {}): Promise<Session[]> => {
  try {
    const { agentIds, statuses, startDate, endDate } = options;

    const params: any = {};
    if (agentIds && agentIds.length) params.agentIds = agentIds.join(",");
    if (statuses && statuses.length) params.statuses = statuses.join(",");
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await axios.get("/sessions", { params });
    return response.data.sessions; // adapter selon ton backend
  } catch (error: any) {
    console.error("Erreur fetchSessions:", error.response || error.message);
    return [];
  }
};

// Exporter les sessions (CSV/Excel)
export interface ExportOptions {
  agentIds?: number[];
  statuses?: string[];
  fields?: string[];
  startDate?: string;
  endDate?: string;
}

export const exportSessions = async (options: ExportOptions) => {
  try {
    const response = await axios.post("/sessions/export", options, {
      responseType: "blob", // pour télécharger le fichier
    });

    // Téléchargement automatique
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sessions_export.xlsx"); // ou .csv selon backend
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error: any) {
    console.error("Erreur exportSessions:", error.response || error.message);
  }
};

// 📌 Récupérer l’historique d’un agent
export const getUserHistory = async (userId: number, period: string = "today") => {
  const res = await axios.get(`/sessions/history/${userId}?period=${period}`);
  return res.data;
};

// 📌 Changer de statut
export const changeStatus = async (userId: number, newStatus: string, pauseType?: string) => {
  const res = await axios.post(`/sessions/change`, {
    user_id: userId,
    new_status: newStatus,
    pause_type: pauseType || null,
  });
  return res.data;
};