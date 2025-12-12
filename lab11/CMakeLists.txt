cmake_minimum_required(VERSION 3.10)
project(lab11)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(lab11 main.cpp)

if(WIN32)
    target_link_libraries(lab11 ws2_32)
endif()
