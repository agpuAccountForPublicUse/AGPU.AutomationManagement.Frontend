document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById("logout-button").addEventListener("click", onLogoutButtonClicked);

    await refreshTokensIfRequired();

    const callbackUrl = encodeURIComponent(window.location.href);
    await isAuthenticated(callbackUrl);

    document.getElementById("addProblemForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        document.getElementById("errorMessage").style.display = "block";
        await addProblem();
    });
});

function onAddProblemButtonClicked() {
    document.getElementById("addProblemModal").style.display = "flex";
}

function onCloseProblemAddingModalClicked(){
    document.getElementById("addProblemModal").style.display = "none";
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