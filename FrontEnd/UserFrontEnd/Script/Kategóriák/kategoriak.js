import { fetchCategoriesList } from "../Core/api.js";
import { applyLoginState } from "../Főoldalak/auth.js";
const categoriesGrid = document.getElementById("categoriesGrid");
export function getCategoryName(category) {
    return (category.categoryName ?? category.categName ?? category.name ?? "").trim();
}
export function getCategoryDescription(category) {
    return (category.categoryDescription ?? category.description ?? "").trim();
}
export async function renderCategoriesPage() {
    if (!categoriesGrid)
        return;
    try {
        const categories = (await fetchCategoriesList())
            .filter((category) => Boolean(getCategoryName(category)))
            .sort((left, right) => getCategoryName(left).localeCompare(getCategoryName(right), "hu"));
        if (categories.length === 0) {
            categoriesGrid.innerHTML = '<div class="category-empty card-like-panel">Még nem érkezett kategóriaadat a backendből.</div>';
            return;
        }
        categoriesGrid.innerHTML = "";
        for (const [index, category] of categories.entries()) {
            const categoryCard = document.createElement("article");
            categoryCard.className = `category-card category-accent-${(index % 4) + 1}`;
            categoryCard.innerHTML = `
                <div class="category-card-header">
                    <div>
                        <h2>${getCategoryName(category)}</h2>
                        <p class="category-description">${getCategoryDescription(category) || "Ehhez a kategóriához még nem lett leírás megadva az adatbázisban."}</p>
                    </div>
                </div>
            `;
            categoriesGrid.appendChild(categoryCard);
        }
    }
    catch (error) {
        console.error(error);
        categoriesGrid.innerHTML = '<div class="category-empty card-like-panel">Hiba történt a kategóriák betöltésekor.</div>';
    }
}
document.addEventListener("DOMContentLoaded", async () => {
    applyLoginState();
    await renderCategoriesPage();
});
