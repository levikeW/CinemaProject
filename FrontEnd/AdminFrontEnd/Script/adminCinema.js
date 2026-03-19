//npx tsc adminApi.ts adminMovies.ts adminCinema.ts adminTickets.ts adminCategories.ts --target ES2020 --lib ES2020,DOM
//http://localhost:5500/AdminFrontEnd/AdminBejelentkezes.html
// ===================== AUTH / SESSION =====================
function Admin_getAdminId() {
    const raw = localStorage.getItem("adminUserId");
    return raw ? Number(raw) : 0;
}
function Admin_setCurrentUserRole(role) {
    localStorage.setItem("currentUserRole", role);
}
function Admin_getCurrentUserRole() {
    return localStorage.getItem("currentUserRole") || "";
}
function Admin_setCurrentUserId(userId) {
    localStorage.setItem("currentUserId", String(userId));
}
function Admin_clearAuthData() {
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentUserRole");
    localStorage.removeItem("adminUserId");
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
        const [screenings, rooms] = await Promise.all([
            Admin_getAllScreenings(),
            Admin_getAllRooms()
        ]);
        tbody.innerHTML = "";
        for (const screening of screenings) {
            const room = rooms.find(r => r.roomId === screening.roomId);
            const roomName = screening.roomName ?? room?.roomName ?? `Terem #${screening.roomId}`;
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${screening.filmScreeningId}</td>
                <td>${screening.movieTitle}</td>
                <td>${roomName}</td>
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
async function Admin_renderScreeningsByMovie() {
    const container = document.getElementById("movieScreeningsContainer");
    if (!container)
        return;
    try {
        const [movies, screenings, rooms] = await Promise.all([
            Admin_getAllMovies(),
            Admin_getAllScreenings(),
            Admin_getAllRooms()
        ]);
        container.innerHTML = "";
        if (!screenings.length) {
            container.innerHTML = `
                <div class="alert alert-info">
                    Jelenleg nincs egyetlen vetítés sem.
                </div>
            `;
            return;
        }
        for (const screening of screenings) {
            const movie = movies.find(m => m.movieId === screening.movieId);
            const room = rooms.find(r => r.roomId === screening.roomId);
            const movieTitle = screening.movieTitle ?? movie?.movieTitle ?? `Film #${screening.movieId}`;
            const genre = movie?.genre ?? "-";
            const duration = movie?.duration ?? 0;
            const director = movie?.director ?? "-";
            const description = movie?.description ?? "";
            const roomName = screening.roomName ?? room?.roomName ?? `Terem #${screening.roomId}`;
            const screeningDate = new Date(screening.date).toLocaleString("hu-HU");
            const card = document.createElement("div");
            card.className = "movie-card kartya";
            card.innerHTML = `
                <div class="row g-4 align-items-start">
                    <div class="col-12 col-lg-8">
                        <h3>${movieTitle}</h3>
                        <p><strong>Vetítés ID:</strong> ${screening.filmScreeningId}</p>
                        <p><strong>Movie ID:</strong> ${screening.movieId}</p>
                        <p><strong>Kategória:</strong> ${genre}</p>
                        <p><strong>Hossz:</strong> ${duration} perc</p>
                        <p><strong>Rendező:</strong> ${director}</p>
                        <p><strong>Terem:</strong> ${roomName}</p>
                        <p><strong>Dátum:</strong> ${screeningDate}</p>
                        <p>${description}</p>
                    </div>

                    <div class="col-12 col-lg-4 text-lg-end">
                        <button class="btn btn-warning btn-sm me-2 mb-2"
                            onclick="Admin_editScreening(${screening.filmScreeningId}, ${screening.movieId}, ${screening.roomId}, '${screening.date}')">
                            Módosítás
                        </button>

                        <button class="btn btn-danger btn-sm mb-2"
                            onclick="Admin_removeScreening(${screening.filmScreeningId})">
                            Törlés
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        }
    }
    catch (error) {
        console.error(error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Nem sikerült a vetítések betöltése.
            </div>
        `;
    }
}
async function Admin_handleScreeningCreate(event) {
    event.preventDefault();
    try {
        const movieSelect = document.getElementById("screeningMovieId");
        const roomSelect = document.getElementById("screeningRoomId");
        const dto = {
            movieId: Number(movieSelect.value),
            movieTitle: movieSelect.options[movieSelect.selectedIndex].text,
            roomId: Number(roomSelect.value),
            roomName: roomSelect.options[roomSelect.selectedIndex].text,
            date: document.getElementById("screeningDate").value
        };
        await Admin_createScreening(dto);
        Admin_showMessage("adminScreeningMessage", "Vetítés létrehozva.");
        document.getElementById("screeningForm")?.reset();
        await Admin_renderScreeningsAdminTable();
        await Admin_renderScreeningsByMovie();
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
        const movieSelect = document.getElementById("editScreeningMovieId");
        const roomSelect = document.getElementById("editScreeningRoomId");
        const dto = {
            movieId: Number(movieSelect.value),
            movieTitle: movieSelect.options[movieSelect.selectedIndex].text,
            roomId: Number(roomSelect.value),
            roomName: roomSelect.options[roomSelect.selectedIndex].text,
            date: Admin_toIsoDateTime(document.getElementById("editScreeningDate").value)
        };
        await Admin_updateScreening(screeningId, dto);
        Admin_showMessage("adminScreeningEditMessage", "Vetítés módosítva.");
        await Admin_renderScreeningsAdminTable();
        await Admin_renderScreeningsByMovie();
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
        await Admin_renderScreeningsByMovie();
    }
    catch (error) {
        Admin_showMessage("adminScreeningMessage", error.message, true);
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
// ===================== LOGIN =====================
async function Admin_handleLoginSubmit(event) {
    event.preventDefault();
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const loginMessage = document.getElementById("loginMessage");
    if (!emailInput || !passwordInput)
        return;
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (loginMessage) {
        loginMessage.className = "mb-3";
        loginMessage.textContent = "";
    }
    try {
        const response = await fetch(`${Admin_API_BASE}/api/user/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            credentials: "include"
        });
        if (!response.ok) {
            const text = await response.text();
            if (loginMessage) {
                loginMessage.className = "text-danger mb-3";
                loginMessage.textContent = text || "Hibás email vagy jelszó.";
            }
            return;
        }
        const data = await response.json();
        Admin_setCurrentUserId(data.userId);
        Admin_setCurrentUserRole(data.role);
        if (data.role === "Admin") {
            Admin_setAdminId(data.userId);
        }
        if (loginMessage) {
            loginMessage.className = "text-success mb-3";
            loginMessage.textContent = "Sikeres bejelentkezés!";
        }
        if (data.role === "Admin") {
            window.location.replace("AdminCinema.html");
        }
        else {
            window.location.replace("AdminProfile.html");
        }
    }
    catch (err) {
        if (loginMessage) {
            loginMessage.className = "text-danger mb-3";
            loginMessage.textContent = "Hiba a bejelentkezés során.";
        }
    }
}
// ===================== LOGOUT =====================
async function Admin_handleLogout() {
    Admin_clearAuthData();
    try {
        await fetch(`${Admin_API_BASE}/api/user/logout`, {
            method: "POST",
            credentials: "include"
        });
    }
    catch { }
    window.location.href = "Bejelentkezes.html";
}
// ===================== REGIST =====================
async function Admin_handleRegisterSubmit(event) {
    event.preventDefault();
    const emailInput = document.getElementById("registerEmail");
    const fullNameInput = document.getElementById("registerFullName");
    const addressInput = document.getElementById("registerAddress");
    const passwordInput = document.getElementById("registerPassword");
    const passwordConfirmInput = document.getElementById("registerPasswordConfirm");
    const registerMessage = document.getElementById("registerMessage");
    if (!emailInput || !fullNameInput || !addressInput || !passwordInput || !passwordConfirmInput)
        return;
    if (registerMessage) {
        registerMessage.className = "mb-3";
        registerMessage.textContent = "";
    }
    if (passwordInput.value !== passwordConfirmInput.value) {
        if (registerMessage) {
            registerMessage.className = "text-danger mb-3";
            registerMessage.textContent = "A két jelszó nem egyezik.";
        }
        return;
    }
    try {
        const response = await fetch(`${Admin_API_BASE}/api/user/Regist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                Email: emailInput.value.trim(),
                FullName: fullNameInput.value.trim(),
                Password: passwordInput.value,
                BillingAddress: addressInput.value.trim()
            })
        });
        const text = await response.text();
        if (!response.ok) {
            if (registerMessage) {
                registerMessage.className = "text-danger mb-3";
                registerMessage.textContent = text || "Sikertelen regisztráció.";
            }
            return;
        }
        if (registerMessage) {
            registerMessage.className = "text-success mb-3";
            registerMessage.textContent = "Sikeres regisztráció!";
        }
        emailInput.value = "";
        fullNameInput.value = "";
        addressInput.value = "";
        passwordInput.value = "";
        passwordConfirmInput.value = "";
    }
    catch (err) {
        if (registerMessage) {
            registerMessage.className = "text-danger mb-3";
            registerMessage.textContent = "Hiba történt a regisztráció során.";
        }
    }
}
// ===================== PROFILE =====================
async function Admin_loadProfileData() {
    const emailField = document.getElementById("profileEmail");
    const fullNameField = document.getElementById("profileFullName");
    const billingField = document.getElementById("profileBilling");
    if (!emailField || !fullNameField || !billingField)
        return;
    try {
        const response = await fetch(`${Admin_API_BASE}/api/user/current`, {
            credentials: "include"
        });
        if (!response.ok)
            return;
        const user = await response.json();
        Admin_setCurrentUserId(user.userId);
        Admin_setCurrentUserRole(user.role);
        if (user.role === "Admin") {
            Admin_setAdminId(user.userId);
        }
        emailField.textContent = user.email;
        fullNameField.textContent = user.fullName;
        billingField.textContent = user.billingAddress;
    }
    catch { }
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
// ===================== DATE =====================
function Admin_toIsoDateTime(localValue) {
    if (!localValue)
        return "";
    return new Date(localValue).toISOString();
}
// ===================== UTIL =====================
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
window.Admin_handleScreeningCreate = Admin_handleScreeningCreate;
// @ts-ignore
window.Admin_handleScreeningUpdate = Admin_handleScreeningUpdate;
// @ts-ignore
window.Admin_removeScreening = Admin_removeScreening;
// @ts-ignore
window.Admin_editScreening = Admin_editScreening;
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
// @ts-ignore
window.Admin_handleLoginSubmit = Admin_handleLoginSubmit;
// @ts-ignore
window.Admin_handleLogout = Admin_handleLogout;
//@ts-ignore
window.Admin_handleRegisterSubmit = Admin_handleRegisterSubmit;
// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await Promise.all([
            Admin_renderScreeningsAdminTable(),
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
