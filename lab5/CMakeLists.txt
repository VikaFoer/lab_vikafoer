cmake_minimum_required(VERSION 3.10)
project(lab5)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(lab5 main.cpp)

if(WIN32)
    target_link_libraries(lab5 ws2_32)
endif()
