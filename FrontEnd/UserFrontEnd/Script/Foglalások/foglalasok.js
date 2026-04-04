import { deleteReservationOnServerByPaymentId, fetchReservationConfirmation, fetchUpcomingReservations } from "../Core/api.js";
import { formatPrice, showReservationMessage } from "../Core/common.js";
import { ensureCurrentUserIdLoaded, applyLoginState } from "../Főoldalak/auth.js";
async function enrichReservationItem(item) {
    const confirmation = await fetchReservationConfirmation(item.paymentReservationId);
    if (!confirmation)
        return item;
    return {
        ...item,
        movieTitle: String(confirmation.movieTitle ?? confirmation.MovieTitle ?? ""),
        screeningDate: String(confirmation.screeningDate ?? confirmation.ScreeningDate ?? ""),
        roomName: String(confirmation.roomName ?? confirmation.RoomName ?? ""),
        ticketId: Number(confirmation.ticketId ?? confirmation.TicketId) || undefined,
        userEmail: String(confirmation.userEmail ?? confirmation.UserEmail ?? ""),
    };
}
export async function handleDeleteReservation(paymentReservationId) {
    const reservationId = Number(paymentReservationId);
    if (!reservationId) {
        showReservationMessage("Foglalás nem található.", true);
        return;
    }
    const ok = await deleteReservationOnServerByPaymentId(reservationId);
    if (!ok) {
        showReservationMessage("A foglalás törlése a szerveren nem sikerült.", true);
        return;
    }
    showReservationMessage("Foglalás törölve.", false);
    await renderSavedReservations();
}
export async function renderSavedReservations() {
    const mainSection = document.querySelector("main.page-section");
    if (!mainSection)
        return;
    const userId = await ensureCurrentUserIdLoaded();
    if (!userId) {
        mainSection.innerHTML = `
            <section class="container py-4">
                <div class="alert alert-info">Jelentkezz be a foglalásaid megtekintéséhez.</div>
            </section>
        `;
        return;
    }
    const reservations = await fetchUpcomingReservations(userId);
    if (!reservations.length) {
        mainSection.innerHTML = `
            <section class="container py-4">
                <div class="alert alert-info">Nincsenek aktív foglalásaid.</div>
            </section>
        `;
        return;
    }
    const enrichedReservations = await Promise.all(reservations.map((item) => enrichReservationItem(item)));
    let content = `
        <section class="container py-4">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h2 class="h5 mb-0">Aktív foglalásaim</h2>
                        <a class="btn btn-save-like btn-sm" href="../Főoldalak/Profile.html">← Vissza a profilra</a>
                    </div>
    `;
    for (const reservation of enrichedReservations) {
        content += `
            <div class="mb-3">
                <h3 class="h6">${reservation.movieTitle ?? `Foglalás #${reservation.paymentReservationId}`} — ${reservation.roomName ?? ""}</h3>
                <p class="text-muted">${reservation.screeningDate ? new Date(reservation.screeningDate).toLocaleString("hu-HU") : ""}</p>
                <div>Jegyek száma: ${reservation.amount}</div>
                <div class="text-muted small">Végösszeg: ${formatPrice(reservation.price)}</div>
                <div>Székek: ${reservation.seats.map((seat) => `${seat.rowNumber}.${seat.seatNumber}`).join(", ")}</div>
                <div class="text-muted small">Mentve: ${new Date(reservation.createdAt).toLocaleString("hu-HU")}</div>
                <div class="text-muted small">Foglalás azonosító: ${reservation.paymentReservationId}</div>
                <div class="mt-2">
                    <button class="btn btn-danger btn-sm" onclick="window.handleDeleteReservation('${reservation.paymentReservationId}')">Törlés</button>
                </div>
            </div>
        `;
    }
    content += `
                </div>
            </div>
        </section>
    `;
    mainSection.innerHTML = content;
}
Object.assign(window, {
    handleDeleteReservation,
    renderSavedReservations,
});
document.addEventListener("DOMContentLoaded", async () => {
    applyLoginState();
    await renderSavedReservations();
});
