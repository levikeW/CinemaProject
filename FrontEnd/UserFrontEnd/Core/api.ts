import { API_BASE, normalizeCollectionPayload, parseNumericId } from "../Core/common.js";

const reservationStorageKeyPrefix = "cinemaSavedReservations";
const hiddenReservationStorageKeyPrefix = "cinemaHiddenReservations";

// A jelenleg bejelentkezett user saját adatainak lekérése
export async function fetchAuthenticatedUserData(): Promise<any | null> {
    try {
        const response = await fetch(`${API_BASE}/api/user/getmydata`, {
            credentials: "include",
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch {
        return null;
    }
}

// Az összes jegytípus lekérése
export async function fetchJegyekList(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getalltickettype`);

    if (!response.ok) {
        throw new Error("Nem sikerült lekérni a jegyek listát.");
    }

    const payload = await response.json();

    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && Array.isArray(payload.value)) {
        return payload.value;
    }

    if (payload && Array.isArray(payload.data)) {
        return payload.data;
    }

    throw new Error("Váratlan API válasz: jegyek lista nem található.");
}

// Az összes film lekérése
export async function fetchMoviesList(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getallmovies`);

    if (!response.ok) {
        throw new Error("Nem sikerült lekérni a filmek listáját.");
    }

    return await response.json();
}

// Az összes terem lekérése
export async function fetchRoomsList(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getallrooms`);

    if (!response.ok) {
        throw new Error("Nem sikerült lekérni a termek listáját.");
    }

    return await response.json();
}

// Az összes kategória lekérése
export async function fetchCategoriesList(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getallcateg`);

    if (!response.ok) {
        throw new Error("Nem sikerült lekérni a kategóriák listáját.");
    }

    return await response.json();
}

// Egy adott terem székadatainak lekérése egy adott vetítéshez
export async function fetchSeatsForRoom(roomId: number, screeningId: number): Promise<any[]> {
    const response = await fetch(
        `${API_BASE}/api/cinema/getseats?roomId=${encodeURIComponent(String(roomId))}&screeningId=${encodeURIComponent(String(screeningId))}`
    );

    if (!response.ok) {
        throw new Error("Nem sikerült lekérni a terem székadatait.");
    }

    const payload = await response.json();

    if (Array.isArray(payload)) {
        return payload;
    }

    return payload.value ?? [];
}

// Egy film képeinek lekérése
export async function fetchImages(movieId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getimage?movieId=${movieId}`);

    if (!response.ok) {
        throw new Error("Nem sikerült lekérni a képet.");
    }

    return await response.json();
}

// Egy vetítéshez tartozó jegyek lekérése
export async function fetchScreeningTickets(screeningId: number): Promise<any[]> {
    try {
        const response = await fetch(
            `${API_BASE}/api/cinema/getticketsbyscreening?screeningId=${encodeURIComponent(String(screeningId))}`,
            { credentials: "include" }
        );

        if (!response.ok) {
            return [];
        }

        const payload = await response.json().catch(() => null);
        const rows = normalizeCollectionPayload<any>(payload);
        const result: any[] = [];

        for (let i = 0; i < rows.length; i++) {
            const ticket = rows[i];
            const ticketId = parseNumericId(ticket.ticketId ?? ticket.TicketId);
            const ticketTypeId = parseNumericId(ticket.ticketTypeId ?? ticket.TicketTypeId);
            const filmScreeningId = parseNumericId(ticket.filmScreeningId ?? ticket.FilmScreeningId);

            if (!ticketId || !ticketTypeId) {
                continue;
            }

            result.push({
                ticketId: ticketId,
                ticketTypeId: ticketTypeId,
                filmScreeningId: filmScreeningId ?? screeningId,
            });
        }

        return result;
    } catch {
        return [];
    }
}

// Bejelentkezés
export async function loginUser(email: string, password: string): Promise<Response> {
    return fetch(`${API_BASE}/api/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
    });
}

