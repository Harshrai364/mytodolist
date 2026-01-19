// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.setDate();
        this.render();
        this.attachEventListeners();
    }

    setDate() {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = today.toLocaleDateString('en-US', options);
        document.getElementById('date').textContent = dateString;
    }

    attachEventListeners() {
        // Add task button and Enter key
        const addBtn = document.getElementById('addBtn');
        addBtn.addEventListener('click', (e) => {
            this.addTask();
            this.createRipple(e); // Combined ripple effect with add task
        });
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
                this.createRipple(e);
            });
        });

        // Event delegation for task list items (checkbox and delete button)
        document.getElementById('taskList').addEventListener('click', (e) => {
            const target = e.target;
            const taskId = parseInt(target.closest('.task-item')?.dataset.id);
            if (isNaN(taskId)) return;

            if (target.classList.contains('task-checkbox')) {
                this.toggleTask(taskId);
            } else if (target.classList.contains('delete-btn')) {
                this.deleteTask(taskId);
            }
        });

        // Event delegation for double-click to edit task text
        document.getElementById('taskList').addEventListener('dblclick', (e) => {
            const target = e.target;
            if (target.classList.contains('editable-task-text')) {
                this.startEditing(target);
            }
        });

        // Event delegation for focusout (blur) to save edited task text
        document.getElementById('taskList').addEventListener('focusout', (e) => {
            if (e.target.classList.contains('editable-task-text') && e.target.contentEditable === 'true') {
                this.saveEditedTask(e.target);
            }
        });

        // Clear buttons
        document.getElementById('clearCompleted').addEventListener('click', () => this.clearCompleted());
        document.getElementById('clearAll').addEventListener('click', () => this.clearAll());

        // Input focus animation
        const input = document.getElementById('taskInput');
        input.addEventListener('focus', () => {
            input.parentElement.style.transform = 'scale(1.02)';
        });
        input.addEventListener('blur', () => {
            input.parentElement.style.transform = 'scale(1)';
        });

        // Global keydown listener for Enter and Escape during editing
        document.addEventListener('keydown', (e) => {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.classList.contains('editable-task-text') && activeElement.contentEditable === 'true') {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Prevent new line in contenteditable
                    activeElement.blur(); // Trigger focusout to save
                } else if (e.key === 'Escape') {
                    e.preventDefault(); // Prevent default escape behavior
                    this.cancelEditingTask(activeElement);
                    activeElement.blur(); // Remove focus
                }
            } else if (e.key === 'Escape') { // Original Escape for input blur
                document.getElementById('taskInput').blur();
            }
        });

    }

    createRipple(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            left: ${x}px;
            top: ${y}px;
            pointer-events: none;
            animation: ripple-animation 0.6s ease-out;
        `;

        if (!button.style.position || button.style.position === 'static') {
            button.style.position = 'relative';
        }
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    addTask() {
        const input = document.getElementById('taskInput');
        const taskText = input.value.trim();

        if (taskText === '') {
            alert('Please enter a task!');
            return;
        }

        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.render();
        input.value = '';
        input.focus();
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
        this.render();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.render();
        }
    }

    startEditing(element) {
        element.contentEditable = 'true';
        element.classList.add('editing');
        element.focus();
        // Store original text in a dataset attribute for potential cancellation
        element.dataset.originalText = element.textContent;

        // Select all text when focused
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    saveEditedTask(element) {
        const taskId = parseInt(element.closest('.task-item')?.dataset.id);
        const newText = element.textContent.trim();
        const originalText = element.dataset.originalText;

        // Reset element state
        element.contentEditable = 'false';
        element.classList.remove('editing');
        delete element.dataset.originalText;

        if (isNaN(taskId) || newText === originalText) {
            // No change or invalid task, just revert if empty
            if (newText === '') element.textContent = originalText;
            return;
        }

        if (newText === '') {
            alert('Task cannot be empty. Reverting to original text.');
            element.textContent = originalText;
            return;
        }

        const task = this.tasks.find(t => t.id === taskId);
        if (task) task.text = newText;
        this.saveTasks();
        this.render(); // Re-render to update the list with new text and potentially sort
    }

    cancelEditingTask(element) {
        element.textContent = element.dataset.originalText; // Revert to original text
        element.contentEditable = 'false';
        element.classList.remove('editing');
        delete element.dataset.originalText;
    }

    clearCompleted() {
        if (this.tasks.some(t => t.completed)) {
            if (confirm('Delete all completed tasks?')) {
                this.tasks = this.tasks.filter(t => !t.completed);
                this.saveTasks();
                this.render();
            }
        }
    }

    clearAll() {
        if (this.tasks.length > 0) {
            if (confirm('Delete all tasks? This cannot be undone.')) {
                this.tasks = [];
                this.saveTasks();
                this.render();
            }
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });

        this.render();
    }

    getFilteredTasks() {
        switch (this.currentFilter) {
            case 'active':
                return this.tasks.filter(t => !t.completed);
            case 'completed':
                return this.tasks.filter(t => t.completed);
            default:
                return this.tasks;
        }
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const remaining = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('remainingTasks').textContent = remaining;
    }

    render() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();

        taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            emptyState.style.display = 'block';
            taskList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            taskList.style.display = 'block';

            filteredTasks.forEach((task, index) => {
                const li = document.createElement('li');
                li.className = `task-item ${task.completed ? 'completed' : ''}`; // Add data-id for event delegation
                li.dataset.id = task.id;
                li.style.animationDelay = `${index * 0.05}s`;
                li.innerHTML = `
                    <div class="task-content">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                        <span class="task-text editable-task-text" contenteditable="false">${this.escapeHtml(task.text)}</span>
                        <span class="task-time">${task.createdAt}</span>
                    </div>
                    <button class="delete-btn" title="Delete">✕</button>
                `;
                taskList.appendChild(li);
            });
        }

        this.updateStats();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const saved = localStorage.getItem('tasks');
        return saved ? JSON.parse(saved) : [];
    }
}

// Initialize the app
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    // Ensure the TaskManager instance is created only once
    taskManager = new TaskManager();

    // Add ripple animation to stylesheet
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple-animation {
            0% { transform: scale(0); opacity: 1; }
            100% { transform: scale(4); opacity: 0; }
            /* Ensure ripple animation is defined */
            /* This was already in styles.css, but good to have here if it's dynamic */
        }
    `;
    document.head.appendChild(style);
});
