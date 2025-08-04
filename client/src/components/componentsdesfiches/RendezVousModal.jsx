import React, { useState } from 'react';

const RendezVousModal = ({ isOpen, onClose, onConfirm }) => {
  const [date, setDate] = useState('');
  const [commentaire, setCommentaire] = useState('');

  const handleSubmit = () => {
    if (!date || !commentaire.trim()) return;
    onConfirm({ date, commentaire });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Planifier un rendez-vous</h2>

        <label className="block mb-2">Date et heure</label>
        <input
          type="datetime-local"
          className="w-full border p-2 rounded mb-4"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <label className="block mb-2">Commentaire</label>
        <textarea
          className="w-full border p-2 rounded mb-4"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
        />

        <div className="flex justify-end gap-4">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>Annuler</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSubmit}>Confirmer</button>
        </div>
      </div>
    </div>
  );
};

export default RendezVousModal;
