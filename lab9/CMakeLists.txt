cmake_minimum_required(VERSION 3.10)
project(lab9)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(lab9 main.cpp)

if(WIN32)
    target_link_libraries(lab9 ws2_32)
endif()
