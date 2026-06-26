// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────

const COURSE_COLORS = {
  CS401:   "badge-blue",
  MATH301: "badge-purple",
  ENG202:  "badge-teal",
  PHY110:  "badge-coral",
  HIS205:  "badge-amber",
  BIO320:  "badge-pink",
};

const STATUS_CYCLE = {
  "pending":     "in-progress",
  "in-progress": "submitted",
  "submitted":   "pending",
};

const STATUS_LABEL = {
  "pending":     "Pending",
  "in-progress": "In progress",
  "submitted":   "Submitted",
};

const PRIORITY_LABEL = {
  high: "High",
  med:  "Medium",
  low:  "Low",
};

// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────

let items = [
  { id: 1, title: "Natural language processing assignment", course: "AI",   dueDate: "2026-06-28", priority: "high", status: "in-progress", notes: "Include complexity analysis" },
  { id: 2, title: "Social media sentiment analysis", course: "DATA SCIENCE", dueDate: "2026-06-27", priority: "high", status: "pending",     notes: "" },
  { id: 3, title: "bank transaction handling",     course: "DBMS",  dueDate: "2026-07-03", priority: "med",  status: "submitted",   notes: "5 pages minimum" },
  { id: 4, title: "CPU scheduling simulation",         course: "OPERATING SYSTEMS",  dueDate: "2026-07-01", priority: "med",  status: "pending",     notes: "" },
  { id: 5, title: "Dynamic expense tracker dashboard",      course: "ASP.NET",  dueDate: "2026-07-10", priority: "low",  status: "pending",     notes: "" },
  { id: 6, title: "Document object model",            course: "JAVASCRIPT",  dueDate: "2026-06-26", priority: "high", status: "submitted",   notes: "Submit via LMS" },
];

let nextId    = 100;
let editingId = null; // null = add mode, number = edit mode

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

/**
 * Returns days remaining until due date.
 * Negative = overdue.
 */
