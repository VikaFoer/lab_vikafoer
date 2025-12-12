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

        const x = parseFloat(document.getElementById('x').value);
        const n = parseInt(document.getElementById('n').value);

        addConsoleLine(`Введено x = ${x}, n = ${n}`, 'output');
        addConsoleLine('Виконую обчислення суми з факторіалами...', 'output');

        const params = new URLSearchParams({
            x: x.toString(),
            n: n.toString()
        });

        try {
            const response = await fetch('/lab6/api/calculate?' + params.toString(), {
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

                // Інформація про параметри
                html += `<div class="params-info">
                    <div class="result-item">
                        <div class="result-label">x:</div>
                        <div class="result-value">${data.x}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">|x|:</div>
                        <div class="result-value">${data.absX.toFixed(6)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">n:</div>
                        <div class="result-value">${data.n}</div>
                    </div>
                </div>`;

                // Відображення загальної суми
                html += `<div class="sum-display">
                    <div class="sum-label">Загальна сума</div>
                    <div class="sum-value">${data.totalSum.toFixed(10)}</div>
                </div>`;

                // Таблиця з доданками
                if (data.terms && data.terms.length > 0) {
                    html += `<div class="result-item">
                        <h4 style="color: #4ec9b0; margin-bottom: 10px;">Детальні розрахунки:</h4>
                        <table class="terms-table">
                            <thead>
                                <tr>
                                    <th>i</th>
                                    <th>(2i)!</th>
                                    <th>(i²)!</th>
                                    <th>Чисельник<br/>((2i)! + |x|)</th>
                                    <th>Знаменник<br/>((i²)!)</th>
                                    <th>Доданок</th>
                                    <th>Часткова сума</th>
                                </tr>
                            </thead>
                            <tbody>`;
                    
                    data.terms.forEach((term, index) => {
                        html += `<tr>
                            <td class="term-i">${term.i}</td>
                            <td class="term-value">${term.fact2i.toExponential(4)}</td>
                            <td class="term-value">${term.factI2.toExponential(4)}</td>
                            <td class="term-value">${term.numerator.toExponential(4)}</td>
                            <td class="term-value">${term.denominator.toExponential(4)}</td>
                            <td class="term-value">${term.term.toFixed(6)}</td>
                            <td class="term-partial">${term.partialSum.toFixed(6)}</td>
                        </tr>`;
                    });
                    
                    html += `</tbody></table></div>`;
                }

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
