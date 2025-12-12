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
            input.step = '0.01';
            input.name = `arr${i}`;
            input.id = `arr${i}`;
            input.required = true;
            input.placeholder = '0.0';
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
            array.push(parseFloat(input.value));
        }

        addConsoleLine(`Введено масив розміром ${n}`, 'output');
        addConsoleLine(`Масив: [${array.join(', ')}]`, 'output');
        addConsoleLine('Виконую обчислення...', 'output');

        const params = new URLSearchParams();
        params.append('n', n.toString());
        for (let i = 0; i < array.length; ++i) {
            params.append(`arr${i}`, array[i].toString());
        }

        try {
            const response = await fetch('/lab7/api/calculate?' + params.toString(), {
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

                // Відображення оригінального масиву
                html += `<div class="array-display">
                    <div class="array-display-label">Оригінальний масив</div>
                    <div class="array-values">`;
                data.originalArray.forEach((val, idx) => {
                    html += `<span class="array-value original">[${idx}] = ${val.toFixed(6)}</span>`;
                });
                html += `</div></div>`;

                // Відображення результуючого масиву
                html += `<div class="array-display">
                    <div class="array-display-label">Результуючий масив</div>
                    <div class="array-values">`;
                data.resultArray.forEach((val, idx) => {
                    html += `<span class="array-value result">[${idx}] = ${val.toFixed(6)}</span>`;
                });
                html += `</div></div>`;

                // Таблиця з детальними кроками
                if (data.steps && data.steps.length > 0) {
                    html += `<div class="result-item">
                        <h4 style="color: #4ec9b0; margin-bottom: 10px;">Детальні розрахунки:</h4>
                        <table class="steps-table">
                            <thead>
                                <tr>
                                    <th>Індекс</th>
                                    <th>Оригінальне значення</th>
                                    <th>Сума до цього моменту</th>
                                    <th>Кількість елементів</th>
                                    <th>Середнє арифметичне</th>
                                </tr>
                            </thead>
                            <tbody>`;
                    
                    data.steps.forEach((step) => {
                        html += `<tr>
                            <td style="color: #dcdcaa; font-weight: bold;">${step.index}</td>
                            <td style="color: #dcdcaa;">${step.originalValue.toFixed(6)}</td>
                            <td style="color: #4ec9b0;">${step.runningSum.toFixed(6)}</td>
                            <td style="color: #888;">${step.count}</td>
                            <td style="color: #4ec9b0; font-weight: bold;">${step.average.toFixed(6)}</td>
                        </tr>`;
                    });
                    
                    html += `</tbody></table></div>`;
                }

                resultsContent.innerHTML = html;
                resultsContainer.style.display = 'block';

                addConsoleLine(`Обчислення завершено успішно`, 'output success');
            }

        } catch (error) {
            addConsoleLine(`Помилка: ${error.message}`, 'output error');
            resultsContent.innerHTML = `<div class="result-error">Помилка з'єднання: ${error.message}</div>`;
            resultsContainer.style.display = 'block';
        }
    });
});
