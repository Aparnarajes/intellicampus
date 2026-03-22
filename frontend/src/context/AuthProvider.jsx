import React, { useState, useEffect } from 'react';
import * as authService from '../services/authService';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsInitialLoading(false);
  }, []);

  const login = async (email, password) => {
    setIsActionLoading(true);
    try {
      const data = await authService.login(email, password);
      if (data && data.user) {
        setUser(data.user);
        return data.user;
      }
      throw new Error('Invalid authentication response.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const register = async (userData) => {
    setIsActionLoading(true);
    try {
      const data = await authService.registerUser(userData);
      return data;
    } finally {
      setIsActionLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    window.location.href = '/login';
  };

  const verifyEmail = async (token) => {
    setIsActionLoading(true);
    try {
      return await authService.verifyEmail(token);
    } finally {
      setIsActionLoading(false);
    }
  };

  const resendVerification = async (email) => {
    setIsActionLoading(true);
    try {
      return await authService.resendVerification(email);
    } finally {
      setIsActionLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    setIsActionLoading(true);
    try {
      return await authService.forgotPassword(email);
    } finally {
      setIsActionLoading(false);
    }
  };

  const resetPassword = async (token, password) => {
    setIsActionLoading(true);
    try {
      return await authService.resetPassword(token, password);
    } finally {
      setIsActionLoading(false);
    }
  };

  const initiateSetup = async (email) => {
    setIsActionLoading(true);
    try {
      return await authService.initiateSetup(email);
    } finally {
      setIsActionLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    setIsActionLoading(true);
    try {
      const data = await authService.updateProfile(profileData);
      if (data.user) {
        setUser(data.user);
      }
      return data;
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      initiateSetup,
      logout,
      verifyEmail,
      resendVerification,
      forgotPassword,
      resetPassword,
      updateProfile,
      isLoading: isInitialLoading,
      actionLoading: isActionLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};