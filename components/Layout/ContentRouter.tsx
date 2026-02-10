import React, { Suspense, lazy } from 'react';
import { MenuId } from '../../types';
import { ModuleLoader } from '../UI/ModuleLoader';
import { ErrorBoundary } from '../UI/ErrorBoundary';

// --- Code Splitting (Lazy Loading) ---
const Overview = lazy(() => import('../Dashboard/Overview').then(m => ({ default: m.Overview })));

// Updated paths to standardized folder structure
const LocationManager = lazy(() => import('../Modules/Locations/LocationManager').then(m => ({ default: m.LocationManager })));
const InventoryManager = lazy(() => import('../Modules/Inventory/InventoryManager').then(m => ({ default: m.InventoryManager })));
const MaterialManager = lazy(() => import('../Modules/Material/MaterialManager').then(m => ({ default: m.MaterialManager })));
const ReferenceManager = lazy(() => import('../Modules/Reference/ReferenceManager').then(m => ({ default: m.ReferenceManager })));
const PaperCalculationManager = lazy(() => import('../Modules/PaperCalculation/PaperCalculationManager').then(m => ({ default: m.PaperCalculationManager })));

// Optimization: Define route map statically outside component
// This prevents object recreation on every render and keeps the component pure
const ROUTE_COMPONENTS: Partial<Record<MenuId, React.LazyExoticComponent<React.FC>>> = {
  OVERVIEW: Overview,
  LOCATIONS: LocationManager,
  INVENTORY: InventoryManager,
  REFERENCE: ReferenceManager,
  PAPER_CALCULATION: PaperCalculationManager,
  
  // Configured Material Inventory
  MATERIAL_INVENTORY: MaterialManager, 
  
  // Placeholder
  MATERIAL_LOCATIONS: LocationManager, 
};

interface ContentRouterProps {
  currentMenu: MenuId;
}

export const ContentRouter: React.FC<ContentRouterProps> = React.memo(({ currentMenu }) => {
  const Component = ROUTE_COMPONENTS[currentMenu];

  return (
    <Suspense fallback={<ModuleLoader />}>
      <ErrorBoundary resetKey={currentMenu}>
        {Component ? <Component /> : null}
      </ErrorBoundary>
    </Suspense>
  );
});