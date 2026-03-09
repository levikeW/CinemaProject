const API_BASE = "https://localhost:7199";
const errorBox = document.getElementById("errorBox");
const jegyekTbody = document.getElementById("jegyekTbody");
async function fetchJegyekList() {
    const response = await fetch(`${API_BASE}/api/cinema/getallticket`);
    if (!response.ok)
        throw new Error("Nem sikerült lekérni a jegyek listát.");
    return await response.json();
}
async function renderjegyekTable() {
    try {
        const jegyek = await fetchJegyekList();
        jegyekTbody.innerHTML = "";
        if (jegyek.length === 0) {
            jegyekTbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center text-muted">Nincs megjeleníthető Jegy.</td>
          </tr>
        `;
            return;
        }
        for (const jegy of jegyek) {
            const row = document.createElement("tr");
            row.innerHTML = `
          <td>${jegy.ticketType}</td>
          <td>${jegy.ticketPrice}</td>
          <td>
            <div class="d-flex gap-2 flex-wrap">
              <button type="button" class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${jegy.ticketId}">Szerkesztés</button>
              <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${jegy.ticketId}">Törlés</button>
            </div>
          </td>
        `;
            jegyekTbody.appendChild(row);
        }
    }
    catch (error) {
        console.error(error);
        jegyekTbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-danger">Hiba történt a lista betöltésekor.</td>
        </tr>
      `;
    }
}
renderjegyekTable();
