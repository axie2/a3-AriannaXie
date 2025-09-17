// FRONT-END (CLIENT) JAVASCRIPT HERE

function formatDate(dateStr) {
    if (!dateStr) {
        return "";
    } else {
        const date = new Date(dateStr);

        // convert to UTC to ignore time zones
        const day = date.getUTCDate();
        const month = date.getUTCMonth();
        const year = date.getUTCFullYear();

        const utcDate = new Date(Date.UTC(year, month, day));

        return utcDate.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
        });
    }
};

const deleteTask = async function (event) {
    event.preventDefault();

    if (event.target.classList.contains("delete-btn")) {
        const li = event.target.closest("li");
        const taskID = li.dataset.id;

        const response = await fetch(`/delete/${taskID}`, {
            method: "DELETE"
        });

        const result = await response.json()
        if (result.success) {
            li.remove()
        }
    }
};

function showEditForm(li, task) {
    let dateStr = "";
    if (task.dueDate) {
        const date = new Date(task.dueDate);
        dateStr = date.toISOString().split("T")[0];
    }
    
    li.innerHTML = `
        <form class="row g-2 align-items-stretch" id="edit-form">
            <div class="col-12 col-lg-3 d-flex flex-column">
                <label class="fw-bold" for="edit-title">Task Title</label>
                <input type="text" class="form-control form-control-md flex-grow-1 title" id="edit-title" value="${task.title}">
            </div>

            <div class="col-12 col-lg-4 d-flex flex-column">
                <label class="fw-bold" for="edit-description">Task Description</label>
                <textarea class="form-control form-control-md flex-grow-1 description" id="edit-description">${task.description}</textarea>
            </div>

            <div class="col-12 col-lg-2 d-flex flex-column">
                <label class="fw-bold" for="edit-due">Task Due Date</label>
                <input type="date" class="form-control form-control-md flex-grow-1 dueDate" id="edit-due" value="${dateStr}">
            </div>

            <div class="col-12 col-lg-3 d-flex align-items-center justify-content-end gap-1">
                <button class="btn btn-sm btn-font btn-org save-btn">Save</button>
                <button class="btn btn-sm btn-danger btn-font btn-red cancel-btn">Cancel</button>
            </div>

        </form>
    `;
}

