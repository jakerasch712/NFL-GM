import { Player, Coach, CoachArchetype, Play, Position } from '../types';
import { OFFENSIVE_PLAYS } from '../constants';

export const aiCoachingDecision = (coach: Coach, gameState: any): Play => {
  const { archetype } = coach;
  const { down, distance, ballOn, homeScore, awayScore, quarter } = gameState;
  
  const scoreDiff = homeScore - awayScore; // Assuming user is home
  
  // Innovator personality
  if (archetype === 'The Innovator') {
    if (down === 4 && distance <= 2 && ballOn > 40) {
      // Go for it
      return OFFENSIVE_PLAYS.find(p => p.type === 'Pass' && p.risk > 5) || OFFENSIVE_PLAYS[0];
    }
  }

  // Conservative personality
  if (archetype === 'The Conservative') {
    if (down === 4 || (down === 3 && distance > 10)) {
      return OFFENSIVE_PLAYS.find(p => p.name === 'Punt') || OFFENSIVE_PLAYS[0];
    }
  }

  // General situational logic
  if (down === 3 && distance > 7) {
    return OFFENSIVE_PLAYS.find(p => p.type === 'Pass' && p.reward > 7) || OFFENSIVE_PLAYS[2];
  }

  // Default: Random play from archetype preference
  const filtered = OFFENSIVE_PLAYS.filter(p => {
    if (archetype === 'The Innovator') return p.type === 'Pass';
    if (archetype === 'The Conservative') return p.type === 'Run';
    return true;
  });

  return filtered[Math.floor(Math.random() * filtered.length)];
};

export const aiGMRosterManagement = (teamId: string, roster: Player[], freeAgents: Player[]): Player[] => {
  // Logic for AI teams to cut bad contracts and sign needed positions
  const needs = ['QB', 'OL', 'DL'].filter(pos => !roster.some(p => p.position === pos && p.overall > 80));
  
  if (needs.length > 0) {
    const bestFA = freeAgents.find(fa => needs.includes(fa.position));
    if (bestFA) {
      // Logic would be to add to roster and remove from FA
      // Since this is a service, we return the action or log
    }
  }
  return roster;
};
