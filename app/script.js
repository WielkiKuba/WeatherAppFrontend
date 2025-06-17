document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#weatherTable tbody');
    const summaryFooter = document.querySelector('#summaryFooter');
    const statusMessageDiv = document.getElementById('statusMessage');
    const darkModeToggle = document.getElementById('darkModeToggle');

    function formatToDDMMYYYY(dateString) {
        // Przyjmuje datę w formacie YYYY-MM-DD
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    }

    function getWeatherIconPath(weatherCode) {
        if (weatherCode < 50) {
            return 'sun.svg';
        } else {
            return 'rain.svg';
        }
    }

    function populateTable(data) {
        if (!tableBody) {
            console.error('Element tbody nie został znaleziony.');
            return;
        }
        tableBody.innerHTML = '';

        data.forEach(day => {
            const row = document.createElement('tr');
            const iconPath = getWeatherIconPath(day.weatherCode);

            row.innerHTML = `
                <td>${formatToDDMMYYYY(day.date)}</td> <td>${day.temperatureMax.toFixed(1)}°C</td>
                <td>${day.temperatureMin.toFixed(1)}°C</td>
                <td>${day.sunshineDuration.toFixed(2)}s</td>
                <td>${day.estimatedEnergy.toFixed(2)} kWh</td>
                <td><img src="${iconPath}" alt="Pogoda" width="24" height="24"></td>
            `;
            tableBody.appendChild(row);
        });
    }

    function populateSummary(summary) {
        if (!summaryFooter) {
            console.error('Element stopki podsumowania (#summaryFooter) nie został znaleziony.');
            return;
        }
        summaryFooter.innerHTML = `
            Max Temp: ${summary.maxTemp.toFixed(1)}°C |
            Min Temp: ${summary.minTemp.toFixed(1)}°C |
            Średni Czas Nasłonecznienia: ${(summary.avgSunshineDuration / 3600).toFixed(2)}h |
            Średnie Ciśnienie: ${summary.avgPressure.toFixed(2)} hPa |
            Deszczowo: ${summary.rainy ? 'Tak' : 'Nie'}
        `;
    }

    async function fetchWeatherData(latitude, longitude) {
        const weeklyApiUrl = `https://weatherappbackend-ma3b.onrender.com/weather/weekly?latitude=${latitude}&longitude=${longitude}`;
        const summaryApiUrl = `https://weatherappbackend-ma3b.onrender.com/weather/summary?latitude=${latitude}&longitude=${longitude}`;

        statusMessageDiv.textContent = 'Ładowanie danych pogodowych...';
        statusMessageDiv.classList.remove('error-message');
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Ładowanie danych pogodowych...</td></tr>`;
        summaryFooter.innerHTML = `Ładowanie podsumowania...`;

        try {
            const weeklyResponse = await fetch(weeklyApiUrl);
            if (!weeklyResponse.ok) {
                throw new Error(`Błąd HTTP podczas pobierania danych tygodniowych: ${weeklyResponse.status}`);
            }
            const weeklyData = await weeklyResponse.json();
            populateTable(weeklyData);

            const summaryResponse = await fetch(summaryApiUrl);
            if (!summaryResponse.ok) {
                throw new Error(`Błąd HTTP podczas pobierania podsumowania: ${summaryResponse.status}`);
            }
            const summaryData = await summaryResponse.json();
            populateSummary(summaryData);

            statusMessageDiv.textContent = `Dane dla lokalizacji (Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}) załadowane pomyślnie.`;

        } catch (error) {
            console.error('Wystąpił błąd podczas pobierania danych pogodowych:', error);
            statusMessageDiv.textContent = `Błąd: ${error.message}. Nie udało się załadować danych pogodowych.`;
            statusMessageDiv.classList.add('error-message');
            tableBody.innerHTML = `<tr><td colspan="6" class="error-message">Nie udało się załadować danych pogodowych. Sprawdź, czy serwer API działa.</td></tr>`;
            summaryFooter.innerHTML = `<span class="error-message">Błąd ładowania podsumowania.</span>`;
        }
    }

    function onGeolocationSuccess(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        fetchWeatherData(latitude, longitude);
    }

    function onGeolocationError(error) {
        let errorMessage = 'Nie udało się pobrać Twojej lokalizacji.';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage += " Odmówiono dostępu do geolokalizacji. Proszę zezwolić przeglądarce na udostępnianie lokalizacji.";
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage += " Informacje o lokalizacji są niedostępne.";
                break;
            case error.TIMEOUT:
                errorMessage += " Przekroczono czas oczekiwania na lokalizację.";
                break;
            case error.UNKNOWN_ERROR:
                errorMessage += " Wystąpił nieznany błąd geolokalizacji.";
                break;
        }
        console.error('Błąd geolokalizacji:', error);
        statusMessageDiv.textContent = `Błąd: ${errorMessage}`;
        statusMessageDiv.classList.add('error-message');
        tableBody.innerHTML = `<tr><td colspan="6" class="error-message">Błąd geolokalizacji. Nie można pobrać danych pogodowych.</td></tr>`;
        summaryFooter.innerHTML = `<span class="error-message">Brak danych ze względu na błąd geolokalizacji.</span>`;
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            darkModeToggle.textContent = 'Wyłącz Tryb Ciemny';
        } else {
            localStorage.setItem('theme', 'light');
            darkModeToggle.textContent = 'Włącz Tryb Ciemny';
        }
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = 'Wyłącz Tryb Ciemny';
    } else {
        darkModeToggle.textContent = 'Włącz Tryb Ciemny';
    }

    darkModeToggle.addEventListener('click', toggleDarkMode);

    if (navigator.geolocation) {
        statusMessageDiv.textContent = 'Pobieranie Twojej lokalizacji... (może być wymagana zgoda)';
        navigator.geolocation.getCurrentPosition(onGeolocationSuccess, onGeolocationError);
    } else {
        statusMessageDiv.textContent = 'Twoja przeglądarka nie wspiera geolokalizacji.';
        statusMessageDiv.classList.add('error-message');
        tableBody.innerHTML = `<tr><td colspan="6" class="error-message">Twoja przeglądarka nie wspiera geolokalizacji.</td></tr>`;
        summaryFooter.innerHTML = `<span class="error-message">Brak danych ze względu na brak wsparcia geolokalizacji.</span>`;
    }
});
