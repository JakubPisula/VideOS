// Adobe UXP Environment Mockup

let activeTimer = null;
let activeTaskId = null;
let tasks = [
    { id: 't1', name: 'Rough Cut Assembly', time: 120, running: false },
    { id: 't2', name: 'Color Grading', time: 0, running: false },
    { id: 't3', name: 'Audio Mixing', time: 0, running: false },
    { id: 't4', name: 'Review & Revisions', time: 0, running: false }
];

function formatTime(minutes) {
    const min = minutes % 60;
    const hrs = Math.floor(minutes / 60);
    return `${hrs.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

function renderTasks() {
    const list = document.getElementById('taskList');
    list.innerHTML = '';

    tasks.forEach(t => {
        const item = document.createElement('li');
        item.className = 'task-item';

        item.innerHTML = `
            <span class="task-name">${t.name}</span>
            <span class="task-time ${t.running ? 'timer-active' : ''}">${formatTime(t.time)}</span>
            <button class="btn ${t.running ? 'btn-stop' : ''}" style="width: 50px; margin-top: 0;">
                ${t.running ? 'Stop' : 'Play'}
            </button>
        `;

        const btn = item.querySelector('.btn');
        btn.addEventListener('click', () => toggleTimer(t.id));

        list.appendChild(item);
    });
}

function toggleTimer(id) {
    if (activeTaskId === id) {
        // Stop current task
        clearInterval(activeTimer);
        const task = tasks.find(t => t.id === id);
        task.running = false;
        activeTaskId = null;

        // Mock sync to Notion
        console.log(`Syncing task ${id} time (${task.time} mins) back to Notion...`);
    } else {
        // Stop active task if any
        if (activeTaskId) {
            clearInterval(activeTimer);
            tasks.find(t => t.id === activeTaskId).running = false;
        }

        // Start new task
        activeTaskId = id;
        const task = tasks.find(t => t.id === id);
        task.running = true;

        activeTimer = setInterval(() => {
            task.time += 1; // Increment by 1 min for demo purposes
            renderTasks();
        }, 1000); // 1 second = 1 min in demo
    }

    renderTasks();
}

// Initial Render
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('projectMeta').innerHTML = `
        <label>Active Project Folder:</label>
        <div style="font-weight: 500; font-size: 14px; margin-top: 4px; color: #4caf50;">
            /Volumes/Storage/Projects/PRJ-123456
        </div>
        <div style="font-size: 11px; margin-top: 6px; color: #888;">
            Client: John Doe • Status: Editing
        </div>
    `;
    renderTasks();
});
