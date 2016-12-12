set(SPLITTER_INCLUDE_FILES
)

set(SPLITTER_SRC_FILES
    main.cpp
)

set(SPLITTER_INCLUDE_DIRS
)

set(SPLITTER_LIBS
    shared
)

add_executable(splitter ${SPLITTER_INCLUDE_FILES} ${SPLITTER_SRC_FILES})
include_directories(${SPLITTER_INCLUDE_DIRS})
target_link_libraries(splitter ${SPLITTER_LIBS})

