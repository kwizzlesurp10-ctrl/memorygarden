# Protocol Handlers Documentation

## Overview

MemoryGarden now supports custom web protocol handlers that allow external applications and websites to interact with your garden when the app is installed as a Progressive Web App (PWA).

## Supported Protocols

### 1. `web+memorygarden://`
General purpose protocol for MemoryGarden actions.

**Example:**
```
web+memorygarden://action
```

### 2. `web+plantmemory://`
Opens the plant memory modal, optionally with pre-filled data.

**Examples:**
```
web+plantmemory://
web+plantmemory://data-string
```

**Usage in HTML:**
```html
<a href="web+plantmemory://">Plant a Memory</a>
```

### 3. `web+viewmemory://`
Opens a specific memory by its ID.

**Example:**
```
web+viewmemory://memory-1234567890
```

**Usage in HTML:**
```html
<a href="web+viewmemory://memory-1234567890">View Memory</a>
```

## Installation Requirements

Protocol handlers only work when MemoryGarden is installed as a PWA:

1. Open MemoryGarden in a supported browser (Chrome, Edge, Safari, etc.)
2. Look for the "Install" or "Add to Home Screen" option in your browser
3. Install the app
4. Once installed, the app will register as a handler for the custom protocols

## Share Target API

MemoryGarden also supports receiving shared content from other apps:

- **Share photos** directly from your camera or photo gallery
- **Share text** to create memory notes
- **Share URLs** to associate with memories

The shared content will open the plant memory modal with the shared data pre-filled.

## Technical Details

### Manifest Configuration

The protocol handlers are defined in `/public/manifest.json`:

```json
{
  "protocol_handlers": [
    {
      "protocol": "web+memorygarden",
      "url": "/handle?protocol=%s"
    },
    {
      "protocol": "web+plantmemory",
      "url": "/plant?data=%s"
    },
    {
      "protocol": "web+viewmemory",
      "url": "/memory?id=%s"
    }
  ]
}
```

### Handler Implementation

The protocol handler hook (`useProtocolHandler`) automatically processes incoming protocol requests and triggers the appropriate actions in the app.

## Browser Support

Protocol handlers are supported in:
- ✅ Chrome/Chromium (Desktop & Android)
- ✅ Edge (Desktop)
- ✅ Safari (iOS 16.4+, macOS 13+)
- ⚠️ Firefox (Limited support)

## Security Considerations

- Protocol handlers only work for installed PWAs, providing an additional layer of user consent
- The app validates all incoming protocol requests before processing
- Memory IDs must match existing memories to prevent unauthorized access
- All protocol data is sanitized and validated before use

## Examples for Developers

### Creating a Link to Plant a Memory

```html
<a href="web+plantmemory://">Quick Plant</a>
```

### Creating a Link to View a Specific Memory

```javascript
const memoryId = "memory-1234567890";
const link = `web+viewmemory://${memoryId}`;
window.location.href = link;
```

### Integrating with External Apps

External applications can deep-link into MemoryGarden by constructing protocol URLs:

```javascript
// Example: Automation tool that creates memories
function createMemoryLink(text) {
  return `web+plantmemory://${encodeURIComponent(text)}`;
}
```

## Troubleshooting

### Protocol links don't work
- Ensure MemoryGarden is installed as a PWA
- Check that your browser supports protocol handlers
- Try reinstalling the app

### Shared content doesn't appear
- Verify the Share Target API is supported in your browser
- Check that you're sharing compatible content types (images, text)

### Memory not found when using viewmemory protocol
- Ensure the memory ID is correct and exists in your garden
- Memory IDs are case-sensitive

## Future Enhancements

Planned protocol features:
- `web+exportgarden://` - Direct export triggers
- `web+searchmemories://query` - Search integration
- Enhanced data passing for richer integrations
