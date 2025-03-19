document.getElementById("sign-in-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    document.getElementById("signInErrorMessage").style.display = "none";

    const urlParams = new URLSearchParams(window.location.search);
    const callbackUrl = urlParams.get("callbackUrl");

    await signIn(callbackUrl);
});

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('passwordInput');
    const showPasswordCheckbox = document.getElementById('showPasswordCheckbox');
    passwordInput.type = showPasswordCheckbox.checked ? "text" : "password";
}

async function signIn(callbackUrl = null) {
    const emailOrUsername = document.getElementById("emailOrUsernameInput").value;
    const password = document.getElementById("passwordInput").value;

    const body = JSON.stringify({ emailOrUsername, password });

    try {
        const response = await fetch(`${apiBaseUrl}/auth/sign-in`, {
            method: "POST",
            body: body,
            headers: {
                "Content-Type": "application/json",
            }
        });

        const responseData = await response.json();
        if (response.ok) {

            // TODO: Choose another option to store tokens;

            localStorage.setItem(accessTokenKey, responseData.accessToken);
            localStorage.setItem(refreshTokenKey, responseData.refreshToken);

            if (!callbackUrl) {
                callbackUrl = "index.html";
            }
            else {
                callbackUrl = decodeURIComponent(callbackUrl);
            }

            window.location = callbackUrl;
        }
        else if (response.status === 400) {
            const errorMessage = Object.values(responseData.errors)
                .flat()
                .join('\n');

            const signInErrorMessageElement = document.getElementById("signInErrorMessage");
            signInErrorMessageElement.textContent = errorMessage;
            signInErrorMessageElement.style.display = "block";
        }
        else {
            console.log(response.status);
        }
    }
    catch (error) {
        console.error(error);
    }
}
