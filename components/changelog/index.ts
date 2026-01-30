/**
 * Changelog Components
 * Export barrel file for changelog-related components
 */

export { ChangelogView, default } from './ChangelogView'
export { ChangelogEntry } from './ChangelogEntry'
export { ChangelogModal } from './ChangelogModal'

// Re-export store types and hooks
export {
  useChangelogStore,
  useProjectChangelog,
  useChangelogStats,
  getChangeTypeConfig,
  getVersionType,
  parseVersion,
  type ChangelogEntry as ChangelogEntryType,
  type Change,
  type ChangeType,
} from '@/lib/stores/changelog-store'
