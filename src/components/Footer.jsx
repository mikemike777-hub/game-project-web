import React from 'react';

const Footer = () => {
    return (
        <footer className="section-container" style={{
            borderTop: '1px solid var(--glass-border)',
            textAlign: 'center',
            padding: '40px 24px',
            color: 'var(--text-muted)'
        }}>
            <div style={{ marginBottom: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
                Game <span className="gradient-text">Project</span>
            </div>
            <p style={{ fontSize: '14px' }}>
                &copy; 2026 Game Project Studio. All rights reserved. <br />
                本格将棋体験をお届けします。
            </p>
        </footer>
    );
};

export default Footer;
