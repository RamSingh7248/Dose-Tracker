import React from 'react';
import Sidebar from './Sidebar';
import NotificationCenter from '../NotificationCenter';
import FamilyMemberSwitcher from '../FamilyMemberSwitcher';
import VoiceReminderEngine from '../VoiceReminderEngine';
import { FamilyProvider } from '../../context/FamilyContext';
import { Toaster } from 'react-hot-toast';

export default function AppLayout({ children }) {
  return (
    <FamilyProvider>
      <div className="main-layout">
        {/* Decorative orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        
        {/* Background Voice & Sound Notification Engine */}
        <VoiceReminderEngine />

        <Sidebar />

        <main className="page-content" style={{ position: 'relative', zIndex: 150 }}>
          {/* Top Header Bar Widget */}
          <div
            style={{
              display: 'flex',
              justify: 'flex-end',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
              position: 'relative',
              zIndex: 300,
            }}
          >
            <FamilyMemberSwitcher />
            <NotificationCenter />
          </div>

          {children}
        </main>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
      </div>
    </FamilyProvider>
  );
}
