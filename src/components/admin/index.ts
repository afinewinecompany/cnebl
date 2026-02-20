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
export { ResultTypeSelector } from './ResultTypeSelector';
export type { ResultTypeSelectorProps } from './ResultTypeSelector';
export { OutNotationInput } from './OutNotationInput';
export { PlateAppearanceEntry } from './PlateAppearanceEntry';
export type { PlateAppearanceEntryProps } from './PlateAppearanceEntry';
export { PlateAppearanceList } from './PlateAppearanceList';
export type { PlateAppearanceListProps } from './PlateAppearanceList';
export { GameTotalsEntry } from './GameTotalsEntry';
export type { GameTotalsEntryProps } from './GameTotalsEntry';
export { PlayerBattingCard } from './PlayerBattingCard';
export type { PlayerBattingCardProps } from './PlayerBattingCard';
export { PlayerStatsForm } from './PlayerStatsForm';
export type { PlayerBattingEntry } from './PlayerStatsForm';

// Game Management Components
export { GameForm } from './GameForm';
export type { GameFormData, SeriesGameData } from './GameForm';
export { GameStatusBadge, getStatusColor } from './GameStatusBadge';
export { GameCalendar, GameCalendarCompact } from './GameCalendar';
export { ScoreEntryCard } from './ScoreEntryCard';
export type { ScoreEntryCardProps } from './ScoreEntryCard';

// Team Management Components
export { TeamEditModal } from './TeamEditModal';
export type { TeamFormData } from './TeamEditModal';
export { DeleteConfirmModal } from './DeleteConfirmModal';

// Announcement Management Components
export { AnnouncementEditModal } from './AnnouncementEditModal';
export type { AnnouncementFormData } from './AnnouncementEditModal';

// Chat Management Components
export { TeamSelector, AdminMessengerView } from './chat';
export type { TeamSelectorProps, TeamOption } from './chat';
