// ===================== DTO =====================

interface CategoriesDto {
    categId: number;
    name: string;
    description: string;
}

interface NewCategDto {
    categId: number;
    name: string;
    description: string;
}

interface ModifyCategDto {
    categId: number;
    name: string;
    description: string;
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
    } catch (error) {
        tbody.innerHTML = 
        `<tr>
                <td colspan="4" class="text-danger text-center">Nem sikerült a kategóriák betöltése.</td>
            </tr>`;
    }
}

async function Admin_handleCategoryCreate(event: Event): Promise<void> {
    event.preventDefault();

    try {
        const dto: NewCategDto = {
            categId: 0,
            name: (document.getElementById("categoryName") as HTMLInputElement).value.trim(),
            description: (document.getElementById("categoryDescription") as HTMLInputElement).value.trim()
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
            categId: categoryId,
            name: (document.getElementById("editCategoryName") as HTMLInputElement).value.trim(),
            description: (document.getElementById("editCategoryDescription") as HTMLInputElement).value.trim()
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
    } catch (error) {
        console.error("Admin categories init hiba:", error);
    }
});