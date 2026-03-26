// ===================== DTO =====================
// ===================== RESERVATIONS =====================
async function Admin_getAllReservations() {
    return await Admin_apiGet("/api/admin/getallreservation");
}
async function Admin_updateReservation(dto) {
    await Admin_apiPut(`/api/admin/modifyreservation`, dto);
}
async function Admin_deleteReservation(reservationId) {
    await Admin_apiDelete(`/api/admin/deletereservation?reservationId=${reservationId}`);
}
async function Admin_renderReservationsAdminTable() {
    const tbody = document.getElementById("adminReservationsTbody");
    if (!tbody)
        return;
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
    }
    catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-danger text-center">Nem sikerült a foglalások betöltése.</td>
            </tr>
        `;
    }
}
function Admin_editReservation(paymentReservationId, cartId, date, isPaid, filmScreeningId, amount, price, userId, seatsEncoded) {
    document.getElementById("editReservationId").value = String(paymentReservationId);
    document.getElementById("editReservationCartId").value = String(cartId);
    document.getElementById("editReservationDate").value = Admin_toDateTimeLocalValue(date);
    document.getElementById("editReservationIsPaid").value = isPaid ? "true" : "false";
    document.getElementById("editReservationScreeningId").value = String(filmScreeningId);
    document.getElementById("editReservationAmount").value = String(amount);
    document.getElementById("editReservationPrice").value = String(price);
    document.getElementById("editReservationUserId").value = String(userId);
    document.getElementById("editReservationSeatsJson").value = decodeURIComponent(seatsEncoded);
}
async function Admin_handleReservationUpdate(event) {
    event.preventDefault();
    try {
        const reservationId = Number(document.getElementById("editReservationId").value);
        const seatsJson = document.getElementById("editReservationSeatsJson").value.trim();
        let seats = [];
        if (seatsJson) {
            seats = JSON.parse(seatsJson);
        }
        const dto = {
            paymentReservationId: reservationId,
            cartId: Number(document.getElementById("editReservationCartId").value),
            date: document.getElementById("editReservationDate").value,
            isPaid: document.getElementById("editReservationIsPaid").value === "true",
            filmScreeningId: Number(document.getElementById("editReservationScreeningId").value),
            amount: Number(document.getElementById("editReservationAmount").value),
            price: Number(document.getElementById("editReservationPrice").value),
            userId: Number(document.getElementById("editReservationUserId").value),
            seats
        };
        await Admin_updateReservation(dto);
        Admin_showMessage("adminReservationMessage", "Foglalás módosítva.");
        await Admin_renderReservationsAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminReservationMessage", error.message, true);
    }
}
async function Admin_removeReservation(reservationId) {
    if (!confirm("Biztosan törlöd ezt a foglalást?"))
        return;
    try {
        await Admin_deleteReservation(reservationId);
        Admin_showMessage("adminReservationMessage", "Foglalás törölve.");
        await Admin_renderReservationsAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminReservationMessage", error.message, true);
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
        await Admin_renderReservationsAdminTable();
    }
    catch (error) {
        console.error("Admin tickets init hiba:", error);
    }
});