// Regisztráció
export async function registerUser(
    email: string,
    fullName: string,
    password: string,
    billingAddress: string
): Promise<Response> {
    return fetch(`${API_BASE}/api/user/Regist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            Email: email,
            FullName: fullName,
            Password: password,
            BillingAddress: billingAddress,
        }),
        credentials: "include",
    });
}

// Kijelentkezés
export async function logoutUser(): Promise<void> {
    await fetch(`${API_BASE}/api/user/logout`, {
        method: "POST",
        credentials: "include",
    });
}

// User profil lekérése
export async function fetchUserProfile(userId: number): Promise<any | null> {
    try {
        const response = await fetch(
            `${API_BASE}/api/user/viewprofile?userId=${encodeURIComponent(String(userId))}`,
            { credentials: "include" }
        );

        if (!response.ok) {
            return null;
        }

        const payload = await response.json().catch(() => null);

        if (Array.isArray(payload)) {
            return payload[0] ?? null;
        }

        if (payload && Array.isArray(payload.value)) {
            return payload.value[0] ?? null;
        }

        return null;
    } catch {
        return null;
    }
}

// User profil módosítása
export async function updateUserProfile(dto: {
    userId: number;
    email: string;
    fullName: string;
    billingAddress: string;
}): Promise<Response> {
    return fetch(`${API_BASE}/api/user/updateprofile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            UserId: dto.userId,
            Email: dto.email,
            FullName: dto.fullName,
            BillingAddress: dto.billingAddress,
        }),
    });
}

// Kosárba rakás a szerveren
export async function addToServerCart(payload: {
    userId: number;
    filmScreeningId: number;
    ticketId: number;
    amount: number;
    seats: any[];
}): Promise<any | null> {
    const response = await fetch(`${API_BASE}/api/cart/addtocart`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
            UserId: payload.userId,
            FilmScreeningId: payload.filmScreeningId,
            TicketId: payload.ticketId,
            Amount: payload.amount,
            Seats: payload.seats,
        }),
    });

    if (!response.ok) {
        return null;
    }

    return await response.json().catch(() => null);
}

// Egy kosár elem törlése
export async function removeServerCart(cartId: number): Promise<boolean> {
    try {
        const response = await fetch(
            `${API_BASE}/api/cart/removefromcart?cartId=${encodeURIComponent(String(cartId))}`,
            {
                method: "POST",
                credentials: "include",
            }
        );

        return response.ok;
    } catch {
        return false;
    }
}

// A teljes kosár ürítése
export async function clearServerCart(userId: number): Promise<boolean> {
    try {
        const response = await fetch(
            `${API_BASE}/api/cart/clearcart?userId=${encodeURIComponent(String(userId))}`,
            {
                method: "DELETE",
                credentials: "include",
            }
        );

        return response.ok;
    } catch {
        return false;
    }
}

// A szerverről jövő seat lista normalizálása
function normalizeCartSeats(seats: unknown): any[] {
    if (!Array.isArray(seats)) {
        return [];
    }

    const result: any[] = [];

    for (let i = 0; i < seats.length; i++) {
        const seat = seats[i] as any;
        const seatId = Number(seat?.seatId);
        const rowNumber = Number(seat?.rowNumber);
        const seatNumber = Number(seat?.seatNumber);

        if (!seatId || !rowNumber || !seatNumber) {
            continue;
        }

        result.push({
            seatId: seatId,
            rowNumber: rowNumber,
            seatNumber: seatNumber,
        });
    }

    return result;
}

function getReservationStorageKey(userId: number): string {
    return `${reservationStorageKeyPrefix}:${userId}`;
}

function getHiddenReservationStorageKey(userId: number): string {
    return `${hiddenReservationStorageKeyPrefix}:${userId}`;
}

function normalizeReservationSeatLabels(seats: unknown): string[] {
    if (!Array.isArray(seats)) {
        return [];
    }

    const result: string[] = [];

    for (let i = 0; i < seats.length; i++) {
        const seatText = String(seats[i] ?? "").trim();

        if (seatText) {
            result.push(seatText);
        }
    }

    return result;
}

// A frontend ide menti el a frissen létrehozott foglalásokat
export function fetchStoredReservations(userId: number): any[] {
    const rawReservations = localStorage.getItem(getReservationStorageKey(userId));

    if (!rawReservations) {
        return [];
    }

    try {
        const parsedReservations = JSON.parse(rawReservations);

        if (!Array.isArray(parsedReservations)) {
            return [];
        }

        const result: any[] = [];

        for (let i = 0; i < parsedReservations.length; i++) {
            const reservation = parsedReservations[i] as any;
            const paymentReservationId = Number(reservation?.paymentReservationId);
            const cartId = Number(reservation?.cartId) || 0;
            const amount = Number(reservation?.amount) || 0;
            const price = Number(reservation?.price) || 0;
            const createdAt = String(reservation?.createdAt ?? "");

            if (!paymentReservationId || !createdAt) {
                continue;
            }

            result.push({
                paymentReservationId: paymentReservationId,
                cartId: cartId,
                createdAt: createdAt,
                isPaid: Boolean(reservation?.isPaid),
                amount: amount,
                price: price,
                movieTitle: String(reservation?.movieTitle ?? ""),
                screeningDate: String(reservation?.screeningDate ?? ""),
                roomName: String(reservation?.roomName ?? ""),
                ticketId: Number(reservation?.ticketId) || 0,
                userEmail: String(reservation?.userEmail ?? ""),
                seatLabels: normalizeReservationSeatLabels(reservation?.seatLabels),
                seats: normalizeCartSeats(reservation?.seats),
            });
        }

        return result;
    } catch {
        return [];
    }
}

