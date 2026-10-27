"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { QUICK_STATS } from "@/data/dashboardData";

export function QuickStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {QUICK_STATS.map((stat) => {
        const Icon = stat.icon;
        const isTrendUp = stat.trend === "up";
        const isTrendDown = stat.trend === "down";

        return (
          <div
            key={stat.id}
            className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200"
          >
            {/* Top decorative gradient bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.accentColor}`}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {stat.title}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr ${stat.accentColor} text-white shadow-xs`}
              >
                <Icon className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                {stat.value}
              </span>

              <div
                className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                  stat.id === "open-bugs"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : isTrendUp
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {isTrendUp ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : isTrendDown ? (
                  <ArrowDownRight className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                <span>{stat.change}</span>
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-500 font-medium">
              {stat.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
