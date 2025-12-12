document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calculationForm');
    const mInput = document.getElementById('m');
    const generateBtn = document.getElementById('generateNumbersBtn');
    const numbersInputs = document.getElementById('numbersInputs');
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
        const m = parseInt(mInput.value);
        if (m < 2 || m > 50) {
            addConsoleLine('Помилка: m має бути від 2 до 50', 'output error');
            return;
        }

        numbersInputs.innerHTML = '';
        for (let i = 0; i < m; ++i) {
            const div = document.createElement('div');
            div.className = 'number-input-item';
            const label = document.createElement('label');
            label.textContent = `n${i + 1}:`;
            const input = document.createElement('input');
            input.type = 'number';
            input.step = '1';
            input.min = '1';
            input.name = `n${i + 1}`;
            input.id = `n${i + 1}`;
            input.required = true;
            input.placeholder = '1';
            div.appendChild(label);
            div.appendChild(input);
            numbersInputs.appendChild(div);
        }

        calculateBtn.style.display = 'block';
        addConsoleLine(`Створено ${m} полів для введення чисел`, 'output success');
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const m = parseInt(mInput.value);
        const numbers = [];
        
        for (let i = 0; i < m; ++i) {
            const input = document.getElementById(`n${i + 1}`);
            if (!input || !input.value) {
                addConsoleLine(`Помилка: не введено значення для n${i + 1}`, 'output error');
                return;
            }
            const value = parseInt(input.value);
            if (value < 1) {
                addConsoleLine(`Помилка: n${i + 1} має бути натуральним числом (>= 1)`, 'output error');
                return;
            }
            numbers.push(value);
        }

        addConsoleLine(`Введено ${m} чисел: [${numbers.join(', ')}]`, 'output');
        addConsoleLine('Виконую рекурсивне обчислення НСД...', 'output');

        const params = new URLSearchParams();
        params.append('m', m.toString());
        for (let i = 0; i < numbers.length; ++i) {
            params.append(`n${i + 1}`, numbers[i].toString());
        }

        try {
            const response = await fetch('/lab11/api/calculate?' + params.toString(), {
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

                // Відображення вхідних чисел
                html += `<div class="numbers-display">
                    <div class="numbers-display-label">Вхідні числа</div>
                    <div class="numbers-values">`;
                data.numbers.forEach((num, idx) => {
                    html += `<div class="number-value">n${idx + 1} = ${num}</div>`;
                });
                html += `</div></div>`;

                // Відображення результату
                html += `<div class="gcd-display">
                    <div class="gcd-label">Найбільший спільний дільник (НСД)</div>
                    <div class="gcd-value">${data.finalGCD}</div>
                </div>`;

                // Відображення кроків рекурсії
                if (data.steps && data.steps.length > 0) {
                    html += `<div class="steps-container">
                        <h4 style="color: #4ec9b0; margin-bottom: 15px;">Кроки рекурсивного обчислення:</h4>`;
                    
                    data.steps.forEach((step, idx) => {
                        const stepClass = step.type === 'base' ? 'base' : 'recursive';
                        html += `<div class="step-item ${stepClass}">
                            <div class="step-header">Крок ${step.step}: ${step.type === 'base' ? 'Базовий випадок' : 'Рекурсивний крок'}</div>
                            <div class="step-description">${step.description}</div>`;
                        
                        if (step.type === 'base') {
                            html += `<div class="step-content">Індекси: [${step.start}..${step.end}]</div>`;
                            html += `<div class="step-content">Значення: ${step.value}</div>`;
                            html += `<div class="step-formula">НСД = ${step.gcd}</div>`;
                        } else {
                            html += `<div class="step-content">Індекси: [${step.start}..${step.end}]</div>`;
                            html += `<div class="step-content">НСД(n₁..nₖ₋₁) = ${step.leftGCD}</div>`;
                            html += `<div class="step-content">nₖ = ${step.rightValue}</div>`;
                            html += `<div class="step-formula">НСД(${step.leftGCD}, ${step.rightValue}) = ${step.gcd}</div>`;
                        }
                        
                        html += `</div>`;
                    });
                    
                    html += `</div>`;
                }

                resultsContent.innerHTML = html;
                resultsContainer.style.display = 'block';

                addConsoleLine(`НСД(${data.numbers.join(', ')}) = ${data.finalGCD}`, 'output success');
            }

        } catch (error) {
            addConsoleLine(`Помилка: ${error.message}`, 'output error');
            resultsContent.innerHTML = `<div class="result-error">Помилка з'єднання: ${error.message}</div>`;
            resultsContainer.style.display = 'block';
        }
    });
});
