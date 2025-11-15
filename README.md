# BundleComposer

A lightweight demo application that explores editing complex, interrelated data structures for a ficticious streaming service (Plans, Bundles, Channels) using a modern React toolchain. The user selects a series of streaming Plans for bulk editing, which are then opened in an editor that allows changing of Plan, Bundle, and Channel properties, as well as add or remove Bundles to and from Plans, as well as add or remove Channels from both Plans or Bundles. Users can make structured updates across multiple pages with validation and diff-tracking.

This project exists as an example of building maintainable, data-heavy UIs with strong patterns and modern tooling.

---

## Tech Stack

- **React 18**
- **TypeScript**
- **Vite** for fast local dev
- **pnpm** for workspace / dependency management
- **Redux Toolkit** for draft/patch state
- **React Query** for data fetching + caching
- **@tanstack/virtual** for virtualized lists
- **Tailwind CSS** for utility-first styling
- **shadcn/ui + Radix UI** for accessible components
- **Fastify** (mock API server) for data simulation

---

## What This Demo Shows

### 1. Multi-page editing flow

Plans have multiple “update pages” (properties, channels, bundles, etc.). Each page tracks its own dirty state and validates before allowing navigation.

### 2. Structured diff-based state management

Edits don’t mutate the original data. Instead, the UI captures _patches_ per entity type (plan, bundle, channel) and merges them live into the display. This keeps the UI predictable, undoable, and easy to inspect.

### 3. Virtualized list rendering

Large lists of plans render smoothly via `@tanstack/virtual`, with custom row cards, row-spanning cells, and dynamic resizing.

### 4. Radix-powered UI with custom select menus

Reusable components (`Select`, row cards, picklists, etc.) are styled to float above virtualized content and behave consistently.

### 5. Mock API and data generation

The built-in Fastify server generates mock plans, bundles, and channels on the fly. The front end reads these via React Query hooks and merges local draft edits.

---

## Getting Started

### Prerequisites

- Node 20+
- pnpm 9+

### Install

```bash
pnpm install
```

### Run Dev

Run API and web together:

```bash
pnpm dev
```

or separately:

```bash
pnpm dev:api     # Fastify mock server on 5175
pnpm dev:web     # React app on 3000 (Vite)
```

### Build

```bash
pnpm build
```

### Project Structure

```bash
/src
  /app         # React app, routing, layouts, components
  /server      # Fastify mock API
  /features    # Plan/Bundle/Channel editing logic
  /components  # Shared UI components
  /hooks       # Custom hooks (query, memoized logic, etc.)
  /styles      # Tailwind / global CSS
  /types       # Zod schemas & TS types
```

### Why This Project Exists

### This project showcases:

- **clean state modeling**
- **predictable diff-based editing**
- **reusable UI primitives**
- **separation of concerns**
- **virtualized, data-intensive UI patterns**
- **a well-structured React + TypeScript architecture**

### License

MIT
