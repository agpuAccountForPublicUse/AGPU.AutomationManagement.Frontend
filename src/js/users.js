document.addEventListener('DOMContentLoaded', async () => {
    await refreshTokensIfRequired();

    const callbackUrl = encodeURIComponent(window.location.href);
    await isAuthenticated(callbackUrl);

    const urlParams = new URLSearchParams(window.location.search);
    const res = updatePageSizesSelect(urlParams);

    await loadUsers(res.pageIndex, res.pageSize);
    await loadRoles();

    document.getElementById("addUserForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        document.getElementById("errorMessage").style.display = "block";
        await addUser();
    });

    document.getElementById("page-sizes-select").addEventListener("change", () => onPageSizeChanged("users.html"));
});

async function addUser() {
    await refreshTokensIfRequired();

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
                "Authorization": `Bearer ${getAccessToken()}`
            },
            body: body
        });

        const responseData = await response.json();

        switch (response.status) {
            case 200: {
                document.getElementById("addUserForm").reset();
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
    try {
        const response = await fetch(`${apiBaseUrl}/roles`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAccessToken()}`
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
    try {
        const response = await fetch(`${apiBaseUrl}/users?pageIndex=${pageIndex}&pageSize=${pageSize}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAccessToken()}`
            }
        });

        if (response.ok) {
            const usersPage = await response.json();

            const usersList = document.getElementById("users-list");
            usersList.innerHTML = "";

            usersPage.items.forEach(user => {
                const li = document.createElement("li");
                li.classList.add("user-item");

                li.innerHTML = `
        <div class="user-card">
            <h3><u>${user.email}</u></h3>
            <p><strong>ФИО:</strong> ${user.fullName}</p>
            <p><strong>Должность:</strong> ${user.post}</p>
            <p><strong>Логин:</strong> ${user.username}</p>
        </div>
    `;

                usersList.appendChild(li);
            });


            updatePager(usersPage.pageIndex, usersPage.totalPagesCount, usersPage.hasNextPage, usersPage.hasPreviousPage, "users.html");
        } else if (response.status === 401) {
            window.location = "sign-in.html";
        } else {
            console.log(response.status);
        }

    } catch (error) {
        console.error(error);
    }
}