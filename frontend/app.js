const API_BASE_URL = "http://127.0.0.1:8000";
const STORAGE_KEY = "task-manager-tasks";


// =========================================================
// DOM ELEMENTS
// =========================================================

const taskForm = document.getElementById("task-form");

const titleInput = document.getElementById("title");
const priorityInput = document.getElementById("priority");
const dueDateInput = document.getElementById("due-date");
const projectIdInput = document.getElementById("project-id");

const titleError = document.getElementById("title-error");

const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const taskCount = document.getElementById("task-count");


// =========================================================
// APPLICATION STATE
// =========================================================

let tasks = [];


// =========================================================
// LOCAL STORAGE
// =========================================================

function saveTasksToCache() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(tasks)
    );
}


function loadTasksFromCache() {
    const cachedTasks = localStorage.getItem(
        STORAGE_KEY
    );

    if (!cachedTasks) {
        return [];
    }

    try {
        const parsedTasks = JSON.parse(cachedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        return parsedTasks;
    } catch (error) {
        console.error(
            "Unable to parse cached tasks:",
            error
        );

        return [];
    }
}


// =========================================================
// RENDER TASKS
// =========================================================

function renderTasks() {
    // Remove existing DOM elements.
    taskList.replaceChildren();

    taskCount.textContent =
        `${tasks.length} ${
            tasks.length === 1 ? "task" : "tasks"
        }`;

    emptyState.hidden = tasks.length !== 0;

    tasks.forEach((task) => {
        const taskElement = createTaskElement(task);

        taskList.appendChild(taskElement);
    });
}


// =========================================================
// CREATE TASK DOM ELEMENT
// =========================================================

function createTaskElement(task) {

    const article = document.createElement("article");

    article.className = "task-item";

    article.dataset.taskId = task.id;


    // -----------------------------------------------------
    // Header
    // -----------------------------------------------------

    const header = document.createElement("div");

    header.className = "task-item-header";


    const title = document.createElement("h3");

    title.className = "task-title";

    // IMPORTANT:
    // textContent instead of innerHTML.
    title.textContent = task.title;


    // -----------------------------------------------------
    // Actions
    // -----------------------------------------------------

    const actions = document.createElement("div");

    actions.className = "task-actions";


    const editButton = document.createElement("button");

    editButton.type = "button";
    editButton.className = "secondary-button";

    editButton.textContent = "Edit";


    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "delete-button";

    deleteButton.textContent = "Delete";


    editButton.addEventListener(
        "click",
        () => editTask(task.id)
    );

    deleteButton.addEventListener(
        "click",
        () => deleteTask(task.id)
    );


    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    header.appendChild(title);
    header.appendChild(actions);


    // -----------------------------------------------------
    // Description
    // -----------------------------------------------------

    const description = document.createElement("p");

    description.className = "task-description";

    if (task.description) {
        description.textContent = task.description;
    } else {
        description.textContent =
            "No description provided.";
    }


    // -----------------------------------------------------
    // Metadata
    // -----------------------------------------------------

    const meta = document.createElement("div");

    meta.className = "task-meta";


    const priorityBadge =
        document.createElement("span");

    priorityBadge.className = "task-badge";

    priorityBadge.textContent =
        `Priority: ${task.priority}`;


    const statusBadge =
        document.createElement("span");

    statusBadge.className = "task-badge";

    statusBadge.textContent =
        `Status: ${task.status}`;


    const dueDateBadge =
        document.createElement("span");

    dueDateBadge.className = "task-badge";

    dueDateBadge.textContent =
        `Due: ${task.due_date || "Not specified"}`;


    const projectBadge =
        document.createElement("span");

    projectBadge.className = "task-badge";

    projectBadge.textContent =
        `Project: ${task.project_id}`;


    meta.appendChild(priorityBadge);
    meta.appendChild(statusBadge);
    meta.appendChild(dueDateBadge);
    meta.appendChild(projectBadge);


    // -----------------------------------------------------
    // Build Task
    // -----------------------------------------------------

    article.appendChild(header);
    article.appendChild(description);
    article.appendChild(meta);

    return article;
}


// =========================================================
// VALIDATION
// =========================================================

function validateTitle() {

    const title = titleInput.value.trim();

    if (!title) {

        titleError.textContent =
            "Task title is required.";

        titleInput.setAttribute(
            "aria-invalid",
            "true"
        );

        return false;
    }

    titleError.textContent = "";

    titleInput.removeAttribute(
        "aria-invalid"
    );

    return true;
}


// Remove validation error as soon as the
// user enters valid content.

titleInput.addEventListener(
    "input",
    () => {
        validateTitle();
    }
);


// =========================================================
// ADD TASK
// =========================================================

taskForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        if (!validateTitle()) {
            return;
        }

        const title = titleInput.value.trim();

        const priority = priorityInput.value;

        const dueDate =
            dueDateInput.value.trim();

        const projectId =
            Number(projectIdInput.value);


        if (!projectId || projectId < 1) {
            alert("Please enter a valid project ID.");
            return;
        }


        const taskPayload = {
            title: title,
            priority: priority,
            due_date: dueDate || null,
            project_id: projectId
        };


        try {

            const response = await fetch(
                `${API_BASE_URL}/tasks`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(
                        taskPayload
                    )
                }
            );


            if (!response.ok) {

                const error =
                    await response.json();

                throw new Error(
                    error.detail ||
                    "Unable to create task."
                );
            }


            const createdTask =
                await response.json();


            tasks.push(createdTask);

            saveTasksToCache();

            renderTasks();

            taskForm.reset();

            priorityInput.value = "medium";

            projectIdInput.value = "1";

            titleInput.focus();

        } catch (error) {

            console.error(
                "Create task failed:",
                error
            );

            alert(error.message);
        }
    }
);


