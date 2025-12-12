cmake_minimum_required(VERSION 3.10)
project(lab6)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(lab6 main.cpp)

if(WIN32)
    target_link_libraries(lab6 ws2_32)
endif()
