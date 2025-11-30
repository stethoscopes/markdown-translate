# Configuration Guide

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000
VITE_API_KEY=your_api_key_here
```

## Config File

Edit `vite.config.js`:

```javascript
export default {
  server: {
    port: 5173,
    host: true
  }
}
```
