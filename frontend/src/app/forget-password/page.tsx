"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { forgetPassword } from "@/services/User.services";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Load dark mode preference from local storage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle("dark", savedDarkMode);
  }, []);

  // Save dark mode preference to local storage
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
  
    if (!email) {
      setError("Please enter your email address");
      // toast.error("Please enter your email address");
      setLoading(false);
      return;
    }
  
    try {
      const response = await forgetPassword({ email });
  
      // Optional: Log the temporary password expiry for dev purposes
      console.log(`Password reset email sent. Expires at: ${response.expiresAt}`);
  
      // Store the email in localStorage to be used in change-password
      localStorage.setItem("resetEmail", email);
  
      setSuccess(true);
      // toast.success("Temporary password sent. Redirecting...");
  
      // Redirect to change-password page
      setTimeout(() => {
        router.push("/change-password");
      }, 2000);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      // toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center min-h-screen transition-all duration-500 ${
        darkMode
          ? "bg-gradient-to-br from-gray-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-sky-50 via-white to-blue-50"
      } p-6`}
    >
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
        className={`backdrop-blur-lg border shadow-xl rounded-2xl p-8 w-full max-w-md text-center transition-all duration-500 ${
          darkMode
            ? "bg-slate-900/70 border-slate-700/50 text-white"
            : "bg-white/80 border-gray-200/50 text-gray-900"
        }`}
      >
        <div className="mb-6">
          <div className="mx-auto w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2">Forgot Password</h2>
          <p className={`mb-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            Enter your email and we'll send you a temporary password to reset your account
          </p>
        </div>

        {error && (
          <div className={`mb-4 p-3 rounded-lg ${darkMode ? "bg-red-900/30 text-red-200" : "bg-red-100 text-red-700"}`}>
            {error}
          </div>
        )}

        {success && (
          <div className={`mb-4 p-3 rounded-lg ${darkMode ? "bg-green-900/30 text-green-200" : "bg-green-100 text-green-700"}`}>
            Password reset email sent! Redirecting you to change your password...
          </div>
        )}

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
              placeholder="Enter your email"
              value={email}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all ${
                darkMode
                  ? "bg-slate-800/70 text-white placeholder-slate-400 border-slate-600/50 focus:ring-blue-500/50"
                  : "bg-white/90 text-slate-800 placeholder-slate-500 border-slate-200 focus:ring-blue-500/50"
              }`}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 ${
              darkMode
                ? "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            } ${(loading || success) ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <div className="mt-6">
          <a
            href="/login"
            className={`text-sm hover:underline ${darkMode ? "text-blue-300" : "text-blue-600"}`}
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}