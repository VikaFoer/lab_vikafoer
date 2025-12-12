document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calculationForm');
    const nInput = document.getElementById('n');
    const generateBtn = document.getElementById('generateArrayBtn');
    const arrayInputs = document.getElementById('arrayInputs');
    const calculateBtn = document.querySelector('.btn-calculate');
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

    generateBtn.addEventListener('click', function() {
        const n = parseInt(nInput.value);
        if (n < 1 || n > 100) {
            addConsoleLine('Помилка: n має бути від 1 до 100', 'output error');
            return;
        }

        arrayInputs.innerHTML = '';
        for (let i = 0; i < n; ++i) {
            const div = document.createElement('div');
            div.className = 'array-input-item';
            const label = document.createElement('label');
            label.textContent = `Елемент [${i}]:`;
            const input = document.createElement('input');
            input.type = 'number';
            input.step = '1';
            input.min = '1';
            input.name = `arr${i}`;
            input.id = `arr${i}`;
            input.required = true;
            input.placeholder = '1';
            div.appendChild(label);
            div.appendChild(input);
            arrayInputs.appendChild(div);
        }

        calculateBtn.style.display = 'block';
        addConsoleLine(`Створено ${n} полів для введення масиву`, 'output success');
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const n = parseInt(nInput.value);
        const array = [];
        
        for (let i = 0; i < n; ++i) {
            const input = document.getElementById(`arr${i}`);
            if (!input || !input.value) {
                addConsoleLine(`Помилка: не введено значення для елемента [${i}]`, 'output error');
                return;
            }
            const value = parseInt(input.value);
            if (value < 1) {
                addConsoleLine(`Помилка: елемент [${i}] має бути натуральним числом (>= 1)`, 'output error');
                return;
            }
            array.push(value);
        }

        addConsoleLine(`Введено масив розміром ${n}`, 'output');
        addConsoleLine(`Масив: [${array.join(', ')}]`, 'output');
        addConsoleLine('Виконую видалення простих чисел...', 'output');

        const params = new URLSearchParams();
        params.append('n', n.toString());
        for (let i = 0; i < array.length; ++i) {
            params.append(`arr${i}`, array[i].toString());
        }

        try {
            const response = await fetch('/lab10/api/calculate?' + params.toString(), {
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

                // Статистика
                html += `<div class="stats-info">
                    <div class="stat-item">
                        <div class="stat-label">Видалено простих чисел</div>
                        <div class="stat-value removed">${data.removedCount}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Залишилось елементів</div>
                        <div class="stat-value">${data.remainingCount}</div>
                    </div>
                </div>`;

                // Відображення вихідного масиву
                html += `<div class="array-display">
                    <div class="array-display-label">Вихідний масив</div>
                    <div class="array-values">`;
                for (let i = 0; i < data.originalArray.length; ++i) {
                    const isPrime = data.isPrimeFlags[i];
                    const className = isPrime ? 'prime' : 'not-prime';
                    html += `<div class="array-value ${className}">
                        <span class="index">${i}</span>
                        ${data.originalArray[i]}
                    </div>`;
                }
                html += `</div></div>`;

                // Відображення результуючого масиву
                html += `<div class="array-display">
                    <div class="array-display-label">Результуючий масив (прості числа видалено)</div>
                    <div class="array-values">`;
                if (data.resultArray.length > 0) {
                    data.resultArray.forEach((val, idx) => {
                        html += `<div class="array-value not-prime">
                            ${val}
                        </div>`;
                    });
                } else {
                    html += `<div style="color: #888; font-style: italic;">Масив порожній (всі елементи були простими)</div>`;
                }
                html += `</div></div>`;

                // Детальна інформація
                html += `<div class="result-item">
                    <h4 style="color: #4ec9b0; margin-bottom: 10px;">Детальна інформація про елементи:</h4>
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th>Індекс</th>
                                <th>Значення</th>
                                <th>Дільники</th>
                                <th>Просте?</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>`;
                
                data.details.forEach((detail) => {
                    html += `<tr>
                        <td>${detail.index}</td>
                        <td class="${detail.isPrime ? 'detail-prime' : 'detail-not-prime'}">${detail.value}</td>
                        <td>[${detail.divisors.join(', ')}]</td>
                        <td class="${detail.isPrime ? 'detail-prime' : 'detail-not-prime'}">${detail.isPrime ? 'Так' : 'Ні'}</td>
                        <td class="${detail.removed ? 'detail-prime' : 'detail-not-prime'}">${detail.removed ? 'Видалено' : 'Залишено'}</td>
                    </tr>`;
                });
                
                html += `</tbody></table></div>`;

                // Легенда
                html += `<div style="margin-top: 15px; padding: 10px; background: #1e1e1e; border-radius: 4px;">
                    <div style="color: #888; font-size: 12px; margin-bottom: 5px;">Легенда:</div>
                    <div style="color: #f48771; font-size: 11px;">• Червоне - просте число (видалено)</div>
                    <div style="color: #4ec9b0; font-size: 11px;">• Зелене - не просте число (залишено)</div>
                </div>`;

                resultsContent.innerHTML = html;
                resultsContainer.style.display = 'block';

                addConsoleLine(`Видалено ${data.removedCount} простих чисел`, 'output success');
                addConsoleLine(`Залишилось ${data.remainingCount} елементів`, 'output success');
            }

        } catch (error) {
            addConsoleLine(`Помилка: ${error.message}`, 'output error');
            resultsContent.innerHTML = `<div class="result-error">Помилка з'єднання: ${error.message}</div>`;
            resultsContainer.style.display = 'block';
        }
    });
});
