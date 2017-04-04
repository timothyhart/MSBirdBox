find_package(LibSndFile REQUIRED)

set(ANALYSER_INCLUDE_FILES
    analyser.h
)

set(ANALYSER_SRC_FILES
    analyser.cpp
    main.cpp
)

set(ANALYSER_INCLUDE_DIRS
    ${LIBSNDFILE_INCLUDE_DIR}
)

set(ANALYSER_LIBS
    shared
    ${LIBSNDFILE_LIBRARY}
)

add_executable(analyser ${ANALYSER_INCLUDE_FILES} ${ANALYSER_SRC_FILES})
include_directories(${ANALYSER_INCLUDE_DIRS})
target_link_libraries(analyser ${ANALYSER_LIBS})

