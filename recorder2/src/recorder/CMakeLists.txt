set(RECORDER_INCLUDE_FILES
    monitor.h
    segment_writer.h
    recorder.h
    recording_writer.h
    source.h
    source_portaudio.h
    source_stdin.h
    source_sweep.h
)

set(RECORDER_SRC_FILES
    main.cpp
    monitor.cpp
    segment_writer.cpp
    recorder.cpp
    recording_writer.cpp
    source.cpp
    source_portaudio.cpp
    source_stdin.cpp
    source_sweep.cpp
)

set(RECORDER_INCLUDE_DIRS
    ${LIBSNDFILE_INCLUDE_DIR}
    ${PORTAUDIO_INCLUDE_DIRS}
)

set(RECORDER_LIBS
    shared
    ${LIBSNDFILE_LIBRARY}
    ${PORTAUDIO_LIBRARIES}
)

add_executable(recorder ${RECORDER_INCLUDE_FILES} ${RECORDER_SRC_FILES})
include_directories(${RECORDER_INCLUDE_DIRS})
target_link_libraries(recorder ${RECORDER_LIBS})

