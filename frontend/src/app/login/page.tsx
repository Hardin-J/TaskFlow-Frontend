"use client";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";
import toast, { Toaster } from "react-hot-toast";
import { loginUser } from "@/services/User.services";

// Define interface for form data
interface FormData {
  email: string;
  password: string;
}

// Define interface for login response
interface LoginResponse {
  message?: string;
  user: {
    id: number;
    email: string;
  };
  token: string;
}

export default function Login() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  useEffect(() => {
    // Check if dark mode preference exists in local storage
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle("dark", savedDarkMode);
  }, []);

  useEffect(() => {
    // Save dark mode preference to local storage
    localStorage.setItem("darkMode", darkMode.toString());
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  // const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setError("");

  //   if (!formData.email || !formData.password) {
  //     setError("Please fill in all fields");
  //     toast.error("Please fill in all fields");
  //     setLoading(false);
  //     return;
  //   }

  //   try {
  //     // Fetch users from json-server
  //     const response = await loginUser({formData.})
      

  //     // Find user by email
  //     const user = users.find((user) => user.email === formData.email);

  //     if (!user) {
  //       setError("User not found");
  //       toast.error("User not found");
  //       setLoading(false);
  //       return;
  //     }

  //     let isPasswordValid = false;

  //     // Check if password is hashed (starts with $2a$, $2b$, etc.)
  //     if (user.password.startsWith('$2')) {
  //       // Use bcrypt to compare hashed passwords
  //       isPasswordValid = await bcrypt.compare(formData.password, user.password);
  //     } else {
  //       // For plain text passwords (not recommended but for compatibility)
  //       isPasswordValid = formData.password === user.password;
  //     }

  //     if (!isPasswordValid) {
  //       setError("Invalid credentials");
  //       toast.error("Invalid credentials");
  //       setLoading(false);
  //       return;
  //     }

  //     // Update last login time
  //     await fetch(`http://localhost:3001/users/${user.id}`, {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         lastLogin: new Date().toISOString(),
  //       }),
  //     });

  //     // Store user info in local storage (avoid storing sensitive data)
  //     localStorage.setItem(
  //       "user",
  //       JSON.stringify({
  //         id: user.id,
  //         name: user.name,
  //         email: user.email,
  //         role: user.role,
  //         department: user.department,
  //       })
  //     );

  //     // Show success toast
  //     toast.success(`Welcome back, ${user.name}!`);

  //     // Simulate a small delay before redirecting (for toast visibility)
  //     setTimeout(() => {
  //       // Redirect to dashboard
  //       router.push("/dashboard");
  //     }, 1000);

  //   } catch (err) {
  //     console.error("Login error:", err);
  //     setError("An error occurred. Please try again.");
  //     toast.error("An error occurred. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
  
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      toast.error("Please fill in all fields");
      setLoading(false);
      return;
    }
  
    try {
      // Call the login service
      const response = await loginUser({
        email: formData.email,
        password: formData.password
      });
  
      const { user, token } = response;
  
      // Store user info and token (consider using cookies or secure storage in production)
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", token);
  
      // Show welcome toast
      toast.success(`Welcome back, ${user.email}!`);
  
      // Redirect after short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
  
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center min-h-screen transition-all duration-500 ${darkMode
          ? "bg-gradient-to-br from-gray-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-sky-50 via-white to-blue-50"
        } p-6`}
    >
      {/* Toast container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: darkMode ? '#1e293b' : '#ffffff',
            color: darkMode ? '#f8fafc' : '#0f172a',
            border: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: 'white',
            },
          },
        }}
      />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/10 to-teal-400/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/10 to-indigo-500/20 blur-3xl"></div>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/20 backdrop-blur-md dark:bg-gray-800/40 text-gray-800 dark:text-white hover:scale-110 transition shadow-lg"
        aria-label="Toggle dark mode"
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      <div
        className={`backdrop-blur-lg border shadow-xl rounded-2xl p-8 w-full max-w-md text-center transition-all duration-500 ${darkMode
            ? "bg-slate-900/70 border-slate-700/50 text-white"
            : "bg-white/80 border-gray-200/50 text-gray-900"
          }`}
      >
        <div className="mb-6">
          <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className={`mb-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            Enter your credentials to access your account
          </p>
        </div>



        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                className={`w-5 h-5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
              </svg>
            </div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all ${darkMode
                  ? "bg-slate-800/70 text-white placeholder-slate-400 border-slate-600/50 focus:ring-blue-500/50"
                  : "bg-white/90 text-slate-800 placeholder-slate-500 border-slate-200 focus:ring-blue-500/50"
                }`}
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                className={`w-5 h-5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all ${darkMode
                  ? "bg-slate-800/70 text-white placeholder-slate-400 border-slate-600/50 focus:ring-blue-500/50"
                  : "bg-white/90 text-slate-800 placeholder-slate-500 border-slate-200 focus:ring-blue-500/50"
                }`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 ${darkMode
                ? "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              } ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className={`w-full border-t ${darkMode ? "border-slate-700" : "border-slate-200"}`}></div>
          <span className={`px-3 ${darkMode ? "text-slate-400" : "text-slate-500"} text-sm`}>OR</span>
          <div className={`w-full border-t ${darkMode ? "border-slate-700" : "border-slate-200"}`}></div>
        </div>

        <div className="flex justify-between text-sm mt-4">
          <a
            href="/forget-password"
            className={`hover:underline ${darkMode ? "text-blue-300" : "text-blue-600"}`}
          >
            Forgot Password?
          </a>
          <a
            href="/sign-up"
            className={`font-medium hover:underline ${darkMode ? "text-blue-300" : "text-blue-600"}`}
          >
            Create Account
          </a>
        </div>
      </div>
    </div>
  );
}