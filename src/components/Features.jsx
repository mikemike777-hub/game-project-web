import React from 'react';

const features = [
    { title: "本格AI", desc: "4つの難易度を搭載。激ムズモードは高段者も唸る実力。", icon: "🤖" },
    { title: "オンライン対戦", desc: "リアルタイムでのネット対戦。世界中のプレイヤーと腕を競え。", icon: "🌐" },
    { title: "直感的な操作", desc: "スマホでもPCでも快適。駒の動きをスムーズにアシスト。", icon: "🖱️" },
    { title: "デザイン", desc: "伝統とモダンが融合した、目に優しい洗練されたボードデザイン。", icon: "✨" }
];

const Features = () => {
    return (
        <section id="features" className="section-container">
            <h2 style={{ textAlign: 'center', fontSize: '48px', marginBottom: '60px' }}>
                ゲームの<span className="gradient-text">特徴</span>
            </h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '30px'
            }}>
                {features.map((f, i) => (
                    <div key={i} className="glass-card" style={{
                        padding: '40px',
                        transition: 'transform 0.3s ease',
                        cursor: 'default'
                    }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={{ fontSize: '40px', marginBottom: '20px' }}>{f.icon}</div>
                        <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>{f.title}</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{f.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default Features;
