import React, { useEffect, useState } from 'react';

const RendezVousPage = () => {
  const [rdvs, setRdvs] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/files/programmed-rdv')
      .then(res => res.json())
      .then(data => setRdvs(data));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Rendez-vous programmés</h2>
      {rdvs.length === 0 ? (
        <p>Aucun rendez-vous prévu.</p>
      ) : (
        <ul className="space-y-4">
          {rdvs.map(fiche => (
            <li key={fiche.id} className="p-4 border rounded shadow bg-white">
              <p><strong>Client :</strong> {fiche.nom_client} {fiche.prenom_client}</p>
              <p><strong>Date :</strong> {new Date(fiche.rendez_vous_date).toLocaleString()}</p>
              <p><strong>Commentaire :</strong> {fiche.rendez_vous_commentaire}</p>
              <p><strong>Univers :</strong> {fiche.univers}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RendezVousPage;
