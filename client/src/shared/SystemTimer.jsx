/**
 * ===============================================
 * 🔹 Composant Page : SystemTimer
 * ===============================================
 * 
 * Cette page sert de "point d'entrée" pour la logique de suivi du temps des agents.
 * Objectif : Centraliser la logique de suivi du temps (via `etat`, `timers`, `elapsed`)
 *   et la partager entre plusieurs composants de l’interface (Dashboardheader et AgentInfoPnal).
 * 
 * ===============================================
 */

import React, { useState } from "react";
import AgentInfoPanel from "../components/componentsdesongletsAgents/AgentInfoPanel";
import DashboardHeader from "../components/dashbords/DashbordHeader";

export default function SystemTimer() {
    const [etat, setEtat] = useState(null);
    const [timers, setTimers] = useState({});
    const [elapsed, setElapsed] = useState(0);
    const [lastChange, setLastChange] = useState(null);

    return (
        <div>
            <DashboardHeader
                etat={etat}
                timers={timers}
                elapsed={elapsed}
                // passe aussi la fonction de changement d'état si besoin
                onStatusChange={setEtat}
            />
            <AgentInfoPanel
                etat={etat}
                setEtat={setEtat}
                timers={timers}
                setTimers={setTimers}
                elapsed={elapsed}
                setElapsed={setElapsed}
                lastChange={lastChange}
                setLastChange={setLastChange}
            />
        </div>
    );
}

/**
 * ===============================================
 * 🛠️ États gérés dans cette page :
 * - `etat`       : statut actuel de l’agent (ex: "Disponible", "Pause café", "Réunion").
 * - `timers`     : objet contenant le cumul des durées pour chaque statut.
 * - `elapsed`    : temps en cours (secondes) depuis le dernier changement d’état.
 * - `lastChange` : timestamp du dernier changement de statut (utilisé pour calculer `elapsed`).
 * 
 * ===============================================
 * 📌 Fonctionnement global :
 * - Lorsqu’un agent change de statut depuis `AgentInfoPanel`, le temps passé dans l’ancien
 *   statut est ajouté au compteur correspondant dans `timers`.
 * - `elapsed` repart à 0 pour le nouveau statut.
 * - `DashboardHeader` affiche un résumé en temps réel des infos calculées.
 * 
 * ===============================================
 */