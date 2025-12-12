#include <iostream>
#include "../common/server_base.h"

int main() {
    std::cout << "=== Р›Р°Р±РѕСЂР°С‚РѕСЂРЅР° СЂРѕР±РѕС‚Р° 9 ===" << std::endl;
    std::cout << "Р’С–РґРєСЂРёР№С‚Рµ Р±СЂР°СѓР·РµСЂ С– РїРµСЂРµР№РґС–С‚СЊ РЅР° http://localhost:8080" << std::endl;

    SimpleHTTPServer server(8080);
    
    std::thread serverThread([&server]() {
        server.start();
    });

    std::cout << "РќР°С‚РёСЃРЅС–С‚СЊ Enter РґР»СЏ Р·СѓРїРёРЅРєРё СЃРµСЂРІРµСЂР°...\n";
    std::cin.get();

    server.stop();
    serverThread.join();

    return 0;
}
