# YapIt Backend README

Real-time messaging backend built with Node.js, Express, and Socket.IO.

## Quick Start

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Development mode (with auto-reload)
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/profile` | Get user profile | ✅ |
| GET | `/api/auth/users` | Get all users | ✅ |

### Messages
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/messages/:otherUserId` | Get chat history | ✅ |
| POST | `/api/messages/send` | Send message | ✅ |
| PUT | `/api/messages/:messageId/read` | Mark as read | ✅ |

## WebSocket Events

### Emit Events (Client → Server)
- `user:login` - User connects and logs in
- `message:send` - Send a message
- `user:typing` - User is typing
- `user:stopTyping` - User stops typing
- `user:logout` - User logs out

### Listen Events (Server → Client)
- `message:receive` - Receive incoming message
- `message:sent` - Message delivered confirmation
- `user:online` - User came online
- `user:offline` - User went offline
- `user:typing` - Typing indicator
- `user:stopTyping` - Stop typing indicator

## Environment Variables

```
PORT=5000                                    # Server port
MONGODB_URI=mongodb://localhost:27017/yapit # MongoDB connection
JWT_SECRET=your_secret_key                  # JWT signing secret
JWT_EXPIRE=7d                               # Token expiration
NODE_ENV=development                        # Environment
CORS_ORIGIN=http://localhost:3000          # CORS allowed origin
```

## Project Structure

```
src/
├── index.ts                 # Server entry point
├── models/
│   ├── User.ts             # User schema
│   └── Message.ts          # Message schema
├── controllers/
│   ├── authController.ts   # Auth logic
│   └── messageController.ts # Message logic
├── routes/
│   ├── auth.ts             # Auth routes
│   └── messages.ts         # Message routes
├── middleware/
│   └── auth.ts             # JWT authentication
└── socket/
    └── socketHandler.ts    # WebSocket event handlers
```

## Technologies

- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **TypeScript** - Type safety

## Development

### Install Dependencies
```bash
npm install
```

### Run in Development Mode
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Run Tests
```bash
npm test
```

## Architecture Highlights

### Real-Time System
- Socket.IO for bidirectional WebSocket communication
- In-memory user connection tracking
- Automatic message persistence
- Auto-reconnection support

### Database
- MongoDB for message history
- User profiles and authentication
- Indexed queries for performance

### Security
- Bcrypt password hashing (10 rounds)
- JWT token validation
- CORS protection
- Input validation

## Performance Considerations

- Connection pooling for MongoDB
- Indexed database queries
- Message buffering for offline users
- Socket event compression

## Scalability

For horizontal scaling:
- Add Redis pub/sub for cross-server messaging
- Use load balancer (Nginx/HAProxy)
- Implement message queue (RabbitMQ)
- Database replication

## Common Issues

### MongoDB not connecting
- Ensure MongoDB is running: `mongod`
- Check connection string in .env
- Verify database name

### CORS errors
- Update CORS_ORIGIN in .env
- Check frontend URL matches

### WebSocket connection fails
- Ensure backend is running
- Check port 5000 is accessible
- Verify Socket.IO configuration

## License

MIT
