const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

const products = [
  { id: 1, name: 'Laptop', price: 1200 },
  { id: 2, name: 'Mouse', price: 25 },
  { id: 3, name: 'Keyboard', price: 45 }
];

app.get('/api/products',(req,res) => {
  res.json(products);
});

const PORT = 5000;
app.listen(PORT, ()=> console.log(`Backend running on PORT: ${PORT}`));