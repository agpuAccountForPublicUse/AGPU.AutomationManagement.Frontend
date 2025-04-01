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

    const ratingValue = document.getElementById("modal-rating-value");
    const stars = document.getElementById("modal-stars").querySelectorAll(".fa");

    stars.forEach(star => {
        star.addEventListener("click", function() {
            const rating = parseInt(this.getAttribute("data-value"));
            ratingValue.textContent = rating;

            stars.forEach(s => s.classList.remove("star-checked"));
            for (let i = 0; i < rating; i++) {
                stars[i].classList.add("star-checked");
            }
        });
    });
});

async function addComment() {
    await refreshTokensIfRequired();
    document.getElementById("add-comment-errors").textContent = "";

    try {
        const response = await fetch(`${apiBaseUrl}/problems/${problem?.id}/assign-solving-score`, {
           method: "PATCH",
           headers: {
               "content-type": "application/json",
               "Authorization" : `Bearer ${getAccessToken()}`
           },
            body: JSON.stringify({
                value: parseInt(document.getElementById("modal-rating-value").textContent),
                description: document.getElementById("comment-input").value
            })
        });

        switch (response.status) {
            case 200:{
                window.location.reload();
                return;
            }
            case 400:{
                const data = await response.json();
                document.getElementById("add-comment-errors").textContent = joinErrors(data.errors);

                return;
            }
            case 401:{
                window.location = "sign-in.html";
                return;
            }
            default: {
                console.log(await response.text());
                return;
            }
        }
    }
    catch (e) {
        console.error(e);
    }
}

async function markSolved() {
    await refreshTokensIfRequired();
    document.getElementById("mark-solved-errors").textContent = "";

    try {
        const solvingTime = document.getElementById("solving-time-input").value; // формат "HH:MM"
        const solvingDate = document.getElementById("solving-date-input").value; // формат "YYYY-MM-DD"

        const [year, month, day] = solvingDate.split("-").map(Number);
        const [hours, minutes] = solvingTime.split(":").map(Number);

        const utcDate = new Date(year, month, day, hours, minutes);

        const formattedUTCDate = `${String(utcDate.getUTCDate()).padStart(2, "0")}.${String(utcDate.getUTCMonth() + 1).padStart(2, "0")}.${utcDate.getUTCFullYear()}`;
        const formattedUTCTime = `${String(utcDate.getUTCHours()).padStart(2, "0")}:${String(utcDate.getUTCMinutes()).padStart(2, "0")}`;

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

        switch (response.status) {
            case 200:{
                window.location.reload();
                return;
            }
            case 400:{
                const data = await response.json();
                document.getElementById("mark-solved-errors").textContent = joinErrors(data.errors);
                return;
            }
            case 401:{
                window.location = "sign-in.html";
                return;
            }
            default: {
                console.log(await response.text());
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function attachContractor(){
    await refreshTokensIfRequired();
    document.getElementById("add-comment-errors").textContent = "";

    try {
        const response = await fetch(`${apiBaseUrl}/problems/${problem?.id}/attach-contractor`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify({ contractorId: document.getElementById("contractors-select").value }),
        });

        switch (response.status) {
            case 200:{
                window.location.reload();
                return;
            }
            case 400:{
                const data = await response.json();
                document.getElementById("add-comment-errors").textContent = joinErrors(data.errors);
                return;
            }
            case 401:{
                window.location = "sign-in.html";
                return;
            }
            default: {
                console.log(await response.text());
            }
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

    let starsHtml = "";
    if (problem.solvingScoreValue) {
        const starsContainer = document.createElement("div");
        starsContainer.classList.add("rating-container");

        starsContainer.innerHTML = `
            <div class="stars">
                        <span class="fa fa-star"></span>
                        <span class="fa fa-star"></span>
                        <span class="fa fa-star"></span>
                        <span class="fa fa-star"></span>
                        <span class="fa fa-star"></span>
                </div>
           <span>${problem.solvingScoreValue}</span>
    `;

        let counter = 0;
        for (const star of starsContainer.querySelector(".stars").querySelectorAll(".fa"))
        {
            if (counter >= problem.solvingScoreValue)
            {
                break;
            }

            star.classList.add("star-checked");
            counter++;
        }

        starsHtml = starsContainer.outerHTML;
    }

    container.innerHTML = `
    <div class="problem-header">
    <h1>${problem.title}</h1>
    <span class="problem-status" style="background-color: ${statusInfo.color};">
        ${statusInfo.icon} ${statusInfo.ru}
    </span>
</div>
<hr class="divider">
<div class="problem-content">
    <div class="problem-description">
        <h3 class="problem-creator">
            <span>${problem.creatorFullName}</span>
            <span><em>создал проблему</em></span>
            <span>${formatDateTime(problem.creationDateTime)}</span>
        </h3>
        <textarea class="description-text" readonly>${problem.description}</textarea>
    </div>
    
    <div class="problem-meta">
        <div class="meta-item">
            <p><strong>🏢 Аудитория:</strong></p>
            <p>${problem.audience}</p>
            <hr class="divider">
        </div>
        <div class="meta-item">
            <p><strong>📌 Тип проблемы:</strong></p>
            <p>${problem.type}</p>
            <hr class="divider">
        </div>
        <div class="meta-item">
            <p><strong>👤 Исполнитель:</strong></p>
            <p>${problem.contractor?.fullName ?? ""}</p>
            <hr class="divider">
        </div>
    </div>
</div>
<div class="problem-footer" style="display: ${problem.solvingDateTime === null ? "none" : "flex"}">
    <p class="completion-date">Выполнено: ${formatDateTime(problem.solvingDateTime)}</p>
    ${starsHtml}
    <textarea style="display: ${problem.solvingScoreValue === null ? "none" : "block"}" class="solving-feedback" required>${problem.solvingScoreDescription}</textarea>
</div>
<div class="problem-actions">
    <button id="attach-contractor-btn" onclick="onOpenAttachContractorModalWindow()">${problem.contractor === null ? "Назначить исполнителя" : "Сменить исполнителя"}</button>
    <button id="mark-solved-btn" onclick="onOpenModalWindowButtonClicked('mark-solved-window')">Завершить</button>
    <button id="add-comment-btn" onclick="onOpenModalWindowButtonClicked('add-comment-window')">Добавить комментарий</button>
</div>
    `;

    const decodedToken = decodeJwtTokenPayload(getAccessToken());
    const rolesArray = Array.isArray(decodedToken.roles) ? decodedToken.roles : [decodedToken.roles];

    document.getElementById("attach-contractor-btn").style.display =
        problem.solvingDateTime === null &&
        (rolesArray.includes(administrator) || rolesArray.includes(deputyAdministrator))
         ?
        "block"
        :
        "none";

    document.getElementById("mark-solved-btn").style.display =
        problem.solvingDateTime === null &&
        decodedToken.sub === problem?.contractor?.id
            ?
            "block"
            :
            "none";

    document.getElementById("add-comment-btn").style.display =
        problem.solvingScoreValue !== null ||
        problem.solvingDateTime === null ||
        problem.creatorId !== decodedToken.sub
            ?
            "none"
            :
            "block";
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

            onOpenModalWindowButtonClicked('attach-contractor-window');
        }
        else {
            console.log(await response.text());
        }
    }
    catch (error) {
        console.error(error);
    }
}

