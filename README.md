#  Chatify – Real Time Scalable Chat Application

Chatify is a production-ready real-time chat application built using the MERN stack. It features instant messaging, reactions, OTP-based authentication, rate limiting, and a scalable architecture powered by Redis and Socket.IO.

---

## 🚀 Features

### 🔐 Authentication
* **OTP via Phone:** Integrated with Twilio.
* **OTP via Email:** Integrated with SendGrid.
* **Secure auth via header:** Implemented using JWT (JSON Web Tokens).

### 💬 Messaging
* **Real-Time:** 1-to-1 chat using Socket.IO.
* **Reactions:** Full emoji support for messages.
* **Presence:** Online/Offline status.
* **Anti-Spam:** Redis-based message rate limiting.

### ⚡ Performance & Security
* **Optimized Queries:** MongoDB indexing for fast data retrieval.
* **Scalability:** Logic designed for scalable socket management.
* **Security:** Secure environment variable handling and middleware protection.

### 🖼 Media Support
* **File Handling:** Image and file uploads via Multer.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React.js, Zustand, Tailwind CSS, Socket.IO Client, Yup |
| **Backend** | Node.js, Express.js, Socket.IO, Redis, JWT, Cloudinary (Media Storage) |
| **Database** | MongoDB + Mongoose |
| **Services** | Twilio (Phone), SendGrid (Email), Upstash (Cloud Redis) |

---
## 🚦 Rate Limiting Strategy

Chatify uses a **two-layer Redis-based rate limiting system** to prevent spam while keeping the chat experience smooth.

### 1️⃣ Per User Rate Limit (Global)
Limits how frequently a user can send messages overall.

- **Purpose:** Prevents abuse, bot behavior, and accidental message floods
- **Key:** `msg:{senderID}`
- **Example:** Max **30 messages in 60 seconds per user**

### 2️⃣ Per User Per Conversation Rate Limit
Applies stricter limits within a single conversation.

- **Purpose:** Stops spamming in individual chats without blocking the user globally
- **Key:** `msg:{senderId}:{conversationId}`
- **Example:** Max **15 messages in 10 seconds per user per conversation**

### ⚙️ Implementation
- Built using **Redis `INCR` + `EXPIRE`**
- Executed **before message persistence**
- Avoids unnecessary MongoDB writes and file uploads

### ✅ Benefits
- Fine-grained abuse control
- High performance (in-memory operations)
- Scales efficiently for real-time messaging


## 👨‍💻 Author

**Aansh Malhotra**
*(Full Stack Developer)*

---

### 📝 Final Note

Thank you for checking out **Chatify**! This project was built to demonstrate the power of real-time communication using the MERN stack and Redis. 

If you have any questions or just want to connect, feel free to reach out.

**Don't forget to give this project a ⭐ if you found it useful!**
