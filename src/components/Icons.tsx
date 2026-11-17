import type { CSSProperties } from 'react'

export type IconName = 'search' | 'arrow' | 'chevron' | 'heart' | 'star' | 'pin' | 'close' | 'sliders' | 'plus' | 'minus' | 'reset' | 'leaf' | 'pepper' | 'check'
interface Props { name: IconName; size?: number; className?: string; filled?: boolean; style?: CSSProperties }
export function Icon({ name, size = 20, className = '', filled = false, style }: Props) {
  const paths: Record<IconName, React.ReactNode> = {
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
    arrow: <><path d="M4 12h16M14 6l6 6-6 6" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    heart: <path d="M20.6 4.9a5.5 5.5 0 0 0-7.8 0L12 5.7l-.8-.8a5.5 5.5 0 0 0-7.8 7.8L12 21l8.6-8.3a5.5 5.5 0 0 0 0-7.8Z" />,
    star: <path d="m12 3 2.8 5.7 6.3.9-4.5 4.4 1.1 6.2-5.7-3-5.7 3 1.1-6.2-4.5-4.4 6.3-.9L12 3Z" />,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    sliders: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2.5" fill="var(--paper)" /><circle cx="15" cy="17" r="2.5" fill="var(--paper)" /></>,
    plus: <path d="M5 12h14M12 5v14" />,
    minus: <path d="M5 12h14" />,
    reset: <><path d="M3 11a9 9 0 1 1 2.6 7M3 4v7h7" /></>,
    leaf: <><path d="M20 3C8 2 3 7 5 14c2 7 15 6 15-11Z" /><path d="m3 21 13-13" /></>,
    pepper: <><path d="M15 5c2-2 3-3 5-3M15 7c4-2 7 1 6 4-2 6-9 9-17 9 6-3 6-5 7-8 1-3 1-5 4-5Z" /><path d="m14 7 4 4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} aria-hidden="true">{paths[name]}</svg>
}

export function BowlMark({ size = 44 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="m17 9 31-5M19 14l31-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /><path d="M26 15c-6 5 5 8-1 13M34 14c-6 5 5 8-1 13" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" /><ellipse cx="32" cy="33" rx="25" ry="9" stroke="currentColor" strokeWidth="2.5" /><path d="M7 33c2 17 11 25 25 25s23-8 25-25" fill="currentColor" /><path d="M16 37c4 2 8 3 12 3" stroke="var(--paper,#faf8f3)" strokeWidth="2" strokeLinecap="round" /><path d="M23 58h18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
}
