const API = "http://127.0.0.1:8000";
const token = localStorage.getItem("token");

if (!token) window.location.href = "login.html";

// Estado
let allTasks = [];
let currentStatusFilter = "";
let currentPriorityFilter = "";
let currentView = "list";
let editingTaskId = null;
let dragSrcIndex = null;

// Tema
const savedTheme = localStorage.getItem("theme") || "dark";
document.body.setAttribute("data-theme", savedTheme);
updateThemeIcon();

// Usuario
const username = localStorage.getItem("username") || "Usuario";
document.getElementById("nav-username").textContent = username;
document.getElementById("user-avatar").textContent = username[0].toUpperCase();

// ===== TEMA =====
function toggleTheme() {
    const current = document.body.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.body.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    updateThemeIcon();
}

function updateThemeIcon() {
    document.querySelectorAll(".theme-icon").forEach(icon => {
        icon.textContent = document.body.getAttribute("data-theme") === "dark" ? "☀" : "☾";
    });
}

// ===== SIDEBAR =====
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        sidebar.classList.toggle("mobile-open");
    } else {
        sidebar.classList.toggle("collapsed");
    }
}

// Cerrar sidebar móvil al hacer click fuera
document.addEventListener("click", (e) => {
    const sidebar = document.getElementById("sidebar");
    const isMobile = window.innerWidth <= 768;
    if (isMobile && sidebar.classList.contains("mobile-open")) {
        if (!sidebar.contains(e.target)) {
            sidebar.classList.remove("mobile-open");
        }
    }
});

// ===== FILTROS =====
function filterByStatus(status) {
    currentStatusFilter = status;
    currentPriorityFilter = "";

    // Actualizar nav activo
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    event.currentTarget.classList.add("active");

    // Actualizar título
    const titles = {
        "": "Todas las tareas",
        "pending": "Pendientes",
        "in_progress": "En progreso",
        "completed": "Completadas"
    };
    document.getElementById("topbar-title").textContent = titles[status] || "Tareas";

    renderFilteredTasks();
}

function filterByPriority(priority) {
    currentPriorityFilter = priority;
    currentStatusFilter = "";

    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    event.currentTarget.classList.add("active");

    const titles = { high: "Prioridad Alta", medium: "Prioridad Media", low: "Prioridad Baja" };
    document.getElementById("topbar-title").textContent = titles[priority];

    renderFilteredTasks();
}

function searchTasks() {
    renderFilteredTasks();
}

function renderFilteredTasks() {
    const search = document.getElementById("search-input").value.toLowerCase();

    let filtered = allTasks.filter(t => {
        const matchStatus = !currentStatusFilter || t.status === currentStatusFilter;
        const matchPriority = !currentPriorityFilter || t.priority === currentPriorityFilter;
        const matchSearch = !search ||
            t.title.toLowerCase().includes(search) ||
            (t.description && t.description.toLowerCase().includes(search));
        return matchStatus && matchPriority && matchSearch;
    });

    renderTasks(filtered);
    document.getElementById("tasks-count").textContent =
        `${filtered.length} tarea${filtered.length !== 1 ? "s" : ""}`;
}

// ===== CARGAR TAREAS =====
async function loadTasks() {
    try {
        const res = await fetch(`${API}/tasks/`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) { logout(); return; }

        allTasks = await res.json();
        updateStats(allTasks);
        updateBadges(allTasks);
        renderFilteredTasks();

    } catch {
        document.getElementById("tasks-container").innerHTML =
            `<div class="loading">Error al cargar tareas. ¿Está el servidor activo?</div>`;
    }
}

// ===== STATS =====
function updateStats(tasks) {
    animateNumber("stat-total", tasks.length);
    animateNumber("stat-pending", tasks.filter(t => t.status === "pending").length);
    animateNumber("stat-progress", tasks.filter(t => t.status === "in_progress").length);
    animateNumber("stat-completed", tasks.filter(t => t.status === "completed").length);
}

function updateBadges(tasks) {
    document.getElementById("badge-all").textContent = tasks.length;
    document.getElementById("badge-pending").textContent = tasks.filter(t => t.status === "pending").length;
    document.getElementById("badge-progress").textContent = tasks.filter(t => t.status === "in_progress").length;
    document.getElementById("badge-completed").textContent = tasks.filter(t => t.status === "completed").length;
}

function animateNumber(id, target) {
    const el = document.getElementById(id);
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;

    const step = target > current ? 1 : -1;
    const interval = setInterval(() => {
        const val = parseInt(el.textContent) + step;
        el.textContent = val;
        if (val === target) clearInterval(interval);
    }, 30);
}

