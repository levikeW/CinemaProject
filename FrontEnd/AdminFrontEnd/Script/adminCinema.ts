//npx tsc adminApi.ts adminCinema.ts adminTickets.ts --target ES2020 --lib ES2020,DOM
//http://localhost:5500/AdminFrontEnd/AdminBejelentkezes.html

// ===================== DTO =====================

interface MovieDto {
    movieId: number;
    movieTitle: string;
    duration: number;
    genre: string;
    director: string;
    description: string;
    imageId: number;
    screenings?: FilmScreeningDto[];
}

interface NewMovieDto {
    movieTitle: string;
    duration: number;
    genre: string;
    director: string;
    description: string;
    imageId: number;
}

interface ModifyMovieDto {
    movieTitle: string;
    duration: number;
    genre: string;
    director: string;
    description: string;
    imageId: number;
}

interface FilmScreeningDto {
    filmScreeningId: number;
    movieId: number;
    movieTitle: string;
    roomId: number;
    roomName: string;
    date: string;
}

interface NewScreeningDto {
    movieId: number;
    movieTitle: string;
    roomId: number;
    roomName: string;
    date: string;
}

interface ModifyFilmScreeningDto {
    movieId: number;
    movieTitle: string;
    roomId: number;
    roomName: string;
    date: string;
}

interface CategoriesDto {
    categoryId: number;
    categoryName: string;
    categoryDescription: string;
}

interface NewCategDto {
    categoryName: string;
    categoryDescription: string;
}

interface ModifyCategDto {
    categoryName: string;
    categoryDescription: string;
}

interface RoomDto {
    roomId: number;
    roomName: string;
}

interface NewRoomDto {
    roomName: string;
}

interface ModifyRoomDto {
    roomName: string;
}

interface UserDto {
    userId: number;
    email: string;
    fullName: string;
    billingAddress: string;
    role?: string;
}

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

interface ImageDto {
    imageId?: number;
    imageContent: string;
}

// ===================== AUTH / SESSION =====================

function Admin_getAdminId(): number {
    const raw = localStorage.getItem("adminUserId");
    return raw ? Number(raw) : 0;
}

function Admin_setCurrentUserRole(role: string): void {
    localStorage.setItem("currentUserRole", role);
}

function Admin_getCurrentUserRole(): string {
    return localStorage.getItem("currentUserRole") || "";
}

function Admin_setCurrentUserId(userId: number): void {
    localStorage.setItem("currentUserId", String(userId));
}

function Admin_clearAuthData(): void {
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("currentUserRole");
    localStorage.removeItem("adminUserId");
}

function Admin_setAdminId(id: number): void {
    localStorage.setItem("adminUserId", String(id));
}

function Admin_showMessage(targetId: string, message: string, isError = false): void {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.textContent = message;
    target.className = isError ? "alert alert-danger d-block" : "alert alert-success d-block";
}

// ===================== MOVIES =====================

async function Admin_getAllMovies(): Promise<MovieDto[]> {
    return await Admin_apiGet<MovieDto[]>("/api/cinema/getallmovies");
}

async function Admin_createMovie(dto: NewMovieDto): Promise<void> {
    await Admin_apiPost<NewMovieDto>("/api/admin/newmovie", dto);
}

async function Admin_updateMovie(movieId: number, dto: ModifyMovieDto): Promise<void> {
    await Admin_apiPut<ModifyMovieDto>(`/api/admin/modifymovie?movieId=${movieId}`, dto);
}

async function Admin_deleteMovie(movieId: number): Promise<void> {
    await Admin_apiDelete(`/api/admin/deletemovie?movieId=${movieId}`);
}

