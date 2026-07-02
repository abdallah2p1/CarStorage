import { Car, Menu, X } from "lucide-react";
import { motion } from 'motion/react';
import { useState } from 'react';
import type { AppConfig } from "../utils/config";

type Page = "home" | "search" | "faq" | "admin"

export default function Header ({
  config,
  page,
  setPage,
}: {
  config: AppConfig;
  page :Page ;
  setPage: (p: Page) => void;
})
{
    const [open , setOpen]=useState(false);
    const navList: {label:string , value:Page}[]=[
        {label:"Home" , value:"home"},
        {label:"Search" , value:"search"},
        {label:"FAQ" , value:"faq"}
    ]

    const [hoveredTap , setHoveredTap]=useState<Page|null>(null)

    return(
<header className="sticky top-0 z-50 bg-[#111111]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-[1100px] mx-auto px-6 h-[60px] flex items-center justify-between">
        
        {/* Brand/Logo */}
        <button 
          onClick={() => setPage("home")} 
          className="flex items-center gap-2.5 bg-transparent cursor-pointer border-none text-left"
        >
          <div className="w-8 h-8 bg-[#D4622A] rounded-lg flex items-center justify-center">
            <Car className="w-4 h-4 text-white" />
          </div>
          <span className="font-['Outfit'] font-bold text-sm tracking-tight text-[#F2EDE8]">
            {config.company.logoText || config.company.name}
          </span>
        </button>
        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-1"
        onMouseLeave={()=> setHoveredTap(null)}>
          {navList.map((item) => {
            const showPill = hoveredTap === item.value || (hoveredTap === null && page === item.value);

            return (
              <button
                key={item.value}
                onClick={() => setPage(item.value)}
                onMouseEnter={()=> setHoveredTap(item.value)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-none bg-transparent transition-colors duration-150 ${
                 page === item.value ? "text-white" : "text-[#888880] hover:text-white"
                }`}
              >
                {showPill && (
                  <motion.div
                    layoutId="slidingNavPill"
                    className="absolute inset-0 bg-[#D4622A] rounded-full -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
               <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>
        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="sm:hidden text-[#888880] hover:text-[#F2EDE8] bg-transparent cursor-pointer p-1"
        >
          {open ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
        </button>
      </div>
      {/* Mobile Drawer */}
      {open && (
        <div className="sm:hidden bg-[#111111] border-t border-white/5 px-4 py-3 flex flex-col gap-1">
          {navList.map((item) => (
            <button
              key={item.value}
              onClick={() => {
                setPage(item.value);
                setOpen(false);
              }}
              className={`w-auto text-left py-3 px-3.5  rounded-full text-sm font-medium transition-colors duration-150 ${
                page === item.value ? "text-[#ffffff] bg-[#D4622A] shadow-[0_4px_12px_rgba(212,98,42,0.5)]" : "text-[#888880] "
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}