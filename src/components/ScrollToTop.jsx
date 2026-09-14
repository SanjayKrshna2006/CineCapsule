import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      
      if (currentScroll > 320) {
        setVisible(true);
      } else {
        setVisible(false);
      }

      if (totalScroll > 0) {
        setScrollProgress(Math.min(100, Math.round((currentScroll / totalScroll) * 100)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      className={`scroll-to-top-btn ${visible ? 'visible' : ''}`}
      onClick={scrollToTop}
      title="Scroll to Top"
      aria-label="Scroll back to top"
    >
      <div className="scroll-progress-ring" style={{ '--progress': `${scrollProgress}%` }}>
        <ArrowUp size={18} className="scroll-arrow-icon" />
      </div>
      <span className="scroll-tooltip">Top</span>
    </button>
  );
}
