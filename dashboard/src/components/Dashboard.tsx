import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface Event {
  timestamp: number;
  verdict: 'bot' | 'human' | 'challenge';
  score: number;
  confidence?: number;
  action?: 'ALLOW' | 'CHALLENGE' | 'BLOCK';
  flags: string[];
  ip: string;
}

interface Stats {
  total_requests: number;
  bot_count: number;
  human_count: number;
  threat_rate_percent?: number;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const Dashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [filter, setFilter] = useState<'all' | 'bot' | 'human' | 'honeypot'>('all');
  const [search, setSearch] = useState<string>('');
  const [simStatus, setSimStatus] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`, { timeout: 3000 });
      setEvents(res.data.recent_events || []);
      setStats(res.data.summary || null);
      setIsOnline(true);
      setLastUpdated(new Date());
    } catch {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to reset the threat telemetry log?')) return;
    try {
      await axios.post(`${API_BASE}/stats/reset`);
      fetchData();
    } catch (e) {
      console.error('Failed to reset history', e);
    }
  };

  const runSimulation = async (type: 'human' | 'dumb_bot' | 'linear_bot' | 'honeypot') => {
    setIsSimulating(true);
    setSimStatus('Transmitting telemetry vector...');
    
    let payload: Record<string, unknown> = {};

    if (type === 'human') {
      // Natural human mouse trajectory with organic curve and jitter
      const humanTrajectory = [
        [120, 150, Date.now() - 600],
        [145, 175, Date.now() - 520],
        [180, 210, Date.now() - 430],
        [220, 240, Date.now() - 320],
        [270, 260, Date.now() - 200],
        [310, 270, Date.now() - 100],
        [335, 275, Date.now()]
      ];
      payload = {
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        hardware_concurrency: navigator.hardwareConcurrency || 8,
        webdriver: false,
        mouse_movements: humanTrajectory,
        time_on_page: 3200,
        honeypot_triggered: false
      };
    } else if (type === 'dumb_bot') {
      payload = {
        user_agent: 'python-requests/2.28.0 (BotScraper/1.0)',
        screen_resolution: '800x600',
        timezone: 'UTC',
        language: 'en-US',
        platform: 'Linux x86_64',
        hardware_concurrency: 1,
        webdriver: true,
        mouse_movements: [],
        time_on_page: 15,
        honeypot_triggered: true
      };
    } else if (type === 'linear_bot') {
      // Perfectly straight line: dx/dt constant, std_speed = 0.0, linearity = 1.0
      const linearTrajectory = [];
      const startTime = Date.now() - 500;
      for (let i = 0; i < 15; i++) {
        linearTrajectory.push([100 + i * 20, 100 + i * 20, startTime + i * 30]);
      }
      payload = {
        user_agent: navigator.userAgent,
        screen_resolution: '1920x1080',
        timezone: 'UTC',
        language: 'en-US',
        platform: 'Win32',
        hardware_concurrency: 4,
        webdriver: false,
        mouse_movements: linearTrajectory,
        time_on_page: 500,
        honeypot_triggered: false
      };
    } else if (type === 'honeypot') {
      payload = {
        user_agent: navigator.userAgent,
        screen_resolution: '1920x1080',
        timezone: 'UTC',
        language: 'en-US',
        platform: 'Win32',
        hardware_concurrency: 4,
        webdriver: false,
        mouse_movements: [],
        time_on_page: 200,
        honeypot_triggered: true
      };
    }

    try {
      const res = await axios.post(`${API_BASE}/telemetry`, payload);
      const verdict = res.data.verdict.toUpperCase();
      const action = res.data.action || (verdict === 'BOT' ? 'BLOCK' : 'ALLOW');
      setSimStatus(`Telemetry ingested! Verdict: ${verdict} | Action: ${action} | Conf: ${(res.data.confidence * 100).toFixed(0)}%`);
      fetchData();
    } catch {
      setSimStatus('Simulation error: Could not reach backend server on port 8000.');
    } finally {
      setIsSimulating(false);
      setTimeout(() => setSimStatus(null), 6000);
    }
  };

  const chartData = useMemo(() => {
    return events
      .slice(0, 30)
      .map((e, idx) => ({
        index: idx,
        time: new Date(e.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        threatScore: e.score,
        verdict: e.verdict
      }))
      .reverse();
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filter === 'bot' && e.verdict !== 'bot') return false;
      if (filter === 'human' && e.verdict !== 'human') return false;
      if (filter === 'honeypot' && !e.flags.includes('honeypot_triggered')) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesIp = e.ip.toLowerCase().includes(query);
        const matchesFlag = e.flags.some(f => f.toLowerCase().includes(query));
        const matchesVerdict = e.verdict.toLowerCase().includes(query);
        if (!matchesIp && !matchesFlag && !matchesVerdict) return false;
      }
      return true;
    });
  }, [events, filter, search]);

  const botPercentage = stats && stats.total_requests > 0
    ? Math.round((stats.bot_count / stats.total_requests) * 100)
    : 0;

  const humanPercentage = stats && stats.total_requests > 0
    ? Math.round((stats.human_count / stats.total_requests) * 100)
    : 0;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
      
      {/* Top Header & Status Bar */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            🛡️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                Athena Shield
              </h1>
              <span style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#a5b4fc',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}>
                CORTEX v1.0
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Next-Gen Behavioral Biometrics & Automated Threat Defense
            </p>
          </div>
        </div>

        {/* Engine Connectivity Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '24px',
            background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isOnline ? 'var(--success)' : 'var(--danger)',
              boxShadow: isOnline ? '0 0 8px #10b981' : '0 0 8px #ef4444'
            }} className={isOnline ? 'radar-active' : ''} />
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: isOnline ? 'var(--success)' : 'var(--danger)',
              letterSpacing: '0.04em'
            }}>
              {isOnline ? 'DEFENSE ENGINE ONLINE' : 'ENGINE DISCONNECTED'}
            </span>
          </div>

          <a
            href="http://localhost:5500/test_page.html"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: '#e2e8f0',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s'
            }}
          >
            🧪 Open Biometrics Lab
          </a>

          <button
            onClick={clearHistory}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-dim)',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
            title="Reset event activity log"
          >
            Clear Log
          </button>
        </div>
      </header>

      {/* KPI Metric Cards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Total Ingested Requests */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Total Telemetry Ingested
            </span>
            <span style={{ fontSize: '1.25rem' }}>📊</span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
            {stats ? stats.total_requests.toLocaleString() : '0'}
          </div>
          <p style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Real-time sliding window telemetry events
          </p>
        </div>

        {/* Verified Humans */}
        <div className="glass-panel" style={{
          padding: '24px',
          borderLeft: '4px solid var(--success)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(18, 24, 38, 0.7) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6ee7b7' }}>
              Verified Humans
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              {humanPercentage}% of total
            </span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#34d399', lineHeight: 1.1 }}>
            {stats ? stats.human_count.toLocaleString() : '0'}
          </div>
          <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#a7f3d0', opacity: 0.8 }}>
            Natural biometrics & organic kinetic paths
          </p>
        </div>

        {/* Bots Mitigated */}
        <div className="glass-panel" style={{
          padding: '24px',
          borderLeft: '4px solid var(--danger)',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(18, 24, 38, 0.7) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fca5a5' }}>
              Threats & Bots Intercepted
            </span>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              {botPercentage}% flagged
            </span>
          </div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#f87171', lineHeight: 1.1 }}>
            {stats ? stats.bot_count.toLocaleString() : '0'}
          </div>
          <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#fecaca', opacity: 0.8 }}>
            Honeypots, headless traits & linear paths
          </p>
        </div>

        {/* Threat Level Index */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Current Threat Ratio
            </span>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
          </div>
          <div style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            color: botPercentage > 50 ? 'var(--danger)' : botPercentage > 20 ? 'var(--warning)' : 'var(--accent-cyan)',
            lineHeight: 1.1
          }}>
            {botPercentage}%
          </div>
          <div style={{
            marginTop: '12px',
            height: '6px',
            borderRadius: '3px',
            background: 'rgba(255, 255, 255, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${botPercentage}%`,
              height: '100%',
              backgroundColor: botPercentage > 50 ? 'var(--danger)' : botPercentage > 20 ? 'var(--warning)' : 'var(--accent-cyan)',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      </section>

