# Використовуємо базовий образ з C++ компілятором
FROM ubuntu:22.04

# Встановлюємо необхідні залежності
RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Встановлюємо робочу директорію
WORKDIR /app

# Копіюємо всі файли проекту
COPY . .

# Компілюємо сервер
RUN g++ -std=c++17 main_server.cpp -o main_server -pthread

# Відкриваємо порт (Railway встановить свій порт через змінну PORT)
EXPOSE 8080

# Запускаємо сервер
CMD ["./main_server"]

