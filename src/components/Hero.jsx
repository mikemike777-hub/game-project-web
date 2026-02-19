import React from 'react';

const Hero = () => {
    return (
        <section id="hero" className="section-container" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            paddingTop: '120px'
        }}>
            <div className="floating" style={{
                width: '120px',
                height: '120px',
                background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                borderRadius: '30px',
                marginBottom: '40px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '60px',
                boxShadow: '0 0 50px rgba(0, 242, 254, 0.3)'
            }}>
                ☖
            </div>
            <h1 style={{ fontSize: '72px', fontWeight: '800', marginBottom: '24px', lineHeight: '1.1' }}>
                究極の<br />
                <span className="gradient-text">本格将棋</span> エクスペリエンス
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '20px', maxWidth: '600px', marginBottom: '40px' }}>
                洗練された UI と強力な AI エンジン。
                初心者から高段者まで、いつでもどこでも最高の対局を。
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
                <a href="#play" className="btn-primary">今すぐ対局</a>
                <a href="#features" className="glass-card" style={{
                    padding: '12px 28px',
                    textDecoration: 'none',
                    color: 'var(--text-main)',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                }}>詳しく見る</a>
            </div>
        </section>
    );
};

export default Hero;