      {/* Interactive In-Dashboard Attack & Biometric Simulator */}
      <section className="glass-panel" style={{ padding: '20px 24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎮</span> Live Telemetry Simulator & Test Trigger
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Transmit simulated telemetry vectors directly to test the backend engine in real-time.
            </p>
          </div>
          {simStatus && (
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              color: '#c7d2fe'
            }}>
              {simStatus}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <button
            disabled={isSimulating}
            onClick={() => runSimulation('human')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontWeight: 600,
              cursor: isSimulating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👤 Ingest Human Telemetry
          </button>

          <button
            disabled={isSimulating}
            onClick={() => runSimulation('dumb_bot')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontWeight: 600,
              cursor: isSimulating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🤖 Simulate Scraper (Dumb Bot)
          </button>

          <button
            disabled={isSimulating}
            onClick={() => runSimulation('linear_bot')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fbbf24',
              fontWeight: 600,
              cursor: isSimulating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📏 Simulate Linear Bot (Smart Bot)
          </button>

          <button
            disabled={isSimulating}
            onClick={() => runSimulation('honeypot')}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#c084fc',
              fontWeight: 600,
              cursor: isSimulating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🍯 Trip Honeypot Trap
          </button>
        </div>
      </section>

      {/* Live Threat Score Timeline Chart */}
      <section className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Live Threat Score Feed (Telemetry Stream)
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Real-time threat scores (0.0 = Verified Human, 1.0 = High Confidence Automated Threat)
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '3px', backgroundColor: '#6366f1', borderRadius: '2px' }} /> Threat Score
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '2px', backgroundColor: '#ef4444', borderTop: '2px dashed #ef4444' }} /> Block Threshold (0.75)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '2px', backgroundColor: '#f59e0b', borderTop: '2px dashed #f59e0b' }} /> Challenge Threshold (0.50)
            </span>
          </div>
        </div>

        <div style={{ height: '320px', width: '100%' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[0, 1]} stroke="#475569" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isBot = data.verdict === 'bot';
                      return (
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.95)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                        }}>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>{data.time}</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isBot ? '#f87171' : '#34d399' }}>
                            Verdict: {data.verdict.toUpperCase()}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: '4px' }}>
                            Threat Score: <b>{Number(data.threatScore).toFixed(2)}</b>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0.75} stroke="#ef4444" strokeDasharray="4 4" />
                <ReferenceLine y={0.50} stroke="#f59e0b" strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="threatScore"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              No threat telemetry received yet. Ingest an event above or visit the test page to view stream.
            </div>
          )}
        </div>
      </section>

      {/* Recent Activity Audit Log */}
      <section className="glass-panel" style={{ padding: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              Real-Time Security Event Log
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Showing {filteredEvents.length} of {events.length} captured requests
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter buttons */}
            <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '3px' }}>
              {(['all', 'bot', 'human', 'honeypot'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    border: 'none',
                    background: filter === type ? 'var(--accent-indigo)' : 'transparent',
                    color: filter === type ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {type === 'all' ? 'All' : type === 'bot' ? 'Bots' : type === 'human' ? 'Humans' : 'Honeypot'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search IP or Flag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none',
                minWidth: '180px'
              }}
            />
          </div>
        </div>

        {/* Events Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px' }}>Timestamp</th>
                <th style={{ padding: '12px 16px' }}>Client IP</th>
                <th style={{ padding: '12px 16px' }}>Verdict</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
                <th style={{ padding: '12px 16px' }}>Threat Score</th>
                <th style={{ padding: '12px 16px' }}>Detected Signals & Flags</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((e, i) => {
                  const isBot = e.verdict === 'bot';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }} className="font-mono">
                        {new Date(e.timestamp * 1000).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#cbd5e1' }} className="font-mono">
                        {e.ip}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: isBot ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          color: isBot ? '#f87171' : '#34d399',
                          border: `1px solid ${isBot ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                        }}>
                          <span>{isBot ? '●' : '✓'}</span> {e.verdict.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: e.action === 'BLOCK' ? 'rgba(239, 68, 68, 0.25)' : e.action === 'CHALLENGE' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                          color: e.action === 'BLOCK' ? '#fca5a5' : e.action === 'CHALLENGE' ? '#fcd34d' : '#86efac'
                        }}>
                          {e.action || (isBot ? 'BLOCK' : 'ALLOW')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="font-mono" style={{ fontWeight: 600, color: isBot ? '#f87171' : '#34d399', width: '36px' }}>
                            {Number(e.score).toFixed(2)}
                          </span>
                          <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(100, e.score * 100)}%`,
                              height: '100%',
                              backgroundColor: isBot ? '#ef4444' : '#10b981'
                            }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {e.flags && e.flags.length > 0 ? (
                            e.flags.map((flag, fIdx) => (
                              <span
                                key={fIdx}
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  background: flag.includes('honeypot')
                                    ? 'rgba(168, 85, 247, 0.2)'
                                    : flag.includes('speed') || flag.includes('straight')
                                    ? 'rgba(245, 158, 11, 0.2)'
                                    : 'rgba(255, 255, 255, 0.08)',
                                  color: flag.includes('honeypot')
                                    ? '#d8b4fe'
                                    : flag.includes('speed') || flag.includes('straight')
                                    ? '#fde68a'
                                    : '#cbd5e1',
                                  fontFamily: 'monospace'
                                }}
                              >
                                {flag}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>clean</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No security events match your current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: '40px',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.8rem',
        paddingTop: '20px',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        Athena Shield Security Platform • Active Defense • Last Sync: {lastUpdated.toLocaleTimeString()}
      </footer>

    </div>
  );
};

export default Dashboard;
