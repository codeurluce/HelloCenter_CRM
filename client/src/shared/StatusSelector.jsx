// client/src/shared/StatusSelector.jsx
import React from 'react';
import { Utensils, UserCheck, NotebookPen, BookOpenText, CoffeeIcon, Armchair } from 'lucide-react';
import { GrGroup } from 'react-icons/gr';

export const statuses = [
    {
        key: 'disponible',              // clé unique interne
        statusFr: 'Disponible',         // texte FR à afficher et comparer
        iconLabel: 'Disponible',        // légende tooltip
        buttonLabel: 'Disponible',      // texte bouton
        icon: UserCheck,                // icône react-lucide
        color: 'text-green-600',        // couleur texte icône actif
        activeBg: '#27ae60',          // couleur background actif bouton
        activeText: '#fff'            // couleur texte actif bouton
    },
    {
        key: 'pause_cafe_1',
        statusFr: 'Pausette 1',
        iconLabel: 'Première pause',
        buttonLabel: 'Pausette 1',
        icon: CoffeeIcon,
        color: 'text-orange-500',
        activeBg: '#f39c12',
        activeText: '#fff',
    },
    {
        key: 'pause_dejeuner',
        statusFr: 'Déjeuner',
        iconLabel: 'Pause Déjeuner',
        buttonLabel: 'Déjeuner',
        icon: Utensils,
        color: 'text-red-500',
        activeBg: '#e74c3c',
        activeText: '#fff'
    },
    {
        key: 'pause_cafe_2',
        statusFr: 'Pausette 2',
        iconLabel: 'Deuxième pause',
        buttonLabel: 'Pausette 2',
        icon: Armchair,
        color: 'text-yellow-500',
        activeBg: '#f1c40f',
        activeText: '#333',
    },
    {
        key: 'reunion',
        statusFr: 'Réunion',
        iconLabel: 'Réunion',
        buttonLabel: 'Réunion',
        icon: GrGroup,
        color: 'text-purple-500',
        activeBg: '#9b59b6',
        activeText: '#fff',
    },
    {
        key: 'pause_formation',
        statusFr: 'Formation',
        iconLabel: 'Formation',
        buttonLabel: 'Formation',
        icon: BookOpenText,
        color: 'text-blue-500',
        activeBg: '#3498db',
        activeText: '#fff'
    },
    {
        key: 'brief',
        statusFr: 'Brief',
        iconLabel: 'Brief',
        buttonLabel: 'Brief',
        icon: NotebookPen,
        color: 'text-teal-500',
        activeBg: '#1abc9c',
        activeText: '#fff',
    },
    //   {
    //     key: 'pause_autre',
    //     statusFr: 'Autre Pause',
    //     iconLabel: 'Pause',
    //     buttonLabel: 'Autre Pause',
    //     icon: Clock5,
    //     color: 'text-gray-500',
    //     activeBg: '#9b59b9',
    //     activeText: '#fff'
    //   },
];

// Formatage du temps en hh:mm:ss
export const formatTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) return "00:00:00";
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
};


/**
 * Composant StatusSelector
 * - currentStatus : string en français ex. 'Disponible'
 * - onSelect : fonction(statusFr, pauseType) appelée au clic sur un état
 * - mode : 'icons' ou 'buttons' (affichage visuel)
 */
const StatusSelector = ({ currentStatus, onSelect, mode = 'icons' }) => {
    return (
        <div className={mode === 'icons' ? 'flex items-center gap-4' : 'flex flex-wrap gap-12 justify-content-center'}>
            {statuses.map((status) => {
                const isActive = currentStatus === status.statusFr;
                const pauseType = status.key.startsWith('pause_') ? status.key.split('_')[1] : null;
                const Icon = status.icon;

                if (mode === 'icons') {
                    return (
                        <div
                            key={status.key}
                            className="group relative cursor-pointer p-2 rounded hover:bg-gray-100 transition"
                            onClick={() => onSelect(status.statusFr, pauseType)}
                            title={status.iconLabel}
                        >
                            <Icon
                                className={`text-xl transition-all ${isActive ? status.color : 'text-gray-400'} ${isActive ? 'scale-125' : 'opacity-70'}`}
                            />
                            <div className="absolute left-1/2 -translate-x-1/2 mt-8 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all z-10">
                                {status.iconLabel}
                            </div>
                        </div>
                    );
                } else if (mode === 'buttons') {
                    return (
                        <button
                            key={status.key}
                            onClick={() => onSelect(status.statusFr, pauseType)}
                            disabled={isActive}
                            style={{
                                background: isActive ? status.activeBg : '#ddd',
                                color: isActive ? status.activeText : '#333',
                                border: 'none',
                                borderRadius: 8,
                                padding: '10px 20px',
                                fontWeight: 600,
                                fontSize: 15,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                            }}
                        >
                            <Icon /> {status.buttonLabel}
                        </button>
                    );
                }
                return null;
            })}
        </div>
    );
};

export default StatusSelector;
