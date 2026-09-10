import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoDashboard = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: 32,
          textAlign: 'center'
        }}>
          <div className="glass-card animate-fade-in-up" style={{ padding: 40, maxWidth: 480, border: '1px solid rgba(244,63,94,0.3)', background: 'linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(225,29,72,0.04) 100%)' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(244,63,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={28} color="#f43f5e" />
            </div>
            <h2 style={{ fontFamily: 'Outfit', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              Something Went Wrong
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16, lineHeight: 1.5 }}>
              An unexpected error occurred while displaying this page.
            </p>
            {this.state.error?.message && (
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', color: '#f43f5e', textAlign: 'left', marginBottom: 20, wordBreak: 'break-word', border: '1px solid rgba(244,63,94,0.2)' }}>
                {this.state.error.message}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 14 }}
              >
                <RefreshCw size={16} /> Reload Page
              </button>
              <button
                onClick={this.handleGoDashboard}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', fontSize: 14 }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
