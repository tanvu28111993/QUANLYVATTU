import React, { Suspense, lazy, useState, useEffect } from 'react';
import { MenuId } from '../../types';
import { ModuleLoader } from '../UI/ModuleLoader';
import { ErrorBoundary } from '../UI/ErrorBoundary';
import { KEEP_ALIVE_MENUS } from '../../utils';

// --- Code Splitting (Lazy Loading) ---
const Overview = lazy(() => import('../Dashboard/Overview').then(m => ({ default: m.Overview })));
const PaperLocation = lazy(() => import('../Dashboard/PaperLocation').then(m => ({ default: m.PaperLocation })));

// Updated paths to standardized folder structure
const InventoryManager = lazy(() => import('../Modules/Inventory/InventoryManager').then(m => ({ default: m.InventoryManager })));
const MaterialManager = lazy(() => import('../Modules/Material/MaterialManager').then(m => ({ default: m.MaterialManager })));
const ReferenceManager = lazy(() => import('../Modules/Reference/ReferenceManager').then(m => ({ default: m.ReferenceManager })));
const ExpectedSchedule = lazy(() => import('../Modules/Schedule/ExpectedSchedule').then(m => ({ default: m.ExpectedSchedule })));

// Optimization: Define route map statically outside component
// This prevents object recreation on every render and keeps the component pure
const ROUTE_COMPONENTS: Partial<Record<MenuId, React.LazyExoticComponent<React.FC>>> = {
  OVERVIEW: Overview,
  PAPER_LOCATION: PaperLocation,
  INVENTORY: InventoryManager,
  REFERENCE: ReferenceManager,
  EXPECTED_SCHEDULE: ExpectedSchedule,
  
  // Configured Material Inventory
  MATERIAL_INVENTORY: MaterialManager, 
};

interface ContentRouterProps {
  currentMenu: MenuId;
}

export const ContentRouter: React.FC<ContentRouterProps> = React.memo(({ currentMenu }) => {
  const Component = ROUTE_COMPONENTS[currentMenu];
  
  // Track which menus have been visited to lazy load them
  const [visitedMenus, setVisitedMenus] = useState<Set<MenuId>>(new Set([currentMenu]));

  useEffect(() => {
    setVisitedMenus(prev => {
      if (prev.has(currentMenu)) return prev;
      const next = new Set(prev);
      next.add(currentMenu);
      return next;
    });
  }, [currentMenu]);

  return (
    <>
      {Array.from(visitedMenus).map(menuId => {
        const Component = ROUTE_COMPONENTS[menuId];
        if (!Component) return null;

        // Determine visibility
        const isActive = currentMenu === menuId;

        return (
          <div 
            key={menuId} 
            className={isActive ? 'h-full flex-1 flex flex-col min-h-0' : 'hidden'}
            // Optimization: Use content-visibility to skip rendering work when hidden
            style={!isActive ? { contentVisibility: 'hidden' } : undefined}
          >
            <Suspense fallback={<ModuleLoader />}>
              <ErrorBoundary resetKey={menuId}>
                <Component />
              </ErrorBoundary>
            </Suspense>
          </div>
        );
      })}
    </>
  );
});