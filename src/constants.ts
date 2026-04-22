import { Prize } from './types';

export const PRIZES: Prize[] = [
  { id: '5-off', label: '5% OFF', weight: 22, color: '#e1662f', isWin: true },
  { id: '7-off', label: '7% OFF', weight: 12, color: '#c54824', isWin: true },
  { id: 'brinde', label: 'BRINDE SURPRESA', weight: 10, color: '#9b0638', isWin: true },
  { id: 'try-again', label: 'TENTE NOVAMENTE', weight: 8, color: '#e47c0c', isWin: false },
];

// Physical segments for the wheel (10 segments for better color cycling)
export const WHEEL_SEGMENTS = [
  { ...PRIZES[0], color: '#e1662f' },
  { ...PRIZES[1], color: '#fb9a08' },
  { ...PRIZES[2], color: '#9b0638' },
  { ...PRIZES[3], color: '#e47c0c' },
  { ...PRIZES[0], color: '#c54824' },
  { ...PRIZES[1], color: '#e1662f' },
  { ...PRIZES[2], color: '#fb9a08' },
  { ...PRIZES[3], color: '#9b0638' },
  { ...PRIZES[0], color: '#e47c0c' },
  { ...PRIZES[1], color: '#c54824' },
];

export const COOLDOWN_SECONDS = 10;
export const MIN_TURNS = 5;
export const SPIN_DURATION = 5000; // 5 seconds
