# 🚀 YapIt – Real-Time Conversation Platform

# 🚀 YapIt – Real-Time Conversation Platform

![YapIt Banner](./assets/banner.png)

> **YapIt** is a modern, Gen-Z styled real-time conversation platform built for speed and seamless interaction. Leveraging the power of the **MERN stack** and **Socket.IO**, it enables instant messaging, media sharing, and presence tracking in a sleek, responsive interface.

---

## ✨ Features

- **🔐 Secure Authentication**: JWT-based implementation for secure signup, login, and session management.
- **💬 Real-Time Messaging**: Instant bi-directional communication using Socket.IO.
- **📂 Media Sharing**: Send images and attachments seamlessly (integrated with Cloudinary).
- **🟢 Presence Tracking**: See who's online in real-time.
- **📝 Typing Indicators**: Visual cues when someone is typing.
- **🎨 Modern UI/UX**: A responsive, neon-themed interface built with Tailwind CSS.
- **⚙️ User Settings**: Customizable profile, privacy settings, and more.
- **💾 Persistent History**: All conversations are securely stored in MongoDB.

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | [Next.js](https://nextjs.org/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/) |
| **Backend** | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [MongoDB](https://www.mongodb.com/) (Mongoose ODM) |
| **Real-Time** | [Socket.IO](https://socket.io/) |
| **Storage** | [Cloudinary](https://cloudinary.com/) |
| **Deployment** | Docker, Render, Netlify |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [Docker](https://www.docker.com/) (optional, for containerized run)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas URI)
- [Cloudinary Account](https://cloudinary.com/) (for media uploads)

### 📥 Installation & Local Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/tanvi-agarwal10/YapIt.git
    cd YapIt
    ```

2.  **Setup the Backend:**
    ```bash
    cd backend
    npm install
    cp .env.example .env # Configure your .env variables
    npm run dev
    ```

3.  **Setup the Frontend:**
    ```bash
    cd ../web
    npm install
    cp .env.example .env.local # Configure your environment variables
    npm run dev
    ```

4.  **Access the App:**
    -   Frontend: `http://localhost:3000`
    -   Backend API: `http://localhost:5000`

### 🐳 Docker Setup

Run the entire stack with a single command:

```bash
./deploy.sh
# OR
docker-compose up --build
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/yapit
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (`web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## 📂 Project Structure

```
YapIt/
├── backend/            # Express.js API & Socket.IO Server
│   ├── src/
│   │   ├── controllers/# Route controllers
│   │   ├── models/     # Mongoose models
│   │   ├── routes/     # API routes
│   │   └── socket/     # Socket.IO handlers
├── web/                # Next.js Frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Next.js pages
│   │   └── utils/      # API & Socket clients
├── docker-compose.yml  # Docker orchestration
└── README.md           # Project documentation
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

This project is open source and available under the **MIT License**.

---

## 👤 Author

**Tanvi Agarwal**

-   GitHub: [@tanvi-agarwal10](https://github.com/tanvi-agarwal10)
