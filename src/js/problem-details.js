let problem = null;

document.addEventListener('DOMContentLoaded', async () => {
    await refreshTokensIfRequired();

    const callbackUrl = encodeURIComponent(window.location.href);
    await isAuthenticated(callbackUrl);

    const urlParams = new URLSearchParams(window.location.search);
    const problemId = urlParams.get("problemId");

    if (problemId) {
        await loadProblem(problemId);
    }

    document.getElementById("attach-contractor-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        await attachContractor();
    });

    document.getElementById("mark-solved-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        await markSolved();
    });

    document.getElementById("add-comment-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        await addComment();
    });

    const ratingValue = document.getElementById("rating-value");
    const stars = document.querySelector(".stars").querySelectorAll(".fa");

    stars.forEach(star => {
        star.addEventListener("click", function() {
            const rating = parseInt(this.getAttribute("data-value"));
            ratingValue.textContent = rating;

            stars.forEach(s => s.classList.remove("checked"));
            for (let i = 0; i < rating; i++) {
                stars[i].classList.add("checked");
            }
        });
    });
});

async function addComment(comment) {
    await refreshTokensIfRequired();

    try {
        const response = await fetch(`${apiBaseUrl}/problems/${problem?.id}/assign-solving-score`, {
           method: "PATCH",
           headers: {
               "content-type": "application/json",
               "Authorization" : `Bearer ${getAccessToken()}`
           },
            body: JSON.stringify({
                value: parseInt(document.getElementById("rating-value").textContent),
                description: document.getElementById("comment-input").value
            })
        });

        if (response.ok) {
            window.location.reload();
        }
        else {
            console.log(await response.text());
        }
    }
    catch (e) {
        console.error(e);
    }
}

async function markSolved() {
    await refreshTokensIfRequired();

    try {
        // TODO: Решить проблему с отобржаением или передачей даты и времени.

        const solvingTime = document.getElementById("time-input").value;
        const solvingDate = document.getElementById("date-input").value;

        const dateObj = new Date(`${solvingDate}T${solvingTime}Z`);

        const formattedUTCDate = dateObj.toISOString().split("T")[0].split("-").reverse().join(".");
        const formattedUTCTime = dateObj.toISOString().split("T")[1].slice(0, 5);

        console.log(formattedUTCDate + " " + formattedUTCTime);

        const response = await fetch(`${apiBaseUrl}/problems/${problem?.id}/mark-solved`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAccessToken()}`,
            },
            body: JSON.stringify({
                solvingDate: formattedUTCDate,
                solvingTime: formattedUTCTime,
            }),
        });

        if (response.ok) {
            window.location.reload();
        }
        else {
            console.log(await response.text());
        }

    } catch (error) {
        console.error(error);
    }
}

async function attachContractor(){
    await refreshTokensIfRequired();

    try {
        const response = await fetch(`${apiBaseUrl}/problems/${problem?.id}/attach-contractor`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify({ contractorId: document.getElementById("contractors-select").value }),
        });

        if (response.ok) {
            window.location.reload();
        }
        else {
            console.log(await response.text());
        }
    }
    catch (e) {
        console.error(e);
    }
}

async function loadProblem(problemId) {
    await refreshTokensIfRequired();

    try {
        const response = await fetch(`${apiBaseUrl}/problems/${problemId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAccessToken()}`
            },
        });

        if (response.ok) {
            const json = await response.json();
            problem = json;
            await renderProblemDetails(json);
        }
        else {
            console.log(await response.text());
        }
    }
    catch (error) {
        console.error(error);
    }
}

function renderProblemDetails(problem) {
    const container = document.querySelector(".main-container");
    const statusInfo = statusesMap[problem.status];

    container.innerHTML = `
    <div class="header-container">
        <h1>${problem.title}</h1>
        <span class="status-badge" style="background-color: ${statusInfo.color};">${statusInfo.icon} ${statusInfo.ru}</span>
    </div>
    <hr class="separator">
 <div style="display: flex; gap: 20px">
      <div class="description-container">
        <h3 style="background: gray; padding: 10px; font-size: 14px; display: flex; gap: 5px">
            <span style="color: white;">${problem.creatorFullName}</span>
            <span style="color: lightgray"><em>создал проблему</em></span>
            <span style="color: lightgray">${formatDateTime(problem.creationDateTime)}</span>
        </h3>
        <textarea readonly style="resize: none; padding: 5px">${problem.description}</textarea>
    </div>
    
    <div class="meta-container">
        <div class="meta-item">
            <p><strong>🏢 Аудитория:</strong></p>
            <p>${problem.audience}</p>
            <hr class="separator">
        </div>
        <div class="meta-item">
            <p><strong>📌 Тип проблемы:</strong></p>
            <p>${problem.type}</p>
            <hr class="separator">
        </div>
        <div class="meta-item">
            <p><strong>👤 Исполнитель:</strong></p>
            <p>${problem.contractor?.fullName ?? ""}</p>
            <hr class="separator">
        </div>
    </div>
</div>
<div>
    <p style="font-weight: 600">${problem.solvingDateTime === null ? "" : "Выполнено:"} ${formatDateTime(problem.solvingDateTime)}</p>
</div>
<p>${problem.solvingScoreValue}</p>
<textarea required style="resize: none">${problem.solvingScoreDescription}</textarea>
<div class="tools-container">
    <button onclick="onOpenAttachContractorModalWindow()">Назначить исполнителя</button>
    <button onclick="onOpenModalWindowButtonClicked('mark-solved-modal')">Завершить</button>
    <button onclick="onOpenModalWindowButtonClicked('add-comment-modal')">Добавить комментарий</button>
</div>
    `;

    // TODO: Добавить отображение информации об оценке и комментариях.
}

async function onOpenAttachContractorModalWindow() {
    await refreshTokensIfRequired();

    try {
        const response = await fetch(`${apiBaseUrl}/users/contractors`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAccessToken()}`
            }
        });

        if (response.ok) {
            const contractors = await response.json();
            const select = document.getElementById("contractors-select");

            select.innerHTML = "";
            contractors.forEach(e => {
                const option = document.createElement("option");
                option.text = e.fullName;
                option.value = e.id;
                select.appendChild(option);
            });

            if (problem?.contractor?.id !== null && contractors.some(e => e.id === problem?.contractor?.id)) {
                select.value = problem?.contractor?.id;
            } else {
                select.selectedIndex = 0;
            }

            onOpenModalWindowButtonClicked('attach-contractor-modal');
        }
        else {
            console.log(await response.text());
        }
    }
    catch (error) {
        console.error(error);
    }
}

