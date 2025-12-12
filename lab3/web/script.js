// Константи для трикутника
const TRIANGLE_VERTICES = {
    A: { x: 0, y: 1 },
    B: { x: 1, y: -2 },
    C: { x: -1, y: -1 }
};

// Параметри canvas
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;
const PADDING = 50;
const GRID_SIZE = 20;

let currentPoint = null;
let pointBelongs = false;

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calculationForm');
    const resultsContainer = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const consoleOutput = document.getElementById('consoleOutput');
    const canvas = document.getElementById('coordinateCanvas');
    const ctx = canvas.getContext('2d');

    // Ініціалізація canvas
    initCanvas();

    function initCanvas() {
        drawCoordinateSystem();
        drawTriangle();
    }

    function drawCoordinateSystem() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Фон
        ctx.fillStyle = '#1e1e1e';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Сітка
        ctx.strokeStyle = '#2d2d30';
        ctx.lineWidth = 1;
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const scale = GRID_SIZE;

        // Вертикальні лінії сітки
        for (let x = -10; x <= 10; x++) {
            const px = centerX + x * scale;
            ctx.beginPath();
            ctx.moveTo(px, 0);
            ctx.lineTo(px, CANVAS_HEIGHT);
            ctx.stroke();
        }

        // Горизонтальні лінії сітки
        for (let y = -10; y <= 10; y++) {
            const py = centerY - y * scale;
            ctx.beginPath();
            ctx.moveTo(0, py);
            ctx.lineTo(CANVAS_WIDTH, py);
            ctx.stroke();
        }

        // Осі координат
        ctx.strokeStyle = '#4ec9b0';
        ctx.lineWidth = 2;

        // Вісь X
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(CANVAS_WIDTH, centerY);
        ctx.stroke();

        // Вісь Y
        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, CANVAS_HEIGHT);
        ctx.stroke();

        // Підписи осей
        ctx.fillStyle = '#4ec9b0';
        ctx.font = '14px Consolas';
        ctx.textAlign = 'center';
        ctx.fillText('X', CANVAS_WIDTH - 20, centerY - 10);
        ctx.textAlign = 'left';
        ctx.fillText('Y', centerX + 10, 20);

        // Підписи чисел на осях
        ctx.fillStyle = '#888';
        ctx.font = '10px Consolas';
        ctx.textAlign = 'center';

        // Підписи на осі X
        for (let x = -5; x <= 5; x++) {
            if (x === 0) continue;
            const px = centerX + x * scale;
            ctx.fillText(x.toString(), px, centerY + 15);
        }

        // Підписи на осі Y
        ctx.textAlign = 'right';
        for (let y = -5; y <= 5; y++) {
            if (y === 0) continue;
            const py = centerY - y * scale;
            ctx.fillText(y.toString(), centerX - 10, py + 4);
        }

        // Підпис початку координат
        ctx.textAlign = 'right';
        ctx.fillText('0', centerX - 10, centerY + 15);
    }

    function drawTriangle() {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const scale = GRID_SIZE;

        // Заштрихований трикутник
        ctx.fillStyle = 'rgba(78, 201, 176, 0.2)';
        ctx.strokeStyle = '#4ec9b0';
        ctx.lineWidth = 2;

        ctx.beginPath();
        const ax = centerX + TRIANGLE_VERTICES.A.x * scale;
        const ay = centerY - TRIANGLE_VERTICES.A.y * scale;
        const bx = centerX + TRIANGLE_VERTICES.B.x * scale;
        const by = centerY - TRIANGLE_VERTICES.B.y * scale;
        const cx = centerX + TRIANGLE_VERTICES.C.x * scale;
        const cy = centerY - TRIANGLE_VERTICES.C.y * scale;

        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Вершини трикутника
        ctx.fillStyle = '#4ec9b0';
        ctx.beginPath();
        ctx.arc(ax, ay, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Підписи вершин
        ctx.fillStyle = '#4ec9b0';
        ctx.font = '12px Consolas';
        ctx.textAlign = 'center';
        ctx.fillText('A', ax, ay - 15);
        ctx.fillText('B', bx, by - 15);
        ctx.fillText('C', cx, cy - 15);
    }

    function drawPoint(x, y, belongs) {
        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const scale = GRID_SIZE;

        const px = centerX + x * scale;
        const py = centerY - y * scale;

        // Точка
        ctx.fillStyle = belongs ? '#4ec9b0' : '#f48771';
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Обведення
        ctx.strokeStyle = belongs ? '#4ec9b0' : '#f48771';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, 2 * Math.PI);
        ctx.stroke();

        // Підпис точки
        ctx.fillStyle = belongs ? '#4ec9b0' : '#f48771';
        ctx.font = 'bold 12px Consolas';
        ctx.textAlign = 'center';
        ctx.fillText(`P(${x.toFixed(2)}, ${y.toFixed(2)})`, px, py - 15);
    }

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
        const y = parseFloat(document.getElementById('y').value);

        currentPoint = { x, y };

        addConsoleLine(`Перевірка точки: P(${x}, ${y})`, 'output');
        addConsoleLine('Виконую розрахунки...', 'output');

        const params = new URLSearchParams({
            x: x.toString(),
            y: y.toString()
        });

        try {
            const response = await fetch('/lab3/api/calculate?' + params.toString(), {
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
                pointBelongs = data.belongs;
                
                // Оновлюємо canvas
                drawCoordinateSystem();
                drawTriangle();
                drawPoint(x, y, pointBelongs);

                addConsoleLine('=== РЕЗУЛЬТАТИ ===', 'output');
                
                let html = '';

                // Головний результат
                html += `<div class="result-item">
                    <div class="result-label">Результат перевірки:</div>
                    <div class="result-value ${data.belongs ? 'yes' : 'no'}">
                        ${data.belongs ? '✓ Точка НАЛЕЖИТЬ трикутнику' : '✗ Точка НЕ НАЛЕЖИТЬ трикутнику'}
                    </div>
                </div>`;

                // Координати точки
                html += `<div class="result-item">
                    <div class="result-label">Координати точки:</div>
                    <div class="result-value">P(${data.point.x.toFixed(6)}, ${data.point.y.toFixed(6)})</div>
                </div>`;

                // Інформація про трикутник
                html += `<div class="triangle-info">
                    <h4>Вершини трикутника:</h4>
                    <div class="result-item">
                        <div class="result-label">A:</div>
                        <div class="result-value">(${data.triangle.vertexA.x}, ${data.triangle.vertexA.y})</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">B:</div>
                        <div class="result-value">(${data.triangle.vertexB.x}, ${data.triangle.vertexB.y})</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">C:</div>
                        <div class="result-value">(${data.triangle.vertexC.x}, ${data.triangle.vertexC.y})</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Площа трикутника:</div>
                        <div class="result-value">${data.triangle.area.toFixed(6)}</div>
                    </div>
                </div>`;

                // Деталі розрахунків
                html += `<div class="calculation-info">
                    <h4>Деталі розрахунків:</h4>
                    <div class="result-item">
                        <div class="result-label">Площа трикутника PBC:</div>
                        <div class="result-value">${data.calculation.areaPBC.toFixed(6)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Площа трикутника APC:</div>
                        <div class="result-value">${data.calculation.areaAPC.toFixed(6)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Площа трикутника ABP:</div>
                        <div class="result-value">${data.calculation.areaABP.toFixed(6)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Сума площ підтрикутників:</div>
                        <div class="result-value">${data.calculation.totalArea.toFixed(6)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Площа основного трикутника:</div>
                        <div class="result-value">${data.calculation.areaABC.toFixed(6)}</div>
                    </div>
                    <div class="result-item">
                        <div class="result-label">Різниця:</div>
                        <div class="result-value">${data.calculation.difference.toFixed(9)}</div>
                    </div>
                </div>`;

                resultsContent.innerHTML = html;
                resultsContainer.style.display = 'block';

                addConsoleLine(`Результат: ${data.belongs ? 'Точка НАЛЕЖИТЬ трикутнику' : 'Точка НЕ НАЛЕЖИТЬ трикутнику'}`, 
                    data.belongs ? 'output success' : 'output error');
            }

        } catch (error) {
            addConsoleLine(`Помилка: ${error.message}`, 'output error');
            resultsContent.innerHTML = `<div class="result-error">Помилка з'єднання: ${error.message}</div>`;
            resultsContainer.style.display = 'block';
        }
    });

    // Обробка кліку на canvas для введення координат
    canvas.addEventListener('click', function(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = CANVAS_WIDTH / 2;
        const centerY = CANVAS_HEIGHT / 2;
        const scale = GRID_SIZE;

        const coordX = (x - centerX) / scale;
        const coordY = (centerY - y) / scale;

        document.getElementById('x').value = coordX.toFixed(2);
        document.getElementById('y').value = coordY.toFixed(2);

        // Автоматично відправляємо форму
        form.dispatchEvent(new Event('submit'));
    });
});
