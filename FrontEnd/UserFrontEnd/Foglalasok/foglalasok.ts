import {
    deleteReservationOnServerByPaymentId,
    fetchHiddenReservationIds,
    fetchStoredReservations,
    fetchReservationConfirmation,
    fetchUpcomingReservations,
    fetchPastReservations,
    hideReservationLocally,
    removeStoredReservation
} from "../Core/api.js";

import { formatPrice, showReservationMessage } from "../Core/common.js";
import { ensureCurrentUserIdLoaded, applyLoginState } from "../Fooldalak/auth.js";

interface CartSeat {
    seatId: number;
    rowNumber: number;
    seatNumber: number;
}

interface ReservationViewItem {
    paymentReservationId: number;
    cartId: number;
    createdAt: string;
    isPaid: boolean;
    amount: number;
    price: number;
    seats: CartSeat[];
    movieTitle?: string;
    screeningDate?: string;
    roomName?: string;
    ticketId?: number;
    userEmail?: string;
    seatLabels?: string[];
}

function isReservationHidden(hiddenReservationIds: number[], paymentReservationId: number): boolean {
    for (let i = 0; i < hiddenReservationIds.length; i++) {
        if (hiddenReservationIds[i] === paymentReservationId) {
            return true;
        }
    }

    return false;
}

function getReservationSeatText(reservation: ReservationViewItem): string {
    if (Array.isArray(reservation.seatLabels) && reservation.seatLabels.length > 0) {
        let result = "";

        for (let i = 0; i < reservation.seatLabels.length; i++) {
            if (i === 0) {
                result += reservation.seatLabels[i];
            } else {
                result += ", " + reservation.seatLabels[i];
            }
        }

        return result;
    }

    let result = "";

    for (let i = 0; i < reservation.seats.length; i++) {
        const seat = reservation.seats[i];
        const oneSeatText = `${seat.rowNumber}.${seat.seatNumber}`;

        if (i === 0) {
            result += oneSeatText;
        } else {
            result += ", " + oneSeatText;
        }
    }

    return result;
}

// Egy foglaláshoz lekéri a részletesebb adatokat is
// Pl. filmcím, teremnév, időpont
async function enrichReservationItem(item: ReservationViewItem): Promise<ReservationViewItem> {
    const confirmation = await fetchReservationConfirmation(item.paymentReservationId);

    if (!confirmation) {
        return item;
    }

    return {
        paymentReservationId: item.paymentReservationId,
        cartId: item.cartId,
        createdAt: item.createdAt,
        isPaid: item.isPaid,
        amount: item.amount,
        price: item.price,
        seats: item.seats,
        movieTitle: confirmation.movieTitle || confirmation.MovieTitle || "",
        screeningDate: confirmation.screeningDate || confirmation.ScreeningDate || "",
        roomName: confirmation.roomName || confirmation.RoomName || "",
        ticketId: Number(confirmation.ticketId || confirmation.TicketId) || undefined,
        userEmail: confirmation.userEmail || confirmation.UserEmail || "",
        seatLabels: Array.isArray(confirmation.seats ?? confirmation.Seats)
            ? (confirmation.seats ?? confirmation.Seats)
            : item.seatLabels,
    };
}

// Foglalás törlése gomb kezelése
export async function handleDeleteReservation(paymentReservationId: string): Promise<void> {
    const reservationId = Number(paymentReservationId);

    if (!reservationId) {
        showReservationMessage("Foglalás nem található.", true);
        return;
    }

    const userId = await ensureCurrentUserIdLoaded();

    const ok = await deleteReservationOnServerByPaymentId(reservationId);

    if (!ok) {
        if (userId) {
            hideReservationLocally(userId, reservationId);
            removeStoredReservation(userId, reservationId);
            showReservationMessage("A foglalás eltűnt a listából, de a szerveres törlés nem sikerült.", true);
            await renderSavedReservations();
            return;
        }

        showReservationMessage("A foglalás törlése a szerveren nem sikerült.", true);
        return;
    }

    if (userId) {
        removeStoredReservation(userId, reservationId);
    }

    showReservationMessage("Foglalás törölve.", false);

    // Törlés után újratöltjük a listát
    await renderSavedReservations();
}

