---
name: Lumina Compute
colors:
  surface: '#f7f9ff'
  surface-dim: '#d7dae1'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4fb'
  surface-container: '#ebeef5'
  surface-container-high: '#e5e8ef'
  surface-container-highest: '#dfe2e9'
  on-surface: '#181c21'
  on-surface-variant: '#404850'
  inverse-surface: '#2d3136'
  inverse-on-surface: '#eef1f8'
  outline: '#707881'
  outline-variant: '#bfc7d1'
  surface-tint: '#006399'
  primary: '#005d90'
  on-primary: '#ffffff'
  primary-container: '#0077b6'
  on-primary-container: '#f3f7ff'
  inverse-primary: '#94ccff'
  secondary: '#006688'
  on-secondary: '#ffffff'
  secondary-container: '#5dcafd'
  on-secondary-container: '#005370'
  tertiary: '#864a00'
  on-tertiary: '#ffffff'
  tertiary-container: '#a95f00'
  on-tertiary-container: '#fff6f1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cde5ff'
  primary-fixed-dim: '#94ccff'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#004b74'
  secondary-fixed: '#c2e8ff'
  secondary-fixed-dim: '#77d1ff'
  on-secondary-fixed: '#001e2c'
  on-secondary-fixed-variant: '#004d68'
  tertiary-fixed: '#ffdcc0'
  tertiary-fixed-dim: '#ffb877'
  on-tertiary-fixed: '#2e1600'
  on-tertiary-fixed-variant: '#6c3a00'
  background: '#f7f9ff'
  on-background: '#181c21'
  surface-variant: '#dfe2e9'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-base:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  sidebar_width: 260px
  toolbar_height: 48px
---

## Brand & Style

The design system is engineered for high-performance data science and engineering workflows. It adopts a **Premium SaaS / Minimalist** aesthetic, blending the clinical precision of a professional IDE with the refined, airy feel of high-end productivity software. 

The visual narrative focuses on "Focus and Flow." It utilizes generous whitespace, subtle depth through layered surfaces, and a strict adherence to functional clarity. Drawing inspiration from modern developer tools, the system employs high-quality typography and a restrained color palette to ensure that the user's data and code remain the primary focus, while the surrounding interface provides a sophisticated, non-intrusive frame.

## Colors

The palette is rooted in professional blues and sophisticated neutrals. 

**Light Mode:**
- The primary workspace background uses a soft blue tint (#F5F8FF) to reduce eye strain and differentiate the environment from standard white-label applications.
- Interactive surfaces and notebook cells use pure white (#FFFFFF) to provide maximum "lift" against the tinted background.
- Primary actions use the Professional Blue (#0077B6).

**Dark Mode:**
- Surfaces adopt a deep, neutral charcoal (#1E1E1E), mirroring the industry-standard IDE experience.
- Borders and dividers should use low-opacity white (approx 10-15%) to maintain definition without visual noise.

**Functional Colors:**
- **Success:** A muted emerald for successful cell execution.
- **Error:** A soft crimson for traceback information and critical alerts.

## Typography

Typography is used to establish clear hierarchy between application controls and user content.

- **UI Interface:** Use **Geist** for structural headings and **Inter** for all UI labels, inputs, and descriptions. This combination provides a technical yet approachable feel.
- **Computation:** **JetBrains Mono** is the exclusive font for code cells and terminal output. Its increased x-height and clear ligatures are optimized for long-form debugging and data reading.
- **Scaling:** On mobile/smaller viewports, display sizes should reduce by 20%, while code and body text remain constant to preserve legibility.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model:
- **Sidebars:** Fixed width (260px) for file explorers and navigation to maintain tool consistency.
- **Main Canvas:** Fluid center area where notebook cells reside. To maintain readability, the code cells should have a `max-width` of 1100px and be centered in the viewport.
- **Spacing Rhythm:** Based on a 4px baseline grid. Use 16px (md) for standard padding between UI elements and 24px (lg) for vertical separation between notebook cells.
- **Margins:** Desktop margins are set to 24px; mobile margins should retract to 16px.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Ambient Shadows**.

- **Level 0 (Base):** Workspace background (#F5F8FF).
- **Level 1 (Surface):** Sidebar and Header. No shadow, defined by a 1px solid border (#E1E8F5).
- **Level 2 (Float):** Notebook Cells and Cards. These use a very soft, diffused shadow (0px 4px 12px rgba(0, 0, 0, 0.05)) to appear lifted from the workspace.
- **Level 3 (Overlay):** Dropdowns and Modals. These utilize a higher contrast shadow and a subtle background blur (8px) to isolate the component from the complex code background.

## Shapes

The design system uses a medium-radius roundedness to balance modern friendliness with professional utility.

- **Standard Elements:** Buttons, inputs, and small cards use `rounded-md` (8px).
- **Primary Containers:** Notebook cells and the main editor container use `rounded-lg` (12px).
- **Control Elements:** Checkboxes and indicator pips use `rounded-sm` (4px).
- **Tabs:** Top corners only are rounded (6px) to maintain the "folder" metaphor.

## Components

### Notebook Cells
Cells are the core atomic unit. They are encapsulated in a white container with a 1px border. When a cell is **active**, the border color changes to Primary Blue (#0077B6) with a 2px stroke on the left edge. The cell toolbar appears on hover at the top-right corner, utilizing a subtle "glass" background blur.

### Notebook Tabs
Tabs utilize a flat design. 
- **Active:** White background, matches the editor surface, with a primary blue top-border (2px).
- **Inactive:** Transparent background, muted text, no top-border. Close icons appear only on hover.

### Sidebar Navigation
The file explorer uses a condensed vertical spacing. Folders use a glyph-based indicator (chevron). The "Active File" state uses a light blue tint (#E9F0FF) that spans the full width of the sidebar.

### Action Buttons
Buttons feature a subtle gradient transition on hover.
- **Primary (Run):** Solid Blue, shifts 10% darker on hover.
- **Secondary (Add Cell):** Transparent with a dashed border, turns solid light-blue on hover.
- **Icon Buttons:** Use a circular hover state with a 0.2s ease-in-out transition.

### Terminal Output
Terminal sections are nested below code cells. They use the `surface_dark_hex` background even in light mode, with `code-base` typography in white or light gray. This creates a clear mental model of "Execution Space" vs "Authoring Space."