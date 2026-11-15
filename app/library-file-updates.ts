import type { StudyFileItem } from './study-library';

// The normal library edits only its own projection of the shared inventory.
export function applyNormalLibraryFiles(current: StudyFileItem[], normalFiles: StudyFileItem[], capturedIds: ReadonlySet<string>): StudyFileItem[] {
  const privateFiles = current.filter(file => !!file.sourceWorkId);
  const privateIds = new Set(privateFiles.map(file => file.id));
  return [...privateFiles, ...normalFiles.filter(file => !capturedIds.has(file.id) && !privateIds.has(file.id))];
}
