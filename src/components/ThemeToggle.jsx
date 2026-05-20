import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = () => {
  const { isDark, toggleDark } = useTheme();

  return (
    <button
      onClick={toggleDark}
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        background: 'transparent',
        border: '1px solid var(--primary-font-color)',
        borderRadius: '6px',
        padding: '0.4rem 0.6rem',
        cursor: 'pointer',
        fontSize: '1rem',
        color: 'var(--primary-font-color)',
      }}
      aria-label="Toggle dark mode"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};