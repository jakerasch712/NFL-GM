import { DraftPick, DraftProspect, Position, Region } from '../types';

// Deterministic generation: a draft class is generated once per season and then
// lives in franchise state, so the same year always yields the same class
// rather than reshuffling on every render or reload.
const hash = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
/**
 * Independent draw per field. Bit-shifting a single seed leaves the fields
 * correlated (same surname + school + position clustering at the top of the
 * board), so each attribute gets its own hash input.
 */
const draw = (id: string, field: string): number => hash(`${id}::${field}`);
const pick = <T,>(arr: T[], seed: number): T => arr[seed % arr.length];
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const FIRST_NAMES = [
  'Jalen', 'Marcus', 'Tyreek', 'Devon', 'Cade', 'Isaiah', 'Malik', 'Brock', 'Xavier', 'Trey',
  'Deion', 'Kadarius', 'Bryce', 'Amari', 'Jaxon', 'Caleb', 'Rome', 'Drake', 'Quinn', 'Kayvon',
  'Elijah', 'Nolan', 'Terrion', 'Judah', 'Braelon', 'Emeka', 'Zion', 'Kobe', 'Dallas', 'Silas',
  'Rashod', 'Tanner', 'Micah', 'Corey', 'Jermaine', 'Antoine', 'Landon', 'Gage', 'Roman', 'Titus',
];
const LAST_NAMES = [
  'Whitmore', 'Okonkwo', 'Vasquez', 'Bellinger', 'Achebe', 'Kowalczyk', 'Ferrell', 'Santiago',
  'Draper', 'Nkemdiche', 'Callaway', 'Marchetti', 'Boateng', 'Sorensen', 'Rivas', 'Alistair',
  'Hollins', 'Beaumont', 'Nakashima', 'Quintero', 'Ashworth', 'Delacroix', 'Mbeki', 'Vandergriff',
  'Sinclair', 'Rutkowski', 'Amadi', 'Prescott', 'Lindqvist', 'Cardoza', 'Fenwick', 'Osei',
  'Trombley', 'Bhatia', 'Castellanos', 'Yearwood', 'Novak', 'Duplantis', 'Iheanacho', 'Stapleton',
];

const SCHOOLS: { name: string; region: Region }[] = [
  { name: 'Alabama', region: Region.SOUTH }, { name: 'Georgia', region: Region.SOUTH },
  { name: 'LSU', region: Region.SOUTH }, { name: 'Florida', region: Region.SOUTH },
  { name: 'Texas', region: Region.SOUTH }, { name: 'Texas A&M', region: Region.SOUTH },
  { name: 'Clemson', region: Region.SOUTH }, { name: 'Tennessee', region: Region.SOUTH },
  { name: 'Ohio State', region: Region.MIDWEST }, { name: 'Michigan', region: Region.MIDWEST },
  { name: 'Notre Dame', region: Region.MIDWEST }, { name: 'Wisconsin', region: Region.MIDWEST },
  { name: 'Iowa', region: Region.MIDWEST }, { name: 'Nebraska', region: Region.MIDWEST },
  { name: 'Michigan State', region: Region.MIDWEST }, { name: 'Missouri', region: Region.MIDWEST },
  { name: 'USC', region: Region.WEST }, { name: 'Oregon', region: Region.WEST },
  { name: 'Washington', region: Region.WEST }, { name: 'Stanford', region: Region.WEST },
  { name: 'Utah', region: Region.WEST }, { name: 'Arizona State', region: Region.WEST },
  { name: 'Penn State', region: Region.NORTHEAST }, { name: 'Pittsburgh', region: Region.NORTHEAST },
  { name: 'Syracuse', region: Region.NORTHEAST }, { name: 'Boston College', region: Region.NORTHEAST },
  { name: 'Rutgers', region: Region.NORTHEAST }, { name: 'UConn', region: Region.NORTHEAST },
  { name: 'Simon Fraser', region: Region.INTERNATIONAL }, { name: 'TU Munich', region: Region.INTERNATIONAL },
];

