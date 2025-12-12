document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calculationForm');
    const mInput = document.getElementById('m');
    const nInput = document.getElementById('n');
    const generateBtn = document.getElementById('generateMatrixBtn');
    const matrixInputs = document.getElementById('matrixInputs');
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
        const n = parseInt(nInput.value);
        
        if (m < 1 || m > 20 || n < 1 || n > 20) {
            addConsoleLine('Помилка: m та n мають бути від 1 до 20', 'output error');
            return;
        }

        matrixInputs.innerHTML = '';
        const table = document.createElement('table');
        table.className = 'matrix-table';
        
        // Заголовок стовпців
        const headerRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        headerRow.appendChild(emptyCell);
        for (let j = 0; j < n; ++j) {
            const th = document.createElement('td');
            th.className = 'col-label';
            th.textContent = j;
            headerRow.appendChild(th);
        }
        table.appendChild(headerRow);
        
        // Рядки матриці
        for (let i = 0; i < m; ++i) {
            const tr = document.createElement('tr');
            const rowLabel = document.createElement('td');
            rowLabel.className = 'row-label';
            rowLabel.textContent = i + ':';
            tr.appendChild(rowLabel);
            
            for (let j = 0; j < n; ++j) {
                const td = document.createElement('td');
                const input = document.createElement('input');
                input.type = 'number';
                input.step = '1';
                input.name = `mat${i}_${j}`;
                input.id = `mat${i}_${j}`;
                input.required = true;
                input.placeholder = '0';
                td.appendChild(input);
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        
        matrixInputs.appendChild(table);
        calculateBtn.style.display = 'block';
        addConsoleLine(`Створено матрицю розміром ${m}×${n}`, 'output success');
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const m = parseInt(mInput.value);
        const n = parseInt(nInput.value);
        const matrix = [];
        
        for (let i = 0; i < m; ++i) {
            matrix[i] = [];
            for (let j = 0; j < n; ++j) {
                const input = document.getElementById(`mat${i}_${j}`);
                if (!input || !input.value) {
                    addConsoleLine(`Помилка: не введено значення для елемента [${i}][${j}]`, 'output error');
                    return;
                }
                matrix[i][j] = parseInt(input.value);
            }
        }

        addConsoleLine(`Введено матрицю розміром ${m}×${n}`, 'output');
        addConsoleLine('Виконую перетворення...', 'output');

        const params = new URLSearchParams();
        params.append('m', m.toString());
        params.append('n', n.toString());
        for (let i = 0; i < m; ++i) {
            for (let j = 0; j < n; ++j) {
                params.append(`mat${i}_${j}`, matrix[i][j].toString());
            }
        }

        try {
            const response = await fetch('/lab8/api/calculate?' + params.toString(), {
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

                // Відображення вихідної матриці
                html += `<div class="matrix-display-container">
                    <div class="matrix-display-label">Вихідна матриця</div>
                    <table class="matrix-display original">
                        <tr>
                            <td class="col-label"></td>`;
                for (let j = 0; j < data.n; ++j) {
                    html += `<td class="col-label">${j}</td>`;
                }
                html += `</tr>`;
                
                for (let i = 0; i < data.m; ++i) {
                    html += `<tr><td class="row-label">${i}:</td>`;
                    for (let j = 0; j < data.n; ++j) {
                        html += `<td>${data.originalMatrix[i][j]}</td>`;
                    }
                    html += `</tr>`;
                }
                html += `</table></div>`;

                // Відображення перетвореної матриці
                html += `<div class="matrix-display-container">
                    <div class="matrix-display-label">Перетворена матриця</div>
                    <table class="matrix-display transformed">
                        <tr>
                            <td class="col-label"></td>`;
                for (let j = 0; j < data.n; ++j) {
                    html += `<td class="col-label">${j}</td>`;
                }
                html += `</tr>`;
                
                for (let i = 0; i < data.m; ++i) {
                    html += `<tr><td class="row-label">${i}:</td>`;
                    for (let j = 0; j < data.n; ++j) {
                        const detail = data.details[i][j];
                        const className = detail.changed === 1 ? 'changed' : 'unchanged';
                        html += `<td class="${className}">${detail.transformedValue}</td>`;
                    }
                    html += `</tr>`;
                }
                html += `</table></div>`;

                // Легенда
                html += `<div style="margin-top: 15px; padding: 10px; background: #1e1e1e; border-radius: 4px;">
                    <div style="color: #888; font-size: 12px; margin-bottom: 5px;">Легенда:</div>
                    <div style="color: #4ec9b0; font-size: 11px;">• Зелене - елемент залишився без змін (зустрічається більше 1 разу)</div>
                    <div style="color: #f48771; font-size: 11px;">• Червоне - елемент замінено на 0 (зустрічається 1 раз)</div>
                </div>`;

                resultsContent.innerHTML = html;
                resultsContainer.style.display = 'block';

                addConsoleLine(`Перетворення завершено успішно`, 'output success');
            }

        } catch (error) {
            addConsoleLine(`Помилка: ${error.message}`, 'output error');
            resultsContent.innerHTML = `<div class="result-error">Помилка з'єднання: ${error.message}</div>`;
            resultsContainer.style.display = 'block';
        }
    });
});