export function fetchHiddenReservationIds(userId: number): number[] {
    const rawHiddenReservations = localStorage.getItem(getHiddenReservationStorageKey(userId));

    if (!rawHiddenReservations) {
        return [];
    }

    try {
        const parsedHiddenReservations = JSON.parse(rawHiddenReservations);

        if (!Array.isArray(parsedHiddenReservations)) {
            return [];
        }

        const result: number[] = [];

        for (let i = 0; i < parsedHiddenReservations.length; i++) {
            const reservationId = Number(parsedHiddenReservations[i]);

            if (reservationId > 0) {
                result.push(reservationId);
            }
        }

        return result;
    } catch {
        return [];
    }
}

//Felülírjuk ugyanazzal az azonosítóval a helyi mentést
export function saveStoredReservation(userId: number, reservation: {
    paymentReservationId: number;
    cartId: number;
    createdAt: string;
    isPaid: boolean;
    amount: number;
    price: number;
    movieTitle: string;
    screeningDate: string;
    roomName: string;
    ticketId: number;
    userEmail: string;
    seatLabels: string[];
    seats?: any[];
}): void {
    const storedReservations = fetchStoredReservations(userId);
    const nextReservations: any[] = [];
    let replaced = false;

    for (let i = 0; i < storedReservations.length; i++) {
        if (storedReservations[i].paymentReservationId === reservation.paymentReservationId) {
            nextReservations.push(reservation);
            replaced = true;
        } else {
            nextReservations.push(storedReservations[i]);
        }
    }

    if (!replaced) {
        nextReservations.push(reservation);
    }

    localStorage.setItem(getReservationStorageKey(userId), JSON.stringify(nextReservations));
    restoreHiddenReservation(userId, reservation.paymentReservationId);
}

export function removeStoredReservation(userId: number, paymentReservationId: number): void {
    const storedReservations = fetchStoredReservations(userId);
    const nextReservations: any[] = [];

    for (let i = 0; i < storedReservations.length; i++) {
        if (storedReservations[i].paymentReservationId !== paymentReservationId) {
            nextReservations.push(storedReservations[i]);
        }
    }

    if (nextReservations.length === 0) {
        localStorage.removeItem(getReservationStorageKey(userId));
        return;
    }

    localStorage.setItem(getReservationStorageKey(userId), JSON.stringify(nextReservations));
}

export function hideReservationLocally(userId: number, paymentReservationId: number): void {
    const hiddenReservationIds = fetchHiddenReservationIds(userId);

    for (let i = 0; i < hiddenReservationIds.length; i++) {
        if (hiddenReservationIds[i] === paymentReservationId) {
            return;
        }
    }

    hiddenReservationIds.push(paymentReservationId);
    localStorage.setItem(getHiddenReservationStorageKey(userId), JSON.stringify(hiddenReservationIds));
}

export function restoreHiddenReservation(userId: number, paymentReservationId: number): void {
    const hiddenReservationIds = fetchHiddenReservationIds(userId);
    const nextHiddenReservationIds: number[] = [];

    for (let i = 0; i < hiddenReservationIds.length; i++) {
        if (hiddenReservationIds[i] !== paymentReservationId) {
            nextHiddenReservationIds.push(hiddenReservationIds[i]);
        }
    }

    if (nextHiddenReservationIds.length === 0) {
        localStorage.removeItem(getHiddenReservationStorageKey(userId));
        return;
    }

    localStorage.setItem(getHiddenReservationStorageKey(userId), JSON.stringify(nextHiddenReservationIds));
}

// A user kosarának lekérése
export async function fetchServerCart(userId: number): Promise<any[]> {
    try {
        const response = await fetch(
            `${API_BASE}/api/cart/getcart?userId=${encodeURIComponent(String(userId))}`,
            { credentials: "include" }
        );

        if (!response.ok) {
            return [];
        }

        const payload = await response.json().catch(() => null);
        const rows = normalizeCollectionPayload<any>(payload);
        const result: any[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];

            const cartId = parseNumericId(row.cartId ?? row.CartId);
            const currentUserId = parseNumericId(row.userId ?? row.UserId);
            const filmScreeningId = parseNumericId(row.filmScreeningId ?? row.FilmScreeningId);
            const ticketId = parseNumericId(row.ticketId ?? row.TicketId);
            const amount = parseNumericId(row.amount ?? row.Amount) ?? 0;
            const totalPrice = Number(row.totalPrice ?? row.TotalPrice ?? 0);

            if (!cartId || !currentUserId || !filmScreeningId || !ticketId || amount <= 0) {
                continue;
            }

            result.push({
                cartId: cartId,
                userId: currentUserId,
                filmScreeningId: filmScreeningId,
                ticketId: ticketId,
                amount: amount,
                totalPrice: Number.isFinite(totalPrice) ? totalPrice : 0,
                seats: normalizeCartSeats(row.seats ?? row.Seats),
            });
        }

        return result;
    } catch {
        return [];
    }
}

