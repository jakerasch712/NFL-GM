import { Player, Position, PlayerPersonality } from '../types';

export const REAL_NFL_PLAYERS: Player[] = [
  // ==================== NY JETS (NYJ) ====================
  {
    id: 'nyj_1', name: 'Aaron Rodgers', position: Position.QB, age: 41, overall: 88, schemeOvr: 89, morale: 88, fatigue: 92, archetype: 'Field General', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 3900, touchdowns: 28, rating: 98.4 },
    contract: { years: 2, salary: 37.5, bonus: 12, guaranteed: 50, yearsLeft: 1, totalValue: 75, capHit: 21, deadCap: 15, voidYears: 0, startYear: 2024, totalLength: 2 },
    teamId: 'NYJ'
  },
  {
    id: 'nyj_2', name: 'Justin Fields', position: Position.QB, age: 26, overall: 78, schemeOvr: 81, morale: 85, fatigue: 100, archetype: 'Scrambler', personality: 'Normal', scheme: 'Spread', developmentTrait: 'Star', potential: 'Superstar',
    stats: { gamesPlayed: 6, yards: 850, touchdowns: 6 },
    contract: { years: 2, salary: 6, bonus: 2, guaranteed: 8, yearsLeft: 1, totalValue: 12, capHit: 6, deadCap: 2, voidYears: 0, startYear: 2025, totalLength: 2 },
    teamId: 'NYJ'
  },
  {
    id: 'nyj_3', name: 'Breece Hall', position: Position.RB, age: 24, overall: 91, schemeOvr: 93, morale: 92, fatigue: 95, archetype: 'Elusive Back', personality: 'Workhorse', scheme: 'Zone', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1180, touchdowns: 10 },
    contract: { years: 4, salary: 2.3, bonus: 3, guaranteed: 6, yearsLeft: 1, totalValue: 9.2, capHit: 2.3, deadCap: 1, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'NYJ'
  },
  {
    id: 'nyj_4', name: 'Garrett Wilson', position: Position.WR, age: 25, overall: 90, schemeOvr: 92, morale: 91, fatigue: 94, archetype: 'Route Technician', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1240, touchdowns: 8 },
    contract: { years: 4, salary: 5.1, bonus: 8, guaranteed: 15, yearsLeft: 1, totalValue: 20.5, capHit: 5.1, deadCap: 2, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'NYJ'
  },
  {
    id: 'nyj_5', name: 'Tyler Conklin', position: Position.TE, age: 30, overall: 79, schemeOvr: 80, morale: 84, fatigue: 90, archetype: 'Possession', personality: 'Normal', scheme: 'Balanced', developmentTrait: 'Normal', potential: 'Star',
    stats: { gamesPlayed: 17, yards: 620, touchdowns: 4 },
    contract: { years: 3, salary: 6.8, bonus: 4, guaranteed: 10, yearsLeft: 1, totalValue: 20.2, capHit: 6.8, deadCap: 2, voidYears: 0, startYear: 2023, totalLength: 3 },
    teamId: 'NYJ'
  },
  {
    id: 'nyj_6', name: 'Tyron Smith', position: Position.OL, age: 34, overall: 86, schemeOvr: 87, morale: 85, fatigue: 82, archetype: 'Pass Protector', personality: 'Ring Chaser', scheme: 'Zone', developmentTrait: 'Star', potential: 'Star',
    stats: { gamesPlayed: 14, sacks: 2 },
    contract: { years: 1, salary: 6.5, bonus: 6.5, guaranteed: 13, yearsLeft: 1, totalValue: 13, capHit: 13, deadCap: 6, voidYears: 0, startYear: 2025, totalLength: 1 },
    teamId: 'NYJ'
  },
  {
    id: 'nyj_7', name: 'Quinnen Williams', position: Position.DL, age: 27, overall: 94, schemeOvr: 96, morale: 95, fatigue: 92, archetype: 'Power Rusher', personality: 'Leader', scheme: '4-3 Under', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 62, sacks: 9.5 },
    contract: { years: 4, salary: 24, bonus: 20, guaranteed: 66, yearsLeft: 3, totalValue: 96, capHit: 24, deadCap: 18, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'NYJ'
  },
  {
    id: 'nyj_8', name: 'Will McDonald IV', position: Position.DL, age: 26, overall: 83, schemeOvr: 85, morale: 88, fatigue: 96, archetype: 'Speed Rusher', personality: 'Normal', scheme: '3-4 Defense', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 17, tackles: 34, sacks: 10.5 },
    contract: { years: 4, salary: 4, bonus: 6, guaranteed: 12, yearsLeft: 2, totalValue: 16, capHit: 4, deadCap: 3, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'NYJ'
  },
  {
    id: 'nyj_9', name: 'C.J. Mosley', position: Position.LB, age: 33, overall: 85, schemeOvr: 86, morale: 90, fatigue: 86, archetype: 'Field General', personality: 'Leader', scheme: 'Base 4-3', developmentTrait: 'Star', potential: 'Star',
    stats: { gamesPlayed: 17, tackles: 142, interceptions: 1 },
    contract: { years: 2, salary: 8.5, bonus: 4, guaranteed: 10, yearsLeft: 1, totalValue: 17, capHit: 8.5, deadCap: 4, voidYears: 0, startYear: 2024, totalLength: 2 },
    teamId: 'NYJ'
  },
  {
    id: 'nyj_10', name: 'Quincy Williams', position: Position.LB, age: 29, overall: 88, schemeOvr: 89, morale: 92, fatigue: 91, archetype: 'Run Stopper', personality: 'Workhorse', scheme: 'Base 4-3', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 17, tackles: 130, sacks: 3.5 },
    contract: { years: 3, salary: 6, bonus: 3, guaranteed: 9, yearsLeft: 1, totalValue: 18, capHit: 6, deadCap: 2, voidYears: 0, startYear: 2023, totalLength: 3 },
    teamId: 'NYJ'
  },
  {
    id: 'nyj_11', name: 'Sauce Gardner', position: Position.CB, age: 25, overall: 96, schemeOvr: 98, morale: 96, fatigue: 95, archetype: 'Lockdown Corner', personality: 'Leader', scheme: 'Press Man', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 58, interceptions: 3 },
    contract: { years: 4, salary: 8.3, bonus: 18, guaranteed: 33, yearsLeft: 1, totalValue: 33.5, capHit: 8.3, deadCap: 4, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'NYJ'
  },
  {
    id: 'nyj_12', name: 'DJ Reed', position: Position.CB, age: 28, overall: 86, schemeOvr: 87, morale: 87, fatigue: 92, archetype: 'Zone Corner', personality: 'Normal', scheme: 'Cover 3', developmentTrait: 'Star', potential: 'Star',
    stats: { gamesPlayed: 16, tackles: 72, interceptions: 2 },
    contract: { years: 3, salary: 11, bonus: 6, guaranteed: 21, yearsLeft: 0, totalValue: 33, capHit: 11, deadCap: 3, voidYears: 0, startYear: 2022, totalLength: 3 },
    teamId: 'NYJ'
  },
  {
    id: 'nyj_13', name: 'Chuck Clark', position: Position.S, age: 30, overall: 80, schemeOvr: 81, morale: 83, fatigue: 89, archetype: 'Zone Safety', personality: 'Normal', scheme: 'Cover 2', developmentTrait: 'Normal', potential: 'Star',
    stats: { gamesPlayed: 17, tackles: 85, interceptions: 1 },
    contract: { years: 1, salary: 2.5, bonus: 1, guaranteed: 2.5, yearsLeft: 1, totalValue: 2.5, capHit: 2.5, deadCap: 1, voidYears: 0, startYear: 2025, totalLength: 1 },
    teamId: 'NYJ'
  },
  {
    id: 'nyj_14', name: 'Greg Zuerlein', position: Position.K, age: 37, overall: 81, schemeOvr: 81, morale: 85, fatigue: 90, archetype: 'Accurate', personality: 'Normal', scheme: 'Balanced', developmentTrait: 'Normal', potential: 'Normal',
    stats: { gamesPlayed: 17 },
    contract: { years: 2, salary: 4.2, bonus: 2, guaranteed: 4, yearsLeft: 1, totalValue: 8.4, capHit: 4.2, deadCap: 1, voidYears: 0, startYear: 2024, totalLength: 2 },
    teamId: 'NYJ'
  },

  // ==================== NEW ENGLAND PATRIOTS (NE) ====================
  {
    id: 'ne_1', name: 'Drake Maye', position: Position.QB, age: 23, overall: 82, schemeOvr: 85, morale: 90, fatigue: 98, archetype: 'Gunslinger', personality: 'Leader', scheme: 'Vertical', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 12, yards: 2850, touchdowns: 19, rating: 92.1 },
    contract: { years: 4, salary: 9.2, bonus: 22, guaranteed: 36, yearsLeft: 3, totalValue: 36.8, capHit: 9.2, deadCap: 16, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'NE'
  },
  {
    id: 'ne_2', name: 'Jacoby Brissett', position: Position.QB, age: 32, overall: 75, schemeOvr: 76, morale: 82, fatigue: 95, archetype: 'Field General', personality: 'Normal', scheme: 'West Coast', developmentTrait: 'Normal', potential: 'Normal',
    stats: { gamesPlayed: 5, yards: 820, touchdowns: 4 },
    contract: { years: 1, salary: 8, bonus: 4, guaranteed: 8, yearsLeft: 1, totalValue: 8, capHit: 8, deadCap: 4, voidYears: 0, startYear: 2025, totalLength: 1 },
    teamId: 'NE'
  },
  {
    id: 'ne_3', name: 'Rhamondre Stevenson', position: Position.RB, age: 27, overall: 84, schemeOvr: 85, morale: 86, fatigue: 90, archetype: 'Power Back', personality: 'Workhorse', scheme: 'Power', developmentTrait: 'Star', potential: 'Star',
    stats: { gamesPlayed: 16, yards: 980, touchdowns: 8 },
    contract: { years: 4, salary: 9, bonus: 8, guaranteed: 17, yearsLeft: 3, totalValue: 36, capHit: 9, deadCap: 6, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'NE'
  },
  {
    id: 'ne_4', name: "Ja'Lynn Polk", position: Position.WR, age: 23, overall: 77, schemeOvr: 79, morale: 85, fatigue: 97, archetype: 'Possession', personality: 'Normal', scheme: 'West Coast', developmentTrait: 'Star', potential: 'Superstar',
    stats: { gamesPlayed: 16, yards: 610, touchdowns: 5 },
    contract: { years: 4, salary: 2.2, bonus: 3, guaranteed: 6, yearsLeft: 3, totalValue: 8.8, capHit: 2.2, deadCap: 2, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'NE'
  },
  {
    id: 'ne_5', name: 'Hunter Henry', position: Position.TE, age: 30, overall: 82, schemeOvr: 83, morale: 88, fatigue: 88, archetype: 'Possession', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Star', potential: 'Star',
    stats: { gamesPlayed: 17, yards: 690, touchdowns: 6 },
    contract: { years: 3, salary: 9, bonus: 9, guaranteed: 18, yearsLeft: 2, totalValue: 27, capHit: 9, deadCap: 6, voidYears: 0, startYear: 2024, totalLength: 3 },
    teamId: 'NE'
  },
  {
    id: 'ne_6', name: 'Mike Onwenu', position: Position.OL, age: 27, overall: 85, schemeOvr: 86, morale: 87, fatigue: 92, archetype: 'Mauler', personality: 'Workhorse', scheme: 'Power', developmentTrait: 'Star', potential: 'Star',
    stats: { gamesPlayed: 17, sacks: 1 },
    contract: { years: 3, salary: 19, bonus: 15, guaranteed: 38, yearsLeft: 2, totalValue: 57, capHit: 19, deadCap: 10, voidYears: 0, startYear: 2024, totalLength: 3 },
    teamId: 'NE'
  },
  {
    id: 'ne_7', name: 'Christian Barmore', position: Position.DL, age: 26, overall: 89, schemeOvr: 91, morale: 92, fatigue: 91, archetype: 'Power Rusher', personality: 'Leader', scheme: '3-4 Defense', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 64, sacks: 8.5 },
    contract: { years: 4, salary: 21, bonus: 18, guaranteed: 41, yearsLeft: 3, totalValue: 84, capHit: 21, deadCap: 15, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'NE'
  },
  {
    id: 'ne_8', name: 'Keion White', position: Position.DL, age: 26, overall: 82, schemeOvr: 84, morale: 87, fatigue: 95, archetype: 'Power Rusher', personality: 'Normal', scheme: 'Base 4-3', developmentTrait: 'Star', potential: 'Superstar',
    stats: { gamesPlayed: 17, tackles: 48, sacks: 6.5 },
    contract: { years: 4, salary: 2.1, bonus: 2, guaranteed: 4, yearsLeft: 2, totalValue: 8.4, capHit: 2.1, deadCap: 1, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'NE'
  },
  {
    id: 'ne_9', name: "Ja'Whaun Bentley", position: Position.LB, age: 29, overall: 81, schemeOvr: 82, morale: 85, fatigue: 88, archetype: 'Run Stopper', personality: 'Leader', scheme: 'Base 4-3', developmentTrait: 'Normal', potential: 'Star',
    stats: { gamesPlayed: 17, tackles: 114, sacks: 4.0 },
    contract: { years: 2, salary: 6, bonus: 3, guaranteed: 6, yearsLeft: 1, totalValue: 12, capHit: 6, deadCap: 2, voidYears: 0, startYear: 2024, totalLength: 2 },
    teamId: 'NE'
  },
  {
    id: 'ne_10', name: 'Christian Gonzalez', position: Position.CB, age: 23, overall: 88, schemeOvr: 90, morale: 94, fatigue: 96, archetype: 'Lockdown Corner', personality: 'Leader', scheme: 'Press Man', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 52, interceptions: 4 },
    contract: { years: 4, salary: 3.8, bonus: 6, guaranteed: 15, yearsLeft: 2, totalValue: 15.2, capHit: 3.8, deadCap: 3, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'NE'
  },
  {
    id: 'ne_11', name: 'Jabrill Peppers', position: Position.S, age: 29, overall: 85, schemeOvr: 86, morale: 89, fatigue: 90, archetype: 'Hybrid Safety', personality: 'Leader', scheme: 'Cover 3', developmentTrait: 'Star', potential: 'Star',
    stats: { gamesPlayed: 17, tackles: 92, interceptions: 2 },
    contract: { years: 3, salary: 8, bonus: 6, guaranteed: 14, yearsLeft: 2, totalValue: 24, capHit: 8, deadCap: 4, voidYears: 0, startYear: 2024, totalLength: 3 },
    teamId: 'NE'
  },

  // ==================== BUFFALO BILLS (BUF) ====================
  {
    id: 'buf_1', name: 'Josh Allen', position: Position.QB, age: 29, overall: 96, schemeOvr: 98, morale: 96, fatigue: 94, archetype: 'Gunslinger', personality: 'Leader', scheme: 'Spread', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 4350, touchdowns: 36, rating: 102.5 },
    contract: { years: 6, salary: 43, bonus: 50, guaranteed: 150, yearsLeft: 4, totalValue: 258, capHit: 43, deadCap: 30, voidYears: 0, startYear: 2021, totalLength: 6 },
    teamId: 'BUF'
  },
  {
    id: 'buf_2', name: 'James Cook', position: Position.RB, age: 26, overall: 87, schemeOvr: 88, morale: 90, fatigue: 92, archetype: 'Elusive Back', personality: 'Normal', scheme: 'Zone', developmentTrait: 'Star', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 1120, touchdowns: 8 },
    contract: { years: 4, salary: 1.4, bonus: 1.5, guaranteed: 3, yearsLeft: 1, totalValue: 5.6, capHit: 1.4, deadCap: 1, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'BUF'
  },
  {
    id: 'buf_3', name: 'Khalil Shakir', position: Position.WR, age: 25, overall: 82, schemeOvr: 84, morale: 88, fatigue: 95, archetype: 'Slot Specialist', personality: 'Normal', scheme: 'Spread', developmentTrait: 'Star', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 820, touchdowns: 6 },
    contract: { years: 4, salary: 1.1, bonus: 1, guaranteed: 2, yearsLeft: 1, totalValue: 4.4, capHit: 1.1, deadCap: 0.5, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'BUF'
  },
  {
    id: 'buf_4', name: 'Dalton Kincaid', position: Position.TE, age: 25, overall: 85, schemeOvr: 87, morale: 91, fatigue: 94, archetype: 'Vertical Threat', personality: 'Leader', scheme: 'Spread', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 780, touchdowns: 7 },
    contract: { years: 4, salary: 3.3, bonus: 5, guaranteed: 13, yearsLeft: 2, totalValue: 13.2, capHit: 3.3, deadCap: 2, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'BUF'
  },
  {
    id: 'buf_5', name: 'Ed Oliver', position: Position.DL, age: 27, overall: 89, schemeOvr: 90, morale: 90, fatigue: 91, archetype: 'Power Rusher', personality: 'Leader', scheme: 'Base 4-3', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 54, sacks: 9.5 },
    contract: { years: 4, salary: 17, bonus: 15, guaranteed: 45, yearsLeft: 3, totalValue: 68, capHit: 17, deadCap: 12, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'BUF'
  },
  {
    id: 'buf_6', name: 'Matt Milano', position: Position.LB, age: 31, overall: 87, schemeOvr: 88, morale: 88, fatigue: 85, archetype: 'Coverage Linebacker', personality: 'Leader', scheme: 'Base 4-3', developmentTrait: 'Star', potential: 'Star',
    stats: { gamesPlayed: 15, tackles: 98, interceptions: 2 },
    contract: { years: 2, salary: 14, bonus: 8, guaranteed: 20, yearsLeft: 1, totalValue: 28, capHit: 14, deadCap: 6, voidYears: 0, startYear: 2023, totalLength: 2 },
    teamId: 'BUF'
  },

  // ==================== MIAMI DOLPHINS (MIA) ====================
  {
    id: 'mia_1', name: 'Tua Tagovailoa', position: Position.QB, age: 27, overall: 89, schemeOvr: 92, morale: 91, fatigue: 92, archetype: 'Field General', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 4420, touchdowns: 31, rating: 101.2 },
    contract: { years: 4, salary: 53.1, bonus: 42, guaranteed: 167, yearsLeft: 3, totalValue: 212, capHit: 53.1, deadCap: 40, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'MIA'
  },
  {
    id: 'mia_2', name: "De'Von Achane", position: Position.RB, age: 23, overall: 88, schemeOvr: 91, morale: 93, fatigue: 95, archetype: 'Speed Back', personality: 'Normal', scheme: 'Zone', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 16, yards: 1050, touchdowns: 11 },
    contract: { years: 4, salary: 1.3, bonus: 1.8, guaranteed: 3, yearsLeft: 2, totalValue: 5.2, capHit: 1.3, deadCap: 1, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'MIA'
  },
  {
    id: 'mia_3', name: 'Tyreek Hill', position: Position.WR, age: 31, overall: 98, schemeOvr: 99, morale: 95, fatigue: 89, archetype: 'Deep Threat', personality: 'The Diva', scheme: 'West Coast', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1710, touchdowns: 13 },
    contract: { years: 3, salary: 30, bonus: 25, guaranteed: 65, yearsLeft: 2, totalValue: 90, capHit: 30, deadCap: 20, voidYears: 0, startYear: 2024, totalLength: 3 },
    teamId: 'MIA'
  },
  {
    id: 'mia_4', name: 'Jaylen Waddle', position: Position.WR, age: 26, overall: 91, schemeOvr: 93, morale: 92, fatigue: 94, archetype: 'Deep Threat', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1150, touchdowns: 8 },
    contract: { years: 3, salary: 28.2, bonus: 18, guaranteed: 76, yearsLeft: 3, totalValue: 84.6, capHit: 28.2, deadCap: 22, voidYears: 0, startYear: 2024, totalLength: 3 },
    teamId: 'MIA'
  },
  {
    id: 'mia_5', name: 'Jalen Ramsey', position: Position.CB, age: 30, overall: 92, schemeOvr: 94, morale: 92, fatigue: 90, archetype: 'Lockdown Corner', personality: 'Leader', scheme: 'Press Man', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 62, interceptions: 4 },
    contract: { years: 3, salary: 24.1, bonus: 15, guaranteed: 55, yearsLeft: 2, totalValue: 72.3, capHit: 24.1, deadCap: 15, voidYears: 0, startYear: 2024, totalLength: 3 },
    teamId: 'MIA'
  },

  // ==================== KANSAS CITY CHIEFS (KC) ====================
  {
    id: 'kc_1', name: 'Patrick Mahomes', position: Position.QB, age: 30, overall: 99, schemeOvr: 99, morale: 98, fatigue: 95, archetype: 'Improviser', personality: 'Gunslinger', scheme: 'West Coast', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 4620, touchdowns: 38, rating: 109.8 },
    contract: { years: 10, salary: 45, bonus: 60, guaranteed: 140, yearsLeft: 6, totalValue: 450, capHit: 45, deadCap: 60, voidYears: 0, startYear: 2020, totalLength: 10 },
    teamId: 'KC'
  },
  {
    id: 'kc_2', name: 'Isiah Pacheco', position: Position.RB, age: 26, overall: 86, schemeOvr: 87, morale: 90, fatigue: 93, archetype: 'Power Back', personality: 'Workhorse', scheme: 'Power', developmentTrait: 'Star', potential: 'Superstar',
    stats: { gamesPlayed: 16, yards: 1020, touchdowns: 9 },
    contract: { years: 4, salary: 1.1, bonus: 1, guaranteed: 2, yearsLeft: 1, totalValue: 4.4, capHit: 1.1, deadCap: 0.5, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'KC'
  },
  {
    id: 'kc_3', name: 'Rashee Rice', position: Position.WR, age: 25, overall: 86, schemeOvr: 88, morale: 88, fatigue: 94, archetype: 'YAC Specialist', personality: 'Normal', scheme: 'Spread', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 16, yards: 1080, touchdowns: 8 },
    contract: { years: 4, salary: 1.8, bonus: 2, guaranteed: 4, yearsLeft: 2, totalValue: 7.2, capHit: 1.8, deadCap: 1, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'KC'
  },
  {
    id: 'kc_4', name: 'Travis Kelce', position: Position.TE, age: 35, overall: 95, schemeOvr: 97, morale: 96, fatigue: 86, archetype: 'Vertical Threat', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1020, touchdowns: 9 },
    contract: { years: 2, salary: 17.1, bonus: 12, guaranteed: 25, yearsLeft: 1, totalValue: 34.2, capHit: 17.1, deadCap: 8, voidYears: 0, startYear: 2024, totalLength: 2 },
    teamId: 'KC'
  },
  {
    id: 'kc_5', name: 'Chris Jones', position: Position.DL, age: 31, overall: 97, schemeOvr: 98, morale: 95, fatigue: 89, archetype: 'Power Rusher', personality: 'Leader', scheme: 'Base 4-3', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 42, sacks: 12.5 },
    contract: { years: 5, salary: 31.7, bonus: 30, guaranteed: 95, yearsLeft: 3, totalValue: 158.5, capHit: 31.7, deadCap: 25, voidYears: 0, startYear: 2024, totalLength: 5 },
    teamId: 'KC'
  },
  {
    id: 'kc_6', name: 'Trent McDuffie', position: Position.CB, age: 24, overall: 92, schemeOvr: 94, morale: 94, fatigue: 96, archetype: 'Lockdown Corner', personality: 'Leader', scheme: 'Press Man', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 68, interceptions: 3 },
    contract: { years: 4, salary: 3.5, bonus: 6, guaranteed: 14, yearsLeft: 1, totalValue: 14, capHit: 3.5, deadCap: 2, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'KC'
  },

  // ==================== BALTIMORE RAVENS (BAL) ====================
  {
    id: 'bal_1', name: 'Lamar Jackson', position: Position.QB, age: 28, overall: 97, schemeOvr: 98, morale: 97, fatigue: 94, archetype: 'Scrambler', personality: 'Leader', scheme: 'Spread', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 3850, touchdowns: 32, rating: 104.1 },
    contract: { years: 5, salary: 52, bonus: 72, guaranteed: 185, yearsLeft: 3, totalValue: 260, capHit: 52, deadCap: 40, voidYears: 0, startYear: 2023, totalLength: 5 },
    teamId: 'BAL'
  },
  {
    id: 'bal_2', name: 'Derrick Henry', position: Position.RB, age: 31, overall: 94, schemeOvr: 95, morale: 92, fatigue: 88, archetype: 'Power Back', personality: 'Leader', scheme: 'Power', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1350, touchdowns: 14 },
    contract: { years: 2, salary: 8, bonus: 6, guaranteed: 9, yearsLeft: 1, totalValue: 16, capHit: 8, deadCap: 3, voidYears: 0, startYear: 2024, totalLength: 2 },
    teamId: 'BAL'
  },
  {
    id: 'bal_3', name: 'Zay Flowers', position: Position.WR, age: 24, overall: 86, schemeOvr: 88, morale: 90, fatigue: 96, archetype: 'YAC Specialist', personality: 'Normal', scheme: 'Spread', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 980, touchdowns: 6 },
    contract: { years: 4, salary: 3.5, bonus: 5, guaranteed: 14, yearsLeft: 2, totalValue: 14, capHit: 3.5, deadCap: 2, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'BAL'
  },
  {
    id: 'bal_4', name: 'Mark Andrews', position: Position.TE, age: 29, overall: 91, schemeOvr: 93, morale: 91, fatigue: 90, archetype: 'Vertical Threat', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 16, yards: 850, touchdowns: 8 },
    contract: { years: 4, salary: 14, bonus: 10, guaranteed: 30, yearsLeft: 1, totalValue: 56, capHit: 14, deadCap: 5, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'BAL'
  },
  {
    id: 'bal_5', name: 'Roquan Smith', position: Position.LB, age: 28, overall: 95, schemeOvr: 97, morale: 96, fatigue: 93, archetype: 'Run Stopper', personality: 'Leader', scheme: 'Base 3-4', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 158, sacks: 3.0, interceptions: 2 },
    contract: { years: 5, salary: 20, bonus: 22, guaranteed: 60, yearsLeft: 3, totalValue: 100, capHit: 20, deadCap: 15, voidYears: 0, startYear: 2023, totalLength: 5 },
    teamId: 'BAL'
  },
  {
    id: 'bal_6', name: 'Kyle Hamilton', position: Position.S, age: 24, overall: 95, schemeOvr: 97, morale: 96, fatigue: 96, archetype: 'Hybrid Safety', personality: 'Leader', scheme: 'Cover 3', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 92, sacks: 4.0, interceptions: 4 },
    contract: { years: 4, salary: 4.1, bonus: 8, guaranteed: 16, yearsLeft: 1, totalValue: 16.3, capHit: 4.1, deadCap: 2, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'BAL'
  },

  // ==================== SAN FRANCISCO 49ERS (SF) ====================
  {
    id: 'sf_1', name: 'Brock Purdy', position: Position.QB, age: 25, overall: 89, schemeOvr: 92, morale: 92, fatigue: 96, archetype: 'Field General', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 4280, touchdowns: 31, rating: 105.4 },
    contract: { years: 4, salary: 1.0, bonus: 0.2, guaranteed: 0.8, yearsLeft: 1, totalValue: 3.7, capHit: 1.0, deadCap: 0.2, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'SF'
  },
  {
    id: 'sf_2', name: 'Christian McCaffrey', position: Position.RB, age: 29, overall: 98, schemeOvr: 99, morale: 96, fatigue: 88, archetype: 'Receiving Back', personality: 'Leader', scheme: 'Zone', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 16, yards: 1450, touchdowns: 16 },
    contract: { years: 2, salary: 19, bonus: 12, guaranteed: 24, yearsLeft: 2, totalValue: 38, capHit: 19, deadCap: 12, voidYears: 0, startYear: 2024, totalLength: 2 },
    teamId: 'SF'
  },
  {
    id: 'sf_3', name: 'Deebo Samuel', position: Position.WR, age: 29, overall: 90, schemeOvr: 93, morale: 90, fatigue: 89, archetype: 'YAC Specialist', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 15, yards: 890, touchdowns: 7 },
    contract: { years: 3, salary: 23.8, bonus: 18, guaranteed: 58, yearsLeft: 1, totalValue: 71.5, capHit: 23.8, deadCap: 10, voidYears: 0, startYear: 2022, totalLength: 3 },
    teamId: 'SF'
  },
  {
    id: 'sf_4', name: 'George Kittle', position: Position.TE, age: 31, overall: 96, schemeOvr: 98, morale: 95, fatigue: 88, archetype: 'Vertical Threat', personality: 'Leader', scheme: 'Zone', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 16, yards: 1020, touchdowns: 8 },
    contract: { years: 5, salary: 15, bonus: 15, guaranteed: 40, yearsLeft: 1, totalValue: 75, capHit: 15, deadCap: 6, voidYears: 0, startYear: 2020, totalLength: 5 },
    teamId: 'SF'
  },
  {
    id: 'sf_5', name: 'Nick Bosa', position: Position.DL, age: 27, overall: 97, schemeOvr: 98, morale: 95, fatigue: 92, archetype: 'Speed Rusher', personality: 'Leader', scheme: 'Base 4-3', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 52, sacks: 13.5 },
    contract: { years: 5, salary: 34, bonus: 50, guaranteed: 122, yearsLeft: 4, totalValue: 170, capHit: 34, deadCap: 35, voidYears: 0, startYear: 2023, totalLength: 5 },
    teamId: 'SF'
  },
  {
    id: 'sf_6', name: 'Fred Warner', position: Position.LB, age: 28, overall: 98, schemeOvr: 99, morale: 97, fatigue: 94, archetype: 'Coverage Linebacker', personality: 'Leader', scheme: 'Base 4-3', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 148, interceptions: 3, sacks: 2.5 },
    contract: { years: 5, salary: 19, bonus: 20, guaranteed: 40, yearsLeft: 2, totalValue: 95, capHit: 19, deadCap: 12, voidYears: 0, startYear: 2021, totalLength: 5 },
    teamId: 'SF'
  },

  // ==================== PHILADELPHIA EAGLES (PHI) ====================
  {
    id: 'phi_1', name: 'Jalen Hurts', position: Position.QB, age: 27, overall: 93, schemeOvr: 95, morale: 94, fatigue: 93, archetype: 'Scrambler', personality: 'Leader', scheme: 'Spread', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 3850, touchdowns: 33, rating: 99.8 },
    contract: { years: 5, salary: 51, bonus: 60, guaranteed: 179, yearsLeft: 4, totalValue: 255, capHit: 51, deadCap: 45, voidYears: 0, startYear: 2023, totalLength: 5 },
    teamId: 'PHI'
  },
  {
    id: 'phi_2', name: 'Saquon Barkley', position: Position.RB, age: 28, overall: 93, schemeOvr: 95, morale: 95, fatigue: 91, archetype: 'Elusive Back', personality: 'Leader', scheme: 'Zone', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 16, yards: 1320, touchdowns: 12 },
    contract: { years: 3, salary: 12.6, bonus: 11, guaranteed: 26, yearsLeft: 2, totalValue: 37.8, capHit: 12.6, deadCap: 10, voidYears: 0, startYear: 2024, totalLength: 3 },
    teamId: 'PHI'
  },
  {
    id: 'phi_3', name: 'A.J. Brown', position: Position.WR, age: 28, overall: 95, schemeOvr: 97, morale: 94, fatigue: 92, archetype: 'Physical Receiver', personality: 'Leader', scheme: 'Spread', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1420, touchdowns: 11 },
    contract: { years: 3, salary: 32, bonus: 24, guaranteed: 84, yearsLeft: 3, totalValue: 96, capHit: 32, deadCap: 25, voidYears: 0, startYear: 2024, totalLength: 3 },
    teamId: 'PHI'
  },
  {
    id: 'phi_4', name: 'DeVonta Smith', position: Position.WR, age: 26, overall: 89, schemeOvr: 91, morale: 90, fatigue: 94, archetype: 'Route Technician', personality: 'Normal', scheme: 'Spread', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 1060, touchdowns: 7 },
    contract: { years: 3, salary: 25, bonus: 20, guaranteed: 51, yearsLeft: 3, totalValue: 75, capHit: 25, deadCap: 18, voidYears: 0, startYear: 2024, totalLength: 3 },
    teamId: 'PHI'
  },
  {
    id: 'phi_5', name: 'Jalen Carter', position: Position.DL, age: 24, overall: 91, schemeOvr: 93, morale: 92, fatigue: 95, archetype: 'Power Rusher', personality: 'Leader', scheme: 'Base 4-3', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 48, sacks: 8.5 },
    contract: { years: 4, salary: 5.4, bonus: 10, guaranteed: 21, yearsLeft: 2, totalValue: 21.8, capHit: 5.4, deadCap: 4, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'PHI'
  },

  // ==================== DALLAS COWBOYS (DAL) ====================
  {
    id: 'dal_1', name: 'Dak Prescott', position: Position.QB, age: 32, overall: 91, schemeOvr: 93, morale: 92, fatigue: 91, archetype: 'Field General', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 4510, touchdowns: 36, rating: 103.2 },
    contract: { years: 4, salary: 60, bonus: 80, guaranteed: 231, yearsLeft: 4, totalValue: 240, capHit: 60, deadCap: 80, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'DAL'
  },
  {
    id: 'dal_2', name: 'CeeDee Lamb', position: Position.WR, age: 26, overall: 96, schemeOvr: 98, morale: 96, fatigue: 93, archetype: 'Slot Specialist', personality: 'Leader', scheme: 'Spread', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1680, touchdowns: 12 },
    contract: { years: 4, salary: 34, bonus: 38, guaranteed: 100, yearsLeft: 4, totalValue: 136, capHit: 34, deadCap: 40, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'DAL'
  },
  {
    id: 'dal_3', name: 'Micah Parsons', position: Position.DL, age: 26, overall: 98, schemeOvr: 99, morale: 96, fatigue: 92, archetype: 'Speed Rusher', personality: 'Leader', scheme: 'Base 3-4', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 64, sacks: 14.0 },
    contract: { years: 4, salary: 4.2, bonus: 8, guaranteed: 17, yearsLeft: 1, totalValue: 17, capHit: 4.2, deadCap: 2, voidYears: 0, startYear: 2021, totalLength: 4 },
    teamId: 'DAL'
  },

  // ==================== HOUSTON TEXANS (HOU) ====================
  {
    id: 'hou_1', name: 'C.J. Stroud', position: Position.QB, age: 24, overall: 92, schemeOvr: 94, morale: 95, fatigue: 98, archetype: 'Field General', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 4200, touchdowns: 29, rating: 101.5 },
    contract: { years: 4, salary: 9.5, bonus: 24, guaranteed: 36, yearsLeft: 2, totalValue: 62, capHit: 12.5, deadCap: 18, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'HOU'
  },
  {
    id: 'hou_2', name: 'Joe Mixon', position: Position.RB, age: 29, overall: 85, schemeOvr: 86, morale: 88, fatigue: 88, archetype: 'Power Back', personality: 'Workhorse', scheme: 'Zone', developmentTrait: 'Star', potential: 'Star',
    stats: { gamesPlayed: 16, yards: 1020, touchdowns: 9 },
    contract: { years: 3, salary: 8.5, bonus: 6, guaranteed: 12, yearsLeft: 2, totalValue: 27, capHit: 9, deadCap: 4, voidYears: 0, startYear: 2024, totalLength: 3 },
    teamId: 'HOU'
  },
  {
    id: 'hou_3', name: 'Nico Collins', position: Position.WR, age: 26, overall: 90, schemeOvr: 92, morale: 93, fatigue: 92, archetype: 'Deep Threat', personality: 'Leader', scheme: 'Vertical', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 16, yards: 1280, touchdowns: 9 },
    contract: { years: 3, salary: 24, bonus: 18, guaranteed: 52, yearsLeft: 3, totalValue: 72, capHit: 24, deadCap: 18, voidYears: 0, startYear: 2024, totalLength: 3 },
    teamId: 'HOU'
  },
  {
    id: 'hou_4', name: 'Will Anderson Jr.', position: Position.DL, age: 24, overall: 94, schemeOvr: 96, morale: 96, fatigue: 94, archetype: 'Speed Rusher', personality: 'Leader', scheme: 'Base 4-3', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 58, sacks: 11.5 },
    contract: { years: 4, salary: 8.8, bonus: 22, guaranteed: 34, yearsLeft: 2, totalValue: 35.2, capHit: 8.8, deadCap: 12, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'HOU'
  },
  {
    id: 'hou_5', name: 'Derek Stingley Jr.', position: Position.CB, age: 24, overall: 91, schemeOvr: 93, morale: 90, fatigue: 93, archetype: 'Man-to-Man', personality: 'Normal', scheme: 'Press Man', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 16, tackles: 48, interceptions: 5 },
    contract: { years: 4, salary: 8.7, bonus: 20, guaranteed: 34, yearsLeft: 1, totalValue: 34.8, capHit: 8.7, deadCap: 5, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'HOU'
  },

  // ==================== DETROIT LIONS (DET) ====================
  {
    id: 'det_1', name: 'Jared Goff', position: Position.QB, age: 30, overall: 90, schemeOvr: 92, morale: 94, fatigue: 94, archetype: 'Field General', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 4500, touchdowns: 30, rating: 99.5 },
    contract: { years: 4, salary: 53, bonus: 40, guaranteed: 170, yearsLeft: 4, totalValue: 212, capHit: 53, deadCap: 40, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'DET'
  },
  {
    id: 'det_2', name: 'Amon-Ra St. Brown', position: Position.WR, age: 25, overall: 95, schemeOvr: 97, morale: 96, fatigue: 95, archetype: 'Slot Specialist', personality: 'Leader', scheme: 'Spread', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1510, touchdowns: 10 },
    contract: { years: 4, salary: 30, bonus: 34, guaranteed: 77, yearsLeft: 4, totalValue: 120, capHit: 30, deadCap: 30, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'DET'
  },
  {
    id: 'det_3', name: 'Jahmyr Gibbs', position: Position.RB, age: 23, overall: 89, schemeOvr: 92, morale: 93, fatigue: 96, archetype: 'Elusive Back', personality: 'Normal', scheme: 'Zone', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 16, yards: 1100, touchdowns: 11 },
    contract: { years: 4, salary: 4.4, bonus: 8, guaranteed: 17, yearsLeft: 2, totalValue: 17.8, capHit: 4.4, deadCap: 4, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'DET'
  },
  {
    id: 'det_4', name: 'Aidan Hutchinson', position: Position.DL, age: 25, overall: 94, schemeOvr: 96, morale: 95, fatigue: 93, archetype: 'Power Rusher', personality: 'Leader', scheme: 'Base 4-3', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 51, sacks: 12.0 },
    contract: { years: 4, salary: 8.9, bonus: 20, guaranteed: 35, yearsLeft: 1, totalValue: 35.7, capHit: 8.9, deadCap: 5, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'DET'
  },

  // ==================== GREEN BAY PACKERS (GB) ====================
  {
    id: 'gb_1', name: 'Jordan Love', position: Position.QB, age: 26, overall: 89, schemeOvr: 91, morale: 92, fatigue: 95, archetype: 'Gunslinger', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 4150, touchdowns: 32, rating: 96.8 },
    contract: { years: 4, salary: 55, bonus: 48, guaranteed: 160, yearsLeft: 4, totalValue: 220, capHit: 55, deadCap: 48, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'GB'
  },
  {
    id: 'gb_2', name: 'Josh Jacobs', position: Position.RB, age: 27, overall: 88, schemeOvr: 89, morale: 89, fatigue: 90, archetype: 'Power Back', personality: 'Workhorse', scheme: 'Zone', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 16, yards: 1150, touchdowns: 9 },
    contract: { years: 4, salary: 12, bonus: 12.5, guaranteed: 12.5, yearsLeft: 3, totalValue: 48, capHit: 12, deadCap: 8, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'GB'
  },
  {
    id: 'gb_3', name: 'Jaire Alexander', position: Position.CB, age: 28, overall: 91, schemeOvr: 93, morale: 88, fatigue: 89, archetype: 'Lockdown Corner', personality: 'Leader', scheme: 'Press Man', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 15, tackles: 42, interceptions: 3 },
    contract: { years: 4, salary: 21, bonus: 16, guaranteed: 30, yearsLeft: 1, totalValue: 84, capHit: 21, deadCap: 8, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'GB'
  },

  // ==================== MINNESOTA VIKINGS (MIN) ====================
  {
    id: 'min_1', name: 'Justin Jefferson', position: Position.WR, age: 26, overall: 99, schemeOvr: 99, morale: 97, fatigue: 93, archetype: 'Route Technician', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1650, touchdowns: 11 },
    contract: { years: 4, salary: 35, bonus: 38, guaranteed: 110, yearsLeft: 4, totalValue: 140, capHit: 35, deadCap: 45, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'MIN'
  },
  {
    id: 'min_2', name: 'Sam Darnold', position: Position.QB, age: 28, overall: 83, schemeOvr: 85, morale: 89, fatigue: 96, archetype: 'Field General', personality: 'Normal', scheme: 'West Coast', developmentTrait: 'Star', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 3950, touchdowns: 26, rating: 94.2 },
    contract: { years: 1, salary: 10, bonus: 2.5, guaranteed: 8.7, yearsLeft: 1, totalValue: 10, capHit: 10, deadCap: 2.5, voidYears: 0, startYear: 2025, totalLength: 1 },
    teamId: 'MIN'
  },

  // ==================== CHICAGO BEARS (CHI) ====================
  {
    id: 'chi_1', name: 'Caleb Williams', position: Position.QB, age: 23, overall: 83, schemeOvr: 86, morale: 91, fatigue: 98, archetype: 'Improviser', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 3650, touchdowns: 22, rating: 90.5 },
    contract: { years: 4, salary: 9.8, bonus: 24, guaranteed: 39, yearsLeft: 3, totalValue: 39.4, capHit: 9.8, deadCap: 18, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'CHI'
  },
  {
    id: 'chi_2', name: 'DJ Moore', position: Position.WR, age: 28, overall: 89, schemeOvr: 91, morale: 92, fatigue: 93, archetype: 'YAC Specialist', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 1210, touchdowns: 8 },
    contract: { years: 4, salary: 27.5, bonus: 20, guaranteed: 68, yearsLeft: 4, totalValue: 110, capHit: 27.5, deadCap: 20, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'CHI'
  },
  {
    id: 'chi_3', name: 'Montez Sweat', position: Position.DL, age: 28, overall: 88, schemeOvr: 89, morale: 89, fatigue: 91, archetype: 'Power Rusher', personality: 'Leader', scheme: 'Base 4-3', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 17, tackles: 46, sacks: 10.0 },
    contract: { years: 4, salary: 24.5, bonus: 20, guaranteed: 72, yearsLeft: 3, totalValue: 98, capHit: 24.5, deadCap: 18, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'CHI'
  },

  // ==================== WASHINGTON COMMANDERS (WAS) ====================
  {
    id: 'was_1', name: 'Jayden Daniels', position: Position.QB, age: 24, overall: 86, schemeOvr: 89, morale: 95, fatigue: 97, archetype: 'Scrambler', personality: 'Leader', scheme: 'Spread', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 3800, touchdowns: 27, rating: 97.4 },
    contract: { years: 4, salary: 9.4, bonus: 23, guaranteed: 37, yearsLeft: 3, totalValue: 37.7, capHit: 9.4, deadCap: 17, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'WAS'
  },
  {
    id: 'was_2', name: 'Terry McLaurin', position: Position.WR, age: 29, overall: 90, schemeOvr: 92, morale: 93, fatigue: 91, archetype: 'Deep Threat', personality: 'Leader', scheme: 'Spread', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 1190, touchdowns: 8 },
    contract: { years: 3, salary: 23.3, bonus: 18, guaranteed: 53, yearsLeft: 1, totalValue: 70, capHit: 23.3, deadCap: 10, voidYears: 0, startYear: 2022, totalLength: 3 },
    teamId: 'WAS'
  },

  // ==================== ATLANTA FALCONS (ATL) ====================
  {
    id: 'atl_1', name: 'Kirk Cousins', position: Position.QB, age: 37, overall: 84, schemeOvr: 86, morale: 87, fatigue: 88, archetype: 'Field General', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Star', potential: 'Star',
    stats: { gamesPlayed: 17, yards: 4050, touchdowns: 25, rating: 95.1 },
    contract: { years: 4, salary: 45, bonus: 50, guaranteed: 100, yearsLeft: 3, totalValue: 180, capHit: 45, deadCap: 35, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'ATL'
  },
  {
    id: 'atl_2', name: 'Bijan Robinson', position: Position.RB, age: 23, overall: 90, schemeOvr: 93, morale: 94, fatigue: 96, archetype: 'Elusive Back', personality: 'Leader', scheme: 'Zone', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1250, touchdowns: 10 },
    contract: { years: 4, salary: 5.4, bonus: 12, guaranteed: 21, yearsLeft: 2, totalValue: 21.9, capHit: 5.4, deadCap: 5, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'ATL'
  },

  // ==================== TAMPA BAY BUCCANEERS (TB) ====================
  {
    id: 'tb_1', name: 'Baker Mayfield', position: Position.QB, age: 30, overall: 86, schemeOvr: 88, morale: 92, fatigue: 93, archetype: 'Gunslinger', personality: 'Leader', scheme: 'Spread', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 4100, touchdowns: 28, rating: 96.5 },
    contract: { years: 3, salary: 33.3, bonus: 20, guaranteed: 50, yearsLeft: 2, totalValue: 100, capHit: 33.3, deadCap: 20, voidYears: 0, startYear: 2024, totalLength: 3 },
    teamId: 'TB'
  },
  {
    id: 'tb_2', name: 'Mike Evans', position: Position.WR, age: 32, overall: 92, schemeOvr: 94, morale: 95, fatigue: 88, archetype: 'Physical Receiver', personality: 'Leader', scheme: 'Vertical', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1220, touchdowns: 11 },
    contract: { years: 2, salary: 26, bonus: 20, guaranteed: 35, yearsLeft: 1, totalValue: 52, capHit: 26, deadCap: 15, voidYears: 0, startYear: 2024, totalLength: 2 },
    teamId: 'TB'
  },

  // ==================== NEW ORLEANS SAINTS (NO) ====================
  {
    id: 'no_1', name: 'Derek Carr', position: Position.QB, age: 34, overall: 81, schemeOvr: 82, morale: 83, fatigue: 89, archetype: 'Field General', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Star', potential: 'Star',
    stats: { gamesPlayed: 17, yards: 3750, touchdowns: 23, rating: 91.8 },
    contract: { years: 4, salary: 37.5, bonus: 30, guaranteed: 100, yearsLeft: 1, totalValue: 150, capHit: 37.5, deadCap: 20, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'NO'
  },
  {
    id: 'no_2', name: 'Alvin Kamara', position: Position.RB, age: 30, overall: 87, schemeOvr: 89, morale: 88, fatigue: 87, archetype: 'Receiving Back', personality: 'Leader', scheme: 'Zone', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 16, yards: 950, touchdowns: 8 },
    contract: { years: 2, salary: 12.2, bonus: 10, guaranteed: 22, yearsLeft: 1, totalValue: 24.5, capHit: 12.2, deadCap: 8, voidYears: 0, startYear: 2024, totalLength: 2 },
    teamId: 'NO'
  },

  // ==================== CAROLINA PANTHERS (CAR) ====================
  {
    id: 'car_1', name: 'Bryce Young', position: Position.QB, age: 24, overall: 78, schemeOvr: 80, morale: 82, fatigue: 97, archetype: 'Field General', personality: 'Normal', scheme: 'West Coast', developmentTrait: 'Star', potential: 'Superstar',
    stats: { gamesPlayed: 16, yards: 3100, touchdowns: 18, rating: 86.4 },
    contract: { years: 4, salary: 9.5, bonus: 24, guaranteed: 38, yearsLeft: 2, totalValue: 38, capHit: 9.5, deadCap: 15, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'CAR'
  },

  // ==================== LOS ANGELES RAMS (LAR) ====================
  {
    id: 'lar_1', name: 'Matthew Stafford', position: Position.QB, age: 37, overall: 89, schemeOvr: 91, morale: 92, fatigue: 87, archetype: 'Gunslinger', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 4180, touchdowns: 29, rating: 97.8 },
    contract: { years: 4, salary: 40, bonus: 35, guaranteed: 120, yearsLeft: 2, totalValue: 160, capHit: 40, deadCap: 25, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'LAR'
  },
  {
    id: 'lar_2', name: 'Puka Nacua', position: Position.WR, age: 24, overall: 93, schemeOvr: 95, morale: 96, fatigue: 95, archetype: 'YAC Specialist', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1480, touchdowns: 9 },
    contract: { years: 4, salary: 1.0, bonus: 0.5, guaranteed: 1, yearsLeft: 2, totalValue: 4.0, capHit: 1.0, deadCap: 0.2, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'LAR'
  },
  {
    id: 'lar_3', name: 'Kyren Williams', position: Position.RB, age: 25, overall: 88, schemeOvr: 90, morale: 92, fatigue: 93, archetype: 'Power Back', personality: 'Workhorse', scheme: 'Zone', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 16, yards: 1140, touchdowns: 12 },
    contract: { years: 4, salary: 1.0, bonus: 0.4, guaranteed: 0.8, yearsLeft: 1, totalValue: 3.9, capHit: 1.0, deadCap: 0.2, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'LAR'
  },

  // ==================== SEATTLE SEAHAWKS (SEA) ====================
  {
    id: 'sea_1', name: 'Geno Smith', position: Position.QB, age: 34, overall: 83, schemeOvr: 85, morale: 87, fatigue: 90, archetype: 'Field General', personality: 'Leader', scheme: 'Spread', developmentTrait: 'Star', potential: 'Star',
    stats: { gamesPlayed: 17, yards: 3900, touchdowns: 24, rating: 93.5 },
    contract: { years: 3, salary: 25, bonus: 20, guaranteed: 40, yearsLeft: 1, totalValue: 75, capHit: 25, deadCap: 10, voidYears: 0, startYear: 2023, totalLength: 3 },
    teamId: 'SEA'
  },
  {
    id: 'sea_2', name: 'DK Metcalf', position: Position.WR, age: 27, overall: 90, schemeOvr: 92, morale: 91, fatigue: 92, archetype: 'Deep Threat', personality: 'Leader', scheme: 'Vertical', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1180, touchdowns: 9 },
    contract: { years: 3, salary: 24, bonus: 18, guaranteed: 58, yearsLeft: 1, totalValue: 72, capHit: 24, deadCap: 8, voidYears: 0, startYear: 2022, totalLength: 3 },
    teamId: 'SEA'
  },

  // ==================== ARIZONA CARDINALS (ARI) ====================
  {
    id: 'ari_1', name: 'Kyler Murray', position: Position.QB, age: 28, overall: 87, schemeOvr: 90, morale: 89, fatigue: 93, archetype: 'Scrambler', personality: 'Leader', scheme: 'Spread', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 3820, touchdowns: 26, rating: 94.8 },
    contract: { years: 5, salary: 46.1, bonus: 50, guaranteed: 160, yearsLeft: 3, totalValue: 230.5, capHit: 46.1, deadCap: 35, voidYears: 0, startYear: 2022, totalLength: 5 },
    teamId: 'ARI'
  },
  {
    id: 'ari_2', name: 'Marvin Harrison Jr.', position: Position.WR, age: 23, overall: 87, schemeOvr: 90, morale: 94, fatigue: 97, archetype: 'Route Technician', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1050, touchdowns: 8 },
    contract: { years: 4, salary: 8.8, bonus: 21, guaranteed: 35, yearsLeft: 3, totalValue: 35.3, capHit: 8.8, deadCap: 16, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'ARI'
  },
  {
    id: 'ari_3', name: 'Trey McBride', position: Position.TE, age: 25, overall: 88, schemeOvr: 90, morale: 92, fatigue: 95, archetype: 'Possession', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 890, touchdowns: 6 },
    contract: { years: 4, salary: 1.5, bonus: 1.8, guaranteed: 3.5, yearsLeft: 1, totalValue: 6.2, capHit: 1.5, deadCap: 0.5, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'ARI'
  },

  // ==================== CINCINNATI BENGALS (CIN) ====================
  {
    id: 'cin_1', name: 'Joe Burrow', position: Position.QB, age: 28, overall: 96, schemeOvr: 98, morale: 96, fatigue: 94, archetype: 'Field General', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 4480, touchdowns: 35, rating: 104.8 },
    contract: { years: 5, salary: 55, bonus: 70, guaranteed: 219, yearsLeft: 4, totalValue: 275, capHit: 55, deadCap: 50, voidYears: 0, startYear: 2023, totalLength: 5 },
    teamId: 'CIN'
  },
  {
    id: 'cin_2', name: "Ja'Marr Chase", position: Position.WR, age: 25, overall: 97, schemeOvr: 99, morale: 97, fatigue: 94, archetype: 'Deep Threat', personality: 'Leader', scheme: 'Spread', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 1540, touchdowns: 13 },
    contract: { years: 4, salary: 7.7, bonus: 18, guaranteed: 30, yearsLeft: 1, totalValue: 30.8, capHit: 7.7, deadCap: 4, voidYears: 0, startYear: 2021, totalLength: 4 },
    teamId: 'CIN'
  },

  // ==================== CLEVELAND BROWNS (CLE) ====================
  {
    id: 'cle_1', name: 'Myles Garrett', position: Position.DL, age: 29, overall: 98, schemeOvr: 99, morale: 96, fatigue: 92, archetype: 'Power Rusher', personality: 'Leader', scheme: 'Base 4-3', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 58, sacks: 15.0 },
    contract: { years: 5, salary: 25, bonus: 21, guaranteed: 100, yearsLeft: 2, totalValue: 125, capHit: 25, deadCap: 20, voidYears: 0, startYear: 2020, totalLength: 5 },
    teamId: 'CLE'
  },
  {
    id: 'cle_2', name: 'Nick Chubb', position: Position.RB, age: 29, overall: 91, schemeOvr: 92, morale: 90, fatigue: 87, archetype: 'Power Back', personality: 'Workhorse', scheme: 'Power', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 14, yards: 1080, touchdowns: 9 },
    contract: { years: 3, salary: 12, bonus: 10, guaranteed: 20, yearsLeft: 1, totalValue: 36, capHit: 12, deadCap: 5, voidYears: 0, startYear: 2021, totalLength: 3 },
    teamId: 'CLE'
  },

  // ==================== PITTSBURGH STEELERS (PIT) ====================
  {
    id: 'pit_1', name: 'T.J. Watt', position: Position.LB, age: 30, overall: 97, schemeOvr: 98, morale: 96, fatigue: 91, archetype: 'Speed Rusher', personality: 'Leader', scheme: 'Base 3-4', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 62, sacks: 16.5 },
    contract: { years: 4, salary: 28, bonus: 35, guaranteed: 80, yearsLeft: 1, totalValue: 112, capHit: 28, deadCap: 15, voidYears: 0, startYear: 2021, totalLength: 4 },
    teamId: 'PIT'
  },
  {
    id: 'pit_2', name: 'Minkah Fitzpatrick', position: Position.S, age: 28, overall: 93, schemeOvr: 95, morale: 94, fatigue: 93, archetype: 'Zone Safety', personality: 'Leader', scheme: 'Cover 3', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 88, interceptions: 4 },
    contract: { years: 4, salary: 18.4, bonus: 17.5, guaranteed: 36, yearsLeft: 2, totalValue: 73.6, capHit: 18.4, deadCap: 10, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'PIT'
  },

  // ==================== INDIANAPOLIS COLTS (IND) ====================
  {
    id: 'ind_1', name: 'Anthony Richardson', position: Position.QB, age: 23, overall: 81, schemeOvr: 84, morale: 90, fatigue: 97, archetype: 'Scrambler', personality: 'Leader', scheme: 'Spread', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 15, yards: 2950, touchdowns: 20, rating: 89.2 },
    contract: { years: 4, salary: 8.5, bonus: 21, guaranteed: 34, yearsLeft: 2, totalValue: 34, capHit: 8.5, deadCap: 12, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'IND'
  },
  {
    id: 'ind_2', name: 'Jonathan Taylor', position: Position.RB, age: 26, overall: 92, schemeOvr: 94, morale: 92, fatigue: 91, archetype: 'Power Back', personality: 'Workhorse', scheme: 'Zone', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 16, yards: 1280, touchdowns: 12 },
    contract: { years: 3, salary: 14, bonus: 10, guaranteed: 26.5, yearsLeft: 2, totalValue: 42, capHit: 14, deadCap: 10, voidYears: 0, startYear: 2023, totalLength: 3 },
    teamId: 'IND'
  },

  // ==================== JACKSONVILLE JAGUARS (JAX) ====================
  {
    id: 'jax_1', name: 'Trevor Lawrence', position: Position.QB, age: 25, overall: 88, schemeOvr: 90, morale: 91, fatigue: 95, archetype: 'Field General', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 4050, touchdowns: 26, rating: 95.4 },
    contract: { years: 5, salary: 55, bonus: 40, guaranteed: 142, yearsLeft: 5, totalValue: 275, capHit: 55, deadCap: 50, voidYears: 0, startYear: 2024, totalLength: 5 },
    teamId: 'JAX'
  },

  // ==================== TENNESSEE TITANS (TEN) ====================
  {
    id: 'ten_1', name: 'Will Levis', position: Position.QB, age: 26, overall: 77, schemeOvr: 79, morale: 83, fatigue: 97, archetype: 'Gunslinger', personality: 'Normal', scheme: 'Vertical', developmentTrait: 'Star', potential: 'Superstar',
    stats: { gamesPlayed: 16, yards: 3100, touchdowns: 17, rating: 84.5 },
    contract: { years: 4, salary: 2.4, bonus: 4, guaranteed: 9.5, yearsLeft: 2, totalValue: 9.5, capHit: 2.4, deadCap: 2, voidYears: 0, startYear: 2023, totalLength: 4 },
    teamId: 'TEN'
  },

  // ==================== DENVER BRONCOS (DEN) ====================
  {
    id: 'den_1', name: 'Bo Nix', position: Position.QB, age: 25, overall: 81, schemeOvr: 83, morale: 90, fatigue: 98, archetype: 'Field General', personality: 'Leader', scheme: 'West Coast', developmentTrait: 'Star', potential: 'Superstar',
    stats: { gamesPlayed: 17, yards: 3450, touchdowns: 22, rating: 91.0 },
    contract: { years: 4, salary: 4.6, bonus: 10, guaranteed: 18.6, yearsLeft: 3, totalValue: 18.6, capHit: 4.6, deadCap: 8, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'DEN'
  },
  {
    id: 'den_2', name: 'Pat Surtain II', position: Position.CB, age: 25, overall: 96, schemeOvr: 98, morale: 96, fatigue: 95, archetype: 'Lockdown Corner', personality: 'Leader', scheme: 'Press Man', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 54, interceptions: 4 },
    contract: { years: 4, salary: 24, bonus: 25, guaranteed: 77.5, yearsLeft: 4, totalValue: 96, capHit: 24, deadCap: 25, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'DEN'
  },

  // ==================== LAS VEGAS RAIDERS (LV) ====================
  {
    id: 'lv_1', name: 'Maxx Crosby', position: Position.DL, age: 27, overall: 97, schemeOvr: 98, morale: 96, fatigue: 93, archetype: 'Power Rusher', personality: 'Leader', scheme: 'Base 4-3', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 88, sacks: 14.5 },
    contract: { years: 4, salary: 23.5, bonus: 20, guaranteed: 53, yearsLeft: 2, totalValue: 94, capHit: 23.5, deadCap: 15, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'LV'
  },
  {
    id: 'lv_2', name: 'Brock Bowers', position: Position.TE, age: 22, overall: 88, schemeOvr: 91, morale: 94, fatigue: 98, archetype: 'Vertical Threat', personality: 'Leader', scheme: 'Spread', developmentTrait: 'Superstar', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 950, touchdowns: 8 },
    contract: { years: 4, salary: 4.5, bonus: 10, guaranteed: 18.1, yearsLeft: 3, totalValue: 18.1, capHit: 4.5, deadCap: 8, voidYears: 0, startYear: 2024, totalLength: 4 },
    teamId: 'LV'
  },

  // ==================== LOS ANGELES CHARGERS (LAC) ====================
  {
    id: 'lac_1', name: 'Justin Herbert', position: Position.QB, age: 27, overall: 92, schemeOvr: 94, morale: 93, fatigue: 94, archetype: 'Gunslinger', personality: 'Leader', scheme: 'Vertical', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, yards: 4250, touchdowns: 30, rating: 100.2 },
    contract: { years: 5, salary: 52.5, bonus: 50, guaranteed: 133, yearsLeft: 4, totalValue: 262.5, capHit: 52.5, deadCap: 40, voidYears: 0, startYear: 2023, totalLength: 5 },
    teamId: 'LAC'
  },
  {
    id: 'lac_2', name: 'Derwin James Jr.', position: Position.S, age: 29, overall: 91, schemeOvr: 93, morale: 91, fatigue: 90, archetype: 'Hybrid Safety', personality: 'Leader', scheme: 'Cover 3', developmentTrait: 'X-Factor', potential: 'X-Factor',
    stats: { gamesPlayed: 17, tackles: 105, sacks: 2.0, interceptions: 2 },
    contract: { years: 4, salary: 19, bonus: 18, guaranteed: 42, yearsLeft: 2, totalValue: 76, capHit: 19, deadCap: 12, voidYears: 0, startYear: 2022, totalLength: 4 },
    teamId: 'LAC'
  }
];

