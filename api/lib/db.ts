import { neon } from '@neondatabase/serverless'
import type { SqlTag } from './account-linking'

export function getNeonSql(): SqlTag | null {
  const url = process.env.DATABASE_URL
  if (!url) return null
  return neon(url) as SqlTag
}
