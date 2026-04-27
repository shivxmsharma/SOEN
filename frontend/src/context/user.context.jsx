import React, { createContext, useState, useEffect } from 'react';

// Create the UserContext
export const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
    const [ user, setUser ] = useState(null);
    const [ loading, setLoading ] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // We'll need axios here, but we can't easily import the configured axiosInstance 
            // without creating a circular dependency if axiosInstance also uses UserContext (it doesn't yet).
            // Actually, axios.js is independent.
            import('../config/axios').then(module => {
                const axios = module.default;
                axios.get('/users/profile')
                    .then(res => {
                        setUser(res.data.user);
                    })
                    .catch(() => {
                        localStorage.removeItem('token');
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            });
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, loading }}>
            {!loading && children}
        </UserContext.Provider>
    );
};