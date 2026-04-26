import { fetchCategoriesList, fetchImages, fetchMoviesList, fetchRoomsList } from "../Core/api.js";
import { getImageSource, moviePosterFallbacks } from "../Core/common.js";
import { applyLoginState } from "./auth.js";
import { setSelectedScreeningState, SelectedScreeningState } from "../Termek/terem.js";

interface FilmScreeningDto {
    filmScreeningId: number;
    movieId: number;
    movieTitle: string;
    roomId: number;
    roomName: string | null;
    date: string;
}

interface RoomDto {
    roomId: number;
    roomName: string;
    seats?: unknown[];
}

interface MovieDto {
    movieId: number;
    movieTitle: string;
    duration: number;
    genre: string;
    director: string;
    description: string;
    imageId: number;
    screenings: FilmScreeningDto[];
}

interface ImageDto {
    imageId?: number;
    imageContent: string | number[];
}

interface CategoriesDto {
    id?: number;
    categId?: number;
    name?: string;
    categName?: string;
    description?: string;
    categoryId?: number;
    categoryName?: string;
    categoryDescription?: string;
}

const movieList = document.getElementById("movieList") as HTMLElement | null;
const locationFilter = document.getElementById("locationFilter") as HTMLSelectElement | null;
const genreFilter = document.getElementById("genreFilter") as HTMLSelectElement | null;
const movieFilter = document.getElementById("movieFilter") as HTMLSelectElement | null;
const dateFilter = document.getElementById("dateFilter") as HTMLInputElement | null;
const movieSearchInput = document.getElementById("movieSearchInput") as HTMLInputElement | null;

// Ide töltjük be az adatokat
let allMovies: MovieDto[] = [];
let allRooms: RoomDto[] = [];
let allCategories: CategoriesDto[] = [];

// Kategória nevének kiolvasása
export function getCategoryName(category: CategoriesDto): string {
    return (category.categoryName ?? category.categName ?? category.name ?? "").trim();
}

// Filmhez fallback poszter kiválasztása
export function getMovieFallbackPoster(movie: MovieDto): string {
    const normalizedTitle = movie.movieTitle.trim().toLowerCase();
    return moviePosterFallbacks[normalizedTitle] ?? "Logo.png";
}

// Film leírás visszaadása
// Ha van saját fordításunk, azt használjuk, különben a backendből jött leírást
export function getMovieDescription(movie: MovieDto): string {
    return movie.description ? movie.description : "Nincs leírás.";
}

// Terem neve visszaadása
// Ha nincs roomName megadva, megpróbáljuk a roomId alapján megtalálni
export function getRoomLabel(roomId: number, roomName?: string | null): string {
    if (roomName && roomName.trim()) {
        return roomName;
    }

    for (let i = 0; i < allRooms.length; i++) {
        if (allRooms[i].roomId === roomId) {
            return allRooms[i].roomName;
        }
    }

    return `Terem #${roomId}`;
}

// Terem lekérése roomId alapján
export function getRoomById(roomId: number): RoomDto | undefined {
    for (let i = 0; i < allRooms.length; i++) {
        if (allRooms[i].roomId === roomId) {
            return allRooms[i];
        }
    }

    return undefined;
}

// A film vetítéseit úgy alakítjuk át, hogy mindegyiknél biztosan legyen rendes teremnév
export function normalizeMovieScreenings(movie: MovieDto): MovieDto {
    const normalizedScreenings: FilmScreeningDto[] = [];

    for (let i = 0; i < movie.screenings.length; i++) {
        const screening = movie.screenings[i];

        normalizedScreenings.push({
            filmScreeningId: screening.filmScreeningId,
            movieId: screening.movieId,
            movieTitle: screening.movieTitle,
            roomId: screening.roomId,
            roomName: getRoomLabel(screening.roomId, screening.roomName),
            date: screening.date,
        });
    }

    return {
        movieId: movie.movieId,
        movieTitle: movie.movieTitle,
        duration: movie.duration,
        genre: movie.genre,
        director: movie.director,
        description: movie.description,
        imageId: movie.imageId,
        screenings: normalizedScreenings,
    };
}

// Termek betöltése, ha még nincsenek memóriában
export async function ensureRoomsLoaded(): Promise<RoomDto[]> {
    if (allRooms.length === 0) {
        allRooms = await fetchRoomsList() as RoomDto[];
    }

    return allRooms;
}

// Filmek, termek és kategóriák betöltése egyszerre
export async function ensureMoviesLoaded(): Promise<MovieDto[]> {
    if (allMovies.length === 0) {
        const movies = await fetchMoviesList() as MovieDto[];
        const rooms = await fetchRoomsList() as RoomDto[];
        const categories = await fetchCategoriesList() as CategoriesDto[];

        allRooms = rooms;
        allCategories = categories;

        const normalizedMovies: MovieDto[] = [];

        for (let i = 0; i < movies.length; i++) {
            normalizedMovies.push(normalizeMovieScreenings(movies[i]));
        }

        allMovies = normalizedMovies;
    }

    return allMovies;
}

