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

        const n = parseInt(document.getElementById('n').value);

        addConsoleLine(`Введено n = ${n}`, 'output');
        addConsoleLine('Виконую обчислення тригонометричної суми...', 'output');

        const params = new URLSearchParams({
            n: n.toString()
        });

        try {
            const response = await fetch('/lab5/api/calculate?' + params.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            console.log('Response text:', text);
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('JSON parse error:', e);
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
                
                let html = '';

                // Відображення загальної суми
                html += `<div class="sum-display">
                    <div class="sum-label">Загальна сума (n = ${data.n})</div>
                    <div class="sum-value">${data.totalSum.toFixed(10)}</div>
                </div>`;

                // Таблиця з доданками
                if (data.terms && data.terms.length > 0) {
                    html += `<div class="result-item">
                        <h4 style="color: #4ec9b0; margin-bottom: 10px;">Детальні розрахунки:</h4>
                        <table class="terms-table">
                            <thead>
                                <tr>
                                    <th>k</th>
                                    <th>Σ cos (2..k+1)</th>
                                    <th>Σ sin (1..k)</th>
                                    <th>Доданок</th>
                                    <th>Часткова сума</th>
                                </tr>
                            </thead>
                            <tbody>`;
                    
                    data.terms.forEach((term, index) => {
                        html += `<tr>
                            <td class="term-k">${term.k}</td>
                            <td class="term-value">${term.cosSum.toFixed(6)}</td>
                            <td class="term-value">${term.sinSum.toFixed(6)}</td>
                            <td class="term-value">${term.term.toFixed(6)}</td>
                            <td class="term-partial">${term.partialSum.toFixed(6)}</td>
                        </tr>`;
                    });
                    
                    html += `</tbody></table></div>`;
                }

                // Додаткова інформація
                html += `<div class="result-item">
                    <div class="result-label">Кількість доданків:</div>
                    <div class="result-value">${data.n}</div>
                </div>`;

                resultsContent.innerHTML = html;
                resultsContainer.style.display = 'block';

                addConsoleLine(`Загальна сума: ${data.totalSum.toFixed(10)}`, 'output success');
            }

        } catch (error) {
            addConsoleLine(`Помилка: ${error.message}`, 'output error');
            resultsContent.innerHTML = `<div class="result-error">Помилка з'єднання: ${error.message}</div>`;
            resultsContainer.style.display = 'block';
        }
    });
});
