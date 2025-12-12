cmake_minimum_required(VERSION 3.10)
project(lab10)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(lab10 main.cpp)

if(WIN32)
    target_link_libraries(lab10 ws2_32)
endif()