async function Admin_renderMoviesAdminTable(): Promise<void> {
    const tbody = document.getElementById("adminMoviesTbody") as HTMLTableSectionElement | null;
    if (!tbody) return;

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
                <button class="btn btn-warning btn-sm me-2" onclick="Admin_editMovie(${movie.movieId}, '${window.Admin_escapeJs(movie.movieTitle)}', ${movie.duration}, '${window.Admin_escapeJs(movie.genre)}', '${window.Admin_escapeJs(movie.director)}', '${window.Admin_escapeJs(movie.description)}', ${movie.imageId ?? 0})">
                    Módosítás
                </button>
                <button class="btn btn-danger btn-sm" onclick="Admin_removeMovie(${movie.movieId})">
                    Törlés
                </button>
    </td>
`;
            tbody.appendChild(row);
        }
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-danger text-center">Nem sikerült a filmek betöltése.</td>
            </tr>
        `;
    }
}

async function Admin_handleMovieCreate(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const dto: NewMovieDto = {
            movieTitle: (document.getElementById("movieTitle") as HTMLInputElement).value.trim(),
            duration: Number((document.getElementById("movieDuration") as HTMLInputElement).value),
            genre: (document.getElementById("movieGenre") as HTMLInputElement).value.trim(),
            director: (document.getElementById("movieDirector") as HTMLInputElement).value.trim(),
            description: (document.getElementById("movieDescription") as HTMLInputElement).value.trim(),
            imageId: Number((document.getElementById("movieImageId") as HTMLInputElement).value || "0")
        };

        await Admin_createMovie(dto);
        Admin_showMessage("adminMovieMessage", "Film sikeresen létrehozva.");
        (document.getElementById("movieForm") as HTMLFormElement | null)?.reset();
        await Admin_renderMoviesAdminTable();
        await Admin_renderScreeningsMovieSelect();
    } catch (error) {
        Admin_showMessage("adminMovieMessage", (error as Error).message, true);
    }
}

async function Admin_removeMovie(movieId: number): Promise<void> {
    if (!confirm("Biztosan törlöd ezt a filmet?")) return;

    try {
        await Admin_deleteMovie(movieId);
        Admin_showMessage("adminMovieMessage", "Film törölve.");
        await Admin_renderMoviesAdminTable();
    } catch (error) {
        Admin_showMessage("adminMovieMessage", (error as Error).message, true);
    }
}

function Admin_editMovie(
    movieId: number,
    movieTitle: string,
    duration: number,
    genre: string,
    director: string,
    description: string,
    imageId: number
): void {
    (document.getElementById("editMovieId") as HTMLInputElement).value = String(movieId);
    (document.getElementById("editMovieTitle") as HTMLInputElement).value = movieTitle;
    (document.getElementById("editMovieDuration") as HTMLInputElement).value = String(duration);
    (document.getElementById("editMovieGenre") as HTMLInputElement).value = genre;
    (document.getElementById("editMovieDirector") as HTMLInputElement).value = director;
    (document.getElementById("editMovieDescription") as HTMLInputElement).value = description;
    (document.getElementById("editMovieImageId") as HTMLInputElement).value = String(imageId);
}

async function Admin_handleMovieUpdate(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const movieId = Number((document.getElementById("editMovieId") as HTMLInputElement).value);

        const dto: ModifyMovieDto = {
            movieTitle: (document.getElementById("editMovieTitle") as HTMLInputElement).value.trim(),
            duration: Number((document.getElementById("editMovieDuration") as HTMLInputElement).value),
            genre: (document.getElementById("editMovieGenre") as HTMLInputElement).value.trim(),
            director: (document.getElementById("editMovieDirector") as HTMLInputElement).value.trim(),
            description: (document.getElementById("editMovieDescription") as HTMLInputElement).value.trim(),
            imageId: Number((document.getElementById("editMovieImageId") as HTMLInputElement).value || "0")
        };

        await Admin_updateMovie(movieId, dto);
        Admin_showMessage("adminMovieEditMessage", "Film módosítva.");
        await Admin_renderMoviesAdminTable();
        await Admin_renderScreeningsMovieSelect();
    } catch (error) {
        Admin_showMessage("adminMovieEditMessage", (error as Error).message, true);
    }
}

