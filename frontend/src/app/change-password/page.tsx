"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";
import { changePassword } from "@/services/User.services";
import { log } from "console";

interface FormData {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ChangePassword() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState<FormData>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load dark mode preference and reset email from local storage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);
    document.documentElement.classList.toggle("dark", savedDarkMode);

    // Get email from localStorage that was set in forgot password page
    const resetEmail = localStorage.getItem("resetEmail");
    if (resetEmail) {
      setEmail(resetEmail);
    } else {
      // If no email is found, redirect back to forgot password
      router.push("/forgot-password");
    }
  }, [router]);

  // Save dark mode preference to local storage
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode.toString());
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate inputs
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords don't match");
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      // Fetch users from json-server
      console.log(formData);
      console.log(email)
      const input = { email: email, oldPassword: formData.oldPassword, newPassword: formData.newPassword }
      console.log(input);

      const response = await changePassword(input);
      console.log(response);

      if (!response) {
        setError("User not found");
        setLoading(false);
        return;
      }

      let isOldPasswordValid = false;





      // Update user with new password
      // await fetch(`http://localhost:3001/users/${user.id}`, {
      //   method: "PATCH",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     password: formData.oldPassword,
      //     tempPassword: null,
      //     passwordResetRequested: null,
      //     passwordChangedAt: new Date().toISOString(),
      //   }),
      // });

      // Show success message
      setSuccess(true);

      // Clear reset email from localStorage
      localStorage.removeItem("resetEmail");

      // Redirect to login page after a brief delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Password change error:", err);
      setError(err.message);
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
              <path fillRule="evenodd" d="M15.75 1.5a6.75 6.75 0 00-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 00-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 00.75-.75v-1.5h1.5A.75.75 0 009 19.5V18h1.5a.75.75 0 00.75-.75V15h1.5a.75.75 0 00.75-.75v-1.5h1.5a.75.75 0 00.75-.75V9.81a8.998 8.998 0 002.207-3.778A7.5 7.5 0 0015.75 1.5zm-6 0A.75.75 0 0010.5 3a4.5 4.5 0 018.785 1.5.75.75 0 001.092-.49 6 6 0 00-11.384-2.96A.75.75 0 009.75 1.5z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2">Change Password</h2>
          <p className={`mb-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            Create a new password for your account
          </p>
        </div>

        {error && (
          <div className={`mb-4 p-3 rounded-lg ${darkMode ? "bg-red-900/30 text-red-200" : "bg-red-100 text-red-700"}`}>
            {error}
          </div>
        )}

        {success && (
          <div className={`mb-4 p-3 rounded-lg ${darkMode ? "bg-green-900/30 text-green-200" : "bg-green-100 text-green-700"}`}>
            Password changed successfully! Redirecting to login...
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                className={`w-5 h-5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="password"
              name="oldPassword"
              placeholder="Current/Temporary Password"
              value={formData.oldPassword}
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
              name="newPassword"
              placeholder="New Password"
              value={formData.newPassword}
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
              name="confirmPassword"
              placeholder="Confirm New Password"
              value={formData.confirmPassword}
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
            disabled={loading || success}
            className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 ${darkMode
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
                Updating...
              </span>
            ) : (
              "Update Password"
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