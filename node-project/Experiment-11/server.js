const express = require('express');
const app = express();
const port = 3000;

app.set('json spaces', 2);

app.use(express.json());

let cards = [
  { id: 1, suit: 'Hearts', value: 'Ace' },
  { id: 2, suit: 'Spades', value: 'King' },
  { id: 3, suit: 'Diamonds', value: 'Queen' }
];

let nextId = 4;

app.get('/cards', (req, res) => {
  res.json(cards);
});

app.get('/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id);
  const card = cards.find(c => c.id === cardId);

  if (card) {
    res.json(card);
  } else {
    res.status(404).json({ message: 'Card not found' });
  }
});

app.post('/cards', (req, res) => {
  const { suit, value } = req.body;

  if (!suit || !value) {
    return res.status(400).json({ message: 'Suit and value are required' });
  }

  const newCard = {
    id: nextId++,
    suit,
    value
  };

  cards.push(newCard);
  res.status(201).json(newCard);
});

app.delete('/cards/:id', (req, res) => {
  const cardId = parseInt(req.params.id);
  const cardIndex = cards.findIndex(c => c.id === cardId);

  if (cardIndex !== -1) {
    const [removedCard] = cards.splice(cardIndex, 1);
    res.json({ message: `Card with ID ${cardId} removed`, card: removedCard });
  } else {
    res.status(404).json({ message: 'Card not found' });
  }
});


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});