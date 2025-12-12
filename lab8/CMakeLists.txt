cmake_minimum_required(VERSION 3.10)
project(lab8)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(lab8 main.cpp)

if(WIN32)
    target_link_libraries(lab8 ws2_32)
endif()
