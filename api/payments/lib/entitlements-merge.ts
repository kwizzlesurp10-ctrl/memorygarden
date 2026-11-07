import {
  createEmptyEntitlementList,
  parseEntitlementList,
  type EntitlementList,
  type StoredEntitlement,
} from './entitlements'
import { readEntitlementsRaw, type KvEnv } from './kv'

export function mergeEntitlementLists(lists: EntitlementList[]): {
  entitlements: StoredEntitlement[]
  updatedAt: string
} {
  const byId = new Map<string, StoredEntitlement>()
  let latestUpdated = createEmptyEntitlementList().updatedAt

  for (const list of lists) {
    if (list.updatedAt > latestUpdated) latestUpdated = list.updatedAt
    for (const ent of list.entitlements) {
      const prev = byId.get(ent.id)
      if (!prev) {
        byId.set(ent.id, ent)
        continue
      }
      const prevConsumed = prev.status === 'consumed'
      const nextConsumed = ent.status === 'consumed'
      if (prevConsumed && !nextConsumed) byId.set(ent.id, ent)
    }
  }

  return { entitlements: [...byId.values()], updatedAt: latestUpdated }
}

export async function readMergedEntitlementsForLocalIds(
  kv: KvEnv,
  localUserIds: string[],
): Promise<{ entitlements: StoredEntitlement[]; updatedAt: string }> {
  const lists: EntitlementList[] = []
  for (const localUserId of localUserIds) {
    const raw = await readEntitlementsRaw(kv, localUserId)
    if (!raw) continue
    lists.push(parseEntitlementList(JSON.parse(raw)))
  }
  return mergeEntitlementLists(lists)
}