// Rough share of a draft class by position bucket
const POSITION_WEIGHTS: [Position, number][] = [
  [Position.OL, 16], [Position.DL, 15], [Position.WR, 14], [Position.CB, 12],
  [Position.LB, 11], [Position.RB, 9], [Position.S, 8], [Position.TE, 7],
  [Position.QB, 6], [Position.K, 2],
];
const POSITION_POOL: Position[] = POSITION_WEIGHTS.flatMap(([p, w]) => Array(w).fill(p));

const TRAITS: Record<string, string[]> = {
  QB: ['Elite Arm', 'Quick Release', 'Pocket Presence', 'Mobile', 'High Football IQ'],
  RB: ['Contact Balance', 'Home Run Speed', 'Pass Protection', 'Elusive', 'Workhorse Frame'],
  WR: ['Deep Threat', 'Route Technician', 'Strong Hands', 'Yards After Catch', 'Contested Catch'],
  TE: ['Seam Stretcher', 'Inline Blocker', 'Soft Hands', 'Red Zone Target'],
  OL: ['Anchor Strength', 'Quick Feet', 'Mauler', 'Zone Fit', 'Pass Set Technique'],
  DL: ['First Step', 'Bull Rush', 'Run Wall', 'Hand Technique', 'Motor'],
  LB: ['Sideline Range', 'Downhill Trigger', 'Coverage Instincts', 'Blitz Timing'],
  CB: ['Press Technique', 'Ball Hawk', 'Recovery Speed', 'Mirror Skills'],
  S: ['Center Field Range', 'Box Enforcer', 'Communicator', 'Ball Skills'],
  K: ['Big Leg', 'Ice Veins', 'Consistent Plant'],
};
const HIDDEN_TRAITS = [
  'Film Junkie', 'Locker Room Leader', 'Injury Concern', 'Character Question',
  'Late Bloomer', 'Scheme Dependent', 'High Motor', 'Coachable', 'Raw Technique',
];

/** Deterministic per-prospect grading error, shrinking as scouting progresses. */
export const gradeNoise = (prospectId: string): number => (hash(`${prospectId}-noise`) % 21) - 10;

/**
 * The visible scouting grade. At 0% progress it is the true rating plus the
 * prospect's full noise; it converges on the true rating as scouts work.
 */
export const gradeForProgress = (prospect: DraftProspect): number => {
  const trueOverall = prospect.overall ?? prospect.scoutingGrade;
  const remaining = 1 - clamp(prospect.scoutingProgress, 0, 100) / 100;
  return clamp(Math.round(trueOverall + gradeNoise(prospect.id) * remaining), 40, 99);
};

