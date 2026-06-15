import { createContext, useContext, useEffect } from 'react';

const HeroSliderContext = createContext(null);

export function HeroSliderProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.style.setProperty('--hero-image', "url('/landing_page.webp')");
  }, []);
  return (
    <HeroSliderContext.Provider value={null}>
      {children}
    </HeroSliderContext.Provider>
  );
}

export function useHeroSlider() { return useContext(HeroSliderContext); }
