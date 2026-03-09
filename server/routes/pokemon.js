const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all pokemon with their types
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.pokemon_id, p.name, 
             ARRAY_AGG(t.type_name) AS types
      FROM pokemon p
      JOIN pokemon_types pt ON pt.pokemon_id = p.id
      JOIN types t ON pt.type_id = t.id
      GROUP BY p.id, p.pokemon_id, p.name
      ORDER BY p.pokemon_id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single pokemon by name
router.get('/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const result = await pool.query(`
      SELECT p.id, p.pokemon_id, p.name,
             ARRAY_AGG(t.type_name) AS types
      FROM pokemon p
      JOIN pokemon_types pt ON pt.pokemon_id = p.id
      JOIN types t ON pt.type_id = t.id
      WHERE p.name = $1
      GROUP BY p.id, p.pokemon_id, p.name
    `, [name]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pokemon not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;