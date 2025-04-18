document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("sign-in-button").addEventListener("click", onSignInButtonClicked);
    document.getElementById("logout-button").addEventListener("click", onLogoutButtonClicked);

    await refreshTokensIfRequired();
    await isAuthenticatedIndex();
});

function onSignInButtonClicked() {
    window.location = "sign-in.html";
}

async function isAuthenticatedIndex() {
    try {
        const accessToken = getAccessToken();
        const response = await fetch(`${apiBaseUrl}/users/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            }
        });

        if (response.ok) {
            const currentUser = await response.json();
            document.getElementById("navigation-panel").style.visibility = "visible";
            hideIfNotAdministratorOrDeputyAdministrator(accessToken, "users-navigation-item");
            showEmailIndex(currentUser.email);
        } else {
            showSignInButton();
        }
    }
    catch (error) {
        console.error(error);
    }
}

function showSignInButton() {
    document.getElementById("user-info").style.display = "none";
    document.getElementById("sign-in-button").style.display = "block";
}

function showEmailIndex(email) {
    const emailElement = document.getElementById("email");
    emailElement.textContent = email;

    document.getElementById("user-info").style.display = "flex";
    document.getElementById("sign-in-button").style.display = "none";
}