// Ez rajzolja ki a user összes foglalását
export async function renderSavedReservations(): Promise<void> {
    const mainSection = document.querySelector("main.page-section") as HTMLElement | null;

    if (!mainSection) {
        return;
    }

    const userId = await ensureCurrentUserIdLoaded();

    // Ha nincs belépve, szólunk neki
    if (!userId) {
        mainSection.innerHTML = 
            `<section class="container py-4">
                <div class="alert alert-info">Jelentkezz be a foglalásaid megtekintéséhez.</div>
            </section> `;
        return;
    }

    // Lekérjük a jövőbeli és múltbeli foglalásokat
    const upcomingReservations = await fetchUpcomingReservations(userId);
    const pastReservations = await fetchPastReservations(userId);
    const storedReservations = fetchStoredReservations(userId);
    const hiddenReservationIds = fetchHiddenReservationIds(userId);

    const reservations: ReservationViewItem[] = [];

    // Egy tömbbe összerakjuk őket
    for (let i = 0; i < upcomingReservations.length; i++) {
        if (!isReservationHidden(hiddenReservationIds, upcomingReservations[i].paymentReservationId)) {
            reservations.push(upcomingReservations[i]);
        }
    }

    for (let i = 0; i < pastReservations.length; i++) {
        if (!isReservationHidden(hiddenReservationIds, pastReservations[i].paymentReservationId)) {
            reservations.push(pastReservations[i]);
        }
    }

    // Ha a backend lista hiányos vagy üres, a frontend a korábban sikeresen létrehozott foglalásokat
    // a helyi cache-ből is betölti ugyanarra a foglalások oldalra.
    for (let i = 0; i < storedReservations.length; i++) {
        if (isReservationHidden(hiddenReservationIds, storedReservations[i].paymentReservationId)) {
            continue;
        }

        const storedConfirmation = await fetchReservationConfirmation(storedReservations[i].paymentReservationId);

        if (!storedConfirmation) {
            continue;
        }

        let exists = false;

        for (let j = 0; j < reservations.length; j++) {
            if (reservations[j].paymentReservationId === storedReservations[i].paymentReservationId) {
                exists = true;
                break;
            }
        }

        if (!exists) {
            reservations.push(storedReservations[i]);
        }
    }

    // Legfrissebb legyen legfelül
    reservations.sort(function (a, b) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    if (reservations.length === 0) {
        mainSection.innerHTML = 
            `<div class="empty-state">
                <h2>Nincsenek foglalásaid.</h2>
            </div>`;
        return;
    }

    // Minden foglaláshoz lekérjük a részletes adatokat
    const enrichedReservations: ReservationViewItem[] = [];

    for (let i = 0; i < reservations.length; i++) {
        const enrichedItem = await enrichReservationItem(reservations[i]);
        enrichedReservations.push(enrichedItem);
    }

    let content = 
        `<section class="container py-4">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h2 class="h5 mb-0">Foglalásaim</h2>
                        <a class="btn btn-save-like btn-sm" href="../Fooldalak/Profile.html">← Vissza a profilra</a>
                    </div>`;

    // Kirajzoljuk a foglalásokat egyesével
    for (let i = 0; i < enrichedReservations.length; i++) {
        const reservation = enrichedReservations[i];
        const seatsText = getReservationSeatText(reservation);

        content += 
            `<div class="mb-3">
                <h3 class="h6">${reservation.movieTitle ? reservation.movieTitle : "Foglalás #" + reservation.paymentReservationId} — ${reservation.roomName ? reservation.roomName : ""}</h3>
                <p class="text-muted">${reservation.screeningDate ? new Date(reservation.screeningDate).toLocaleString("hu-HU") : ""}</p>
                <div>Jegyek száma: ${reservation.amount}</div>
                <div class="text-muted small">Végösszeg: ${formatPrice(reservation.price)}</div>
                <div>Székek: ${seatsText}</div>
                <div class="text-muted small">Állapot: ${reservation.isPaid ? "Fizetve" : "Lefoglalva"}</div>
                <div class="text-muted small">Mentve: ${new Date(reservation.createdAt).toLocaleString("hu-HU")}</div>
                <div class="text-muted small">Foglalás azonosító: ${reservation.paymentReservationId}</div>
                <div class="mt-2">
                    ${reservation.isPaid
                        ? "<span class=\"badge text-bg-secondary\">Fizetett foglalás</span>"
                        : `<button class="btn btn-danger btn-sm" data-delete-reservation-id="${reservation.paymentReservationId}">Törlés</button>`}
                </div>
            </div>`;
    }

    content += 
            `</div>
            </div>
        </section>`;

    mainSection.innerHTML = content;

    const deleteButtons = mainSection.querySelectorAll<HTMLButtonElement>("[data-delete-reservation-id]");

    for (let i = 0; i < deleteButtons.length; i++) {
        const button = deleteButtons[i];

        button.addEventListener("click", async () => {
            const reservationId = button.dataset.deleteReservationId;

            if (!reservationId) {
                return;
            }

            button.disabled = true;
            await handleDeleteReservation(reservationId);
        });
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    applyLoginState();
    await renderSavedReservations();
});