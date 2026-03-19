// ===================== DTO =====================
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
            row.innerHTML =
                `<td>${category.categId}</td>
                <td>${category.name}</td>
                <td>${category.description}</td>
                <td>
                    <button class="btn btn-warning btn-sm me-2" onclick="Admin_editCategory(${category.categId}, '${(category.name)}', '${(category.description)}')">
                        Módosítás
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="Admin_removeCategory(${category.categId})">
                        Törlés
                    </button>
                </td>`;
            tbody.appendChild(row);
        }
    }
    catch (error) {
        tbody.innerHTML =
            `<tr>
                <td colspan="4" class="text-danger text-center">Nem sikerült a kategóriák betöltése.</td>
            </tr>`;
    }
}
async function Admin_handleCategoryCreate(event) {
    event.preventDefault();
    try {
        const dto = {
            categId: 0,
            name: document.getElementById("categoryName").value.trim(),
            description: document.getElementById("categoryDescription").value.trim()
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
            categId: categoryId,
            name: document.getElementById("editCategoryName").value.trim(),
            description: document.getElementById("editCategoryDescription").value.trim()
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
// ===================== WINDOW EXPORT =====================
// @ts-ignore
window.Admin_handleCategoryCreate = Admin_handleCategoryCreate;
// @ts-ignore
window.Admin_handleCategoryUpdate = Admin_handleCategoryUpdate;
// @ts-ignore
window.Admin_removeCategory = Admin_removeCategory;
// @ts-ignore
window.Admin_editCategory = Admin_editCategory;
// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await Admin_renderCategoriesAdminTable();
    }
    catch (error) {
        console.error("Admin categories init hiba:", error);
    }
});
