# ProfilePage Tabs Deprecation Warning - Fix Documentation

## Issue
**Warning:** `[antd: Tabs] Tabs.TabPane is deprecated. Please use items instead.`

The ProfilePage component was using the deprecated `Tabs.TabPane` pattern which is no longer recommended in newer versions of Ant Design.

## Root Cause
Ant Design deprecated the JSX-based `TabPane` component in favor of a declarative `items` prop approach for better performance and maintainability.

### Old Pattern (Deprecated)
```jsx
import { Tabs } from "antd"
const { TabPane } = Tabs

// JSX-based tabs
<Tabs defaultActiveKey="info">
  <TabPane tab="Label" key="key1">
    Content
  </TabPane>
  <TabPane tab="Label2" key="key2">
    Content2
  </TabPane>
</Tabs>
```

### New Pattern (Recommended)
```jsx
import { Tabs } from "antd"

// Items-based tabs
const items = [
  { label: "Label", key: "key1", children: "Content" },
  { label: "Label2", key: "key2", children: "Content2" },
]

<Tabs items={items} />
```

## Solution

### 1. Removed Deprecated Import
**Before:**
```jsx
const { TabPane } = Tabs
```

**After:**
```jsx
// Removed - no longer needed
```

### 2. Added App Import
```jsx
import { ..., App } from "antd"
```

### 3. Created tabItems Array
Built an array containing all tab definitions with `label`, `key`, and `children` properties:

```jsx
const tabItems = [
  {
    label: (
      <span className="flex items-center gap-2">
        <User className="w-4 h-4" />
        Thông tin
      </span>
    ),
    key: "info",
    children: (
      <Form>
        {/* Form content */}
      </Form>
    ),
  },
  // Additional tabs...
]
```

### 4. Updated Tabs Component
**Before:**
```jsx
<Tabs defaultActiveKey="info">
  <TabPane tab={...} key="info">
    {/* Content */}
  </TabPane>
  {/* More TabPanes */}
</Tabs>
```

**After:**
```jsx
<Tabs defaultActiveKey="info" items={tabItems} />
```

### 5. Fixed Message Context Warning
Added App wrapper to provide context for message notifications:

**Before:**
```jsx
import { message } from "antd"
// Later: message.success() - Warning: no context
```

**After:**
```jsx
const { message } = App.useApp()
// Later: message.success() - Works without warning
```

### 6. Component Structure
Refactored component into:
- `ProfilePageContent` - Main component with logic
- `ProfilePage` - Wrapper that provides App context

```jsx
function ProfilePageContent() {
  const { message } = App.useApp()
  // ... component logic
}

export default function ProfilePage() {
  return (
    <App>
      <ProfilePageContent />
    </App>
  )
}
```

## Benefits

✅ **No More Deprecation Warnings** - Uses modern Ant Design API
✅ **Better Performance** - Items-based approach is optimized
✅ **Cleaner Code** - Easier to read and maintain
✅ **Future-Proof** - Aligns with Ant Design v5+ best practices
✅ **Proper Context** - Message works with theme context

## Tab Structure

The ProfilePage now includes three tabs:

1. **Thông tin (Info Tab)**
   - Full name, email, phone
   - User profile form

2. **Thông tin xe (Vehicle Tab)** - *Only for drivers with vehicle info*
   - License plate
   - Vehicle type
   - Brand and color

3. **Bảo mật (Security Tab)**
   - Change password option

## Dynamic Tab Display

The vehicle tab is conditionally included:
```jsx
...(user?.role === "driver" && user?.vehicleInfo
  ? [{ /* vehicle tab */ }]
  : [])
```

This ensures the tab only appears for drivers who have vehicle information.

## Testing

1. **Clear Cache:**
   ```bash
   Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   ```

2. **Check Console:**
   - No deprecation warnings about `TabPane`
   - No context warnings about `message`

3. **Test Functionality:**
   - Click between tabs
   - Form submissions work
   - Password change modal opens

## Files Modified
- `frontend/src/pages/shared/ProfilePage.jsx`

## Related Components
- `ProfilePageContent` - Internal component
- `ProfilePage` - Exported default wrapper
- Uses: Tabs, Form, Button, Upload, Modal from Ant Design

## Migration Notes

If you have other components using deprecated `TabPane`, apply the same pattern:

1. Import `App` from antd
2. Create `items` array with tab definitions
3. Use `App.useApp()` for message/notification
4. Replace JSX TabPane with items prop
5. Wrap component export with App provider

## Resources
- [Ant Design Tabs Documentation](https://ant.design/components/tabs/)
- [Ant Design v5 Migration Guide](https://ant.design/docs/react/migration-v4-to-v5)
