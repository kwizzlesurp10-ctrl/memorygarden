import { describe, expect, it } from 'vitest'
import {
  isLocalUserLinkedToNeon,
  planLocalIdentityLink,
} from '../../../api/lib/account-linking-logic'

describe('planLocalIdentityLink', () => {
  const neonA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const neonB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const local1 = 'local-user-aaa'
  const local2 = 'local-user-bbb'

  it('creates a new account when no links exist', () => {
    expect(
      planLocalIdentityLink({
        neonUserId: neonA,
        localUserId: local1,
        localIdOwnerNeonUserId: null,
        linkedLocalsForNeon: [],
      }).kind,
    ).toBe('create_account')
  })

  it('conflicts when local id belongs to another neon account', () => {
    const plan = planLocalIdentityLink({
      neonUserId: neonB,
      localUserId: local1,
      localIdOwnerNeonUserId: neonA,
      linkedLocalsForNeon: [],
    })
    expect(plan).toEqual({ kind: 'conflict', code: 'local_id_other_account' })
  })

  it('adds a second device link for the same neon account', () => {
    const plan = planLocalIdentityLink({
      neonUserId: neonA,
      localUserId: local2,
      localIdOwnerNeonUserId: null,
      linkedLocalsForNeon: [local1],
    })
    expect(plan.kind).toBe('add_device_link')
  })

  it('detects linked locals', () => {
    expect(isLocalUserLinkedToNeon(local1, [local1, local2])).toBe(true)
    expect(isLocalUserLinkedToNeon('other', [local1])).toBe(false)
  })
})