// Foglalás létrehozása egy cart elemből
export async function createServerReservation(cartId: number): Promise<any | null> {
    try {
        const response = await fetch(
            `${API_BASE}/api/payment_reservation/createreservation?cartId=${encodeURIComponent(String(cartId))}`,
            {
                method: "POST",
                credentials: "include",
            }
        );

        if (!response.ok) {
            return null;
        }

        return await response.json().catch(() => null);
    } catch {
        return null;
    }
}

// Foglalás törlése reservationId alapján
export async function deleteReservationOnServerByPaymentId(paymentReservationId: number): Promise<boolean> {
    try {
        const response = await fetch(
            `${API_BASE}/api/payment_reservation/cancelreservation?reservationId=${encodeURIComponent(String(paymentReservationId))}`,
            {
                method: "DELETE",
                credentials: "include",
            }
        );

        return response.ok;
    } catch {
        return false;
    }
}

// Közelgő foglalások lekérése
export async function fetchUpcomingReservations(userId: number): Promise<any[]> {
    try {
        const response = await fetch(
            `${API_BASE}/api/payment_reservation/viewupcomingreservation?userId=${encodeURIComponent(String(userId))}`,
            { credentials: "include" }
        );

        if (!response.ok) {
            return [];
        }

        const payload = await response.json().catch(() => null);
        const items = normalizeCollectionPayload<any>(payload);
        const result: any[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            const paymentReservationId = parseNumericId(item.paymentReservationId ?? item.PaymentReservationId);
            const cartId = parseNumericId(item.cartId ?? item.CartId);
            const amount = parseNumericId(item.amount ?? item.Amount) ?? 0;
            const price = Number(item.price ?? item.Price ?? 0);
            const createdAt = String(item.date ?? item.Date ?? "");

            if (!paymentReservationId || !cartId || !createdAt) {
                continue;
            }

            result.push({
                paymentReservationId: paymentReservationId,
                cartId: cartId,
                createdAt: createdAt,
                isPaid: Boolean(item.isPaid ?? item.IsPaid),
                amount: amount,
                price: Number.isFinite(price) ? price : 0,
                seats: normalizeCartSeats(item.seats ?? item.Seats),
            });
        }

        return result;
    } catch {
        return [];
    }
}

// Múltbeli foglalások lekérése
export async function fetchPastReservations(userId: number): Promise<any[]> {
    try {
        const response = await fetch(
            `${API_BASE}/api/payment_reservation/viewpastreservation?userId=${encodeURIComponent(String(userId))}`,
            { credentials: "include" }
        );

        if (!response.ok) {
            return [];
        }

        const payload = await response.json().catch(() => null);
        const items: any[] = normalizeCollectionPayload(payload);
        const reservations: any[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            const paymentReservationId = parseNumericId(item.paymentReservationId || item.PaymentReservationId);
            const cartId = parseNumericId(item.cartId || item.CartId);
            const amount = parseNumericId(item.amount || item.Amount) || 0;
            const price = Number(item.price || item.Price || 0);
            const createdAt = String(item.date || item.Date || "");
            const isPaid = Boolean(item.isPaid || item.IsPaid);
            const seats = normalizeCartSeats(item.seats || item.Seats || []);

            if (!paymentReservationId || !cartId || !createdAt) {
                continue;
            }

            reservations.push({
                paymentReservationId: paymentReservationId,
                cartId: cartId,
                createdAt: createdAt,
                isPaid: isPaid,
                amount: amount,
                price: price,
                seats: seats,
            });
        }

        return reservations;
    } catch {
        return [];
    }
}

// Foglalás visszaigazolás lekérése
export async function fetchReservationConfirmation(reservationId: number): Promise<any | null> {
    try {
        const response = await fetch(
            `${API_BASE}/api/payment_reservation/getconfirmation?reservationId=${encodeURIComponent(String(reservationId))}`,
            { credentials: "include" }
        );

        if (!response.ok) {
            return null;
        }
        return await response.json().catch(() => null);
    } catch {
        return null;
    }
}