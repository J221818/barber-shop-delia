document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("booking-form");
    const confirmation = document.getElementById("confirmation");
    const errorBox = document.getElementById("form-error");
    const whatsappLink = document.getElementById("whatsapp-link");

    if (!form || !confirmation || !errorBox || !whatsappLink) {
        return;
    }

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
            showError("Ingresa tu nombre completo para que podamos agendar tu cita.");
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

        const confirmationText = `¡Gracias, ${clientName}! Tu cita para ${service} ha sido registrada para el ${date} a las ${time}. Te contactaremos al ${phone}.`;
        confirmation.textContent = confirmationText;
        confirmation.style.display = "block";

        const bookingMessage = `Nueva cita en Barber Shop Delia%0ANombre: ${encodeURIComponent(clientName)}%0ATeléfono: ${encodeURIComponent(phone)}%0AServicio: ${encodeURIComponent(service)}%0AFecha: ${encodeURIComponent(date)}%0AHora: ${encodeURIComponent(time)}%0ANotas: ${encodeURIComponent(notes || 'Ninguna')}`;
        const whatsappNumber = "526643593040";
        whatsappLink.href = `https://wa.me/${whatsappNumber}?text=${bookingMessage}`;
        whatsappLink.style.display = "inline-flex";

        console.log({
            clientName,
            phone,
            date,
            time,
            service,
            notes,
        });

        form.reset();
    });
});