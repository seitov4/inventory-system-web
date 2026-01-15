# Design System Documentation

## Overview

This document describes the design system principles and component architecture for the Inventory Management System frontend. The design system prioritizes visual consistency, maintainability, and scalability.

---

## DashboardCard Component

### Purpose

`DashboardCard` is the **unified base component** for all dashboard blocks. It provides a consistent visual structure and behavior across the entire dashboard interface.

### Why a Single Base Card?

Using a single base component ensures:

- **Visual Consistency**: All dashboard blocks share the same visual language
- **Maintainability**: Changes to card styling are centralized
- **Scalability**: Adding new dashboard blocks is trivial and predictable
- **Design Cohesion**: The dashboard feels like a unified product, not a collection of custom blocks

### Component Location

```
frontend/src/components/UI/DashboardCard.jsx
```

---

## Props API

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Card title displayed in the header |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `"metric" \| "status" \| "chart" \| "info"` | `"metric"` | Card content type |
| `size` | `"small" \| "medium" \| "large"` | `"small"` | Fixed card height |
| `value` | `string \| number` | - | Main value (for metric/status types) |
| `description` | `string` | - | Meta text displayed below content |
| `badge` | `{ text: string, variant?: "default" \| "success" \| "warning" \| "error" }` | - | Badge displayed in header |
| `statusColor` | `string` | - | Color for status type (green/yellow/red) |
| `onClick` | `function` | - | Makes card clickable with hover effects |
| `children` | `ReactNode` | - | Custom content (for chart/info types) |
| `footer` | `ReactNode` | - | Optional footer section |

---

## Card Types

### Metric (`type="metric"`)

**Purpose**: Display numeric values and statistics.

**Usage**: Sales totals, counts, percentages.

**Example**:
```jsx
<DashboardCard
    type="metric"
    size="small"
    title="Sales today"
    value="2 800 ₸"
    description="Based on /sales/daily"
/>
```

**Visual Behavior**:
- Numeric value is vertically centered in the content area
- Description appears as meta text below

---

### Status (`type="status"`)

**Purpose**: Display system health or status indicators.

**Usage**: Backend status, database health, system notifications.

**Example**:
```jsx
<DashboardCard
    type="status"
    size="small"
    title="Backend status"
    value="OK"
    statusColor="#22c55e"
    description="All systems operational"
/>
```

**Visual Behavior**:
- Status value uses `statusColor` for visual indication
- Green = OK/success, Yellow = Warning, Red = Error

---

### Chart (`type="chart"`)

**Purpose**: Display data visualizations and graphs.

**Usage**: Sales trends, growth charts, mini sparklines.

**Example**:
```jsx
<DashboardCard
    type="chart"
    size="large"
    title="Mini sales chart (last days)"
>
    <MiniChart>
        {/* Chart visualization */}
    </MiniChart>
</DashboardCard>
```

**Visual Behavior**:
- Content area contains custom chart components
- Chart content starts from top of content area

---

### Info (`type="info"`)

**Purpose**: Display informational content, navigation widgets, or explanatory text.

**Usage**: Navigation cards, help sections, system information.

**Example**:
```jsx
<DashboardCard
    type="info"
    size="medium"
    title="Sales & trends"
    badge={{ text: "Analytics", variant: "default" }}
    onClick={() => navigateToSales()}
>
    <WidgetText>
        Open sales analytics by day, week and month.
    </WidgetText>
</DashboardCard>
```

**Visual Behavior**:
- Custom content via `children`
- Can be clickable via `onClick`
- Badge typically indicates category or status

---

## Card Sizes

All card sizes use **fixed heights** to ensure grid stability and visual alignment.

| Size | Height | Use Case |
|------|--------|----------|
| `small` | 120px | Metric cards, status indicators |
| `medium` | 160px | Info cards, navigation widgets |
| `large` | 220px | Chart cards, detailed visualizations |

**Important**: Card height is fixed, not minimum. Content must adapt to the card, not vice versa.

---

## Design Rules

### 1. Mandatory Structure

**ALL** `DashboardCard` instances MUST follow this exact structure:

