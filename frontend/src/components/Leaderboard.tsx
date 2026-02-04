import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  GetLeaderboard,
  GetPlayerIdsOptions,
  GetSettings,
  SaveSettings
} from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
import { Input } from 'antd';
import { useDebounce } from '../hooks/useDebounce';
import { TableVirtuoso, TableComponents } from 'react-virtuoso';
import { StarFilled, StarOutlined } from '@ant-design/icons';

const { Search } = Input;

const PINNED_ROW_BG = 'bg-neutral-900/95';
const COL_STAR = 'w-[20px]';
const COL_RANK = 'w-[60px]';
const COL_ELO = 'w-[100px]';

type Row = main.LeaderboardEntry & { rank: number };

const highlightText = (text: string, query: string) => {
  if (!query) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'ig');

  return text.split(regex).map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-yellow-900">
        {part}
      </span>
    ) : (
      part
    )
  );
};

export const Leaderboard = ({ onOpenPlayer }: { onOpenPlayer?: (playerId: string) => void }) => {
  const [leaderboard, setLeaderboard] = useState<(main.LeaderboardEntry & { rank: number })[]>([]);
  const [search, setSearch] = useState('');
  const [trackedPlayerIds, setTrackedPlayerIds] = useState<string[]>([]);
  const [favoritePlayerIds, setFavoritePlayerIds] = useState<string[]>([]);
  const [visibleRange, setVisibleRange] = useState<{ startIndex: number; endIndex: number } | null>(
    null
  );
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const [tableHeight, setTableHeight] = useState<number>(400);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    (async () => {
      const [data, ids, settings] = await Promise.all([
        GetLeaderboard(),
        GetPlayerIdsOptions(),
        GetSettings()
      ]);

      setLeaderboard(data.map((entry, i) => ({ ...entry, rank: i + 1 })));
      setTrackedPlayerIds(ids.map((option) => option.value));
      setFavoritePlayerIds(((settings as any)?.favoritePlayerIds as string[]) || []);
    })();
  }, []);

  const recomputeTableHeight = useCallback(() => {
    const el = tableContainerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    // Keep a little breathing room so the table never spills below the window.
    const next = Math.max(220, Math.floor(window.innerHeight - rect.top - 16));

    setTableHeight((prev) => (prev === next ? prev : next));
  }, []);

  useLayoutEffect(() => {
    recomputeTableHeight();

    const onResize = () => recomputeTableHeight();
    window.addEventListener('resize', onResize);

    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize);
      ro.observe(document.body);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
  }, [recomputeTableHeight]);

  const filteredData = useMemo(() => {
    if (!debouncedSearch) return leaderboard;

    const lower = debouncedSearch.toLowerCase();

    return leaderboard.filter((entry) => entry.name.toLowerCase().includes(lower));
  }, [leaderboard, debouncedSearch]);

  const trackedSet = useMemo(() => new Set(trackedPlayerIds), [trackedPlayerIds]);
  const favoriteSet = useMemo(() => new Set(favoritePlayerIds), [favoritePlayerIds]);

  const toggleFavorite = useCallback(
    (playerId: string) => {
      // Don't allow favoriting tracked players (usually: yourself).
      if (trackedSet.has(playerId)) return;

      setFavoritePlayerIds((prev) => {
        const prevSet = new Set(prev);
        const next = prevSet.has(playerId)
          ? prev.filter((id) => id !== playerId)
          : [...prev, playerId];

        (async () => {
          try {
            const settings = await GetSettings();
            await SaveSettings({ ...(settings as any), favoritePlayerIds: next } as any);
          } catch (e) {
            // Revert on failure.
            setFavoritePlayerIds(prev);
          }
        })();

        return next;
      });
    },
    [trackedSet]
  );

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < filteredData.length; i++) {
      map.set(filteredData[i].id.toString(), i);
    }
    return map;
  }, [filteredData]);

  const stickySet = useMemo(() => {
    if (trackedSet.size === 0 && favoriteSet.size === 0) return new Set<string>();
    return new Set<string>([...trackedSet, ...favoriteSet]);
  }, [trackedSet, favoriteSet]);

  const stickyEntries = useMemo(() => {
    if (stickySet.size === 0) return [];
    return filteredData.filter((entry) => stickySet.has(entry.id.toString()));
  }, [filteredData, stickySet]);

  const pinnedTopEntries = useMemo(() => {
    if (!visibleRange) return [];
    return stickyEntries
      .filter((entry) => {
        const idx = indexById.get(entry.id.toString());
        if (idx == null) return false;
        // If the row is above the viewport, pin to top.
        return idx < visibleRange.startIndex;
      })
      .sort((a, b) => a.rank - b.rank);
  }, [stickyEntries, visibleRange, indexById]);

  const pinnedBottomEntries = useMemo(() => {
    if (!visibleRange) return [];
    return stickyEntries
      .filter((entry) => {
        const idx = indexById.get(entry.id.toString());
        if (idx == null) return false;
        // If the row is below the viewport, pin to bottom.
        return idx > visibleRange.endIndex;
      })
      .sort((a, b) => a.rank - b.rank);
  }, [stickyEntries, visibleRange, indexById]);

  const onRangeChanged = useCallback(
    ({ startIndex, endIndex }: { startIndex: number; endIndex: number }) => {
      setVisibleRange((prev) => {
        if (prev && prev.startIndex === startIndex && prev.endIndex === endIndex) return prev;
        return { startIndex, endIndex };
      });
    },
    []
  );

  const virtuosoComponents: TableComponents<Row> = useMemo(
    () => ({
      Table: (props) => (
        <table {...props} className="w-full table-fixed border-separate border-spacing-0" />
      ),
      TableHead: (props) => <thead {...props} className="bg-neutral-900" />,
      TableRow: (props) => (
        <tr {...props} className="border-b border-neutral-800 hover:bg-neutral-800/40" />
      ),
      TableFoot: (props) => <tfoot {...props} className="bg-neutral-900" />
    }),
    []
  );

  const renderRowCells = useCallback(
    (item: Row) => {
      const playerId = item.id.toString();
      const isTracked = trackedSet.has(playerId);
      const isFavorite = favoriteSet.has(playerId);
      const favoriteDisabled = isTracked;

      return (
        <>
          <td className={`${COL_STAR} px-1 py-1 text-center text-sm`}>
            <button
              type="button"
              disabled={favoriteDisabled}
              className={[
                'inline-flex items-center justify-center w-6 h-6 rounded',
                favoriteDisabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-white/10',
                isFavorite ? 'text-sky-400' : 'text-neutral-500'
              ].join(' ')}
              aria-label={
                favoriteDisabled
                  ? 'Favorites disabled for tracked player'
                  : isFavorite
                    ? 'Remove from favorites'
                    : 'Add to favorites'
              }
              onClick={() => toggleFavorite(playerId)}>
              {isFavorite ? <StarFilled /> : <StarOutlined />}
            </button>
          </td>
          <td className={`${COL_RANK} px-2 py-1 text-center text-sm`}>
            <span className={isTracked ? 'text-yellow-500' : ''}>{item.rank}</span>
          </td>
          <td className="px-2 py-1 text-sm min-w-0">
            <button
              type="button"
              className={[
                'block w-full min-w-0 text-left truncate',
                onOpenPlayer ? 'cursor-pointer hover:underline' : 'cursor-default',
                isTracked ? 'text-yellow-500' : isFavorite ? 'text-sky-300' : ''
              ].join(' ')}
              title={onOpenPlayer ? 'Open player details' : undefined}
              onClick={() => onOpenPlayer?.(playerId)}>
              {highlightText(item.name, search)}
            </button>
          </td>
          <td className={`${COL_ELO} px-2 py-1 text-center text-sm tabular-nums`}>
            {item.elo.toFixed(0)}
          </td>
        </>
      );
    },
    [favoriteSet, onOpenPlayer, search, toggleFavorite, trackedSet]
  );

  const renderPinnedRow = useCallback(
    (item: Row, position: 'top' | 'bottom') => (
      <tr key={`pinned-${position}-${item.id}`} className={PINNED_ROW_BG}>
        {renderRowCells(item)}
      </tr>
    ),
    [renderRowCells]
  );

  return (
    <div className="flex flex-col gap-2">
      <Search
        placeholder="Find player"
        allowClear
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div ref={tableContainerRef} className="rounded border border-neutral-700 overflow-hidden">
        <TableVirtuoso<Row>
          style={{ height: tableHeight }}
          data={filteredData}
          components={virtuosoComponents}
          computeItemKey={(_, item) => item.id}
          rangeChanged={onRangeChanged}
          fixedHeaderContent={() => (
            <>
              <tr className="text-left text-neutral-300">
                <th className={`${COL_STAR} px-1 py-2 text-center font-medium`}></th>
                <th className={`${COL_RANK} px-2 py-2 text-center font-medium`}>#</th>
                <th className="px-2 py-2 font-medium">Name</th>
                <th className={`${COL_ELO} px-2 py-2 text-center font-medium`}>Elo</th>
              </tr>
              {pinnedTopEntries.map((e) => renderPinnedRow(e, 'top'))}
            </>
          )}
          fixedFooterContent={() => (
            <>{pinnedBottomEntries.map((e) => renderPinnedRow(e, 'bottom'))}</>
          )}
          itemContent={(_, item) => renderRowCells(item)}
        />
      </div>
    </div>
  );
};
