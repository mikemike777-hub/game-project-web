import React from 'react';

const Header = () => {
  return (
    <header style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      zIndex: 1000,
      padding: '20px 0',
      transition: 'all 0.3s ease'
    }}>
      <div className="section-container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 40px',
        height: '60px',
        borderRadius: '30px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-1px' }}>
          Game <span className="gradient-text">Project</span>
        </div>
        <nav>
          <ul style={{ display: 'flex', listStyle: 'none', gap: '30px' }}>
            <li><a href="#hero" style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: '500' }}>ホーム</a></li>
            <li><a href="#play" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontWeight: '500' }}>対局</a></li>
            <li><a href="#features" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontWeight: '500' }}>特徴</a></li>
            <li><a href="#download" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontWeight: '500' }}>ダウンロード</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
