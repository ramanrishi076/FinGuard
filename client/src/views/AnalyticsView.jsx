import React from "react";
import { useSocket } from "../context/SocketContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Cpu,
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Radio,
  Sparkles,
} from "lucide-react";

export const AnalyticsView = ({ transactions }) => {
  const { isConnected, liveEvents, alerts } = useSocket();

  // 1. Calculate Decision Distribution
  const decisionCounts = {
    APPROVED: transactions.filter((t) => t.status === "APPROVED").length,
    REVIEW: transactions.filter((t) => t.status === "REVIEW").length,
    FLAGGED: transactions.filter((t) => t.status === "FLAGGED").length,
    BLOCKED: transactions.filter((t) => t.status === "BLOCKED").length,
  };

  const decisionData = [
    { name: "Approved", value: decisionCounts.APPROVED || (transactions.length === 0 ? 1 : 0), color: "#10b981" },
    { name: "Review", value: decisionCounts.REVIEW, color: "#facc15" },
    { name: "Flagged", value: decisionCounts.FLAGGED, color: "#f97316" },
    { name: "Blocked", value: decisionCounts.BLOCKED, color: "#f43f5e" },
  ].filter((d) => d.value > 0);

  // 2. Trained Feature Weights from 100k Model
  const mlFeatureWeights = [
    { feature: "Recent Velocity (10m)", weight: 12.958, desc: "High transfer frequency triggers bot/smurfing alert" },
    { feature: "Balance Drain Ratio", weight: 5.841, desc: "Attempting to drain >85% of account balance" },
    { feature: "Transfer Amount", weight: 2.112, desc: "Outlier transaction magnitude" },
    { feature: "Prior Balance", weight: 1.044, desc: "Historical account reserve scale" },
    { feature: "Remaining Balance", weight: 0.633, desc: "Residual wallet reserve buffer" },
    { feature: "Off-Hours Activity", weight: 0.538, desc: "Midnight-to-5AM anomalous timing" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          AI Fraud Engine Analytics & Telemetry
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Inspection of the Phase 5 machine-learning model weights, real-time fraud distributions, and live event streams.
        </p>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass-panel-elevated bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Training Scale</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-black text-white font-mono block">100,000</span>
          <span className="text-[11px] text-slate-500">Synthetic transactions (Seed 42)</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel-elevated bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Model Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-black text-emerald-400 font-mono block">99.98%</span>
          <span className="text-[11px] text-slate-500">Evaluated on 20k test set</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel-elevated bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Fraud Recall</span>
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-black text-cyan-400 font-mono block">100.0%</span>
          <span className="text-[11px] text-slate-500">0 False Negatives caught</span>
        </div>

        <div className="p-5 rounded-2xl glass-panel-elevated bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Inference Engine</span>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <span className="text-2xl font-black text-white font-mono block">&lt; 0.1ms</span>
          <span className="text-[11px] text-emerald-400">Native Node.js • Desktop-Ready</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ML Feature Weights Chart */}
        <div className="lg:col-span-8 rounded-3xl glass-panel-elevated bg-slate-900/90 p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Learned Feature Weights (Standardized Logistic Model)</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              LOGISTIC REGRESSION
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-6">
            Positive coefficients directly correlate with fraud escalation. Rapid velocity and extreme account drain ratios exert the strongest predictive pressure.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mlFeatureWeights}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="feature"
                  type="category"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  width={130}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs shadow-xl">
                          <p className="font-bold text-white">{data.feature}</p>
                          <p className="text-cyan-400 font-mono font-semibold">
                            Coefficient: +{data.weight}
                          </p>
                          <p className="text-slate-400 text-[11px] mt-1">{data.desc}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="weight" radius={[0, 8, 8, 0]}>
                  {mlFeatureWeights.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#06b6d4" : index === 1 ? "#3b82f6" : "#6366f1"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud Decision Breakdown Donut */}
        <div className="lg:col-span-4 rounded-3xl glass-panel-elevated bg-slate-900/90 p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Decision Breakdown</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {transactions.length} total
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Distribution of wallet transactions by AI evaluation category.
            </p>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={decisionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {decisionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs shadow-xl">
                            <span className="font-bold text-white">{data.name}: </span>
                            <span className="font-mono text-cyan-400">{data.value}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Approved: {decisionCounts.APPROVED}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-slate-400">Review: {decisionCounts.REVIEW}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-400">Flagged: {decisionCounts.FLAGGED}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-400">Blocked: {decisionCounts.BLOCKED}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Event Stream / Audit Feed */}
      <div className="rounded-3xl glass-panel-elevated bg-slate-900/90 p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Live Real-Time Event Stream (Socket.IO Telemetry)</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Listening Live</span>
          </div>
        </div>

        {liveEvents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Awaiting live events. Perform a deposit, withdrawal, or transfer to observe real-time telemetry.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {liveEvents.map((event) => (
              <div
                key={event.id}
                className="py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`p-1.5 rounded-lg ${
                      event.type === "FRAUD_ALERT"
                        ? "bg-rose-500/20 text-rose-400"
                        : event.type === "BALANCE_UPDATED"
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {event.type === "FRAUD_ALERT" ? (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    ) : (
                      <Activity className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <div>
                    <span className="font-semibold text-slate-200 block">{event.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Type: {event.type}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 font-mono">
                  {new Date(event.time).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
