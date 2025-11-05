import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get("http://localhost:5000/api/products")
      .then(res => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to fetch products");
        setLoading(false);
      });
  }, []);

  return (
    <div className="container">
      <h1>Product List</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div className="grid">
        {products.map(product => (
          <div key={product.id} className="card">
            <h2>{product.name}</h2>
            <p>Price: ${product.price}</p>
            <button className="buy-btn">Buy Now</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;