// ===== RENDER TAREAS =====
function renderTasks(tasks) {
    const container = document.getElementById("tasks-container");
    container.className = currentView === "grid" ? "tasks-list grid-view" : "tasks-list";

    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>No hay tareas aquí. ¡Crea una nueva!</p>
            </div>`;
        return;
    }

    container.innerHTML = tasks.map((task, index) => `
        <div class="task-card priority-${task.priority} ${task.status === "completed" ? "completed-card" : ""}"
             id="task-${task.id}"
             draggable="true"
             data-index="${index}"
             data-id="${task.id}"
             ondragstart="dragStart(event, ${index})"
             ondragover="dragOver(event)"
             ondrop="dragDrop(event, ${index})"
             ondragend="dragEnd(event)"
             style="animation-delay: ${index * 0.04}s">

            <div class="task-checkbox ${task.status === "completed" ? "checked" : ""}"
                 onclick="toggleComplete(${task.id}, '${task.status}')">
                ${task.status === "completed" ? "✓" : ""}
            </div>

            <div class="task-body">
                <div class="task-title ${task.status === "completed" ? "strikethrough" : ""}">
                    ${escapeHtml(task.title)}
                </div>
                ${task.description
                    ? `<div class="task-description">${escapeHtml(task.description)}</div>`
                    : ""}
                <div class="task-meta">
                    <span class="badge badge-${task.priority}">${priorityLabel(task.priority)}</span>
                    <span class="badge badge-${task.status}">${statusLabel(task.status)}</span>
                </div>
            </div>

            <div class="task-actions">
                <button class="btn-icon" onclick="openEditModal(${task.id})" title="Editar">✏️</button>
                <button class="btn-icon delete" onclick="deleteTask(${task.id})" title="Eliminar">🗑️</button>
            </div>
        </div>
    `).join("");
}

// ===== DRAG & DROP =====
function dragStart(e, index) {
    dragSrcIndex = index;
    e.currentTarget.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("drag-over");
}

function dragDrop(e, targetIndex) {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    if (dragSrcIndex === null || dragSrcIndex === targetIndex) return;

    // Reordenar en allTasks
    const search = document.getElementById("search-input").value.toLowerCase();
    let filtered = allTasks.filter(t => {
        const matchStatus = !currentStatusFilter || t.status === currentStatusFilter;
        const matchPriority = !currentPriorityFilter || t.priority === currentPriorityFilter;
        const matchSearch = !search ||
            t.title.toLowerCase().includes(search) ||
            (t.description && t.description.toLowerCase().includes(search));
        return matchStatus && matchPriority && matchSearch;
    });

    const moved = filtered.splice(dragSrcIndex, 1)[0];
    filtered.splice(targetIndex, 0, moved);

    // Reconstruir allTasks manteniendo el orden
    const movedIds = new Set(filtered.map(t => t.id));
    const rest = allTasks.filter(t => !movedIds.has(t.id));
    allTasks = [...filtered, ...rest];

    renderFilteredTasks();
    dragSrcIndex = null;
}

function dragEnd(e) {
    e.currentTarget.classList.remove("dragging");
    document.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
}

// ===== VISTA =====
function setView(view) {
    currentView = view;
    document.getElementById("view-list").classList.toggle("active", view === "list");
    document.getElementById("view-grid").classList.toggle("active", view === "grid");
    renderFilteredTasks();
}

// ===== MODAL =====
function openModal() {
    editingTaskId = null;
    document.getElementById("modal-title").textContent = "Nueva tarea";
    document.getElementById("task-title").value = "";
    document.getElementById("task-description").value = "";
    document.getElementById("task-priority").value = "medium";
    document.getElementById("status-group").style.display = "none";
    document.getElementById("modal-error").classList.add("hidden");
    document.getElementById("task-modal").classList.remove("hidden");
    document.getElementById("modal-overlay").classList.remove("hidden");
    setTimeout(() => document.getElementById("task-title").focus(), 50);
}

function openEditModal(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    editingTaskId = taskId;
    document.getElementById("modal-title").textContent = "Editar tarea";
    document.getElementById("task-title").value = task.title;
    document.getElementById("task-description").value = task.description || "";
    document.getElementById("task-priority").value = task.priority;
    document.getElementById("task-status").value = task.status;
    document.getElementById("status-group").style.display = "block";
    document.getElementById("modal-error").classList.add("hidden");
    document.getElementById("task-modal").classList.remove("hidden");
    document.getElementById("modal-overlay").classList.remove("hidden");
    setTimeout(() => document.getElementById("task-title").focus(), 50);
}

function closeModal() {
    document.getElementById("task-modal").classList.add("hidden");
    document.getElementById("modal-overlay").classList.add("hidden");
    editingTaskId = null;
}

// ===== GUARDAR =====
async function saveTask() {
    const title = document.getElementById("task-title").value.trim();
    const description = document.getElementById("task-description").value.trim();
    const priority = document.getElementById("task-priority").value;
    const errorEl = document.getElementById("modal-error");

    errorEl.classList.add("hidden");

    if (!title) {
        errorEl.textContent = "El título es obligatorio";
        errorEl.classList.remove("hidden");
        return;
    }

    const body = { title, description, priority };

    // Si editamos, incluir también el estado
    if (editingTaskId) {
        body.status = document.getElementById("task-status").value;
    }

    const url = editingTaskId ? `${API}/tasks/${editingTaskId}` : `${API}/tasks/`;
    const method = editingTaskId ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            errorEl.textContent = "Error al guardar la tarea";
            errorEl.classList.remove("hidden");
            return;
        }

        closeModal();
        await loadTasks();

    } catch {
        errorEl.textContent = "No se pudo conectar con el servidor";
        errorEl.classList.remove("hidden");
    }
}

// ===== COMPLETAR =====
async function toggleComplete(taskId, currentStatus) {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";

    await fetch(`${API}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
    });

    await loadTasks();
}

// ===== ELIMINAR =====
async function deleteTask(taskId) {
    if (!confirm("¿Eliminar esta tarea?")) return;

    await fetch(`${API}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    });

    await loadTasks();
}

// ===== LOGOUT =====
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "login.html";
}

// ===== HELPERS =====
function priorityLabel(p) {
    return { high: "Alta", medium: "Media", low: "Baja" }[p] || p;
}

function statusLabel(s) {
    return { pending: "Pendiente", in_progress: "En progreso", completed: "Completada" }[s] || s;
}

function escapeHtml(text) {
    const d = document.createElement("div");
    d.appendChild(document.createTextNode(text));
    return d.innerHTML;
}

// ===== TECLADO =====
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
    if (e.key === "Enter" && !document.getElementById("task-modal").classList.contains("hidden")) {
        if (document.activeElement.tagName !== "TEXTAREA") saveTask();
    }
});

// ===== INIT =====
loadTasks();