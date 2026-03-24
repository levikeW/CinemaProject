// ===================== DTO =====================

interface TicketTypeDto {
    ticketTypeId: number;
    ticketType: string;
    ticketPrice: number;
}

interface NewTicketTypeDto {
    ticketTypeId : number;
    ticketType: string;
    ticketPrice: number;
}

interface ModifyTicketTypeDto {
    ticketTypeId: number;
    ticketType: string;
    ticketPrice: number;
}

// ===================== TICKETS =====================

async function Admin_getAllTicketTypes(): Promise<TicketTypeDto[]> {
    return await Admin_apiGet<TicketTypeDto[]>("/api/cinema/getalltickettype");
}

async function Admin_createTicketType(dto: NewTicketTypeDto): Promise<void> {
    await Admin_apiPost<NewTicketTypeDto>("/api/admin/newtickettype", dto);
}

async function Admin_updateTicketType(ticketTId: number, dto: ModifyTicketTypeDto): Promise<void> {
    await Admin_apiPut<ModifyTicketTypeDto>(`/api/admin/modifytickettype?ticketTId=${ticketTId}`, dto);
}

async function Admin_deleteTicketType(ticketTId: number): Promise<void> {
    await Admin_apiDelete(`/api/admin/deletetickettype?ticketTId=${ticketTId}`);
}

async function Admin_renderTicketsAdminTable(): Promise<void> {
    const tbody = document.getElementById("adminTicketsTbody") as HTMLTableSectionElement | null;
    if (!tbody) return;

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
    } catch (error) {
        console.error("Jegytípusok betöltési hiba:", error);
        tbody.innerHTML = 
            `<tr>
                <td colspan="4" class="text-danger text-center">Nem sikerült a jegytípusok betöltése.</td>
            </tr>`;
    }
}

async function Admin_handleTicketCreate(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const dto: NewTicketTypeDto = {
            ticketTypeId: 0,
            ticketType: (document.getElementById("ticketType") as HTMLInputElement).value,
            ticketPrice: Number((document.getElementById("ticketPrice") as HTMLInputElement).value)
        };

        await Admin_createTicketType(dto);
        Admin_showMessage("adminTicketMessage", "Jegytípus létrehozva.");
        (document.getElementById("ticketForm") as HTMLFormElement | null)?.reset();
        await Admin_renderTicketsAdminTable();
    } catch (error) {
        Admin_showMessage("adminTicketMessage", (error as Error).message, true);
    }
}

function Admin_editTicket(id: number, ticketType: string, ticketPrice: number): void {
    (document.getElementById("editTicketId") as HTMLInputElement).value = String(id);
    (document.getElementById("editTicketType") as HTMLInputElement).value = ticketType;
    (document.getElementById("editTicketPrice") as HTMLInputElement).value = String(ticketPrice);
}

async function Admin_handleTicketUpdate(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const ticketId = Number((document.getElementById("editTicketId") as HTMLInputElement).value);

        const dto: ModifyTicketTypeDto = {
            ticketTypeId: ticketId,
            ticketType: (document.getElementById("editTicketType") as HTMLInputElement).value.trim(),
            ticketPrice: Number((document.getElementById("editTicketPrice") as HTMLInputElement).value)
        };

        await Admin_updateTicketType(ticketId, dto);
        Admin_showMessage("adminTicketEditMessage", "Jegytípus módosítva.");
        await Admin_renderTicketsAdminTable();
    } catch (error) {
        Admin_showMessage("adminTicketEditMessage", (error as Error).message, true);
    }
}

async function Admin_removeTicket(ticketId: number): Promise<void> {
    if (!confirm("Biztosan törlöd ezt a jegytípust?")) return;

    try {
        await Admin_deleteTicketType(ticketId);
        Admin_showMessage("adminTicketMessage", "Jegytípus törölve.");
        await Admin_renderTicketsAdminTable();
    } catch (error) {
        Admin_showMessage("adminTicketMessage", (error as Error).message, true);
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
        await Admin_renderTicketsAdminTable();
    } catch (error) {
        console.error("Admin tickets init hiba:", error);
    }
});