// ===================== SCREENINGS =====================

async function Admin_getAllScreenings(): Promise<FilmScreeningDto[]> {
    return await Admin_apiGet<FilmScreeningDto[]>("/api/cinema/getallscreenings");
}

async function Admin_createScreening(dto: NewScreeningDto): Promise<void> {
    await Admin_apiPost<NewScreeningDto>("/api/admin/newscreening", dto);
}

async function Admin_updateScreening(screeningId: number, dto: ModifyFilmScreeningDto): Promise<void> {
    await Admin_apiPut<ModifyFilmScreeningDto>(`/api/admin/modifyfilmscreening?screeningId=${screeningId}`, dto);
}

async function Admin_deleteScreening(screeningId: number): Promise<void> {
    await Admin_apiDelete(`/api/admin/deletescreening?screeningId=${screeningId}`);
}

async function Admin_renderScreeningsAdminTable(): Promise<void> {
    const tbody = document.getElementById("adminScreeningsTbody") as HTMLTableSectionElement | null;
    if (!tbody) return;

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
    } catch (error) {
        console.error(error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-danger text-center">Nem sikerült a vetítések betöltése.</td>
            </tr>
        `;
    }
}

async function Admin_renderScreeningsByMovie(): Promise<void> {
    const container = document.getElementById("movieScreeningsContainer") as HTMLDivElement | null;
    if (!container) return;

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
    } catch (error) {
        console.error(error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Nem sikerült a vetítések betöltése.
            </div>
        `;
    }
}

async function Admin_handleScreeningCreate(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const movieSelect = document.getElementById("screeningMovieId") as HTMLSelectElement;
        const roomSelect = document.getElementById("screeningRoomId") as HTMLSelectElement;

        const dto = {
            movieId: Number(movieSelect.value),
            movieTitle: movieSelect.options[movieSelect.selectedIndex].text,
            roomId: Number(roomSelect.value),
            roomName: roomSelect.options[roomSelect.selectedIndex].text,
            date: (document.getElementById("screeningDate") as HTMLInputElement).value
        };

        await Admin_createScreening(dto as any);

        Admin_showMessage("adminScreeningMessage", "Vetítés létrehozva.");
        (document.getElementById("screeningForm") as HTMLFormElement | null)?.reset();

        await Admin_renderScreeningsAdminTable();
        await Admin_renderScreeningsByMovie();

    } catch (error) {
        Admin_showMessage("adminScreeningMessage", (error as Error).message, true);
    }
}

function Admin_editScreening(screeningId: number, movieId: number, roomId: number, date: string): void {
    (document.getElementById("editScreeningId") as HTMLInputElement).value = String(screeningId);
    (document.getElementById("editScreeningMovieId") as HTMLSelectElement).value = String(movieId);
    (document.getElementById("editScreeningRoomId") as HTMLSelectElement).value = String(roomId);
    (document.getElementById("editScreeningDate") as HTMLInputElement).value = Admin_toDateTimeLocalValue(date);
}

async function Admin_handleScreeningUpdate(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const screeningId = Number((document.getElementById("editScreeningId") as HTMLInputElement).value);

        const movieSelect = document.getElementById("editScreeningMovieId") as HTMLSelectElement;
        const roomSelect = document.getElementById("editScreeningRoomId") as HTMLSelectElement;

        const dto = {
            movieId: Number(movieSelect.value),
            movieTitle: movieSelect.options[movieSelect.selectedIndex].text,
            roomId: Number(roomSelect.value),
            roomName: roomSelect.options[roomSelect.selectedIndex].text,
           date: Admin_toIsoDateTime((document.getElementById("editScreeningDate") as HTMLInputElement).value)
        };

        await Admin_updateScreening(screeningId, dto as any);
        Admin_showMessage("adminScreeningEditMessage", "Vetítés módosítva.");

        await Admin_renderScreeningsAdminTable();
        await Admin_renderScreeningsByMovie();
    } catch (error) {
        Admin_showMessage("adminScreeningEditMessage", (error as Error).message, true);
    }
}

