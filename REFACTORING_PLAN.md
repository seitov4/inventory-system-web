# Monolith Refactoring Plan - Detailed Analysis

## Executive Summary
The codebase contains 5 large monolithic files that mix UI, state management, business logic, and data access. This plan breaks each into focused modules while preserving behavior and API contracts.

---

## Part 1: Frontend Analysis

### ProductsPage.jsx (~1164 lines)

**Current Structure (Mixed Concerns):**
- ~30 styled components (Th, Td, Form, Button variants)
- 13 useState hooks managing: products, stock, form, filters, inline edit, modals
- 1 main useEffect for initialization
- 15+ event handlers (create, update, delete, edit, filter, search)
- 2 large mock data arrays embedded
- Logic: API calls → normalization → filtering → UI display

**Zones Identified:**
1. **Styled Components** (lines 8-589): Pure presentation
2. **Mock Data** (lines 431-589): Constants
3. **Main Component** (lines 590-1164): State + handlers + render

**Refactoring Target:**

```
frontend/src/
  pages/Products/
    ProductsPage.jsx          ← ~200 lines (page shell + layout)
  hooks/
    useProducts.js            ← ~150 lines (data fetching, product state)
    useProductFilters.js      ← ~80 lines (filter state, filtered products)
    useProductForm.js         ← ~120 lines (create/update form state)
    useProductInlineEdit.js   ← ~80 lines (inline edit state)
  components/Products/
    ProductsPageHeader.jsx    ← ~40 lines (title, buttons)
    ProductsFormPanel.jsx     ← ~150 lines (create/edit form)
    ProductsTable.jsx         ← ~100 lines (table structure)
    ProductsTableRow.jsx      ← ~80 lines (single row, actions)
    ProductsFilters.jsx       ← ~60 lines (search, filter chips)
  styles/
    ProductsPage.styles.js    ← ~400 lines (all styled components)
  constants/
    products.const.js         ← mock data, statuses, filters
```

**Breakdown Strategy:**
1. Extract styled components → styles file
2. Extract mock data → constants
3. Split useState into separate hooks (SRP)
4. Extract render sections into presentational components
5. Remove business logic from event handlers (move to hooks)

**Risks:** Medium
- Form state management complexity
- Inline edit state mutations
- Filter + search + sort combinations
- Optimistic updates

**Mitigation:**
- Keep API contracts identical
- Test filters and form submissions
- DOM structure unchanged

---

### SettingsPage.jsx (~1124 lines)

**Current Structure:**
- Tab-based UI (5+ tabs, each with different content)
- Multiple form sections (profile, password, notifications, etc.)
- Master / detail relationships
- Mixed state for multiple concerns
- Heavy styling embedded

**Zones Identified:**
1. **Styles & Animations** (lines 1-80)
2. **Tab definitions & state** (lines 100-150)
3. **Each tab's content** (mixed throughout)
4. **Global state/loading/error** (scattered)

**Refactoring Target:**
```
frontend/src/
  pages/Settings/
    SettingsPage.jsx          ← ~100 lines (tabs shell)
  hooks/
    useSettingsTabs.js        ← tab state, navigation
    useProfileSettings.js     ← profile data, update
    usePasswordSettings.js    ← password change logic
    useNotificationSettings.js ← notification prefs
  components/Settings/
    SettingsTabsNavigation.jsx
    SettingsProfileTab.jsx
    SettingsPasswordTab.jsx
    SettingsNotificationsTab.jsx
  styles/
    SettingsPage.styles.js    ← all styled components
```

**Risks:** Medium-High
- Tab navigation state
- Form validation across tabs
- Async data loading for each tab
- Settings consistency

---

### ReconciliationPage.jsx (~630 lines)

**Current Structure:**
- Complex reconciliation workflow
- Multi-step process (select items → match → confirm)
- Grid of items with selection/matching UI
- State for selections, filters, operations

**Refactoring Target:**
```
frontend/src/
  pages/Reconciliation/
    ReconciliationPage.jsx         ← page shell
  hooks/
    useReconciliation.js           ← core reconciliation state
    useReconciliationItemSelection.js ← selections
    useReconciliationMatching.js   ← matching logic
  components/Reconciliation/
    ReconciliationWorkflow.jsx
    ReconciliationItemsGrid.jsx
    ReconciliationMatchingPanel.jsx
  styles/
    ReconciliationPage.styles.js
```

---

## Part 2: Backend Analysis

### movements.service.js (~405 lines)

