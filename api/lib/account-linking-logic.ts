/**
 * Pure linking policy — safe to unit test without Postgres.
 */

export type LinkPlan =
  | { kind: 'create_account' }
  | { kind: 'add_device_link' }
  | { kind: 'noop_already_linked' }
  | { kind: 'conflict'; code: 'local_id_other_account' }

export function planLocalIdentityLink(input: {
  neonUserId: string
  localUserId: string
  localIdOwnerNeonUserId: string | null
  linkedLocalsForNeon: string[]
}): LinkPlan {
  if (
    input.localIdOwnerNeonUserId &&
    input.localIdOwnerNeonUserId !== input.neonUserId
  ) {
    return { kind: 'conflict', code: 'local_id_other_account' }
  }
  if (input.linkedLocalsForNeon.includes(input.localUserId)) {
    return { kind: 'noop_already_linked' }
  }
  if (input.linkedLocalsForNeon.length === 0 && !input.localIdOwnerNeonUserId) {
    return { kind: 'create_account' }
  }
  return { kind: 'add_device_link' }
}

export function isLocalUserLinkedToNeon(
  localUserId: string,
  linkedLocals: string[],
): boolean {
  return linkedLocals.includes(localUserId)
}
