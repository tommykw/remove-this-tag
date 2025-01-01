# Remove This Tag

A Visual Studio Code extension that allows you to quickly remove HTML-like tags and their corresponding closing tags in HTML, JSX, TSX, and Vue files.

## Features

- Removes both opening and closing tags with a single action
- Supports multiple file types:
  - HTML (.html, .htm)
  - React JSX (.jsx)
  - React TSX (.tsx)
  - Vue (.vue)
- Works with nested tags
- Preserves content between tags
- Available through Quick Fix menu (lightbulb)

## Usage

1. Place your cursor inside any tag you want to remove
2. Click the lightbulb icon or press `Ctrl+.` (`Cmd+.` on macOS)
3. Select "Remove this tag" from the menu

## Examples

### HTML
```html
<!-- Before -->
<div>
    <span>Hello World!</span>
</div>

<!-- After removing span tag -->
<div>
    Hello World!
</div>
```

### React (JSX/TSX)
```jsx
// Before
<Button>
    <Icon />
    Click me
</Button>

// After removing Icon tag
<Button>
    Click me
</Button>
```

### Vue
```vue
<!-- Before -->
<template>
    <div>
        <span>Hello Vue!</span>
    </div>
</template>

<!-- After removing span tag -->
<template>
    <div>
        Hello Vue!
    </div>
</template>
```

## Requirements

- Visual Studio Code version 1.96.0 or higher

## License

This extension is licensed under the [MIT License](LICENSE).
