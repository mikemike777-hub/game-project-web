import React, { useState, useEffect } from 'react';

const PasswordGate = ({ children }) => {
    const [password, setPassword] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState('');

    const CORRECT_PASSWORD = 'mikemike123'; // 合言葉を変更

    useEffect(() => {
        const authStatus = localStorage.getItem('isAuthorized');
        if (authStatus === 'true') {
            setIsAuthorized(true);
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === CORRECT_PASSWORD) {
            setIsAuthorized(true);
            localStorage.setItem('isAuthorized', 'true');
            setError('');
        } else {
            setError('合言葉が違います。');
            setPassword('');
        }
    };

    if (isAuthorized) {
        return children;
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            fontFamily: "'Outfit', sans-serif"
        }}>
            <div className="glass-card" style={{
                padding: '40px',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔐</div>
                <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>Protected Access</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
                    このサイトは保護されています。<br />合言葉を入力してください。
                </p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="合言葉を入力"
                        style={{
                            width: '100%',
                            padding: '12px 20px',
                            borderRadius: '10px',
                            border: '1px solid var(--glass-border)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#white',
                            fontSize: '16px',
                            marginBottom: '10px',
                            outline: 'none'
                        }}
                    />
                    {error && <p style={{ color: '#ff4b2b', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}
                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                        アクセス
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PasswordGate;
