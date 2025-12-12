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

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Отримуємо значення з форми
        const a = parseFloat(document.getElementById('a').value);
        const b = parseFloat(document.getElementById('b').value);
        const c = parseFloat(document.getElementById('c').value);
        const d = parseFloat(document.getElementById('d').value);

        // Додаємо запит у консоль
        addConsoleLine(`Внутрішній прямокутник: a = ${a}, b = ${b}`, 'output');
        addConsoleLine(`Зовнішній прямокутник: c = ${c}, d = ${d}`, 'output');
        addConsoleLine('Виконую перевірку...', 'output');

        // Формуємо параметри для запиту
        const params = new URLSearchParams({
            a: a.toString(),
            b: b.toString(),
            c: c.toString(),
            d: d.toString()
        });

        try {
            const response = await fetch('/lab2/api/calculate?' + params.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Перевірка чи відповідь успішна
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Отримуємо текст перед парсингом JSON
            const text = await response.text();
            console.log('Response text:', text);
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', e);
                console.error('Response text:', text);
                throw new Error('Помилка парсингу JSON: ' + e.message);
            }

            if (data.error) {
                addConsoleLine(`Помилка: ${data.error}`, 'output error');
                resultsContent.innerHTML = `<div class="result-error">Помилка: ${data.error}</div>`;
                resultsContainer.style.display = 'block';
                return;
            }

            if (data.success) {
                addConsoleLine('=== РЕЗУЛЬТАТИ ===', 'output');
                
                // Формуємо HTML для результатів
                let html = '';

                // Статус поміщення
                const statusClass = data.canFit ? 'yes' : 'no';
                const statusText = data.canFit ? '✓ ПРЯМОКУТНИК ПОМІЩАЄТЬСЯ' : '✗ ПРЯМОКУТНИК НЕ ПОМІЩАЄТЬСЯ';
                html += `<div class="fit-status ${statusClass}">${statusText}</div>`;

                // Детальна інформація
                html += `<div class="result-item">
                    <div class="result-label">Рекомендація:</div>
                    <div class="result-value">${data.recommendation}</div>
                </div>`;

                html += `<div class="rectangle-info">
                    <h4>Внутрішній прямокутник:</h4>
                    <div class="result-item">
                        <div class="result-label">Сторона a:</div>
                        <div class="result-value">${data.innerRectangle.sideA.toFixed(4)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Сторона b:</div>
                        <div class="result-value">${data.innerRectangle.sideB.toFixed(4)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Площа:</div>
                        <div class="result-value">${data.innerRectangle.area.toFixed(4)}</div>
                    </div>
                </div>`;

                html += `<div class="rectangle-info">
                    <h4>Зовнішній прямокутник:</h4>
                    <div class="result-item">
                        <div class="result-label">Сторона c:</div>
                        <div class="result-value">${data.outerRectangle.sideC.toFixed(4)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Сторона d:</div>
                        <div class="result-value">${data.outerRectangle.sideD.toFixed(4)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Площа:</div>
                        <div class="result-value">${data.outerRectangle.area.toFixed(4)}</div>
                    </div>
                </div>`;

                html += `<div class="result-item">
                    <div class="result-label">Варіанти поміщення:</div>
                    <div class="result-value">
                        Без повороту: ${data.fitsWithoutRotation ? '✓ Так' : '✗ Ні'}<br>
                        З поворотом на 90°: ${data.fitsWithRotation ? '✓ Так' : '✗ Ні'}
                    </div>
                </div>`;

                html += `<div class="result-item">
                    <div class="result-label">Відношення площ:</div>
                    <div class="result-value">${data.areaRatio.toFixed(2)}%</div>
                </div>`;

                resultsContent.innerHTML = html;
                resultsContainer.style.display = 'block';

                if (data.canFit) {
                    addConsoleLine(`Результат: ${data.recommendation}`, 'output success');
                } else {
                    addConsoleLine('Результат: Прямокутник не поміщається', 'output error');
                }
            }

        } catch (error) {
            addConsoleLine(`Помилка: ${error.message}`, 'output error');
            resultsContent.innerHTML = `<div class="result-error">Помилка з'єднання: ${error.message}</div>`;
            resultsContainer.style.display = 'block';
        }
    });
});
