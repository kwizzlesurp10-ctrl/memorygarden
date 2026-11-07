import { isValidUserId } from './api-ids'
import { planLocalIdentityLink } from './account-linking-logic'

export type SqlTag = {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]>
}

export interface AccountLinkSnapshot {
  neonUserId: string
  primaryLocalUserId: string
  linkedLocalUserIds: string[]
}

export async function findNeonUserForLocalId(
  sql: SqlTag,
  localUserId: string,
): Promise<string | null> {
  const rows = await sql`
    SELECT neon_user_id::text AS neon_user_id
    FROM mg_local_identity_link
    WHERE local_user_id = ${localUserId}
    LIMIT 1
  `
  if (rows.length === 0) return null
  return String((rows[0] as { neon_user_id: string }).neon_user_id)
}

export async function loadAccountLinkSnapshot(
  sql: SqlTag,
  neonUserId: string,
): Promise<AccountLinkSnapshot | null> {
  const accountRows = await sql`
    SELECT primary_local_user_id
    FROM mg_neon_account
    WHERE neon_user_id = ${neonUserId}::uuid
    LIMIT 1
  `
  if (accountRows.length === 0) return null
  const primaryLocalUserId = String(
    (accountRows[0] as { primary_local_user_id: string }).primary_local_user_id,
  )
  const linkRows = await sql`
    SELECT local_user_id
    FROM mg_local_identity_link
    WHERE neon_user_id = ${neonUserId}::uuid
    ORDER BY linked_at ASC
  `
  const linkedLocalUserIds = linkRows.map((row) =>
    String((row as { local_user_id: string }).local_user_id),
  )
  return { neonUserId, primaryLocalUserId, linkedLocalUserIds }
}

export async function linkLocalUserToNeonAccount(
  sql: SqlTag,
  neonUserId: string,
  localUserId: string,
  linkSource = 'sign_in',
): Promise<{ ok: true; snapshot: AccountLinkSnapshot } | { ok: false; status: number; error: string }> {
  if (!isValidUserId(localUserId)) {
    return { ok: false, status: 400, error: 'Invalid localUserId' }
  }

  const localOwner = await findNeonUserForLocalId(sql, localUserId)
  const existing = await loadAccountLinkSnapshot(sql, neonUserId)
  const plan = planLocalIdentityLink({
    neonUserId,
    localUserId,
    localIdOwnerNeonUserId: localOwner,
    linkedLocalsForNeon: existing?.linkedLocalUserIds ?? [],
  })

  if (plan.kind === 'conflict') {
    return {
      ok: false,
      status: 409,
      error: 'This browser profile is already linked to another account',
    }
  }
  if (plan.kind === 'noop_already_linked' && existing) {
    return { ok: true, snapshot: existing }
  }

  if (plan.kind === 'create_account') {
    await sql`
      INSERT INTO mg_neon_account (neon_user_id, primary_local_user_id)
      VALUES (${neonUserId}::uuid, ${localUserId})
      ON CONFLICT (neon_user_id) DO NOTHING
    `
  }

  await sql`
    INSERT INTO mg_local_identity_link (neon_user_id, local_user_id, link_source)
    VALUES (${neonUserId}::uuid, ${localUserId}, ${linkSource})
    ON CONFLICT (local_user_id) DO NOTHING
  `

  const snapshot = await loadAccountLinkSnapshot(sql, neonUserId)
  if (!snapshot) {
    return { ok: false, status: 500, error: 'Failed to load account link' }
  }
  return { ok: true, snapshot }
}
