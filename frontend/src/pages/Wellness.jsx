import React, { useState } from 'react';
import { Activity, Droplet, Moon, Footprints, Scale, Smile, Plus, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Wellness() {
  const [waterCups, setWaterCups] = useState(5);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [steps, setSteps] = useState(6420);
  const [weight, setWeight] = useState(68);
  const [height, setHeight] = useState(172);
  const [mood, setMood] = useState('😊 Energetic');

  const bmi = (weight / ((height / 100) * (height / 100))).toFixed(1);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="page-title">🌱 Daily Wellness & Lifestyle Tracker</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
            Monitor daily water intake, sleep quality, steps, BMI, mood, and daily health habits
          </p>
        </div>
        <button className="btn-primary" onClick={() => toast.success('Daily Wellness Log Saved!')}>
          <CheckCircle2 size={16} /> Save Daily Log
        </button>
      </div>

      {/* Wellness Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {/* Water Tracker */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Water Intake</div>
            <Droplet size={20} color="#06b6d4" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Outfit', color: '#06b6d4' }}>
            {waterCups} / 8 <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>cups</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            <button className="btn-secondary" onClick={() => setWaterCups(Math.max(0, waterCups - 1))} style={{ padding: '4px 10px', fontSize: 12 }}>-</button>
            <button className="btn-primary" onClick={() => { setWaterCups(waterCups + 1); toast.success('Hydration cup logged! 💧'); }} style={{ padding: '4px 10px', fontSize: 12, background: '#06b6d4', borderColor: '#06b6d4' }}>+ Drink Cup</button>
          </div>
        </div>

        {/* Sleep Tracker */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Sleep Tracker</div>
            <Moon size={20} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Outfit', color: '#8b5cf6' }}>
            {sleepHours} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>hours</span>
          </div>
          <div style={{ fontSize: 11, color: '#10b981', marginTop: 8 }}>Deep Restorative Sleep</div>
        </div>

        {/* Step Counter */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Step Counter</div>
            <Footprints size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Outfit', color: '#10b981' }}>
            {steps.toLocaleString()} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>steps</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Goal: 10,000 steps</div>
        </div>

        {/* Weight & BMI */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Weight & BMI</div>
            <Scale size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'Outfit', color: '#f59e0b' }}>
            {weight} kg <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>(BMI: {bmi})</span>
          </div>
          <div style={{ fontSize: 11, color: '#10b981', marginTop: 8 }}>Healthy Range</div>
        </div>
      </div>

      {/* Mood & Habits */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Smile size={18} color="var(--accent-purple)" /> Daily Mood & Wellness Journal
        </h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          {['😊 Energetic', '😌 Calm', '😴 Tired', '😰 Stressed', '💪 Productive'].map(m => (
            <button
              key={m}
              onClick={() => { setMood(m); toast.success(`Mood updated: ${m}`); }}
              style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                background: mood === m ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                color: mood === m ? 'var(--accent-purple)' : 'var(--text-primary)',
                border: `1px solid ${mood === m ? 'var(--accent-purple)' : 'var(--border-color)'}`,
                cursor: 'pointer'
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
