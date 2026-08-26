import React, { useState, useEffect, useRef } from "react";
import { Flame, Mountain, Plus, ChevronRight, ChevronLeft, X, Tent, Footprints, Trash2, Pencil, Check, RotateCcw } from "lucide-react";

const STORAGE_KEY = "trailhead-data";
const MILES_PER_PEAK = 10;

const DEFAULT_QUICK_TASKS = {
  Chores: ["Do the dishes", "Laundry", "Tidy up my space", "Take out the trash", "Grocery run"],
  Work: ["Reply to emails", "Clear my inbox", "Plan tomorrow", "Pay a bill", "Book an appointment"],
  "Self-care": ["Stretch / move my body", "Drink water"],
};

const COLUMNS = [
  { id: "basecamp", label: "Basecamp", icon: Tent, hint: "Ideas waiting to start" },
  { id: "today", label: "Today's Trail", icon: Footprints, hint: "What you're hiking now" },
  { id: "summit", label: "Summit", icon: Mountain, hint: "Reached the top" },
];

function todayStr() {
  return new Date().toDateString();
}
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toDateString();
}
function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Trailhead() {
  const [loaded, setLoaded] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [streak, setStreak] = useState({ count: 0, lastDate: null });
  const [quickTasks, setQuickTasks] = useState(DEFAULT_QUICK_TASKS);
  const [newTitle, setNewTitle] = useState("");
  const [editingPicks, setEditingPicks] = useState(false);
  const [newPickText, setNewPickText] = useState("");
  const [newPickCategory, setNewPickCategory] = useState("Chores");
  const [justAdded, setJustAdded] = useState(null);
  const [stepDrafts, setStepDrafts] = useState({});
  const [celebrate, setCelebrate] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setTasks(parsed.tasks || []);
          setStreak(parsed.streak || { count: 0, lastDate: null });
          setQuickTasks(parsed.quickTasks || DEFAULT_QUICK_TASKS);
        }
      } catch (e) {
        // no saved data yet
      }
      hasLoadedRef.current = true;
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    (async () => {
      try {
        await window.storage.set(
          STORAGE_KEY,
          JSON.stringify({ tasks, streak, quickTasks }),
          false
        );
      } catch (e) {
        console.error("Save failed", e);
      }
    })();
  }, [tasks, streak, quickTasks]);

  function markActivity() {
    setStreak((prev) => {
      const t = todayStr();
      if (prev.lastDate === t) return prev;
      if (prev.lastDate === yesterdayStr()) {
        return { count: prev.count + 1, lastDate: t };
      }
      return { count: 1, lastDate: t };
    });
  }

  function addTaskWithTitle(title) {
    const clean = title.trim();
    if (!clean) return;
    const id = uid();
    setTasks((prev) => [
      ...prev,
      { id, title: clean, steps: [], column: "basecamp", createdAt: Date.now() },
    ]);
    setJustAdded(id);
    setTimeout(() => setJustAdded(null), 700);
  }

  function addTask() {
    addTaskWithTitle(newTitle);
    setNewTitle("");
  }

  function addQuickTask(title) {
    addTaskWithTitle(title);
  }

  function addCustomPick() {
    const text = newPickText.trim();
    if (!text) return;
    setQuickTasks((prev) => {
      const existing = prev[newPickCategory] || [];
      if (existing.includes(text)) return prev;
      return { ...prev, [newPickCategory]: [...existing, text] };
    });
    setNewPickText("");
  }

  function removePick(category, label) {
    setQuickTasks((prev) => ({
      ...prev,
      [category]: prev[category].filter((l) => l !== label),
    }));
  }

  function addStep(taskId) {
    const text = (stepDrafts[taskId] || "").trim();
    if (!text) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, steps: [...t.steps, { id: uid(), text, done: false }] }
          : t
      )
    );
    setStepDrafts((d) => ({ ...d, [taskId]: "" }));
  }

  function toggleStep(taskId, stepId) {
    let becameDone = false;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          steps: t.steps.map((s) => {
            if (s.id !== stepId) return s;
            if (!s.done) becameDone = true;
            return { ...s, done: !s.done };
          }),
        };
      })
    );
    if (becameDone) markActivity();
  }

  function removeStep(taskId, stepId) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, steps: t.steps.filter((s) => s.id !== stepId) }
          : t
      )
    );
  }

  function moveTask(taskId, direction) {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const idx = COLUMNS.findIndex((c) => c.id === t.column);
        const nextIdx = Math.min(
          COLUMNS.length - 1,
          Math.max(0, idx + direction)
        );
        const nextCol = COLUMNS[nextIdx].id;
        if (nextCol === "summit" && t.column !== "summit") {
          setCelebrate(taskId);
          setTimeout(() => setCelebrate(null), 900);
          markActivity();
        }
        return { ...t, column: nextCol };
      })
    );
  }

  function deleteTask(taskId) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  function clearAll() {
    setTasks([]);
    setStreak({ count: 0, lastDate: null });
    setConfirmClear(false);
  }

  const totalStepsDone = tasks.reduce(
    (sum, t) => sum + t.steps.filter((s) => s.done).length,
    0
  );
  const totalSummited = tasks.filter((t) => t.column === "summit").length;
  const miles = totalStepsDone * 1 + totalSummited * 3;
  const peak = Math.floor(miles / MILES_PER_PEAK) + 1;
  const progressInPeak = miles % MILES_PER_PEAK;
  const progressPct = (progressInPeak / MILES_PER_PEAK) * 100;

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1B2430", color: "#8A93A3" }}>
        Lacing up boots…
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "#1B2430",
        color: "#F0EDE5",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes pop {
          0% { transform: scale(0.9); opacity: 0.6; }
          60% { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .celebrate { animation: pop 0.5s ease; box-shadow: 0 0 0 2px #7FA98F; }
        @keyframes burst {
          0% { transform: translateY(0) scale(0.6); opacity: 1; }
          100% { transform: translateY(-24px) scale(1.2); opacity: 0; }
        }
        .spark { animation: burst 0.8s ease forwards; }
      `}</style>

      <div className="max-w-3xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl" style={{ color: "#F0EDE5" }}>
              Trailhead
            </h1>
            <p className="text-sm mt-1" style={{ color: "#8A93A3" }}>
              Small steps. Real ground covered.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-mono text-sm" style={{ color: "#E8873A" }}>
              <Flame size={16} />
              {streak.count}
            </div>
            {confirmClear ? (
              <div className="flex items-center gap-1 text-xs">
                <button onClick={clearAll} className="px-2 py-1 rounded" style={{ background: "#E8873A", color: "#1B2430" }}>
                  Confirm
                </button>
                <button onClick={() => setConfirmClear(false)} className="px-2 py-1 rounded" style={{ background: "#2A3547" }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                title="Clear all data"
                className="opacity-40 hover:opacity-80 transition-opacity"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Trail progress */}
        <div
          className="rounded-2xl p-4 mb-8"
          style={{ background: "#2A3547", border: "1px solid #3A4558" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs" style={{ color: "#8A93A3" }}>
              PEAK {peak}
            </span>
            <span className="font-mono text-xs" style={{ color: "#8A93A3" }}>
              {miles} mi total
            </span>
          </div>
          <div
            className="relative h-3 rounded-full overflow-hidden"
            style={{ background: "#1B2430" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #7FA98F, #E8873A)",
              }}
            />
          </div>
          <div className="text-right mt-1">
            <span style={{ fontSize: 14 }}>🥾</span>
          </div>
        </div>

        {/* Add task */}
        <div className="mb-8">
          <div className="flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="What's the next trail?"
              className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: "#2A3547", color: "#F0EDE5", border: "1px solid #3A4558" }}
            />
            <button
              onClick={addTask}
              className="rounded-xl px-4 flex items-center justify-center"
              style={{ background: "#E8873A", color: "#1B2430" }}
            >
              <Plus size={18} />
            </button>
          </div>

          <div
            className="rounded-2xl p-4 mt-3"
            style={{ background: "#2A3547", border: "1px solid #3A4558" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs" style={{ color: "#8A93A3" }}>
                QUICK PICKS — tap to add
              </span>
              <button
                onClick={() => setEditingPicks((v) => !v)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                style={{
                  background: editingPicks ? "#7FA98F" : "#1B2430",
                  color: editingPicks ? "#1B2430" : "#8A93A3",
                }}
              >
                {editingPicks ? <Check size={12} /> : <Pencil size={12} />}
                {editingPicks ? "Done" : "Edit"}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {Object.entries(quickTasks).map(([category, labels]) => (
                <div key={category}>
                  <p className="text-[10px] font-mono uppercase tracking-wide mb-1.5" style={{ color: "#7FA98F" }}>
                    {category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label) => (
                      <button
                        key={label}
                        onClick={() =>
                          editingPicks ? removePick(category, label) : addQuickTask(label)
                        }
                        className="text-xs px-3 py-2 rounded-full transition-transform active:scale-95 flex items-center gap-1.5"
                        style={{
                          background: "#1B2430",
                          color: editingPicks ? "#E8873A" : "#F0EDE5",
                          border: `1px solid ${editingPicks ? "#E8873A" : "#3A4558"}`,
                        }}
                      >
                        {label}
                        {editingPicks && <X size={11} />}
                      </button>
                    ))}
                    {labels.length === 0 && (
                      <span className="text-xs italic" style={{ color: "#8A93A3" }}>
                        none yet
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {editingPicks && (
              <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: "1px solid #3A4558" }}>
                <select
                  value={newPickCategory}
                  onChange={(e) => setNewPickCategory(e.target.value)}
                  className="text-xs rounded-lg px-2 outline-none"
                  style={{ background: "#1B2430", color: "#F0EDE5", border: "1px solid #3A4558" }}
                >
                  {Object.keys(quickTasks).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  value={newPickText}
                  onChange={(e) => setNewPickText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomPick()}
                  placeholder="Add a go-to task…"
                  className="flex-1 text-xs rounded-lg px-3 py-2 outline-none"
                  style={{ background: "#1B2430", color: "#F0EDE5", border: "1px solid #3A4558" }}
                />
                <button
                  onClick={addCustomPick}
                  className="rounded-lg px-3 flex items-center justify-center"
                  style={{ background: "#7FA98F", color: "#1B2430" }}
                >
                  <Plus size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Columns */}
        <div className="flex flex-col gap-8">
          {COLUMNS.map((col, colIdx) => {
            const colTasks = tasks.filter((t) => t.column === col.id);
            const Icon = col.icon;
            return (
              <div key={col.id}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={16} style={{ color: "#7FA98F" }} />
                  <h2 className="font-display text-lg">{col.label}</h2>
                  <span className="font-mono text-xs" style={{ color: "#8A93A3" }}>
                    {colTasks.length}
                  </span>
                </div>
                {colTasks.length === 0 ? (
                  <p className="text-xs italic mb-2" style={{ color: "#8A93A3" }}>
                    {col.hint}
                  </p>
                ) : null}
                <div className="flex flex-col gap-3">
                  {colTasks.map((t) => {
                    const doneSteps = t.steps.filter((s) => s.done).length;
                    return (
                      <div
                        key={t.id}
                        className={`rounded-xl p-4 ${celebrate === t.id ? "celebrate" : ""}`}
                        style={{
                          background: "#2A3547",
                          border:
                            col.id === "today"
                              ? "1px solid #E8873A"
                              : col.id === "summit"
                              ? "1px solid #7FA98F"
                              : "1px solid #3A4558",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium flex-1">{t.title}</p>
                          <button onClick={() => deleteTask(t.id)} style={{ color: "#8A93A3" }} className="shrink-0 mt-0.5">
                            <X size={14} />
                          </button>
                        </div>

                        {t.steps.length > 0 && (
                          <div className="mt-3 flex flex-col gap-1.5">
                            {t.steps.map((s) => (
                              <div key={s.id} className="flex items-center gap-2 group">
                                <button
                                  onClick={() => toggleStep(t.id, s.id)}
                                  className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center"
                                  style={{
                                    border: `1.5px solid ${s.done ? "#7FA98F" : "#8A93A3"}`,
                                    background: s.done ? "#7FA98F" : "transparent",
                                  }}
                                />
                                <span
                                  className="text-xs flex-1"
                                  style={{
                                    color: s.done ? "#8A93A3" : "#F0EDE5",
                                    textDecoration: s.done ? "line-through" : "none",
                                  }}
                                >
                                  {s.text}
                                </span>
                                <button
                                  onClick={() => removeStep(t.id, s.id)}
                                  className="opacity-0 group-hover:opacity-60"
                                  style={{ color: "#8A93A3" }}
                                >
                                  <X size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {t.steps.length > 0 && (
                          <p className="font-mono text-[10px] mt-2" style={{ color: "#8A93A3" }}>
                            {doneSteps}/{t.steps.length} stepping stones
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          <input
                            value={stepDrafts[t.id] || ""}
                            onChange={(e) =>
                              setStepDrafts((d) => ({ ...d, [t.id]: e.target.value }))
                            }
                            onKeyDown={(e) => e.key === "Enter" && addStep(t.id)}
                            placeholder={t.steps.length === 0 ? "Break it into one tiny step…" : "Another tiny step…"}
                            className="flex-1 text-xs rounded-lg px-2.5 py-1.5 outline-none"
                            style={{ background: "#1B2430", color: "#F0EDE5", border: "1px solid #3A4558" }}
                          />
                          <button
                            onClick={() => addStep(t.id)}
                            className="text-xs px-2 py-1.5 rounded-lg"
                            style={{ background: "#3A4558", color: "#F0EDE5" }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <div className="flex gap-2 mt-3">
                          {colIdx > 0 && (
                            <button
                              onClick={() => moveTask(t.id, -1)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium"
                              style={{ background: "#1B2430", color: "#8A93A3", border: "1px solid #3A4558" }}
                            >
                              {colIdx === 1 ? (
                                <>
                                  <ChevronLeft size={15} /> Back to Basecamp
                                </>
                              ) : (
                                <>
                                  <RotateCcw size={14} /> Reopen
                                </>
                              )}
                            </button>
                          )}
                          {colIdx < COLUMNS.length - 1 && (
                            <button
                              onClick={() => moveTask(t.id, 1)}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold"
                              style={{
                                background: colIdx === 1 ? "#7FA98F" : "#E8873A",
                                color: "#1B2430",
                              }}
                            >
                              {colIdx === 0 ? (
                                <>
                                  Start <ChevronRight size={15} />
                                </>
                              ) : (
                                <>
                                  <Check size={15} /> Mark Done
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
