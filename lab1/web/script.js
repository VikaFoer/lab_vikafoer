document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calculationForm');
    const resultsContainer = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const consoleOutput = document.getElementById('consoleOutput');

    function addConsoleLine(text, className = 'output') {
        const line = document.createElement('div');
        line.className = 'console-line';
        const span = document.createElement('span');
        span.className = className;
        span.textContent = text;
        line.appendChild(span);
        consoleOutput.appendChild(line);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    function formatTime(hours, minutes) {
        if (hours >= 1) {
            return `${hours} год ${minutes} хв`;
        }
        return `${minutes} хв`;
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Отримуємо значення з форми
        const v1 = parseFloat(document.getElementById('v1').value);
        const s1 = parseFloat(document.getElementById('s1').value);
        const v2 = parseFloat(document.getElementById('v2').value);
        const s2 = parseFloat(document.getElementById('s2').value);
        const v3 = parseFloat(document.getElementById('v3').value);

        // Додаємо запит у консоль
        addConsoleLine(`Швидкість першого автомобіля: ${v1} км/год`, 'output');
        addConsoleLine(`Перша ділянка другого авто: ${s1} км`, 'output');
        addConsoleLine(`Швидкість на першій ділянці: ${v2} км/год`, 'output');
        addConsoleLine(`Друга ділянка другого авто: ${s2} км`, 'output');
        addConsoleLine(`Швидкість на другій ділянці: ${v3} км/год`, 'output');
        addConsoleLine('Виконую розрахунки...', 'output');

        // Формуємо параметри для запиту
        const params = new URLSearchParams({
            v1: v1.toString(),
            s1: s1.toString(),
            v2: v2.toString(),
            s2: s2.toString(),
            v3: v3.toString()
        });

        try {
            const response = await fetch('/api/calculate?' + params.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.error) {
                addConsoleLine(`Помилка: ${data.error}`, 'output error');
                resultsContent.innerHTML = `<div class="result-error">Помилка: ${data.error}</div>`;
                resultsContainer.style.display = 'block';
                return;
            }

            if (data.success) {
                addConsoleLine('=== ПЕРЕВІРКА РЕЗУЛЬТАТІВ ===', 'output');
                addConsoleLine('Всі перевірки пройдено успішно!', 'output success');
                
                if (data.warning) {
                    addConsoleLine(`УВАГА: Час руху перевищує 1 рік (${data.time.toFixed(4)} год)!`, 'output warning');
                    addConsoleLine('       Можливо, дані нереалістичні.', 'output warning');
                }

                addConsoleLine('=== РЕЗУЛЬТАТИ ===', 'output');

                // Формуємо HTML для результатів
                let html = '';

                html += `<div class="result-item">
                    <div class="result-label">Час руху до зустрічі:</div>
                    <div class="result-value">${data.time.toFixed(4)} год (${formatTime(data.timeHours, data.timeMinutes)})</div>
                </div>`;

                html += `<div class="result-item">
                    <div class="result-label">Загальна відстань між A і B:</div>
                    <div class="result-value">${data.totalDistance.toFixed(4)} км</div>
                </div>`;

                html += `<div class="car-info">
                    <h4>Перший автомобіль:</h4>
                    <div class="result-item">
                        <div class="result-label">Проїхав:</div>
                        <div class="result-value">${data.car1.distance.toFixed(4)} км</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Частка:</div>
                        <div class="result-value">${data.car1.fraction.toFixed(4)} = ${data.car1.percentage.toFixed(2)}%</div>
                    </div>
                </div>`;

                html += `<div class="car-info">
                    <h4>Другий автомобіль:</h4>
                    <div class="result-item">
                        <div class="result-label">Проїхав:</div>
                        <div class="result-value">${data.car2.distance.toFixed(4)} км</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Частка:</div>
                        <div class="result-value">${data.car2.fraction.toFixed(4)} = ${data.car2.percentage.toFixed(2)}%</div>
                    </div>
                </div>`;

                html += `<div class="result-item">
                    <div class="result-label">=== КОНТРОЛЬ ===</div>
                    <div class="result-value">Сума часток: ${(data.car1.fraction + data.car2.fraction).toFixed(4)} (має бути 1.0)</div>
                </div>`;

                if (data.warning) {
                    html += `<div class="result-warning">
                        УВАГА: Час руху перевищує 1 рік (${data.time.toFixed(4)} год)! Можливо, дані нереалістичні.
                    </div>`;
                }

                resultsContent.innerHTML = html;
                resultsContainer.style.display = 'block';

                addConsoleLine(`Час руху: ${data.time.toFixed(4)} год`, 'output success');
                addConsoleLine(`Загальна відстань: ${data.totalDistance.toFixed(4)} км`, 'output success');
            }

        } catch (error) {
            addConsoleLine(`Помилка: ${error.message}`, 'output error');
            resultsContent.innerHTML = `<div class="result-error">Помилка з'єднання: ${error.message}</div>`;
            resultsContainer.style.display = 'block';
        }
    });
});
