/**
 * Daily Task Planner
 * Author: Mohammed Ayan Khan
 * Technology: HTML5, CSS3, Bootstrap 5, Vanilla JavaScript, localStorage
 */

// Application State
let tasks = [];
let currentFilter = 'all'; // 'all' | 'pending' | 'completed'
let taskToDeleteId = null;

// DOM Elements
const taskInput = document.getElementById('task-input');
const inputError = document.getElementById('input-error');
const taskListContainer = document.getElementById('task-list');
const searchInput = document.getElementById('search-input');
const btnClearSearch = document.getElementById('btn-clear-search');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptyMessage = document.getElementById('empty-message');
const taskCountHint = document.getElementById('task-count-hint');

// Statistics Elements
const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');

// Filter Badges
const filterBadgeAll = document.getElementById('filter-badge-all');
const filterBadgePending = document.getElementById('filter-badge-pending');
const filterBadgeCompleted = document.getElementById('filter-badge-completed');

// Modals
let deleteModalInstance = null;
let clearModalInstance = null;

/**
 * Initialize Application
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Bootstrap Modals
    const deleteModalEl = document.getElementById('deleteModal');
    if (deleteModalEl && window.bootstrap) {
        deleteModalInstance = new bootstrap.Modal(deleteModalEl);
    }

    const clearModalEl = document.getElementById('clearModal');
    if (clearModalEl && window.bootstrap) {
        clearModalInstance = new bootstrap.Modal(clearModalEl);
    }

    // Modal Confirmation Button Listeners
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', confirmDelete);
    }

    const btnConfirmClear = document.getElementById('btn-confirm-clear');
    if (btnConfirmClear) {
        btnConfirmClear.addEventListener('click', confirmClearCompleted);
    }

    // Input Enter Key Listener
    if (taskInput) {
        taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTask();
            }
        });

        taskInput.addEventListener('input', () => {
            if (taskInput.value.trim()) {
                inputError.classList.add('d-none');
                taskInput.classList.remove('is-invalid');
            }
        });
    }

    // Initialize Clock & Date
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Load initial tasks from localStorage
    loadFromLocalStorage();
    renderTasks();
});

/**
 * 1. DATE & TIME DISPLAY
 */
function updateDateTime() {
    const now = new Date();

    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const dayOptions = { weekday: 'long' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };

    const dateEl = document.getElementById('current-date');
    const dayEl = document.getElementById('current-day');
    const timeEl = document.getElementById('current-time');

    if (dateEl) dateEl.textContent = now.toLocaleDateString(undefined, dateOptions);
    if (dayEl) dayEl.textContent = now.toLocaleDateString(undefined, dayOptions);
    if (timeEl) timeEl.textContent = now.toLocaleTimeString(undefined, timeOptions);
}

/**
 * 2 & 3. ADD TASK & TASK OBJECT
 */
function addTask() {
    const title = taskInput.value.trim();

    // Validation for empty tasks
    if (!title) {
        inputError.classList.remove('d-none');
        taskInput.classList.add('is-invalid');
        taskInput.focus();
        return;
    }

    inputError.classList.add('d-none');
    taskInput.classList.remove('is-invalid');

    // Create new Task Object
    const newTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
        title: title,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveToLocalStorage();
    renderTasks();

    // Reset input
    taskInput.value = '';
    taskInput.focus();
}

/**
 * 4. RENDER TASK LIST
 */
