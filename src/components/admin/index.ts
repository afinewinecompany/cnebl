/**
 * Admin Components
 *
 * Components for the admin section of CNEBL
 */

export { AdminSidebar } from './AdminSidebar';
export { PlayerTable } from './PlayerTable';
export { PlayerAssignment } from './PlayerAssignment';

// Stats Entry Components
export { StatsEntryHeader } from './StatsEntryHeader';
export { BattingStatsForm } from './BattingStatsForm';
export type { BattingStatsEntry } from './BattingStatsForm';
export { PitchingStatsForm } from './PitchingStatsForm';
export type { PitchingStatsEntry } from './PitchingStatsForm';

// Game Management Components
export { GameForm } from './GameForm';
export type { GameFormData, SeriesGameData } from './GameForm';
export { GameStatusBadge, getStatusColor } from './GameStatusBadge';
export { GameCalendar, GameCalendarCompact } from './GameCalendar';

// Team Management Components
export { TeamEditModal } from './TeamEditModal';
export type { TeamFormData } from './TeamEditModal';
export { DeleteConfirmModal } from './DeleteConfirmModal';

// Announcement Management Components
export { AnnouncementEditModal } from './AnnouncementEditModal';
export type { AnnouncementFormData } from './AnnouncementEditModal';