// Egy select feltöltése opciókkal
export function renderMovieOptions(
    select: HTMLSelectElement | null,
    values: string[],
    defaultLabel: string,
    getLabel?: (value: string) => string,
): void {
    if (!select) {
        return;
    }

    const currentValue = select.value;
    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultLabel;
    select.appendChild(defaultOption);

    for (let i = 0; i < values.length; i++) {
        const value = values[i];
        const option = document.createElement("option");
        option.value = value;
        option.textContent = getLabel ? getLabel(value) : value;
        select.appendChild(option);
    }

    // Ha a korábban kiválasztott érték még mindig létezik, visszaállítjuk
    let valueStillExists = false;

    for (let i = 0; i < values.length; i++) {
        if (values[i] === currentValue) {
            valueStillExists = true;
            break;
        }
    }

    if (valueStillExists) {
        select.value = currentValue;
    }
}

// A szűrők feltöltése az aktuális filmek alapján
export function populateMovieFilters(movies: MovieDto[]): void {
    const roomIds: number[] = [];
    const movieTitles: string[] = [];

    for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];

        for (let j = 0; j < movie.screenings.length; j++) {
            const roomId = movie.screenings[j].roomId;

            let roomExists = false;
            for (let k = 0; k < roomIds.length; k++) {
                if (roomIds[k] === roomId) {
                    roomExists = true;
                    break;
                }
            }

            if (!roomExists) {
                roomIds.push(roomId);
            }
        }

        if (movie.movieTitle) {
            let titleExists = false;

            for (let j = 0; j < movieTitles.length; j++) {
                if (movieTitles[j] === movie.movieTitle) {
                    titleExists = true;
                    break;
                }
            }

            if (!titleExists) {
                movieTitles.push(movie.movieTitle);
            }
        }
    }

    roomIds.sort(function (a, b) {
        return a - b;
    });

    const roomIdStrings: string[] = [];
    for (let i = 0; i < roomIds.length; i++) {
        roomIdStrings.push(String(roomIds[i]));
    }

    const genres: string[] = [];

    for (let i = 0; i < allCategories.length; i++) {
        const categoryName = getCategoryName(allCategories[i]);

        if (!categoryName) {
            continue;
        }

        let exists = false;
        for (let j = 0; j < genres.length; j++) {
            if (genres[j] === categoryName) {
                exists = true;
                break;
            }
        }

        if (!exists) {
            genres.push(categoryName);
        }
    }

    genres.sort(function (a, b) {
        return a.localeCompare(b, "hu");
    });

    movieTitles.sort(function (a, b) {
        return a.localeCompare(b, "hu");
    });

    renderMovieOptions(locationFilter, roomIdStrings, "Összes terem", function (roomValue) {
        return getRoomLabel(Number(roomValue));
    });

    renderMovieOptions(genreFilter, genres, "Összes kategória");
    renderMovieOptions(movieFilter, movieTitles, "Összes film");
}

// A kiválasztott szűrők alapján visszaadja a szűrt film listát
export function getFilteredMovies(): MovieDto[] {
    const selectedLocation = locationFilter?.value ?? "";
    const selectedGenre = genreFilter?.value ?? "";
    const selectedMovie = movieFilter?.value ?? "";
    const selectedDate = dateFilter?.value ?? "";
    const searchText = (movieSearchInput?.value ?? "").trim().toLowerCase();

    const hasScreeningFilters = Boolean(selectedLocation || selectedDate);
    const filteredMovies: MovieDto[] = [];

    for (let i = 0; i < allMovies.length; i++) {
        const movie = allMovies[i];

        if (selectedGenre && movie.genre !== selectedGenre) {
            continue;
        }

        if (selectedMovie && movie.movieTitle !== selectedMovie) {
            continue;
        }

        if (searchText && !movie.movieTitle.toLowerCase().includes(searchText)) {
            continue;
        }

        const filteredScreenings: FilmScreeningDto[] = [];

        for (let j = 0; j < movie.screenings.length; j++) {
            const screening = movie.screenings[j];

            const matchesLocation = !selectedLocation || String(screening.roomId) === selectedLocation;
            const matchesDate = !selectedDate || screening.date.slice(0, 10) === selectedDate;

            if (matchesLocation && matchesDate) {
                filteredScreenings.push(screening);
            }
        }

        if (filteredScreenings.length > 0 || !hasScreeningFilters) {
            filteredMovies.push({
                movieId: movie.movieId,
                movieTitle: movie.movieTitle,
                duration: movie.duration,
                genre: movie.genre,
                director: movie.director,
                description: movie.description,
                imageId: movie.imageId,
                screenings: filteredScreenings,
            });
        }
    }

    return filteredMovies;
}

