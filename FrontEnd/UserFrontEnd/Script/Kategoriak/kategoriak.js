import { fetchCategoriesList } from "../Core/api.js";
import { applyLoginState } from "../Fooldalak/auth.js";
// Ide rendereljük a kategóriákat
const categoriesGrid = document.getElementById("categoriesGrid");
// Kategória nevének kinyerése többféle mezőből
export function getCategoryName(category) {
    return (category.categoryName ?? category.categName ?? category.name ?? "").trim();
}
// Kategória leírásának kinyerése
export function getCategoryDescription(category) {
    return (category.categoryDescription ?? category.description ?? "").trim();
}
// Kategória oldal kirajzolása
export async function renderCategoriesPage() {
    if (!categoriesGrid) {
        return;
    }
    try {
        // Lekérjük a kategóriákat a backendről
        const categoriesRaw = await fetchCategoriesList();
        const categories = [];
        // Kiszedjük azokat, amiknek van neve
        for (let i = 0; i < categoriesRaw.length; i++) {
            if (getCategoryName(categoriesRaw[i])) {
                categories.push(categoriesRaw[i]);
            }
        }
        // Név szerint rendezzük
        categories.sort(function (left, right) {
            return getCategoryName(left).localeCompare(getCategoryName(right), "hu");
        });
        // Ha nincs egy darab sem
        if (categories.length === 0) {
            categoriesGrid.innerHTML =
                '<div class="category-empty card-like-panel">Még nem érkezett kategóriaadat a backendből.</div>';
            return;
        }
        categoriesGrid.innerHTML = "";
        // Kártyák kirajzolása
        for (let i = 0; i < categories.length; i++) {
            const category = categories[i];
            const categoryCard = document.createElement("article");
            // Kis színezés (1-4 között váltogat)
            categoryCard.className = `category-card category-accent-${(i % 4) + 1}`;
            categoryCard.innerHTML =
                `<div class="category-card-header">
                    <div>
                        <h2>${getCategoryName(category)}</h2>
                        <p class="category-description">
                            ${getCategoryDescription(category) || "Ehhez a kategóriához még nem lett leírás megadva az adatbázisban."}
                        </p>
                    </div>
                </div>`;
            categoriesGrid.appendChild(categoryCard);
        }
    }
    catch (error) {
        console.error(error);
        categoriesGrid.innerHTML =
            '<div class="category-empty card-like-panel">Hiba történt a kategóriák betöltésekor.</div>';
    }
}
document.addEventListener("DOMContentLoaded", async () => {
    applyLoginState(); // login állapot beállítása (nav, stb.)
    await renderCategoriesPage(); // kategóriák betöltése
});
