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

        const number = parseInt(document.getElementById('number').value);

        addConsoleLine(`Введено число: ${number}`, 'output');
        addConsoleLine('Виконую реверсування цифр...', 'output');

        const params = new URLSearchParams({
            number: number.toString()
        });

        try {
            const response = await fetch('/lab4/api/calculate?' + params.toString(), {
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

                // Відображення оригінального числа
                html += `<div class="number-display original">
                    <div class="number-display-label">Оригінальне число</div>
                    <div class="number-display-value">${data.original.number}</div>
                </div>`;

                // Стрілка
                html += `<div class="result-value arrow">↓</div>`;

                // Відображення реверсованого числа
                html += `<div class="number-display reversed">
                    <div class="number-display-label">Реверсоване число</div>
                    <div class="number-display-value">${data.reversed.number}</div>
                </div>`;

                // Інформація про цифри
                html += `<div class="digits-info">
                    <h4>Деталі:</h4>
                    <div class="result-item">
                        <div class="result-label">Кількість цифр:</div>
                        <div class="result-value">${data.digitCount}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Від'ємне число:</div>
                        <div class="result-value">${data.isNegative ? 'Так' : 'Ні'}</div>
                    </div>
                </div>`;

                // Візуалізація послідовності цифр
                const originalDigits = data.original.digits.split('').filter(d => d !== '-');
                const reversedDigits = data.reversed.digits.split('').filter(d => d !== '-');
                
                html += `<div class="digits-info">
                    <h4>Послідовність цифр:</h4>
                    <div class="digit-sequence">
                        ${originalDigits.map(d => `<span class="digit">${d}</span>`).join('')}
                        <span class="arrow">→</span>
                        ${reversedDigits.reverse().map(d => `<span class="digit">${d}</span>`).join('')}
                    </div>
                </div>`;

                resultsContent.innerHTML = html;
                resultsContainer.style.display = 'block';

                addConsoleLine(`Оригінальне: ${data.original.number}`, 'output');
                addConsoleLine(`Реверсоване: ${data.reversed.number}`, 'output success');
            }

        } catch (error) {
            addConsoleLine(`Помилка: ${error.message}`, 'output error');
            resultsContent.innerHTML = `<div class="result-error">Помилка з'єднання: ${error.message}</div>`;
            resultsContainer.style.display = 'block';
        }
    });
});
