document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calculationForm');
    const nInput = document.getElementById('n');
    const generateBtn = document.getElementById('generateSequenceBtn');
    const sequenceInputs = document.getElementById('sequenceInputs');
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

        sequenceInputs.innerHTML = '';
        for (let i = 0; i < n; ++i) {
            const div = document.createElement('div');
            div.className = 'sequence-input-item';
            const label = document.createElement('label');
            label.textContent = `a${i + 1}:`;
            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.01';
            input.name = `a${i + 1}`;
            input.id = `a${i + 1}`;
            input.required = true;
            input.placeholder = '0.0';
            div.appendChild(label);
            div.appendChild(input);
            sequenceInputs.appendChild(div);
        }

        calculateBtn.style.display = 'block';
        addConsoleLine(`Створено ${n} полів для введення послідовності`, 'output success');
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const n = parseInt(nInput.value);
        const sequence = [];
        
        for (let i = 0; i < n; ++i) {
            const input = document.getElementById(`a${i + 1}`);
            if (!input || !input.value) {
                addConsoleLine(`Помилка: не введено значення для a${i + 1}`, 'output error');
                return;
            }
            sequence.push(parseFloat(input.value));
        }

        addConsoleLine(`Введено послідовність з ${n} елементів`, 'output');
        addConsoleLine(`Послідовність: [${sequence.join(', ')}]`, 'output');
        addConsoleLine('Виконую фільтрацію...', 'output');

        const params = new URLSearchParams();
        params.append('n', n.toString());
        for (let i = 0; i < sequence.length; ++i) {
            params.append(`a${i + 1}`, sequence[i].toString());
        }

        try {
            const response = await fetch('/lab12/api/calculate?' + params.toString(), {
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
                        <div class="stat-label">Середнє арифметичне</div>
                        <div class="stat-value">${data.average.toFixed(6)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Діапазон (±10%)</div>
                        <div class="stat-value">[${data.lowerBound.toFixed(6)}, ${data.upperBound.toFixed(6)}]</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Видалено елементів</div>
                        <div class="stat-value removed">${data.removedCount}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Залишилось елементів</div>
                        <div class="stat-value">${data.remainingCount}</div>
                    </div>
                </div>`;

                // Інформація про діапазон
                html += `<div class="range-info">
                    <h4>Діапазон допустимих значень:</h4>
                    <div class="range-item">Середнє: ${data.average.toFixed(6)}</div>
                    <div class="range-item">Допустиме відхилення: ±10%</div>
                    <div class="range-item">Нижня межа: ${data.lowerBound.toFixed(6)}</div>
                    <div class="range-item">Верхня межа: ${data.upperBound.toFixed(6)}</div>
                </div>`;

                // Відображення вихідної послідовності
                html += `<div class="sequence-display">
                    <div class="sequence-display-label">Вихідна послідовність</div>
                    <div class="sequence-values">`;
                for (let i = 0; i < data.originalArray.length; ++i) {
                    const detail = data.details[i];
                    const className = detail.inRange ? 'kept' : 'removed';
                    html += `<div class="sequence-value ${className}">
                        <span class="index">${i}</span>
                        ${data.originalArray[i].toFixed(6)}
                    </div>`;
                }
                html += `</div></div>`;

                // Відображення відфільтрованої послідовності
                html += `<div class="sequence-display">
                    <div class="sequence-display-label">Відфільтрована послідовність (видалені елементи, що відрізняються не більш ніж на 10%)</div>
                    <div class="sequence-values">`;
                if (data.filteredArray.length > 0) {
                    data.filteredArray.forEach((val) => {
                        html += `<div class="sequence-value kept">${val.toFixed(6)}</div>`;
                    });
                } else {
                    html += `<div style="color: #888; font-style: italic;">Послідовність порожня (всі елементи були видалені)</div>`;
                }
                html += `</div></div>`;

                // Детальна таблиця
                html += `<div class="result-item">
                    <h4 style="color: #4ec9b0; margin-bottom: 10px;">Детальна інформація про елементи:</h4>
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th>Індекс</th>
                                <th>Значення</th>
                                <th>Відхилення</th>
                                <th>Відхилення (%)</th>
                                <th>В діапазоні?</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>`;
                
                data.details.forEach((detail) => {
                    const rowClass = detail.inRange ? 'detail-removed' : 'detail-kept';
                    html += `<tr>
                        <td>${detail.index}</td>
                        <td class="${rowClass}">${detail.value.toFixed(6)}</td>
                        <td>${detail.deviation.toFixed(6)}</td>
                        <td>${detail.deviationPercent.toFixed(2)}%</td>
                        <td class="${rowClass}">${detail.inRange ? 'Так' : 'Ні'}</td>
                        <td class="${rowClass}">${detail.inRange ? 'Видалено' : 'Залишено'}</td>
                    </tr>`;
                });
                
                html += `</tbody></table></div>`;

                // Легенда
                html += `<div style="margin-top: 15px; padding: 10px; background: #1e1e1e; border-radius: 4px;">
                    <div style="color: #888; font-size: 12px; margin-bottom: 5px;">Легенда:</div>
                    <div style="color: #f48771; font-size: 11px;">• Червоне - елемент відрізняється від середнього не більш ніж на 10% (видалено)</div>
                    <div style="color: #4ec9b0; font-size: 11px;">• Зелене - елемент відрізняється від середнього більш ніж на 10% (залишено)</div>
                </div>`;

                resultsContent.innerHTML = html;
                resultsContainer.style.display = 'block';

                addConsoleLine(`Середнє арифметичне: ${data.average.toFixed(6)}`, 'output');
                addConsoleLine(`Видалено ${data.removedCount} елементів`, 'output success');
                addConsoleLine(`Залишилось ${data.remainingCount} елементів`, 'output success');
            }

        } catch (error) {
            addConsoleLine(`Помилка: ${error.message}`, 'output error');
            resultsContent.innerHTML = `<div class="result-error">Помилка з'єднання: ${error.message}</div>`;
            resultsContainer.style.display = 'block';
        }
    });
});

