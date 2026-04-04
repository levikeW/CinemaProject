import { fetchAuthenticatedUserData, loginUser, logoutUser, registerUser } from "../Core/api.js";
import { cartButtonId, parseNumericId } from "../Core/common.js";

const currentUserStorageKey = "cinemaCurrentUserEmail";
const currentUserIdStorageKey = "cinemaCurrentUserId";

export function getCurrentUserEmail(): string {
    return localStorage.getItem(currentUserStorageKey) || "";
}

export function setCurrentUserEmail(email: string): void {
    if (email) {
        localStorage.setItem(currentUserStorageKey, email);
        return;
    }

    localStorage.removeItem(currentUserStorageKey);
}

export function getCurrentUserId(): number | null {
    return parseNumericId(localStorage.getItem(currentUserIdStorageKey));
}

export function setCurrentUserId(userId: number | null): void {
    if (userId && userId > 0) {
        localStorage.setItem(currentUserIdStorageKey, String(userId));
        return;
    }

    localStorage.removeItem(currentUserIdStorageKey);
}

export async function ensureCurrentUserIdLoaded(): Promise<number | null> {
    const storedUserId = getCurrentUserId();
    if (storedUserId) return storedUserId;

    const user = await fetchAuthenticatedUserData();
    const userId = parseNumericId(user?.userId ?? user?.UserId);
    if (userId) {
        setCurrentUserId(userId);
    }

    const email = (user?.email ?? user?.Email ?? "").trim();
    if (email) {
        setCurrentUserEmail(email);
    }

    return userId;
}

export function updateFloatingCartButton(): void {
    const existingButton = document.getElementById(cartButtonId);
    if (existingButton) return;

    const cartButton = document.createElement("button");
    cartButton.id = cartButtonId;
    cartButton.className = "floating-cart-button";
    cartButton.type = "button";
    cartButton.setAttribute("aria-label", "Kosár megnyitása");
    cartButton.textContent = "🛒";
    cartButton.addEventListener("click", () => {
        window.location.href = "../Kosar/Kosar.html";
    });

    document.body.appendChild(cartButton);
}

export function applyLoginState(): void {
    const email = getCurrentUserEmail().trim();
    const currentPage = window.location.pathname.split("/").pop() || "Cinema.html";
    const navProfileArea = document.getElementById("navProfileArea");
    const authLink = navProfileArea?.querySelector('a[href*="Bejelentkezes.html"]') as HTMLAnchorElement | null;

    if (authLink) {
        authLink.href = email ? "../Fooldalak/Profile.html" : "../Fooldalak/Bejelentkezes.html";
        authLink.textContent = email ? "Profil" : "Bejelentkezés/Regisztráció";
    }

    if (email && currentPage === "Bejelentkezes.html") {
        window.location.replace("../Fooldalak/Profile.html");
        return;
    }

    if (!email && currentPage === "Profile.html") {
        window.location.replace("../Fooldalak/Bejelentkezes.html");
        return;
    }

    updateFloatingCartButton();
}

export async function handleLoginSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const emailInput = document.getElementById("loginEmail") as HTMLInputElement | null;
    const passwordInput = document.getElementById("loginPassword") as HTMLInputElement | null;
    const loginMessage = document.getElementById("loginMessage") as HTMLElement | null;
    if (!emailInput || !passwordInput) return;

    if (loginMessage) {
        loginMessage.className = "mb-3";
        loginMessage.textContent = "";
    }

    try {
        const response = await loginUser(emailInput.value, passwordInput.value);

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            if (loginMessage) {
                loginMessage.className = "text-danger mb-3";
                loginMessage.textContent = text || "Hibás email vagy jelszó.";
            }
            return;
        }

        if (loginMessage) {
            loginMessage.className = "text-success mb-3";
            loginMessage.textContent = "Sikeres bejelentkezés!";
        }

        const authUser = await fetchAuthenticatedUserData();
        const userId = parseNumericId(authUser?.userId ?? authUser?.UserId);
        if (userId) setCurrentUserId(userId);

        setCurrentUserEmail(emailInput.value.trim());
        window.location.replace("../Fooldalak/Profile.html");
    } catch {
        if (loginMessage) {
            loginMessage.className = "text-danger mb-3";
            loginMessage.textContent = "Hiba a bejelentkezés során.";
        }
    }
}

export async function handleRegisterSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const emailInput = document.getElementById("registerEmail") as HTMLInputElement | null;
    const fullNameInput = document.getElementById("registerFullName") as HTMLInputElement | null;
    const addressInput = document.getElementById("registerAddress") as HTMLInputElement | null;
    const passwordInput = document.getElementById("registerPassword") as HTMLInputElement | null;
    const passwordConfirmInput = document.getElementById("registerPasswordConfirm") as HTMLInputElement | null;
    const registerMessage = document.getElementById("registerMessage") as HTMLElement | null;

    if (!emailInput || !fullNameInput || !addressInput || !passwordInput || !passwordConfirmInput) return;

    if (registerMessage) {
        registerMessage.className = "mb-3";
        registerMessage.textContent = "";
    }

    if (passwordInput.value !== passwordConfirmInput.value) {
        if (registerMessage) {
            registerMessage.className = "text-danger mb-3";
            registerMessage.textContent = "A két jelszó nem egyezik.";
        }
        return;
    }

    try {
        const response = await registerUser(
            emailInput.value,
            fullNameInput.value,
            passwordInput.value,
            addressInput.value,
        );

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            if (registerMessage) {
                registerMessage.className = "text-danger mb-3";
                registerMessage.textContent = response.status === 409 || /letezik|exists/i.test(text)
                    ? "Ez a felhasználó már létezik."
                    : (text || "Sikertelen regisztráció.");
            }
            return;
        }

        if (registerMessage) {
            registerMessage.className = "text-success mb-3";
            registerMessage.textContent = "Sikeres regisztráció!";
        }

        emailInput.value = "";
        fullNameInput.value = "";
        addressInput.value = "";
        passwordInput.value = "";
        passwordConfirmInput.value = "";
    } catch {
        if (registerMessage) {
            registerMessage.className = "text-danger mb-3";
            registerMessage.textContent = "Hiba történt a regisztráció során.";
        }
    }
}

export async function handleLogout(): Promise<void> {
    setCurrentUserEmail("");
    setCurrentUserId(null);

    try {
        await logoutUser();
    } catch {
    }

    window.location.href = "../Fooldalak/Bejelentkezes.html";
}

Object.assign(window, {
    handleLoginSubmit,
    handleRegisterSubmit,
    handleLogout,
});

document.addEventListener("DOMContentLoaded", () => {
    applyLoginState();
});
