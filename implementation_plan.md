# Implementation Plan - Dark Mode Layout and Toggle Fix

This plan details the steps to correct the Dark Mode toggle icon, verify Tailwind CSS configuration, and apply dark mode classes to the wrapper and sub-layout containers across Admin, Teacher, and Parent portals.

## User Review Required

> [!IMPORTANT]
> - **SVG Typos**: We will fix a viewport typo (`viewBox="0 0 24 2050"`) and namespace typo in `DarkModeToggle.jsx`.
> - **Tailwind CSS v4 Configuration**: We will confirm how Tailwind CSS v4 activates selector-based dark mode using `@variant dark (&:where(.dark, .dark *));` in `src/index.css`.
> - **Layout Class Updates**: We will apply Tailwind dark mode utility classes (`dark:bg-slate-950`, `dark:bg-slate-900`, etc.) to the outer wrappers, sidebars, header blocks, and navigation link selectors in `AdminLayout.jsx`, `TeacherLayout.jsx`, and `ParentLayout.jsx`.

## Proposed Changes

---

### 1. Dark Mode Toggle Component
Fix typos and style values in `DarkModeToggle.jsx`.

#### [MODIFY] [DarkModeToggle.jsx](file:///d:/quanlymamnon/frontend-web/src/components/DarkModeToggle.jsx)
- Fix typo in Sun icon: `viewBox="0 0 24 2050"` -> `viewBox="0 0 24 24"`.
- Fix typo in Sun icon namespace: `xmlns="http://www.w3.org/2050/svg"` -> `xmlns="http://www.w3.org/2000/svg"`.
- Correct styling of button class from `dark:text-slate-450` to `dark:text-slate-400` (since `slate-450` is not a valid Tailwind weight).

---

### 2. Tailwind Configuration
Confirm configuration files for dark mode activation.

#### [MODIFY] [tailwind.config.js](file:///d:/quanlymamnon/frontend-web/tailwind.config.js)
- Ensure `darkMode: "class"` is present.

#### [MODIFY] [index.css](file:///d:/quanlymamnon/frontend-web/src/index.css)
- Confirm `@variant dark (&:where(.dark, .dark *));` is defined directly below `@import "tailwindcss";` to enable selector-based class mode in Tailwind CSS v4.

---

### 3. Layout Files Dark Mode Adaptation
Ensure root layouts inherit and display dark background/text settings correctly.

#### [MODIFY] [AdminLayout.jsx](file:///d:/quanlymamnon/frontend-web/src/layouts/AdminLayout.jsx)
- Verify that root layout container, sidebar, and headers have the correct `dark:` classes.

#### [MODIFY] [TeacherLayout.jsx](file:///d:/quanlymamnon/frontend-web/src/layouts/TeacherLayout.jsx)
- Update layout container (line 213) to include `dark:bg-slate-950` to prevent the main screen from staying light.
- Fix inactive link text style (line 129) by adding `dark:text-slate-400`.

#### [MODIFY] [ParentLayout.jsx](file:///d:/quanlymamnon/frontend-web/src/layouts/ParentLayout.jsx)
- Apply dark classes to:
  - Root container: `dark:bg-slate-950 dark:text-slate-100`
  - Sidebar: `dark:bg-slate-900 dark:border-slate-800`
  - Header: `dark:bg-slate-900/80 dark:border-slate-850`
  - Inactive link: `dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-cyan-400`
  - Active link: `dark:text-cyan-400 dark:bg-cyan-950/30 dark:border-cyan-700`
  - Multi-child screens and fallback state headers/containers to match theme colors.

---

## Verification Plan

### Automated Tests
- Run `npm run build` in `frontend-web` to verify compilation.

### Manual Verification
- Test clicking the theme toggle button and confirm:
  - Visual backgrounds switch to dark slates on Admin, Teacher, and Parent portals.
  - Icons correctly show a Sun in Dark mode and Moon in Light mode.
  - Sidebars, headers, and content areas update dynamically.
