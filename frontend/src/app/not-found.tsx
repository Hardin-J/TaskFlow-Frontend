"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

const NotFound = () => {
  const router = useRouter();
  const sceneRef = useRef<HTMLDivElement>(null); // Fixed type definition here
  const [darkMode, setDarkMode] = useState(false);

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

  // Initialize parallax effect
  // useEffect(() => {
  //   if (sceneRef.current && typeof window !== "undefined") {
  //     // Dynamic import for client-side only
  //     import("parallax-js").then((Parallax) => {
  //       // Add null check to satisfy TypeScript
  //       if (sceneRef.current) {
  //         const parallaxInstance = new Parallax.default(sceneRef.current);
          
  //         // Clean up parallax instance when component unmounts
  //         return () => {
  //           parallaxInstance.destroy();
  //         };
  //       }
  //     });
  //   }
  // }, []);

  const handleBack = () => {
    router.push("/login");
  };

  return (
    <div
      className={`min-h-screen w-full font-sans transition-all duration-500 ${
        darkMode
          ? "bg-[#36184f] via-[#36184f] to-[#695681]"
          : "bg-[#695681]"
      }`}
    >
      {/* Theme Toggle Button */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`absolute top-6 right-6 p-3 rounded-full backdrop-blur-md shadow-lg transition-all z-10 ${
          darkMode 
            ? "bg-[#1E293B]/40 text-[#E2E8F0] hover:bg-[#1E40AF]/30" 
            : "bg-white/20 text-white hover:bg-white/40"
        }`}
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        )}
      </button>

      {/* Social Links */}
      <div className="fixed z-10 bottom-2.5 right-2.5 w-10 h-10 flex justify-end items-end transition-all duration-200 ease">
        <a
          className="w-10 h-10 rounded-full flex justify-center items-center bg-black/20 absolute backdrop-blur-sm"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="icon"></span>
        </a>
      </div>

      {/* Navigation */}
      <nav className="w-full h-20 absolute flex items-center justify-between px-[5%] box-border z-[3]">
        <div className="flex items-center justify-between w-full">
          <div className="w-40">
            {/* Logo placeholder */}
            <div className={`font-bold text-xl ${darkMode ? "text-[#E2E8F0]" : "text-white"}`}>
              YourLogo
            </div>
          </div>
          <div className="transition-all duration-400 ease opacity-50 hover:opacity-100">
           
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="grid grid-cols-1 justify-center items-center h-screen overflow-x-hidden">
        <div className="m-0 auto transition-all duration-400 ease flex justify-center items-center relative">
          {/* Scene */}
          <div 
            ref={sceneRef} 
            id="scene" 
            className="absolute w-screen h-screen align-middle"
            data-hover-only="false"
          >
            {/* Circle */}
            <div 
              className="w-3/5 h-3/5 top-[20%] left-[20%] min-w-[100px] min-h-[400px] before:content-[''] before:absolute before:w-[800px] before:h-[800px] before:bg-[rgba(54,24,79,0.2)] before:rounded-full before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:shadow-[inset_5px_20px_40px_rgba(54,24,79,0.25),inset_5px_0px_5px_rgba(50,36,62,0.3),inset_5px_5px_20px_rgba(50,36,62,0.25),2px_2px_5px_rgba(255,255,255,0.2)] before:animate-[circle_0.8s_cubic-bezier(1,0.06,0.25,1)_backwards] md:before:w-[400px] md:before:h-[400px]" 
              data-depth="1.2"
            ></div>
            
            {/* First Layer */}
            <div 
              className="absolute w-3/5 h-3/5 top-[20%] left-[20%] min-w-[400px] min-h-[400px]" 
              data-depth="0.9"
            >
              <div className="w-[400px] h-[400px] flex justify-center items-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[content_0.8s_cubic-bezier(1,0.06,0.25,1)_backwards] before:content-[''] before:absolute before:w-[600px] before:h-[600px] before:bg-[rgba(54,24,79,0.3)] before:rounded-full before:shadow-[inset_5px_20px_40px_rgba(54,24,79,0.25),inset_5px_0px_5px_rgba(50,36,62,0.3),inset_5px_5px_20px_rgba(50,36,62,0.25),2px_2px_5px_rgba(255,255,255,0.2)] before:animate-[circle_0.8s_0.4s_cubic-bezier(1,0.06,0.25,1)_backwards] md:before:w-[300px] md:before:h-[300px]">
                <span className="bg-gradient-to-r from-[#8077ea] to-[#eb73ff] w-[120px] h-[30px] flex absolute rounded-[80px] z-[1] right-[15%] top-[18%] animate-[pieceRight_8s_cubic-bezier(1,0.06,0.25,1)_0.5s_infinite_both]"></span>
                <span className="bg-gradient-to-r from-[#8077ea] to-[#eb73ff] w-[150px] h-[50px] flex absolute rounded-[80px] z-[1] left-[15%] top-[45%] animate-[pieceLeft_8s_cubic-bezier(1,0.06,0.25,1)_1s_infinite_both]"></span>
                <span className="bg-gradient-to-r from-[#8077ea] to-[#eb73ff] w-[70px] h-[20px] flex absolute rounded-[80px] z-[1] left-[10%] top-[75%] animate-[pieceLeft_8s_cubic-bezier(1,0.06,0.25,1)_1.5s_infinite_both]"></span>
              </div>
            </div>
            
            {/* Second Layer */}
            <div 
              className="absolute w-3/5 h-3/5 top-[20%] left-[20%] min-w-[400px] min-h-[400px]" 
              data-depth="0.60"
            >
              <div className="w-[600px] h-[600px] flex justify-center items-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[content_0.8s_cubic-bezier(1,0.06,0.25,1)_backwards]">
                <span className="bg-gradient-to-r from-[#ffedc0] to-[#ff9d87] w-[120px] h-[40px] flex absolute rounded-[80px] z-[1] left-[0%] top-[25%] animate-[pieceLeft_8s_cubic-bezier(1,0.06,0.25,1)_2s_infinite_both]"></span>
                <span className="bg-gradient-to-r from-[#ffedc0] to-[#ff9d87] w-[180px] h-[50px] flex absolute rounded-[80px] z-[1] right-[15%] top-[35%] animate-[pieceRight_8s_cubic-bezier(1,0.06,0.25,1)_2.5s_infinite_both]"></span>
                <span className="bg-gradient-to-r from-[#ffedc0] to-[#ff9d87] w-[160px] h-[20px] flex absolute rounded-[80px] z-[1] right-[10%] top-[80%] animate-[pieceRight_8s_cubic-bezier(1,0.06,0.25,1)_3s_infinite_both]"></span>
              </div>
            </div>
            
            {/* Third Layer */}
            <div 
              className="absolute w-3/5 h-3/5 top-[20%] left-[20%] min-w-[400px] min-h-[400px]" 
              data-depth="0.40"
            >
              <div className="w-[600px] h-[600px] flex justify-center items-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[content_0.8s_cubic-bezier(1,0.06,0.25,1)_backwards]">
                <span className="bg-[#fb8a8a] w-[80px] h-[20px] flex absolute rounded-[80px] z-[1] left-[25%] top-[35%] animate-[pieceLeft_8s_cubic-bezier(1,0.06,0.25,1)_3.5s_infinite_both]"></span>
                <span className="bg-[#fb8a8a] w-[140px] h-[40px] flex absolute rounded-[80px] z-[1] right-[10%] top-[55%] animate-[pieceRight_8s_cubic-bezier(1,0.06,0.25,1)_4s_infinite_both]"></span>
                <span className="bg-[#fb8a8a] w-[80px] h-[20px] flex absolute rounded-[80px] z-[1] left-[40%] top-[68%] animate-[pieceLeft_8s_cubic-bezier(1,0.06,0.25,1)_4.5s_infinite_both]"></span>
              </div>
            </div>
            
            {/* 404 Text (First Layer) */}
            <p 
              className="text-[200px] font-bold tracking-[4px] text-white flex justify-center items-center absolute z-[2] w-3/5 h-3/5 top-[20%] left-[20%] min-w-[400px] min-h-[400px] animate-[anime404_0.6s_1.2s_cubic-bezier(0.3,0.8,1,1.05)_both] md:text-[100px]" 
              data-depth="0.50"
            >
              404
            </p>
            
            {/* 404 Text (Shadow Layer) */}
            <p 
              className="text-[200px] font-bold tracking-[4px] text-[#36184f] flex justify-center items-center absolute z-[1] w-3/5 h-3/5 top-[20%] left-[20%] min-w-[400px] min-h-[400px] animate-[anime404_0.6s_1s_cubic-bezier(0.3,0.8,1,1.05)_both] blur-[10px] opacity-80 md:text-[100px]" 
              data-depth="0.10"
            >
              404
            </p>
          </div>

          {/* Text Content */}
          <div className="w-3/5 h-2/5 min-w-[100px] min-h-[650px] absolute my-10 animate-[text_0.6s_1.8s_ease_backwards]">
            <article className="w-[400px] absolute bottom-0 z-[4] flex flex-col justify-center items-center text-center left-1/2 -translate-x-1/2">
              <div className={`backdrop-blur-lg border rounded-2xl p-8 shadow-xl mb-8 ${
                darkMode 
                  ? "bg-[#36184f]/70 border-[#32243e]/50 text-[#E2E8F0]" 
                  : "bg-[#695681]/30 border-[#32243e]/20 text-white"
              }`}>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Oops! Page Not Found
                </h2>
                <p className="mb-6 text-white/80">
                  Uh oh! Looks like you've wandered into uncharted territory.
                  <br />
                  Go back to the Login if you dare!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleBack}
                  className="h-10 px-8 rounded-full cursor-pointer shadow-[0px_15px_20px_rgba(54,24,79,0.5)] z-[3] text-[#695681] bg-white uppercase font-semibold text-xs transition-all duration-300 ease hover:shadow-[0px_10px_10px_-10px_rgba(54,24,79,0.5)] hover:translate-y-[5px] hover:bg-[#fb8a8a] hover:text-white"
                >
                  I dare!
                </button>
                
                <button 
                  onClick={() => router.push("/")}
                  className={`h-10 px-8 rounded-full cursor-pointer shadow-[0px_15px_20px_rgba(54,24,79,0.5)] z-[3] uppercase font-semibold text-xs transition-all duration-300 ease hover:shadow-[0px_10px_10px_-10px_rgba(54,24,79,0.5)] hover:translate-y-[5px] ${
                    darkMode
                      ? "bg-[#36184f] border border-[#8077ea] text-white hover:bg-[#8077ea]" 
                      : "bg-[#36184f]/70 text-white hover:bg-[#8077ea]"
                  }`}
                >
                  Go Home
                </button>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Animation Keyframes */}
      <style jsx global>{`
        @keyframes circle {
          0% {
            width: 0;
            height: 0;
          }
        }
        
        @keyframes content {
          0% {
            width: 0;
          }
        }
        
        @keyframes pieceLeft {
          50% {
            left: 80%;
            width: 10%;
          }
        }
        
        @keyframes pieceRight {
          50% {
            right: 80%;
            width: 10%;
          }
        }
        
        @keyframes anime404 {
          0% {
            opacity: 0;
            transform: scale(10) skew(20deg, 20deg);
          }
        }
        
        @keyframes text {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
        }
      `}</style>
    </div>
  );
};

export default NotFound;