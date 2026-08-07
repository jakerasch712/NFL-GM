import { Contract, ContractDemand, Player, Position } from '../../types';
import { normalizePosition } from '../../services/nflverseService';

// Raw shape of a roster_<year>.csv row (only the columns we read).
export interface RosterCsvRow {
  team: string;
  position: string;
  depth_chart_position: string;
  status: string;
  full_name: string;
  birth_date: string;
  gsis_id: string;
  pfr_id: string;
  years_exp: string;
  draft_number: string;
}

export const LEAGUE_YEAR = 2026;
export const SALARY_CAP = 255.4;

// deterministic non-negative string hash (djb2)
export const hashCode = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

export const deriveAge = (birthDate: string): number => {
  if (!birthDate) return 24;
  const born = new Date(birthDate);
  if (isNaN(born.getTime())) return 24;
  const seasonStart = new Date(`${LEAGUE_YEAR}-09-01`);
  const age = Math.floor((seasonStart.getTime() - born.getTime()) / (365.25 * 24 * 3600 * 1000));
  return clamp(age, 20, 45);
};

const STATUS_ADJ: Record<string, number> = { ACT: 0, RES: -6, PUP: -6, NON: -6, SUS: -6, DEV: -8, E14: -5 };

export const deriveOverall = (row: RosterCsvRow, id: string): number => {
  const exp = clamp(parseInt(row.years_exp) || 0, 0, 15);
  const draftNumber = parseInt(row.draft_number) || 0;
  const draftScore = draftNumber > 0 ? 28 * Math.exp(-draftNumber / 75) : 0;
  const expScore = 12 * (1 - Math.abs(6 - Math.min(exp, 12)) / 6) + Math.min(exp, 4) * 0.5;
  const statusAdj = STATUS_ADJ[row.status] ?? -4;
  const jitter = (hashCode(id) % 7) - 3;
  return clamp(Math.round(58 + draftScore + expScore + statusAdj + jitter), 55, 99);
};

// Position APY ceiling ($M/yr at 99 OVR)
const POS_MAX: Record<Position, number> = {
  [Position.QB]: 60, [Position.WR]: 36, [Position.DL]: 34, [Position.CB]: 30,
  [Position.OL]: 28, [Position.LB]: 22, [Position.S]: 21, [Position.RB]: 19,
  [Position.TE]: 18, [Position.K]: 6,
};

const DEMAND_INTERESTS: ContractDemand['interest'][] = ['Security', 'Money', 'Championship', 'Loyalty'];

export const deriveContract = (
  id: string, position: Position, overall: number, age: number, exp: number, draftNumber: number
): { contract: Contract; contractDemand: ContractDemand } => {
  const t = clamp((overall - 55) / 44, 0, 1);
  const isRookieDeal = draftNumber > 0 && exp <= 3;

  let salary: number;
  let years: number;
  let yearsLeft: number;
  if (isRookieDeal) {
    salary = round1(clamp(11.5 * Math.pow(1 - draftNumber / 262, 2) + 0.9, 0.9, 11.5));
    years = 4;
    yearsLeft = 4 - exp;
  } else {
    salary = round1(Math.max(1.1, POS_MAX[position] * Math.pow(t, 2.6)));
    years = overall >= 85 ? 4 : overall >= 75 ? 3 : overall >= 68 ? 2 : 1;
    if (age >= 30) years = Math.min(years, 2);
    yearsLeft = 1 + (hashCode(id) % years);
  }

  const bonus = round1(salary * years * (0.3 + 0.25 * t));
  const totalLength = years;
  const capHit = round1(salary + bonus / totalLength);
  const contract: Contract = {
    years,
    salary,
    bonus,
    guaranteed: round1(bonus + salary * Math.min(yearsLeft, 2)),
    yearsLeft,
    totalValue: round1(salary * years + bonus),
    capHit,
    deadCap: round1((bonus / totalLength) * yearsLeft),
    voidYears: 0,
    startYear: LEAGUE_YEAR - (years - yearsLeft),
    totalLength,
  };
  const contractDemand: ContractDemand = {
    years: Math.min(years, 3),
    salary: round1(salary * 1.08),
    bonus: round1(bonus * 0.5),
    interest: DEMAND_INTERESTS[hashCode(id) % 4],
    marketValue: round1(salary * 1.1),
  };
  return { contract, contractDemand };
};

export const buildPlayer = (row: RosterCsvRow, teamId: string): Player => {
  const id = row.gsis_id || row.pfr_id ||
    `${row.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${teamId}`;
  const position = normalizePosition(row.depth_chart_position || row.position);
  const overall = deriveOverall(row, id);
  const age = deriveAge(row.birth_date);
  const exp = clamp(parseInt(row.years_exp) || 0, 0, 15);
  const { contract, contractDemand } = deriveContract(
    id, position, overall, age, exp, parseInt(row.draft_number) || 0
  );
  const developmentTrait: Player['developmentTrait'] =
    overall >= 92 ? 'X-Factor' : overall >= 86 ? 'Superstar' : overall >= 80 ? 'Star' : 'Normal';
  const potential: Player['potential'] =
    age <= 25 && overall >= 84 ? 'X-Factor'
    : age <= 27 && overall >= 80 ? 'Superstar'
    : overall >= 78 ? 'Star' : 'Normal';

  return {
    id,
    name: row.full_name,
    position,
    age,
    overall,
    schemeOvr: overall,
    morale: 80,
    fatigue: 100,
    archetype: 'Standard',
    personality: 'Normal',
    scheme: 'Balanced',
    developmentTrait,
    potential,
    stats: { gamesPlayed: 0 },
    contract,
    contractDemand,
    teamId,
  };
};

// Assign depth = 1-based rank within (team, position) by overall desc; mutates in place.
export const assignDepth = (players: Player[]): void => {
  const groups = new Map<string, Player[]>();
  for (const p of players) {
    const key = `${p.teamId}|${p.position}`;
    const g = groups.get(key) ?? [];
    g.push(p);
    groups.set(key, g);
  }
  for (const g of groups.values()) {
    g.sort((a, b) => b.overall - a.overall || a.id.localeCompare(b.id));
    g.forEach((p, i) => { p.depth = i + 1; });
  }
};

// Top-51 cap total for a roster (same rule as financeService.getTeamCapSpace).
export const top51Total = (roster: Player[]): number =>
  [...roster]
    .sort((a, b) => b.contract.capHit - a.contract.capHit)
    .slice(0, 51)
    .reduce((sum, p) => sum + p.contract.capHit, 0);

// Scale a team's salaries/bonuses down so its Top-51 total fits under targetTotal.
export const normalizeTeamCap = (roster: Player[], targetTotal: number): void => {
  const total = top51Total(roster);
  if (total <= targetTotal) return;
  const scale = targetTotal / total;
  const round1 = (n: number) => Math.round(n * 10) / 10;
  for (const p of roster) {
    const c = p.contract;
    const salary = round1(Math.max(0.8, c.salary * scale));
    const bonus = round1(c.bonus * scale);
    p.contract = {
      ...c,
      salary,
      bonus,
      guaranteed: round1(bonus + salary * Math.min(c.yearsLeft, 2)),
      totalValue: round1(salary * c.years + bonus),
      capHit: round1(salary + bonus / c.totalLength),
      deadCap: round1((bonus / c.totalLength) * c.yearsLeft),
    };
    if (p.contractDemand) {
      p.contractDemand = {
        ...p.contractDemand,
        salary: round1(salary * 1.08),
        bonus: round1(bonus * 0.5),
        marketValue: round1(salary * 1.1),
      };
    }
  }
};