// =========================================================
// EDIT TASK
// =========================================================

async function editTask(taskId) {

    const task = tasks.find(
        (item) => item.id === taskId
    );

    if (!task) {
        return;
    }


    const newTitle = prompt(
        "Enter the new task title:",
        task.title
    );


    if (newTitle === null) {
        return;
    }


    const trimmedTitle =
        newTitle.trim();


    if (!trimmedTitle) {
        alert("Task title cannot be blank.");
        return;
    }


    const newPriority = prompt(
        "Enter priority: low, medium, or high",
        task.priority
    );


    if (newPriority === null) {
        return;
    }


    const priority =
        newPriority.trim().toLowerCase();


    if (
        !["low", "medium", "high"]
            .includes(priority)
    ) {
        alert(
            "Priority must be low, medium, or high."
        );

        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/tasks/${taskId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    title: trimmedTitle,
                    priority: priority
                })
            }
        );


        if (!response.ok) {

            const error =
                await response.json();

            throw new Error(
                error.detail ||
                "Unable to update task."
            );
        }


        const updatedTask =
            await response.json();


        tasks = tasks.map(
            (item) =>
                item.id === taskId
                    ? updatedTask
                    : item
        );


        saveTasksToCache();

        renderTasks();

    } catch (error) {

        console.error(
            "Update task failed:",
            error
        );

        alert(error.message);
    }
}


// =========================================================
// DELETE TASK
// =========================================================

async function deleteTask(taskId) {

    const task = tasks.find(
        (item) => item.id === taskId
    );

    if (!task) {
        return;
    }


    const confirmed = confirm(
        `Delete "${task.title}"?`
    );


    if (!confirmed) {
        return;
    }


    try {

        const response = await fetch(
            `${API_BASE_URL}/tasks/${taskId}`,
            {
                method: "DELETE"
            }
        );


        if (!response.ok) {

            const error =
                await response.json();

            throw new Error(
                error.detail ||
                "Unable to delete task."
            );
        }


        tasks = tasks.filter(
            (item) => item.id !== taskId
        );


        saveTasksToCache();

        renderTasks();

    } catch (error) {

        console.error(
            "Delete task failed:",
            error
        );

        alert(error.message);
    }
}


// =========================================================
// LOAD TASKS FROM BACKEND
// =========================================================

async function loadTasksFromBackend() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/tasks`
        );


        if (!response.ok) {
            throw new Error(
                "Unable to load tasks."
            );
        }


        const serverTasks =
            await response.json();


        tasks = serverTasks;

        saveTasksToCache();

        renderTasks();

    } catch (error) {

        console.error(
            "Unable to load tasks:",
            error
        );

        // Cached tasks remain visible.
        // Therefore, the user doesn't get
        // an empty screen if the API is unavailable.
    }
}


// =========================================================
// APPLICATION INITIALIZATION
// =========================================================

function initializeApp() {

    // 1. Load cached tasks immediately.
    // 2. Render them immediately.
    // 3. Request latest data from backend.

    tasks = loadTasksFromCache();

    renderTasks();

    loadTasksFromBackend();
}


initializeApp();