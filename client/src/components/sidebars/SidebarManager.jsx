import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CircleUser,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ShoppingCart, Folder, Clock } from 'react-feather';
import Swal from "sweetalert2";
import { colorThemes } from '../../shared/colorThemes';
import { useTheme } from '../../shared/ThemeContext';

const SidebarAdmin = ({ activeItem, setActiveItem, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme } = useTheme();
  const sidebarClass = colorThemes[theme] || colorThemes.blue;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Admin', icon: LayoutDashboard },
    { id: 'Myfiles', label: 'Mes fichiers', icon: Folder },
    { id: 'files', label: 'Fichiers', icon: Folder },
    { id: 'sales', label: 'Ventes', icon: ShoppingCart },
    { id: 'activité', label: 'Activité', icon: CircleUser },
    { id: 'sessions', label: 'Sessions', icon: Clock },
    // { id: 'administration', label: 'Administration', icon: Users },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Paramètres', icon: Settings },
    {
      id: 'logout',
      label: 'Déconnexion',
      icon: LogOut,
      action: () => {
        Swal.fire({
          title: 'Voulez-vous vraiment vous déconnecter ?',
          showCancelButton: true,
          confirmButtonText: 'Déconnexion',
          confirmButtonColor: '#dc2626', // rouge
          cancelButtonText: 'Annuler',
        }).then((result) => {
          if (result.isConfirmed) {
            onLogout(); // ta fonction de logout
          }
        });
      },
    },
  ];

  // 🔹 Charger l’item actif depuis localStorage au montage
  useEffect(() => {
    const savedItem = localStorage.getItem("activeSidebarItem");
    if (savedItem) {
      setActiveItem(savedItem);
    }
  }, [setActiveItem]);

  // 🔹 Sauvegarder à chaque changement
  useEffect(() => {
    if (activeItem) {
      localStorage.setItem("activeSidebarItem", activeItem);
    }
  }, [activeItem]);

  const MenuItem = ({ item, isBottom = false }) => (
    <button
      onClick={() => item.action ? item.action() : setActiveItem(item.id)}
      className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-all duration-200 
        ${activeItem === item.id
          ? 'bg-white bg-opacity-20 text-white border-r-4 border-white'
          : 'text-blue-100 hover:bg-white hover:bg-opacity-10 hover:text-white'
        } 
        ${isCollapsed ? 'justify-center px-3' : ''}`}
    >
      <item.icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
      {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
    </button>
  );

  return (
    // <div className={`bg-gradient-to-b from-blue-500 to-blue-700 h-screen flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
    <div className={`${sidebarClass} h-screen flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>

      {/* Logo */}
      <div className="p-6 border-b border-blue-400 border-opacity-30">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            //<h1 className="text-white text-xl font-bold" translate="no">Hello Center</h1>
            <h1 className="flex justify-center py-4">
              <img
                src="/HC.png"
                alt="Hello Center logo"
                className="h-32 w-auto object-contain"
              />
            </h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            aria-label="Ouvrir Sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-6">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))}
        </nav>
      </div>

      {/* Bottom Items */}
      <div className="border-t border-blue-400 border-opacity-30 py-4">
        {bottomItems.map((item) => (
          <div key={item.id}>
            {item.component ? item.component : <MenuItem item={item} isBottom={true} />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SidebarAdmin;