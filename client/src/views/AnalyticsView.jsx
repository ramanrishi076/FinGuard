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
    { name: "Approved", value: decisionCounts.APPROVED || (transactions.length === 0 ? 1 : 0), color: "#34a853" },
    { name: "Review", value: decisionCounts.REVIEW, color: "#fbbc04" },
    { name: "Flagged", value: decisionCounts.FLAGGED, color: "#f9ab00" },
    { name: "Blocked", value: decisionCounts.BLOCKED, color: "#ea4335" },
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
          FinGuard Protect • AI Telemetry
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">
          Inspection of the Google Pay-grade machine learning model weights, real-time risk evaluations, and live socket streams.
        </p>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-tertiary)]">Dataset Scale</span>
            <Sparkles className="w-4 h-4 text-[var(--gpay-blue-light)]" />
          </div>
          <span className="text-2xl font-black text-[var(--text-primary)] font-mono block">100,000</span>
          <span className="text-[11px] text-[var(--text-tertiary)]">Synthetic transactions (Seed 42)</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-tertiary)]">Model Accuracy</span>
            <CheckCircle2 className="w-4 h-4 text-[#81c995]" />
          </div>
          <span className="text-2xl font-black text-[#81c995] font-mono block">99.98%</span>
          <span className="text-[11px] text-[var(--text-tertiary)]">Evaluated on 20k test set</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-tertiary)]">Fraud Recall</span>
            <ShieldAlert className="w-4 h-4 text-[var(--gpay-blue-light)]" />
          </div>
          <span className="text-2xl font-black text-[var(--gpay-blue-light)] font-mono block">100.0%</span>
          <span className="text-[11px] text-[var(--text-tertiary)]">0 False Negatives</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-tertiary)]">Inference Engine</span>
            <Radio className="w-4 h-4 text-[#81c995] animate-pulse" />
          </div>
          <span className="text-2xl font-black text-[var(--text-primary)] font-mono block">&lt; 0.1ms</span>
          <span className="text-[11px] text-[#81c995]">Native Node.js • Live</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ML Feature Weights Chart */}
        <div className="lg:col-span-8 rounded-3xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[var(--gpay-blue-light)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Learned Feature Weights (Standardized ML)</h3>
            </div>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#1b6ef3]/20 text-[var(--gpay-blue-light)] border border-[#1b6ef3]/30">
              LOGISTIC REGRESSION
            </span>
          </div>

          <p className="text-xs text-[var(--text-tertiary)] mb-6">
            Positive coefficients directly correlate with fraud escalation. Rapid velocity and extreme account drain ratios exert the strongest predictive pressure.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mlFeatureWeights}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
                <YAxis
                  dataKey="feature"
                  type="category"
                  stroke="var(--text-tertiary)"
                  tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                  width={130}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-2xl bg-[var(--tooltip-bg)] border border-[var(--border)] text-xs shadow-xl">
                          <p className="font-bold text-[var(--text-primary)]">{data.feature}</p>
                          <p className="text-[var(--gpay-blue-light)] font-mono font-semibold">
                            Coefficient: +{data.weight}
                          </p>
                          <p className="text-[var(--text-tertiary)] text-[11px] mt-1">{data.desc}</p>
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
                      fill={index === 0 ? "#1b6ef3" : index === 1 ? "#4285F4" : "#8ab4f8"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud Decision Breakdown Donut */}
        <div className="lg:col-span-4 rounded-3xl bg-[var(--surface)] p-6 border border-[var(--border)] flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[var(--gpay-blue-light)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Decision Breakdown</h3>
              </div>
              <span className="text-xs text-[var(--text-tertiary)] font-mono">
                {transactions.length} total
              </span>
            </div>

            <p className="text-xs text-[var(--text-tertiary)] mb-4">
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
                          <div className="p-2 rounded-xl bg-[var(--tooltip-bg)] border border-[var(--border)] text-xs shadow-xl">
                            <span className="font-bold text-[var(--text-primary)]">{data.name}: </span>
                            <span className="font-mono text-[var(--gpay-blue-light)]">{data.value}</span>
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

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--border)] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34a853]" />
              <span className="text-[var(--text-tertiary)]">Approved: {decisionCounts.APPROVED}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fbbc04]" />
              <span className="text-[var(--text-tertiary)]">Review: {decisionCounts.REVIEW}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f9ab00]" />
              <span className="text-[var(--text-tertiary)]">Flagged: {decisionCounts.FLAGGED}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ea4335]" />
              <span className="text-[var(--text-tertiary)]">Blocked: {decisionCounts.BLOCKED}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Event Stream / Audit Feed */}
      <div className="rounded-3xl bg-[var(--surface)] p-6 border border-[var(--border)] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#81c995]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Live Event Stream (Socket.IO Telemetry)</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#81c995]">
            <span className="w-2 h-2 rounded-full bg-[#34a853] animate-ping" />
            <span>Listening Live</span>
          </div>
        </div>

        {liveEvents.length === 0 ? (
          <div className="py-8 text-center text-[var(--text-muted)] text-xs">
            Awaiting live events. Perform a deposit, withdrawal, or transfer to observe real-time telemetry.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {liveEvents.map((event) => (
              <div
                key={event.id}
                className="py-2.5 px-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`p-1.5 rounded-full ${
                      event.type === "FRAUD_ALERT"
                        ? "bg-[#ea4335]/20 text-[#f28b82]"
                        : event.type === "BALANCE_UPDATED"
                        ? "bg-[#1b6ef3]/20 text-[var(--gpay-blue-light)]"
                        : "bg-[#34a853]/20 text-[#81c995]"
                    }`}
                  >
                    {event.type === "FRAUD_ALERT" ? (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    ) : (
                      <Activity className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <div>
                    <span className="font-semibold text-[var(--text-secondary)] block">{event.title}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                      Type: {event.type}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
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