export const generateDraftClass = (year: number, size = 260): DraftProspect[] => {
  const prospects: DraftProspect[] = [];
  const usedNames = new Set<string>();

  // Two 40-name pools collide often at this class size; walk the surname pool
  // until the full name is unique so the board has no ambiguous duplicates.
  const uniqueName = (id: string): string => {
    const first = pick(FIRST_NAMES, draw(id, 'first'));
    const base = draw(id, 'last');
    for (let attempt = 0; attempt < LAST_NAMES.length; attempt++) {
      const candidate = `${first} ${LAST_NAMES[(base + attempt) % LAST_NAMES.length]}`;
      if (!usedNames.has(candidate)) {
        usedNames.add(candidate);
        return candidate;
      }
    }
    const fallback = `${first} ${pick(LAST_NAMES, base)} ${['II', 'III', 'Jr.'][draw(id, 'suffix') % 3]}`;
    usedNames.add(fallback);
    return fallback;
  };

  for (let i = 0; i < size; i++) {
    const id = `dp-${year}-${i}`;
    const position = pick(POSITION_POOL, draw(id, 'pos'));
    const school = pick(SCHOOLS, draw(id, 'school'));

    // True rating decays with class rank: early prospects are genuinely better.
    const rank = i / size;
    const base = 90 - 32 * Math.pow(rank, 0.85);
    const trueOverall = clamp(Math.round(base + (draw(id, 'ovr') % 9) - 4), 48, 95);

    const upside = draw(id, 'upside') % 12;
    const potentialLetter: DraftProspect['potential'] =
      trueOverall + upside >= 96 ? 'S'
      : trueOverall + upside >= 89 ? 'A'
      : trueOverall + upside >= 82 ? 'B'
      : trueOverall + upside >= 74 ? 'C' : 'D';

    const posTraits = TRAITS[position] ?? ['Developmental'];
    const isSkill = [Position.WR, Position.RB, Position.CB, Position.S].includes(position);
    const isBig = [Position.OL, Position.DL, Position.TE].includes(position);

    const prospect: DraftProspect = {
      id,
      name: uniqueName(id),
      position,
      school: school.name,
      region: school.region,
      projectedRound: clamp(Math.floor(i / 32) + 1, 1, 7),
      scoutingGrade: 0, // filled in below once the object exists
      overall: trueOverall,
      potential: potentialLetter,
      scoutingProgress: 0,
      scoutedBy: [],
      combineStats: {
        fortyYard: parseFloat((
          (isSkill ? 4.32 : isBig ? 4.95 : 4.55) + (draw(id, 'forty') % 30) / 100
        ).toFixed(2)),
        bench: (isBig ? 26 : 14) + (draw(id, 'bench') % 12),
        vertical: (isSkill ? 34 : 27) + (draw(id, 'vert') % 10),
        broadJump: (isSkill ? 118 : 102) + (draw(id, 'broad') % 18),
      },
      traits: [pick(posTraits, draw(id, 't1')), pick(posTraits, draw(id, 't2'))]
        .filter((v, idx, a) => a.indexOf(v) === idx),
      hiddenTraits: [pick(HIDDEN_TRAITS, draw(id, 'h1')), pick(HIDDEN_TRAITS, draw(id, 'h2'))]
        .filter((v, idx, a) => a.indexOf(v) === idx),
      interviewStatus: 'NONE',
    };
    prospect.scoutingGrade = gradeForProgress(prospect);
    prospects.push(prospect);
  }

  // Board order is what scouts *think*, so sort by the visible grade.
  return prospects.sort((a, b) => b.scoutingGrade - a.scoutingGrade);
};

/** Approximate Jimmy Johnson trade-value chart. */
export const pickValue = (overallPick: number): number =>
  Math.max(1, Math.round(3000 * Math.exp(-overallPick / 42)));

/**
 * Seven rounds in reverse order of standings — worst record picks first. With
 * every team at 0-0-0 the tie-break on team id makes the order deterministic.
 */
export const generateDraftOrder = (
  year: number,
  teams: Record<string, any>,
  rounds = 7
): DraftPick[] => {
  const wins = (t: any) => parseInt((t.record || '0-0-0').split('-')[0]) || 0;
  const losses = (t: any) => parseInt((t.record || '0-0-0').split('-')[1]) || 0;

  const order = Object.values(teams).sort((a: any, b: any) => {
    if (wins(a) !== wins(b)) return wins(a) - wins(b);
    if (losses(a) !== losses(b)) return losses(b) - losses(a);
    return String(a.id).localeCompare(String(b.id));
  }) as any[];

  const picks: DraftPick[] = [];
  for (let round = 1; round <= rounds; round++) {
    order.forEach((team, idx) => {
      const overall = (round - 1) * order.length + idx + 1;
      picks.push({
        id: `p${year}-r${round}-${overall}`,
        round,
        pickNumber: overall,
        originalTeamId: team.id,
        currentTeamId: team.id,
        year,
        value: pickValue(overall),
      });
    });
  }
  return picks;
};
