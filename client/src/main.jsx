import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PokemonList from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PokemonList />
  </StrictMode>,
)
