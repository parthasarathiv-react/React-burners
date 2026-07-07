import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import { toast } from 'sonner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(localStorage.getItem('logged_in_role'));
    const [loading, setLoading] = useState(true);

    const [availableRoles, setAvailableRoles] = useState([]);
    const [rolesList, setRolesList] = useState([]);

    const fetchRoles = async () => {
        try {
            const rolesResponse = await api.get('/user/roles');
            const rolesData = rolesResponse.data;
            if (rolesData && rolesData.success && Array.isArray(rolesData.data)) {
                setRolesList(rolesData.data);
                setAvailableRoles(rolesData.data.map(item => item.roleName));
                return rolesData.data;
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
            toast.error(error?.response?.data?.message || error.message || 'Failed to fetch roles');
        }
        return [];
    };

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Check for current session
                const savedRole = localStorage.getItem('logged_in_role');
                const savedToken = localStorage.getItem('token');

                if (savedRole && savedToken) {
                    setRole(savedRole);
                    setUser({ username: localStorage.getItem('logged_in_username') });
                    // Fetch roles on refresh to populate rolesList and trigger user fetching
                    await fetchRoles();
                }
                //  else if (!savedToken && window.location.pathname !== '/') {
                //     window.location.href = '/';
                // }
            } catch (error) {
                console.error('Auth state initialization error:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Continuous check for token removal
        const interval = setInterval(() => {
            const token = localStorage.getItem('token');
            // if (!token && window.location.pathname !== '/') {
            //     window.location.href = '/';
            // }
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const login = async (userName, password) => {
        try {
            const response = await api.post('/login', { userName, password });

            const result = response.data;
            console.log("result", result);

            if (result.success && result.data) {
                const { token, userName: loggedInUser, roleID } = result.data;

                // Fetch roles only after successful login
                const currentRoles = await fetchRoles();
                console.log("currentRoles", currentRoles);

                // Find role name from the freshly fetched roles list
                const roleObj = currentRoles.find(r => r.roleID === roleID);
                const roleName = roleObj ? roleObj.roleName : (roleID === 1 ? 'Admin' : 'User');

                setUser({ username: loggedInUser, ...result.data });
                setRole(roleName);

                localStorage.setItem('token', token);
                localStorage.setItem('logged_in_role', roleName);
                localStorage.setItem('logged_in_username', loggedInUser);
                localStorage.setItem('user_data', JSON.stringify(result.data));
                console.log("result", result);
                return { success: true };
            } else {
                console.log("result", result);
                return { success: false, message: result.message };
            }

        } catch (error) {
            console.log("result", error);
            console.error('Login error:', error);
            return {
                success: false, message:
                    error.response?.data?.message
            };
        }
    };

    const logout = () => {

        console.log('Logout called');
        setUser(null);
        setRole(null);
        localStorage.removeItem('token');
        localStorage.removeItem('logged_in_role');
        localStorage.removeItem('logged_in_username');
        localStorage.removeItem('user_data');
        localStorage.removeItem('raster_studies');
        localStorage.removeItem('raster_settings');
    };


    return (
        <AuthContext.Provider value={{ user, role, loading, login, logout, isAdmin: role === 'Admin', availableRoles, rolesList }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
