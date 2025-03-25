document.addEventListener('DOMContentLoaded', async () => {
    await refreshTokensIfRequired();

    const callbackUrl = encodeURIComponent(window.location.href);
    await isAuthenticated(callbackUrl);

    const urlParams = new URLSearchParams(window.location.search);
    const res = updatePageSizesSelect(urlParams);
    const status = urlParams.get("status") || "All";
    const statusesSelect = document.getElementById("problemStatuses");
    const statusExists = Array.from(statusesSelect.options).some(option => option.value === status);

    statusesSelect.value = statusExists ? status : statusesSelect.options[0].value;
    console.log(`Loading page:\n Status select value: ${statusesSelect.value}`);

    await loadProblems(res.pageIndex, res.pageSize, status);

    document.getElementById("addProblemForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        document.getElementById("errorMessage").style.display = "block";
        await addProblem();
    });

    document.getElementById("page-sizes-select").addEventListener("change", () => onPageSizeChanged("problems.html", buildExtraParamsString));
    document.getElementById("problemStatuses").addEventListener("change", onStatusChanged);
});

function buildExtraParamsString(){
    const status = document.getElementById("problemStatuses").value;
    console.log(`${buildExtraParamsString.name} func: Extracted status: ${status}`);
    return `&status=${status}`;
}

async function addProblem() {
    await refreshTokensIfRequired();

    const accessToken = getAccessToken();

    const title = document.getElementById("titleInput").value.trim();
    const description = document.getElementById("descriptionInput").value.trim();
    const selectedType = document.getElementById("problemTypesSelect").value;
    const audience = document.getElementById("audienceInput").value.trim();

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
                "Authorization": `Bearer ${accessToken}`
            },
            body: body
        });

        const responseData = await response.json();

        switch (response.status) {
            case 200: {
                document.getElementById("addProblemForm").reset();
                window.location.reload();
                return;
            }
            case 400: {
                const errorMessage = Object.values(responseData.errors)
                    .flat()
                    .join('\n');

                const errorMessageElement = document.getElementById("errorMessage");
                errorMessageElement.textContent = errorMessage;
                errorMessageElement.style.display = "block";
                return;
            }
            case 401: {
                window.location = "sign-in.html";
                return;
            }
            default:{
                console.log(response.status);
                return;
            }
        }
    }
    catch (error) {
        console.error(error);
    }
}

async function loadProblems(pageIndex, pageSize, status) {
    const accessToken = getAccessToken();

    try {
        let url = `${apiBaseUrl}/problems?pageIndex=${pageIndex}&pageSize=${pageSize}`;
        if (status !== "All" && status !== null) {
            url += `&status=${status}`;
        }

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
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
            console.log(response.status);
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
    const selectedStatus = document.getElementById("problemStatuses").value;
    const selectedPageSize = document.getElementById("page-sizes-select").value;
    window.location = `problems.html?pageIndex=1&pageSize=${selectedPageSize}&status=${selectedStatus}`;
    console.log(`${onStatusChanged.name} func:\n Selected status: ${selectedStatus}`);
}