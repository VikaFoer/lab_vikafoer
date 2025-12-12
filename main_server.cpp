#include <iostream>
#include <thread>
#include <string>
#include <sstream>
#include <fstream>
#include <map>
#include <iomanip>
#include <cmath>
#include <cstdlib>
#include <cstring>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#endif

class MainServer {
private:
    int port;
    bool running;

#ifdef _WIN32
    SOCKET serverSocket;
    WSADATA wsaData;
#else
    int serverSocket;
#endif

    std::string readFile(const std::string& path) {
        std::ifstream file(path, std::ios::binary);
        if (!file.is_open()) {
            return "";
        }
        std::stringstream buffer;
        buffer << file.rdbuf();
        return buffer.str();
    }

    std::string getMimeType(const std::string& path) {
        if (path.length() >= 5 && path.substr(path.length() - 5) == ".html") return "text/html; charset=utf-8";
        if (path.length() >= 4 && path.substr(path.length() - 4) == ".css") return "text/css";
        if (path.length() >= 3 && path.substr(path.length() - 3) == ".js") return "application/javascript";
        if (path.length() >= 5 && path.substr(path.length() - 5) == ".json") return "application/json";
        return "text/plain";
    }

    void sendResponse(
#ifdef _WIN32
        SOCKET clientSocket,
#else
        int clientSocket,
#endif
        const std::string& content, const std::string& mimeType = "text/html") {
        std::string response = "HTTP/1.1 200 OK\r\n";
        response += "Content-Type: " + mimeType + "\r\n";
        response += "Content-Length: " + std::to_string(content.length()) + "\r\n";
        response += "Access-Control-Allow-Origin: *\r\n";
        response += "\r\n";
        response += content;

#ifdef _WIN32
        send(clientSocket, response.c_str(), (int)response.length(), 0);
        closesocket(clientSocket);
#else
        send(clientSocket, response.c_str(), response.length(), 0);
        close(clientSocket);
#endif
    }

