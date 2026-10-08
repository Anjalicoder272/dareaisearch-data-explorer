import { useState } from 'react';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'explorer.theme';

/** Theme already applied by the inline script in index.html (saved choice, else OS setting). */
function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/**
 * Switches the theme in a single frame:
 * 1. a `theme-switching` class disables every CSS transition, so elements don't fade
 *    at different speeds (the "flicker");
 * 2. the new theme is written to <html> synchronously in the click handler, before
 *    React re-renders, so colours and the button label change in the same paint;
 * 3. transitions are restored on the next frame, after the new styles are committed.
 */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.add('theme-switching');
  root.dataset.theme = theme;
  void root.offsetHeight; // flush styles with transitions disabled
  requestAnimationFrame(() => root.classList.remove('theme-switching'));
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage unavailable */
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-pressed={isDark}
      aria-label="Dark mode"
      onClick={() => {
        const next: Theme = isDark ? 'light' : 'dark';
        applyTheme(next);
        setTheme(next);
      }}
    >
      <span aria-hidden="true" className="theme-toggle__icon">
        {isDark ? '☀️' : '🌙'}
      </span>
      <span aria-hidden="true">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
