/**
 * Overlap Layout Algorithm for Calendar Events
 *
 * Implements the Google Calendar / Outlook / Teams column-packing algorithm:
 * 1. Sort blocks by start time, then end time
 * 2. Group overlapping blocks into connected clusters
 * 3. Within each cluster, assign blocks to columns (as far left as possible)
 * 4. Each block's width = colSpan / totalColumns, left = colIndex / totalColumns
 * 5. Expand rightward into empty neighboring columns when possible
 *
 * Returns a Map<blockId, { leftPercent, widthPercent }> for positioning.
 */

interface LayoutBlock {
  id: string;
  startMinutes: number;
  endMinutes: number;
}

export interface BlockLayout {
  /** 0–1 fraction: how far left within the content area (0 = flush left) */
  leftPercent: number;
  /** 0–1 fraction: how wide within the content area (1 = full width) */
  widthPercent: number;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function collides(a: LayoutBlock, b: LayoutBlock): boolean {
  return a.endMinutes > b.startMinutes && a.startMinutes < b.endMinutes;
}

/**
 * Expand an event rightward into empty neighboring columns.
 * Returns how many columns it can span (minimum 1).
 */
function expandEvent(
  ev: LayoutBlock,
  colIdx: number,
  columns: LayoutBlock[][]
): number {
  let colSpan = 1;
  for (let i = colIdx + 1; i < columns.length; i++) {
    if (columns[i].some((other) => collides(ev, other))) {
      return colSpan;
    }
    colSpan++;
  }
  return colSpan;
}

/**
 * Pack a connected group of columns: assign leftPercent and widthPercent.
 */
function packGroup(
  columns: LayoutBlock[][],
  layoutMap: Map<string, BlockLayout>
): void {
  const numColumns = columns.length;
  for (let colIdx = 0; colIdx < numColumns; colIdx++) {
    for (const ev of columns[colIdx]) {
      const colSpan = expandEvent(ev, colIdx, columns);
      layoutMap.set(ev.id, {
        leftPercent: colIdx / numColumns,
        widthPercent: colSpan / numColumns,
      });
    }
  }
}

/**
 * Compute overlap layout for an array of time blocks.
 *
 * @param blocks - Array of objects with at least { id, startTime, endTime } where times are "HH:MM"
 * @param wakeTime - The timeline's wake time "HH:MM" for wraparound handling
 * @returns Map from block.id to { leftPercent, widthPercent }
 */
export function computeOverlapLayout(
  blocks: Array<{ id: string; startTime: string; endTime: string }>,
  wakeTime: string = '06:00'
): Map<string, BlockLayout> {
  const layoutMap = new Map<string, BlockLayout>();

  if (blocks.length === 0) return layoutMap;

  const wakeMins = timeToMinutes(wakeTime);

  // Convert to LayoutBlock with wake-time-relative minutes for correct ordering
  const layoutBlocks: LayoutBlock[] = blocks.map((b) => {
    let start = timeToMinutes(b.startTime) - wakeMins;
    let end = timeToMinutes(b.endTime) - wakeMins;
    if (start < 0) start += 24 * 60;
    if (end <= start) end += 24 * 60; // handle blocks crossing midnight
    return { id: b.id, startMinutes: start, endMinutes: end };
  });

  // Sort by start, then by end (longer events first when same start)
  layoutBlocks.sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) return a.startMinutes - b.startMinutes;
    return a.endMinutes - b.endMinutes;
  });

  // Process blocks into connected groups using column-packing
  let columns: LayoutBlock[][] = [];
  let lastEventEnding: number | null = null;

  for (const ev of layoutBlocks) {
    // If this event starts after all previous events ended, flush the group
    if (lastEventEnding !== null && ev.startMinutes >= lastEventEnding) {
      packGroup(columns, layoutMap);
      columns = [];
      lastEventEnding = null;
    }

    // Try to place in an existing column (leftmost that doesn't collide)
    let placed = false;
    for (const col of columns) {
      if (!collides(col[col.length - 1], ev)) {
        col.push(ev);
        placed = true;
        break;
      }
    }

    // No room — create a new column
    if (!placed) {
      columns.push([ev]);
    }

    // Track the latest ending time in this group
    if (lastEventEnding === null || ev.endMinutes > lastEventEnding) {
      lastEventEnding = ev.endMinutes;
    }
  }

  // Flush the final group
  if (columns.length > 0) {
    packGroup(columns, layoutMap);
  }

  // Any block not in the map (shouldn't happen) gets full width
  for (const b of blocks) {
    if (!layoutMap.has(b.id)) {
      layoutMap.set(b.id, { leftPercent: 0, widthPercent: 1 });
    }
  }

  return layoutMap;
}
