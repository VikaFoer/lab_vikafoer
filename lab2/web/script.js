document.addEventListener('DOMContentLoaded', function() {
    const consoleInput = document.getElementById('consoleInput');
    const consoleOutput = document.getElementById('consoleOutput');
    
    // Фокус на інпут при завантаженні
    consoleInput.focus();
    
    // Додавання нових рядків у консоль
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
    
    // Обробка команд
    function processCommand(command) {
        const cmd = command.trim().toLowerCase();
        
        if (cmd === '') {
            return;
        }
        
        // Показати введену команду
        const commandLine = document.createElement('div');
        commandLine.className = 'console-line';
        commandLine.innerHTML = '<span class="prompt">C:\\LAB__C++\\lab2></span> <span class="command">' + command + '</span>';
        consoleOutput.appendChild(commandLine);
        
        // Обробка різних команд
        if (cmd === 'help' || cmd === '?') {
            addConsoleLine('');
            addConsoleLine('Доступні команди:');
            addConsoleLine('  help, ?          - Показати цю довідку');
            addConsoleLine('  clear, cls        - Очистити консоль');
            addConsoleLine('  status            - Статус сервера');
            addConsoleLine('  info              - Інформація про сервер');
            addConsoleLine('  exit, quit        - Закрити сервер');
            addConsoleLine('');
        } else if (cmd === 'clear' || cmd === 'cls') {
            consoleOutput.innerHTML = '';
            addConsoleLine('Консоль очищено', 'output success');
        } else if (cmd === 'status') {
            addConsoleLine('Статус: Сервер працює', 'output success');
            addConsoleLine('Порт: 8080', 'output');
            addConsoleLine('URL: http://localhost:8080', 'output');
        } else if (cmd === 'info') {
            addConsoleLine('');
            addConsoleLine('=== Інформація про сервер ===');
            addConsoleLine('Версія: 1.0.0');
            addConsoleLine('Мова: C++17');
            addConsoleLine('Платформа: Windows');
            addConsoleLine('Протокол: HTTP/1.1');
            addConsoleLine('');
        } else if (cmd === 'exit' || cmd === 'quit') {
            addConsoleLine('Зупинка сервера...', 'output warning');
            addConsoleLine('Сервер зупинено', 'output error');
        } else {
            addConsoleLine('Невідома команда: ' + command + '. Введіть "help" для списку команд.', 'output error');
        }
        
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
    
    // Обробка натискання Enter
    consoleInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const command = consoleInput.value;
            processCommand(command);
            consoleInput.value = '';
        }
    });
    
    // Запобігання втраті фокусу
    consoleInput.addEventListener('blur', function() {
        setTimeout(() => consoleInput.focus(), 10);
    });
    
    // Додати курсор до інпуту
    function updateCursor() {
        if (document.activeElement === consoleInput) {
            consoleInput.style.borderRight = '2px solid #4ec9b0';
        } else {
            consoleInput.style.borderRight = 'none';
        }
    }
    
    setInterval(updateCursor, 500);
    
    // Додаткові повідомлення при завантаженні
    setTimeout(() => {
        addConsoleLine('Введіть "help" для списку доступних команд', 'output');
    }, 1000);
});
