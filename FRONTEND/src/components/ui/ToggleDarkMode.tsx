import { useEffect, useState } from 'react';
import './ToggleDarkMode.css';

interface ToggleDarkModeProps {
  className?: string;
  variant?: 'default' | 'circle';
}

const ToggleDarkMode = ({ className = '', variant = 'default' }: ToggleDarkModeProps) => {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (dark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  if (variant === 'circle') {
    return (
      <button
        className={`toggle-darkmode-circle${dark ? ' dark' : ''} ${className}`}
        aria-label="Alternar modo oscuro"
        onClick={() => setDark((v) => !v)}
      >
        <div className="toggle-bg">
          {!dark && (
            <div className="clouds">
              <div className="cloud cloud1" />
              <div className="cloud cloud2" />
              <div className="cloud cloud3" />
            </div>
          )}
          <div className="stars">
            <div className="star star1" />
            <div className="star star2" />
            <div className="star star3" />
            <div className="star star4" />
          </div>
          <div className="moon-sun">
            {dark ? (
              <div className="moon">
                <div className="crater crater1" />
                <div className="crater crater2" />
                <div className="crater crater3" />
              </div>
            ) : (
              <div className="sun">
                <div className="ray ray1" />
                <div className="ray ray2" />
                <div className="ray ray3" />
                <div className="ray ray4" />
              </div>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      className={`toggle-darkmode${dark ? ' dark' : ''} ${className}`}
      aria-label="Alternar modo oscuro"
      onClick={() => setDark((v) => !v)}
    >
      <div className="toggle-bg">
        {!dark && (
          <div className="clouds">
            <div className="cloud cloud1" />
            <div className="cloud cloud2" />
            <div className="cloud cloud3" />
          </div>
        )}
        <div className="stars">
          <div className="star star1" />
          <div className="star star2" />
          <div className="star star3" />
          <div className="star star4" />
        </div>
        <div className="moon-sun">
          {dark ? (
            <div className="moon">
              <div className="crater crater1" />
              <div className="crater crater2" />
              <div className="crater crater3" />
            </div>
          ) : (
            <div className="sun">
              <div className="ray ray1" />
              <div className="ray ray2" />
              <div className="ray ray3" />
              <div className="ray ray4" />
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default ToggleDarkMode; 