const apiBaseUrl = "http://10.0.1.208:5555/api"
const accessTokenKey = "accessToken";
const refreshTokenKey = "refreshToken";

const statusesMap = {
    "Solved": { color: "green", ru: "Выполнено", icon: "✅" },
    "InProgress": { color: "orange", ru: "В процессе выполнения", icon: "⏳" },
    "Pending": { color: "red", ru: "В процессе рассмотрения", icon: "🕒" },
};

document.addEventListener("DOMContentLoaded", async () => {
    await refreshTokensIfRequired();
    appendFooterText();
    document.getElementById("logout-button").addEventListener("click", onLogoutButtonClicked);
});

function formatDateTime(dateTime) {
    if (!dateTime) {
        return "";
    }

    return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(new Date(dateTime));
}

function onPageSizeChanged(location, getExtraParamsString = () => "") {
    const selectedPageSize = document.getElementById("page-sizes-select").value;
    let url = `${location}?pageIndex=1&pageSize=${selectedPageSize}`;

    if (getExtraParamsString) {
        url += getExtraParamsString();
    }

    window.location = url;
    console.log(`${onPageSizeChanged.name} func\n Url: ${url}\nDelegate result: ${getExtraParamsString()}\n${getExtraParamsString()}`);
}

function updatePageSizesSelect(urlParams) {
    let pageSize = urlParams.get("pageSize");
    const pageIndex = urlParams.get("pageIndex") || 1;

    const pageSizesSelect = document.getElementById("page-sizes-select");
    const pageSizeExists = Array.from(pageSizesSelect.options).some(option => option.value === pageSize);

    pageSizesSelect.value = pageSizeExists ? pageSize : pageSizesSelect.options[0].value;
    pageSize = pageSizeExists ? pageSize : pageSizesSelect.options[0].value;

    return { pageIndex, pageSize };
}

function appendFooterText() {
    const pTag = document.querySelector("footer").querySelector("p");
    pTag.textContent = `© 2024 - ${new Date().getFullYear()} Азовский Государственный Педагогический Университет. Все права защищены.`;
}

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
            console.log(await response.text());
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
        const response = await fetch(`${apiBaseUrl}/users/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getAccessToken()}`
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

function updatePager(pageIndex, totalPages, hasNextPage, hasPreviousPage, location, getExtraParamsString = () => "") {
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

            let url = `${location}?pageIndex=${i}&pageSize=${selectedPageSize}`;

            if (getExtraParamsString) {
                url += getExtraParamsString();
            }

            window.location = url;
        });

        pageNumbersContainer.appendChild(pageButton);
    }

    const previousButton = document.getElementById("previous-page");
    const nextButton = document.getElementById("next-page");

    previousButton.disabled = !hasPreviousPage;
    nextButton.disabled = !hasNextPage;

    previousButton.onclick = () => {
        const selectedPageSize = document.getElementById("page-sizes-select").value;
        let url = `${location}?pageIndex=${pageIndex - 1}&pageSize=${selectedPageSize}`;

        if (getExtraParamsString) {
            url += getExtraParamsString();
        }

        window.location = url;
    };

    nextButton.onclick = () => {
        const selectedPageSize = document.getElementById("page-sizes-select").value;
        let url = `${location}?pageIndex=${pageIndex + 1}&pageSize=${selectedPageSize}`;

        if (getExtraParamsString) {
            url += getExtraParamsString();
        }

        window.location = url;
    };
}

function onOpenModalWindowButtonClicked(modalWindowId) {
    document.getElementById(modalWindowId).style.display = "flex";
}

function onCloseModalWindowButtonClicked(modalWindowId) {
    document.getElementById(modalWindowId).style.display = "none";
}