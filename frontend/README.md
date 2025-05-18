# TaskFlow Frontend - Next.js

This is the frontend for TaskFlow, built with **Next.js, React, and Tailwind CSS**.

## 🚀 Getting Started

First, install dependencies and start the development server:

```bash
npm install  # Install dependencies
npm run dev  # Start the development server
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the app.

## 📁 Folder Structure

```
/taskflow-frontend
│── /public            # Static assets (images, logos, fonts)
│── /src               # Source code
│   │── /components    # Reusable UI components (buttons, modals, cards)
│   │── /layouts       # Page layouts (AdminLayout, UserLayout, etc.)
│   │── /pages or app  # Next.js routing (dynamic & static pages)
│   │   │── dashboard  # Authenticated user dashboard
│   │   │── auth       # Login, Signup, Forgot Password pages
│   │   │── index.js   # Main landing page
│   │── /services      # API service calls (Axios, Fetch abstraction)
│   │── /hooks         # Custom React hooks (useAuth, useTaskState)
│   │── /contexts      # Context API for global state (AuthContext, TaskContext)
│   │── /store         # Redux global state management (optional)
│   │── /utils         # Helper functions (formatDate, debounce, validation)
│   │── /constants     # Global constants (API endpoints, app config)
│── /styles           # Global styles (Tailwind, custom CSS)
│── .env.local        # Environment variables
│── next.config.js    # Next.js configuration
│── package.json      # Project dependencies
│── README.md         # Project documentation
```

## 🔑 Environment Variables (.env.local)

```plaintext
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=TaskFlow
```

## 🔌 API Connection

All API requests are handled using Axios in `src/services/api.js`:
```javascript
import axios from "axios";
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "https://api.taskflow.com";

export const login = async (email, password) => {
  return await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
};
```

## 🛠 Install Dependencies

```bash
npm install axios react-hook-form @tanstack/react-query zustand tailwindcss postcss autoprefixer
```

## 🚀 Deployment

To deploy the frontend, use **Vercel or Netlify**:

- **Vercel:** `vercel --prod`
- **Netlify:** Connect GitHub repo and deploy automatically.

## 🏗️ Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

### 🎯 TaskFlow Frontend: Scalable, Fast, and Modern

TaskFlow’s frontend is optimized for **performance, usability, and scalability**, ensuring a seamless user experience.

🚀 Happy Coding!