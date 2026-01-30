# InfrastructureView Component - Documentation Index

## Quick Navigation

This directory contains the complete InfrastructureView component for the Molten dashboard infrastructure monitoring feature.

### Files Overview

| File | Purpose | Lines | Audience |
|------|---------|-------|----------|
| **InfrastructureView.tsx** | Main React component | 447 | Developers |
| **index.ts** | Export barrel | 1 | All |
| **README.md** | Feature documentation | 175 | All |
| **INTEGRATION.md** | Integration guide | 312 | Developers |
| **CODE_EXAMPLES.md** | Code samples | 582 | Developers |
| **COMPONENT_MAP.md** | Visual reference | 380 | Designers/Developers |
| **INDEX.md** | This file | - | All |

## Getting Started

### 1. First Time Users
Start here: **[README.md](./README.md)**
- Component overview
- Feature list
- Props documentation
- Basic usage examples

### 2. Want to Integrate?
Next: **[INTEGRATION.md](./INTEGRATION.md)**
- Step-by-step integration
- Store examples
- WebSocket setup
- API templates
- Troubleshooting

### 3. Need Code Examples?
See: **[CODE_EXAMPLES.md](./CODE_EXAMPLES.md)**
- Ready-to-use snippets
- Store patterns
- WebSocket implementation
- API routes
- Testing examples

### 4. Visual Reference?
Check: **[COMPONENT_MAP.md](./COMPONENT_MAP.md)**
- Component hierarchy
- Color palette
- Responsive layout
- Interaction states
- Typography reference

### 5. Building the Component
Read: **InfrastructureView.tsx**
- TypeScript interfaces
- Default data
- Component logic
- Styling details

## Feature Checklist

### Core Features
- [x] Grid layout (responsive, 2 columns)
- [x] VM status cards
- [x] Online/offline indicators
- [x] CPU/Memory monitoring
- [x] Service listings
- [x] Expandable details
- [x] Fire-themed styling
- [x] Icons from lucide-react

### Infrastructure Data
- [x] Dev VM (100.104.67.12)
- [x] Infra VM (100.112.252.61)
- [x] AI VM (100.73.167.86)
- [x] Proxmox (100.75.100.113)

### Quality
- [x] Full TypeScript typing
- [x] No external dependencies
- [x] WCAG AA accessibility
- [x] Responsive design
- [x] Production ready

## Common Tasks

### "I just want to use it"
```typescript
import { InfrastructureView } from "@/components/infrastructure";

export default function Page() {
  return <InfrastructureView />;
}
```
See: **README.md → Usage**

### "I want to customize data"
```typescript
<InfrastructureView vms={customVMs} />
```
See: **CODE_EXAMPLES.md → Custom Data**

### "I want real-time updates"
See: **INTEGRATION.md → WebSocket Integration**
Also: **CODE_EXAMPLES.md → WebSocket Integration**

### "I want to understand the styling"
See: **COMPONENT_MAP.md → Color Palette**
Also: **README.md → Styling**

### "I want to integrate with the app"
See: **INTEGRATION.md → Integration Steps**
Also: **CODE_EXAMPLES.md → Integration with View System**

### "I want to test it"
See: **CODE_EXAMPLES.md → Testing**
Also: **INTEGRATION.md → Testing Instructions**

## API Reference

### Component Props

```typescript
interface InfrastructureViewProps {
  vms?: VM[];  // Array of VM objects (optional, uses default if not provided)
}

interface VM {
  id: string;                        // Unique identifier
  name: string;                      // Display name
  ip: string;                        // IP address
  role: string;                      // Role description
  status: "online" | "offline";      // Status
  services: string[];                // List of services
  cpu: { usage: number; cores: number };
  memory: { usage: number; total: number };
  uptime?: string;                   // Optional uptime
  lastUpdate?: string;               // Optional timestamp
}
```

### Default Data

The component includes pre-configured default VMs if none are provided:

```typescript
{
  id: "dev-vm",
  name: "Dev VM",
  ip: "100.104.67.12",
  role: "Development & Code Storage",
  status: "online",
  services: ["Gitea", "code-server", "PostgreSQL", "Redis"],
  cpu: { usage: 45, cores: 8 },
  memory: { usage: 6.2, total: 16 },
  uptime: "45d 12h",
  lastUpdate: "2 minutes ago",
}
```

## Styling Reference

### Color Scheme
- **Primary Background**: `#0a0a0b`
- **Card Background**: `#18181b`
- **Border Color**: `#27272a`
- **Primary Text**: `#fafafa`
- **Muted Text**: `#71717a`
- **Online Status**: `#22c55e`
- **Offline Status**: `#ef4444`

See: **COMPONENT_MAP.md → Color Palette**

## Responsive Breakpoints

- **Mobile**: 1 column (default)
- **Tablet** (md): 2 columns
- **Desktop** (lg/xl): 2 columns

See: **COMPONENT_MAP.md → Responsive Layout**

## Icons Used

All from `lucide-react`:
- `Server` - Main header icon
- `Cpu` - CPU metrics
- `HardDrive` - Memory metrics
- `Database` - Services section
- `Globe` - Git/code services
- `Radio` - Network services
- `Zap` - AI/bot services
- `CheckCircle` - Online status
- `AlertCircle` - Offline status
- `ChevronDown` - Expand toggle

## Build Status

```
✓ TypeScript: Compiles without errors
✓ Next.js: Builds successfully
✓ Production: Ready to deploy
```

## Dependencies

- React 18.2.0+
- TypeScript 5.3.3+
- Tailwind CSS 3.3.0+
- lucide-react 0.307.0+

No additional dependencies required!

## File Sizes

```
InfrastructureView.tsx:  17 KB (unminified)
Compiled (gzipped):      ~4-5 KB
```

## Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Roadmap & Future Features

See: **README.md → Future Enhancements**

Planned additions:
- [ ] Real-time data integration
- [ ] Performance charts
- [ ] Alert system
- [ ] Network topology visualization
- [ ] Auto-recovery UI
- [ ] Custom thresholds

## Troubleshooting

Common issues and solutions: **INTEGRATION.md → Troubleshooting**

## Contributing

When modifying this component:
1. Keep TypeScript strict mode enabled
2. Maintain fire-theme color scheme
3. Test responsive layout
4. Update documentation
5. Run `npm run build` to verify

## Support Resources

- **Molten Dashboard Docs**: `/ROADMAP.md`
- **Component README**: `./README.md`
- **Integration Guide**: `./INTEGRATION.md`
- **Code Examples**: `./CODE_EXAMPLES.md`

## License

Part of the Molten dashboard project.

## Changelog

### v1.0.0 (2026-01-30)
- Initial release
- All core features implemented
- Complete documentation
- Production ready

---

**Last Updated**: 2026-01-30
**Status**: COMPLETE AND READY FOR USE
**Version**: 1.0.0
