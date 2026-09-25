export type ProjectMode = 'short_form' | 'medium_form' | 'long_form';

export const DURATION_OPTIONS = [
  '30 seconds',
  '60 seconds',
  '90 seconds',
  '3 minutes',
  '5 minutes',
  '7 minutes',
  '10 minutes',
  '15 minutes',
  '20 minutes',
  '30 minutes',
  '40 minutes',
  '1 hour',
  '1 hour 30 minutes',
  '2 hours',
] as const;

export function parseDurationToSeconds(durationLabel: string): number {
  if (!durationLabel) return 60;
  const normalized = durationLabel.trim().toLowerCase();

  if (normalized.includes('2 hour') || normalized === '2 hours' || normalized === '2h') return 7200;
  if (
    normalized.includes('1 hour 30') ||
    normalized.includes('90 min') ||
    normalized.includes('1.5 hour') ||
    normalized.includes('1h 30m')
  ) {
    return 5400;
  }
  if (normalized.includes('1 hour') || normalized === '1 hour' || normalized === '1h' || normalized.includes('60 min')) {
    return 3600;
  }
  if (normalized.includes('40 min')) return 2400;
  if (normalized.includes('30 min')) return 1800;
  if (normalized.includes('20 min')) return 1200;
  if (normalized.includes('15 min')) return 900;
  if (normalized.includes('10 min')) return 600;
  if (normalized.includes('7 min')) return 420;
  if (normalized.includes('5 min')) return 300;
  if (normalized.includes('3 min')) return 180;
  if (normalized.includes('90 sec') || normalized.includes('90s')) return 90;
  if (normalized.includes('60 sec') || normalized.includes('60s')) return 60;
  if (normalized.includes('30 sec') || normalized.includes('30s')) return 30;

  const hourMatch = normalized.match(/(\d+)\s*(?:hour|hr|h)/);
  const minMatch = normalized.match(/(\d+)\s*(?:minute|min|m)/);
  const secMatch = normalized.match(/(\d+)\s*(?:second|sec|s)/);
  if (hourMatch || minMatch || secMatch) {
    let secs = 0;
    if (hourMatch) secs += parseInt(hourMatch[1], 10) * 3600;
    if (minMatch) secs += parseInt(minMatch[1], 10) * 60;
    if (secMatch) secs += parseInt(secMatch[1], 10);
    return secs > 0 ? secs : 60;
  }

  return 60;
}

export function parseSceneDurationToSeconds(sceneDurationLabel = '10 seconds'): number {
  if (!sceneDurationLabel) return 10;
  const normalized = sceneDurationLabel.trim().toLowerCase();
  if (normalized.includes('6')) return 6;
  if (normalized.includes('8')) return 8;
  if (normalized.includes('15')) return 15;
  if (normalized.includes('20')) return 20;
  if (normalized.includes('10')) return 10;

  const match = normalized.match(/(\d+)/);
  if (match) {
    const val = parseInt(match[1], 10);
    if (val > 0) return val;
  }
  return 10;
}

export function calculateTargetSceneCount(durationSeconds: number, sceneDurationSeconds: number): number {
  const safeSceneDuration = sceneDurationSeconds > 0 ? sceneDurationSeconds : 10;
  const safeDuration = durationSeconds > 0 ? durationSeconds : 60;
  return Math.ceil(safeDuration / safeSceneDuration);
}

export function calculateEstimatedScenes(durationSeconds: number, sceneDurationLabel = '10 seconds'): number {
  const sceneSeconds = parseSceneDurationToSeconds(sceneDurationLabel);
  return calculateTargetSceneCount(durationSeconds, sceneSeconds);
}

export function getProjectMode(durationSeconds: number): ProjectMode {
  if (durationSeconds <= 300) {
    return 'short_form';
  }
  if (durationSeconds <= 1200) {
    return 'medium_form';
  }
  return 'long_form';
}
