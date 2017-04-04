cmake_minimum_required(VERSION 2.8)

# handle clang
if("${CMAKE_CXX_COMPILER}" MATCHES "clang(\\+\\+)?$" OR "${CMAKE_CXX_COMPILER_ID}" STREQUAL "Clang" OR APPLE)
    set(CMAKE_COMPILER_IS_CLANGXX 1)
endif()

# pull in modules
set(CMAKE_MODULE_PATH "${CMAKE_SOURCE_DIR}/CMakeModules/")

# set project
project(Recorder2 CXX C)

# determine 32bit vs 64bit build
if(CMAKE_SIZEOF_VOID_P EQUAL 8)
    set(BITNESS 64)
else()
    set(BITNESS 32)
endif()

# set up install directory
if(BITNESS EQUAL 64)
    if(CMAKE_BUILD_TYPE EQUAL "Debug")
        set(INSTALL_BINARIES_DIRECTORY "bin64-debug")
    else()
        set(INSTALL_BINARIES_DIRECTORY "bin64")
    endif()
else()
    if(CMAKE_BUILD_TYPE EQUAL "Debug")
        set(INSTALL_BINARIES_DIRECTORY "bin32-debug")
    else()
        set(INSTALL_BINARIES_DIRECTORY "bin32")
    endif()
endif()    

# enable c99/ c++14
if(CMAKE_COMPILER_IS_GNUCC OR CMAKE_COMPILER_IS_CLANGXX OR EMSCRIPTEN)
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -std=c99")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++14")
endif()

# set cflags that are common to dependancies
add_definitions(-D_FILE_OFFSET_BITS=64)
add_definitions(-D_GNU_SOURCE)

# depend on threads for everything
set(CMAKE_THREAD_PREFER_PTHREAD TRUE)
find_package(Threads REQUIRED)
if(CMAKE_USE_PTHREADS_INIT)
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -pthread")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -pthread")
endif()

# update cflags for debug build
if(CMAKE_BUILD_TYPE MATCHES "Debug")
    add_definitions(-D_DEBUG)
    message("Building debug executable.")
endif()

# set up cflags
if(CMAKE_COMPILER_IS_GNUCC OR CMAKE_COMPILER_IS_CLANGXX OR EMSCRIPTEN)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall")
    #set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -pedantic")

    # stop annoying warnings
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-invalid-offsetof")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-switch")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-switch-enum")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-unused-variable")
endif()

# pull in include directories
include_directories("${CMAKE_SOURCE_DIR}/include")
include_directories("${CMAKE_SOURCE_DIR}/src")

# we require getopt for now, not building it atm
include(CheckIncludeFile)
check_include_file("getopt.h" HAVE_GETOPT_H)
if(NOT HAVE_GETOPT_H)
    message( FATAL_ERROR "getopt Not Found" )
endif()

# global dependancies
find_package(LibSndFile REQUIRED)
find_package(Cairo REQUIRED)
find_package(FFTW REQUIRED)
find_package(PortAudio REQUIRED)

add_subdirectory("src/shared")
add_subdirectory("src/recorder")
add_subdirectory("src/analyser")
add_subdirectory("src/splitter")

