# 👻 GhostChat Frontend

An anonymous, encrypted, and ephemeral messaging platform built with Next.js. GhostChat provides secure, temporary chat rooms with end-to-end encryption and automatic message deletion.

![GhostChat](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Next.js-15.4.7-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38bdf8)

## ✨ Features

- 🔐 **End-to-End Encryption** - Messages encrypted using AES-GCM
- 👤 **Anonymous** - No registration required, random agent IDs
- ⏰ **Ephemeral** - Messages auto-delete (5min - 24hrs or burn-after-reading)
- 📸 **Image Sharing** - Send compressed images with optional captions
- 📱 **Mobile Optimized** - Responsive design with keyboard handling
- 🕵️ **Stealth Mode** - Calculator disguise (Ctrl+Shift+S)
- 🌐 **Real-time** - WebSocket communication via Socket.IO
- 🛡️ **Content Filtering** - Configurable message filtering system

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- GhostChat Backend server running

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/REZ3X/ghostchat_frontend.git
   cd ghostchat_frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
   NEXT_PUBLIC_BLOCKED_WORDS=spam,abuse
   NEXT_PUBLIC_FILTER_MODE=replace
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles & scrollbar
│   ├── layout.js          # Root layout component
│   ├── page.js            # Homepage with room creation/joining
│   └── room/
│       └── [token]/
│           └── page.js    # Chat room interface
├── components/            # Reusable React components
│   ├── ImageAttach.js     # Image upload & compression
│   ├── MessageInput.js    # Message input with TTL options
│   ├── MessageList.js     # Message display & image modal
│   ├── RoomHeader.js      # Room info & participant list
│   ├── RoomJoiner.js      # Join existing room form
│   └── TokenGenerator.js  # Create new room form
└── utils/                 # Utility functions
    ├── crypto.js          # Encryption/decryption utilities
    ├── imageHandler.js    # Image processing & validation
    └── messageFilter.js   # Content filtering system
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend server URL | `http://localhost:3001` |
| `NEXT_PUBLIC_BLOCKED_WORDS` | Comma-separated blocked words | `""` |
| `NEXT_PUBLIC_FILTER_MODE` | Filter mode: `replace`/`block`/`warn` | `replace` |

### Content Filtering

Configure message filtering in `.env.local`:

```env
# Block specific words
NEXT_PUBLIC_BLOCKED_WORDS=spam,abuse,inappropriate

# Filter modes:
# - replace: Replace blocked words with asterisks
# - block: Prevent sending messages with blocked words
# - warn: Show warning but allow sending
NEXT_PUBLIC_FILTER_MODE=replace
```

## 🖥️ Usage Guide

### Creating a Room

1. Visit the homepage
2. Click "Generate Room Token"
3. Share the generated link or token
4. Click "Enter Room" to join

### Joining a Room

1. Enter a room token (format: ABC-123-XYZ)
2. Click "Join Room"
3. Start chatting immediately

### Sending Messages

- **Text**: Type and press Enter or click send
- **Images**: Click photo icon, select image, add optional caption
- **TTL Options**: Choose auto-delete timer (5min - 24hrs or burn-after-reading)

### Special Features

- **Stealth Mode**: Press `Ctrl+Shift+S` for calculator disguise
- **Image Modal**: Click images to view in full size
- **Scroll to Bottom**: Auto-scroll or click arrow when manually scrolled

## 🔐 Security Features

### Encryption

- **Algorithm**: AES-GCM 256-bit encryption
- **Key Derivation**: SHA-256 from room token + salt
- **Per-Message**: Unique IV for each message
- **Client-Side**: All encryption/decryption in browser

### Privacy

- **No Registration**: Anonymous agent IDs (e.g., "Ghost-456")
- **No Logging**: Messages not stored permanently
- **Auto-Delete**: Configurable message expiration
- **Ephemeral**: No trace after expiration

## 📱 Mobile Support

- **Responsive Design**: Optimized for all screen sizes
- **Keyboard Handling**: Proper mobile keyboard behavior
- **Touch Targets**: 44px+ touch targets for accessibility
- **Safe Area**: Support for iPhone notches and home indicators

