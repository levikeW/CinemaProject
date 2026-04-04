import { API_BASE, normalizeCollectionPayload, parseNumericId } from "../Core/common.js";

export async function fetchAuthenticatedUserData(): Promise<any | null> {
    try {
        const response = await fetch(`${API_BASE}/api/user/getmydata`, { credentials: "include" });
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

export async function fetchJegyekList(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getalltickettype`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a jegyek listát.");

    const payload = await response.json();
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.value)) return payload.value;
    if (payload && Array.isArray(payload.data)) return payload.data;

    throw new Error("Váratlan API válasz: jegyek lista nem található.");
}

export async function fetchMoviesList(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getallmovies`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a filmek listáját.");
    return await response.json();
}

export async function fetchRoomsList(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getallrooms`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a termek listáját.");
    return await response.json();
}

export async function fetchCategoriesList(): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getallcateg`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a kategóriák listáját.");
    return await response.json();
}

export async function fetchSeatsForRoom(roomId: number, screeningId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getseats?roomId=${encodeURIComponent(String(roomId))}&screeningId=${encodeURIComponent(String(screeningId))}`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a terem székadatait.");

    const payload = await response.json();
    return Array.isArray(payload) ? payload : (payload.value ?? []);
}

export async function fetchImages(movieId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE}/api/cinema/getimage?movieId=${movieId}`);
    if (!response.ok) throw new Error("Nem sikerült lekérni a képet.");
    return await response.json();
}

export async function fetchScreeningTickets(screeningId: number): Promise<any[]> {
    try {
        const response = await fetch(
            `${API_BASE}/api/cinema/getticketsbyscreening?screeningId=${encodeURIComponent(String(screeningId))}`,
            { credentials: "include" },
        );

        if (!response.ok) return [];
        const payload = await response.json().catch(() => null);
        return normalizeCollectionPayload<any>(payload);
    } catch {
        return [];
    }
}

export async function loginUser(email: string, password: string): Promise<Response> {
    return fetch(`${API_BASE}/api/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
    });
}

export async function registerUser(email: string, fullName: string, password: string, billingAddress: string): Promise<Response> {
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

export async function logoutUser(): Promise<void> {
    await fetch(`${API_BASE}/api/user/logout`, {
        method: "POST",
        credentials: "include",
    });
}

export async function fetchUserProfile(userId: number): Promise<any | null> {
    try {
        const response = await fetch(`${API_BASE}/api/user/viewprofile?userId=${encodeURIComponent(String(userId))}`, {
            credentials: "include",
        });

        if (!response.ok) return null;

        const payload = await response.json().catch(() => null);
        if (Array.isArray(payload)) return payload[0] ?? null;
        if (payload && Array.isArray(payload.value)) return payload.value[0] ?? null;
        return null;
    } catch {
        return null;
    }
}

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

    if (!response.ok) return null;
    return await response.json().catch(() => null);
}

export async function removeServerCart(cartId: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/api/cart/removefromcart?cartId=${encodeURIComponent(String(cartId))}`, {
            method: "POST",
            credentials: "include",
        });
        return response.ok;
    } catch {
        return false;
    }
}

export async function clearServerCart(userId: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/api/cart/clearcart?userId=${encodeURIComponent(String(userId))}`, {
            method: "DELETE",
            credentials: "include",
        });
        return response.ok;
    } catch {
        return false;
    }
}

function normalizeCartSeats(seats: unknown) {
    if (!Array.isArray(seats)) return [];
    return seats
        .map((seat) => {
            const s = seat as any;
            const seatId = Number(s?.seatId);
            const rowNumber = Number(s?.rowNumber);
            const seatNumber = Number(s?.seatNumber);

            if (!seatId || !rowNumber || !seatNumber) return null;
            return { seatId, rowNumber, seatNumber };
        })
        .filter(Boolean);
}

export async function fetchServerCart(userId: number): Promise<any[]> {
    try {
        const response = await fetch(`${API_BASE}/api/cart/getcart?userId=${encodeURIComponent(String(userId))}`, {
            credentials: "include",
        });

        if (!response.ok) return [];
        const payload = await response.json().catch(() => null);
        const rows = normalizeCollectionPayload<any>(payload);

        return rows
            .map((row) => {
                const cartId = parseNumericId(row.cartId ?? row.CartId);
                const currentUserId = parseNumericId(row.userId ?? row.UserId);
                const filmScreeningId = parseNumericId(row.filmScreeningId ?? row.FilmScreeningId);
                const ticketId = parseNumericId(row.ticketId ?? row.TicketId);
                const amount = parseNumericId(row.amount ?? row.Amount) ?? 0;
                const totalPrice = Number(row.totalPrice ?? row.TotalPrice ?? 0);

                if (!cartId || !currentUserId || !filmScreeningId || !ticketId || amount <= 0) {
                    return null;
                }

                return {
                    cartId,
                    userId: currentUserId,
                    filmScreeningId,
                    ticketId,
                    amount,
                    totalPrice: Number.isFinite(totalPrice) ? totalPrice : 0,
                    seats: normalizeCartSeats(row.seats ?? row.Seats),
                };
            })
            .filter(Boolean);
    } catch {
        return [];
    }
}

export async function createServerReservation(cartId: number): Promise<any | null> {
    try {
        const response = await fetch(`${API_BASE}/api/payment_reservation/createreservation?cartId=${encodeURIComponent(String(cartId))}`, {
            method: "POST",
            credentials: "include",
        });

        if (!response.ok) return null;
        return await response.json().catch(() => null);
    } catch {
        return null;
    }
}

export async function deleteReservationOnServerByPaymentId(paymentReservationId: number): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/api/payment_reservation/cancelreservation?reservationId=${encodeURIComponent(String(paymentReservationId))}`, {
            method: "DELETE",
            credentials: "include",
        });
        return response.ok;
    } catch {
        return false;
    }
}

export async function fetchUpcomingReservations(userId: number): Promise<any[]> {
    try {
        const response = await fetch(`${API_BASE}/api/payment_reservation/viewupcomingreservation?userId=${encodeURIComponent(String(userId))}`, {
            credentials: "include",
        });

        if (!response.ok) return [];
        const payload = await response.json().catch(() => null);
        const items = normalizeCollectionPayload<any>(payload);

        return items
            .map((item) => {
                const paymentReservationId = parseNumericId(item.paymentReservationId ?? item.PaymentReservationId);
                const cartId = parseNumericId(item.cartId ?? item.CartId);
                const amount = parseNumericId(item.amount ?? item.Amount) ?? 0;
                const price = Number(item.price ?? item.Price ?? 0);
                const createdAt = String(item.date ?? item.Date ?? "");

                if (!paymentReservationId || !cartId || !createdAt) return null;

                return {
                    paymentReservationId,
                    cartId,
                    createdAt,
                    isPaid: Boolean(item.isPaid ?? item.IsPaid),
                    amount,
                    price: Number.isFinite(price) ? price : 0,
                    seats: normalizeCartSeats(item.seats ?? item.Seats),
                };
            })
            .filter(Boolean);
    } catch {
        return [];
    }
}

export async function fetchReservationConfirmation(reservationId: number): Promise<any | null> {
    try {
        const response = await fetch(`${API_BASE}/api/payment_reservation/getconfirmation?reservationId=${encodeURIComponent(String(reservationId))}`, {
            credentials: "include",
        });

        if (!response.ok) return null;
        return await response.json().catch(() => null);
    } catch {
        return null;
    }
}