// Generates baseline depth chart players for any position missing on a team so every team has a full 22-man starter depth chart
export function ensureFullTeamRosters(existingPlayers: Player[]): Player[] {
  const allTeams = ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS'];
  const requiredPositions = [Position.QB, Position.RB, Position.WR, Position.TE, Position.OL, Position.DL, Position.LB, Position.CB, Position.S, Position.K];

  const resultMap = new Map<string, Player>();
  existingPlayers.forEach(p => resultMap.set(p.id, p));

  allTeams.forEach(teamId => {
    requiredPositions.forEach(pos => {
      const existingForPos = existingPlayers.filter(p => p.teamId === teamId && p.position === pos);
      // Ensure at least 1-2 players per position for every team
      const neededCount = (pos === Position.WR || pos === Position.OL || pos === Position.DL || pos === Position.CB) ? 2 : 1;
      
      for (let i = existingForPos.length; i < neededCount; i++) {
        const id = `gen_${teamId}_${pos}_${i + 1}`;
        const newPlayer: Player = {
          id,
          name: `${pos} Starter ${i + 1}`,
          position: pos,
          age: 24 + Math.floor(Math.random() * 5),
          overall: 73 + Math.floor(Math.random() * 12),
          schemeOvr: 75,
          morale: 82,
          fatigue: 98,
          archetype: 'Standard',
          personality: 'Normal',
          scheme: 'Balanced',
          developmentTrait: 'Normal',
          potential: 'Star',
          stats: { gamesPlayed: 10 },
          contract: { years: 2, salary: 2.5, bonus: 1, guaranteed: 3, yearsLeft: 1, totalValue: 5, capHit: 2.5, deadCap: 1, voidYears: 0, startYear: 2025, totalLength: 2 },
          teamId
        };
        resultMap.set(id, newPlayer);
      }
    });
  });

  return Array.from(resultMap.values());
}
