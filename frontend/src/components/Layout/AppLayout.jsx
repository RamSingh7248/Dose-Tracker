import React from 'react';
import Sidebar from './Sidebar';
import NotificationCenter from '../NotificationCenter';
import FamilyMemberSwitcher from '../FamilyMemberSwitcher';
import VoiceReminderEngine from '../VoiceReminderEngine';
import PWAInstallPrompt from '../PWAInstallPrompt';
import { FamilyProvider } from '../../context/FamilyContext';
// NOTE: Toaster is intentionally NOT rendered here.
// A single <Toaster> instance already lives in App.jsx.

export default function AppLayout({ children }) {
  return (
    <FamilyProvider>
      <div className="main-layout">
        {/* Decorative orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />

        {/* PWA Install Banner */}
        <PWAInstallPrompt />

        {/* Background Voice & Sound Notification Engine */}
        <VoiceReminderEngine />

        <Sidebar />

        <main className="page-content" style={{ position: 'relative', zIndex: 10 }}>
          {/* Top Header Bar
              - On desktop (lg+): right-aligned
              - On mobile/tablet: has left-margin for the hamburger button
          */}
          <div
            className="top-header-bar"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 8,
              marginBottom: 20,
              minHeight: 44,
              flexWrap: 'wrap',
            }}
          >
            {/* Spacer for hamburger button on mobile — keeps content right-aligned */}
            <div
              className="lg:hidden"
              style={{ width: 52, flexShrink: 0 }}
              aria-hidden="true"
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginLeft: 'auto',
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              <FamilyMemberSwitcher />
              <NotificationCenter />
            </div>
          </div>

          {children}
        </main>
      </div>
    </FamilyProvider>
  );
}
