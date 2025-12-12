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
            input.step = '1';
            input.name = `a${i + 1}`;
            input.id = `a${i + 1}`;
            input.required = true;
            input.placeholder = '0';
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
            sequence.push(parseInt(input.value));
        }

        addConsoleLine(`Введено послідовність з ${n} елементів`, 'output');
        addConsoleLine(`Послідовність: [${sequence.join(', ')}]`, 'output');
        addConsoleLine('Виконую пошук відрізків з довершених чисел...', 'output');

        const params = new URLSearchParams();
        params.append('n', n.toString());
        for (let i = 0; i < sequence.length; ++i) {
            params.append(`a${i + 1}`, sequence[i].toString());
        }

        try {
            const response = await fetch('/lab9/api/calculate?' + params.toString(), {
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

                // Відображення послідовності з позначками довершених чисел
                html += `<div class="sequence-display">
                    <div class="sequence-display-label">Послідовність з позначками довершених чисел</div>
                    <div class="sequence-values">`;
                for (let i = 0; i < data.sequence.length; ++i) {
                    const isPerfect = data.perfectFlags[i];
                    const className = isPerfect ? 'perfect' : 'not-perfect';
                    html += `<div class="sequence-value ${className}">
                        <span class="index">${i}</span>
                        ${data.sequence[i]}
                    </div>`;
                }
                html += `</div></div>`;

                // Відображення знайдених відрізків
                if (data.segments && data.segments.length > 0) {
                    html += `<div class="result-item">
                        <h4 style="color: #4ec9b0; margin-bottom: 15px;">Знайдені відрізки з довершених чисел:</h4>`;
                    
                    data.segments.forEach((segment, idx) => {
                        html += `<div class="segment-display">
                            <div class="segment-display-label">Відрізок ${idx + 1}</div>
                            <div class="segment-info">
                                Індекси: [${segment.start}..${segment.end}], Довжина: ${segment.length}
                            </div>
                            <div class="segment-elements">`;
                        segment.elements.forEach(elem => {
                            html += `<span class="segment-element">${elem}</span>`;
                        });
                        html += `</div></div>`;
                    });
                    
                    html += `</div>`;
                } else {
                    html += `<div class="no-segments">Відрізків з довершених чисел не знайдено</div>`;
                }

                // Детальна інформація про кожне число
                html += `<div class="number-details">
                    <h4>Детальна інформація про числа:</h4>`;
                
                data.divisorsInfo.forEach((info, idx) => {
                    const isPerfect = info.isPerfect;
                    html += `<div class="detail-item">
                        <div class="detail-label">a${idx + 1} = ${info.number}</div>
                        <div class="detail-value ${isPerfect ? 'perfect' : 'not-perfect'}">
                            Дільники (менші від числа): [${info.divisors.join(', ')}]
                        </div>
                        <div class="detail-value ${isPerfect ? 'perfect' : 'not-perfect'}">
                            Сума дільників: ${info.divisorsSum}
                        </div>
                        <div class="detail-value ${isPerfect ? 'perfect' : 'not-perfect'}">
                            ${isPerfect ? '✓ ДОВЕРШЕНЕ ЧИСЛО' : '✗ Не довершене число'}
                        </div>
                    </div>`;
                });
                
                html += `</div>`;

                resultsContent.innerHTML = html;
                resultsContainer.style.display = 'block';

                if (data.segments && data.segments.length > 0) {
                    addConsoleLine(`Знайдено ${data.segments.length} відрізків з довершених чисел`, 'output success');
                } else {
                    addConsoleLine('Відрізків з довершених чисел не знайдено', 'output warning');
                }
            }

        } catch (error) {
            addConsoleLine(`Помилка: ${error.message}`, 'output error');
            resultsContent.innerHTML = `<div class="result-error">Помилка з'єднання: ${error.message}</div>`;
            resultsContainer.style.display = 'block';
        }
    });
});
