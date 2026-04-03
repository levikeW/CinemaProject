// ===================== AUTH / SESSION =====================
function Admin_getAdminId() {
    const raw = localStorage.getItem("adminUserId");
    return raw ? Number(raw) : 0;
}
function Admin_setCurrentUserRole(role) {
    localStorage.setItem("currentUserRole", role);
}
function Admin_getCurrentUserRole() {
    return localStorage.getItem("currentUserRole") || "";
}
function Admin_setCurrentUserId(userId) {
    localStorage.setItem("currentUserId", String(userId));
}
function Admin_clearAuthData() {
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentUserRole");
    localStorage.removeItem("adminUserId");
}
function Admin_setAdminId(id) {
    localStorage.setItem("adminUserId", String(id));
}
function Admin_showMessage(targetId, message, isError = false) {
    const target = document.getElementById(targetId);
    if (!target)
        return;
    target.textContent = message;
    target.className = isError ? "alert alert-danger d-block" : "alert alert-success d-block";
}
function Admin_isLoggedIn() {
    const userId = localStorage.getItem("currentUserId");
    const role = localStorage.getItem("currentUserRole");
    return !!userId && role === "Admin";
}
function Admin_updateNavbarByAuth() {
    const loginItem = document.getElementById("navLoginItem");
    const logoutItem = document.getElementById("navLogoutItem");
    const userId = localStorage.getItem("currentUserId");
    const role = localStorage.getItem("currentUserRole");
    const loggedIn = !!userId && role === "Admin";
    if (loggedIn) {
        loginItem?.classList.add("d-none");
        logoutItem?.classList.remove("d-none");
    }
    else {
        loginItem?.classList.remove("d-none");
        logoutItem?.classList.add("d-none");
    }
}
// ===================== LOGOUT =====================
async function Admin_handleLogout() {
    Admin_clearAuthData();
    Admin_updateNavbarByAuth();
    try {
        await Admin_apiPost("/api/user/logout", null);
    }
    catch { }
    window.location.href = "../Főoldalak/AdminBejelentkezes.html";
}
// ===================== DATE =====================
function Admin_toIsoDateTime(localValue) {
    if (!localValue)
        return "";
    return new Date(localValue).toISOString();
}
// ===================== UTIL =====================
function Admin_toDateTimeLocalValue(date) {
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
