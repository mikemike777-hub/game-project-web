import { useEffect } from 'react'

function App() {
  useEffect(() => {
    window.location.replace('/shogi-game/index.html')
  }, [])

  return (
    <main className="launch-screen" aria-live="polite">
      将棋を起動しています...
    </main>
  )
}

export default App
