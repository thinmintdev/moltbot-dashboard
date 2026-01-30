/**
 * Worktrees Components
 * Export barrel file for worktree-related components
 */

export { WorktreesView, default } from './WorktreesView'
export { WorktreeCard } from './WorktreeCard'
export { WorktreeModal } from './WorktreeModal'

// Re-export store types and hooks
export {
  useWorktreeStore,
  useProjectWorktrees,
  useWorktreeStats,
  type Worktree,
} from '@/lib/stores/worktree-store'
