const Admin_API_BASE = "http://localhost:5067";
// ===================== AUTH / SESSION =====================
function Admin_getAdminId() {
    const raw = localStorage.getItem("adminUserId");
    return raw ? Number(raw) : 0;
}
function Admin_setAdminId(id) {
    localStorage.setItem("adminUserId", String(id));
}
function Admin_showMessage(targetId, message, isError = false) {
    const target = document.getElementById(targetId);
    if (!target)
        return;
    target.textContent = message;
    target.className = isError ? "alert alert-danger d-block" : "alert alert-success d-block";
}
// ===================== API =====================
async function Admin_apiGet(url) {
    const response = await fetch(`${Admin_API_BASE}${url}`, {
        credentials: "include"
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `GET hiba: ${url}`);
    }
    return await response.json();
}
async function Admin_apiPost(url, body) {
    const response = await fetch(`${Admin_API_BASE}${url}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `POST hiba: ${url}`);
    }
    if (response.headers.get("content-type")?.includes("application/json")) {
        return await response.json();
    }
    return undefined;
}
async function Admin_apiPut(url, body) {
    const response = await fetch(`${Admin_API_BASE}${url}`, {
        method: "PUT",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        credentials: "include",
        body: body ? JSON.stringify(body) : null
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `PUT hiba: ${url}`);
    }
    if (response.headers.get("content-type")?.includes("application/json")) {
        return await response.json();
    }
    return undefined;
}
async function Admin_apiDelete(url) {
    const response = await fetch(`${Admin_API_BASE}${url}`, {
        method: "DELETE",
        credentials: "include"
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `DELETE hiba: ${url}`);
    }
}
// ===================== MOVIES =====================
async function Admin_getAllMovies() {
    return await Admin_apiGet("/api/cinema/getallmovies");
}
async function Admin_createMovie(dto) {
    await Admin_apiPost("/api/admin/newmovie", dto);
}
async function Admin_updateMovie(movieId, dto) {
    await Admin_apiPut(`/api/admin/modifymovie?movieId=${movieId}`, dto);
}
async function Admin_deleteMovie(movieId) {
    await Admin_apiDelete(`/api/admin/deletemovie?movieId=${movieId}`);
}
async function Admin_renderMoviesAdminTable() {
    const tbody = document.getElementById("adminMoviesTbody");
    if (!tbody)
        return;
    try {
        const movies = await Admin_getAllMovies();
        tbody.innerHTML = "";
        for (const movie of movies) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${movie.movieId}</td>
                <td>${movie.movieTitle}</td>
                <td>${movie.genre}</td>
                <td>${movie.director}</td>
                <td>${movie.duration} perc</td>
                <td>${movie.imageId ?? "-"}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-2" onclick="Admin_editMovie(${movie.movieId}, '${Admin_escapeJs(movie.movieTitle)}', ${movie.duration}, '${Admin_escapeJs(movie.genre)}', '${Admin_escapeJs(movie.director)}', '${Admin_escapeJs(movie.description)}', ${movie.imageId ?? 0})">
                        Módosítás
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="Admin_removeMovie(${movie.movieId})">
                        Törlés
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        }
    }
    catch (error) {
        console.error(error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-danger text-center">Nem sikerült a filmek betöltése.</td>
            </tr>
        `;
    }
}
async function Admin_handleMovieCreate(event) {
    event.preventDefault();
    try {
        const dto = {
            movieTitle: document.getElementById("movieTitle").value.trim(),
            duration: Number(document.getElementById("movieDuration").value),
            genre: document.getElementById("movieGenre").value.trim(),
            director: document.getElementById("movieDirector").value.trim(),
            description: document.getElementById("movieDescription").value.trim(),
            imageId: Number(document.getElementById("movieImageId").value || "0")
        };
        await Admin_createMovie(dto);
        Admin_showMessage("adminMovieMessage", "Film sikeresen létrehozva.");
        document.getElementById("movieForm")?.reset();
        await Admin_renderMoviesAdminTable();
        await Admin_renderScreeningsMovieSelect();
    }
    catch (error) {
        Admin_showMessage("adminMovieMessage", error.message, true);
    }
}
async function Admin_removeMovie(movieId) {
    if (!confirm("Biztosan törlöd ezt a filmet?"))
        return;
    try {
        await Admin_deleteMovie(movieId);
        Admin_showMessage("adminMovieMessage", "Film törölve.");
        await Admin_renderMoviesAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminMovieMessage", error.message, true);
    }
}
function Admin_editMovie(movieId, movieTitle, duration, genre, director, description, imageId) {
    document.getElementById("editMovieId").value = String(movieId);
    document.getElementById("editMovieTitle").value = movieTitle;
    document.getElementById("editMovieDuration").value = String(duration);
    document.getElementById("editMovieGenre").value = genre;
    document.getElementById("editMovieDirector").value = director;
    document.getElementById("editMovieDescription").value = description;
    document.getElementById("editMovieImageId").value = String(imageId);
}
async function Admin_handleMovieUpdate(event) {
    event.preventDefault();
    try {
        const movieId = Number(document.getElementById("editMovieId").value);
        const dto = {
            movieTitle: document.getElementById("editMovieTitle").value.trim(),
            duration: Number(document.getElementById("editMovieDuration").value),
            genre: document.getElementById("editMovieGenre").value.trim(),
            director: document.getElementById("editMovieDirector").value.trim(),
            description: document.getElementById("editMovieDescription").value.trim(),
            imageId: Number(document.getElementById("editMovieImageId").value || "0")
        };
        await Admin_updateMovie(movieId, dto);
        Admin_showMessage("adminMovieEditMessage", "Film módosítva.");
        await Admin_renderMoviesAdminTable();
        await Admin_renderScreeningsMovieSelect();
    }
    catch (error) {
        Admin_showMessage("adminMovieEditMessage", error.message, true);
    }
}
// ===================== SCREENINGS =====================
async function Admin_getAllScreenings() {
    return await Admin_apiGet("/api/cinema/getallscreenings");
}
async function Admin_createScreening(dto) {
    await Admin_apiPost("/api/admin/newscreening", dto);
}
async function Admin_updateScreening(screeningId, dto) {
    await Admin_apiPut(`/api/admin/modifyfilmscreening?screeningId=${screeningId}`, dto);
}
async function Admin_deleteScreening(screeningId) {
    await Admin_apiDelete(`/api/admin/deletescreening?screeningId=${screeningId}`);
}
async function Admin_renderScreeningsAdminTable() {
    const tbody = document.getElementById("adminScreeningsTbody");
    if (!tbody)
        return;
    try {
        const screenings = await Admin_getAllScreenings();
        tbody.innerHTML = "";
        for (const screening of screenings) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${screening.filmScreeningId}</td>
                <td>${screening.movieTitle}</td>
                <td>${screening.roomName}</td>
                <td>${new Date(screening.date).toLocaleString("hu-HU")}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-2" onclick="Admin_editScreening(${screening.filmScreeningId}, ${screening.movieId}, ${screening.roomId}, '${screening.date}')">
                        Módosítás
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="Admin_removeScreening(${screening.filmScreeningId})">
                        Törlés
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        }
    }
    catch (error) {
        console.error(error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-danger text-center">Nem sikerült a vetítések betöltése.</td>
            </tr>
        `;
    }
}
async function Admin_handleScreeningCreate(event) {
    event.preventDefault();
    try {
        const dto = {
            movieId: Number(document.getElementById("screeningMovieId").value),
            roomId: Number(document.getElementById("screeningRoomId").value),
            date: document.getElementById("screeningDate").value
        };
        await Admin_createScreening(dto);
        Admin_showMessage("adminScreeningMessage", "Vetítés létrehozva.");
        document.getElementById("screeningForm")?.reset();
        await Admin_renderScreeningsAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminScreeningMessage", error.message, true);
    }
}
function Admin_editScreening(screeningId, movieId, roomId, date) {
    document.getElementById("editScreeningId").value = String(screeningId);
    document.getElementById("editScreeningMovieId").value = String(movieId);
    document.getElementById("editScreeningRoomId").value = String(roomId);
    document.getElementById("editScreeningDate").value = Admin_toDateTimeLocalValue(date);
}
async function Admin_handleScreeningUpdate(event) {
    event.preventDefault();
    try {
        const screeningId = Number(document.getElementById("editScreeningId").value);
        const dto = {
            movieId: Number(document.getElementById("editScreeningMovieId").value),
            roomId: Number(document.getElementById("editScreeningRoomId").value),
            date: document.getElementById("editScreeningDate").value
        };
        await Admin_updateScreening(screeningId, dto);
        Admin_showMessage("adminScreeningEditMessage", "Vetítés módosítva.");
        await Admin_renderScreeningsAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminScreeningEditMessage", error.message, true);
    }
}
async function Admin_removeScreening(screeningId) {
    if (!confirm("Biztosan törlöd ezt a vetítést?"))
        return;
    try {
        await Admin_deleteScreening(screeningId);
        Admin_showMessage("adminScreeningMessage", "Vetítés törölve.");
        await Admin_renderScreeningsAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminScreeningMessage", error.message, true);
    }
}
// ===================== TICKETS =====================
async function Admin_getAllTicketTypes() {
    return await Admin_apiGet("http://localhost:5067/api/cinema/getalltickettype");
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
            row.innerHTML = `
                <td>${ticket.ticketId}</td>
                <td>${ticket.ticketType}</td>
                <td>${ticket.ticketPrice} Ft</td>
                <td>
                    <button class="btn btn-warning btn-sm me-2" onclick="Admin_editTicket(${ticket.ticketId}, '${Admin_escapeJs(ticket.ticketType)}', ${ticket.ticketPrice})">
                        Módosítás
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="Admin_removeTicket(${ticket.ticketId})">
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
                <td colspan="4" class="text-danger text-center">Nem sikerült a jegytípusok betöltése.</td>
            </tr>
        `;
    }
}
async function Admin_handleTicketCreate(event) {
    event.preventDefault();
    try {
        const dto = {
            ticketType: document.getElementById("ticketType").value.trim(),
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
function Admin_editTicket(ticketId, ticketType, ticketPrice) {
    document.getElementById("editTicketId").value = String(ticketId);
    document.getElementById("editTicketType").value = ticketType;
    document.getElementById("editTicketPrice").value = String(ticketPrice);
}
async function Admin_handleTicketUpdate(event) {
    event.preventDefault();
    try {
        const ticketId = Number(document.getElementById("editTicketId").value);
        const dto = {
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
// ===================== CATEGORIES =====================
async function Admin_getAllCategories() {
    return await Admin_apiGet("/api/cinema/getallcateg");
}
async function Admin_createCategory(dto) {
    await Admin_apiPost("/api/admin/newcateg", dto);
}
async function Admin_updateCategory(categId, dto) {
    await Admin_apiPut(`/api/admin/modifycateg?categId=${categId}`, dto);
}
async function Admin_deleteCategory(categId) {
    await Admin_apiDelete(`/api/admin/deletecateg?categId=${categId}`);
}
async function Admin_renderCategoriesAdminTable() {
    const tbody = document.getElementById("adminCategoriesTbody");
    if (!tbody)
        return;
    try {
        const categories = await Admin_getAllCategories();
        tbody.innerHTML = "";
        for (const category of categories) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${category.categoryId}</td>
                <td>${category.categoryName}</td>
                <td>${category.categoryDescription}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-2" onclick="Admin_editCategory(${category.categoryId}, '${Admin_escapeJs(category.categoryName)}', '${Admin_escapeJs(category.categoryDescription)}')">
                        Módosítás
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="Admin_removeCategory(${category.categoryId})">
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
                <td colspan="4" class="text-danger text-center">Nem sikerült a kategóriák betöltése.</td>
            </tr>
        `;
    }
}
async function Admin_handleCategoryCreate(event) {
    event.preventDefault();
    try {
        const dto = {
            categoryName: document.getElementById("categoryName").value.trim(),
            categoryDescription: document.getElementById("categoryDescription").value.trim()
        };
        await Admin_createCategory(dto);
        Admin_showMessage("adminCategoryMessage", "Kategória létrehozva.");
        document.getElementById("categoryForm")?.reset();
        await Admin_renderCategoriesAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminCategoryMessage", error.message, true);
    }
}
function Admin_editCategory(categoryId, categoryName, categoryDescription) {
    document.getElementById("editCategoryId").value = String(categoryId);
    document.getElementById("editCategoryName").value = categoryName;
    document.getElementById("editCategoryDescription").value = categoryDescription;
}
async function Admin_handleCategoryUpdate(event) {
    event.preventDefault();
    try {
        const categoryId = Number(document.getElementById("editCategoryId").value);
        const dto = {
            categoryName: document.getElementById("editCategoryName").value.trim(),
            categoryDescription: document.getElementById("editCategoryDescription").value.trim()
        };
        await Admin_updateCategory(categoryId, dto);
        Admin_showMessage("adminCategoryEditMessage", "Kategória módosítva.");
        await Admin_renderCategoriesAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminCategoryEditMessage", error.message, true);
    }
}
async function Admin_removeCategory(categoryId) {
    if (!confirm("Biztosan törlöd ezt a kategóriát?"))
        return;
    try {
        await Admin_deleteCategory(categoryId);
        Admin_showMessage("adminCategoryMessage", "Kategória törölve.");
        await Admin_renderCategoriesAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminCategoryMessage", error.message, true);
    }
}
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
                    <button class="btn btn-warning btn-sm me-2" onclick="Admin_editRoom(${room.roomId}, '${Admin_escapeJs(room.roomName)}')">
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
// ===================== USERS =====================
async function Admin_getAllUsers() {
    return await Admin_apiGet("/api/admin/getalluser");
}
async function Admin_deleteUser(userId) {
    await Admin_apiDelete(`/api/admin/deleteuser?userId=${userId}`);
}
async function Admin_changeRole(userId, newRole, actAdminId) {
    await Admin_apiPut(`/api/admin/changerole?userId=${userId}&newRole=${encodeURIComponent(newRole)}&actAdminId=${actAdminId}`, null);
}
async function Admin_renderUsersAdminTable() {
    const tbody = document.getElementById("adminUsersTbody");
    if (!tbody)
        return;
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
                    <button class="btn btn-danger btn-sm" onclick="Admin_removeUser(${user.userId})">
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
                <td colspan="6" class="text-danger text-center">Nem sikerült a felhasználók betöltése.</td>
            </tr>
        `;
    }
}
async function Admin_toggleUserRole(userId, currentRole) {
    const adminId = Admin_getAdminId();
    if (!adminId) {
        Admin_showMessage("adminUserMessage", "Nincs eltárolt admin azonosító.", true);
        return;
    }
    const newRole = currentRole === "Admin" ? "User" : "Admin";
    try {
        await Admin_changeRole(userId, newRole, adminId);
        Admin_showMessage("adminUserMessage", `Szerepkör módosítva: ${newRole}`);
        await Admin_renderUsersAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminUserMessage", error.message, true);
    }
}
async function Admin_removeUser(userId) {
    if (!confirm("Biztosan törlöd ezt a felhasználót?"))
        return;
    try {
        await Admin_deleteUser(userId);
        Admin_showMessage("adminUserMessage", "Felhasználó törölve.");
        await Admin_renderUsersAdminTable();
    }
    catch (error) {
        Admin_showMessage("adminUserMessage", error.message, true);
    }
}
// ===================== RESERVATIONS =====================
async function Admin_getAllReservations() {
    return await Admin_apiGet("/api/admin/getallreservation");
}
async function Admin_updateReservation(reservationId, dto) {
    await Admin_apiPut(`/api/admin/modifyreservation?reservationId=${reservationId}`, dto);
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
        await Admin_updateReservation(reservationId, dto);
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
// ===================== IMAGE =====================
async function Admin_uploadImage(dto) {
    return await Admin_apiPost("/api/admin/uploadimage", dto);
}
async function Admin_deleteImage(imageId) {
    await Admin_apiDelete(`/api/admin/deleteimage?imageId=${imageId}`);
}
async function Admin_handleImageUpload(event) {
    event.preventDefault();
    try {
        const imageContent = document.getElementById("imageContentBase64").value.trim();
        const dto = { imageContent };
        const result = await Admin_uploadImage(dto);
        Admin_showMessage("adminImageMessage", `Kép feltöltve. Új imageId: ${result.imageId}`);
        const movieImageField = document.getElementById("movieImageId");
        if (movieImageField && result.imageId) {
            movieImageField.value = String(result.imageId);
        }
    }
    catch (error) {
        Admin_showMessage("adminImageMessage", error.message, true);
    }
}
async function Admin_handleImageDelete(event) {
    event.preventDefault();
    try {
        const imageId = Number(document.getElementById("deleteImageId").value);
        await Admin_deleteImage(imageId);
        Admin_showMessage("adminImageMessage", "Kép törölve.");
    }
    catch (error) {
        Admin_showMessage("adminImageMessage", error.message, true);
    }
}
// ===================== SELECT SEGÉDEK =====================
async function Admin_renderScreeningsMovieSelect() {
    const createSelect = document.getElementById("screeningMovieId");
    const editSelect = document.getElementById("editScreeningMovieId");
    const movies = await Admin_getAllMovies();
    for (const select of [createSelect, editSelect]) {
        if (!select)
            continue;
        select.innerHTML = "";
        for (const movie of movies) {
            const option = document.createElement("option");
            option.value = String(movie.movieId);
            option.textContent = movie.movieTitle;
            select.appendChild(option);
        }
    }
}
async function Admin_renderScreeningsRoomSelect() {
    const createSelect = document.getElementById("screeningRoomId");
    const editSelect = document.getElementById("editScreeningRoomId");
    const rooms = await Admin_getAllRooms();
    for (const select of [createSelect, editSelect]) {
        if (!select)
            continue;
        select.innerHTML = "";
        for (const room of rooms) {
            const option = document.createElement("option");
            option.value = String(room.roomId);
            option.textContent = room.roomName;
            select.appendChild(option);
        }
    }
}
// ===================== UTIL =====================
function Admin_escapeJs(value) {
    return value
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;")
        .replace(/\n/g, " ");
}
function Admin_toDateTimeLocalValue(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
// ===================== WINDOW EXPORT =====================
// @ts-ignore
window.Admin_handleMovieCreate = Admin_handleMovieCreate;
// @ts-ignore
window.Admin_handleMovieUpdate = Admin_handleMovieUpdate;
// @ts-ignore
window.Admin_removeMovie = Admin_removeMovie;
// @ts-ignore
window.Admin_editMovie = Admin_editMovie;
// @ts-ignore
window.Admin_handleScreeningCreate = Admin_handleScreeningCreate;
// @ts-ignore
window.Admin_handleScreeningUpdate = Admin_handleScreeningUpdate;
// @ts-ignore
window.Admin_removeScreening = Admin_removeScreening;
// @ts-ignore
window.Admin_editScreening = Admin_editScreening;
// @ts-ignore
window.Admin_handleTicketCreate = Admin_handleTicketCreate;
// @ts-ignore
window.Admin_handleTicketUpdate = Admin_handleTicketUpdate;
// @ts-ignore
window.Admin_removeTicket = Admin_removeTicket;
// @ts-ignore
window.Admin_editTicket = Admin_editTicket;
// @ts-ignore
window.Admin_handleCategoryCreate = Admin_handleCategoryCreate;
// @ts-ignore
window.Admin_handleCategoryUpdate = Admin_handleCategoryUpdate;
// @ts-ignore
window.Admin_removeCategory = Admin_removeCategory;
// @ts-ignore
window.Admin_editCategory = Admin_editCategory;
// @ts-ignore
window.Admin_handleRoomCreate = Admin_handleRoomCreate;
// @ts-ignore
window.Admin_handleRoomUpdate = Admin_handleRoomUpdate;
// @ts-ignore
window.Admin_removeRoom = Admin_removeRoom;
// @ts-ignore
window.Admin_editRoom = Admin_editRoom;
// @ts-ignore
window.Admin_toggleUserRole = Admin_toggleUserRole;
// @ts-ignore
window.Admin_removeUser = Admin_removeUser;
// @ts-ignore
window.Admin_handleReservationUpdate = Admin_handleReservationUpdate;
// @ts-ignore
window.Admin_removeReservation = Admin_removeReservation;
// @ts-ignore
window.Admin_editReservation = Admin_editReservation;
// @ts-ignore
window.Admin_handleImageUpload = Admin_handleImageUpload;
// @ts-ignore
window.Admin_handleImageDelete = Admin_handleImageDelete;
// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await Promise.all([
            Admin_renderMoviesAdminTable(),
            Admin_renderScreeningsAdminTable(),
            Admin_renderTicketsAdminTable(),
            Admin_renderCategoriesAdminTable(),
            Admin_renderRoomsAdminTable(),
            Admin_renderUsersAdminTable(),
            Admin_renderReservationsAdminTable(),
            Admin_renderScreeningsMovieSelect(),
            Admin_renderScreeningsRoomSelect()
        ]);
    }
    catch (error) {
        console.error("Admin init hiba:", error);
    }
});
