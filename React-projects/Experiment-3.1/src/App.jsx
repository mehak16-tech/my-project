import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ProductCard from './components/ProductCard.jsx';

function App() {
  const [count, setCount] = useState(0)
  const product = {
    name: "sample Product",
    price: 29.99,
    inStock: true
  }

  const product1 = {
    name: "sample Product",
    price: 29.99,
    inStock: true
  }

  return (
    <>
      <h1>MEHAK</h1>
      <ProductCard  props={product} />
       <ProductCard  props={product1} />

    </>
  )
}

export default App
