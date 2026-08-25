import { Hono } from 'hono';
import { z } from 'zod';
import { requireSession } from '../auth.js';
import { execute, newId, nowIso, queryAll, queryOne } from '../db.js';

interface LegacyPlanRow {
  id: string;
  wallet_address: string;
  moment_type: 'specificDate' | 'ifImGone';
  moment_value: string;
  moment_label: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface BeneficiaryRow {
  id: string;
  legacy_plan_id: string;
  name: string;
  wallet_address: string;
  percentage: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

const shapePlan = (row: LegacyPlanRow) => ({ ...row, is_active: row.is_active === 1 });

// The UI works in `{ id, name, address, percentage, notes }`; the table stores
// the address as `wallet_address`.
const shapeBeneficiary = (row: BeneficiaryRow) => ({
  id: row.id,
  name: row.name,
  address: row.wallet_address,
  percentage: Number(row.percentage),
  notes: row.notes ?? '',
});

const planBody = z.object({
  type: z.enum(['specificDate', 'ifImGone']),
  value: z.string().min(1),
  label: z.string().min(1),
});

const beneficiaryBody = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  percentage: z.number().positive().max(100),
  notes: z.string().optional(),
});

const activePlan = (walletAddress: string) =>
  queryOne<LegacyPlanRow>(
    'SELECT * FROM legacy_plans WHERE wallet_address = ? AND is_active = 1',
    walletAddress
  );

/** Load a beneficiary only if the session owns the plan it belongs to. */
const ownedBeneficiary = (id: string, walletAddress: string) =>
  queryOne<BeneficiaryRow>(
    `SELECT beneficiaries.* FROM beneficiaries
     JOIN legacy_plans ON legacy_plans.id = beneficiaries.legacy_plan_id
     WHERE beneficiaries.id = ? AND legacy_plans.wallet_address = ?`,
    id,
    walletAddress
  );

const totalPercentage = (planId: string, excludingId?: string): number => {
  const row = queryOne<{ total: number }>(
    `SELECT COALESCE(SUM(percentage), 0) AS total FROM beneficiaries
     WHERE legacy_plan_id = ? AND id IS NOT ?`,
    planId,
    excludingId ?? null
  )!;

  return row.total;
};

export const legacyRoutes = new Hono()
  .use('*', requireSession)
  .get('/plan', (c) => {
    const plan = activePlan(c.get('session').walletAddress);
    return plan ? c.json(shapePlan(plan)) : c.json(null);
  })
  .put('/plan', async (c) => {
    const { walletAddress } = c.get('session');
    const parsed = planBody.safeParse(await c.req.json().catch(() => null));

    if (!parsed.success) {
      return c.json({ error: 'A moment type, value and label are required.' }, 400);
    }

    const { type, value, label } = parsed.data;
    const now = nowIso();
    const existing = activePlan(walletAddress);

    if (existing) {
      execute(
        `UPDATE legacy_plans
         SET moment_type = ?, moment_value = ?, moment_label = ?, updated_at = ?
         WHERE id = ?`,
        type,
        value,
        label,
        now,
        existing.id
      );
    } else {
      execute(
        `INSERT INTO legacy_plans (
           id, wallet_address, moment_type, moment_value, moment_label,
           is_active, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
        newId(),
        walletAddress,
        type,
        value,
        label,
        now,
        now
      );
    }

    return c.json(shapePlan(activePlan(walletAddress)!));
  })
  .get('/beneficiaries', (c) => {
    const plan = activePlan(c.get('session').walletAddress);

    if (!plan) {
      return c.json([]);
    }

    const rows = queryAll<BeneficiaryRow>(
      'SELECT * FROM beneficiaries WHERE legacy_plan_id = ? ORDER BY created_at ASC',
      plan.id
    );

    return c.json(rows.map(shapeBeneficiary));
  })
  .post('/beneficiaries', async (c) => {
    const { walletAddress } = c.get('session');
    const plan = activePlan(walletAddress);

    if (!plan) {
      return c.json({ error: 'Set a legacy moment before adding beneficiaries.' }, 409);
    }

    const parsed = beneficiaryBody.safeParse(await c.req.json().catch(() => null));

    if (!parsed.success) {
      return c.json({ error: 'name, address and a percentage of 1-100 are required.' }, 400);
    }

    const { name, address, percentage, notes } = parsed.data;

    // Enforced here as well as in the UI, so the rule holds against direct
    // calls to the API.
    if (totalPercentage(plan.id) + percentage > 100) {
      return c.json({ error: 'Total allocation cannot exceed 100%.' }, 409);
    }

    const id = newId();
    const now = nowIso();

    execute(
      `INSERT INTO beneficiaries (
         id, legacy_plan_id, name, wallet_address, percentage, notes, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      plan.id,
      name,
      address.toLowerCase(),
      percentage,
      notes ?? '',
      now,
      now
    );

    return c.json(
      shapeBeneficiary(
        queryOne<BeneficiaryRow>('SELECT * FROM beneficiaries WHERE id = ?', id)!
      ),
      201
    );
  })
  .put('/beneficiaries/:id', async (c) => {
    const { walletAddress } = c.get('session');
    const existing = ownedBeneficiary(c.req.param('id'), walletAddress);

    if (!existing) {
      return c.json({ error: 'Beneficiary not found.' }, 404);
    }

    const parsed = beneficiaryBody.safeParse(await c.req.json().catch(() => null));

    if (!parsed.success) {
      return c.json({ error: 'name, address and a percentage of 1-100 are required.' }, 400);
    }

    const { name, address, percentage, notes } = parsed.data;

    if (totalPercentage(existing.legacy_plan_id, existing.id) + percentage > 100) {
      return c.json({ error: 'Total allocation cannot exceed 100%.' }, 409);
    }

    execute(
      `UPDATE beneficiaries
       SET name = ?, wallet_address = ?, percentage = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      name,
      address.toLowerCase(),
      percentage,
      notes ?? '',
      nowIso(),
      existing.id
    );

    return c.json(
      shapeBeneficiary(
        queryOne<BeneficiaryRow>('SELECT * FROM beneficiaries WHERE id = ?', existing.id)!
      )
    );
  })
  .delete('/beneficiaries/:id', (c) => {
    const { walletAddress } = c.get('session');
    const existing = ownedBeneficiary(c.req.param('id'), walletAddress);

    if (!existing) {
      return c.json({ error: 'Beneficiary not found.' }, 404);
    }

    execute('DELETE FROM beneficiaries WHERE id = ?', existing.id);

    return c.json({ ok: true });
  });