async function saveEdit(li) {

    const title = li.querySelector("#edit-title").value;
    const description = li.querySelector("#edit-description").value;
    const dueDate = new Date(li.querySelector("#edit-due").value);

    // Show error message if due date is in the past
    if (dueDate && dueDate < new Date()) {
        const message = document.createElement("p");
        message.className = "error-msg text-danger small mt-1 fw-bold";
        message.textContent = "Due date cannot be in the past.";
        li.appendChild(message);
        return;
    }

    // remove any previous error message
    const prevError = li.querySelector(".error-msg");
    if (prevError) prevError.remove();

    const updatedTask = { title, description, dueDate };

    const response = await fetch(`/update/${li.dataset.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTask),
    });

    const task = await response.json();

    li.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex flex-column flex-grow-1">
                <div class="d-flex align-items-center">
                    <span class="bullet me-2">☕</span>
                    <span class="fw-bold">${task.title}</span>
                    ${task.description ? `: ${task.description}` : ""}
                </div>
                ${
                    task.dueDate
                        ? `<div class="small ms-4">(Due ${formatDate(
                              task.dueDate
                          )}) 
                                        <span class="counter ms-2">Days Until Due: ${
                                            task.daysUntilDue
                                        }</span>
                                </div>`
                        : ""
                }
            </div>
            <div class="d-flex flex-column flex-sm-row align-items-center ms-1 gap-1">
                <button class="btn btn-sm btn-font btn-org edit-btn">Edit</button>
                <button class="btn btn-sm btn-danger btn-font btn-red delete-btn">Delete</button>
            </div>
        </div>
    `;
}

function cancelEdit(li, task) {
    li.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex flex-column flex-grow-1">
                <div class="d-flex align-items-center">
                    <span class="bullet me-2">☕</span>
                    <span class="fw-bold">${task.title}</span>
                    ${task.description ? `: ${task.description}` : ""}
                </div>
                ${
                    task.dueDate
                        ? `<div class="small ms-4">(Due ${formatDate(
                              task.dueDate
                          )}) 
                                        <span class="counter ms-2">Days Until Due: ${
                                            task.daysUntilDue
                                        }</span>
                                </div>`
                        : ""
                }
            </div>
            <div class="d-flex flex-column flex-sm-row align-items-center ms-1 gap-1">
                <button class="btn btn-sm btn-font btn-org edit-btn">Edit</button>
                <button class="btn btn-sm btn-danger btn-font btn-red delete-btn">Delete</button>
            </div>
        </div>
    `;
}

const editTask = async function (event) {
    event.preventDefault();
    const li = event.target.closest("li"),
        taskID = li.dataset.id;

    const response = await fetch(`/tasks/${taskID}`);
    const task = await response.json();

    if (event.target.classList.contains("edit-btn")) {
        showEditForm(li, task);
    } else if (event.target.classList.contains("save-btn")) {
        saveEdit(li);
    } else if (event.target.classList.contains("cancel-btn")) {
        cancelEdit(li, task);
    }
}


const submit = async function (event) {
    // stop form submission from trying to load a new .html page for displaying results...
    // this was the original browser behavior and still
    // remains to this day
    event.preventDefault();

    const title = document.querySelector(".title"),
        description = document.querySelector(".description"),
        dueDate = document.querySelector(".dueDate"),
        tasks = document.querySelector("#tasks"),
        form = document.querySelector("#add-form");
    
    const existingError = document.querySelector(".error-msg ");
    if (existingError) existingError.remove();

    if (dueDate.value && new Date(dueDate.value) < new Date()) {
        const message = document.createElement("p");
        message.className = "error-msg text-danger small mt-1 fw-bold";
        message.textContent = "Due date cannot be in the past.";
        form.appendChild(message);
        return;
    }

    const json = {
        title: title.value,
        description: description.value,
        dueDate: dueDate.value,
    },
    body = JSON.stringify(json);

    // send to server through the /submit url and wait for response
    // can only use await in async function
    const response = await fetch("/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body,
    });

    const task = await response.json()
    tasks.innerHTML += `
        <li data-id="${task._id}" class="list-group-item list-bg">
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex flex-column flex-grow-1">
                    <div class="d-flex align-items-center">
                        <span class="bullet me-2">☕</span>
                        <span class="fw-bold">${task.title}</span>
                        ${task.description ? `: ${task.description}` : ""}
                    </div>
                    ${
                        task.dueDate
                            ? `<div class="small ms-4">(Due ${formatDate(
                                  task.dueDate
                              )}) 
                                            <span class="counter ms-2">Days Until Due: ${
                                                task.daysUntilDue
                                            }</span>
                                    </div>`
                            : ""
                    }
                </div>
                <div class="d-flex flex-column flex-sm-row align-items-center ms-1 gap-1">
                    <button class="btn btn-sm btn-font btn-org edit-btn">Edit</button>
                    <button class="btn btn-sm btn-danger btn-font btn-red delete-btn">Delete</button>
                </div>
            </div>
        </li>
    `;

    // clear form fields
    title.value = "";
    description.value = "";
    dueDate.value = "";

    // const text = await response.text()
    // console.log( "text:", text)
};


// after the window is done loading, run this function
// window.onload is an event
window.onload = async function () {
    // load tasks
    const tasksList = document.querySelector("#tasks");
    const button = document.querySelector(".submit-btn");
    button.onclick = submit;

    // get tasks from server
    const response = await fetch("/tasks");
    const tasks = await response.json();

    tasks.forEach((task) => {
        tasksList.innerHTML += `
            <li data-id="${task._id}" class="list-group-item list-bg">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex flex-column flex-grow-1">
                        <div class="d-flex align-items-center">
                            <span class="bullet me-2">☕</span>
                            <span class="fw-bold">${task.title}</span>
                            ${task.description ? `: ${task.description}` : ""}
                        </div>
                        ${
                            task.dueDate
                                ? `<div class="small ms-4">(Due ${formatDate(
                                      task.dueDate
                                  )}) 
                                                <span class="counter ms-2">Days Until Due: ${
                                                    task.daysUntilDue
                                                }</span>
                                        </div>`
                                : ""
                        }
                    </div>
                    <div class="d-flex flex-column flex-sm-row align-items-center ms-1 gap-1">
                        <button class="btn btn-sm btn-font btn-org edit-btn">Edit</button>
                        <button class="btn btn-sm btn-danger btn-font btn-red delete-btn">Delete</button>
                    </div>
                </div>
            </li>
        `;
    });

    tasksList.addEventListener("click", deleteTask);
    tasksList.addEventListener("click", editTask);
};
