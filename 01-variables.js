document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("booking-form");
    const confirmation = document.getElementById("confirmation");
    const errorBox = document.getElementById("form-error");
    const whatsappLink = document.getElementById("whatsapp-link");
    const occupiedList = document.getElementById("occupied-list");
    const qrCode = document.getElementById("qr-code");
    const shareUrlInput = document.getElementById("share-url");
    const copyLinkButton = document.getElementById("copy-link-button");

    // Admin panel elements
    const adminButton = document.getElementById("admin-button");
    const adminModal = document.getElementById("admin-modal");
    const closeAdmin = document.getElementById("close-admin");
    const adminPassword = document.getElementById("admin-password");
    const adminLogin = document.getElementById("admin-login");
    const loginSection = document.getElementById("login-section");
    const dashboardSection = document.getElementById("dashboard-section");
    const appointmentsBody = document.getElementById("appointments-body");
    const totalAppointments = document.getElementById("total-appointments");
    const clearAllBtn = document.getElementById("clear-all-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const adminDateFilter = document.getElementById("admin-date-filter");
    const adminRefresh = document.getElementById("admin-refresh");

    const pageUrl = window.location.href;
    const whatsappNumber = "529181520732";
    const API_BASE = 'http://localhost:3000';

    if (!form || !confirmation || !errorBox || !whatsappLink || !occupiedList || !qrCode || !shareUrlInput || !copyLinkButton) {
        return;
    }

    shareUrlInput.value = pageUrl;
    qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(pageUrl)}`;

    // in-memory cache of fetched slots
    let bookedSlots = [];
    let adminToken = sessionStorage.getItem('adminToken') || null;

    // initialize: load bookings from server
    (async function init() {
        try {
            bookedSlots = await fetchBookedSlots();
            renderBookedSlots();
        } catch (err) {
            console.warn('No server available, falling back to localStorage');
            // fallback to localStorage if server not reachable
            const saved = localStorage.getItem('barberShopDeliaBookedSlots');
            bookedSlots = saved ? JSON.parse(saved) : [];
            renderBookedSlots();
        }
    })();

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

    async function fetchBookedSlots(date) {
        const q = date ? `?date=${encodeURIComponent(date)}` : '';
        const res = await fetch(`${API_BASE}/api/occupied${q}`);
        if (!res.ok) throw new Error('Failed to fetch');
        return await res.json();
    }

    async function createAppointmentOnServer(slot) {
        const res = await fetch(`${API_BASE}/api/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slot)
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || 'Error creating appointment');
        }
        return await res.json();
    }

    function renderBookedSlots() {
        occupiedList.innerHTML = "";
        if (!bookedSlots || bookedSlots.length === 0) {
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

        try {
            const created = await createAppointmentOnServer(newSlot);
            bookedSlots.push(created);
            removeExpiredSlots();
            renderBookedSlots();
        } catch (err) {
            // fallback: try saving locally
            showError(err.message || 'No se pudo conectar al servidor. Intentando guardar localmente.');
            bookedSlots.push(newSlot);
            localStorage.setItem('barberShopDeliaBookedSlots', JSON.stringify(bookedSlots));
            renderBookedSlots();
        }

        confirmation.textContent = `✅ ¡Listo, ${clientName}! Tu cita para ${service} quedó reservada el ${date} a las ${time}. Se abrirá WhatsApp para confirmar la cita.`;
        confirmation.style.display = "block";

        const bookingMessage = buildWhatsappMessage(clientName, phone, date, time, service, notes);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${bookingMessage}`;
        whatsappLink.href = whatsappUrl;
        whatsappLink.style.display = "inline-flex";
        window.open(whatsappUrl, "_blank");

        form.reset();
    });

    // ==================== ADMIN PANEL ====================
    
    adminButton.addEventListener("click", function () {
        adminModal.classList.add("active");
        adminPassword.focus();
    });

    closeAdmin.addEventListener("click", function () {
        adminModal.classList.remove("active");
        loginSection.style.display = "grid";
        dashboardSection.style.display = "none";
        adminPassword.value = "";
    });

    adminModal.addEventListener("click", function (event) {
        if (event.target === adminModal) {
            adminModal.classList.remove("active");
            loginSection.style.display = "grid";
            dashboardSection.style.display = "none";
            adminPassword.value = "";
        }
    });

    adminLogin.addEventListener("click", async function () {
        const pwd = adminPassword.value || '';
        try {
            const res = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
            });
            if (!res.ok) throw new Error('Contraseña incorrecta');
            const body = await res.json();
            adminToken = body.token;
            sessionStorage.setItem('adminToken', adminToken);
            loginSection.style.display = "none";
            dashboardSection.style.display = "block";
            if (adminDateFilter) {
                const today = new Date();
                const iso = today.toISOString().slice(0, 10);
                if (!adminDateFilter.value) adminDateFilter.value = iso;
                await loadAdminDashboard(adminDateFilter.value);
            } else {
                await loadAdminDashboard();
            }
        } catch (err) {
            alert(err.message || 'Error en login');
            adminPassword.value = "";
            adminPassword.focus();
        }
    });

    adminPassword.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            adminLogin.click();
        }
    });

    logoutBtn.addEventListener("click", function () {
        loginSection.style.display = "grid";
        dashboardSection.style.display = "none";
        adminPassword.value = "";
        adminPassword.focus();
    });

    async function loadAdminDashboard(date) {
        try {
            const q = date ? `?date=${encodeURIComponent(date)}` : '';
            const res = await fetch(`${API_BASE}/api/appointments${q}`, {
                headers: { 'x-admin-token': adminToken }
            });
            if (!res.ok) throw new Error('No autorizado o error del servidor');
            const rows = await res.json();
            const filtered = rows || [];
            totalAppointments.textContent = filtered.length;
            appointmentsBody.innerHTML = "";
            if (filtered.length === 0) {
                const row = document.createElement("tr");
                row.innerHTML = '<td colspan="7" style="text-align: center; color: #94a3b8;">No hay citas para la fecha seleccionada.</td>';
                appointmentsBody.appendChild(row);
                return;
            }
            filtered.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
            filtered.forEach((slot) => {
                const row = document.createElement("tr");
                const notes = slot.notes ? slot.notes : '-';
                row.innerHTML = `\n                <td>${slot.clientName}</td>\n                <td>${slot.phone}</td>\n                <td>${slot.date}</td>\n                <td>${slot.time}</td>\n                <td>${slot.service}</td>\n                <td>${notes}</td>\n                <td><button class="delete-btn" data-id="${slot.id}">Eliminar</button></td>\n            `;
                const delBtn = row.querySelector('.delete-btn');
                delBtn.addEventListener('click', function () {
                    deleteAppointmentById(slot.id);
                });
                appointmentsBody.appendChild(row);
            });
        } catch (err) {
            alert(err.message || 'Error cargando citas');
        }
    }

    async function deleteAppointmentById(id) {
        if (!confirm("¿Estás seguro de que deseas eliminar esta cita?")) return;
        try {
            const res = await fetch(`${API_BASE}/api/appointments/${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers: { 'x-admin-token': adminToken }
            });
            if (!res.ok) throw new Error('No se pudo eliminar');
            // refresh lists
            bookedSlots = await fetchBookedSlots();
            removeExpiredSlots();
            renderBookedSlots();
            await loadAdminDashboard(adminDateFilter ? adminDateFilter.value : undefined);
        } catch (err) {
            alert(err.message || 'Error al eliminar');
        }
    }

    clearAllBtn.addEventListener("click", async function () {
        if (confirm("⚠️ ¿ESTÁS SEGURO? Esto eliminará TODAS las citas. Esta acción no se puede deshacer.")) {
            if (confirm("Confirma nuevamente: ¿Deseas eliminar TODAS las citas?")) {
                try {
                    const res = await fetch(`${API_BASE}/api/appointments`, {
                        method: 'DELETE',
                        headers: { 'x-admin-token': adminToken }
                    });
                    if (!res.ok) throw new Error('No se pudo eliminar todo');
                    bookedSlots = [];
                    renderBookedSlots();
                    await loadAdminDashboard();
                    alert("✅ Todas las citas han sido eliminadas.");
                } catch (err) {
                    alert(err.message || 'Error al eliminar todo');
                }
            }
        }
    });

    // Keyboard shortcut: Ctrl+Shift+A opens admin modal (discreet access)
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            adminModal.classList.add('active');
            adminPassword.focus();
        }
    });

    // Refresh button and date change
    if (adminRefresh) {
        adminRefresh.addEventListener('click', function () {
            loadAdminDashboard();
        });
    }
    if (adminDateFilter) {
        adminDateFilter.addEventListener('change', function () {
            loadAdminDashboard();
        });
    }
});