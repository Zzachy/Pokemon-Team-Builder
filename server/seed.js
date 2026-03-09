const axios = require('axios');
const pool = require('./db');

// Small helper to avoid hammering the API
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function seedPokemon(limit = 1025) {
  const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon?limit=${limit}`);

  for (const entry of data.results) {
    try {
      const { data: pokemon } = await axios.get(entry.url);

      // 1. Insert the Pokémon
      const pokemonResult = await pool.query(
        `INSERT INTO pokemon (pokemon_id, name)
         VALUES ($1, $2)
         ON CONFLICT (pokemon_id) DO NOTHING
         RETURNING id`,
        [pokemon.id, pokemon.name]
      );

      // If the row already existed, RETURNING gives us nothing — skip it
      if (pokemonResult.rows.length === 0) {
        console.log(`Skipped (already exists): ${pokemon.name}`);
        continue;
      }

      const pokemonKey = pokemonResult.rows[0].id;

      for (const typeEntry of pokemon.types) {
        const typeName = typeEntry.type.name;

        // 2. Insert the type if it doesn't already exist
        await pool.query(
          `INSERT INTO types (type_name) VALUES ($1) ON CONFLICT (type_name) DO NOTHING`,
          [typeName]
        );

        const typeResult = await pool.query(
          `SELECT id FROM types WHERE type_name = $1`,
          [typeName]
        );
        const typeKey = typeResult.rows[0].id;

        // 3. Insert into the junction table
        await pool.query(
          `INSERT INTO pokemon_types (pokemon_id, type_id) VALUES ($1, $2)`,
          [pokemonKey, typeKey]
        );
      }

      console.log(`Seeded: ${pokemon.name} (#${pokemon.id})`);

      // Pause 100ms between each Pokémon to be polite to the API
      await delay(100);

    } catch (err) {
      console.error(`Failed on ${entry.name}:`, err.message);
      // Continue seeding even if one Pokémon fails
      continue;
    }
  }

  console.log('Done seeding all Pokémon through Gen 9.');
  pool.end();
}

seedPokemon();