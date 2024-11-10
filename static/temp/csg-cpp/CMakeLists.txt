cmake_minimum_required(VERSION 3.27)
project(test)

set(CMAKE_CXX_STANDARD 11)

include_directories("D:\\CodeProjects\\C++L\\test\\include\\")

link_libraries("D:\\CodeProjects\\C++L\\test\\src\\lib_json\\")


add_executable(test
        csgjs1.cpp
        src/lib_json/json_writer.cpp
        src/lib_json/json_value.cpp
        src/lib_json/json_reader.cpp
        src/lib_json/json_internalarray.inl
        src/lib_json/json_internalmap.inl
        #        test_csgjscpp.cpp
#        csg2/main.cpp
#        csg2/checkimpl.cpp
)
