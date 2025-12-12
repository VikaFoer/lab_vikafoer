#include <iostream>
#include <thread>
#include "../common/server_base.h"

int main() {
    std::cout << "=== Лабораторна робота 2 ===" << std::endl;
    std::cout << "Відкрийте браузер і перейдіть на http://localhost:8080" << std::endl;

    SimpleHTTPServer server(8080);
    
    std::thread serverThread([&server]() {
        server.start();
    });

    std::cout << "Натисніть Enter для зупинки сервера...\n";
    std::cin.get();

    server.stop();
    serverThread.join();

    return 0;
}

