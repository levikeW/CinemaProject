// ===================== DTO =====================

interface UserDto {
    userId: number;
    email: string;
    fullName: string;
    billingAddress: string;
    role?: string;
}

// ===================== USERS =====================

async function Admin_getAllUsers(): Promise<UserDto[]> {
    return await Admin_apiGet<UserDto[]>("/api/admin/getalluser");
}

async function Admin_deleteUser(userId: number): Promise<void> {
    await Admin_apiDelete(`/api/admin/deleteuser?userId=${userId}`);
}

async function Admin_changeRole(userId: number, newRole: string, actAdminId: number): Promise<void> {
    await Admin_apiPut<null>(`/api/admin/changerole?userId=${userId}&newRole=${encodeURIComponent(newRole)}&actAdminId=${actAdminId}`, null);
}

async function Admin_renderUsersAdminTable(): Promise<void> {
    const tbody = document.getElementById("adminUsersTbody") as HTMLTableSectionElement | null;
    if (!tbody) return;

    try {
        const users = await Admin_getAllUsers();
        tbody.innerHTML = "";

        for (const user of users) {
            const role = user.role ?? "User";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.userId}</td>
                <td>${user.email}</td>
                <td>${user.fullName}</td>
                <td>${user.billingAddress ?? ""}</td>
                <td>${role}</td>
                <td>
                    <button class="btn btn-secondary btn-sm me-2" onclick="Admin_toggleUserRole(${user.userId}, '${role}')">
                        Szerepkör váltás
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="Admin_removeUser(${user.userId}, '${role}')">
                        Törlés
                    </button>
                </td>`;
            tbody.appendChild(row);
        }
    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-danger text-center">Nem sikerült a felhasználók betöltése.</td>
            </tr>`;
    }
}

async function Admin_toggleUserRole(userId: number, currentRole: string): Promise<void> {
    const adminId = Admin_getAdminId();

    if (!adminId) {
        Admin_showMessage("adminUserMessage", "Nincs eltárolt admin azonosító.", true);
        return;
    }

    if (currentRole === "Admin") {
        Admin_showMessage("adminUserMessage", "Admin szerepkör nem módosítható.", true);
        return;
    }

    const newRole = "Admin";

    try {
        await Admin_changeRole(userId, newRole, adminId);
        Admin_showMessage("adminUserMessage", `Szerepkör módosítva: ${newRole}`);
        await Admin_renderUsersAdminTable();
    } catch (error) {
        Admin_showMessage("adminUserMessage", (error as Error).message, true);
    }
}

async function Admin_removeUser(userId: number, currentRole: string): Promise<void> {
    if (currentRole === "Admin") {
        Admin_showMessage("adminUserMessage", "Admin felhasználó nem törölhető.", true);
        return;
    }

    if (!confirm("Biztosan törlöd ezt a felhasználót?")) return;

    try {
        await Admin_deleteUser(userId);
        Admin_showMessage("adminUserMessage", "Felhasználó törölve.");
        await Admin_renderUsersAdminTable();
    } catch (error) {
        Admin_showMessage("adminUserMessage", (error as Error).message, true);
    }
}

// ===================== WINDOW EXPORT =====================

// @ts-ignore
window.Admin_toggleUserRole = Admin_toggleUserRole;
// @ts-ignore
window.Admin_removeUser = Admin_removeUser;

// ===================== INIT =====================

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await Admin_renderUsersAdminTable();
    } catch (error) {
        console.error("Admin tickets init hiba:", error);
    }
});