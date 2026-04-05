import { fetchAuthenticatedUserData, loginUser, logoutUser, registerUser } from "../Core/api.js";
import { cartButtonId, parseNumericId } from "../Core/common.js";

// LocalStorage kulcsok
const currentUserStorageKey = "cinemaCurrentUserEmail";
const currentUserIdStorageKey = "cinemaCurrentUserId";

// A jelenlegi user email lekérése localStorage-ból
export function getCurrentUserEmail(): string {
    return localStorage.getItem(currentUserStorageKey) || "";
}

// A jelenlegi user email mentése localStorage-ba
// Ha üres, akkor törli
export function setCurrentUserEmail(email: string): void {
    if (email) {
        localStorage.setItem(currentUserStorageKey, email);
        return;
    }

    localStorage.removeItem(currentUserStorageKey);
}

// A jelenlegi user id lekérése localStorage-ból
export function getCurrentUserId(): number | null {
    return parseNumericId(localStorage.getItem(currentUserIdStorageKey));
}

// A jelenlegi user id mentése localStorage-ba
// Ha nincs értelmes id, akkor törli
export function setCurrentUserId(userId: number | null): void {
    if (userId && userId > 0) {
        localStorage.setItem(currentUserIdStorageKey, String(userId));
        return;
    }

    localStorage.removeItem(currentUserIdStorageKey);
}

// Ha a userId még nincs localStorage-ban, megpróbálja betölteni a szerverről
export async function ensureCurrentUserIdLoaded(): Promise<number | null> {
    const storedUserId = getCurrentUserId();

    if (storedUserId) {
        return storedUserId;
    }

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

// Lebegő kosár gomb kirakása, ha még nincs az oldalon
export function updateFloatingCartButton(): void {
    const existingButton = document.getElementById(cartButtonId);

    if (existingButton) {
        return;
    }

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

// Beállítja a login állapothoz tartozó UI-t
export function applyLoginState(): void {
    const email = getCurrentUserEmail().trim();
    const currentPage = window.location.pathname.split("/").pop() || "Cinema.html";

    const navProfileArea = document.getElementById("navProfileArea");
    const authLink = navProfileArea?.querySelector('a[href*="Bejelentkezes.html"]') as HTMLAnchorElement | null;

    // Ha van fejlécben login/profil link, átírjuk az állapot alapján
    if (authLink) {
        authLink.href = email ? "../Fooldalak/Profile.html" : "../Fooldalak/Bejelentkezes.html";
        authLink.textContent = email ? "Profil" : "Bejelentkezés/Regisztráció";
    }

    // Ha már be van lépve és a login oldalra menne, dobjuk át profilra
    if (email && currentPage === "Bejelentkezes.html") {
        window.location.replace("../Fooldalak/Profile.html");
        return;
    }

    // Ha nincs belépve és a profiloldalt nyitná meg, dobjuk át loginra
    if (!email && currentPage === "Profile.html") {
        window.location.replace("../Fooldalak/Bejelentkezes.html");
        return;
    }

    updateFloatingCartButton();
}

// Login form elküldése
export async function handleLoginSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const emailInput = document.getElementById("loginEmail") as HTMLInputElement | null;
    const passwordInput = document.getElementById("loginPassword") as HTMLInputElement | null;
    const loginMessage = document.getElementById("loginMessage") as HTMLElement | null;

    if (!emailInput || !passwordInput) {
        return;
    }

    // Üzenet törlése induláskor
    if (loginMessage) {
        loginMessage.className = "mb-3";
        loginMessage.textContent = "";
    }

    try {
        const response = await loginUser(emailInput.value, passwordInput.value);

        // Sikertelen login
        if (!response.ok) {
            const text = await response.text().catch(() => "");

            if (loginMessage) {
                loginMessage.className = "text-danger mb-3";
                loginMessage.textContent = text || "Hibás email vagy jelszó.";
            }

            return;
        }

        // Sikeres login
        if (loginMessage) {
            loginMessage.className = "text-success mb-3";
            loginMessage.textContent = "Sikeres bejelentkezés!";
        }

        // Lekérjük a belépett user adatait, és eltároljuk
        const authUser = await fetchAuthenticatedUserData();
        const userId = parseNumericId(authUser?.userId ?? authUser?.UserId);

        if (userId) {
            setCurrentUserId(userId);
        }

        setCurrentUserEmail(emailInput.value.trim());

        window.location.replace("../Fooldalak/Profile.html");
    } catch {
        if (loginMessage) {
            loginMessage.className = "text-danger mb-3";
            loginMessage.textContent = "Hiba a bejelentkezés során.";
        }
    }
}

// Regisztrációs form elküldése
export async function handleRegisterSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const emailInput = document.getElementById("registerEmail") as HTMLInputElement | null;
    const fullNameInput = document.getElementById("registerFullName") as HTMLInputElement | null;
    const addressInput = document.getElementById("registerAddress") as HTMLInputElement | null;
    const passwordInput = document.getElementById("registerPassword") as HTMLInputElement | null;
    const passwordConfirmInput = document.getElementById("registerPasswordConfirm") as HTMLInputElement | null;
    const registerMessage = document.getElementById("registerMessage") as HTMLElement | null;

    if (!emailInput || !fullNameInput || !addressInput || !passwordInput || !passwordConfirmInput) {
        return;
    }

    // Üzenet törlése induláskor
    if (registerMessage) {
        registerMessage.className = "mb-3";
        registerMessage.textContent = "";
    }

    // Jelszó egyezés ellenőrzése
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

        // Sikertelen regisztráció
        if (!response.ok) {
            const text = await response.text().catch(() => "");

            if (registerMessage) {
                registerMessage.className = "text-danger mb-3";
                registerMessage.textContent =
                    response.status === 409 || /letezik|exists/i.test(text)
                        ? "Ez a felhasználó már létezik."
                        : (text || "Sikertelen regisztráció.");
            }

            return;
        }

        // Sikeres regisztráció
        if (registerMessage) {
            registerMessage.className = "text-success mb-3";
            registerMessage.textContent = "Sikeres regisztráció!";
        }

        // Form ürítése
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

// Kijelentkezés
export async function handleLogout(): Promise<void> {
    // Először helyben töröljük a user adatokat
    setCurrentUserEmail("");
    setCurrentUserId(null);

    try {
        await logoutUser();
    } catch {
        // Ha a szerver oldali logout elhasal, attól még megyünk tovább
    }

    window.location.href = "../Fooldalak/Bejelentkezes.html";
}

// Hogy a HTML onclick vagy egyéb globális hívás is elérje ezeket
Object.assign(window, {
    handleLoginSubmit,
    handleRegisterSubmit,
    handleLogout,
});

// Oldalbetöltéskor beállítjuk a login állapotot
document.addEventListener("DOMContentLoaded", () => {
    applyLoginState();
});