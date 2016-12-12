set(SHARED_INCLUDE_FILES
    common.h
    format.h
    metadata.h
    rms.h
    segment_extractor.h
    spectrogram_image_generator.h
    util.h
)

set(SHARED_SRC_FILES
    metadata.cpp
    rms.cpp
    segment_extractor.cpp
    spectrogram_image_generator.cpp
    util.cpp
)

set(SHARED_INCLUDE_DIRS
    ${LIBSNDFILE_INCLUDE_DIR}
    ${FFTW_INCLUDES}
    ${CAIRO_INCLUDE_DIRS}
)

set(SHARED_LIBS
    ${LIBSNDFILE_LIBRARY}
    ${FFTW_LIBRARIES}
    ${CAIRO_LIBRARIES}
)

add_library(shared ${SHARED_INCLUDE_FILES} ${SHARED_SRC_FILES})
include_directories(${SHARED_INCLUDE_DIRS})
target_link_libraries(shared ${SHARED_LIBS})

