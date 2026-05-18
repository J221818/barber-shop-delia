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
    const whatsappNumber = "526643593040";
    const storageKey = "barberShopDeliaBookedSlots";

    if (!form || !confirmation || !errorBox || !whatsappLink || !occupiedList || !qrCode || !shareUrlInput || !copyLinkButton) {
        return;
    }

    shareUrlInput.value = pageUrl;
    qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(pageUrl)}`;

    let bookedSlots = loadBookedSlots();
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

    function isSlotTaken(date, time) {
        return bookedSlots.some(slot => slot.key === getSlotKey(date, time));
    }

    function buildWhatsappMessage(clientName, phone, date, time, service, notes) {
        const details = [
            `*📩 Nueva cita - Barber Shop Delia*`,
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

        bookedSlots.push(newSlot);
        saveBookedSlots();
        renderBookedSlots();

        confirmation.textContent = `✅ ¡Listo, ${clientName}! Tu cita para ${service} quedó reservada el ${date} a las ${time}.`;
        confirmation.style.display = "block";

        const bookingMessage = buildWhatsappMessage(clientName, phone, date, time, service, notes);
        whatsappLink.href = `https://wa.me/${whatsappNumber}?text=${bookingMessage}`;
        whatsappLink.style.display = "inline-flex";

        form.reset();
    });
});