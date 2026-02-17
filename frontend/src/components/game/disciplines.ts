import { SchoolId } from './schools';

export interface DisciplineEffects {
  hpBonus?: number;           // Flat HP added
  damageMult?: number;        // Multiply all damage (1.5 = +50%)
  speedMult?: number;         // Multiply move speed
  critBonus?: number;         // Flat crit % addition
  blastRadiusMult?: number;   // Multiply blast radius
  attackCooldownMult?: number; // Multiply attack CD (0.8 = 20% faster)
  dashCooldownMult?: number;   // Multiply dash CD
  damageTakenMult?: number;    // Multiply incoming damage (0.75 = 25% reduction)
}

export interface Discipline {
  id: string;
  schoolId: SchoolId;
  name: string;
  tagline: string;
  description: string;
  effects: DisciplineEffects;
  icon: string;
}

export const DISCIPLINES: Record<SchoolId, Discipline[]> = {
  vanguard: [
    {
      id: 'juggernaut',
      schoolId: 'vanguard',
      name: 'Juggernaut',
      tagline: 'Crush through defenses',
      description: 'Massive melee damage at the cost of attack speed. Each blow hits like a freight train.',
      icon: '🔨',
      effects: { damageMult: 1.6, attackCooldownMult: 1.4 },
    },
    {
      id: 'sentinel',
      schoolId: 'vanguard',
      name: 'Sentinel',
      tagline: 'Unmovable fortress',
      description: 'Reduce all incoming damage. Stand firm, outlast everything.',
      icon: '🛡️',
      effects: { hpBonus: 25, damageTakenMult: 0.65 },
    },
    {
      id: 'warlord',
      schoolId: 'vanguard',
      name: 'Warlord',
      tagline: 'Pain is your weapon',
      description: 'Attack faster and move with more aggression. Overwhelming pressure.',
      icon: '⚔️',
      effects: { attackCooldownMult: 0.6, speedMult: 1.15 },
    },
  ],

  invoker: [
    {
      id: 'arcanist',
      schoolId: 'invoker',
      name: 'Arcanist',
      tagline: 'Spells over steel',
      description: 'Devastating spell damage. Your abilities annihilate, but melee is an afterthought.',
      icon: '✨',
      effects: { damageMult: 1.5, blastRadiusMult: 1.3 },
    },
    {
      id: 'chronomancer',
      schoolId: 'invoker',
      name: 'Chronomancer',
      tagline: 'Time bends to your will',
      description: 'All ability cooldowns drastically reduced. Cast again before they recover.',
      icon: '⏱️',
      effects: { dashCooldownMult: 0.5, attackCooldownMult: 0.65 },
    },
    {
      id: 'channeler',
      schoolId: 'invoker',
      name: 'Channeler',
      tagline: 'Life flows through power',
      description: 'Extra HP and reduced damage taken. Surprisingly resilient for a caster.',
      icon: '💠',
      effects: { hpBonus: 20, damageTakenMult: 0.8, speedMult: 0.9 },
    },
  ],

  phantom: [
    {
      id: 'assassin',
      schoolId: 'phantom',
      name: 'Assassin',
      tagline: 'One strike, one kill',
      description: 'Extreme burst damage and the fastest dash in any school. Hit hard, vanish instantly.',
      icon: '🗡️',
      effects: { damageMult: 1.4, dashCooldownMult: 0.4, critBonus: 10 },
    },
    {
      id: 'duelist',
      schoolId: 'phantom',
      name: 'Duelist',
      tagline: 'Death sharpens the blade',
      description: 'More HP and higher crit. Built for extended skirmishes — outlast them.',
      icon: '🎯',
      effects: { hpBonus: 15, critBonus: 15, damageTakenMult: 0.85 },
    },
    {
      id: 'blademaster',
      schoolId: 'phantom',
      name: 'Blademaster',
      tagline: 'A blur of steel',
      description: 'Rapid attacks and extreme speed. Overwhelm with sheer volume of hits.',
      icon: '🌀',
      effects: { attackCooldownMult: 0.55, speedMult: 1.3 },
    },
  ],
};
