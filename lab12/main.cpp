#include <iostream>
#include <string>
#include <sstream>
#include <thread>
#include <fstream>
#include <iomanip>
#include <map>
#include <algorithm>
#include <cmath>
#include <vector>

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

class ArrayFilterServer {
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

    std::map<std::string, std::string> parseQueryString(const std::string& query) {
        std::map<std::string, std::string> params;
        std::istringstream iss(query);
        std::string pair;
        
        while (std::getline(iss, pair, '&')) {
            pair.erase(0, pair.find_first_not_of(" \t\r\n"));
            pair.erase(pair.find_last_not_of(" \t\r\n") + 1);
            
            if (pair.empty()) continue;
            
            size_t pos = pair.find('=');
            if (pos != std::string::npos) {
                std::string key = pair.substr(0, pos);
                std::string value = pair.substr(pos + 1);
                
                key.erase(0, key.find_first_not_of(" \t\r\n"));
                key.erase(key.find_last_not_of(" \t\r\n") + 1);
                value.erase(0, value.find_first_not_of(" \t\r\n"));
                value.erase(value.find_last_not_of(" \t\r\n") + 1);
                
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
        return params;
    }

    // Обчислення середнього арифметичного через покажчики
    double calculateAverage(double* arr, int n) {
        if (n == 0) return 0.0;
        double sum = 0.0;
        double* ptr = arr;
        for (int i = 0; i < n; ++i) {
            sum += *ptr;
            ptr++;
        }
        return sum / n;
    }

    // Фільтрація масиву через покажчики
    std::vector<double> filterArray(double* arr, int n, double average, double tolerance) {
        std::vector<double> result;
        double* ptr = arr;
        
        double lowerBound = average * (1.0 - tolerance);
        double upperBound = average * (1.0 + tolerance);
        
        for (int i = 0; i < n; ++i) {
            double value = *ptr;
            // Залишаємо елементи, що відрізняються від середнього не більш ніж на 10%
            if (value >= lowerBound && value <= upperBound) {
                result.push_back(value);
            }
            ptr++;
        }
        
        return result;
    }

    std::string processArray(const std::map<std::string, std::string>& params) {
        std::ostringstream result;
        result << std::fixed << std::setprecision(6);
        
        try {
            int n = std::stoi(params.at("n"));
            
            // Перевірка діапазону
            const int MIN_N = 1;
            const int MAX_N = 100;
            
            if (n < MIN_N || n > MAX_N) {
                result << "{\"error\":\"n має бути в діапазоні [" << MIN_N << "; " << MAX_N << "]\"}";
                return result.str();
            }
            
            // Отримуємо масив
            std::vector<double> originalArray;
            for (int i = 0; i < n; ++i) {
                std::string key = "a" + std::to_string(i + 1);
                if (params.find(key) == params.end()) {
                    result << "{\"error\":\"Недостатньо елементів послідовності\"}";
                    return result.str();
                }
                double value = std::stod(params.at(key));
                originalArray.push_back(value);
            }
            
            // Використовуємо покажчики для обчислення середнього
            double average = calculateAverage(originalArray.data(), n);
            const double TOLERANCE = 0.10; // 10%
            
            double lowerBound = average * (1.0 - TOLERANCE);
            double upperBound = average * (1.0 + TOLERANCE);
            
            // Використовуємо покажчики для фільтрації
            std::vector<double> filteredArray = filterArray(originalArray.data(), n, average, TOLERANCE);
            
            // Формуємо детальну інформацію про кожен елемент
            std::vector<std::map<std::string, double>> details;
            double* ptr = originalArray.data();
            for (int i = 0; i < n; ++i) {
                double value = *ptr;
                double deviation = std::abs(value - average);
                double deviationPercent = (deviation / average) * 100.0;
                bool inRange = (value >= lowerBound && value <= upperBound);
                
                std::map<std::string, double> detail;
                detail["index"] = i;
                detail["value"] = value;
                detail["deviation"] = deviation;
                detail["deviationPercent"] = deviationPercent;
                detail["inRange"] = inRange ? 1.0 : 0.0;
                details.push_back(detail);
                
                ptr++;
            }
            
            // Формування JSON відповіді
            result << "{";
            result << "\"success\":true,";
            result << "\"n\":" << n << ",";
            result << "\"average\":" << average << ",";
            result << "\"tolerance\":" << TOLERANCE << ",";
            result << "\"lowerBound\":" << lowerBound << ",";
            result << "\"upperBound\":" << upperBound << ",";
            result << "\"originalArray\":[";
            for (int i = 0; i < n; ++i) {
                if (i > 0) result << ",";
                result << originalArray[i];
            }
            result << "],";
            result << "\"filteredArray\":[";
            for (size_t i = 0; i < filteredArray.size(); ++i) {
                if (i > 0) result << ",";
                result << filteredArray[i];
            }
            result << "],";
            result << "\"removedCount\":" << (n - static_cast<int>(filteredArray.size())) << ",";
            result << "\"remainingCount\":" << filteredArray.size() << ",";
            result << "\"details\":[";
            for (size_t i = 0; i < details.size(); ++i) {
                if (i > 0) result << ",";
                result << "{";
                result << "\"index\":" << (int)details[i]["index"] << ",";
                result << "\"value\":" << details[i]["value"] << ",";
                result << "\"deviation\":" << details[i]["deviation"] << ",";
                result << "\"deviationPercent\":" << details[i]["deviationPercent"] << ",";
                result << "\"inRange\":" << (details[i]["inRange"] == 1.0 ? "true" : "false");
                result << "}";
            }
            result << "]";
            result << "}";

        } catch (const std::exception& e) {
            result << "{\"error\":\"Помилка обробки даних: " << e.what() << "\"}";
        }

        return result.str();
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
        char buffer[8192] = {0};
#ifdef _WIN32
        recv(clientSocket, buffer, sizeof(buffer), 0);
#else
        recv(clientSocket, buffer, sizeof(buffer), 0);
#endif

        std::string request(buffer);
        std::istringstream iss(request);
        std::string method, path, protocol;
        iss >> method >> path >> protocol;

        // Обробка API endpoint для розрахунків
        if (path == "/api/calculate" && method == "POST") {
            size_t bodyPos = request.find("\r\n\r\n");
            if (bodyPos != std::string::npos) {
                std::string body = request.substr(bodyPos + 4);
                std::map<std::string, std::string> params = parseQueryString(body);
                
                if (params.find("n") != params.end()) {
                    std::string result = processArray(params);
                    sendResponse(clientSocket, result, "application/json");
                    return;
                }
            }
            sendResponse(clientSocket, "{\"error\":\"Недостатньо параметрів\"}", "application/json");
            return;
        }

        // Обробка GET запиту з параметрами
        if (path.find("/api/calculate") == 0 && method == "GET") {
            size_t queryPos = path.find('?');
            if (queryPos != std::string::npos) {
                std::string query = path.substr(queryPos + 1);
                std::map<std::string, std::string> params = parseQueryString(query);
                
                if (params.find("n") != params.end()) {
                    std::string result = processArray(params);
                    sendResponse(clientSocket, result, "application/json");
                    return;
                }
            }
            std::string errorJson = "{\"error\":\"Недостатньо параметрів\"}";
            sendResponse(clientSocket, errorJson, "application/json");
            return;
        }

        // Обробка статичних файлів
        if (path == "/") path = "/index.html";

        std::string filePath = "web" + path;
        std::string content = readFile(filePath);
        
        if (content.empty()) {
            sendResponse(clientSocket, "404 Not Found", "text/plain");
        } else {
            sendResponse(clientSocket, content, getMimeType(filePath));
        }
    }

public:
    ArrayFilterServer(int p) : port(p), running(false) {
#ifdef _WIN32
        WSAStartup(MAKEWORD(2, 2), &wsaData);
        serverSocket = INVALID_SOCKET;
#else
        serverSocket = -1;
#endif
    }

    ~ArrayFilterServer() {
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
        std::cout << "  Лабораторна робота 12" << std::endl;
        std::cout << "  Фільтрація послідовності за відхиленням від середнього" << std::endl;
        std::cout << "  Сервер запущено на http://localhost:" << port << std::endl;
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
    std::cout << "=== Лабораторна робота 12 ===" << std::endl;
    std::cout << "Фільтрація послідовності за відхиленням від середнього" << std::endl;
    std::cout << "Відкрийте браузер і перейдіть на http://localhost:8080" << std::endl;

    ArrayFilterServer server(8080);
    
    std::thread serverThread([&server]() {
        server.start();
    });

    std::cout << "Натисніть Enter для зупинки сервера...\n";
    std::cin.get();

    server.stop();
    serverThread.join();

    return 0;
}