    void handleRequest(
#ifdef _WIN32
        SOCKET clientSocket
#else
        int clientSocket
#endif
    ) {
        char buffer[4096] = {0};
#ifdef _WIN32
        recv(clientSocket, buffer, sizeof(buffer), 0);
#else
        recv(clientSocket, buffer, sizeof(buffer), 0);
#endif

        std::string request(buffer);
        std::istringstream iss(request);
        std::string method, path, protocol;
        iss >> method >> path >> protocol;

        // Обробка головної сторінки
        if (path == "/" || path == "/index.html") {
            std::string content = readFile("index.html");
            if (!content.empty()) {
                sendResponse(clientSocket, content);
            } else {
                sendResponse(clientSocket, "404 Not Found", "text/plain");
            }
            return;
        }

        // Обробка статичних файлів (CSS, JS)
        if (path.find("/static/") == 0) {
            std::string filePath = path.substr(8); // Видаляємо "/static/"
            std::string content = readFile("static/" + filePath);
            if (!content.empty()) {
                sendResponse(clientSocket, content, getMimeType(filePath));
            } else {
                sendResponse(clientSocket, "404 Not Found: " + filePath, "text/plain");
            }
            return;
        }

        // Роутинг для лабораторних робіт
        if (path.find("/lab") == 0) {
            size_t slashPos = path.find('/', 4);
            if (slashPos != std::string::npos) {
                std::string labNum = path.substr(1, slashPos - 1); // lab1, lab2, etc.
                std::string filePath = path.substr(slashPos + 1); // index.html, api/calculate, etc.
                
                // Обробка API endpoint для lab1
                if (labNum == "lab1" && filePath.find("api/calculate") == 0) {
                    // Проксуємо запит до логіки lab1
                    size_t queryPos = filePath.find('?');
                    std::string query = "";
                    if (queryPos != std::string::npos) {
                        query = filePath.substr(queryPos + 1);
                    }
                    
                    // Парсимо параметри
                    std::map<std::string, std::string> params;
                    if (!query.empty()) {
                        std::istringstream iss(query);
                        std::string pair;
                        while (std::getline(iss, pair, '&')) {
                            size_t pos = pair.find('=');
                            if (pos != std::string::npos) {
                                std::string key = pair.substr(0, pos);
                                std::string value = pair.substr(pos + 1);
                                // URL decode
                                std::string decoded;
                                for (size_t i = 0; i < value.length(); ++i) {
                                    if (value[i] == '%' && i + 2 < value.length()) {
                                        try {
                                            int hex = std::stoi(value.substr(i + 1, 2), nullptr, 16);
                                            decoded += (char)hex;
                                            i += 2;
                                        } catch (...) {
                                            decoded += value[i];
                                        }
                                    } else if (value[i] == '+') {
                                        decoded += ' ';
                                    } else {
                                        decoded += value[i];
                                    }
                                }
                                params[key] = decoded;
                            }
                        }
                    }
                    
                    // Виконуємо розрахунки для lab1
                    if (params.size() >= 5) {
                        try {
                            double v1 = std::stod(params.at("v1"));
                            double s1 = std::stod(params.at("s1"));
                            double v2 = std::stod(params.at("v2"));
                            double s2 = std::stod(params.at("s2"));
                            double v3 = std::stod(params.at("v3"));
                            
                            const double MIN_SPEED = 0.1;
                            const double MAX_SPEED = 400.0;
                            const double MIN_DISTANCE = 0.1;
                            const double MAX_DISTANCE = 100000.0;
                            
                            if (v1 < MIN_SPEED || v1 > MAX_SPEED ||
                                v2 < MIN_SPEED || v2 > MAX_SPEED ||
                                v3 < MIN_SPEED || v3 > MAX_SPEED ||
                                s1 < MIN_DISTANCE || s1 > MAX_DISTANCE ||
                                s2 < MIN_DISTANCE || s2 > MAX_DISTANCE) {
                                sendResponse(clientSocket, "{\"error\":\"Значення поза допустимим діапазоном\"}", "application/json");
                                return;
                            }
                            
                            double t = s1 / v2 + s2 / v3;
                            double distance1 = v1 * t;
                            double distance2 = s1 + s2;
                            double totalDistance = distance1 + distance2;
                            
                            if (t <= 0) {
                                sendResponse(clientSocket, "{\"error\":\"Час руху від'ємний або нульовий\"}", "application/json");
                                return;
                            }
                            
                            if (distance1 <= 0 || distance2 <= 0) {
                                sendResponse(clientSocket, "{\"error\":\"Одна з відстаней від'ємна\"}", "application/json");
                                return;
                            }
                            
                            double fraction1 = distance1 / totalDistance;
                            double fraction2 = distance2 / totalDistance;
                            
                            // Формуємо JSON відповідь
                            std::ostringstream json;
                            json << std::fixed << std::setprecision(4);
                            json << "{";
                            json << "\"success\":true,";
                            json << "\"time\":" << t << ",";
                            json << "\"timeHours\":" << (int)t << ",";
                            json << "\"timeMinutes\":" << (int)((t - (int)t) * 60) << ",";
                            json << "\"totalDistance\":" << totalDistance << ",";
                            json << "\"car1\":{";
                            json << "\"distance\":" << distance1 << ",";
                            json << "\"fraction\":" << fraction1 << ",";
                            json << "\"percentage\":" << (fraction1 * 100);
                            json << "},";
                            json << "\"car2\":{";
                            json << "\"distance\":" << distance2 << ",";
                            json << "\"fraction\":" << fraction2 << ",";
                            json << "\"percentage\":" << (fraction2 * 100);
                            json << "},";
                            json << "\"warning\":" << (t > 8760 ? "true" : "false");
                            json << "}";
                            
                            sendResponse(clientSocket, json.str(), "application/json");
                            return;
                        } catch (const std::exception& e) {
                            sendResponse(clientSocket, "{\"error\":\"Помилка обробки даних\"}", "application/json");
                            return;
                        }
                    } else {
                        sendResponse(clientSocket, "{\"error\":\"Недостатньо параметрів\"}", "application/json");
                        return;
                    }
                }
                
                // Обробка статичних файлів
                if (filePath.empty() || filePath == "index.html" || filePath == "/") {
                    filePath = "index.html";
                }
                
                std::string fullPath = labNum + "/web/" + filePath;
                std::string content = readFile(fullPath);
                
                if (!content.empty()) {
                    sendResponse(clientSocket, content, getMimeType(fullPath));
                } else {
                    sendResponse(clientSocket, "404 Not Found: " + fullPath, "text/plain");
                }
            } else {
                // Перенаправлення на index.html
                std::string redirect = "HTTP/1.1 302 Found\r\nLocation: " + path + "/index.html\r\n\r\n";
#ifdef _WIN32
                send(clientSocket, redirect.c_str(), (int)redirect.length(), 0);
                closesocket(clientSocket);
#else
                send(clientSocket, redirect.c_str(), redirect.length(), 0);
                close(clientSocket);
#endif
            }
            return;
        }

        // 404 для інших запитів
        sendResponse(clientSocket, "404 Not Found", "text/plain");
    }

public:
    MainServer(int p) : port(p), running(false) {
#ifdef _WIN32
        WSAStartup(MAKEWORD(2, 2), &wsaData);
        serverSocket = INVALID_SOCKET;
#else
        serverSocket = -1;
#endif
    }

