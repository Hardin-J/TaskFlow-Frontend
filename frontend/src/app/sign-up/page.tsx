"use client";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import bcrypt from 'bcryptjs'; // For password hashing
import { useRouter } from "next/navigation";
import { registerUser } from "@/services/User.services";

export default function SignUp() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",   
  });

  // Define role and department options
  // const roleOptions = ["student", "admin", "freelancer", "soft engg"];
  // const departmentOptions = ["Engineering", "Full Stack", "Marketing", "Design", "Product", "QA"];

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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear any previous errors when user starts typing again
    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) return "Please enter a valid email";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 8) return "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) return "Passwords do not match";
    // if (!formData.role) return "Please select a role";
    // if (!formData.department) return "Please select a department";
    return null;
  };

  // const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
    
  //   // Validate form
  //   const validationError = validateForm();
  //   if (validationError) {
  //     setError(validationError);
  //     return;
  //   }
    
  //   setLoading(true);
    
  //   try {
  //     // Hash the password (salt rounds = 10)
  //     const hashedPassword = await bcrypt.hash(formData.password, 10);
      
  //     // Create new user object
  //     const newUser = {
  //       // id: uuidv4(),
  //       name: formData.name,
  //       email: formData.email,
  //       password: formData.password,
  //       // role: formData.role,
  //       // department: formData.department,
  //       // lastLogin: new Date().toISOString()
  //     };
      
  //     // POST to mock JSON server
  //     const response = await registerUser(newUser);
      
  //     if (!response.status) {
  //       throw new Error('Failed to create account');
  //     }
      
  //     // Success
  //     setSuccess("Account created successfully! Redirecting to login...");
      
  //     // Reset form
  //     setFormData({
  //       name: "",
  //       email: "",
  //       password: "",
  //       confirmPassword: "",
  //       role: "",
  //       department: ""
  //     });
      
  //     // Redirect after 3 seconds
  //     setTimeout(() => {
  //       router.push('/login');
  //     }, 3000);
  //   } catch (err: unknown) {
  //     setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
  
    setLoading(true);
  
    try {
      // Create new user object
      const newUser = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };
  
      // Call the registration service
      const response = await registerUser(newUser);
  
      // Show success message from backend
      setSuccess(response.message);
  
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""      
      });
  
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
  
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
              <path d="M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2">Create Account</h2>
          <p className={`mb-6 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
            Join our professional community today
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className={`mb-4 p-3 rounded-lg ${darkMode ? "bg-green-900/30 text-green-200" : "bg-green-100 text-green-700"}`}>
            {success}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className={`mb-4 p-3 rounded-lg ${darkMode ? "bg-red-900/30 text-red-200" : "bg-red-100 text-red-700"}`}>
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" 
                className={`w-5 h-5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
              </svg>
            </div>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all ${
                darkMode
                  ? "bg-slate-800/70 text-white placeholder-slate-400 border-slate-600/50 focus:ring-blue-500/50"
                  : "bg-white/90 text-slate-800 placeholder-slate-500 border-slate-200 focus:ring-blue-500/50"
              }`}
              required
            />
          </div>

          {/* Email */}
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
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all ${
                darkMode
                  ? "bg-slate-800/70 text-white placeholder-slate-400 border-slate-600/50 focus:ring-blue-500/50"
                  : "bg-white/90 text-slate-800 placeholder-slate-500 border-slate-200 focus:ring-blue-500/50"
              }`}
              required
            />
          </div>

          {/* Password */}
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
              placeholder="Password (min. 8 characters)"
              value={formData.password}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all ${
                darkMode
                  ? "bg-slate-800/70 text-white placeholder-slate-400 border-slate-600/50 focus:ring-blue-500/50"
                  : "bg-white/90 text-slate-800 placeholder-slate-500 border-slate-200 focus:ring-blue-500/50"
              }`}
              required
            />
          </div>

          {/* Confirm Password */}
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
              placeholder="Confirm Password"
              value={formData.confirmPassword}
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
            disabled={loading}
            className={`w-full font-semibold py-3 rounded-lg transition-all duration-300 ${
              darkMode
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
                Creating Account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
        <div className="flex items-center my-6">
          <div className={`w-full border-t ${darkMode ? "border-slate-700" : "border-slate-200"}`}></div>
          <span className={`px-3 ${darkMode ? "text-slate-400" : "text-slate-500"} text-sm`}>OR</span>
          <div className={`w-full border-t ${darkMode ? "border-slate-700" : "border-slate-200"}`}></div>
        </div>
        <div className="flex justify-center text-sm mt-4">
          <a
            href="/login"
            className={`font-medium hover:underline ${darkMode ? "text-blue-300" : "text-blue-600"}`}
          >
            Already have an account? Log In
          </a>
        </div>

       

        
      </div>
    </div>
  );
}