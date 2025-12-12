// Матричний ефект
function initMatrix() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?";
    const matrixArray = matrix.split("");
    
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    
    const drops = [];
    for (let x = 0; x < columns; x++) {
        drops[x] = Math.random() * -100;
    }
    
    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = fontSize + 'px monospace';
        
        for (let i = 0; i < drops.length; i++) {
            const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
            const x = i * fontSize;
            const y = drops[i] * fontSize;
            
            ctx.fillText(text, x, y);
            
            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            
            drops[i]++;
        }
    }
    
    setInterval(draw, 35);
    
    // Перемалювання при зміні розміру вікна
    window.addEventListener('resize', function() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Початковий екран
document.addEventListener('DOMContentLoaded', function() {
    const splashScreen = document.getElementById('splashScreen');
    const mainContainer = document.getElementById('mainContainer');
    
    // Ініціалізація матричного ефекту
    initMatrix();
    
    // Обробка натискання Enter
    function handleEnter() {
        if (splashScreen) {
            splashScreen.classList.add('hidden');
            setTimeout(() => {
                splashScreen.style.display = 'none';
                if (mainContainer) {
                    mainContainer.style.display = 'flex';
                }
            }, 500);
        }
    }
    
    // Слухачі подій
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            handleEnter();
        }
    });
    
    // Клік по екрану також закриває початковий екран
    if (splashScreen) {
        splashScreen.addEventListener('click', handleEnter);
    }
    
    // Показ основного контенту після закриття початкового екрану
    const labsGrid = document.getElementById('labsGrid');
    
    // Дані про лабораторні роботи
    const labs = [
        { number: 1, title: 'Лабораторна робота 1', description: 'Задача про зустріч двох автомобілів', status: 'active' },
        { number: 2, title: 'Лабораторна робота 2', description: 'Перевірка поміщення прямокутників', status: 'active' },
        { number: 3, title: 'Лабораторна робота 3', description: 'Перевірка належності точки трикутнику', status: 'active' },
        { number: 4, title: 'Лабораторна робота 4', description: 'Реверсування порядку цифр числа', status: 'active' },
        { number: 5, title: 'Лабораторна робота 5', description: 'В розробці', status: 'pending' },
        { number: 6, title: 'Лабораторна робота 6', description: 'В розробці', status: 'pending' },
        { number: 7, title: 'Лабораторна робота 7', description: 'В розробці', status: 'pending' },
        { number: 8, title: 'Лабораторна робота 8', description: 'В розробці', status: 'pending' },
        { number: 9, title: 'Лабораторна робота 9', description: 'В розробці', status: 'pending' },
        { number: 10, title: 'Лабораторна робота 10', description: 'В розробці', status: 'pending' },
        { number: 11, title: 'Лабораторна робота 11', description: 'В розробці', status: 'pending' }
    ];
    
    // Створення карток лабораторних робіт
    if (labsGrid) {
        labs.forEach(lab => {
            const card = document.createElement('div');
            card.className = 'lab-card';
            card.dataset.labNumber = lab.number;
            
            card.innerHTML = `
                <div class="lab-number">Lab ${lab.number}</div>
                <div class="lab-title">${lab.title}</div>
                <div class="lab-status ${lab.status}">${lab.status === 'active' ? 'Готово' : 'В розробці'}</div>
                <div class="lab-description">${lab.description}</div>
            `;
            
            // Обробка кліку
            card.addEventListener('click', function() {
                if (lab.status === 'active') {
                    // Перехід на лабораторну роботу
                    window.location.href = `/lab${lab.number}/index.html`;
                } else {
                    // Показати повідомлення
                    const consoleOutput = document.getElementById('consoleOutput');
                    if (consoleOutput) {
                        const line = document.createElement('div');
                        line.className = 'console-line';
                        line.innerHTML = `<span class="output warning">Лабораторна робота ${lab.number} ще не готова</span>`;
                        consoleOutput.appendChild(line);
                        consoleOutput.scrollTop = consoleOutput.scrollHeight;
                    }
                }
            });
            
            // Ефект при наведенні
            card.addEventListener('mouseenter', function() {
                if (lab.status === 'active') {
                    card.style.cursor = 'pointer';
                }
            });
            
            labsGrid.appendChild(card);
        });
        
        // Додавання інформації про вибір (після закриття початкового екрану)
        function showLabsInfo() {
            const consoleOutput = document.getElementById('consoleOutput');
            if (consoleOutput) {
                const line = document.createElement('div');
                line.className = 'console-line';
                line.innerHTML = `<span class="output">Доступно лабораторних робіт: <span class="output success">${labs.filter(l => l.status === 'active').length}</span></span>`;
                consoleOutput.appendChild(line);
                consoleOutput.scrollTop = consoleOutput.scrollHeight;
            }
        }
        
        // Показуємо інформацію тільки після закриття початкового екрану
        setTimeout(() => {
            if (mainContainer && mainContainer.style.display !== 'none') {
                showLabsInfo();
            }
        }, 1000);
    }
});
