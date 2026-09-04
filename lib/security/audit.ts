import { prisma } from '@/lib/prisma';
import { getRequestContext } from './request';

export type AuditSeverity = 'info' | 'warn' | 'critical';

export interface AuditInput {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  severity?: AuditSeverity;
  metadata?: Record<string, unknown>;
}

/**
 * Writes an audit row. Deliberately never throws — an audit failure must not
 * break the user-facing operation it is recording.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    const { ipAddress, userAgent } = await getRequestContext();
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        severity: input.severity ?? 'info',
        ipAddress,
        userAgent,
        metadata: (input.metadata ?? {}) as object,
      },
    });
  } catch (error) {
    console.error('[audit] failed to write audit log', input.action, error);
  }
}
