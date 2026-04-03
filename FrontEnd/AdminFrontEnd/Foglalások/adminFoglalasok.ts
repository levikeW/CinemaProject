// ===================== DTO =====================

interface SeatDto {
    seatId: number;
    rowNumber: number;
    seatNumber: number;
    roomId: number;
    isReserved: boolean;
}

interface PaymentReservationDto {
    paymentReservationId: number;
    cartId: number;
    date: string;
    isPaid: boolean;
    filmScreeningId: number;
    amount: number;
    price: number;
    userId: number;
    seats?: SeatDto[];
}

interface ModifyReservationDto {
    paymentReservationId: number;
    cartId: number;
    date: string;
    isPaid: boolean;
    filmScreeningId: number;
    amount: number;
    price: number;
    userId: number;
    seats: SeatDto[];
}

// ===================== RESERVATIONS =====================

async function Admin_getAllReservations(): Promise<PaymentReservationDto[]> {
    return await Admin_apiGet<PaymentReservationDto[]>("/api/admin/getallreservation");
}

async function Admin_updateReservation(dto: ModifyReservationDto): Promise<void> {
    await Admin_apiPut<ModifyReservationDto>(`/api/admin/modifyreservation`, dto);
}

async function Admin_deleteReservation(reservationId: number): Promise<void> {
    await Admin_apiDelete(`/api/admin/deletereservation?reservationId=${reservationId}`);
}

async function Admin_renderReservationsAdminTable(): Promise<void> {
    const tbody = document.getElementById("adminReservationsTbody") as HTMLTableSectionElement | null;
    if (!tbody) return;

    try {
        const reservations = await Admin_getAllReservations();
        tbody.innerHTML = "";

        for (const reservation of reservations) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${reservation.paymentReservationId}</td>
                <td>${reservation.userId}</td>
                <td>${reservation.filmScreeningId}</td>
                <td>${reservation.amount}</td>
                <td>${reservation.price ?? 0} Ft</td>
                <td>${reservation.isPaid ? "Igen" : "Nem"}</td>
                <td>${new Date(reservation.date).toLocaleString("hu-HU")}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-2" onclick="Admin_editReservation(${reservation.paymentReservationId}, ${reservation.cartId}, '${reservation.date}', ${reservation.isPaid}, ${reservation.filmScreeningId}, ${reservation.amount}, ${reservation.price ?? 0}, ${reservation.userId}, '${encodeURIComponent(JSON.stringify(reservation.seats ?? []))}')">
                        Módosítás
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="Admin_removeReservation(${reservation.paymentReservationId})">
                        Törlés
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        }
    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-danger text-center">Nem sikerült a foglalások betöltése.</td>
            </tr>
        `;
    }
}

function Admin_editReservation(
    paymentReservationId: number,
    cartId: number,
    date: string,
    isPaid: boolean,
    filmScreeningId: number,
    amount: number,
    price: number,
    userId: number,
    seatsEncoded: string
): void {
    (document.getElementById("editReservationId") as HTMLInputElement).value = String(paymentReservationId);
    (document.getElementById("editReservationCartId") as HTMLInputElement).value = String(cartId);
    (document.getElementById("editReservationDate") as HTMLInputElement).value = Admin_toDateTimeLocalValue(date);
    (document.getElementById("editReservationIsPaid") as HTMLSelectElement).value = isPaid ? "true" : "false";
    (document.getElementById("editReservationScreeningId") as HTMLInputElement).value = String(filmScreeningId);
    (document.getElementById("editReservationAmount") as HTMLInputElement).value = String(amount);
    (document.getElementById("editReservationPrice") as HTMLInputElement).value = String(price);
    (document.getElementById("editReservationUserId") as HTMLInputElement).value = String(userId);
    (document.getElementById("editReservationSeatsJson") as HTMLTextAreaElement).value = decodeURIComponent(seatsEncoded);
}

async function Admin_handleReservationUpdate(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const reservationId = Number((document.getElementById("editReservationId") as HTMLInputElement).value);
        const seatsJson = (document.getElementById("editReservationSeatsJson") as HTMLTextAreaElement).value.trim();

        let seats: SeatDto[] = [];
        if (seatsJson) {
            seats = JSON.parse(seatsJson) as SeatDto[];
        }

        const dto: ModifyReservationDto = {
            paymentReservationId: reservationId,
            cartId: Number((document.getElementById("editReservationCartId") as HTMLInputElement).value),
            date: Admin_toIsoDateTime((document.getElementById("editReservationDate") as HTMLInputElement).value),
            isPaid: (document.getElementById("editReservationIsPaid") as HTMLSelectElement).value === "true",
            filmScreeningId: Number((document.getElementById("editReservationScreeningId") as HTMLInputElement).value),
            amount: Number((document.getElementById("editReservationAmount") as HTMLInputElement).value),
            price: Number((document.getElementById("editReservationPrice") as HTMLInputElement).value),
            userId: Number((document.getElementById("editReservationUserId") as HTMLInputElement).value),
            seats
        };

        await Admin_updateReservation(dto);
        Admin_showMessage("adminReservationMessage", "Foglalás módosítva.");
        await Admin_renderReservationsAdminTable();
    } catch (error) {
        Admin_showMessage("adminReservationMessage", (error as Error).message, true);
    }
}

async function Admin_removeReservation(reservationId: number): Promise<void> {
    if (!confirm("Biztosan törlöd ezt a foglalást?")) return;

    try {
        await Admin_deleteReservation(reservationId);
        Admin_showMessage("adminReservationMessage", "Foglalás törölve.");
        await Admin_renderReservationsAdminTable();
    } catch (error) {
        Admin_showMessage("adminReservationMessage", (error as Error).message, true);
    }
}

// ===================== WINDOW EXPORT =====================

// @ts-ignore
window.Admin_handleReservationUpdate = Admin_handleReservationUpdate;
// @ts-ignore
window.Admin_removeReservation = Admin_removeReservation;
// @ts-ignore
window.Admin_editReservation = Admin_editReservation;

// ===================== INIT =====================

document.addEventListener("DOMContentLoaded", async () => {
    try {
        Admin_updateNavbarByAuth();
        await Admin_renderReservationsAdminTable();
    } catch (error) {
        console.error("Admin tickets init hiba:", error);
    }
});