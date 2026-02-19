import React from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Features from './components/Features'
import CTA from './components/CTA'
import Footer from './components/Footer'
import ShogiGame from './components/ShogiGame'
import PasswordGate from './components/PasswordGate'

function App() {
  return (
    <PasswordGate>
      <div style={{ position: 'relative' }}>
        {/* Background Orbs for extra "style" */}
        <div style={{
          position: 'fixed',
          top: '10%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, transparent 70%)',
          zIndex: -1,
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'fixed',
          bottom: '10%',
          left: '10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(240, 147, 251, 0.1) 0%, transparent 70%)',
          zIndex: -1,
          borderRadius: '50%'
        }} />

        <Header />
        <main>
          <Hero />
          <ShogiGame />
          <Features />
          <CTA />
        </main>
        <Footer />
      </div>
    </PasswordGate>
  )
}

export default App
