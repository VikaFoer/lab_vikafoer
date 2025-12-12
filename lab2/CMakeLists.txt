cmake_minimum_required(VERSION 3.10)
project(lab2)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(lab2 main.cpp)

if(WIN32)
    target_link_libraries(lab2 ws2_32)
endif()