    ~MainServer() {
        stop();
#ifdef _WIN32
        WSACleanup();
#endif
    }

    bool start() {
#ifdef _WIN32
        serverSocket = socket(AF_INET, SOCK_STREAM, 0);
        if (serverSocket == INVALID_SOCKET) {
            std::cerr << "Помилка створення сокету\n";
            return false;
        }

        int opt = 1;
        setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (char*)&opt, sizeof(opt));

        sockaddr_in serverAddr;
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;
        serverAddr.sin_port = htons(port);

        if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
            std::cerr << "Помилка прив'язки сокету\n";
            closesocket(serverSocket);
            return false;
        }

        if (listen(serverSocket, 5) == SOCKET_ERROR) {
            std::cerr << "Помилка прослуховування\n";
            closesocket(serverSocket);
            return false;
        }
#else
        serverSocket = socket(AF_INET, SOCK_STREAM, 0);
        if (serverSocket < 0) {
            std::cerr << "Помилка створення сокету\n";
            return false;
        }

        int opt = 1;
        setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

        sockaddr_in serverAddr;
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;
        serverAddr.sin_port = htons(port);

        if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) < 0) {
            std::cerr << "Помилка прив'язки сокету\n";
            close(serverSocket);
            return false;
        }

        if (listen(serverSocket, 5) < 0) {
            std::cerr << "Помилка прослуховування\n";
            close(serverSocket);
            return false;
        }
#endif

        running = true;
        std::cout << "════════════════════════════════════════" << std::endl;
        std::cout << "  Головний сервер запущено!" << std::endl;
        std::cout << "  URL: http://localhost:" << port << std::endl;
        std::cout << "════════════════════════════════════════" << std::endl;

        while (running) {
#ifdef _WIN32
            sockaddr_in clientAddr;
            int clientAddrLen = sizeof(clientAddr);
            SOCKET clientSocket = accept(serverSocket, (sockaddr*)&clientAddr, &clientAddrLen);
            if (clientSocket == INVALID_SOCKET) {
                if (running) {
                    std::cerr << "Помилка прийняття з'єднання\n";
                }
                continue;
            }
#else
            sockaddr_in clientAddr;
            socklen_t clientAddrLen = sizeof(clientAddr);
            int clientSocket = accept(serverSocket, (sockaddr*)&clientAddr, &clientAddrLen);
            if (clientSocket < 0) {
                if (running) {
                    std::cerr << "Помилка прийняття з'єднання\n";
                }
                continue;
            }
#endif

            std::thread([this, clientSocket]() {
                this->handleRequest(clientSocket);
            }).detach();
        }

        return true;
    }

    void stop() {
        running = false;
#ifdef _WIN32
        if (serverSocket != INVALID_SOCKET) {
            closesocket(serverSocket);
            serverSocket = INVALID_SOCKET;
        }
#else
        if (serverSocket >= 0) {
            close(serverSocket);
            serverSocket = -1;
        }
#endif
    }
};

int main() {
    std::cout << "════════════════════════════════════════" << std::endl;
    std::cout << "  Лабораторні роботи з C++" << std::endl;
    std::cout << "  Головний сервер" << std::endl;
    std::cout << "════════════════════════════════════════" << std::endl;
    std::cout << std::endl;

    // Читаємо порт з змінної оточення (для Railway, Heroku тощо)
    int port = 8080;
    const char* portEnv = std::getenv("PORT");
    if (portEnv != nullptr) {
        port = std::atoi(portEnv);
    }

    MainServer server(port);
    
    std::thread serverThread([&server]() {
        server.start();
    });

    // На Railway/сервері просто чекаємо, поки сервер працює
    // На локальній машині можна використовувати std::cin.get()
    #ifdef _WIN32
    std::cout << "Натисніть Enter для зупинки сервера...\n";
    std::cin.get();
    #else
    // На Linux/сервері просто чекаємо
    std::cout << "Сервер працює. Натисніть Ctrl+C для зупинки.\n";
    serverThread.join();
    #endif

    server.stop();
    if (serverThread.joinable()) {
        serverThread.join();
    }

    return 0;
}
