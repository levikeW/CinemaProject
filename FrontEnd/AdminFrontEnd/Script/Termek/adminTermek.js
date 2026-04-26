// ===================== DTO =====================
// ===================== ROOMS =====================
async function Admin_getAllRooms() {
    return await Admin_apiGet("/api/cinema/getallrooms");
}
async function Admin_createRoom(dto) {
    await Admin_apiPost("/api/admin/newroom", dto);
}
async function Admin_updateRoom(roomId, dto) {
    await Admin_apiPut(`/api/admin/modifyroom?roomId=${roomId}`, dto);
}
async function Admin_deleteRoom(roomId) {
    await Admin_apiDelete(`/api/admin/deleteroom?roomId=${roomId}`);
}
async function Admin_renderRoomsAdminTable() {
    const tbody = document.getElementById("adminRoomsTbody");
    if (!tbody)
        return;
    try {
        const rooms = await Admin_getAllRooms();
        tbody.innerHTML = "";
        for (const room of rooms) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${room.roomId}</td>
                <td>${room.roomName}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-2" onclick="Admin_editRoom(${room.roomId}, '${window.Admin_escapeJs(room.roomName)}')">
                        Módosítás
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="Admin_removeRoom(${room.roomId})">
                        Törlés
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        }
    }
    catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-danger text-center">Nem sikerült a termek betöltése.</td>
            </tr>
        `;
    }
}
async function Admin_handleRoomCreate(event) {
    event.preventDefault();
    try {
        const dto = {
            roomName: document.getElementById("roomName").value.trim()
        };
        await Admin_createRoom(dto);
        Admin_showMessage("adminRoomMessage", "Terem létrehozva.");
        document.getElementById("roomForm")?.reset();
        await Admin_renderRoomsAdminTable();
        await Admin_renderScreeningsRoomSelect();
    }
    catch (error) {
        Admin_showMessage("adminRoomMessage", error.message, true);
    }
}
function Admin_editRoom(roomId, roomName) {
    document.getElementById("editRoomId").value = String(roomId);
    document.getElementById("editRoomName").value = roomName;
}
async function Admin_handleRoomUpdate(event) {
    event.preventDefault();
    try {
        const roomId = Number(document.getElementById("editRoomId").value);
        const dto = {
            roomName: document.getElementById("editRoomName").value.trim()
        };
        await Admin_updateRoom(roomId, dto);
        Admin_showMessage("adminRoomEditMessage", "Terem módosítva.");
        await Admin_renderRoomsAdminTable();
        await Admin_renderScreeningsRoomSelect();
    }
    catch (error) {
        Admin_showMessage("adminRoomEditMessage", error.message, true);
    }
}
async function Admin_removeRoom(roomId) {
    if (!confirm("Biztosan törlöd ezt a termet?"))
        return;
    try {
        await Admin_deleteRoom(roomId);
        Admin_showMessage("adminRoomMessage", "Terem törölve.");
        await Admin_renderRoomsAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminRoomMessage", error.message, true);
    }
}
// ===================== WINDOW EXPORT =====================
// @ts-ignore
window.Admin_handleRoomCreate = Admin_handleRoomCreate;
// @ts-ignore
window.Admin_handleRoomUpdate = Admin_handleRoomUpdate;
// @ts-ignore
window.Admin_removeRoom = Admin_removeRoom;
// @ts-ignore
window.Admin_editRoom = Admin_editRoom;
// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", async () => {
    try {
        Admin_updateNavbarByAuth();
        await Admin_renderRoomsAdminTable();
    }
    catch (error) {
        console.error("Admin tickets init hiba:", error);
    }
});
