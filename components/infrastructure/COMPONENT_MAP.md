# InfrastructureView Component Map

Visual guide to the component structure, styling, and interactions.

## Component Hierarchy

```
InfrastructureView (main component)
│
├─ Header Section
│  ├─ Server Icon (lucide: Server)
│  ├─ Title "Infrastructure Monitor"
│  └─ Status Count (e.g., "3 of 4 hosts online")
│
└─ VM Grid (responsive 2-column layout)
   │
   ├─ VM Card (repeated for each VM)
   │  │
   │  ├─ Card Container
   │  │  └─ Background: #18181b
   │  │  └─ Border: #27272a
   │  │  └─ Hover: orange-500/30 border + shadow
   │  │
   │  ├─ Card Header Section
   │  │  ├─ Status Indicator Bubble
   │  │  │  ├─ Background: Green/Red tinted
   │  │  │  ├─ Icon: CheckCircle (online) or AlertCircle (offline)
   │  │  │  └─ Animated pulse dot below
   │  │  │
   │  │  ├─ VM Info Column
   │  │  │  ├─ Name (large, bold)
   │  │  │  ├─ Role (small, muted)
   │  │  │  └─ IP Address (monospace, orange/70)
   │  │  │
   │  │  ├─ Status Badge
   │  │  │  ├─ Text: "Online" or "Offline"
   │  │  │  └─ Color: Green or Red background
   │  │  │
   │  │  └─ Expand Button
   │  │     ├─ Icon: ChevronDown
   │  │     └─ Rotates 180° when expanded
   │  │
   │  ├─ Metrics Section
   │  │  │
   │  │  ├─ CPU Usage Row
   │  │  │  ├─ Icon: Cpu (14px)
   │  │  │  ├─ Label: "CPU Usage"
   │  │  │  ├─ Percentage: "45%"
   │  │  │  └─ Progress Bar
   │  │  │     ├─ Background: #27272a
   │  │  │     ├─ Foreground: Gradient
   │  │  │     │  ├─ <50%: Blue to Cyan
   │  │  │     │  ├─ 50-75%: Yellow to Orange
   │  │  │     │  └─ >75%: Red to Orange
   │  │  │     └─ Shadow: orange-500/20 glow
   │  │  │
   │  │  └─ Memory Usage Row
   │  │     ├─ Icon: HardDrive (14px)
   │  │     ├─ Label: "Memory Usage"
   │  │     ├─ Value: "6.2GB / 16GB"
   │  │     └─ Progress Bar (same as CPU)
   │  │
   │  ├─ Services Quick View Section
   │  │  ├─ Header
   │  │  │  ├─ Icon: Database
   │  │  │  └─ Label: "Services (n)"
   │  │  │
   │  │  └─ Service Pills (max 3 shown)
   │  │     ├─ Background: #27272a
   │  │     ├─ Icon: Categorized by service type
   │  │     │  ├─ Git/Code: Globe
   │  │     │  ├─ Database: Database
   │  │     │  ├─ Network: Radio
   │  │     │  ├─ AI/Bot: Zap
   │  │     │  └─ Other: Server
   │  │     ├─ Name: Service name
   │  │     └─ Hover: Border color changes to orange
   │  │
   │  │  └─ "+N more" Indicator (if services > 3)
   │  │     ├─ Background: orange-500/10
   │  │     └─ Text: "+X more" in orange
   │  │
   │  └─ [EXPANDED SECTION - collapsible]
   │     │
   │     ├─ All Services List
   │     │  └─ Full service list with:
   │     │     ├─ Service icon
   │     │     ├─ Service name
   │     │     └─ Green online indicator dot
   │     │
   │     ├─ Uptime Information
   │     │  └─ Bordered section with uptime display
   │     │
   │     └─ Action Buttons (3)
   │        ├─ Details (blue)
   │        ├─ Monitor (orange)
   │        └─ Manage (red)
   │
   └─ Empty State (if no VMs)
      ├─ Server Icon (large, muted)
      ├─ "No Infrastructure Data"
      └─ Description text
```

## Color Palette

### Backgrounds
```
Primary:      #0a0a0b (main background)
Secondary:    #111113 (alternate sections)
Cards:        #18181b (card backgrounds)
```

### Borders & Dividers
```
Standard:     #27272a
Hover/Focus:  #27272a → orange-500/30
Expanded:     orange-500/50
```

### Text
```
Primary:      #fafafa (headings, important text)
Secondary:    #71717a (labels, muted info)
Emphasis:     orange-500 (highlights, values)
```

### Status Indicators
```
Online:       #22c55e (green)
Offline:      #ef4444 (red)
Success:      #22c55e (green)
```

### Progress Bars
```
Background:   #27272a
Low (0-50%):  from-blue-500 to-cyan-500
Med (50-75%): from-yellow-500 to-orange-500
High (75%+):  from-red-500 to-orange-500
Glow:         shadow-orange-500/20
```

## Responsive Layout

