document.addEventListener('DOMContentLoaded', async () => {
    await refreshTokensIfRequired();

    const callbackUrl = encodeURIComponent(window.location.href);
    await isAuthenticated(callbackUrl);

    const urlParams = new URLSearchParams(window.location.search);
    const res = updatePageSizesSelect(urlParams);

    await loadUsers(res.pageIndex, res.pageSize);
    await loadRoles();

    document.getElementById("add-user-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        document.getElementById("errors").style.display = "block";
        await addUser();
    });

    document.getElementById("page-sizes-select").addEventListener("change", () => onPageSizeChanged("users.html"));
    document.getElementById("add-user-form").reset();
});

async function addUser() {
    await refreshTokensIfRequired();
    document.getElementById("errors").textContent = "";

    const fullName = document.getElementById("fullName-input").value.trim();
    const email = document.getElementById("email-input").value.trim();
    const selectedRole = document.getElementById("roles-select").value;
    const username = document.getElementById("username-input").value.trim();
    const password = document.getElementById("password-input").value.trim();
    const post = document.getElementById("post-input").value.trim();

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

        switch (response.status) {
            case 200: {
                document.getElementById("add-user-form").reset();
                window.location.reload();
                return;
            }
            case 400: {
                const responseData = await response.json();
                document.getElementById("errors").textContent = joinErrors(responseData.errors);
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

async function loadRoles() {
    try {
        const response = await fetch(`${apiBaseUrl}/roles`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAccessToken()}`
            }
        });

        switch (response.status) {
            case 200: {
                const responseData = await response.json();
                const rolesSelect = document.getElementById("roles-select");

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
                console.log(await response.text());
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
            console.log(await response.text());
        }

    } catch (error) {
        console.error(error);
    }
}