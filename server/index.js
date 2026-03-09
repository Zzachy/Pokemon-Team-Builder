const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const pokemonRoutes = require('./routes/pokemon');
app.use('/api/pokemon', pokemonRoutes);

app.listen(3000, () => console.log('Server running on port 3000'));