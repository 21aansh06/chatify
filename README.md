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
| **Frontend** | React.js, Tailwind CSS, Socket.IO Client, Yup |
| **Backend** | Node.js, Express.js, Socket.IO, Redis, JWT, Cloudinary (Media Storage) |
| **Database** | MongoDB + Mongoose |
| **Services** | Twilio (Phone), SendGrid (Email), Upstash (Cloud Redis) |

---
### 🧪 Rate Limiting Logic

To maintain system stability and prevent spam, Chatify implements a high-performance rate-limiting layer using **Redis**.

* **Granular Control:** Limits are applied per user, per conversation to ensure legitimate users aren't globally blocked.
* **Mechanism:** Uses the Redis `INCR` command to track message frequency and `EXPIRE` to reset the window.
* **Efficiency:** By handling this in-memory (Redis) rather than hitting MongoDB, the application remains fast even under heavy traffic.

**Key Structure:**
`msg:{userId}:{conversationId}`

**Example Workflow:**
1. A user sends a message.
2. The system increments the counter for that specific `userId` + `conversationId` pair.
3. If the counter exceeds the threshold (e.g., 7 messages in 10 seconds), the request is rejected.
4. The key expires automatically after the defined window, allowing the user to resume chatting.
---

## 👨‍💻 Author

**Aansh Malhotra**
*(Full Stack Developer)*

---

### 📝 Final Note

Thank you for checking out **Chatify**! This project was built to demonstrate the power of real-time communication using the MERN stack and Redis. 

If you have any questions or just want to connect, feel free to reach out.

**Don't forget to give this project a ⭐ if you found it useful!**
