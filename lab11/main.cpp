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

class GCDArrayServer {
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

    // Функція для обчислення НСД двох чисел (алгоритм Евкліда)
    int gcd(int a, int b) {
        if (b == 0) return a;
        return gcd(b, a % b);
    }

    // Рекурсивна функція для обчислення НСД масиву чисел
    // Використовує властивість: НСД(n₁, n₂, ..., nₖ) = НСД(НСД(n₁, n₂, ..., nₖ₋₁), nₖ)
    int gcdArray(const std::vector<int>& arr, int start, int end, std::vector<std::map<std::string, int>>& steps) {
        // Базовий випадок: один елемент
        if (start == end) {
            std::map<std::string, int> step;
            step["start"] = start;
            step["end"] = end;
            step["value"] = arr[start];
            step["gcd"] = arr[start];
            step["description"] = 1; // базовий випадок
            steps.push_back(step);
            return arr[start];
        }
        
        // Рекурсивний випадок: НСД(НСД(перші k-1), k-й елемент)
        int leftGCD = gcdArray(arr, start, end - 1, steps);
        int rightValue = arr[end];
        int resultGCD = gcd(leftGCD, rightValue);
        
        // Зберігаємо інформацію про крок
        std::map<std::string, int> step;
        step["start"] = start;
        step["end"] = end;
        step["leftGCD"] = leftGCD;
        step["rightValue"] = rightValue;
        step["gcd"] = resultGCD;
        step["description"] = 2; // рекурсивний крок
        steps.push_back(step);
        
        return resultGCD;
    }

    std::string calculateGCD(const std::map<std::string, std::string>& params) {
        std::ostringstream result;
        result << std::fixed;
        
        try {
            int m = std::stoi(params.at("m"));
            
            // Перевірка діапазону
            const int MIN_M = 2;
            const int MAX_M = 50;
            
            if (m < MIN_M || m > MAX_M) {
                result << "{\"error\":\"m має бути в діапазоні [" << MIN_M << "; " << MAX_M << "]\"}";
                return result.str();
            }
            
            // Отримуємо масив чисел
            std::vector<int> numbers;
            for (int i = 0; i < m; ++i) {
                std::string key = "n" + std::to_string(i + 1);
                if (params.find(key) == params.end()) {
                    result << "{\"error\":\"Недостатньо елементів масиву\"}";
                    return result.str();
                }
                int value = std::stoi(params.at(key));
                if (value < 1) {
                    result << "{\"error\":\"Всі числа мають бути натуральними (>= 1)\"}";
                    return result.str();
                }
                numbers.push_back(value);
            }
            
            // Обчислюємо НСД рекурсивно
            std::vector<std::map<std::string, int>> steps;
            int finalGCD = gcdArray(numbers, 0, m - 1, steps);
            
            // Формування JSON відповіді
            result << "{";
            result << "\"success\":true,";
            result << "\"m\":" << m << ",";
            result << "\"numbers\":[";
            for (int i = 0; i < m; ++i) {
                if (i > 0) result << ",";
                result << numbers[i];
            }
            result << "],";
            result << "\"finalGCD\":" << finalGCD << ",";
            result << "\"steps\":[";
            for (size_t i = 0; i < steps.size(); ++i) {
                if (i > 0) result << ",";
                result << "{";
                result << "\"step\":" << (i + 1) << ",";
                result << "\"start\":" << steps[i]["start"] << ",";
                result << "\"end\":" << steps[i]["end"] << ",";
                if (steps[i]["description"] == 1) {
                    // Базовий випадок
                    result << "\"type\":\"base\",";
                    result << "\"value\":" << steps[i]["value"] << ",";
                    result << "\"gcd\":" << steps[i]["gcd"] << ",";
                    result << "\"description\":\"Базовий випадок: один елемент\"";
                } else {
                    // Рекурсивний крок
                    result << "\"type\":\"recursive\",";
                    result << "\"leftGCD\":" << steps[i]["leftGCD"] << ",";
                    result << "\"rightValue\":" << steps[i]["rightValue"] << ",";
                    result << "\"gcd\":" << steps[i]["gcd"] << ",";
                    result << "\"description\":\"НСД(НСД(n₁..nₖ₋₁), nₖ)\"";
                }
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
                
                if (params.find("m") != params.end()) {
                    std::string result = calculateGCD(params);
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
                
                if (params.find("m") != params.end()) {
                    std::string result = calculateGCD(params);
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
    GCDArrayServer(int p) : port(p), running(false) {
#ifdef _WIN32
        WSAStartup(MAKEWORD(2, 2), &wsaData);
        serverSocket = INVALID_SOCKET;
#else
        serverSocket = -1;
#endif
    }

    ~GCDArrayServer() {
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
        std::cout << "  Лабораторна робота 11" << std::endl;
        std::cout << "  Рекурсивне обчислення НСД масиву" << std::endl;
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
    std::cout << "=== Лабораторна робота 11 ===" << std::endl;
    std::cout << "Рекурсивне обчислення НСД масиву" << std::endl;
    std::cout << "Відкрийте браузер і перейдіть на http://localhost:8080" << std::endl;

    GCDArrayServer server(8080);
    
    std::thread serverThread([&server]() {
        server.start();
    });

    std::cout << "Натисніть Enter для зупинки сервера...\n";
    std::cin.get();

    server.stop();
    serverThread.join();

    return 0;
}
