const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ixdYQXwrxloiTcUwCZKYJNEgJYLXGOvY@switchback.proxy.rlwy.net:50559/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    // Get the season ID
    const seasonRes = await pool.query(`SELECT id FROM seasons WHERE is_active = true LIMIT 1`);
    const seasonId = seasonRes.rows[0]?.id;

    if (!seasonId) {
      console.error('No active season found');
      return;
    }
    console.log('Season ID:', seasonId);

    // Insert teams
    const teams = [
      { name: 'Rays', abbr: 'RAY', primary: '#092C5C', secondary: '#8FBCE6', wins: 14, losses: 4, ties: 0, rf: 168, ra: 87 },
      { name: 'Pirates', abbr: 'PIR', primary: '#27251F', secondary: '#FDB827', wins: 12, losses: 4, ties: 1, rf: 119, ra: 81 },
      { name: 'Athletics', abbr: 'ATH', primary: '#003831', secondary: '#EFB21E', wins: 12, losses: 6, ties: 1, rf: 184, ra: 118 },
      { name: 'Mariners', abbr: 'MAR', primary: '#0C2C56', secondary: '#005C5C', wins: 8, losses: 10, ties: 0, rf: 148, ra: 171 },
      { name: 'Rockies', abbr: 'ROC', primary: '#33006F', secondary: '#C4CED4', wins: 4, losses: 12, ties: 0, rf: 93, ra: 176 },
      { name: 'Diamondbacks', abbr: 'DBK', primary: '#A71930', secondary: '#E3D4AD', wins: 1, losses: 15, ties: 0, rf: 92, ra: 171 },
    ];

    const teamIds = {};
    for (const team of teams) {
      const res = await pool.query(`
        INSERT INTO teams (name, abbreviation, primary_color, secondary_color, season_id, wins, losses, ties, runs_scored, runs_allowed)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [team.name, team.abbr, team.primary, team.secondary, seasonId, team.wins, team.losses, team.ties, team.rf, team.ra]);

      if (res.rows[0]) {
        teamIds[team.abbr.toLowerCase()] = res.rows[0].id;
      } else {
        // Get existing team id
        const existing = await pool.query(`SELECT id FROM teams WHERE abbreviation = $1 AND season_id = $2`, [team.abbr, seasonId]);
        if (existing.rows[0]) {
          teamIds[team.abbr.toLowerCase()] = existing.rows[0].id;
        }
      }
    }
    console.log('Teams inserted:', Object.keys(teamIds).length);

    // Map old team IDs to new UUIDs
    const teamMap = {
      'rays': teamIds['ray'],
      'pirates': teamIds['pir'],
      'athletics': teamIds['ath'],
      'mariners': teamIds['mar'],
      'rockies': teamIds['roc'],
      'diamondbacks': teamIds['dbk'],
    };

    // Insert games
    const games = [
      { home: 'rays', away: 'pirates', date: '2026-02-14', time: '14:00', status: 'final', homeScore: 7, awayScore: 3 },
      { home: 'athletics', away: 'mariners', date: '2026-02-14', time: '17:00', status: 'final', homeScore: 5, awayScore: 6 },
      { home: 'rockies', away: 'diamondbacks', date: '2026-02-15', time: '13:00', status: 'final', homeScore: 2, awayScore: 4 },
      { home: 'pirates', away: 'rockies', date: '2026-02-16', time: '14:00', status: 'in_progress', homeScore: 4, awayScore: 3 },
      { home: 'rays', away: 'mariners', date: '2026-02-16', time: '17:00', status: 'scheduled', homeScore: 0, awayScore: 0 },
      { home: 'diamondbacks', away: 'athletics', date: '2026-02-17', time: '14:00', status: 'scheduled', homeScore: 0, awayScore: 0 },
      { home: 'rays', away: 'athletics', date: '2026-02-20', time: '18:00', status: 'scheduled', homeScore: 0, awayScore: 0 },
      { home: 'pirates', away: 'mariners', date: '2026-02-21', time: '14:00', status: 'scheduled', homeScore: 0, awayScore: 0 },
      { home: 'rockies', away: 'rays', date: '2026-02-22', time: '13:00', status: 'scheduled', homeScore: 0, awayScore: 0 },
      { home: 'athletics', away: 'pirates', date: '2026-02-23', time: '14:00', status: 'scheduled', homeScore: 0, awayScore: 0 },
    ];

    for (const game of games) {
      await pool.query(`
        INSERT INTO games (season_id, home_team_id, away_team_id, game_date, game_time, location_name, status, home_score, away_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `, [seasonId, teamMap[game.home], teamMap[game.away], game.date, game.time, 'Leary Field - Portsmouth', game.status, game.homeScore, game.awayScore]);
    }
    console.log('Games inserted');

    console.log('\nSeed data inserted successfully!');
    console.log('Team IDs:', teamMap);

  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
  } finally {
    pool.end();
  }
}

run();
