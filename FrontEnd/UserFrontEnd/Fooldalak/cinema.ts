import { fetchCategoriesList, fetchImages, fetchMoviesList, fetchRoomsList } from "../Core/api.js";
import { getImageSource, movieDescriptionTranslations, moviePosterFallbacks } from "../Core/common.js";
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

let allMovies: MovieDto[] = [];
let allRooms: RoomDto[] = [];
let allCategories: CategoriesDto[] = [];

export function getCategoryName(category: CategoriesDto): string {
    return (category.categoryName ?? category.categName ?? category.name ?? "").trim();
}

export function getMovieFallbackPoster(movie: MovieDto): string {
    const normalizedTitle = movie.movieTitle.trim().toLowerCase();
    return moviePosterFallbacks[normalizedTitle] ?? "Logo.png";
}

export function getMovieDescription(movie: MovieDto): string {
    const normalizedTitle = movie.movieTitle.trim().toLowerCase();
    return movieDescriptionTranslations[normalizedTitle] ?? movie.description;
}

export function getRoomLabel(roomId: number, roomName?: string | null): string {
    if (roomName && roomName.trim()) return roomName;
    const matchingRoom = allRooms.find((room) => room.roomId === roomId);
    return matchingRoom?.roomName ?? `Terem #${roomId}`;
}

export function getRoomById(roomId: number): RoomDto | undefined {
    return allRooms.find((room) => room.roomId === roomId);
}

export function normalizeMovieScreenings(movie: MovieDto): MovieDto {
    return {
        ...movie,
        screenings: movie.screenings.map((screening) => ({
            ...screening,
            roomName: getRoomLabel(screening.roomId, screening.roomName),
        })),
    };
}

export async function ensureRoomsLoaded(): Promise<RoomDto[]> {
    if (allRooms.length === 0) {
        allRooms = await fetchRoomsList() as RoomDto[];
    }

    return allRooms;
}

export async function ensureMoviesLoaded(): Promise<MovieDto[]> {
    if (allMovies.length === 0) {
        const [movies, rooms, categories] = await Promise.all([
            fetchMoviesList() as Promise<MovieDto[]>,
            fetchRoomsList() as Promise<RoomDto[]>,
            fetchCategoriesList() as Promise<CategoriesDto[]>,
        ]);

        allRooms = rooms;
        allCategories = categories;
        allMovies = movies.map((movie) => normalizeMovieScreenings(movie));
    }

    return allMovies;
}

export function renderMovieOptions(
    select: HTMLSelectElement | null,
    values: string[],
    defaultLabel: string,
    getLabel?: (value: string) => string,
): void {
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultLabel;
    select.appendChild(defaultOption);

    for (const value of values) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = getLabel ? getLabel(value) : value;
        select.appendChild(option);
    }

    if (values.indexOf(currentValue) !== -1) {
        select.value = currentValue;
    }
}

export function populateMovieFilters(movies: MovieDto[]): void {
    const roomIdSet = new Set<number>();
    const movieTitleSet = new Set<string>();

    for (const movie of movies) {
        for (const screening of movie.screenings) {
            roomIdSet.add(screening.roomId);
        }

        if (movie.movieTitle) {
            movieTitleSet.add(movie.movieTitle);
        }
    }

    const roomIds = Array.from(roomIdSet).sort((a, b) => a - b).map(String);
    const genres = allCategories
        .map((category) => getCategoryName(category))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "hu"));
    const movieTitles = Array.from(movieTitleSet).sort((a, b) => a.localeCompare(b, "hu"));

    renderMovieOptions(locationFilter, roomIds, "Összes terem", (roomValue) => getRoomLabel(Number(roomValue)));
    renderMovieOptions(genreFilter, genres, "Összes kategória");
    renderMovieOptions(movieFilter, movieTitles, "Összes film");
}

export function getFilteredMovies(): MovieDto[] {
    const selectedLocation = locationFilter?.value ?? "";
    const selectedGenre = genreFilter?.value ?? "";
    const selectedMovie = movieFilter?.value ?? "";
    const selectedDate = dateFilter?.value ?? "";
    const searchText = (movieSearchInput?.value ?? "").trim().toLowerCase();
    const hasScreeningFilters = Boolean(selectedLocation || selectedDate);
    const filteredMovies: MovieDto[] = [];

    for (const movie of allMovies) {
        if (selectedGenre && movie.genre !== selectedGenre) continue;
        if (selectedMovie && movie.movieTitle !== selectedMovie) continue;

        const filteredScreenings: FilmScreeningDto[] = [];

        for (const screening of movie.screenings) {
            const matchesLocation = !selectedLocation || String(screening.roomId) === selectedLocation;
            const matchesDate = !selectedDate || screening.date.slice(0, 10) === selectedDate;

            if (matchesLocation && matchesDate) {
                filteredScreenings.push(screening);
            }
        }

        if (filteredScreenings.length > 0 || !hasScreeningFilters) {
            if (searchText && !(movie.movieTitle ?? "").toLowerCase().includes(searchText)) continue;

            filteredMovies.push({
                ...movie,
                screenings: filteredScreenings,
            });
        }
    }

    return filteredMovies;
}

export async function getMovieImageSource(movie: MovieDto): Promise<string> {
    const fallbackSource = getMovieFallbackPoster(movie);

    try {
        return getImageSource(await fetchImages(movie.movieId) as ImageDto[], fallbackSource);
    } catch {
        return fallbackSource;
    }
}

export function getScreeningsButtonsHtml(screenings: FilmScreeningDto[]): string {
    if (screenings.length === 0) {
        return '<p class="text-muted">Nincs elérhető vetítés</p>';
    }

    return screenings.map((screening, index) => `
        <button class="btn btn-primary btn-sm me-2" type="button" data-screening-id="${screening.filmScreeningId}">
            Vetítés ${index + 1} (${new Date(screening.date).toLocaleString("hu-HU")})
        </button>
    `).join("");
}

export async function renderMoviesList(moviesToRender?: MovieDto[]): Promise<void> {
    if (!movieList) return;

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

        for (const movie of movies) {
            const image = await getMovieImageSource(movie);
            const movieCard = document.createElement("div");
            movieCard.className = "movie-card my-3";
            movieCard.innerHTML = `
                <div class="movie-card-poster">
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
                </div>
            `;
            movieList.appendChild(movieCard);
        }
    } catch (error) {
        console.error(error);
        movieList.innerHTML = `<div class="alert alert-danger">Hiba történt a filmek betöltésekor.</div>`;
    }
}

export function applyMovieFilters(): void {
    void renderMoviesList(getFilteredMovies());
}

export function initializeMovieFilters(): void {
    locationFilter?.addEventListener("change", applyMovieFilters);
    genreFilter?.addEventListener("change", applyMovieFilters);
    movieFilter?.addEventListener("change", applyMovieFilters);
    dateFilter?.addEventListener("change", applyMovieFilters);
    movieSearchInput?.addEventListener("input", applyMovieFilters);
}

export function findScreeningById(screeningId: number): SelectedScreeningState | null {
    for (const movie of allMovies) {
        for (const screening of movie.screenings) {
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

export function initializeScreeningButtons(): void {
    movieList?.addEventListener("click", (event) => {
        const target = event.target as HTMLElement | null;
        const screeningButton = target?.closest("[data-screening-id]") as HTMLButtonElement | null;
        if (!screeningButton) return;

        const screeningId = Number(screeningButton.dataset.screeningId);
        if (!screeningId) return;

        const selectedScreening = findScreeningById(screeningId);
        if (!selectedScreening) return;

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
