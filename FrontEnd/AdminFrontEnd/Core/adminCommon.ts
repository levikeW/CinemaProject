// ===================== AUTH / SESSION =====================

function Admin_getAdminId(): number {
    const raw = localStorage.getItem("adminUserId");
    return raw ? Number(raw) : 0;
}

function Admin_setCurrentUserRole(role: string): void {
    localStorage.setItem("currentUserRole", role);
}

function Admin_getCurrentUserRole(): string {
    return localStorage.getItem("currentUserRole") || "";
}

function Admin_setCurrentUserId(userId: number): void {
    localStorage.setItem("currentUserId", String(userId));
}

function Admin_clearAuthData(): void {
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentUserRole");
    localStorage.removeItem("adminUserId");
}

function Admin_setAdminId(id: number): void {
    localStorage.setItem("adminUserId", String(id));
}

function Admin_showMessage(targetId: string, message: string, isError = false): void {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.textContent = message;
    target.className = isError ? "alert alert-danger d-block" : "alert alert-success d-block";
}

function Admin_isLoggedIn(): boolean {
    const userId = localStorage.getItem("currentUserId");
    const role = localStorage.getItem("currentUserRole");
    return !!userId && role === "Admin";
}

function Admin_updateNavbarByAuth(): void {
    const loginItem = document.getElementById("navLoginItem");
    const logoutItem = document.getElementById("navLogoutItem");

    const userId = localStorage.getItem("currentUserId");
    const role = localStorage.getItem("currentUserRole");
    const loggedIn = !!userId && role === "Admin";

    if (loggedIn) {
        loginItem?.classList.add("d-none");
        logoutItem?.classList.remove("d-none");
    } else {
        loginItem?.classList.remove("d-none");
        logoutItem?.classList.add("d-none");
    }
}

// ===================== LOGOUT =====================
async function Admin_handleLogout(): Promise<void> {
    Admin_clearAuthData();
    Admin_updateNavbarByAuth();

    try {
        await Admin_apiPost<null>("/api/user/logout", null);
    } catch {}

    window.location.href = "../Főoldalak/AdminBejelentkezes.html";
}

// ===================== DATE =====================

function Admin_toIsoDateTime(localValue: string): string {
    if (!localValue) return "";
    return new Date(localValue).toISOString();
}

// ===================== UTIL =====================

function Admin_toDateTimeLocalValue(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


// ===================== WINDOW EXPORT =====================

// @ts-ignore
window.Admin_updateNavbarByAuth = Admin_updateNavbarByAuth;

// @ts-ignore
window.Admin_handleLogout = Admin_handleLogout;