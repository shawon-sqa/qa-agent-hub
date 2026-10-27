"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  User,
  Settings,
  Shield,
  Key,
  LogOut,
  ExternalLink,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { CURRENT_USER } from "@/data/dashboardData";

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function Header({
  onOpenMobileSidebar,
  searchQuery,
  setSearchQuery,
}: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 sm:px-6 backdrop-blur-md transition-all">
      {/* Left: Mobile hamburger & Global Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileSidebar}
          className="flex lg:hidden items-center justify-center h-10 w-10 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test cases, suites, bugs, or modules..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-10 pr-12 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-hidden focus:ring-3 focus:ring-blue-500/10"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <kbd className="hidden sm:inline-flex items-center rounded border border-slate-200 bg-white px-1.5 font-mono text-[11px] font-medium text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Environment Pill, Notifications & Shawon Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-4 ml-4">
        {/* Environment Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
          <span>QA Environment</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500 font-mono text-[11px]">v2.4.0</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-semibold text-slate-900 text-sm">
                  Notifications & Alerts
                </h4>
                <span className="text-xs text-blue-600 hover:underline cursor-pointer font-medium">
                  Mark all read
                </span>
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs">
                  <div className="p-1 rounded-md bg-blue-600 text-white mt-0.5">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      Playwright Suite Completed
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      FinTech Banking test suite passed with 99.4% score.
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 inline-block">
                      12 mins ago
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs">
                  <div className="p-1 rounded-md bg-amber-600 text-white mt-0.5">
                    <CheckCircle className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">
                      New Regression Discovered
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      Coupon flow in E-Commerce store flagged edge case.
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 inline-block">
                      38 mins ago
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown for Shawon */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-1.5 sm:px-2 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all"
            aria-expanded={isProfileOpen}
          >
            <div className="relative flex items-center justify-center">
              {/* Shawon Avatar with status badge */}
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-[1.5px] shadow-sm">
                <div className="h-full w-full rounded-[10px] bg-slate-900 flex items-center justify-center text-white text-sm font-bold tracking-tight">
                  SA
                </div>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500"></span>
            </div>

            <div className="hidden text-left md:block">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-slate-800">
                  {CURRENT_USER.name}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              <span className="block text-xs font-medium text-slate-500">
                Lead QA Engineer
              </span>
            </div>
          </button>

          {/* Shawon Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User details header */}
              <div className="px-3 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    SA
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {CURRENT_USER.name}
                    </span>
                    <span className="text-xs text-slate-500 truncate">
                      {CURRENT_USER.email}
                    </span>
                  </div>
                </div>
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200/50">
                  <Shield className="h-3 w-3" />
                  Administrator Access
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1 text-xs font-medium text-slate-700">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Shawon&apos;s Profile & Activity</span>
                </button>

                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Key className="h-4 w-4 text-slate-400" />
                  <span>API Tokens & Webhooks</span>
                </button>

                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <Settings className="h-4 w-4 text-slate-400" />
                  <span>Workspace Preferences</span>
                </button>

                <a
                  href="#docs"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                    QA Agent Documentation
                  </span>
                  <span className="text-[10px] text-slate-400">v2.4</span>
                </a>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
