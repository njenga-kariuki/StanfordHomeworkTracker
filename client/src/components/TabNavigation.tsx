import { useEffect, useRef } from "react";

interface TabNavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export default function TabNavigation({ currentTab, onTabChange }: TabNavigationProps) {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  
  // Update indicator position when tab changes
  useEffect(() => {
    const updateIndicator = () => {
      const currentTabElement = tabsRef.current.get(currentTab);
      
      if (currentTabElement && indicatorRef.current) {
        indicatorRef.current.style.width = `${currentTabElement.offsetWidth}px`;
        indicatorRef.current.style.transform = `translateX(${currentTabElement.offsetLeft}px)`;
      }
    };
    
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    
    return () => {
      window.removeEventListener('resize', updateIndicator);
    };
  }, [currentTab]);
  
  return (
    <div className="bg-white shadow-sm">
      <div className="container mx-auto">
        <div className="relative">
          <nav className="flex">
            <button
              ref={(el) => el && tabsRef.current.set('homework', el)}
              className={`tab-btn px-6 py-4 font-medium text-sm focus:outline-none ${
                currentTab === 'homework' ? 'text-[#8C1515]' : 'text-neutral-text'
              }`}
              onClick={() => onTabChange('homework')}
            >
              Homework Tracker
            </button>
            <button
              ref={(el) => el && tabsRef.current.set('summarize', el)}
              className={`tab-btn px-6 py-4 font-medium text-sm focus:outline-none ${
                currentTab === 'summarize' ? 'text-[#8C1515]' : 'text-neutral-text'
              }`}
              onClick={() => onTabChange('summarize')}
            >
              PDF Summarizer
            </button>
            <button
              ref={(el) => el && tabsRef.current.set('settings', el)}
              className={`tab-btn px-6 py-4 font-medium text-sm focus:outline-none ${
                currentTab === 'settings' ? 'text-[#8C1515]' : 'text-neutral-text'
              }`}
              onClick={() => onTabChange('settings')}
            >
              Settings
            </button>
          </nav>
          <div
            ref={indicatorRef}
            className="tab-indicator absolute bottom-0 h-0.5 w-[140px] bg-[#8C1515] transition-transform duration-300 ease-in-out"
          ></div>
        </div>
      </div>
    </div>
  );
}
