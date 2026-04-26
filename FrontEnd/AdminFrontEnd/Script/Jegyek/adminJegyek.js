// ===================== DTO =====================
// ===================== TICKETS =====================
async function Admin_getAllTicketTypes() {
    return await Admin_apiGet("/api/cinema/getalltickettype");
}
async function Admin_createTicketType(dto) {
    await Admin_apiPost("/api/admin/newtickettype", dto);
}
async function Admin_updateTicketType(ticketTId, dto) {
    await Admin_apiPut(`/api/admin/modifytickettype?ticketTId=${ticketTId}`, dto);
}
async function Admin_deleteTicketType(ticketTId) {
    await Admin_apiDelete(`/api/admin/deletetickettype?ticketTId=${ticketTId}`);
}
async function Admin_renderTicketsAdminTable() {
    const tbody = document.getElementById("adminTicketsTbody");
    if (!tbody)
        return;
    try {
        const tickets = await Admin_getAllTicketTypes();
        tbody.innerHTML = "";
        for (const ticket of tickets) {
            const row = document.createElement("tr");
            row.innerHTML =
                `<td>${ticket.ticketTypeId}</td>
                <td>${ticket.ticketType}</td>
                <td>${ticket.ticketPrice} Ft</td>
                <td>
                    <button class="btn btn-warning btn-sm me-2" onclick="Admin_editTicket(${ticket.ticketTypeId}, '${Admin_escapeJs(ticket.ticketType)}', ${ticket.ticketPrice})">
                        Módosítás
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="Admin_removeTicket(${ticket.ticketTypeId})">
                        Törlés
                    </button>
                </td>`;
            tbody.appendChild(row);
        }
    }
    catch (error) {
        console.error("Jegytípusok betöltési hiba:", error);
        tbody.innerHTML =
            `<tr>
                <td colspan="4" class="text-danger text-center">Nem sikerült a jegytípusok betöltése.</td>
            </tr>`;
    }
}
async function Admin_handleTicketCreate(event) {
    event.preventDefault();
    try {
        const dto = {
            ticketTypeId: 0,
            ticketType: document.getElementById("ticketType").value,
            ticketPrice: Number(document.getElementById("ticketPrice").value)
        };
        await Admin_createTicketType(dto);
        Admin_showMessage("adminTicketMessage", "Jegytípus létrehozva.");
        document.getElementById("ticketForm")?.reset();
        await Admin_renderTicketsAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminTicketMessage", error.message, true);
    }
}
function Admin_editTicket(id, ticketType, ticketPrice) {
    document.getElementById("editTicketId").value = String(id);
    document.getElementById("editTicketType").value = ticketType;
    document.getElementById("editTicketPrice").value = String(ticketPrice);
}
async function Admin_handleTicketUpdate(event) {
    event.preventDefault();
    try {
        const ticketId = Number(document.getElementById("editTicketId").value);
        const dto = {
            ticketTypeId: ticketId,
            ticketType: document.getElementById("editTicketType").value.trim(),
            ticketPrice: Number(document.getElementById("editTicketPrice").value)
        };
        await Admin_updateTicketType(ticketId, dto);
        Admin_showMessage("adminTicketEditMessage", "Jegytípus módosítva.");
        await Admin_renderTicketsAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminTicketEditMessage", error.message, true);
    }
}
async function Admin_removeTicket(ticketId) {
    if (!confirm("Biztosan törlöd ezt a jegytípust?"))
        return;
    try {
        await Admin_deleteTicketType(ticketId);
        Admin_showMessage("adminTicketMessage", "Jegytípus törölve.");
        await Admin_renderTicketsAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminTicketMessage", error.message, true);
    }
}
// ===================== WINDOW EXPORT =====================
// @ts-ignore
window.Admin_handleTicketCreate = Admin_handleTicketCreate;
// @ts-ignore
window.Admin_handleTicketUpdate = Admin_handleTicketUpdate;
// @ts-ignore
window.Admin_removeTicket = Admin_removeTicket;
// @ts-ignore
window.Admin_editTicket = Admin_editTicket;
// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", async () => {
    try {
        Admin_updateNavbarByAuth();
        await Admin_renderTicketsAdminTable();
    }
    catch (error) {
        console.error("Admin tickets init hiba:", error);
    }
});