function renderTasks() {
    updateStatistics();

    const filtered = filterTasks();
    taskListContainer.innerHTML = '';

    // Update clear search button visibility
    if (searchInput && btnClearSearch) {
        if (searchInput.value.trim().length > 0) {
            btnClearSearch.classList.remove('d-none');
        } else {
            btnClearSearch.classList.add('d-none');
        }
    }

    // Update count hint text
    if (taskCountHint) {
        const totalMatching = filtered.length;
        if (currentFilter === 'all') {
            taskCountHint.textContent = `Showing all tasks (${totalMatching})`;
        } else if (currentFilter === 'pending') {
            taskCountHint.textContent = `Showing pending tasks (${totalMatching})`;
        } else if (currentFilter === 'completed') {
            taskCountHint.textContent = `Showing completed tasks (${totalMatching})`;
        }
    }

    // Handle Empty State
    if (filtered.length === 0) {
        emptyState.classList.remove('d-none');
        if (tasks.length === 0) {
            emptyTitle.textContent = 'No tasks yet';
            emptyMessage.textContent = 'Get ready for a productive day! Add your first task above.';
        } else {
            emptyTitle.textContent = 'No matching tasks';
            emptyMessage.textContent = 'No tasks found for your current filter or search criteria.';
        }
        return;
    }

    emptyState.classList.add('d-none');

    // Render Each Task
    filtered.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskCard.id = `task-row-${task.id}`;

        const createdDate = new Date(task.createdAt);
        const formattedDate = createdDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        }) + ' at ' + createdDate.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });

        const escapedTitle = escapeHtml(task.title);

        taskCard.innerHTML = `
            <div class="task-content" id="content-${task.id}">
                <!-- Direct clickable Check Button -->
                <button type="button" 
                        class="task-check-btn" 
                        onclick="toggleTask('${task.id}')" 
                        title="${task.completed ? 'Mark as Pending' : 'Mark as Completed'}"
                        aria-label="${task.completed ? 'Mark as Pending' : 'Mark as Completed'}">
                    <i class="bi bi-check-lg fs-5"></i>
                </button>

                <!-- Task Details -->
                <div class="task-details">
                    <div class="task-text" onclick="toggleTask('${task.id}')" title="Click to toggle status">
                        ${escapedTitle}
                    </div>
                    <div class="task-date">
                        <span><i class="bi bi-calendar3"></i> ${formattedDate}</span>
                        <!-- Clickable Status Badge -->
                        <span class="badge rounded-pill status-badge ${task.completed ? 'bg-success text-white' : 'bg-warning text-dark'}" 
                              onclick="toggleTask('${task.id}')" 
                              title="Click to change status to ${task.completed ? 'Pending' : 'Completed'}">
                            <i class="bi ${task.completed ? 'bi-check2-circle' : 'bi-hourglass-split'} me-1"></i>
                            ${task.completed ? 'Completed' : 'Pending'} &bull; Click to switch
                        </span>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="task-actions" id="actions-${task.id}">
                <!-- Dedicated Complete / Undo Button -->
                <button type="button" 
                        class="btn btn-sm ${task.completed ? 'btn-outline-warning' : 'btn-outline-success'}" 
                        onclick="toggleTask('${task.id}')" 
                        title="${task.completed ? 'Reopen task as pending' : 'Mark task as done'}">
                    <i class="bi ${task.completed ? 'bi-arrow-counterclockwise' : 'bi-check2-circle'} me-1"></i>
                    <span>${task.completed ? 'Undo' : 'Complete'}</span>
                </button>

                <!-- Edit Button -->
                <button type="button" 
                        class="btn btn-sm btn-outline-primary" 
                        onclick="editTask('${task.id}')" 
                        title="Edit task title or change status">
                    <i class="bi bi-pencil-square me-1"></i>
                    <span>Edit</span>
                </button>

                <!-- Delete Button -->
                <button type="button" 
                        class="btn btn-sm btn-outline-danger" 
                        onclick="promptDelete('${task.id}')" 
                        title="Delete task">
                    <i class="bi bi-trash3 me-1"></i>
                    <span>Delete</span>
                </button>
            </div>
        `;

        taskListContainer.appendChild(taskCard);
    });
}

/**
 * 5. COMPLETE TASK (TOGGLE STATUS)
 */
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveToLocalStorage();
        renderTasks();
    }
}

/**
 * 6. EDIT TASK (INLINE EDITING WITH STATUS SELECTOR)
 */
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const taskRow = document.getElementById(`task-row-${id}`);
    if (!taskRow) return;

    const escapedTitle = escapeHtml(task.title);

    // Replace the entire task item with an inline edit panel
    taskRow.innerHTML = `
        <div class="task-edit-container w-100">
            <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="fw-bold text-primary small">
                    <i class="bi bi-pencil-fill me-1"></i> Edit Task
                </span>
                <span class="text-muted small">Change title or status below:</span>
            </div>

            <div class="row g-2 align-items-center mb-2">
                <!-- Title Input -->
                <div class="col-12 col-md-8">
                    <input type="text" 
                           class="form-control form-control-sm" 
                           id="edit-input-${task.id}" 
                           value="${escapedTitle}" 
                           maxlength="200" 
                           placeholder="Task title...">
                    <div id="edit-error-${task.id}" class="text-danger small d-none mt-1 fw-medium">
                        Task title cannot be empty.
                    </div>
                </div>

                <!-- Status Selector: Allows switching between Pending and Completed directly in Edit mode! -->
                <div class="col-12 col-md-4">
                    <select class="form-select form-select-sm" id="edit-status-${task.id}">
                        <option value="pending" ${!task.completed ? 'selected' : ''}>⏳ Status: Pending</option>
                        <option value="completed" ${task.completed ? 'selected' : ''}>✅ Status: Completed</option>
                    </select>
                </div>
            </div>

            <!-- Action buttons: Save & Cancel -->
            <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-sm btn-secondary px-3" onclick="renderTasks()">
                    <i class="bi bi-x-lg me-1"></i> Cancel
                </button>
                <button type="button" class="btn btn-sm btn-success px-3 fw-semibold" onclick="saveTask('${task.id}')">
                    <i class="bi bi-check-lg me-1"></i> Save Changes
                </button>
            </div>
        </div>
    `;

    const inputField = document.getElementById(`edit-input-${task.id}`);
    if (inputField) {
        inputField.focus();
        inputField.setSelectionRange(inputField.value.length, inputField.value.length);

        // Keyboard shortcuts
        inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveTask(task.id);
            } else if (e.key === 'Escape') {
                renderTasks();
            }
        });
    }
}

