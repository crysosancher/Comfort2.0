# Comfort — Indian Train Seat Availability & Explorer

A React-based web application for exploring Indian train seat availability, coach layouts, and recommended seats across different classes and dates.

---

## Use Case

Imagine you're planning a train journey in India. You want to travel from **Mumbai (CSMT)** to **Goa (VSG)** on **25th May 2026** but you're unsure which train to take or whether seats are available. Comfort helps you:

1. **Search trains** between two stations for a specific date
2. **Explore seat availability** across all coach classes (SL, 3A, 2A, 1A, CC, EC)
3. **View coach layouts** — see exactly which seats are available, side upper, side lower, cabin positions
4. **Get seat recommendations** — the app suggests the best seats based on cabin position, proximity to exits/entrances, and seat type preferences
5. **Share train details** with friends via a shareable link

### Example Flow

1. **Home Page**: Select "CSMT" as source and "VSG" as destination. Choose 25 May 2026. Click Search.
2. **Results Page**: You see a list of trains with seat availability. You pick train 01002 — Konkan Kanya Express.
3. **Train Details Page**: You explore SL class, see a visual seat map. The app highlights recommended seats (e.g., `55, 56` — side lower, near entrance). You share the link with your travel partner.
4. **Return Home**: You explore return trains via the Return tab.

---

## Application Features

| Feature | Description |
|---|---|
| Station Search | Autocomplete station selection with IR station codes |
| Date Navigation | Browse previous/next days without reloading |
| Class Comparison | View seat availability across all coach types |
| Visual Coach Map | Interactive seat layout per coach class |
| Seat Recommendations | Algorithmic suggestions based on seat position preferences |
| Shareable Links | Generate URLs that encode train, date, and route for sharing |
| Dark Mode | Theme toggle (light/dark) |

---

## UI/UX Improvements Required

Below are targeted improvements that would significantly enhance the user experience:

### 1. Visual & Design

- **Consistent spacing and alignment** — use a CSS Grid or Flexbox layout system to ensure uniform padding/margins across pages
- **Better color contrast for accessibility** — especially in dark mode; verify all text meets WCAG AA contrast ratios
- **Loading skeletons** — replace spinner-only loading states with skeleton screens for train lists and seat maps
- **Responsive mobile layout** — many components are desktop-biased; ensure full usability on 320px–375px screens

### 2. Seat Map Improvements

- **Seat legend** — always visible guide showing what each color/badge means (Available, Rebooked, RAC, Waitlist)
- **Zoom/pan controls** — for larger coaches, allow pinch-to-zoom or a zoom slider
- **Touch targets** — increase tap area for mobile seats (minimum 44×44px)
- **Coach切换 tabs** — replace dropdown with tab-style switching when browsing multiple classes

### 3. Navigation & Flow

- **Breadcrumb navigation** — show "Home > Results > Train Details" trail on Train Details page
- **Back button behavior** — preserve search state (date, from/to stations) so back-navigation doesn't lose context
- **Sticky headers on mobile** — keep search filters visible while scrolling results

### 4. Information & Feedback

- **Empty state illustrations** — when no trains found or no seats available, show friendly illustrations + actionable messages
- **Error messages** — replace technical errors with plain-language messages (e.g., "No trains found for this route on this date" instead of a raw API error)
- **Seat tooltip on hover** — show seat details (seat number, type, price) when hovering over a seat

### 5. Performance

- **Lazy load seat maps** — only load coach map when user selects a class, not upfront
- **Debounce station search** — prevent excessive API calls while typing station names
- **Cache recent searches** — store last 5 search results in localStorage for quick revisit

---

## Tech Stack

- **React 18** — UI framework
- **React Router v6** — routing
- **React Scripts (CRA)** — build tooling
- **Axios** — HTTP client
- **CSS Modules** — scoped styling

## Getting Started

```bash
npm install
npm start
```

---

*Project maintained by CRYSO Media — https://www.crysomedia.com/*