async function Admin_removeScreening(screeningId: number): Promise<void> {
    if (!confirm("Biztosan törlöd ezt a vetítést?")) return;

    try {
        await Admin_deleteScreening(screeningId);
        Admin_showMessage("adminScreeningMessage", "Vetítés törölve.");

        await Admin_renderScreeningsAdminTable();
        await Admin_renderScreeningsByMovie();
    } catch (error) {
        Admin_showMessage("adminScreeningMessage", (error as Error).message, true);
    }
}
// ===================== CATEGORIES =====================

async function Admin_getAllCategories(): Promise<CategoriesDto[]> {
    return await Admin_apiGet<CategoriesDto[]>("/api/cinema/getallcateg");
}

async function Admin_createCategory(dto: NewCategDto): Promise<void> {
    await Admin_apiPost<NewCategDto>("/api/admin/newcateg", dto);
}

async function Admin_updateCategory(categId: number, dto: ModifyCategDto): Promise<void> {
    await Admin_apiPut<ModifyCategDto>(`/api/admin/modifycateg?categId=${categId}`, dto);
}

async function Admin_deleteCategory(categId: number): Promise<void> {
    await Admin_apiDelete(`/api/admin/deletecateg?categId=${categId}`);
}

async function Admin_renderCategoriesAdminTable(): Promise<void> {
    const tbody = document.getElementById("adminCategoriesTbody") as HTMLTableSectionElement | null;
    if (!tbody) return;

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
                    <button class="btn btn-warning btn-sm me-2" onclick="Admin_editCategory(${category.categoryId}, '${window.Admin_escapeJs(category.categoryName)}', '${window.Admin_escapeJs(category.categoryDescription)}')">
                        Módosítás
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="Admin_removeCategory(${category.categoryId})">
                        Törlés
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        }
    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-danger text-center">Nem sikerült a kategóriák betöltése.</td>
            </tr>
        `;
    }
}

async function Admin_handleCategoryCreate(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const dto: NewCategDto = {
            categoryName: (document.getElementById("categoryName") as HTMLInputElement).value.trim(),
            categoryDescription: (document.getElementById("categoryDescription") as HTMLInputElement).value.trim()
        };

        await Admin_createCategory(dto);
        Admin_showMessage("adminCategoryMessage", "Kategória létrehozva.");
        (document.getElementById("categoryForm") as HTMLFormElement | null)?.reset();
        await Admin_renderCategoriesAdminTable();
    } catch (error) {
        Admin_showMessage("adminCategoryMessage", (error as Error).message, true);
    }
}

function Admin_editCategory(categoryId: number, categoryName: string, categoryDescription: string): void {
    (document.getElementById("editCategoryId") as HTMLInputElement).value = String(categoryId);
    (document.getElementById("editCategoryName") as HTMLInputElement).value = categoryName;
    (document.getElementById("editCategoryDescription") as HTMLInputElement).value = categoryDescription;
}

async function Admin_handleCategoryUpdate(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const categoryId = Number((document.getElementById("editCategoryId") as HTMLInputElement).value);
        const dto: ModifyCategDto = {
            categoryName: (document.getElementById("editCategoryName") as HTMLInputElement).value.trim(),
            categoryDescription: (document.getElementById("editCategoryDescription") as HTMLInputElement).value.trim()
        };

        await Admin_updateCategory(categoryId, dto);
        Admin_showMessage("adminCategoryEditMessage", "Kategória módosítva.");
        await Admin_renderCategoriesAdminTable();
    } catch (error) {
        Admin_showMessage("adminCategoryEditMessage", (error as Error).message, true);
    }
}

async function Admin_removeCategory(categoryId: number): Promise<void> {
    if (!confirm("Biztosan törlöd ezt a kategóriát?")) return;

    try {
        await Admin_deleteCategory(categoryId);
        Admin_showMessage("adminCategoryMessage", "Kategória törölve.");
        await Admin_renderCategoriesAdminTable();
    } catch (error) {
        Admin_showMessage("adminCategoryMessage", (error as Error).message, true);
    }
}

// ===================== ROOMS =====================

async function Admin_getAllRooms(): Promise<RoomDto[]> {
    return await Admin_apiGet<RoomDto[]>("/api/cinema/getallrooms");
}

async function Admin_createRoom(dto: NewRoomDto): Promise<void> {
    await Admin_apiPost<NewRoomDto>("/api/admin/newroom", dto);
}

async function Admin_updateRoom(roomId: number, dto: ModifyRoomDto): Promise<void> {
    await Admin_apiPut<ModifyRoomDto>(`/api/admin/modifyroom?roomId=${roomId}`, dto);
}

async function Admin_deleteRoom(roomId: number): Promise<void> {
    await Admin_apiDelete(`/api/admin/deleteroom?roomId=${roomId}`);
}

async function Admin_renderRoomsAdminTable(): Promise<void> {
    const tbody = document.getElementById("adminRoomsTbody") as HTMLTableSectionElement | null;
    if (!tbody) return;

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
    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-danger text-center">Nem sikerült a termek betöltése.</td>
            </tr>
        `;
    }
}

