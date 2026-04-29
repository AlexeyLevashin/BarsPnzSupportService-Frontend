import { NavLink, Outlet } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { UserRole } from '../../types/user.types';
import { Toaster } from 'react-hot-toast';
import '../../css/main.css';
import React from "react";

export const MainLayout = () => {

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        authService.logout();
    }

    // 1. Достаем текущего пользователя и его роль
    const currentUser = authService.getCurrentUser();
    const role = currentUser?.role;

    // 2. Создаем флаги доступа (как мы делали в роутере)
    const canSeeInstitutions = role === UserRole.SuperAdmin || role === UserRole.Operator;
    const canSeeUsers = role === UserRole.SuperAdmin || role === UserRole.Operator || role === UserRole.UserAdmin;

    return (
        <div className="app-layout">
            <Toaster position="top-right" reverseOrder={false} />
            <aside className="sidebar">
                <div className="sidebar-top">
                    <div className="logo-placeholder">
                        <img className="logo-placeholder" src="/img/Лого_колосок-Photoroom.png" alt="Logo" />
                    </div>

                    <nav className="nav-menu">
                        {/* ЗАЯВКИ: Видят все */}
                        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} title="Мои заявки">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </NavLink>

                        {/* ПРОФИЛЬ: Видят все */}
                        <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} title="Мой профиль">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </NavLink>

                        {/* УЧРЕЖДЕНИЯ: Условный рендеринг */}
                        {canSeeInstitutions && (
                            <NavLink to="/institutions" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} title="Учреждения">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                            </NavLink>
                        )}

                        {/* ПОЛЬЗОВАТЕЛИ: Условный рендеринг */}
                        {canSeeUsers && (
                            <NavLink to="/users" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"} title="Пользователи">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </NavLink>
                        )}
                    </nav>
                </div>

                <div className="sidebar-bottom">
                    <a href="#" className="nav-item position-relative" title="Уведомления">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        <span className="notification-badge">3</span>
                    </a>
                    <a href="#" className="nav-item logout" title="Выход" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    </a>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>

        </div>
    );
};