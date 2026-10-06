const iconPaths = {
  sparkles: 'M12 3l1.45 4.55L18 9l-4.55 1.45L12 15l-1.45-4.55L6 9l4.55-1.45L12 3Zm6.5 11.5.65 2.35L21.5 18l-2.35.65L18.5 21l-.65-2.35L15.5 18l2.35-.65.65-2.35ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z',
  dashboard: 'M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z',
  file: 'M6 3.5h7l5 5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Zm7 0V9h5M8 13h8M8 16.5h6',
  upload: 'M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v4A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-4',
  logout: 'M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10m4-3.5L17.5 12 14 8.5M17 12H9',
  search: 'm20 20-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  filter: 'M4 5h16M7 12h10m-7 7h4',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M5 12h13m-5-5 5 5-5 5',
  check: 'm5 12 4.5 4.5L19 7',
  alert: 'M12 3 2.8 19a1 1 0 0 0 .87 1.5h16.66A1 1 0 0 0 21.2 19L12 3Zm0 6v4m0 3h.01',
  clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  trash: 'M5 7h14m-9 4v5m4-5v5M9 7V4h6v3m-9 0 1 13h10l1-13',
  save: 'M5 4h12l2 2v14H5V4Zm3 0v5h7V4M8 20v-7h8v7',
  back: 'm15 18-6-6 6-6M9 12h10',
  chevron: 'm7 10 5 5 5-5',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M18 6 6 18',
  calendar: 'M5 5h14v15H5V5Zm3-2v4m8-4v4M5 10h14',
  hash: 'M10 3 8 21M16 3l-2 18M4 9h17M3 15h17',
  building: 'M4 21V5l8-3 8 3v16M8 8h1m6 0h1M8 12h1m6 0h1M8 16h1m6 0h1M10 21v-3h4v3',
  dollar: 'M12 2v20m4-16.5C15.2 4.8 13.8 4 12 4c-2.2 0-4 1.1-4 3s1.8 3 4 3 4 .9 4 3-1.8 3-4 3c-1.8 0-3.2-.8-4-1.5',
  info: 'M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
};

export default function Icon({ name, size = 18, strokeWidth = 1.8, className = '' }) {
  return <svg aria-hidden="true" className={className} fill="none" height={size} viewBox="0 0 24 24" width={size} xmlns="http://www.w3.org/2000/svg"><path d={iconPaths[name] || iconPaths.file} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} /></svg>;
}
