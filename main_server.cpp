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
                    
                    // Обробка API endpoint для lab2
                    if (labNum == "lab2" && filePath.find("api/calculate") == 0) {
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
                        
                        // Виконуємо перевірку для lab2
                        if (params.size() >= 4) {
                            try {
                                double a = std::stod(params.at("a"));
                                double b = std::stod(params.at("b"));
                                double c = std::stod(params.at("c"));
                                double d = std::stod(params.at("d"));
                                
                                const double MIN_VALUE = 0.0001;
                                const double MAX_VALUE = 1000000.0;
                                
                                if (a < MIN_VALUE || a > MAX_VALUE ||
                                    b < MIN_VALUE || b > MAX_VALUE ||
                                    c < MIN_VALUE || c > MAX_VALUE ||
                                    d < MIN_VALUE || d > MAX_VALUE) {
                                    sendResponse(clientSocket, "{\"error\":\"Значення поза допустимим діапазоном [" + std::to_string(MIN_VALUE) + "; " + std::to_string(MAX_VALUE) + "]\"}", "application/json");
                                    return;
                                }
                                
                                if (a <= 0 || b <= 0 || c <= 0 || d <= 0) {
                                    sendResponse(clientSocket, "{\"error\":\"Всі значення повинні бути додатніми\"}", "application/json");
                                    return;
                                }
                                
                                // Перевірка чи можна помістити прямокутник
                                bool fitsWithoutRotation = (a <= c && b <= d);
                                bool fitsWithRotation = (a <= d && b <= c);
                                bool canFit = fitsWithoutRotation || fitsWithRotation;
                                
                                double innerArea = a * b;
                                double outerArea = c * d;
                                double areaRatio = (innerArea / outerArea) * 100.0;
                                
                                // Формуємо JSON відповідь (формат для lab2)
                                std::ostringstream json;
                                json << std::fixed << std::setprecision(4);
                                json << "{";
                                json << "\"success\":true,";
                                json << "\"canFit\":" << (canFit ? "true" : "false") << ",";
                                json << "\"rectangle1\":{";
                                json << "\"side1\":" << a << ",";
                                json << "\"side2\":" << b << ",";
                                json << "\"area\":" << innerArea;
                                json << "},";
                                json << "\"rectangle2\":{";
                                json << "\"side1\":" << c << ",";
                                json << "\"side2\":" << d << ",";
                                json << "\"area\":" << outerArea;
                                json << "},";
                                json << "\"variants\":{";
                                json << "\"variant1\":{";
                                json << "\"description\":\"a паралельно c, b паралельно d\",";
                                json << "\"possible\":" << (fitsWithoutRotation ? "true" : "false") << ",";
                                json << "\"condition\":\"a <= c && b <= d\",";
                                json << "\"check\":\"" << a << " <= " << c << " && " << b << " <= " << d << "\"";
                                json << "},";
                                json << "\"variant2\":{";
                                json << "\"description\":\"a паралельно d, b паралельно c\",";
                                json << "\"possible\":" << (fitsWithRotation ? "true" : "false") << ",";
                                json << "\"condition\":\"a <= d && b <= c\",";
                                json << "\"check\":\"" << a << " <= " << d << " && " << b << " <= " << c << "\"";
                                json << "}";
                                json << "}";
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
                    
                    // Обробка API endpoint для lab3
                    if (labNum == "lab3" && filePath.find("api/calculate") == 0) {
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
                        
                        // Виконуємо перевірку для lab3 (точка в трикутнику)
                        if (params.size() >= 2) {
                            try {
                                double x = std::stod(params.at("x"));
                                double y = std::stod(params.at("y"));
                                
                                // Вершини трикутника
                                const double TRIANGLE_AX = 0.0;
                                const double TRIANGLE_AY = 1.0;
                                const double TRIANGLE_BX = 1.0;
                                const double TRIANGLE_BY = -2.0;
                                const double TRIANGLE_CX = -1.0;
                                const double TRIANGLE_CY = -1.0;
                                
                                // Функція обчислення площі трикутника
                                auto triangleArea = [](double x1, double y1, double x2, double y2, double x3, double y3) {
                                    return std::abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)) / 2.0;
                                };
                                
                                // Обчислюємо площі трикутників
                                double areaABC = triangleArea(TRIANGLE_AX, TRIANGLE_AY, TRIANGLE_BX, TRIANGLE_BY, TRIANGLE_CX, TRIANGLE_CY);
                                double areaPBC = triangleArea(x, y, TRIANGLE_BX, TRIANGLE_BY, TRIANGLE_CX, TRIANGLE_CY);
                                double areaAPC = triangleArea(TRIANGLE_AX, TRIANGLE_AY, x, y, TRIANGLE_CX, TRIANGLE_CY);
                                double areaABP = triangleArea(TRIANGLE_AX, TRIANGLE_AY, TRIANGLE_BX, TRIANGLE_BY, x, y);
                                
                                // Перевірка належності
                                const double EPSILON = 1e-9;
                                double totalArea = areaPBC + areaAPC + areaABP;
                                bool belongs = std::abs(totalArea - areaABC) < EPSILON;
                                
                                // Формуємо JSON відповідь
                                std::ostringstream json;
                                json << std::fixed << std::setprecision(6);
                                json << "{";
                                json << "\"success\":true,";
                                json << "\"belongs\":" << (belongs ? "true" : "false") << ",";
                                json << "\"point\":{";
                                json << "\"x\":" << x << ",";
                                json << "\"y\":" << y;
                                json << "},";
                                json << "\"triangle\":{";
                                json << "\"vertexA\":{\"x\":" << TRIANGLE_AX << ",\"y\":" << TRIANGLE_AY << "},";
                                json << "\"vertexB\":{\"x\":" << TRIANGLE_BX << ",\"y\":" << TRIANGLE_BY << "},";
                                json << "\"vertexC\":{\"x\":" << TRIANGLE_CX << ",\"y\":" << TRIANGLE_CY << "},";
                                json << "\"area\":" << areaABC;
                                json << "},";
                                json << "\"calculation\":{";
                                json << "\"areaPBC\":" << areaPBC << ",";
                                json << "\"areaAPC\":" << areaAPC << ",";
                                json << "\"areaABP\":" << areaABP << ",";
                                json << "\"totalArea\":" << totalArea << ",";
                                json << "\"areaABC\":" << areaABC << ",";
                                json << "\"difference\":" << std::abs(totalArea - areaABC);
                                json << "}";
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
                    
                    // Обробка API endpoint для lab4
                    if (labNum == "lab4" && filePath.find("api/calculate") == 0) {
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
                        
                        // Виконуємо реверсування для lab4
                        if (params.find("number") != params.end()) {
                            try {
                                long long number = std::stoll(params.at("number"));
                                
                                // Функція для реверсування цифр
                                auto reverseDigits = [](long long num) -> long long {
                                    long long reversed = 0;
                                    bool isNegative = num < 0;
                                    
                                    if (isNegative) {
                                        num = -num;
                                    }
                                    
                                    while (num > 0) {
                                        reversed = reversed * 10 + (num % 10);
                                        num /= 10;
                                    }
                                    
                                    return isNegative ? -reversed : reversed;
                                };
                                
                                // Функція для отримання цифр як рядка
                                auto getDigitsAsString = [](long long num) -> std::string {
                                    std::string digits;
                                    bool isNegative = num < 0;
                                    
                                    if (isNegative) {
                                        num = -num;
                                    }
                                    
                                    if (num == 0) {
                                        return "0";
                                    }
                                    
                                    while (num > 0) {
                                        digits = std::to_string(num % 10) + digits;
                                        num /= 10;
                                    }
                                    
                                    return isNegative ? "-" + digits : digits;
                                };
                                
                                long long reversed = reverseDigits(number);
                                std::string originalDigits = getDigitsAsString(number);
                                std::string reversedDigits = getDigitsAsString(reversed);
                                
                                // Формуємо JSON відповідь
                                std::ostringstream json;
                                json << std::fixed;
                                json << "{";
                                json << "\"success\":true,";
                                json << "\"original\":{";
                                json << "\"number\":" << number << ",";
                                json << "\"digits\":\"" << originalDigits << "\"";
                                json << "},";
                                json << "\"reversed\":{";
                                json << "\"number\":" << reversed << ",";
                                json << "\"digits\":\"" << reversedDigits << "\"";
                                json << "},";
                                json << "\"isNegative\":" << (number < 0 ? "true" : "false") << ",";
                                json << "\"digitCount\":" << originalDigits.length() - (number < 0 ? 1 : 0);
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
                    
                    // Обробка API endpoint для lab5
                    if (labNum == "lab5" && filePath.find("api/calculate") == 0) {
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
                        
                        // Виконуємо обчислення для lab5 (тригонометрична сума)
                        if (params.find("n") != params.end()) {
                            try {
                                int n = std::stoi(params.at("n"));
                                
                                const int MIN_VALUE = 1;
                                const int MAX_VALUE = 1000;
                                
                                if (n < MIN_VALUE || n > MAX_VALUE) {
                                    sendResponse(clientSocket, "{\"error\":\"n має бути в діапазоні [1; 1000]\"}", "application/json");
                                    return;
                                }
                                
                                // Функції для обчислення сум
                                auto sumCos = [](int k) -> double {
                                    double sum = 0.0;
                                    for (int j = 2; j <= k + 1; ++j) {
                                        sum += std::cos(j);
                                    }
                                    return sum;
                                };
                                
                                auto sumSin = [](int k) -> double {
                                    double sum = 0.0;
                                    for (int j = 1; j <= k; ++j) {
                                        sum += std::sin(j);
                                    }
                                    return sum;
                                };
                                
                                double totalSum = 0.0;
                                std::ostringstream json;
                                json << std::fixed << std::setprecision(10);
                                json << "{";
                                json << "\"success\":true,";
                                json << "\"n\":" << n << ",";
                                json << "\"terms\":[";
                                
                                bool firstTerm = true;
                                for (int k = 1; k <= n; ++k) {
                                    double cosSum = sumCos(k);
                                    double sinSum = sumSin(k);
                                    
                                    if (std::abs(sinSum) < 1e-10) {
                                        sendResponse(clientSocket, "{\"error\":\"Ділення на нуль при k=" + std::to_string(k) + "\"}", "application/json");
                                        return;
                                    }
                                    
                                    double term = cosSum / sinSum;
                                    totalSum += term;
                                    
                                    if (!firstTerm) json << ",";
                                    firstTerm = false;
                                    
                                    json << "{";
                                    json << "\"k\":" << k << ",";
                                    json << "\"cosSum\":" << cosSum << ",";
                                    json << "\"sinSum\":" << sinSum << ",";
                                    json << "\"term\":" << term << ",";
                                    json << "\"partialSum\":" << totalSum;
                                    json << "}";
                                }
                                
                                json << "],";
                                json << "\"totalSum\":" << totalSum;
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
                    
                    // Обробка API endpoint для lab6
                    if (labNum == "lab6" && filePath.find("api/calculate") == 0) {
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
                        
                        // Виконуємо обчислення для lab6 (сума з факторіалами)
                        if (params.find("x") != params.end() && params.find("n") != params.end()) {
                            try {
                                double x = std::stod(params.at("x"));
                                int n = std::stoi(params.at("n"));
                                
                                const int MIN_N = 1;
                                const int MAX_N = 20;
                                
                                if (n < MIN_N || n > MAX_N) {
                                    sendResponse(clientSocket, "{\"error\":\"n має бути в діапазоні [1; 20]\"}", "application/json");
                                    return;
                                }
                                
                                // Функція для обчислення факторіалу
                                auto factorial = [](int num) -> double {
                                    if (num < 0) return 0;
                                    if (num == 0 || num == 1) return 1.0;
                                    double result = 1.0;
                                    for (int i = 2; i <= num; ++i) {
                                        result *= i;
                                    }
                                    return result;
                                };
                                
                                double absX = std::abs(x);
                                double totalSum = 0.0;
                                std::ostringstream json;
                                json << std::fixed << std::setprecision(10);
                                json << "{";
                                json << "\"success\":true,";
                                json << "\"x\":" << x << ",";
                                json << "\"absX\":" << absX << ",";
                                json << "\"n\":" << n << ",";
                                json << "\"terms\":[";
                                
                                bool firstTerm = true;
                                for (int i = 1; i <= n; ++i) {
                                    double fact2i = factorial(2 * i);
                                    double factI2 = factorial(i * i);
                                    
                                    if (factI2 == 0) {
                                        sendResponse(clientSocket, "{\"error\":\"Ділення на нуль при i=" + std::to_string(i) + "\"}", "application/json");
                                        return;
                                    }
                                    
                                    double numerator = fact2i + absX;
                                    double denominator = factI2;
                                    double term = numerator / denominator;
                                    totalSum += term;
                                    
                                    if (!firstTerm) json << ",";
                                    firstTerm = false;
                                    
                                    json << "{";
                                    json << "\"i\":" << i << ",";
                                    json << "\"fact2i\":" << fact2i << ",";
                                    json << "\"factI2\":" << factI2 << ",";
                                    json << "\"numerator\":" << numerator << ",";
                                    json << "\"denominator\":" << denominator << ",";
                                    json << "\"term\":" << term << ",";
                                    json << "\"partialSum\":" << totalSum;
                                    json << "}";
                                }
                                
                                json << "],";
                                json << "\"totalSum\":" << totalSum;
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
                    
                    // Обробка API endpoint для lab7
                    if (labNum == "lab7" && filePath.find("api/calculate") == 0) {
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
                        
                        // Виконуємо обчислення для lab7 (заміна елементів масиву)
                        if (params.find("n") != params.end()) {
                            try {
                                int n = std::stoi(params.at("n"));
                                
                                const int MIN_N = 1;
                                const int MAX_N = 100;
                                
                                if (n < MIN_N || n > MAX_N) {
                                    sendResponse(clientSocket, "{\"error\":\"n має бути в діапазоні [1; 100]\"}", "application/json");
                                    return;
                                }
                                
                                // Отримуємо масив
                                std::vector<double> originalArray;
                                for (int i = 0; i < n; ++i) {
                                    std::string key = "arr" + std::to_string(i);
                                    if (params.find(key) == params.end()) {
                                        sendResponse(clientSocket, "{\"error\":\"Недостатньо елементів масиву\"}", "application/json");
                                        return;
                                    }
                                    double value = std::stod(params.at(key));
                                    originalArray.push_back(value);
                                }
                                
                                // Створюємо новий масив з середніми арифметичними
                                std::vector<double> resultArray;
                                double runningSum = 0.0;
                                
                                std::ostringstream json;
                                json << std::fixed << std::setprecision(6);
                                json << "{";
                                json << "\"success\":true,";
                                json << "\"n\":" << n << ",";
                                json << "\"originalArray\":[";
                                for (size_t i = 0; i < originalArray.size(); ++i) {
                                    if (i > 0) json << ",";
                                    json << originalArray[i];
                                }
                                json << "],";
                                json << "\"steps\":[";
                                
                                bool firstStep = true;
                                for (int i = 0; i < n; ++i) {
                                    runningSum += originalArray[i];
                                    double average = runningSum / (i + 1);
                                    resultArray.push_back(average);
                                    
                                    if (!firstStep) json << ",";
                                    firstStep = false;
                                    
                                    json << "{";
                                    json << "\"index\":" << (i + 1) << ",";
                                    json << "\"originalValue\":" << originalArray[i] << ",";
                                    json << "\"runningSum\":" << runningSum << ",";
                                    json << "\"count\":" << (i + 1) << ",";
                                    json << "\"average\":" << average;
                                    json << "}";
                                }
                                
                                json << "],";
                                json << "\"resultArray\":[";
                                for (size_t i = 0; i < resultArray.size(); ++i) {
                                    if (i > 0) json << ",";
                                    json << resultArray[i];
                                }
                                json << "]";
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
                    
                    // Обробка API endpoint для lab8
                    if (labNum == "lab8" && filePath.find("api/calculate") == 0) {
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
                        
                        // Виконуємо обчислення для lab8 (перетворення матриці)
                        if (params.find("m") != params.end() && params.find("n") != params.end()) {
                            try {
                                int m = std::stoi(params.at("m"));
                                int n = std::stoi(params.at("n"));
                                
                                const int MIN_SIZE = 1;
                                const int MAX_SIZE = 20;
                                
                                if (m < MIN_SIZE || m > MAX_SIZE || n < MIN_SIZE || n > MAX_SIZE) {
                                    sendResponse(clientSocket, "{\"error\":\"m та n мають бути в діапазоні [1; 20]\"}", "application/json");
                                    return;
                                }
                                
                                // Отримуємо матрицю
                                std::vector<std::vector<int>> originalMatrix(m, std::vector<int>(n));
                                for (int i = 0; i < m; ++i) {
                                    for (int j = 0; j < n; ++j) {
                                        std::string key = "mat" + std::to_string(i) + "_" + std::to_string(j);
                                        if (params.find(key) == params.end()) {
                                            sendResponse(clientSocket, "{\"error\":\"Недостатньо елементів матриці\"}", "application/json");
                                            return;
                                        }
                                        originalMatrix[i][j] = std::stoi(params.at(key));
                                    }
                                }
                                
                                // Створюємо перетворену матрицю
                                std::vector<std::vector<int>> transformedMatrix(m, std::vector<int>(n));
                                
                                std::ostringstream json;
                                json << std::fixed;
                                json << "{";
                                json << "\"success\":true,";
                                json << "\"m\":" << m << ",";
                                json << "\"n\":" << n << ",";
                                json << "\"originalMatrix\":[";
                                for (int i = 0; i < m; ++i) {
                                    if (i > 0) json << ",";
                                    json << "[";
                                    for (int j = 0; j < n; ++j) {
                                        if (j > 0) json << ",";
                                        json << originalMatrix[i][j];
                                    }
                                    json << "]";
                                }
                                json << "],";
                                json << "\"details\":[";
                                
                                // Обробляємо кожен рядок
                                for (int i = 0; i < m; ++i) {
                                    if (i > 0) json << ",";
                                    json << "[";
                                    
                                    // Підраховуємо кількість входжень кожного елемента в рядку
                                    std::map<int, int> countMap;
                                    for (int j = 0; j < n; ++j) {
                                        countMap[originalMatrix[i][j]]++;
                                    }
                                    
                                    // Створюємо перетворений рядок
                                    for (int j = 0; j < n; ++j) {
                                        if (j > 0) json << ",";
                                        
                                        int value = originalMatrix[i][j];
                                        int count = countMap[value];
                                        
                                        if (count > 1) {
                                            transformedMatrix[i][j] = value;
                                        } else {
                                            transformedMatrix[i][j] = 0;
                                        }
                                        
                                        json << "{";
                                        json << "\"row\":" << i << ",";
                                        json << "\"col\":" << j << ",";
                                        json << "\"originalValue\":" << value << ",";
                                        json << "\"count\":" << count << ",";
                                        json << "\"transformedValue\":" << transformedMatrix[i][j] << ",";
                                        json << "\"changed\":" << (count > 1 ? 0 : 1);
                                        json << "}";
                                    }
                                    json << "]";
                                }
                                
                                json << "],";
                                json << "\"transformedMatrix\":[";
                                for (int i = 0; i < m; ++i) {
                                    if (i > 0) json << ",";
                                    json << "[";
                                    for (int j = 0; j < n; ++j) {
                                        if (j > 0) json << ",";
                                        json << transformedMatrix[i][j];
                                    }
                                    json << "]";
                                }
                                json << "]";
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
