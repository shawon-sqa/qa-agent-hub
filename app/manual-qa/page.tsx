"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { Header } from "@/components/header/Header";
import { ManualQaExecutionBoard } from "@/components/manual-qa/ManualQaExecutionBoard";

export default function ManualQaPage() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        activeModule="manual-qa"
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          searchQuery={globalSearch}
          setSearchQuery={setGlobalSearch}
        />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          <ManualQaExecutionBoard />
        </main>
      </div>
    </div>
  );
}
