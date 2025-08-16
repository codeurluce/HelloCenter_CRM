// src/components/admin/users/UserTableRow.jsx
import React from "react";
import { Mail, Shield, Briefcase, Pencil, Power, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import Badge from "./Badge";

export default function UserTableRow({ user, onEdit, onToggleActive, onResetPassword }) {
  return (
    <tr className="border-t last:border-b-0">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">
          {user.firstname} {user.lastname}
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Shield className="w-3 h-3" /> ID&nbsp;{user.id}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{user.email}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge
          className={
            user.role === "Admin"
              ? "bg-red-100 text-red-700"
              : user.role === "Manager"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }
        >
          {user.role}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{user.univers || user.profil || "—"}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        {user.active ? (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Actif
          </Badge>
        ) : (
          <Badge className="bg-gray-200 text-gray-700">
            <XCircle className="w-3 h-3 mr-1" />
            Inactif
          </Badge>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1.5 rounded-lg border hover:bg-gray-50" onClick={onEdit}>
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className={`px-3 py-1.5 rounded-lg border hover:bg-gray-50 ${
              user.active ? "text-amber-700" : "text-green-700"
            }`}
            onClick={onToggleActive}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            className="px-3 py-1.5 rounded-lg border hover:bg-gray-50 text-blue-700"
            onClick={onResetPassword}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