**Current Structure (Transaction Duplication):**
- 3 similar transaction blocks: createMovementIn, createMovementOut, createMovementTransfer
- Repeated patterns:
  ```
  BEGIN
  SELECT ... FOR UPDATE (lock stock)
  UPDATE stock
  INSERT movement
  COMMIT / ROLLBACK
  ```
- Validation scattered
- No separation: domain rules vs. data access

**Zones Identified:**
1. **Transaction orchestration** (shared logic)
2. **Stock validation & mutation** (business rules)
3. **Movement creation** (data access)

**Refactoring Target:**
```
backend/src/
  domain/
    stockAdjustment.js        ← stock domain rules
      - validateStockChange()
      - calculateNewQuantity()
      - checkSufficientStock()
  repositories/
    stockRepository.js        ← stock queries/mutations
      - lockAndGetStock()
      - updateStock()
  repositories/
    movementRepository.js     ← movement queries/mutations
      - insertMovement()
      - getMovementsByProduct()
  services/
    movements.service.js      ← ~100 lines (orchestration only)
      - createMovementIn()     ← reuses domain + repo
      - createMovementOut()    ← reuses domain + repo
      - createMovementTransfer() ← reuses domain + repo
```

**Risks:** High
- Transaction correctness is critical
- Distributed mutations
- Lock behavior changes
- Race conditions if refactored incorrectly

**Mitigation:**
- Isolated unit tests for each layer
- Integration tests for transactions
- No SQL changes, only organizational
- Rollback plan: revert to monolith if issues

---

### products.service.js (~398 lines)

**Current Structure (Scattered Helpers + Queries):**
- Helper functions scattered: validateProductData, checkSkuExists, checkBarcodeExists, getDefaultWarehouse
- Query functions: getAllProducts, getProductById, getProductsWithLeft, getLowStockProducts
- Create/update/delete mixed with helpers
- No clear layering

**Zones Identified:**
1. **Validation rules** (pure functions)
2. **Uniqueness checks** (database queries)
3. **Product queries** (SELECT patterns)
4. **Product mutations** (INSERT/UPDATE)

**Refactoring Target:**
```
backend/src/
  domain/
    productValidation.js      ← validation rules
      - validateProductData()
      - validateProductPrices()
      - validateProductFields()
  repositories/
    productRepository.js      ← all product queries/mutations
      - getAllProducts()
      - getProductById()
      - getProductsWithLeft()
      - getLowStockProducts()
      - createProduct()
      - updateProduct()
      - deleteProduct()
      - checkSkuExists()
      - checkBarcodeExists()
  domain/
    productQueries.js         ← query builders (if needed)
  services/
    products.service.js       ← ~50-100 lines (orchestration)
      - compose validation + repository calls
```

**Risks:** Low-Medium
- Query patterns unchanged
- Validation stays same
- Database behavior identical

---

## Part 3: Implementation Plan

### Phase 1: Backend (Low Risk, High Value)

**1.1: Create Domain Layer**
- [ ] Create `backend/src/domain/stockAdjustment.js`
- [ ] Create `backend/src/domain/productValidation.js`
- [ ] Move validation functions
- [ ] Add unit tests for each

**1.2: Create Repository Layer**
- [ ] Create `backend/src/repositories/stockRepository.js`
- [ ] Create `backend/src/repositories/movementRepository.js`
- [ ] Move data access functions
- [ ] Move product queries → `backend/src/repositories/productRepository.js`

**1.3: Refactor Services**
- [ ] Update `movements.service.js` (remove duplicated logic, use repos)
- [ ] Update `products.service.js` (use productRepository)
- [ ] Verify API contracts unchanged
- [ ] Update imports in controllers

**1.4: Test**
- [ ] Unit tests for domain layer
- [ ] Integration tests for transaction behavior
- [ ] Smoke tests against /api/platform and regular routes
- [ ] Manual testing of complex scenarios

---

### Phase 2: Frontend (Medium Risk, High Value)

**2.1: ProductsPage - Extract Constants & Styles**
- [ ] Create `frontend/src/pages/Products/constants.js` (mock data, statuses)
- [ ] Create `frontend/src/pages/Products/styles.js` (all styled components)
- [ ] Update ProductsPage imports

**2.2: ProductsPage - Extract Hooks**
- [ ] Create `frontend/src/hooks/useProducts.js` (fetch, load all)
- [ ] Create `frontend/src/hooks/useProductFilters.js` (filter state & logic)
- [ ] Create `frontend/src/hooks/useProductForm.js` (form state & handlers)
- [ ] Create `frontend/src/hooks/useProductInlineEdit.js` (inline edit state)
- [ ] Update ProductsPage to use hooks