```
<CardWrapper>
  <CardHeader>          // Title + Badge (fixed)
  <CardContent>         // Main content (flex: 1)
  <CardMeta>            // Description (if provided)
  <CardFooter>          // Footer (optional)
</CardWrapper>
```

**No exceptions**. Differences between cards are **semantic** (content type), not **structural** (layout).

---

### 2. Grid Controls Layout

- Dashboard grid containers control card positioning
- Cards themselves do NOT control their position
- All cards in the same grid row have identical heights
- Grid uses `align-items: stretch` to ensure height consistency

---

### 3. Meta Text Anchoring

- `description` (CardMeta) is **always** rendered after CardContent
- Meta text is visually anchored to the bottom of the card
- Meta text does NOT affect content area height
- Meta text appears for ALL card types when `description` prop is provided

---

### 4. Visual Consistency Priority

**Visual consistency is prioritized over custom styling.**

- No custom card layouts allowed
- No one-off styles per card
- No special snowflakes
- If a card looks different, it is WRONG

---

### 5. Content Alignment

- **Metric cards**: Content is vertically centered (`justify-content: center`)
- **All other types**: Content starts from top (`justify-content: flex-start`)
- Internal spacing uses consistent `gap: 6px` between elements

---

## Usage Guidelines

### When to Use DashboardCard

✅ **Use DashboardCard for**:
- All dashboard metric displays
- System status indicators
- Data visualizations
- Navigation widgets
- Informational blocks

❌ **Do NOT**:
- Create custom card components
- Override DashboardCard styles
- Use different card structures
- Mix DashboardCard with custom layouts

---

### Adding a New Dashboard Block

1. Determine the appropriate `type` (metric/status/chart/info)
2. Choose the appropriate `size` (small/medium/large)
3. Use `DashboardCard` with required props
4. Place in the appropriate grid container
5. **Do not** create custom styling

**Example**:
```jsx
<DashboardCard
    type="metric"
    size="small"
    title="New Metric"
    value={calculatedValue}
    description="Source: /api/metrics"
/>
```

---

## Implementation Details

### Internal Spacing

- Header margin-bottom: `8px`
- Content gap: `6px` (between elements)
- Meta margin-top: `4px`
- Footer margin-top: `8px`

### Typography Scale

- Card title: `12px`, muted color
- Main value: `24px`, bold
- Description/meta: `11px`, secondary color
- Badge text: `10px`

### Color Usage

- **Color is used ONLY for status**
- Green → OK/success
- Yellow → Warning
- Red → Error
- Do NOT use color for decoration or differentiation

---

## Architecture Benefits

### Maintainability

- Single source of truth for card styling
- Changes propagate automatically to all cards
- Reduced code duplication

### Scalability

- Adding new dashboard blocks is trivial
- Grid structure remains predictable
- No need to design new card layouts

### Design Cohesion

- Dashboard feels like a unified product
- Visual language is consistent
- Professional, systematic appearance

---

## Code Review Checklist

When reviewing dashboard-related code:

- [ ] All dashboard blocks use `DashboardCard`
- [ ] No custom card components exist
- [ ] Card structure follows the mandatory pattern
- [ ] Grid containers use `align-items: stretch`
- [ ] Card heights are fixed (not minimum)
- [ ] Meta text is always in the same position
- [ ] No inline styles override card behavior

---

## Future Considerations

### Extending the System

If new card types are needed:

1. **Evaluate first**: Can existing types handle the use case?
2. **If new type is needed**: Add to `type` prop enum
3. **Maintain structure**: New type must follow the same structure
4. **Update documentation**: Document the new type here

### Breaking Changes

Any changes to `DashboardCard` structure or API must:
- Be backward compatible
- Maintain visual consistency
- Be documented in this file
- Be reviewed for impact on all dashboard blocks

---

## References

- Component: `frontend/src/components/UI/DashboardCard.jsx`
- Usage: `frontend/src/pages/Dashboard/DashboardPage.jsx`
- Related: Grid layouts, theme variables

---

**Last Updated**: 2025-01-29  
**Version**: 1.0  
**Status**: Stable

