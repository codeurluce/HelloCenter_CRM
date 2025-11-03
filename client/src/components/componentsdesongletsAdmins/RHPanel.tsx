// src/componentsRH/RHPanel.tsx
import React, { useState } from "react";
import AgentList from "../componentsAdminRH/AgentList.tsx";
import NotificationsFinContrat from "../componentsAdminRH/NotificationsFinContrat.jsx";
import { useNotifications } from "../componentsAdminRH/NotificationsContext.jsx";

// 👇 Placeholders enfants pour l'instant
const BulletinSalaire = () => <div className="p-4 text-gray-600">BulletinSalaire : contenu à développer</div>;
const CongesAbsences = () => <div className="p-4 text-gray-600">CongesAbsences : contenu à développer</div>;

const RHPanel: React.FC = () => {
  const { unreadCount } = useNotifications();
  const tabs = [
    { key: "agents", label: "Agents" },
    { key: "bulletins", label: "Bulletins de salaire" },
    { key: "conges", label: "Congés / Absences" },
    { key: "notifications", label: "Fin de contrat" }, // iici on doit afficher le baged avec le nb de notif
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].key);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-800">Section RH</h1>
          <p className="text-gray-600">Gestion des agents, contrats et documents RH</p>
        </div>

        {/* Tabs */}
        <nav className="flex space-x-2 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-6 py-3 rounded-t-xl font-medium text-sm transition-all
                ${activeTab === tab.key
                  ? "bg-white text-blue-600 shadow-md border border-b-0 border-gray-200"
                  : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 border border-transparent"
                }`}
            >
              {tab.label}

              {/* 🔴 Badge rouge sur “Fin de contrat” si notif non lues */}
              {tab.key === "notifications" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[11px] font-bold px-[6px] py-[1px] rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Contenu onglet actif */}
        <div className="bg-white shadow-md rounded-b-xl border border-gray-200 p-6">
          {activeTab === "agents" && <AgentList />}
          {activeTab === "bulletins" && <BulletinSalaire />}
          {activeTab === "conges" && <CongesAbsences />}
          {activeTab === "notifications" && <NotificationsFinContrat />}
        </div>
      </div>
    </div>
  );
};

export default RHPanel;
