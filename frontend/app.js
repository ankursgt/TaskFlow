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
const projectError = document.getElementById("project-error");

const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const taskCount = document.getElementById("task-count");
const quickAddForm = document.getElementById("quick-add-form");

const quickDescriptionInput = document.getElementById("quick-description");

const quickProjectInput = document.getElementById("quick-project-id");

const quickDescriptionError = document.getElementById("quick-description-error");

const quickProjectError = document.getElementById("quick-project-error");

const quickAddError = document.getElementById("quick-add-error");

const quickAddButton = document.getElementById("quick-add-button");


// =========================================================
// APPLICATION STATE
// =========================================================

let tasks = [];
let projects = [];


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

async function loadProjects() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/projects`
        );

        if (!response.ok) {
            throw new Error(
                "Unable to load projects."
            );
        }

        projects = await response.json();

        populateProjectDropdown();

    } catch (error) {

        console.error(
            "Unable to load projects:",
            error
        );

        [projectIdInput, quickProjectInput].forEach(
            (selectElement) => {
                if (!selectElement) {
                    return;
                }

                selectElement.replaceChildren();

                const option =
                    document.createElement("option");

                option.value = "";
                option.textContent =
                    "Unable to load projects";

                selectElement.appendChild(option);
            }
        );

        if (projectError) {
            projectError.textContent =
                "Unable to load projects. Please refresh the page.";
        }

        if (quickProjectError) {
            quickProjectError.textContent =
                "Unable to load projects. Please refresh the page.";
        }
    }
}


// =========================================================
// PROJECT DROPDOWN
// =========================================================

function populateProjectDropdown() {

    projectIdInput.replaceChildren();
    quickProjectInput.replaceChildren();


    // ---------------------------------------------
    // Default options
    // ---------------------------------------------

    const normalDefaultOption =
        document.createElement("option");

    normalDefaultOption.value = "";
    normalDefaultOption.textContent =
        "Select a project";


    const quickDefaultOption =
        document.createElement("option");

    quickDefaultOption.value = "";
    quickDefaultOption.textContent =
        "Select a project";


    projectIdInput.appendChild(
        normalDefaultOption
    );

    quickProjectInput.appendChild(
        quickDefaultOption
    );


    // ---------------------------------------------
    // Projects
    // ---------------------------------------------

    projects.forEach((project) => {

        const normalOption =
            document.createElement("option");

        normalOption.value =
            project.id;

        normalOption.textContent =
            project.name;


        const quickOption =
            document.createElement("option");

        quickOption.value =
            project.id;

        quickOption.textContent =
            project.name;


        projectIdInput.appendChild(
            normalOption
        );

        quickProjectInput.appendChild(
            quickOption
        );
    });


    // ---------------------------------------------
    // No projects
    // ---------------------------------------------

    if (projects.length === 0) {

        normalDefaultOption.textContent =
            "No projects available";

        quickDefaultOption.textContent =
            "No projects available";

        projectError.textContent =
            "Create a project before adding tasks.";

        quickProjectError.textContent =
            "Create a project before adding tasks.";

    } else {

        projectError.textContent = "";
        quickProjectError.textContent = "";
    }
}


// =========================================================
// FIND PROJECT
// =========================================================

function getProjectById(projectId) {

    return projects.find(
        (project) =>
            project.id === Number(projectId)
    );
}


function getProjectName(projectId) {

    const project =
        getProjectById(projectId);

    if (project) {
        return project.name;
    }

    return `Project ${projectId}`;
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
        `Status: ${task.status || "Not specified"}`;


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

function validateProject() {

    const projectId =
        projectIdInput.value;


    if (!projectId) {

        projectError.textContent =
            "Please select a project.";

        return false;
    }


    projectError.textContent = "";

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

// Remove project error when selected.

projectIdInput.addEventListener(
    "change",
    () => {
        validateProject();
    }
);


// =========================================================
// ADD TASK
// =========================================================

taskForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const titleValid =
            validateTitle();

        const projectValid =
            validateProject();


        if (
            !titleValid ||
            !projectValid
        ) {
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

quickAddForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        quickDescriptionError.textContent = "";
        quickProjectError.textContent = "";
        quickAddError.textContent = "";


        // -------------------------------------------------
        // Client-side validation
        // -------------------------------------------------

        const description =
            quickDescriptionInput.value.trim();

        const projectId =
            quickProjectInput.value;


        if (!description) {

            quickDescriptionError.textContent =
                "Task description is required.";

            quickDescriptionInput.focus();

            return;
        }


        if (!projectId) {

            quickProjectError.textContent =
                "Please select a project.";

            quickProjectInput.focus();

            return;
        }


        // -------------------------------------------------
        // Disable button while request is running
        // -------------------------------------------------

        quickAddButton.disabled = true;

        quickAddButton.textContent =
            "Parsing...";


        try {

            // -------------------------------------------------
            // Call POST /tasks/quick-add
            // -------------------------------------------------

            const response =
                await fetch(
                    `${API_BASE_URL}/tasks/quick-add`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            description:
                                description,

                            project_id:
                                Number(projectId)
                        })
                    }
                );


            const responseData =
                await response.json();


            // -------------------------------------------------
            // Handle API errors
            // -------------------------------------------------

            if (!response.ok) {

                if (
                    response.status === 422
                ) {

                    quickAddError.textContent =
                        extractValidationError(
                            responseData
                        );

                } else {

                    quickAddError.textContent =
                        responseData.detail ||
                        "Unable to create task.";
                }

                return;
            }


            // -------------------------------------------------
            // Task successfully created
            // -------------------------------------------------

            const createdTask =
                responseData;


            // Add to local state.

            tasks.push(createdTask);


            // Update cache.

            saveTasksToCache();


            // Update UI.

            renderTasks();


            // Clear Quick Add form.

            quickAddForm.reset();


            // Keep focus on description.

            quickDescriptionInput.focus();


        } catch (error) {

            console.error(
                "Quick add failed:",
                error
            );

            quickAddError.textContent =
                "Unable to connect to the backend.";
        }


        finally {

            quickAddButton.disabled = false;

            quickAddButton.textContent =
                "Parse & Add Task";
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
     // Ask user for project.

    const currentProject =
        getProjectName(
            task.project_id
        );


    const projectNames =
        projects
            .map(
                (project) =>
                    `${project.id}: ${project.name}`
            )
            .join("\n");


    const newProject =
        prompt(
            `Select project ID:\n\n${projectNames}`,
            task.project_id
        );


    if (newProject === null) {
        return;
    }


    const projectId =
        Number(newProject);


    const selectedProject =
        getProjectById(projectId);


    if (!selectedProject) {

        alert(
            "Invalid project selected."
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
                    priority: priority,
                    project_id: projectId
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

async function initializeApp() {
    // Render cached tasks immediately.

    tasks = loadTasksFromCache();

    renderTasks();

    await Promise.all([
        loadProjects(),
        loadTasksFromBackend()
    ]);
}


initializeApp();