/**
 * SAVE EDITED TASK (TITLE AND STATUS)
 */
function saveTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const inputField = document.getElementById(`edit-input-${id}`);
    const statusSelect = document.getElementById(`edit-status-${id}`);
    const editError = document.getElementById(`edit-error-${id}`);

    if (!inputField) return;

    const newTitle = inputField.value.trim();
    if (!newTitle) {
        if (editError) editError.classList.remove('d-none');
        inputField.classList.add('is-invalid');
        inputField.focus();
        return;
    }

    // Update Title
    task.title = newTitle;

    // Update Status from the edit selector
    if (statusSelect) {
        task.completed = (statusSelect.value === 'completed');
    }

    saveToLocalStorage();
    renderTasks();
}

/**
 * 7. DELETE TASK
 */
function promptDelete(id) {
    taskToDeleteId = id;
    if (deleteModalInstance) {
        deleteModalInstance.show();
    } else {
        if (confirm("Are you sure you want to delete this task?")) {
            deleteTask(id);
        }
    }
}

function confirmDelete() {
    if (taskToDeleteId) {
        deleteTask(taskToDeleteId);
        taskToDeleteId = null;
        if (deleteModalInstance) {
            deleteModalInstance.hide();
        }
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveToLocalStorage();
    renderTasks();
}

/**
 * 8 & 9. FILTER & SEARCH
 */
function setFilter(filterType, element) {
    currentFilter = filterType;

    const filterButtons = document.querySelectorAll('.filter-group .btn');
    filterButtons.forEach(btn => btn.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    }

    renderTasks();
}

function searchTasks() {
    renderTasks();
}

function clearSearch() {
    if (searchInput) {
        searchInput.value = '';
        renderTasks();
        searchInput.focus();
    }
}

function filterTasks() {
    const searchQuery = (searchInput ? searchInput.value : '').toLowerCase().trim();

    return tasks.filter(task => {
        // Status Filter
        let matchesFilter = true;
        if (currentFilter === 'pending') {
            matchesFilter = !task.completed;
        } else if (currentFilter === 'completed') {
            matchesFilter = task.completed;
        }

        // Title Search
        let matchesSearch = true;
        if (searchQuery) {
            matchesSearch = task.title.toLowerCase().includes(searchQuery);
        }

        return matchesFilter && matchesSearch;
    });
}

/**
 * 10. STATISTICS & PROGRESS
 */
function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    // Update Top Stat Cards
    if (statTotal) statTotal.textContent = total;
    if (statPending) statPending.textContent = pending;
    if (statCompleted) statCompleted.textContent = completed;

    // Update Filter Badges
    if (filterBadgeAll) filterBadgeAll.textContent = total;
    if (filterBadgePending) filterBadgePending.textContent = pending;
    if (filterBadgeCompleted) filterBadgeCompleted.textContent = completed;

    // Update Progress
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    if (progressPercent) progressPercent.textContent = `${percentage}%`;
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
    }
}

/**
 * 11. LOCAL STORAGE
 */
function saveToLocalStorage() {
    try {
        localStorage.setItem('daily_task_planner_tasks', JSON.stringify(tasks));
    } catch (e) {
        console.error('Failed to save tasks to localStorage:', e);
    }
}

function loadFromLocalStorage() {
    try {
        const stored = localStorage.getItem('daily_task_planner_tasks');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                tasks = parsed;
            } else {
                tasks = [];
            }
        } else {
            // Default sample tasks
            tasks = [
                {
                    id: 'task_starter_1',
                    title: 'Welcome to Daily Task Planner! Click Complete to finish this task.',
                    completed: false,
                    createdAt: new Date().toISOString()
                }
            ];
            saveToLocalStorage();
        }
    } catch (e) {
        console.error('Failed to load from localStorage. Resetting data safely:', e);
        tasks = [];
    }
}

/**
 * 12. CLEAR COMPLETED
 */
function clearCompleted() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
        alert('There are no completed tasks to clear.');
        return;
    }

    if (clearModalInstance) {
        clearModalInstance.show();
    } else {
        if (confirm(`Are you sure you want to clear ${completedCount} completed task(s)?`)) {
            confirmClearCompleted();
        }
    }
}

function confirmClearCompleted() {
    tasks = tasks.filter(t => !t.completed);
    saveToLocalStorage();
    renderTasks();
    if (clearModalInstance) {
        clearModalInstance.hide();
    }
}

/**
 * Helper: Escape HTML to prevent XSS
 */
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
