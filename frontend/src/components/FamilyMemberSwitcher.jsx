import React, { useState, useRef, useEffect } from 'react';
import { useFamily } from '../context/FamilyContext';
import { useAuth } from '../context/AuthContext';
import { Users, User, ChevronDown, Check, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FamilyMemberSwitcher() {
  const { user } = useAuth();
  const { members, activeMember, selectMember } = useFamily();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleIcon = (rel) => {
    switch (rel?.toLowerCase()) {
      case 'father': case 'parent': return '👴';
      case 'mother': return '👵';
      case 'spouse': return '💍';
      case 'child': case 'children': return '👶';
      case 'grandparent': case 'grandparents': return '👵';
      default: return '👤';
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Switcher Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: activeMember ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)',
          border: '1px solid ' + (activeMember ? 'rgba(139,92,246,0.3)' : 'var(--border-color)'),
          borderRadius: 12,
          padding: '6px 12px',
          cursor: 'pointer',
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 600,
          transition: 'all 0.2s ease',
        }}
        title="Switch Family Profile"
      >
        <span style={{ fontSize: 16 }}>
          {activeMember ? getRoleIcon(activeMember.relationship) : '👤'}
        </span>

        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeMember ? activeMember.name : (user?.name || 'Myself')}
        </span>

        {activeMember && (
          <span className="badge badge-purple" style={{ fontSize: 10, padding: '2px 6px', textTransform: 'capitalize' }}>
            {activeMember.relationship}
          </span>
        )}

        <ChevronDown size={14} color="var(--text-muted)" />
      </button>

      {/* Switcher Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 44,
            right: 0,
            width: 240,
            background: '#161926',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 14,
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            zIndex: 999999,
            padding: 8,
            animation: 'fadeInUp 0.2s ease',
          }}
        >
          <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Active Profile
          </div>

          {/* Primary Account (Myself) */}
          <div
            onClick={() => { selectMember(null); setIsOpen(false); }}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: !activeMember ? 'rgba(139,92,246,0.15)' : 'transparent',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: !activeMember ? 700 : 500,
              marginBottom: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>👤</span>
              <div>
                <div>{user?.name || 'Myself'}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Primary Account</div>
              </div>
            </div>
            {!activeMember && <Check size={14} color="var(--accent-purple)" />}
          </div>

          <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

          {/* Family Profiles List */}
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {members.length === 0 ? (
              <div style={{ padding: '10px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                No family profiles added yet.
              </div>
            ) : (
              members.map(m => {
                const isSelected = activeMember?._id === m._id;
                return (
                  <div
                    key={m._id}
                    onClick={() => { selectMember(m); setIsOpen(false); }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(139,92,246,0.15)' : 'transparent',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 500,
                      marginBottom: 2,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{getRoleIcon(m.relationship)}</span>
                      <div>
                        <div>{m.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {m.relationship}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={14} color="var(--accent-purple)" />}
                  </div>
                );
              })
            )}
          </div>

          <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />

          {/* Add Family Member Link */}
          <Link
            to="/members"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 10px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--accent-purple)',
              textDecoration: 'none',
            }}
          >
            <Plus size={14} /> Add Father, Mother, Child...
          </Link>
        </div>
      )}
    </div>
  );
}
