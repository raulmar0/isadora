import type { CSSProperties } from 'react';

type IconName = 'arrow' | 'globe' | 'pause' | 'play' | 'reset' | 'hand' | 'spark' | 'people' | 'plus';

const paths: Record<IconName, React.ReactNode> = {
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  globe: <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6.5h14M5 17.5h14"/></>,
  pause: <><path d="M9 6v12M15 6v12" /></>,
  play: <path d="m9 5 10 7-10 7Z" />,
  reset: <><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" /></>,
  hand: <><path d="M9 12V5a2 2 0 0 1 4 0v6l1-3a2 2 0 0 1 3 2l-.2 1a2 2 0 0 1 3 2l-.8 4a5 5 0 0 1-5 4h-1a6 6 0 0 1-5-3l-4-6a2 2 0 0 1 3-2l2 2Z"/></>,
  spark: <><path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3Z"/></>,
  people: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
};

export function Icon({ name, size = 20, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{paths[name]}</svg>;
}
