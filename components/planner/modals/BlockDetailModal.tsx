/**
 * BlockDetailModal - Wrapper that shows the appropriate detail modal based on block type
 *
 * Routes to:
 * - WorkoutDetailModal for workout blocks
 * - MealDetailModal for meal_eating/meal_prep blocks
 * - CalendarEventDetailModal for calendar_event blocks
 */

import React from 'react';
import { TimeBlock } from '../../../types/planner';
import { WorkoutDetailModal } from './WorkoutDetailModal';
import { MealDetailModal } from './MealDetailModal';
import { CalendarEventDetailModal } from './CalendarEventDetailModal';

interface Props {
  visible: boolean;
  block: TimeBlock | null;
  onClose: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onReschedule: () => void;
}

export function BlockDetailModal({
  visible,
  block,
  onClose,
  onComplete,
  onSkip,
  onReschedule,
}: Props) {
  if (!block) return null;

  // Route to appropriate modal based on block type
  switch (block.type) {
    case 'workout':
      return (
        <WorkoutDetailModal
          visible={visible}
          block={block}
          onClose={onClose}
          onComplete={onComplete}
          onSkip={onSkip}
          onReschedule={onReschedule}
        />
      );

    case 'meal_eating':
    case 'meal_prep':
      return (
        <MealDetailModal
          visible={visible}
          block={block}
          onClose={onClose}
          onComplete={onComplete}
          onSkip={onSkip}
          onReschedule={onReschedule}
        />
      );

    case 'calendar_event':
      return (
        <CalendarEventDetailModal
          visible={visible}
          block={block}
          onClose={onClose}
        />
      );

    default:
      // For sleep, buffer, and other block types, don't show a modal
      return null;
  }
}