**2.3: ProductsPage - Extract Components**
- [ ] Create `frontend/src/components/Products/ProductsPageHeader.jsx`
- [ ] Create `frontend/src/components/Products/ProductsFormPanel.jsx`
- [ ] Create `frontend/src/components/Products/ProductsTable.jsx`
- [ ] Create `frontend/src/components/Products/ProductsTableRow.jsx`
- [ ] Create `frontend/src/components/Products/ProductsFilters.jsx`
- [ ] Update ProductsPage to compose from components

**2.4: SettingsPage - Similar Breakdown**
- [ ] Extract styles
- [ ] Extract tab components
- [ ] Extract hooks for each tab's state

**2.5: Test**
- [ ] Run frontend build
- [ ] Manual smoke tests for Products page
- [ ] Verify filtering, search, form submission
- [ ] Check Settings page tabs
- [ ] Check ReconciliationPage

---

## Part 4: Success Criteria

### Code Metrics
- [ ] ProductsPage: 1164 → ~250 lines (80% reduction)
- [ ] SettingsPage: 1124 → ~250 lines (80% reduction)
- [ ] ReconciliationPage: 630 → ~200 lines (70% reduction)
- [ ] movements.service.js: 405 → ~150 lines (60% reduction)
- [ ] products.service.js: 398 → ~100 lines (75% reduction)

### Quality Metrics
- [ ] Each module has single responsibility
- [ ] No circular dependencies
- [ ] All tests passing
- [ ] No console errors/warnings
- [ ] Same API contracts

### Behavior Preservation
- [ ] Products can be created, updated, deleted
- [ ] Filters work identically
- [ ] Search works identically
- [ ] Form validation works
- [ ] Inline editing works
- [ ] Settings tabs navigate and save
- [ ] Reconciliation workflow functions
- [ ] Stock movements complete correctly
- [ ] Transactions don't deadlock
- [ ] Low stock detection works

---

## Part 5: Risk Mitigation

### High Risk Areas
1. **Transaction Logic (movements)**
   - Risk: Deadlocks, phantom reads
   - Mitigation: Isolated tests, gradual rollout, monitoring
2. **Form State (ProductsPage)**
   - Risk: State inconsistency between hooks
   - Mitigation: Test all form paths, dry run on staging
3. **Inline Edits (ProductsPage)**
   - Risk: Race conditions
   - Mitigation: Optimistic update tests, rollback tests

### Rollback Plan
- If major issues, `git revert` specific commits
- Phase-based rollout: backend first, then frontend
- Feature flags for riskier components

---

## Quick Reference: Files to Create/Modify

### CREATE (Backend)
- [ ] `backend/src/domain/stockAdjustment.js`
- [ ] `backend/src/domain/productValidation.js`
- [ ] `backend/src/repositories/stockRepository.js`
- [ ] `backend/src/repositories/movementRepository.js`
- [ ] `backend/src/repositories/productRepository.js`

### MODIFY (Backend)
- [ ] `backend/src/services/movements.service.js`
- [ ] `backend/src/services/products.service.js`
- [ ] `backend/src/controllers/movements.controller.js` (update imports)
- [ ] `backend/src/controllers/products.controller.js` (update imports)

### CREATE (Frontend)
- [ ] `frontend/src/pages/Products/constants.js`
- [ ] `frontend/src/pages/Products/styles.js`
- [ ] `frontend/src/hooks/useProducts.js`
- [ ] `frontend/src/hooks/useProductFilters.js`
- [ ] `frontend/src/hooks/useProductForm.js`
- [ ] `frontend/src/hooks/useProductInlineEdit.js`
- [ ] `frontend/src/components/Products/ProductsPageHeader.jsx`
- [ ] `frontend/src/components/Products/ProductsFormPanel.jsx`
- [ ] `frontend/src/components/Products/ProductsTable.jsx`
- [ ] `frontend/src/components/Products/ProductsTableRow.jsx`
- [ ] `frontend/src/components/Products/ProductsFilters.jsx`
- [ ] (Similar for Settings & Reconciliation)

### MODIFY (Frontend)
- [ ] `frontend/src/pages/Products/ProductsPage.jsx` (~1164 → ~250 lines)
- [ ] `frontend/src/pages/Settings/SettingsPage.jsx` (~1124 → ~250 lines)
- [ ] `frontend/src/pages/Reconciliation/ReconciliationPage.jsx` (~630 → ~200 lines)