## 🎨 UI/UX Features

### Design System

- **Glass Morphism**: Backdrop blur effects
- **Purple Gradient**: Consistent brand colors
- **Custom Scrollbar**: Styled purple scrollbars
- **Animations**: Smooth transitions and micro-interactions

### Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and semantic HTML
- **High Contrast**: Readable color combinations
- **Touch Friendly**: Large touch targets

## 🛠️ Development

### Available Scripts

```bash
# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Code Style

- **ESLint**: Next.js recommended configuration
- **Prettier**: Code formatting (configure as needed)
- **Components**: Functional components with hooks
- **CSS**: TailwindCSS utility classes

### Hot Features

- **Turbopack**: Fast development builds
- **Auto-refresh**: Hot module replacement
- **TypeScript Ready**: Easy migration path
- **Component-Based**: Modular architecture

## 🔌 API Integration

### WebSocket Events

```javascript
// Joining room
socket.emit('join-room', { roomToken, agentId });

// Sending text message
socket.emit('send-message', { roomToken, message, sender, ttl });

// Sending image
socket.emit('send-image', { roomToken, imageData, caption, sender, ttl });

// Receiving messages
socket.on('new-message', handleNewMessage);
```

### REST Endpoints

```javascript
// Load message history
GET /api/room/{token}/messages

// Serve images
GET /api/image/{filename}

// Health check
GET /api/health
```

## 📸 Image Handling

### Features

- **Compression**: Automatic image compression (quality: 0.8)
- **Resize**: Max dimensions 1200x1200px
- **Formats**: JPEG, PNG, GIF, WebP support
- **Size Limit**: 10MB maximum
- **Preview**: Live preview before sending

### Processing Pipeline

1. **Validation**: Check file type and size
2. **Compression**: Reduce file size while maintaining quality
3. **Base64 Encoding**: Convert for transmission
4. **Server Storage**: Temporary file storage with TTL
5. **Auto-Cleanup**: Files deleted after expiration

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Setup

```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

### Deployment Platforms

- **Vercel**: Optimized for Next.js (recommended)
- **Netlify**: Static site deployment
- **Railway**: Full-stack deployment
- **AWS**: S3 + CloudFront
- **Docker**: Containerized deployment

## 🔧 Troubleshooting

### Common Issues

**Images not loading**
```bash
# Check backend URL configuration
echo $NEXT_PUBLIC_BACKEND_URL

# Verify backend is running
curl http://localhost:3001/api/health
```

**Encryption not working**
- Ensure HTTPS in production
- Check Web Crypto API support
- Verify modern browser compatibility

**Connection issues**
- Check CORS configuration
- Verify WebSocket ports
- Test backend connectivity

## 📊 Performance

### Optimizations

- **Image Compression**: 60-80% size reduction
- **Lazy Loading**: Images loaded on demand
- **Bundle Splitting**: Optimized JavaScript chunks
- **Caching**: Static asset caching
- **Tree Shaking**: Unused code elimination

### Metrics

- **Lighthouse Score**: 95+ performance
- **First Paint**: < 1s
- **Bundle Size**: ~2MB total
- **Image Compression**: 70% average reduction

## 🤝 Contributing

### Getting Started

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Guidelines

- Follow ESLint configuration
- Use functional components with hooks
- Implement responsive design
- Add error handling
- Write meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- **[GhostChat Backend](https://github.com/REZ3X/ghostchat_backend)**: Node.js backend server
- **[GhostChat Mobile](https://github.com/REZ3X/ghostchat_mobile)**: React Native mobile app

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/REZ3X/ghostchat_frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/REZ3X/ghostchat_frontend/discussions)
- **Email**: abim@rejaka.id

## 🙏 Acknowledgments

- **Next.js Team**: Amazing React framework
- **TailwindCSS**: Utility-first CSS framework
- **Socket.IO**: Real-time communication
- **Web Crypto API**: Browser-native encryption
- **React Icons**: Beautiful icon library

---

**Built with ❤️ for privacy and security**

*GhostChat - Where conversations disappear, but connections remain.*