// Egy film képének lekérése
// Ha nem sikerül, fallback képet ad vissza
export async function getMovieImageSource(movie: MovieDto): Promise<string> {
    const fallbackSource = getMovieFallbackPoster(movie);

    try {
        const imageData = await fetchImages(movie.movieId) as ImageDto[];
        return getImageSource(imageData, fallbackSource);
    } catch {
        return fallbackSource;
    }
}

// Vetítés gombok HTML-jének összeállítása
export function getScreeningsButtonsHtml(screenings: FilmScreeningDto[]): string {
    if (screenings.length === 0) {
        return '<p class="text-muted">Nincs elérhető vetítés</p>';
    }

    let html = "";

    for (let i = 0; i < screenings.length; i++) {
        const screening = screenings[i];

        html += 
            `<button class="btn btn-primary btn-sm me-2" type="button" data-screening-id="${screening.filmScreeningId}">
                Vetítés ${i + 1} (${new Date(screening.date).toLocaleString("hu-HU")})
            </button>`;
    }

    return html;
}

// Filmkártyák kirajzolása
export async function renderMoviesList(moviesToRender?: MovieDto[]): Promise<void> {
    if (!movieList) {
        return;
    }

    try {
        if (allMovies.length === 0) {
            await ensureMoviesLoaded();
            populateMovieFilters(allMovies);
        }

        const movies = moviesToRender ?? allMovies;
        movieList.innerHTML = "";

        if (movies.length === 0) {
            movieList.innerHTML = `<div class="alert alert-info">Nincs megjeleníthető film.</div>`;
            return;
        }

        for (let i = 0; i < movies.length; i++) {
            const movie = movies[i];
            const image = await getMovieImageSource(movie);

            const movieCard = document.createElement("div");
            movieCard.className = "movie-card my-3";
            movieCard.innerHTML = 
            `<div class="movie-card-poster">
                    <img src="${image}" alt="${movie.movieTitle}">
                </div>
                <div class="movie-card-content">
                    <h3>${movie.movieTitle}</h3>
                    <p><strong>Rendező:</strong> ${movie.director}</p>
                    <p><strong>Időtartam:</strong> ${movie.duration} perc</p>
                    <p><strong>Műfaj:</strong> ${movie.genre}</p>
                    <p><strong>Leírás:</strong> ${getMovieDescription(movie)}</p>
                    <div class="screenings-buttons">
                        ${getScreeningsButtonsHtml(movie.screenings)}
                    </div>
                </div>`;

            movieList.appendChild(movieCard);
        }
    } catch (error) {
        console.error(error);
        movieList.innerHTML = `<div class="alert alert-danger">Hiba történt a filmek betöltésekor.</div>`;
    }
}

// Szűrők alkalmazása
export function applyMovieFilters(): void {
    void renderMoviesList(getFilteredMovies());
}

// Eseménykezelők rárakása a szűrőkre
export function initializeMovieFilters(): void {
    locationFilter?.addEventListener("change", applyMovieFilters);
    genreFilter?.addEventListener("change", applyMovieFilters);
    movieFilter?.addEventListener("change", applyMovieFilters);
    dateFilter?.addEventListener("change", applyMovieFilters);
    movieSearchInput?.addEventListener("input", applyMovieFilters);
}

// Vetítés megkeresése screeningId alapján
export function findScreeningById(screeningId: number): SelectedScreeningState | null {
    for (let i = 0; i < allMovies.length; i++) {
        const movie = allMovies[i];

        for (let j = 0; j < movie.screenings.length; j++) {
            const screening = movie.screenings[j];

            if (screening.filmScreeningId === screeningId) {
                return {
                    filmScreeningId: screening.filmScreeningId,
                    movieTitle: movie.movieTitle,
                    roomId: screening.roomId,
                    roomName: getRoomLabel(screening.roomId, screening.roomName),
                    date: screening.date,
                };
            }
        }
    }

    return null;
}

// Kattintás figyelése a vetítés gombokra
export function initializeScreeningButtons(): void {
    movieList?.addEventListener("click", (event) => {
        const target = event.target as HTMLElement | null;
        const screeningButton = target?.closest("[data-screening-id]") as HTMLButtonElement | null;

        if (!screeningButton) {
            return;
        }

        const screeningId = Number(screeningButton.dataset.screeningId);

        if (!screeningId) {
            return;
        }

        const selectedScreening = findScreeningById(screeningId);

        if (!selectedScreening) {
            return;
        }

        // Elmentjük a kiválasztott vetítést, majd átmegyünk a terem oldalra
        setSelectedScreeningState(selectedScreening);
        window.location.href = "../Termek/Terem.html";
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    applyLoginState();

    if (movieList) {
        initializeMovieFilters();
        initializeScreeningButtons();
        await renderMoviesList();
    }
});