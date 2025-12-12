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
        addConsoleLine(`Перший прямокутник: a = ${a}, b = ${b}`, 'output');
        addConsoleLine(`Другий прямокутник: c = ${c}, d = ${d}`, 'output');
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

                // Головний результат
                html += `<div class="result-item">
                    <div class="result-label">Результат перевірки:</div>
                    <div class="result-value ${data.canFit ? 'yes' : 'no'}">
                        ${data.canFit ? '✓ МОЖНА помістити' : '✗ НЕ МОЖНА помістити'}
                    </div>
                </div>`;

                // Інформація про прямокутники
                html += `<div class="rectangle-info">
                    <h4>Перший прямокутник (внутрішній):</h4>
                    <div class="result-item">
                        <div class="result-label">Сторона a:</div>
                        <div class="result-value">${data.rectangle1.side1.toFixed(4)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Сторона b:</div>
                        <div class="result-value">${data.rectangle1.side2.toFixed(4)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Площа:</div>
                        <div class="result-value">${data.rectangle1.area.toFixed(4)}</div>
                    </div>
                </div>`;

                html += `<div class="rectangle-info">
                    <h4>Другий прямокутник (зовнішній):</h4>
                    <div class="result-item">
                        <div class="result-label">Сторона c:</div>
                        <div class="result-value">${data.rectangle2.side1.toFixed(4)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Сторона d:</div>
                        <div class="result-value">${data.rectangle2.side2.toFixed(4)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Площа:</div>
                        <div class="result-value">${data.rectangle2.area.toFixed(4)}</div>
                    </div>
                </div>`;

                // Варіанти розміщення
                html += `<div class="variant-info ${data.variants.variant1.possible ? 'possible' : 'impossible'}">
                    <h4>Варіант 1: ${data.variants.variant1.description}</h4>
                    <div class="result-item">
                        <div class="result-label">Умова:</div>
                        <div class="result-value">${data.variants.variant1.condition}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Перевірка:</div>
                        <div class="result-value">${data.variants.variant1.check}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Результат:</div>
                        <div class="result-value ${data.variants.variant1.possible ? 'yes' : 'no'}">
                            ${data.variants.variant1.possible ? '✓ Можливо' : '✗ Неможливо'}
                        </div>
                    </div>
                </div>`;

                html += `<div class="variant-info ${data.variants.variant2.possible ? 'possible' : 'impossible'}">
                    <h4>Варіант 2: ${data.variants.variant2.description}</h4>
                    <div class="result-item">
                        <div class="result-label">Умова:</div>
                        <div class="result-value">${data.variants.variant2.condition}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Перевірка:</div>
                        <div class="result-value">${data.variants.variant2.check}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Результат:</div>
                        <div class="result-value ${data.variants.variant2.possible ? 'yes' : 'no'}">
                            ${data.variants.variant2.possible ? '✓ Можливо' : '✗ Неможливо'}
                        </div>
                    </div>
                </div>`;

                resultsContent.innerHTML = html;
                resultsContainer.style.display = 'block';

                addConsoleLine(`Результат: ${data.canFit ? 'МОЖНА помістити' : 'НЕ МОЖНА помістити'}`, 
                    data.canFit ? 'output success' : 'output error');
            }

        } catch (error) {
            addConsoleLine(`Помилка: ${error.message}`, 'output error');
            resultsContent.innerHTML = `<div class="result-error">Помилка з'єднання: ${error.message}</div>`;
            resultsContainer.style.display = 'block';
        }
    });
});
