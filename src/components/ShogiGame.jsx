import React from 'react';

const ShogiGame = () => {
    return (
        <section id="play" className="section-container" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '48px', marginBottom: '40px' }}>
                今すぐ<span className="gradient-text">対局</span>する
            </h2>
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '900px',
                margin: '0 auto',
                height: '800px',
                overflow: 'hidden',
                position: 'relative',
                padding: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <iframe
                    src="/shogi-game/index.html"
                    style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: '10px',
                        backgroundColor: '#0f172a'
                    }}
                    title="Shogi Game"
                />
            </div>
        </section>
    );
};

export default ShogiGame;