async function Admin_handleRoomCreate(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const dto: NewRoomDto = {
            roomName: (document.getElementById("roomName") as HTMLInputElement).value.trim()
        };

        await Admin_createRoom(dto);
        Admin_showMessage("adminRoomMessage", "Terem létrehozva.");
        (document.getElementById("roomForm") as HTMLFormElement | null)?.reset();
        await Admin_renderRoomsAdminTable();
        await Admin_renderScreeningsRoomSelect();
    } catch (error) {
        Admin_showMessage("adminRoomMessage", (error as Error).message, true);
    }
}

function Admin_editRoom(roomId: number, roomName: string): void {
    (document.getElementById("editRoomId") as HTMLInputElement).value = String(roomId);
    (document.getElementById("editRoomName") as HTMLInputElement).value = roomName;
}

async function Admin_handleRoomUpdate(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const roomId = Number((document.getElementById("editRoomId") as HTMLInputElement).value);
        const dto: ModifyRoomDto = {
            roomName: (document.getElementById("editRoomName") as HTMLInputElement).value.trim()
        };

        await Admin_updateRoom(roomId, dto);
        Admin_showMessage("adminRoomEditMessage", "Terem módosítva.");
        await Admin_renderRoomsAdminTable();
        await Admin_renderScreeningsRoomSelect();
    } catch (error) {
        Admin_showMessage("adminRoomEditMessage", (error as Error).message, true);
    }
}

async function Admin_removeRoom(roomId: number): Promise<void> {
    if (!confirm("Biztosan törlöd ezt a termet?")) return;

    try {
        await Admin_deleteRoom(roomId);
        Admin_showMessage("adminRoomMessage", "Terem törölve.");
        await Admin_renderRoomsAdminTable();
    } catch (error) {
        Admin_showMessage("adminRoomMessage", (error as Error).message, true);
    }
}

// ===================== USERS =====================

async function Admin_getAllUsers(): Promise<UserDto[]> {
    return await Admin_apiGet<UserDto[]>("/api/admin/getalluser");
}

async function Admin_deleteUser(userId: number): Promise<void> {
    await Admin_apiDelete(`/api/admin/deleteuser?userId=${userId}`);
}

async function Admin_changeRole(userId: number, newRole: string, actAdminId: number): Promise<void> {
    await Admin_apiPut<null>(`/api/admin/changerole?userId=${userId}&newRole=${encodeURIComponent(newRole)}&actAdminId=${actAdminId}`, null);
}

