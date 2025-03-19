document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById("logout-button").addEventListener("click", onLogoutButtonClicked);

    await refreshTokensIfRequired();

    const callbackUrl = encodeURIComponent(window.location.href);
    await isAuthenticated(callbackUrl);

    const urlParams = new URLSearchParams(window.location.search);
    const pageIndex = urlParams.get("pageIndex") || 1;
    let pageSize = urlParams.get("pageSize");

    const pageSizesElement = document.getElementById("page-sizes-select");
    const optionExists = Array.from(pageSizesElement.options).some(option => option.value === pageSize);

    pageSizesElement.value = optionExists ? pageSize : pageSizesElement.options[0].value;
    pageSize = optionExists ? pageSize : pageSizesElement.options[0].value;

    await loadUsers(pageIndex, pageSize);
    await loadRoles();

    document.getElementById("addUserForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        document.getElementById("errorMessage").style.display = "block";
        await addUser();
    });

    document.getElementById("page-sizes-select").addEventListener("change", onPageSizeChange);
});

async function onPageSizeChange() {
    const selectedPageSize = document.getElementById("page-sizes-select").value;

    window.location = `users.html?pageIndex=1&pageSize=${selectedPageSize}`;
}

async function addUser() {
    await refreshTokensIfRequired();

    const accessToken = getAccessToken();

    const fullName = document.getElementById("fullNameInput").value.trim();
    const email = document.getElementById("emailInput").value.trim();
    const selectedRole = document.getElementById("rolesSelect").value;
    const username = document.getElementById("usernameInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();
    const post = document.getElementById("postInput").value.trim();

    try {
        const body = JSON.stringify({
            fullName,
            email,
            roleId: selectedRole,
            username,
            password,
            post
        });

        const response = await fetch(`${apiBaseUrl}/users`, {
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

async function loadRoles() {
    const accessToken = getAccessToken();

    try {
        const response = await fetch(`${apiBaseUrl}/roles`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        });

        const responseData = await response.json();

        switch (response.status) {
            case 200: {
                const rolesSelect = document.getElementById("rolesSelect");

                responseData.forEach((item) => {
                    const option = document.createElement("option");

                    option.value = item.id;
                    option.textContent = item.name;

                    rolesSelect.appendChild(option);
                });
                return;
            }
            case 401:{
                window.location = "sign-in.html";
                return;
            }
            default:{
                console.log(response.status);
            }
        }
    }
    catch (error) {
        console.error(error);
    }
}

async function loadUsers(pageIndex, pageSize) {
    const accessToken = getAccessToken();

    try {
        const response = await fetch(`${apiBaseUrl}/users?pageIndex=${pageIndex}&pageSize=${pageSize}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const usersPage = await response.json();

            const usersList = document.getElementById("users-list");
            usersList.innerHTML = "";

            usersPage.items.forEach(user => {
                const li = document.createElement("li");
                li.innerHTML = `
            <span><u>${user.email}</u></span>
            <div>ФИО: ${user.fullName}</div>
            <div>Должность: ${user.post}</div>
            <div>Логин: ${user.username}</div>
             `;
                usersList.appendChild(li);
            });

            updatePager(usersPage.pageIndex, usersPage.totalPagesCount, usersPage.hasNextPage, usersPage.hasPreviousPage);
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

function onAddUserButtonClicked() {
    document.getElementById("addUserModal").style.display = "flex";
}

function onCloseUserAddingModalClicked(){
    document.getElementById("addUserModal").style.display = "none";
}

function updatePager(pageIndex, totalPages, hasNextPage, hasPreviousPage) {

    const rangeSize = 5; // 2 страницы до, 2 страницы после, и текущая страница
    const halfRange = Math.floor(rangeSize / 2);

    let startPage = Math.max(1, pageIndex - halfRange);
    let endPage = Math.min(totalPages, pageIndex + halfRange);

    if (pageIndex - startPage < halfRange) {
        endPage = Math.min(totalPages, endPage + (halfRange - (pageIndex - startPage)));
    }

    if (endPage - pageIndex < halfRange) {
        startPage = Math.max(1, startPage - (halfRange - (endPage - pageIndex)));
    }

    const pageNumbersContainer = document.querySelector(".page-numbers");
    pageNumbersContainer.innerHTML = "";

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement("button");
        pageButton.textContent = i;

        if (i === pageIndex) {
            pageButton.classList.add("active");
        }

        pageButton.addEventListener("click", () => {
            const selectedPageSize = document.getElementById("page-sizes-select").value;
            window.location = `users.html?pageIndex=${i}&pageSize=${selectedPageSize}`;
        });

        pageNumbersContainer.appendChild(pageButton);
    }

    const previousButton = document.getElementById("previous-page");
    const nextButton = document.getElementById("next-page");

    previousButton.disabled = !hasPreviousPage;
    nextButton.disabled = !hasNextPage;

    previousButton.onclick = () => {
        const selectedPageSize = document.getElementById("page-sizes-select").value;
        window.location = `users.html?pageIndex=${pageIndex - 1}&pageSize=${selectedPageSize}`;
    };
    nextButton.onclick = () => {
        const selectedPageSize = document.getElementById("page-sizes-select").value;
        window.location = `users.html?pageIndex=${pageIndex + 1}&pageSize=${selectedPageSize}`;
    };
}