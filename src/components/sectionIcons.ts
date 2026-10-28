import { Clock, Globe, Puzzle, ShieldCheck, Smartphone, type LucideIcon } from 'lucide-react';
import type { SectionId } from '../lib/diagnostics/types';

export const SECTION_ICONS: Record<SectionId, LucideIcon> = {
  browser: Globe,
  device: Smartphone,
  regional: Clock,
  environment: ShieldCheck,
  capabilities: Puzzle,
};
