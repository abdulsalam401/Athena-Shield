import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Event {
    timestamp: number;
    verdict: 'bot' | 'human';
    score: number;
    flags: string[];
    ip: string;
}

interface Stats {
    total_requests: number;
    bot_count: number;
    human_count: number;
}

const Dashboard: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);

    const fetchData = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/v1/stats');
            setEvents(res.data.recent_events);
            setStats(res.data.summary);
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000); // Poll every 2s
        return () => clearInterval(interval);
    }, []);

    const chartData = events.map(e => ({
        time: new Date(e.timestamp * 1000).toLocaleTimeString(),
        score: e.score
    })).reverse();

    return (
        <div style={{ padding: '20px', fontFamily: "'Inter', sans-serif", color: '#e0e0e0', maxWidth: '1280px', margin: '0 auto' }}>
            <h1 style={{ color: '#fff', fontSize: '2.5rem', marginBottom: '30px' }}>Athena Shield Dashboard</h1>

            {stats && (
                <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                    <div style={cardStyle}>
                        <h3 style={{ margin: '0 0 10px 0', opacity: 0.8 }}>Total Requests</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.total_requests}</p>
                    </div>
                    <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #2c0b0e 0%, #1a1a1a 100%)', border: '1px solid #5c181f' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#ff8a80' }}>Bots Detected</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#ff5252' }}>{stats.bot_count}</p>
                    </div>
                    <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #0b2c14 0%, #1a1a1a 100%)', border: '1px solid #1b5e20' }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#b9f6ca' }}>Verified Humans</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#69f0ae' }}>{stats.human_count}</p>
                    </div>
                </div>
            )}

            <div style={{ height: '350px', backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', marginBottom: '30px' }}>
                <h3 style={{ color: '#fff', marginBottom: '20px' }}>Live Threat Score Feed</h3>
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="time" stroke="#666" />
                        <YAxis domain={[0, 1]} stroke="#666" />
                        <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                        <Line type="monotone" dataKey="score" stroke="#7c4dff" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div style={{ backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                <h3 style={{ color: '#fff', marginBottom: '20px' }}>Recent Activity Log</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={thStyle}>Time</th>
                            <th style={thStyle}>IP</th>
                            <th style={thStyle}>Verdict</th>
                            <th style={thStyle}>Score</th>
                            <th style={thStyle}>Flags</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((e, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #333' }}>
                                <td style={tdStyle}>{new Date(e.timestamp * 1000).toLocaleTimeString()}</td>
                                <td style={tdStyle}>{e.ip}</td>
                                <td style={tdStyle}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        backgroundColor: e.verdict === 'bot' ? 'rgba(255, 82, 82, 0.2)' : 'rgba(105, 240, 174, 0.2)',
                                        color: e.verdict === 'bot' ? '#ff5252' : '#69f0ae',
                                        border: e.verdict === 'bot' ? '1px solid #ff5252' : '1px solid #69f0ae'
                                    }}>
                                        {e.verdict.toUpperCase()}
                                    </span>
                                </td>
                                <td style={tdStyle}>{e.score.toFixed(2)}</td>
                                <td style={tdStyle}><span style={{ fontSize: '0.9rem', color: '#999' }}>{e.flags.join(', ')}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const cardStyle = {
    flex: 1,
    padding: '25px',
    borderRadius: '12px',
    backgroundColor: '#1e1e1e',
    textAlign: 'center' as const,
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    color: '#fff'
};

const thStyle = { textAlign: 'left' as const, padding: '15px', color: '#888', borderBottom: '1px solid #333' };
const tdStyle = { padding: '15px', color: '#e0e0e0' };

export default Dashboard;
