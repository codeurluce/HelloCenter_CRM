import React, { useState } from 'react';
import { LayoutDashboard, CircleUser, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { ShoppingCart, Folder, Calendar } from 'react-feather';

const Sidebar = ({ activeItem, setActiveItem, onLogout }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
        { id: 'sales', label: 'Ventes', icon: ShoppingCart },
        { id: 'files', label: 'Fichiers', icon: Folder },
        { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
        { id: 'agents', label: 'Agent', icon: CircleUser },
    ];

    const bottomItems = [
        { id: 'settings', label: 'Setting', icon: Settings },
        { id: 'logout', label: 'Log out', icon: LogOut, action: onLogout },
    ];

    const MenuItem = ({ item, isBottom = false }) => (
        <button
            onClick={() => item.action ? item.action() : setActiveItem(item.id)}
            className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-all duration-200 ${activeItem === item.id
                    ? 'bg-white bg-opacity-20 text-white border-r-4 border-white'
                    : 'text-blue-100 hover:bg-white hover:bg-opacity-10 hover:text-white'
                } ${isCollapsed ? 'justify-center px-3' : ''}`}
        >
            <item.icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0`} />
            {!isCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
            )}
        </button>
    );

    return (
        <div className={`bg-gradient-to-b from-blue-500 to-blue-700 h-screen flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'
            }`}>
            {/* Logo */}
            <div className="p-6 border-b border-blue-400 border-opacity-30">
                <div className="flex items-center justify-between">
                    {!isCollapsed && (
                        <h1 className="text-white text-xl font-bold" translate="no">Hello Center</h1>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
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
                    <MenuItem key={item.id} item={item} isBottom={true} />
                ))}
            </div>
        </div>
    );
};

export default Sidebar;