function daysDiff(dateStr) {
  const due = new Date(dateStr + "T23:59:59");
  const now = new Date();
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

/** Builds the due-date label HTML for a card. */
function dueLabelHTML(dateStr, status) {
  const fmt = new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  if (status === "submitted") {
    return `<span class="meta-item"><i class="ti ti-circle-check"></i>${fmt}</span>`;
  }

  const d = daysDiff(dateStr);
  if (d < 0)   return `<span class="meta-item overdue-text"><i class="ti ti-alert-triangle"></i>Overdue by ${-d}d</span>`;
  if (d === 0) return `<span class="meta-item soon-text"><i class="ti ti-clock"></i>Due today</span>`;
  if (d === 1) return `<span class="meta-item soon-text"><i class="ti ti-clock"></i>Due tomorrow</span>`;
  if (d <= 3)  return `<span class="meta-item soon-text"><i class="ti ti-clock"></i>Due in ${d}d</span>`;
  return `<span class="meta-item"><i class="ti ti-calendar"></i>${fmt}</span>`;
}

/** Returns CSS class string for a card based on status / deadline. */
function cardClass(a) {
  if (a.status === "submitted") return "assign-card submitted";
  const d = daysDiff(a.dueDate);
  if (d < 0)  return "assign-card overdue";
  if (d <= 2) return "assign-card due-soon";
  return "assign-card";
}

/** Escapes HTML special characters to prevent XSS. */
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─────────────────────────────────────────────
//  FILTERING
// ─────────────────────────────────────────────

function getFiltered() {
  const q       = document.getElementById("search-input").value.toLowerCase();
  const fStatus = document.getElementById("filter-status").value;
  const fCourse = document.getElementById("filter-course").value;

  return items
    .filter(a => {
      if (fStatus !== "all" && a.status !== fStatus) return false;
      if (fCourse !== "all" && a.course !== fCourse) return false;
      if (q && !a.title.toLowerCase().includes(q) && !a.course.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
}

// ─────────────────────────────────────────────
//  RENDER
// ─────────────────────────────────────────────

function render() {
  // ── Update stats ──
  const submitted = items.filter(a => a.status === "submitted").length;
  const overdue   = items.filter(a => a.status !== "submitted" && daysDiff(a.dueDate) < 0).length;
  const dueSoon   = items.filter(a => a.status !== "submitted" && daysDiff(a.dueDate) >= 0 && daysDiff(a.dueDate) <= 3).length;
  const pct       = items.length ? Math.round((submitted / items.length) * 100) : 0;

  document.getElementById("subtitle").textContent       = `${items.length} total · ${pct}% submitted`;
  document.getElementById("progress-fill").style.width  = pct + "%";
  document.getElementById("stat-total").textContent     = items.length;
  document.getElementById("stat-submitted").textContent = submitted;
  document.getElementById("stat-soon").textContent      = dueSoon;
  document.getElementById("stat-overdue").textContent   = overdue;

  // ── Render list ──
  const filtered = getFiltered();
  const list     = document.getElementById("assignment-list");

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-clipboard-off"></i>
        <p>No assignments match your filters.</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(a => {
    const raw      = a.notes || "";
    const noteText = raw.length > 36 ? raw.slice(0, 36) + "…" : raw;
    const noteHTML = noteText
      ? `<span class="meta-item"><i class="ti ti-notes"></i>${escapeHTML(noteText)}</span>`
      : "";

    return `
      <div class="${cardClass(a)}" role="listitem" data-id="${a.id}">
        <div class="assign-main">
          <div class="assign-top">
            <span class="assign-title${a.status === "submitted" ? " done" : ""}">${escapeHTML(a.title)}</span>
            <span class="course-badge ${COURSE_COLORS[a.course] || "badge-blue"}">${a.course}</span>
          </div>
          <div class="assign-meta">
            ${dueLabelHTML(a.dueDate, a.status)}
            <span class="meta-item">
              <span class="priority-dot p-${a.priority}"></span>
              ${PRIORITY_LABEL[a.priority]}
            </span>
            ${noteHTML}
          </div>
        </div>
        <div class="assign-actions">
          <button class="status-pill pill-${a.status}"
            data-action="cycle" data-id="${a.id}"
            title="Click to advance status"
            aria-label="Status: ${STATUS_LABEL[a.status]}. Click to advance.">
            ${STATUS_LABEL[a.status]}
          </button>
          <button class="icon-btn" data-action="edit" data-id="${a.id}" aria-label="Edit assignment">
            <i class="ti ti-edit"></i>
          </button>
          <button class="icon-btn" data-action="delete" data-id="${a.id}" aria-label="Delete assignment">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </div>`;
  }).join("");
}

// ─────────────────────────────────────────────
//  LIST EVENT DELEGATION
// ─────────────────────────────────────────────

document.getElementById("assignment-list").addEventListener("click", e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const id     = parseInt(btn.dataset.id, 10);
  const action = btn.dataset.action;

  if (action === "cycle") {
    items = items.map(a => a.id === id ? { ...a, status: STATUS_CYCLE[a.status] } : a);
    render();
  }

  if (action === "delete") {
    if (confirm("Delete this assignment?")) {
      items = items.filter(a => a.id !== id);
      render();
    }
  }

  if (action === "edit") {
    const a = items.find(a => a.id === id);
    if (a) openModal(a);
  }
});

// ─────────────────────────────────────────────
//  MODAL
// ─────────────────────────────────────────────

function openModal(editing = null) {
  editingId = editing ? editing.id : null;

  document.getElementById("modal-title").textContent = editing ? "Edit assignment" : "Add assignment";
  document.getElementById("btn-save").textContent    = editing ? "Save changes"    : "Add assignment";

  document.getElementById("f-title").value    = editing ? editing.title    : "";
  document.getElementById("f-course").value   = editing ? editing.course   : "CS401";
  document.getElementById("f-due").value      = editing ? editing.dueDate  : "";
  document.getElementById("f-priority").value = editing ? editing.priority : "med";
  document.getElementById("f-status").value   = editing ? editing.status   : "pending";
  document.getElementById("f-notes").value    = editing ? editing.notes    : "";

  document.getElementById("modal-overlay").classList.add("open");
  document.getElementById("f-title").focus();
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  editingId = null;
}

function saveModal() {
  const title   = document.getElementById("f-title").value.trim();
  const dueDate = document.getElementById("f-due").value;

  if (!title || !dueDate) {
    alert("Please fill in Title and Due date.");
    return;
  }

  const form = {
    title,
    course:   document.getElementById("f-course").value,
    dueDate,
    priority: document.getElementById("f-priority").value,
    status:   document.getElementById("f-status").value,
    notes:    document.getElementById("f-notes").value.trim(),
  };

  if (editingId !== null) {
    items = items.map(a => a.id === editingId ? { ...form, id: a.id } : a);
  } else {
    items.push({ ...form, id: nextId++ });
  }

  closeModal();
  render();
}

// ─────────────────────────────────────────────
//  EVENT LISTENERS
// ─────────────────────────────────────────────

document.getElementById("btn-open-add").addEventListener("click", () => openModal());
document.getElementById("btn-cancel").addEventListener("click", closeModal);
document.getElementById("btn-save").addEventListener("click", saveModal);

// Close modal when clicking the dark backdrop
document.getElementById("modal-overlay").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeModal();
});

// Close modal on Escape key
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

// Filters & search
document.getElementById("search-input").addEventListener("input", render);
document.getElementById("filter-status").addEventListener("change", render);
document.getElementById("filter-course").addEventListener("change", render);

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────

render();