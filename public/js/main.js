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

function showEditForm (li, task) {
    let dateStr = "";
    if(task.dueDate) {
        const date = new Date(task.dueDate);
        dateStr = date.toISOString().split("T")[0];
    }

    li.innerHTML = `
        <div id="edit-form">
            <input type="text" id="edit-title" class="title" value="${task.title}" placeholder="Title" />
            <input type="text" id="edit-description" class="description" value="${task.description}" placeholder="Description" />
            <input type="date" id="edit-due" class="dueDate" value="${dateStr}" />
            <button class="save-btn">Save</button>
            <button class="cancel-btn">Cancel</button>
        </div>
    `;
}

async function saveEdit (li) {
    const updatedTask = {
        title: li.querySelector("#edit-title").value,
        description: li.querySelector("#edit-description").value,
        dueDate: new Date(li.querySelector("#edit-due").value)
    }

    const response = await fetch(`/update/${li.dataset.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTask),
    });

    const task = await response.json();

    console.log("task from server:", task);
    console.log("task dat:", task.dueDate);

    li.innerHTML = `
        <span class="title-text">${task.title}</span>
        ${
            task.description
                ? `:
            ${task.description}`
                : ""
        }
        <div class="due-date">
            ${
                task.dueDate
                    ? `(Due ${formatDate(task.dueDate)}) 
                <span class="counter">Days Until Due: </span> ${
                    task.daysUntilDue
                }`
                    : ""
            }
        </div>
        <div class="btn-group">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;
}

function cancelEdit (li, task) {
    li.innerHTML = `
        <span class="title-text">${task.title}</span>
        ${task.description ? `: ${task.description}` : ""}
        <div class="due-date">
            ${
                task.dueDate
                    ? `(Due ${formatDate(task.dueDate)}) 
                <span class="counter">Days Until Due: </span> ${
                    task.daysUntilDue
                }`
                    : ""
            }
        </div>
        <div class="btn-group">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
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
        json = {
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
        <li data-id="${task._id}" class="list-item">
            <span class="title-text">${task.title}</span>
            ${task.description ? `:  ${task.description}` : ""}
            <div class="due-date">
                ${
                    task.dueDate
                        ? `(Due ${formatDate(task.dueDate)}) 
                    <span class="counter">Days Until Due: </span> ${
                        task.daysUntilDue
                    }`
                        : ""
                }
            </div>
            <div class="btn-group">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        </li>
    `;

    // clear form fields
    title.value = "";
    description.value = "";
    dueDate.value = "";

    // const text = await response.text()
    // console.log( "text:", text)

    tasks.addEventListener("click", deleteTask)
    tasks.addEventListener("click", editTask)
};


// after the window is done loading, run this function
// window.onload is an event
window.onload = async function () {
    const tasksList = document.querySelector("#tasks");
    const button = document.querySelector(".submit-btn");

    button.onclick = submit;

    // get tasks from server
    const response = await fetch("/tasks");
    const tasks = await response.json();
    console.log("tasks: ", tasks);

    tasks.forEach((task) => {
        tasksList.innerHTML += `
            <li data-id="${task._id}" class="list-item">
                <span class="title-text">${task.title}</span>
                ${task.description ? `:  ${task.description}` : ""}
                <div class="due-date">
                    ${
                        task.dueDate
                            ? `(Due ${formatDate(task.dueDate)}) 
                        <span class="counter">Days Until Due: </span> ${
                            task.daysUntilDue
                        }`
                            : ""
                    }
                </div>
                <div class="btn-group">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
            </li>
        `;
    });

    tasksList.addEventListener("click", deleteTask);
    tasksList.addEventListener("click", editTask);
};
