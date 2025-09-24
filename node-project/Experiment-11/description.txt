PROJECT: REST API for Playing Card Collection

1) Technologies Used:
    a) Node.js: As the asynchronous JavaScript runtime for the server.
    b) Express.js: As the web framework for building the RESTful API, defining routes, and handling HTTP requests.
    c) JavaScript (ES6+): For the application's logic, data manipulation, and route handling.

2) Project Overview:
    a) This project is a simple RESTful API designed to manage a collection of playing cards.
    b) It demonstrates fundamental backend concepts including routing, handling different HTTP methods (GET, POST, DELETE), and managing data in memory.
    c) The primary goal was to practice building a clean, resource-oriented API following REST principles.
    d) This application serves as an excellent introduction to creating data-driven backend services with Node.js and Express.

3) Project File Structure: 
    The project is built within a single file for simplicity, containing the server setup, data store, and all API endpoint logic.

        Experiment-11/
        ├── node_modules/         # Contains all installed dependencies like Express
        ├── package.json          # Project configuration and script definitions
        └── server.js             # The main application file with all the code

4) Structure: 
    API Endpoints & In-Memory Data: 
      The application's state is managed by a simple JavaScript array (cards) that acts as an in-memory database. All API endpoints perform CRUD (Create, Read, Update, Delete) operations on this array.

     SNIPPETS:

        i) In-Memory Data Store: The state is managed by an array of card objects and a counter variable for generating new IDs. This is the single source of truth for the application. SNIPPET (server.js - Data):
            let cards = [
              { id: 1, suit: 'Hearts', value: 'Ace' },
              { id: 2, suit: 'Spades', value: 'King' },
              // ... more cards
            ];
            let nextId = 4;

        ii) Get All Cards Endpoint (GET /cards): This is a simple read operation. The endpoint returns the entire cards array as a JSON response, allowing a client to view the whole collection. SNIPPIPET (server.js - Get All):
            app.get('/cards', (req, res) => {
              res.json(cards);
                });

       iii) Add New Card Endpoint (POST /cards): This is the create operation. The endpoint reads the new card's suit and value from the request body, assigns a new ID, and adds the new card object to the cards array. SNIPPET (server.js - Add Card):
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
              res.status(201).json(newCard); // Respond with the newly created card
            });

        iv) Delete Card Endpoint (DELETE /cards/:id): This is the delete operation. It uses a URL parameter to identify the card to be removed, finds its index in the array, and uses splice to remove it from the collection. SNIPPET (server.js - Delete Card):

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

5) Learning Outcomes:
    a) Mastered the setup of a basic Express.js server from scratch.
    b) Gained practical experience designing and implementing a RESTful API with clear and logical endpoints.
    c) Understood how to handle different HTTP methods (GET, POST, DELETE) for different CRUD operations.
    d) Learned to work with URL parameters (req.params) and JSON request bodies (req.body).
    e) Implemented basic server-side validation to ensure data integrity.

6) Key Concepts:
    a) RESTful API Principles
    b) Express.js Routing
    c) CRUD Operations (Create, Read, Delete)
    d) In-Memory Data Management
    d) HTTP Request/Response Cycle
    e) JSON Data Handling
    f) Express Middleware (express.json())