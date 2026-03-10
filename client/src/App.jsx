import { useState, useEffect, useMemo } from 'react';

const POKEAPI_SPRITE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/';
const EMPTY_SLOT = null;

const TYPE_CHART = {
    normal:   { fighting: 2, ghost: 0 },
    fire:     { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, ice: 0.5, bug: 0.5, steel: 0.5, fairy: 0.5 },
    water:    { grass: 2, electric: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
    electric: { ground: 2, electric: 0.5, flying: 0.5, steel: 0.5 },
    grass:    { fire: 2, ice: 2, poison: 2, flying: 2, bug: 2, water: 0.5, grass: 0.5, electric: 0.5, ground: 0.5 },
    ice:      { fire: 2, fighting: 2, rock: 2, steel: 2, ice: 0.5 },
    fighting: { flying: 2, psychic: 2, fairy: 2, bug: 0.5, rock: 0.5, dark: 0.5 },
    poison:   { ground: 2, psychic: 2, grass: 0.5, fighting: 0.5, poison: 0.5, bug: 0.5, fairy: 0.5 },
    ground:   { water: 2, grass: 2, ice: 2, poison: 0.5, rock: 0.5, electric: 0 },
    flying:   { electric: 2, ice: 2, rock: 2, grass: 0.5, fighting: 0.5, bug: 0.5, ground: 0 },
    psychic:  { bug: 2, ghost: 2, dark: 2, fighting: 0.5, psychic: 0.5 },
    bug:      { fire: 2, flying: 2, rock: 2, grass: 0.5, fighting: 0.5, ground: 0.5 },
    rock:     { water: 2, grass: 2, fighting: 2, ground: 2, steel: 2, normal: 0.5, fire: 0.5, poison: 0.5, flying: 0.5 },
    ghost:    { ghost: 2, dark: 2, poison: 0.5, bug: 0.5, normal: 0, fighting: 0 },
    dragon:   { ice: 2, dragon: 2, fairy: 2, fire: 0.5, water: 0.5, grass: 0.5, electric: 0.5 },
    dark:     { fighting: 2, bug: 2, fairy: 2, ghost: 0.5, dark: 0.5, psychic: 0 },
    steel:    { fire: 2, fighting: 2, ground: 2, normal: 0.5, grass: 0.5, ice: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 0.5, dragon: 0.5, steel: 0.5, fairy: 0.5, poison: 0 },
    fairy:    { poison: 2, steel: 2, fighting: 0.5, bug: 0.5, dark: 0.5, dragon: 0 },
};

const ALL_TYPES = Object.keys(TYPE_CHART);

// Colour per type label badge
const TYPE_COLORS = {
    normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
    grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
    ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
    rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
    steel: '#B7B7CE', fairy: '#D685AD',
};

const getMultiplier = (attackingType, defenderTypes) => {
    return defenderTypes.reduce((mult, defType) => {
        return mult * (TYPE_CHART[defType]?.[attackingType] ?? 1);
    }, 1);
};

// Only the number itself is coloured — cell background stays neutral
const multiplierTextStyle = (value) => {
    if (value === 0)    return { color: '#60a5fa', fontWeight: 'bold', fontSize: '14px' }; // blue  — immune
    if (value === 0.25) return { color: '#4ade80', fontWeight: 'bold', fontSize: '14px' }; // green — quarter
    if (value === 0.5)  return { color: '#86efac', fontWeight: 'bold', fontSize: '14px' }; // light green — half
    if (value === 2)    return { color: '#f87171', fontWeight: 'bold', fontSize: '14px' }; // red   — double
    if (value === 4)    return { color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }; // bright red — quad
    return {};
};

const multiplierLabel = (value) => {
    if (value === 0)    return '0×';
    if (value === 0.25) return '¼×';
    if (value === 0.5)  return '½×';
    if (value === 2)    return '2×';
    if (value === 4)    return '4×';
    return '';
};

function WeaknessCoverageTable({ team }) {
    const filledSlots = team.filter(Boolean);

    const rows = useMemo(() => {
        return ALL_TYPES.map(attackingType => {
            const cells = filledSlots.map(pokemon => getMultiplier(attackingType, pokemon.types));
            const totalWeak    = cells.filter(v => v > 1).length;
            const totalResist  = cells.filter(v => v > 0 && v < 1).length;
            const totalImmune  = cells.filter(v => v === 0).length;
            return { attackingType, cells, totalWeak, totalResist, totalImmune };
        });
    }, [filledSlots]);

    if (filledSlots.length === 0) {
        return <p style={{ color: '#9CA3AF' }}>Add Pokémon to your team to see weakness coverage.</p>;
    }

    // Shared cell style — plain dark background, no colour fill
    const cellBase = {
        padding: '8px 10px',
        textAlign: 'center',
        backgroundColor: '#243044',
        borderBottom: '1px solid #1a2535',
    };

    const altCellBase = {
        ...cellBase,
        backgroundColor: '#1e2a3a',
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#111827' }}>
                        {/* Top-left corner */}
                        <th style={{
                            margin: '0',
                            padding: '10px 12px',
                            textAlign: 'left',
                            color: '#9CA3AF',
                            fontWeight: 'bold',
                            width: '100px',
                            borderBottom: '2px solid #374151',
                        }}>
                            Move<br />↓
                        </th>

                        {/* One column per team member */}
                        {filledSlots.map((pokemon, i) => (
                            <th key={i} style={{
                                padding: '10px 8px',
                                textAlign: 'center',
                                color: '#ffffff',
                                fontWeight: 'bold',
                                minWidth: '90px',
                                borderBottom: '2px solid #374151',
                            }}>
                                <img
                                    src={pokemon.sprite}
                                    alt={pokemon.name}
                                    style={{ width: '48px', height: '48px', objectFit: 'contain', display: 'block', margin: '0 auto 4px' }}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <span style={{ textTransform: 'capitalize', fontSize: '12px' }}>{pokemon.name}</span>
                                <div style={{ color: '#9CA3AF', fontSize: '10px', fontWeight: 'normal', marginTop: '2px' }}>
                                    {pokemon.types.join(' / ')}
                                </div>
                            </th>
                        ))}

                        {/* Empty filler columns to match screenshot spacing */}
                        {Array.from({ length: Math.max(0, 6 - filledSlots.length) }).map((_, i) => (
                            <th key={`empty-${i}`} style={{
                                minWidth: '70px',
                                borderBottom: '2px solid #374151',
                                backgroundColor: '#1a2535'
                            }} />
                        ))}

                        {/* Totals headers */}
                        <th style={{
                            padding: '10px 8px',
                            textAlign: 'center',
                            color: '#c084fc',
                            fontWeight: 'bold',
                            minWidth: '90px',
                            borderBottom: '2px solid #374151',
                            backgroundColor: '#2d1f4a'
                        }}>
                            Total Weak
                        </th>
                        <th style={{
                            padding: '10px 8px',
                            textAlign: 'center',
                            color: '#34d399',
                            fontWeight: 'bold',
                            minWidth: '90px',
                            borderBottom: '2px solid #374151',
                            backgroundColor: '#1a3a2a'
                        }}>
                            Total Resist
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(({ attackingType, cells, totalWeak, totalResist, totalImmune }, rowIndex) => {
                        const base = rowIndex % 2 === 0 ? cellBase : altCellBase;
                        return (
                            <tr key={attackingType}>
                                {/* Type label badge */}
                                <td style={{ ...base, padding: '6px 8px' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '3px 10px',
                                        borderRadius: '6px',
                                        backgroundColor: TYPE_COLORS[attackingType] || '#555',
                                        color: '#ffffff',
                                        fontWeight: 'bold',
                                        fontSize: '11px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        minWidth: '70px',
                                        textAlign: 'center'
                                    }}>
                                        {attackingType}
                                    </span>
                                </td>

                                {/* Multiplier cells — plain background, coloured number only */}
                                {cells.map((value, i) => (
                                    <td key={i} style={base}>
                                        <span style={multiplierTextStyle(value)}>
                                            {multiplierLabel(value)}
                                        </span>
                                    </td>
                                ))}

                                {/* Empty filler cells */}
                                {Array.from({ length: Math.max(0, 6 - filledSlots.length) }).map((_, i) => (
                                    <td key={`empty-${i}`} style={{ ...base, backgroundColor: '#1a2535' }} />
                                ))}

                                {/* Total Weak */}
                                <td style={{
                                    ...base,
                                    backgroundColor: totalWeak > 0 ? '#2d1f4a' : '#1a1a2e',
                                    color: totalWeak > 0 ? '#c084fc' : '#374151',
                                    fontWeight: 'bold',
                                    fontSize: '14px'
                                }}>
                                    {totalWeak > 0 ? totalWeak : ''}
                                </td>

                                {/* Total Resist (includes immunities) */}
                                <td style={{
                                    ...base,
                                    backgroundColor: (totalResist + totalImmune) > 0 ? '#1a3a2a' : '#1a2535',
                                    color: (totalResist + totalImmune) > 0 ? '#34d399' : '#374151',
                                    fontWeight: 'bold',
                                    fontSize: '14px'
                                }}>
                                    {(totalResist + totalImmune) > 0 ? totalResist + totalImmune : ''}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function PokemonList() {
    const [pokemonList, setPokemonList] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [team, setTeam] = useState(Array(6).fill(EMPTY_SLOT));

    useEffect(() => {
        fetch('pokemon-team-builder-production.up.railway.app')
            .then(res => res.json())
            .then(data => {
                console.log(data);
                setPokemonList(data);
            });
    }, []);

    const filteredList = pokemonList.filter(pokemon =>
        pokemon.name.toLowerCase().includes(searchInput.toLowerCase())
    );

    const addToTeam = (pokemon) => {
        if (team.some(slot => slot?.id === pokemon.id)) return;
        const firstEmpty = team.findIndex(slot => slot === EMPTY_SLOT);
        if (firstEmpty === -1) return;
        const spriteUrl = `${POKEAPI_SPRITE_URL}${pokemon.id}.png`;
        const newTeam = [...team];
        newTeam[firstEmpty] = { ...pokemon, sprite: spriteUrl };
        setTeam(newTeam);
    };

    const removeFromTeam = (slotIndex) => {
        const newTeam = [...team];
        newTeam[slotIndex] = EMPTY_SLOT;
        setTeam(newTeam);
    };

    return (
      <>
        <style>{`
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { margin: 0; padding: 0; background-color: #111827; }
        `}</style>
        <div style={{ padding: '24px', backgroundColor: '#111827', minHeight: '100vh' }}>
            <h2 style={{ color: '#ffffff', fontFamily: 'monospace', marginBottom: '16px' }}>
                Choose your Pokémon!
            </h2>

            {/* Team slots row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '12px',
                marginBottom: '24px',
                backgroundColor: '#1F2937',
                borderRadius: '12px',
                padding: '16px'
            }}>
                {team.map((slot, index) => (
                    <div
                        key={index}
                        onClick={() => slot && removeFromTeam(index)}
                        title={slot ? `Remove ${slot.name}` : 'Empty slot'}
                        style={{
                            backgroundColor: '#374151',
                            borderRadius: '10px',
                            padding: '10px',
                            textAlign: 'center',
                            cursor: slot ? 'pointer' : 'default',
                            border: slot ? '2px solid #7d65e1' : '2px dashed #4B5563',
                            minHeight: '110px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        {slot ? (
                            <>
                                <img
                                    src={slot.sprite}
                                    alt={slot.name}
                                    style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <p style={{ color: '#ffffff', fontSize: '11px', marginTop: '4px', textTransform: 'capitalize', fontWeight: 'bold' }}>
                                    {slot.name}
                                </p>
                                <p style={{ color: '#9CA3AF', fontSize: '10px' }}>
                                    {slot.types.join(' / ')}
                                </p>
                            </>
                        ) : (
                            <p style={{ color: '#4B5563', fontSize: '22px' }}>+</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Weakness coverage table */}
            <div style={{
                backgroundColor: '#1a2535',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                fontSize: '13px'
            }}>
                <p style={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '12px', fontSize: '16px', textAlign: 'center' }}>
                    Defensive Coverage
                </p>
                <WeaknessCoverageTable team={team} />
            </div>

            {/* Search bar */}
            <div style={{ marginBottom: '24px' }}>
                <input
                    type="text"
                    placeholder="Search Pokémon..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid transparent',
                        backgroundColor: '#1F2937',
                        color: '#ffffff',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            {/* Pokemon grid */}
            <div style={{ height: '60vh', overflowY: 'auto', paddingRight: '8px', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {filteredList.map(pokemon => {
                        const isOnTeam = team.some(slot => slot?.id === pokemon.id);
                        const teamFull = team.every(slot => slot !== EMPTY_SLOT);
                        return (
                            <div
                                key={pokemon.id}
                                onClick={() => !isOnTeam && !teamFull && addToTeam(pokemon)}
                                style={{
                                    backgroundColor: isOnTeam ? '#374151' : 'grey',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    textAlign: 'center',
                                    position: 'relative',
                                    cursor: isOnTeam || teamFull ? 'not-allowed' : 'pointer',
                                    opacity: isOnTeam ? 0.5 : 1,
                                    border: isOnTeam ? '2px solid #7d65e1' : '2px solid transparent',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <p style={{ color: '#ffffff', fontWeight: 'bold', marginTop: '8px', textTransform: 'capitalize' }}>
                                    {pokemon.name}
                                </p>
                                <p style={{ color: 'white' }}>Type: {pokemon.types.join(', ')}</p>
                                {isOnTeam && (
                                    <p style={{ color: '#7d65e1', fontSize: '11px', marginTop: '4px' }}>✓ On team</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </>
    );
}

export default PokemonList;