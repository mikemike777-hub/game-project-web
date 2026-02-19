import React from 'react';

const CTA = () => {
    return (
        <section id="download" className="section-container" style={{ textAlign: 'center' }}>
            <div className="glass-card" style={{
                padding: '80px 40px',
                background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1), rgba(0, 242, 254, 0.1))',
                border: '1px solid rgba(0, 242, 254, 0.2)'
            }}>
                <h2 style={{ fontSize: '48px', marginBottom: '24px' }}>今すぐ<span className="gradient-text">プレイ</span></h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '20px', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
                    究極の将棋体験をあなたのデバイスに。
                    今すぐダウンロードして、対局を開始しましょう。
                </p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>Apple Store</span>
                    </button>
                    <button className="btn-primary" style={{ background: 'var(--text-main)', color: '#000', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>Google Play</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default CTA;
