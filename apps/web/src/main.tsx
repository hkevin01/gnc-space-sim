import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Suppress common development warnings
if (import.meta.env.DEV) {
  // Filter out extension connection errors
  const originalError = console.error
  console.error = (...args) => {
    const message = args[0]
    if (typeof message === 'string' &&
        (message.includes('Could not establish connection') ||
         message.includes('Receiving end does not exist'))) {
      return // Suppress browser extension errors
    }
    originalError(...args)
  }
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
