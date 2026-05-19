document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("booking-form");
    const confirmation = document.getElementById("confirmation");
    const errorBox = document.getElementById("form-error");
    const whatsappLink = document.getElementById("whatsapp-link");
    const occupiedList = document.getElementById("occupied-list");
    const qrCode = document.getElementById("qr-code");
    const shareUrlInput = document.getElementById("share-url");
    const copyLinkButton = document.getElementById("copy-link-button");

    const pageUrl = window.location.href;
    const whatsappNumber = "529181520732";
    const storageKey = "barberShopDeliaBookedSlots";
    const adminPassword = "EsteticaDelia2026";
    let adminAuthenticated = false;

    const adminButton = document.getElementById("admin-button");
    const adminModal = document.getElementById("admin-modal");
    const closeAdminButton = document.getElementById("close-admin");
    const adminLoginForm = document.getElementById("admin-login-form");
    const adminPasswordInput = document.getElementById("admin-password");
    const adminAccessMessage = document.getElementById("admin-access-message");
    const adminSection = document.getElementById("admin-section");
    const adminSlotsBody = document.getElementById("admin-slots-body");
    const adminStats = document.getElementById("admin-stats");
    const adminLogoutButton = document.getElementById("admin-logout");

    if (!form || !confirmation || !errorBox || !whatsappLink || !occupiedList || !qrCode || !shareUrlInput || !copyLinkButton || !adminButton || !adminModal || !closeAdminButton || !adminLoginForm || !adminPasswordInput || !adminAccessMessage || !adminSection || !adminSlotsBody || !adminStats || !adminLogoutButton) {
        return;
    }

    shareUrlInput.value = pageUrl;
    qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(pageUrl)}`;

    let bookedSlots = loadBookedSlots();
    removeExpiredSlots();
    renderBookedSlots();

    function showError(message) {
        errorBox.textContent = message;
        errorBox.style.display = "block";
        confirmation.style.display = "none";
        whatsappLink.style.display = "none";
    }

    function hideError() {
        errorBox.style.display = "none";
    }

    function isPhoneValid(value) {
        const digits = value.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 15;
    }

    function isDateValid(value) {
        if (!value) return false;
        const selected = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selected >= today;
    }

    function isTimeValid(value) {
        if (!value) return false;
        const [hours, minutes] = value.split(":").map(Number);
        return hours >= 9 && (hours < 20 || (hours === 20 && minutes === 0));
    }

    function formatSlotText(slot) {
        return `${slot.date} • ${slot.time} • ${slot.service} (${slot.clientName})`;
    }

    function getSlotKey(date, time) {
        return `${date}|${time}`;
    }

    function loadBookedSlots() {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : [];
    }

    function saveBookedSlots() {
        localStorage.setItem(storageKey, JSON.stringify(bookedSlots));
    }

    function renderBookedSlots() {
        occupiedList.innerHTML = "";

        if (bookedSlots.length === 0) {
            const emptyItem = document.createElement("li");
            emptyItem.textContent = "No hay citas reservadas aún.";
            occupiedList.appendChild(emptyItem);
            return;
        }

        bookedSlots.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
        bookedSlots.forEach(slot => {
            const item = document.createElement("li");
            item.textContent = formatSlotText(slot);
            occupiedList.appendChild(item);
        });
    }

    function removeExpiredSlots() {
        const now = new Date();
        bookedSlots = bookedSlots.filter(slot => {
            const slotDate = new Date(slot.date + "T" + slot.time + ":00");
            return slotDate >= now;
        });
        saveBookedSlots();
    }

    function isSlotTaken(date, time) {
        return bookedSlots.some(slot => slot.key === getSlotKey(date, time));
    }

    function buildWhatsappMessage(clientName, phone, date, time, service, notes) {
        const details = [
            `*📩 Nueva cita - Estética Delia*`,
            `👤 Nombre: ${clientName}`,
            `📞 Teléfono: ${phone}`,
            `💈 Servicio: ${service}`,
            `📅 Fecha: ${date}`,
            `⏰ Hora: ${time}`,
            `📝 Notas: ${notes || 'Ninguna'}`
        ];
        return encodeURIComponent(details.join("\n"));
    }

    function openAdminModal() {
        adminModal.classList.add("active");
        adminAccessMessage.style.display = "none";
        adminPasswordInput.value = "";
        adminPasswordInput.focus();
        if (adminAuthenticated) {
            showAdminPanel();
        }
    }

    function closeAdminModal() {
        adminModal.classList.remove("active");
    }

    function renderAdminSlots() {
        adminSlotsBody.innerHTML = "";

        if (bookedSlots.length === 0) {
            adminSlotsBody.innerHTML = `
                <tr>
                    <td colspan="6">No hay citas registradas aún.</td>
                </tr>
            `;
            adminStats.textContent = "No hay citas activas para mostrar.";
            return;
        }

        bookedSlots.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
        bookedSlots.forEach(slot => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${slot.date}</td>
                <td>${slot.time}</td>
                <td>${slot.clientName}</td>
                <td>${slot.phone}</td>
                <td>${slot.service}</td>
                <td>${slot.notes || 'Ninguna'}</td>
            `;
            adminSlotsBody.appendChild(row);
        });

        adminStats.textContent = `Total de citas registradas: ${bookedSlots.length}`;
    }

    function showAdminPanel() {
        adminLoginForm.style.display = "none";
        adminSection.style.display = "block";
        renderAdminSlots();
    }

    function resetAdminLogin() {
        adminLoginForm.style.display = "grid";
        adminSection.style.display = "none";
        adminAccessMessage.style.display = "none";
        adminPasswordInput.value = "";
    }

    function verifyAdminPassword(password) {
        return password === adminPassword;
    }

    adminButton.addEventListener("click", openAdminModal);
    closeAdminButton.addEventListener("click", closeAdminModal);
    adminLogoutButton.addEventListener("click", function () {
        adminAuthenticated = false;
        resetAdminLogin();
    });
    adminModal.addEventListener("click", function (event) {
        if (event.target === adminModal) {
            closeAdminModal();
        }
    });

    adminLoginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        const password = adminPasswordInput.value.trim();

        if (verifyAdminPassword(password)) {
            adminAuthenticated = true;
            showAdminPanel();
            return;
        }

        adminAccessMessage.textContent = "Contraseña incorrecta. Solo el dueño puede acceder al panel administrativo.";
        adminAccessMessage.style.display = "block";
    });

    copyLinkButton.addEventListener("click", async function () {
        try {
            await navigator.clipboard.writeText(pageUrl);
            copyLinkButton.textContent = "Enlace copiado";
            setTimeout(() => {
                copyLinkButton.textContent = "Copiar enlace";
            }, 2000);
        } catch (error) {
            showError("No se pudo copiar el enlace. Usa Ctrl+C y pega el enlace manualmente.");
        }
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        hideError();

        const clientName = document.getElementById("client-name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const date = document.getElementById("date").value;
        const time = document.getElementById("time").value;
        const service = document.getElementById("service").value;
        const notes = document.getElementById("notes").value.trim();

        if (!clientName) {
            showError("Ingresa tu nombre completo para poder agendar la cita.");
            return;
        }

        if (!isPhoneValid(phone)) {
            showError("Ingresa un teléfono válido con al menos 10 dígitos.");
            return;
        }

        if (!isDateValid(date)) {
            showError("Selecciona una fecha válida, hoy o una fecha futura.");
            return;
        }

        if (!isTimeValid(time)) {
            showError("Selecciona una hora entre 09:00 y 20:00.");
            return;
        }

        if (!service) {
            showError("Selecciona el servicio que deseas reservar.");
            return;
        }

        if (isSlotTaken(date, time)) {
            showError(`Ya hay una cita ocupando ${date} a las ${time}. Elige otro horario.`);
            return;
        }

        const newSlot = {
            key: getSlotKey(date, time),
            clientName,
            phone,
            date,
            time,
            service,
            notes,
            createdAt: new Date().toISOString()
        };

        bookedSlots.push(newSlot);
        saveBookedSlots();
        renderBookedSlots();

        confirmation.textContent = `✅ ¡Listo, ${clientName}! Tu cita para ${service} quedó reservada el ${date} a las ${time}. Se abrirá WhatsApp para confirmar la cita.`;
        confirmation.style.display = "block";

        const bookingMessage = buildWhatsappMessage(clientName, phone, date, time, service, notes);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${bookingMessage}`;
        whatsappLink.href = whatsappUrl;
        whatsappLink.style.display = "inline-flex";
        window.open(whatsappUrl, "_blank");

        form.reset();
    });

    // Keyboard shortcut: Ctrl+Shift+A opens admin modal (discreet access)
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            // original behavior had no admin modal; keep no-op or simple alert
            alert('Acceso administrador no disponible en la versión local');
        }
    });
});