async function Admin_renderUsersAdminTable(): Promise<void> {
    const tbody = document.getElementById("adminUsersTbody") as HTMLTableSectionElement | null;
    if (!tbody) return;

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
    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-danger text-center">Nem sikerült a felhasználók betöltése.</td>
            </tr>
        `;
    }
}

async function Admin_toggleUserRole(userId: number, currentRole: string): Promise<void> {
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
    } catch (error) {
        Admin_showMessage("adminUserMessage", (error as Error).message, true);
    }
}

async function Admin_removeUser(userId: number): Promise<void> {
    if (!confirm("Biztosan törlöd ezt a felhasználót?")) return;

    try {
        await Admin_deleteUser(userId);
        Admin_showMessage("adminUserMessage", "Felhasználó törölve.");
        await Admin_renderUsersAdminTable();
    } catch (error) {
        Admin_showMessage("adminUserMessage", (error as Error).message, true);
    }
}

// ===================== RESERVATIONS =====================

async function Admin_getAllReservations(): Promise<PaymentReservationDto[]> {
    return await Admin_apiGet<PaymentReservationDto[]>("/api/admin/getallreservation");
}

async function Admin_updateReservation(reservationId: number, dto: ModifyReservationDto): Promise<void> {
    await Admin_apiPut<ModifyReservationDto>(`/api/admin/modifyreservation?reservationId=${reservationId}`, dto);
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
            date: (document.getElementById("editReservationDate") as HTMLInputElement).value,
            isPaid: (document.getElementById("editReservationIsPaid") as HTMLSelectElement).value === "true",
            filmScreeningId: Number((document.getElementById("editReservationScreeningId") as HTMLInputElement).value),
            amount: Number((document.getElementById("editReservationAmount") as HTMLInputElement).value),
            price: Number((document.getElementById("editReservationPrice") as HTMLInputElement).value),
            userId: Number((document.getElementById("editReservationUserId") as HTMLInputElement).value),
            seats
        };

        await Admin_updateReservation(reservationId, dto);
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

// ===================== IMAGE =====================

async function Admin_uploadImage(dto: ImageDto): Promise<ImageDto> {
    return await Admin_apiPost<ImageDto, ImageDto>("/api/admin/uploadimage", dto);
}

async function Admin_deleteImage(imageId: number): Promise<void> {
    await Admin_apiDelete(`/api/admin/deleteimage?imageId=${imageId}`);
}

async function Admin_handleImageUpload(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const imageContent = (document.getElementById("imageContentBase64") as HTMLTextAreaElement).value.trim();
        const dto: ImageDto = { imageContent };
        const result = await Admin_uploadImage(dto);

        Admin_showMessage("adminImageMessage", `Kép feltöltve. Új imageId: ${result.imageId}`);
        const movieImageField = document.getElementById("movieImageId") as HTMLInputElement | null;
        if (movieImageField && result.imageId) {
            movieImageField.value = String(result.imageId);
        }
    } catch (error) {
        Admin_showMessage("adminImageMessage", (error as Error).message, true);
    }
}

async function Admin_handleImageDelete(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const imageId = Number((document.getElementById("deleteImageId") as HTMLInputElement).value);
        await Admin_deleteImage(imageId);
        Admin_showMessage("adminImageMessage", "Kép törölve.");
    } catch (error) {
        Admin_showMessage("adminImageMessage", (error as Error).message, true);
    }
}

// ===================== LOGIN =====================

async function Admin_handleLoginSubmit(event: Event) {
    event.preventDefault();

    const emailInput = document.getElementById("loginEmail") as HTMLInputElement;
    const passwordInput = document.getElementById("loginPassword") as HTMLInputElement;
    const loginMessage = document.getElementById("loginMessage") as HTMLElement | null;

    if (!emailInput || !passwordInput) return;

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

        const data = await response.json() as { userId: number; role: string };

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
        } else {
            window.location.replace("Profile.html");
        }

    } catch (err) {

        if (loginMessage) {
            loginMessage.className = "text-danger mb-3";
            loginMessage.textContent = "Hiba a bejelentkezés során.";
        }

    }
}

// ===================== LOGOUT =====================

async function Admin_handleLogout(): Promise<void> {

    Admin_clearAuthData();

    try {
        await fetch(`${Admin_API_BASE}/api/user/logout`, {
            method: "POST",
            credentials: "include"
        });
    } catch {}

    window.location.href = "Bejelentkezes.html";
}

// ===================== REGIST =====================

async function Admin_handleRegisterSubmit(event: Event): Promise<void> {
    event.preventDefault();

    const emailInput = document.getElementById("registerEmail") as HTMLInputElement;
    const fullNameInput = document.getElementById("registerFullName") as HTMLInputElement;
    const addressInput = document.getElementById("registerAddress") as HTMLInputElement;
    const passwordInput = document.getElementById("registerPassword") as HTMLInputElement;
    const passwordConfirmInput = document.getElementById("registerPasswordConfirm") as HTMLInputElement;
    const registerMessage = document.getElementById("registerMessage") as HTMLElement | null;

    if (!emailInput || !fullNameInput || !addressInput || !passwordInput || !passwordConfirmInput) return;

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
    } catch (err) {
        if (registerMessage) {
            registerMessage.className = "text-danger mb-3";
            registerMessage.textContent = "Hiba történt a regisztráció során.";
        }
    }
}

// ===================== PROFILE =====================

async function Admin_loadProfileData(): Promise<void> {

    const emailField = document.getElementById("profileEmail");
    const fullNameField = document.getElementById("profileFullName");
    const billingField = document.getElementById("profileBilling");

    if (!emailField || !fullNameField || !billingField) return;

    try {

        const response = await fetch(`${Admin_API_BASE}/api/user/current`, {
            credentials: "include"
        });

        if (!response.ok) return;

        const user = await response.json() as {
            userId: number
            email: string
            fullName: string
            billingAddress: string
            role: string
        };

        Admin_setCurrentUserId(user.userId);
        Admin_setCurrentUserRole(user.role);

        if (user.role === "Admin") {
            Admin_setAdminId(user.userId);
        }

        emailField.textContent = user.email;
        fullNameField.textContent = user.fullName;
        billingField.textContent = user.billingAddress;

    } catch {}

}

// ===================== SELECT SEGÉDEK =====================

async function Admin_renderScreeningsMovieSelect(): Promise<void> {
    const createSelect = document.getElementById("screeningMovieId") as HTMLSelectElement | null;
    const editSelect = document.getElementById("editScreeningMovieId") as HTMLSelectElement | null;

    const movies = await Admin_getAllMovies();

    for (const select of [createSelect, editSelect]) {
        if (!select) continue;
        select.innerHTML = "";
        for (const movie of movies) {
            const option = document.createElement("option");
            option.value = String(movie.movieId);
            option.textContent = movie.movieTitle;
            select.appendChild(option);
        }
    }
}

async function Admin_renderScreeningsRoomSelect(): Promise<void> {
    const createSelect = document.getElementById("screeningRoomId") as HTMLSelectElement | null;
    const editSelect = document.getElementById("editScreeningRoomId") as HTMLSelectElement | null;

    const rooms = await Admin_getAllRooms();

    for (const select of [createSelect, editSelect]) {
        if (!select) continue;
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

function Admin_toIsoDateTime(localValue: string): string {
    if (!localValue) return "";
    return new Date(localValue).toISOString();
}

// ===================== UTIL =====================
function Admin_toDateTimeLocalValue(date: string): string {
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
            Admin_renderMoviesAdminTable(),
            Admin_renderScreeningsAdminTable(),
            Admin_renderScreeningsByMovie(),
            Admin_renderCategoriesAdminTable(),
            Admin_renderRoomsAdminTable(),
            Admin_renderUsersAdminTable(),
            Admin_renderReservationsAdminTable(),
            Admin_renderScreeningsMovieSelect(),
            Admin_renderScreeningsRoomSelect()
        ]);
    } catch (error) {
        console.error("Admin init hiba:", error);
    }
});