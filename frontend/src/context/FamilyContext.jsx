import React, { createContext, useContext, useState, useEffect } from 'react';
import { memberApi } from '../services/api';
import { useAuth } from './AuthContext';

const defaultFamilyContext = {
  members: [],
  activeMember: null,
  selectMember: () => {},
  resetToMyself: () => {},
  fetchMembers: async () => {},
  loading: false,
};

const FamilyContext = createContext(defaultFamilyContext);

export const FamilyProvider = ({ children }) => {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [activeMember, setActiveMember] = useState(null); // null = Primary User (Myself)
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await memberApi.getAll();
      setMembers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load family members:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectMember = (member) => {
    setActiveMember(member); // null or member object
  };

  const resetToMyself = () => {
    setActiveMember(null);
  };

  return (
    <FamilyContext.Provider
      value={{
        members,
        activeMember,
        selectMember,
        resetToMyself,
        fetchMembers,
        loading,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  return context || defaultFamilyContext;
};
