// ===================== DTO =====================
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
async function Admin_loadMovieImage(movieId) {
    try {
        const result = await Admin_apiGet(`/api/cinema/getimage?movieId=${movieId}`);
        if (!result?.imageContent)
            return;
        const img = document.getElementById(`img-${movieId}`);
        if (!img)
            return;
        img.src = `data:image/jpeg;base64,${result.imageContent}`;
    }
    catch {
    }
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
            movieId: 0,
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
            movieId: movieId,
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
// ===================== IMAGES =====================
async function Admin_deleteImage(imageId) {
    await Admin_apiDelete(`/api/admin/deleteimage?imageId=${imageId}`);
}
async function Admin_handleImageUpload(event) {
    event?.preventDefault();
    try {
        const fileInput = document.getElementById("imageFile");
        const base64Textarea = document.getElementById("imageContentBase64");
        const previewImg = document.getElementById("imagePreview");
        const movieImageIdInput = document.getElementById("movieImageId");
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            throw new Error("Válassz ki egy képfájlt.");
        }
        const file = fileInput.files[0];
        const base64Content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result;
                const base64 = result.includes(",") ? result.split(",")[1] : result;
                resolve(base64);
            };
            reader.onerror = () => reject(new Error("Nem sikerült a kép beolvasása."));
            reader.readAsDataURL(file);
        });
        if (base64Textarea) {
            base64Textarea.value = base64Content;
        }
        if (previewImg) {
            previewImg.src = `data:${file.type};base64,${base64Content}`;
            previewImg.style.display = "block";
        }
        const dto = {
            imageContent: base64Content
        };
        const result = await Admin_apiPost("/api/admin/uploadimage", dto);
        if (!result || typeof result.imageId === "undefined") {
            throw new Error("A szerver nem adott vissza imageId értéket.");
        }
        if (movieImageIdInput) {
            movieImageIdInput.value = String(result.imageId ?? 0);
        }
        Admin_showMessage("adminImageMessage", `Kép feltöltve. Image ID: ${result.imageId}`);
    }
    catch (error) {
        console.error(error);
        Admin_showMessage("adminImageMessage", error.message, true);
    }
}
async function Admin_handleImageDelete(event) {
    event?.preventDefault();
    try {
        const deleteImageIdInput = document.getElementById("deleteImageId");
        const movieImageIdInput = document.getElementById("movieImageId");
        const editMovieImageIdInput = document.getElementById("editMovieImageId");
        const previewImg = document.getElementById("imagePreview");
        const base64Textarea = document.getElementById("imageContentBase64");
        const fileInput = document.getElementById("imageFile");
        const imageIdValue = deleteImageIdInput?.value.trim() ||
            editMovieImageIdInput?.value.trim() ||
            movieImageIdInput?.value.trim() ||
            "";
        if (!imageIdValue) {
            throw new Error("Nincs megadva Image ID.");
        }
        const imageId = Number(imageIdValue);
        if (!imageId || isNaN(imageId)) {
            throw new Error("Az Image ID nem érvényes.");
        }
        if (!confirm("Biztosan törlöd a képet?"))
            return;
        await Admin_deleteImage(imageId);
        if (deleteImageIdInput)
            deleteImageIdInput.value = "";
        if (movieImageIdInput)
            movieImageIdInput.value = "";
        if (editMovieImageIdInput)
            editMovieImageIdInput.value = "";
        if (base64Textarea)
            base64Textarea.value = "";
        if (fileInput)
            fileInput.value = "";
        if (previewImg) {
            previewImg.src = "";
            previewImg.style.display = "none";
        }
        Admin_showMessage("adminImageMessage", "Kép törölve.");
    }
    catch (error) {
        console.error(error);
        Admin_showMessage("adminImageMessage", error.message, true);
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
// @ts-ignore
window.Admin_handleImageUpload = Admin_handleImageUpload;
// @ts-ignore
window.Admin_handleImageDelete = Admin_handleImageDelete;
// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", async () => {
    try {
        Admin_updateNavbarByAuth();
        await Admin_renderMoviesAdminTable();
        await Admin_renderScreeningsByMovie();
    }
    catch (error) {
        console.error("Admin tickets init hiba:", error);
    }
});
