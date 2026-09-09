import type { DnrHealth } from './load';

export function parseDnrHealth(value: unknown): DnrHealth | null {
  if (!value || typeof value !== 'object') return null;

  const raw = value as Record<string, unknown>;
  return {
    ok: Boolean(raw.ok),
    stuckRuleIds: Array.isArray(raw.stuckRuleIds) ? (raw.stuckRuleIds as number[]) : [],
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
  };
}
