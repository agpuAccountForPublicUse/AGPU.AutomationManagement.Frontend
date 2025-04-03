document.addEventListener('DOMContentLoaded', async () => {
    await refreshTokensIfRequired();

    const callbackUrl = encodeURIComponent(window.location.href);
    await isAuthenticated(callbackUrl);

    const urlParams = new URLSearchParams(window.location.search);
    const res = updatePageSizesSelect(urlParams);
    const status = urlParams.get("status") || "All";
    const statusesSelect = document.getElementById("problem-statuses");
    const statusExists = Array.from(statusesSelect.options).some(option => option.value === status);

    statusesSelect.value = statusExists ? status : statusesSelect.options[0].value;
    console.log(`Loading page:\n Status select value: ${statusesSelect.value}`);

    await loadProblems(res.pageIndex, res.pageSize, status);

    document.getElementById("add-problem-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        document.getElementById("errors").style.display = "block";
        await addProblem();
    });

    document.getElementById("page-sizes-select").addEventListener("change", () => onPageSizeChanged("problems.html", buildExtraParamsString));
    document.getElementById("problem-statuses").addEventListener("change", onStatusChanged);
    document.getElementById("add-problem-form").reset();

    const prTypesSelect = document.getElementById("problem-types-select");
    for (const prop in problemTypesMap) {
        const option = document.createElement("option");
        option.value = prop;
        option.text = problemTypesMap[prop].ru;
        prTypesSelect.appendChild(option);
    }
});

function buildExtraParamsString(){
    const status = document.getElementById("problem-statuses").value;
    console.log(`${buildExtraParamsString.name} func: Extracted status: ${status}`);
    return `&status=${status}`;
}

async function addProblem() {
    await refreshTokensIfRequired();
    document.getElementById("errors").textContent = "";

    const title = document.getElementById("title-input").value.trim();
    const description = document.getElementById("description-input").value.trim();
    const selectedType = document.getElementById("problem-types-select").value;
    const audience = document.getElementById("audience-input").value.trim();

    try {
        const body = JSON.stringify({
            title,
            description,
            audience,
            type: selectedType,
        });

        const response = await fetch(`${apiBaseUrl}/problems`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAccessToken()}`
            },
            body: body
        });

        switch (response.status) {
            case 200: {
                document.getElementById("add-problem-form").reset();
                window.location.reload();
                return;
            }
            case 400: {
                const data = await response.json();
                document.getElementById("errors").textContent = joinErrors(data.errors);
                return;
            }
            case 401: {
                window.location = "sign-in.html";
                return;
            }
            default:{
                console.log(await response.text());
                return;
            }
        }
    }
    catch (error) {
        console.error(error);
    }
}

async function loadProblems(pageIndex, pageSize, status) {
    try {
        let url = `${apiBaseUrl}/problems?pageIndex=${pageIndex}&pageSize=${pageSize}`;
        if (status !== "All" && status !== null) {
            url += `&status=${status}`;
        }

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAccessToken()}`
            }
        });

        if (response.ok) {
            const problemsPage = await response.json();

            const usersList = document.getElementById("problems-list");
            usersList.innerHTML = "";

            problemsPage.items.forEach(problem => {
                const li = document.createElement("li");
                li.classList.add("problem-item");

                const statusColor = statusesMap[problem.status].color;

                const formattedDate = formatDateTime(problem.creationDateTime);

                li.innerHTML = `
        <div class="problem-card" onclick="onProblemClicked('${problem.id}')">
            <h3>
                <span class="status-icon" style="background-color: ${statusColor};"></span>
                ${problem.title}
            </h3>
            <hr>
            <p><strong>📅 Дата создания:</strong> ${formattedDate}</p>
            <p><strong>👤 Создатель:</strong> ${problem.creatorFullName}</p>
            <p><strong>🏢 Аудитория:</strong> ${problem.audience}</p>
            <p><strong>${problemTypesMap[problem.type].icon} Тип:</strong> ${problemTypesMap[problem.type].ru}</p>
        </div>
    `;
                usersList.appendChild(li);
            });

            updatePager(
                problemsPage.pageIndex,
                problemsPage.totalPagesCount,
                problemsPage.hasNextPage,
                problemsPage.hasPreviousPage,
                "problems.html",
                buildExtraParamsString);
        }
        else if (response.status === 401) {
            window.location = "sign-in.html";
        }
        else {
            console.log(await response.text());
        }

    } catch (error) {
        console.error(error);
    }
}

function onProblemClicked(problemId) {
    console.log(problemId);
    window.location = "problem-details.html?problemId=" + problemId;
}

function onStatusChanged() {
    const selectedStatus = document.getElementById("problem-statuses").value;
    const selectedPageSize = document.getElementById("page-sizes-select").value;
    window.location = `problems.html?pageIndex=1&pageSize=${selectedPageSize}&status=${selectedStatus}`;
    console.log(`${onStatusChanged.name} func:\n Selected status: ${selectedStatus}`);
}