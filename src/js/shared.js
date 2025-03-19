const apiBaseUrl = "http://10.0.1.208:5555/api"
const accessTokenKey = "accessToken";
const refreshTokenKey = "refreshToken";

async function refreshTokensIfRequired() {
    const accessToken = getAccessToken();
    if (accessToken) {
        const decodedToken = decodeJwtTokenPayload(accessToken);
        if (!isTokenAboutToExpire(decodedToken.exp)) {
            return;
        }
    }

    const refreshToken = getRefreshToken();
    try {

        const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refreshToken })
        });

        if (response.ok) {
            const responseData = await response.json();

            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");

            // TODO: Choose another option to store tokens.

            localStorage.setItem(refreshTokenKey, responseData.refreshToken);
            localStorage.setItem(accessTokenKey, responseData.accessToken);

            console.log("Tokens updated.");
        }
        else {
            console.log(response.status);
        }
    }
    catch (error) {
        console.error(error);
    }
}

function isTokenAboutToExpire(tokenExpirationDatetime) {

    const currentUnixEpoch = Math.floor(Date.now() / 1000);
    const timeDifference = tokenExpirationDatetime - currentUnixEpoch;

    return timeDifference <= 120; // 2 минуты
}

function getAccessToken(){
    return localStorage.getItem(accessTokenKey);
}

function getRefreshToken(){
    return localStorage.getItem(refreshTokenKey);
}

function decodeJwtTokenPayload(token){
    if (typeof token !== "string") {
        return null;
    }

    try {
        return JSON.parse(base64_url_decode(token.split(".")[1]));
    } catch (e) {
        console.error(e);
        return null;
    }
}

function b64DecodeUnicode(str) {
    return decodeURIComponent(
        atob(str).replace(/(.)/g, function(m, p) {
            let code = p.charCodeAt(0).toString(16).toUpperCase();
            if (code.length < 2) {
                code = "0" + code;
            }
            return "%" + code;
        })
    );
}

function base64_url_decode(str) {
    let output = str.replace(/-/g, "+").replace(/_/g, "/");
    switch (output.length % 4) {
        case 0:
            break;
        case 2:
            output += "==";
            break;
        case 3:
            output += "=";
            break;
        default:
            throw "Illegal base64url string!";
    }

    try {
        return b64DecodeUnicode(output);
    } catch (err) {
        return atob(output);
    }
}

function onLogoutButtonClicked() {
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
    window.location = "index.html";
}

async function isAuthenticated(callbackUrl = null){
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
            document.getElementById("navigationPanel").style.visibility = "visible";
            showEmail(currentUser.email);
        } else {
            window.location = `sign-in.html?callbackUrl=${callbackUrl}`;
        }
    }
    catch (error) {
        console.error(error);
    }
}

function showEmail(email) {
    const emailElement = document.getElementById("email");
    emailElement.textContent = email;

    document.getElementById("user-info").style.display = "flex";
}
