# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TailAdmin Angular is a free and open-source admin dashboard template built with **Angular 20+**, **TypeScript**, and **Tailwind CSS v4**. It provides a complete set of dashboard UI components, elements, and ready-to-use pages for building modern admin panels.

## Development Commands

### Setup
```bash
npm install
```

### Development Server
```bash
npm start
# or
ng serve
```
Access at: `http://localhost:4200`

### Build
```bash
npm run build              # Production build
npm run watch              # Development build with watch mode
```

### Testing
```bash
npm test                   # Run tests with Karma
```

## Architecture

### Application Structure

This is a **standalone component-based** Angular application (no NgModules). The app uses:
- Standalone components throughout
- Functional routing configuration in `app.routes.ts`
- Signal-based state management patterns (Angular 20+)

### Core Layout System

The application uses a **nested layout architecture**:

1. **AppLayoutComponent** (`src/app/shared/layout/app-layout/app-layout.component.ts`)
   - Root layout wrapper for authenticated views
   - Orchestrates the sidebar, header, and main content area
   - Uses `SidebarService` for responsive sidebar state management
   - All dashboard pages are rendered as children of this layout

2. **AuthPageLayout** (`src/app/shared/layout/auth-page-layout/auth-page-layout.component.ts`)
   - Separate layout for authentication pages (signin/signup)
   - Not nested under AppLayoutComponent

### Routing Pattern

Routes are defined in `src/app/app.routes.ts`:
- Base path (`''`) wraps authenticated routes with `AppLayoutComponent`
- Auth routes (`/signin`, `/signup`) are standalone
- Catch-all `**` route for 404 pages

When adding new pages:
- Dashboard pages: Add as children of the base route (AppLayoutComponent wrapper)
- Auth/public pages: Add as top-level routes outside AppLayoutComponent

### State Management Services

Located in `src/app/shared/services/`:

1. **ThemeService** (`theme.service.ts`)
   - Manages light/dark theme switching
   - Uses localStorage for persistence
   - Exposes `theme$` Observable for reactive updates
   - Toggles dark class on `document.documentElement`

2. **SidebarService** (`sidebar.service.ts`)
   - Controls sidebar expanded/collapsed state
   - Manages mobile sidebar visibility
   - Handles hover states for collapsed sidebar
   - All state exposed via RxJS BehaviorSubjects

3. **ModalService** (`modal.service.ts`)
   - Global modal state management

### Component Organization

Components are organized by feature in `src/app/shared/components/`:

- **ui/**: Reusable UI primitives (button, badge, alert, dropdown, modal, table, avatar, etc.)
- **form/**: Form components (input-field, checkbox, radio, select, date-picker, time-picker, etc.)
- **common/**: Cross-cutting components (theme-toggle, breadcrumb, countdown-timer, etc.)
- **ecommerce/**: Dashboard-specific components (metrics, charts, product tables, etc.)
- **invoice/**: Invoice management components
- **transactions/**: Order and transaction components
- **user-profile/**: User profile cards
- **header/**: Header dropdowns (user, notifications)
- **tables/**: Table examples
- **charts/**: Chart implementations

### Styling Architecture

Tailwind CSS v4 is configured with:
- Custom theme tokens defined in `src/styles.css` using `@theme` directive
- Custom variants for dark mode: `@custom-variant dark (&:is(.dark *))`
- Custom utility classes for menu items, scrollbars, and component states
- Extensive third-party library styling (ApexCharts, FullCalendar, Flatpickr, Swiper)

Key custom utilities:
- `menu-item-*`: Sidebar menu styling
- `no-scrollbar` / `custom-scrollbar`: Scrollbar utilities
- `event-fc-color`: Calendar event styling

### Third-Party Integrations

The application includes:
- **@amcharts/amcharts5**: Advanced charting (maps, demographic charts)
- **apexcharts** / **ng-apexcharts**: Chart visualizations
- **@fullcalendar/angular**: Calendar component
- **flatpickr**: Date/time picker
- **swiper**: Carousel/slider components
- **prismjs**: Code syntax highlighting

## Key Development Notes

### TypeScript Configuration
- Strict mode enabled
- `isolatedModules: true` for faster compilation
- Angular-specific: `enableControlFlow: true` for new Angular control flow syntax

### Angular Build Configuration
- Uses `@angular/build:application` builder (Application builder, not browser builder)
- Output path: `dist/ng-tailadmin`
- Assets served from `public/` directory
- ApexCharts loaded globally via scripts array

### Component Development
- All components must be standalone (no NgModule declarations)
- Import `CommonModule` where structural directives are used
- Import `RouterModule` for routing directives

### Adding New Pages
1. Create component in `src/app/pages/[feature]/`
2. Add route definition in `src/app/app.routes.ts` as child of AppLayoutComponent
3. Update sidebar navigation in `app-sidebar.component.ts` if needed

### Working with the Sidebar
The sidebar expands/collapses automatically:
- Desktop: Persistent collapsed/expanded state via `SidebarService.isExpanded$`
- Mobile: Overlay mode via `SidebarService.isMobileOpen$`
- Collapsed desktop sidebar expands on hover via `isHovered$`

Main content area adjusts with margin classes:
- Expanded: `xl:ml-[290px]`
- Collapsed: `xl:ml-[90px]`
