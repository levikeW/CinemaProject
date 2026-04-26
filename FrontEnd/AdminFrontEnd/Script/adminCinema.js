//npx tsc adminApi.ts adminCommon.ts adminMovies.ts adminRooms.ts adminReservation.ts adminCinema.ts adminTickets.ts adminCategories.ts adminFelhasznalok.ts --target ES2020 --lib ES2020,DOM
//http://localhost:5500/AdminFrontEnd/AdminBejelentkezes.html
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
// ===================== LOGIN =====================
async function Admin_handleLoginSubmit(event) {
    event.preventDefault();
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const loginMessage = document.getElementById("loginMessage");
    if (!emailInput || !passwordInput)
        return;
    try {
        const data = await Admin_apiPost("/api/user/login", { email: emailInput.value.trim(), password: passwordInput.value });
        if (data.role !== "Admin")
            throw new Error("Csak admin jogosultsággal lehet belépni.");
        await Admin_loadProfileData();
        Admin_updateNavbarByAuth();
        if (loginMessage) {
            loginMessage.className = "text-success mb-3";
            loginMessage.textContent = "Sikeres bejelentkezés!";
        }
        window.location.replace("AdminCinema.html");
    }
    catch (err) {
        if (loginMessage) {
            loginMessage.className = "text-danger mb-3";
            loginMessage.textContent = err.message || "Hiba a bejelentkezés során.";
        }
    }
}
// ===================== LOGOUT =====================
async function Admin_handleLogout() {
    Admin_clearAuthData();
    Admin_updateNavbarByAuth();
    try {
        await Admin_apiPost("/api/user/logout", null);
    }
    catch { }
    window.location.href = "AdminBejelentkezes.html";
}
// ===================== REGISTER =====================
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
        await Admin_apiPost("/api/user/Regist", {
            Email: emailInput.value.trim(),
            FullName: fullNameInput.value.trim(),
            Password: passwordInput.value,
            BillingAddress: addressInput.value.trim()
        });
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
            registerMessage.textContent = err.message || "Hiba történt a regisztráció során.";
        }
    }
}
async function Admin_loadProfileData() {
    try {
        const user = await Admin_apiGet("/api/user/getmydata");
        if (user.role !== "Admin") {
            window.location.replace("AdminBejelentkezes.html");
            return;
        }
        Admin_setCurrentUserId(user.userId);
        Admin_setCurrentUserRole(user.role);
        Admin_setAdminId(user.userId);
    }
    catch {
        window.location.replace("AdminBejelentkezes.html");
    }
}
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
window.Admin_handleLoginSubmit = Admin_handleLoginSubmit;
// @ts-ignore
window.Admin_loadProfileData = Admin_loadProfileData;
// @ts-ignore
window.Admin_handleLogout = Admin_handleLogout;
//@ts-ignore
window.Admin_handleRegisterSubmit = Admin_handleRegisterSubmit;
// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", async () => {
    Admin_updateNavbarByAuth();
    const isLoginPage = !!document.getElementById("loginEmail");
    if (isLoginPage)
        return;
    try {
        await Admin_loadProfileData();
        await Promise.all([
            Admin_renderScreeningsAdminTable(),
            Admin_renderScreeningsMovieSelect(),
            Admin_renderScreeningsRoomSelect(),
            Admin_renderScreeningsByMovie()
        ]);
    }
    catch (error) {
        console.error("Admin init hiba:", error);
    }
});
