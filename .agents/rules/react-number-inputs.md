---
description: Best practices and fixes for controlled numeric inputs in React to avoid the "sticky zero" bug.
---

# React Numeric Input Handling

When implementing controlled numeric inputs in React, **never** coerce `e.target.value` directly using `Number(e.target.value)` in the `onChange` handler if the state is initialized to `0`. 

If you do this, when the user tries to backspace to delete the `0` (which results in `""`), `Number("")` instantly coerces it back to `0`, making it impossible to empty the input field. This is known as the "sticky zero" bug.

### ❌ Bad Practice:
```javascript
<input 
  type="number" 
  value={formData.amount} 
  onChange={e => setFormData({...formData, amount: Number(e.target.value)})} 
/>
```

### ✅ Good Practice:
Always preserve the empty string `""` in state, and only coerce non-empty values. During arithmetic operations elsewhere in the component, use `Number(stateValue) || 0` to safely handle the potential empty string.

```javascript
<input 
  type="number" 
  value={formData.amount} 
  onChange={e => setFormData({
    ...formData, 
    amount: e.target.value === '' ? '' : Number(e.target.value)
  })} 
/>
```

This ensures the user experience is smooth and they can freely clear and re-type numbers in forms.
