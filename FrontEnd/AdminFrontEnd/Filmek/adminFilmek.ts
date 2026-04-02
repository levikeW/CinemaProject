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
    movieId: number;
    movieTitle: string;
    duration: number;
    genre: string;
    director: string;
    description: string;
    imageId: number;
}

interface ModifyMovieDto {
    movieId: number;
    movieTitle: string;
    duration: number;
    genre: string;
    director: string;
    description: string;
    imageId: number;
}

interface ImageDto {
    imageId?: number;
    imageContent: string | null;
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

async function Admin_loadMovieImage(movieId: number): Promise<void> {
    try {
        const result = await Admin_apiGet<ImageDto>(`/api/cinema/getimage?movieId=${movieId}`);
        if (!result?.imageContent) return;

        const img = document.getElementById(`img-${movieId}`) as HTMLImageElement;
        if (!img) return;

        img.src = `data:image/jpeg;base64,${result.imageContent}`;
    } catch {
    }
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

                <td>
                    <img id="img-${movie.movieId}" 
                         style="width:60px; height:80px; object-fit:cover;" />
                </td>

                <td>
                    <button class="btn btn-warning btn-sm me-2" 
                        onclick="Admin_editMovie(${movie.movieId}, '${window.Admin_escapeJs(movie.movieTitle)}', ${movie.duration}, '${window.Admin_escapeJs(movie.genre)}', '${window.Admin_escapeJs(movie.director)}', '${window.Admin_escapeJs(movie.description)}', ${movie.imageId ?? 0})">
                        Módosítás
                    </button>

                    <button class="btn btn-danger btn-sm" 
                        onclick="Admin_removeMovie(${movie.movieId})">
                        Törlés
                    </button>
                </td>
            `;

            tbody.appendChild(row);

            Admin_loadMovieImage(movie.movieId);
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
            movieId: 0,
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
            movieId: movieId,
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
window.Admin_loadMovieImage = Admin_loadMovieImage;

// ===================== INIT =====================

document.addEventListener("DOMContentLoaded", async () => {
    try {
        Admin_updateNavbarByAuth();
        await Admin_renderMoviesAdminTable();
        await Admin_renderScreeningsByMovie();
    } catch (error) {
        console.error("Admin tickets init hiba:", error);
    }
});