```
┌─ Desktop (1200px+)
│  ┌──────────────────┐  ┌──────────────────┐
│  │   VM Card 1      │  │   VM Card 2      │
│  │  (50% width)     │  │  (50% width)     │
│  └──────────────────┘  └──────────────────┘
│  ┌──────────────────┐  ┌──────────────────┐
│  │   VM Card 3      │  │   VM Card 4      │
│  │  (50% width)     │  │  (50% width)     │
│  └──────────────────┘  └──────────────────┘
│
├─ Tablet (768px - 1200px)
│  ┌──────────────────┐  ┌──────────────────┐
│  │   VM Card 1      │  │   VM Card 2      │
│  └──────────────────┘  └──────────────────┘
│
└─ Mobile (< 768px)
   ┌──────────────────┐
   │   VM Card 1      │
   │   (100% width)   │
   └──────────────────┘
```

## Interactive States

### Card Hover
```
Before:     border-[#27272a]           shadow-none
Hover:      border-orange-500/30       shadow-lg shadow-orange-500/10
Expanded:   border-orange-500/50       shadow-lg shadow-orange-500/20
```

### Button Hover
```
Before:     bg-[#27272a]      text-[#fafafa]
Hover:      bg-[#27272a]      text-orange-500
```

### Service Icon Hover
```
Before:     text-[#71717a]
Hover:      text-orange-500 (transition: color 300ms)
```

### Expand Chevron
```
Closed:     rotate-0
Opened:     rotate-180 (transition: transform 300ms)
```

## Animation Timeline

### Page Load
```
0ms:   Fade in header
100ms: Fade in VM grid
200ms: Card entrance stagger
```

### Card Expand
```
0ms:    Chevron starts rotating
150ms:  Details section slides in (fade-in + slide-in-from-top-2)
300ms:  Animation complete
```

### Status Pulse
```
0ms:    Full opacity
1500ms: 50% opacity
3000ms: Full opacity (repeat)
```

## Typography

### Headings
```
Title (h1):     text-2xl font-bold tracking-tight
Card Title (h2): text-lg font-bold
Section (h3):   text-sm font-semibold uppercase tracking-wider
```

### Body Text
```
Normal:    text-sm text-[#fafafa]
Muted:     text-xs text-[#71717a]
Emphasis:  text-sm font-bold text-orange-500
Monospace: font-mono text-sm (for IPs, values)
```

## Spacing & Layout

### Padding
```
Container: p-6
Card:      p-4
Section:   space-y-3
Item:      px-2.5 py-1.5 (pills)
           px-3 py-2 (buttons)
```

### Gaps
```
Horizontal: gap-2, gap-3
Vertical:   space-y-2, space-y-3, space-y-4
```

### Border Radius
```
Container: rounded (default 0.25rem)
Card:      rounded-lg (0.5rem)
Buttons:   rounded-md (0.375rem)
Dots:      rounded-full
```

## Component State Matrix

```
Status         Border          Icon              Dot Color    Text Color
─────────────────────────────────────────────────────────────────────────
Online         #27272a         CheckCircle       green-500    green-500
Offline        #27272a         AlertCircle       red-500      red-500
Hover          orange-500/30   (same as status)  (animated)   (same as status)
Expanded       orange-500/50   (same as status)  (animated)   (same as status)
```

## Service Icon Mapping

```
Service Name Pattern          Icon      Color Category
──────────────────────────────────────────────────────
git, github, gitea, code      Globe     blue
postgres, sql, mysql          Database  purple
traefik, network, proxy       Radio     cyan
bot, llm, moltbot            Zap       yellow
(default)                    Server    gray
```

## Z-Index Layers

```
100   Expanded details section
10    Card borders/shadows
1     Card backgrounds
0     Page background
```

## Accessibility Features

### Color + Symbol
```
Online:  Green circle + CheckCircle icon
Offline: Red circle + AlertCircle icon
```

### Contrast Ratios (WCAG AA)
```
#fafafa on #18181b:  21:1  (AAA)
#fafafa on #27272a:  17:1  (AAA)
#71717a on #0a0a0b:  6:1   (AA)
#22c55e on #18181b:  4.5:1 (AA)
```

### Focus States
```
All buttons: outline-none with hover state
Links:       keyboard navigable with underline
Icons:       hover color changes visible
```

## Performance Optimizations

### Memoization
- Component is lightweight, no memoization needed
- Consider wrapping if props rarely change

### Re-renders
- Only re-renders on vm prop change
- Expand state is local

### Animations
- GPU-accelerated (transform, opacity)
- 300ms durations (standard)

## Browser Support

```
Chrome:   Latest 2 versions
Firefox:  Latest 2 versions
Safari:   Latest 2 versions
Edge:     Latest 2 versions

CSS Features Used:
- Grid layout (IE 11+)
- Gradients (IE 10+)
- Animations (IE 10+)
- Flex layout (IE 11+)
```

## Dark Mode Consideration

```
Component is dark-first (dark mode native)
For light mode adaptation, create light theme variant:

Primary:      #ffffff / #f5f5f5
Secondary:    #f0f0f0
Cards:        #fafafa
Borders:      #e0e0e0
Text:         #000000 / #333333
Status Online:  #16a34a (darker green)
Status Offline: #dc2626 (darker red)
```

---

**Last Updated**: 2026-01-30
**Component Version**: 1.0.0
**Tailwind Version**: 3.3.0+
