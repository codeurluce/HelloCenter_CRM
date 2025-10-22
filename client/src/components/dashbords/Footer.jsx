// src/components/layout/Footer.jsx
import React from "react";
import { Heart, PhoneCall } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const startYear = 2025;
    const displayYear = startYear === currentYear ? `${startYear}` : `${startYear}–${currentYear}`;

    return (
        <footer className="bg-white border-t text-blue-700 text-sm font-semibold py-3 px-4 flex flex-col sm:flex-row items-center justify-center relative">

            {/* Texte et signature centrés
        // <footer className="bg-white border-t text-blue-700 text-sm font-semibold text-center py-3">
        //     © {displayYear} Hello Center — Tous droits réservés.
        //     <span className="block text-gray-500 text-[11px] mt-1 font-normal">
        //         Fait avec <Heart size={12} className="inline text-red-500 mx-1 animate-pulse" /> par L86n
        //     </span> 
        */}

            {/* Texte centré */}
            <span className="text-center">
                © {displayYear} Hello Center — Tous droits réservés.
            </span>

            {/* Signature développeur alignée à droite */}
            {/* <span className="absolute right-4 text-gray-500 text-[11px] font-normal flex items-center">
                Fait avec <Heart size={12} className="inline text-red-500 mx-1 animate-pulse" /> par L86n
            </span> */}
        </footer>
    );
}