// almost completely based on sndfile-spectrogram.c from sndfile-tools

#include <algorithm>
#include <cassert>
#include <cstdlib>
#include <cstring>
#include <cstdbool>
#include <cmath>
#include <iostream>

#include <cairo.h>
#include <fftw3.h>

#include "shared/common.h"
#include "shared/format.h"
#include "shared/spectrogram_image_generator.h"

constexpr int MIN_WIDTH = 580;
constexpr int MIN_HEIGHT = 480;
constexpr int MAX_WIDTH = 8192;
constexpr int MAX_HEIGHT = 4096;

constexpr int TICK_LEN = 6;
constexpr double BORDER_LINE_WIDTH = 1.8;

constexpr double TITLE_FONT_SIZE = 20.0;
constexpr double NORMAL_FONT_SIZE = 12.0;

constexpr double LEFT_BORDER = 65.0;
constexpr double TOP_BORDER = 16.0;
constexpr double RIGHT_BORDER = 75.0;
constexpr double BOTTOM_BORDER = 40.0;

constexpr double SPEC_FLOOR_DB = -180.0;

// not to be confused with the windows.h RECT..
struct RECT
{
    int left;
    int top;
    int width;
    int height;
};

static const char font_family[] = "Terminus";

static void get_colour_map_value(float value, double spec_floor_db, unsigned char colour[3])
{
    static unsigned char map[][3] =
    {	/* These values were originally calculated for a dynamic range of 180dB. */
        { 255, 255, 255 },  /* -0dB */
        { 240, 254, 216 },  /* -10dB */
        { 242, 251, 185 },  /* -20dB */
        { 253, 245, 143 },  /* -30dB */
        { 253, 200, 102 },  /* -40dB */
        { 252, 144,  66 },  /* -50dB */
        { 252,  75,  32 },  /* -60dB */
        { 237,  28,  41 },  /* -70dB */
        { 214,   3,  64 },  /* -80dB */
        { 183,   3, 101 },  /* -90dB */
        { 157,   3, 122 },  /* -100dB */
        { 122,   3, 126 },  /* -110dB */
        { 80,   2, 110 },  /* -120dB */
        { 45,   2,  89 },  /* -130dB */
        { 19,   2,  70 },  /* -140dB */
        { 1,   3,  53 },  /* -150dB */
        { 1,   3,  37 },  /* -160dB */
        { 1,   2,  19 },  /* -170dB */
        { 0,   0,   0 },  /* -180dB */
    };

    float rem;
    int indx;

    if (value >= 0.0)
    {
        colour = map[0];
        return;
    }

    value = fabs(value * (-180.0 / spec_floor_db) * 0.1);

    indx = lrintf(floor(value));

    if (indx < 0)
    {
        std::cerr << "Error : colour map array index is " << indx << std::endl;
        std::abort();
    }

    if (indx >= static_cast<int>(countof(map) - 1))
    {
        colour = map[countof(map) - 1];
        return;
    }

    rem = fmod(value, 1.0);

    colour[0] = lrintf((1.0 - rem) * map[indx][0] + rem * map[indx + 1][0]);
    colour[1] = lrintf((1.0 - rem) * map[indx][1] + rem * map[indx + 1][1]);
    colour[2] = lrintf((1.0 - rem) * map[indx][2] + rem * map[indx + 1][2]);
} /* get_colour_map_value */

static double factorial(int val)
{
    static double memory[64] = { 1.0 };
    static int have_entry = 0;

    int k;

    if (val < 0)
    {
        std::cerr << "Oops : val < 0." << std::endl;
        std::abort();
    };

    if (val > static_cast<int>(countof(memory)))
    {
        std::cerr << "Oops : val > countof (memory)." << std::endl;
        std::abort();
    };

    if (val < have_entry)
        return memory[val];

    for (k = have_entry + 1; k <= val; k++)
        memory[k] = k * memory[k - 1];

    return memory[val];
} /* factorial */

static double besseli0(double x)
{
    int k;
    double result = 0.0;

    for (k = 1; k < 25; k++)
    {
        double temp;

        temp = pow(0.5 * x, k) / factorial(k);
        result += temp * temp;
    };

    return 1.0 + result;
} /* besseli0 */

void calc_kaiser_window(double * data, int datalen, double beta)
{
    /*
    **          besseli0 (beta * sqrt (1- (2*x/N).^2))
    ** w (x) =  --------------------------------------,  -N/2 <= x <= N/2
    **                 besseli0 (beta)
    */

    double two_n_on_N, denom;
    int k;

    denom = besseli0(beta);

    if (!std::isfinite(denom))
    {
        std::cerr << "besseli0 (" << beta << ") : " << denom << std::endl;
        std::abort();
    }

    for (k = 0; k < datalen; k++)
    {
        double n = k + 0.5 - 0.5 * datalen;
        two_n_on_N = (2.0 * n) / datalen;
        data[k] = besseli0(beta * sqrt(1.0 - two_n_on_N * two_n_on_N)) / denom;
    }
} /* calc_kaiser_window */

static void apply_window(double *data, int datalen)
{
    static double window[10 * MAX_HEIGHT];
    static int window_len = 0;
    int k;

    if (window_len != datalen)
    {
        window_len = datalen;
        if (datalen > static_cast<int>(countof(window)))
        {
            std::cerr << "apply_window: datalen >  MAX_HEIGHT" << std::endl;
            std::abort();
        }

        calc_kaiser_window(window, datalen, 20.0);
    }

    for (k = 0; k < datalen; k++)
        data[k] *= window[k];
} /* apply_window */

static double calc_magnitude(const double * freq, int freqlen, double * magnitude)
{
    int k;
    double max = 0.0;

    for (k = 1; k < freqlen / 2; k++)
    {
        magnitude[k] = sqrt(freq[k] * freq[k] + freq[freqlen - k - 1] * freq[freqlen - k - 1]);
        max = std::max(max, magnitude[k]);
    };
    magnitude[0] = 0.0;

    return max;
} /* calc_magnitude */

static void render_spectrogram(cairo_surface_t * surface, double spec_floor_db, float mag2d[MAX_WIDTH][MAX_HEIGHT], double maxval, double left, double top, double width, double height)
{
    unsigned char colour[3] = { 0, 0, 0 };
    unsigned char *data;
    double linear_spec_floor;
    int w, h, stride;

    stride = cairo_image_surface_get_stride(surface);

    data = cairo_image_surface_get_data(surface);
    memset(data, 0, stride * cairo_image_surface_get_height(surface));

    linear_spec_floor = pow(10.0, spec_floor_db / 20.0);

    for (w = 0; w < width; w++)
        for (h = 0; h < height; h++)
        {
            int x, y;

            mag2d[w][h] = mag2d[w][h] / maxval;
            mag2d[w][h] = (mag2d[w][h] < linear_spec_floor) ? spec_floor_db : 20.0 * log10(mag2d[w][h]);

            get_colour_map_value(mag2d[w][h], spec_floor_db, colour);

            y = height + top - 1 - h;
            x = (w + left) * 4;
            data[y * stride + x + 0] = colour[2];
            data[y * stride + x + 1] = colour[1];
            data[y * stride + x + 2] = colour[0];
            data[y * stride + x + 3] = 0;
        };

    cairo_surface_mark_dirty(surface);
} /* render_spectrogram */

static void render_heat_map(cairo_surface_t * surface, double magfloor, const RECT *r)
{
    unsigned char colour[3], *data;
    int w, h, stride;

    stride = cairo_image_surface_get_stride(surface);
    data = cairo_image_surface_get_data(surface);

    for (h = 0; h < r->height; h++)
    {
        get_colour_map_value(magfloor * (r->height - h) / (r->height + 1), magfloor, colour);

        for (w = 0; w < r->width; w++)
        {
            int x, y;

            x = (w + r->left) * 4;
            y = r->height + r->top - 1 - h;

            data[y * stride + x + 0] = colour[2];
            data[y * stride + x + 1] = colour[1];
            data[y * stride + x + 2] = colour[0];
            data[y * stride + x + 3] = 0;
        };
    };

    cairo_surface_mark_dirty(surface);
} /* render_heat_map */

static inline void x_line(cairo_t * cr, double x, double y, double len)
{
    cairo_move_to(cr, x, y);
    cairo_rel_line_to(cr, len, 0.0);
    cairo_stroke(cr);
} /* x_line */

static inline void y_line(cairo_t * cr, double x, double y, double len)
{
    cairo_move_to(cr, x, y);
    cairo_rel_line_to(cr, 0.0, len);
    cairo_stroke(cr);
} /* y_line */

typedef struct
{
    double value[15];
    double distance[15];
} TICKS;

static inline int calculate_ticks(double max, double distance, TICKS * ticks)
{
    const int div_array[] =
    { 10, 10, 8, 6, 8, 10, 6, 7, 8, 9, 10, 11, 12, 12, 7, 14, 8, 8, 9
    };

    double scale = 1.0, scale_max;
    int k, leading, divisions;

    if (max < 0)
    {
        std::cerr << "Error in calculate_ticks: max < 0" << std::endl;
        std::abort();
    }

    while (scale * max >= countof(div_array))
        scale *= 0.1;

    while (scale * max < 1.0)
        scale *= 10.0;

    leading = lround(scale * max);
    divisions = div_array[leading % countof(div_array)];

    /* Scale max down. */
    scale_max = leading / scale;
    scale = scale_max / divisions;

    if (divisions > static_cast<int>(countof(ticks->value) - 1))
    {
        std::cerr << "Error : divisions (" << divisions << ") > countof (ticks->value) (" << countof(ticks->value) << ")" << std::endl;
        std::abort();
    }

    for (k = 0; k <= divisions; k++)
    {
        ticks->value[k] = k * scale;
        ticks->distance[k] = distance * ticks->value[k] / max;
    }

    return divisions + 1;
} /* calculate_ticks */

static void str_print_value(char * text, int text_len, double value)
{
    if (fabs(value) < 1e-10)
        snprintf(text, text_len, "0");
    else if (fabs(value) >= 10.0)
        snprintf(text, text_len, "%1.0f", value);
    else if (fabs(value) >= 1.0)
        snprintf(text, text_len, "%3.1f", value);
    else
        snprintf(text, text_len, "%4.2f", value);
} /* str_print_value */

static void render_spect_border(cairo_surface_t * surface, double left, double width, double seconds, double top, double height, double max_freq)
{
    char text[512];
    cairo_t * cr;
    cairo_text_extents_t extents;
    cairo_matrix_t matrix;

    TICKS ticks;
    int k, tick_count;

    cr = cairo_create(surface);

    cairo_set_source_rgb(cr, 1.0, 1.0, 1.0);
    cairo_set_line_width(cr, BORDER_LINE_WIDTH);

#if 0
    /* Print title. */
    cairo_select_font_face(cr, font_family, CAIRO_FONT_SLANT_NORMAL, CAIRO_FONT_WEIGHT_NORMAL);
    cairo_set_font_size(cr, 1.0 * TITLE_FONT_SIZE);

    snprintf(text, sizeof(text), "Spectrogram");
    cairo_text_extents(cr, text, &extents);
    cairo_move_to(cr, left + 2, top - extents.height / 2);
    cairo_show_text(cr, text);
#endif

    /* Print labels. */
    cairo_select_font_face(cr, font_family, CAIRO_FONT_SLANT_NORMAL, CAIRO_FONT_WEIGHT_NORMAL);
    cairo_set_font_size(cr, 1.0 * NORMAL_FONT_SIZE);

    /* Border around actual spectrogram. */
    cairo_rectangle(cr, left, top, width, height);

    tick_count = calculate_ticks(seconds, width, &ticks);
    for (k = 0; k < tick_count; k++)
    {
        y_line(cr, left + ticks.distance[k], top + height, TICK_LEN);
        if (k % 2 == 1)
            continue;
        str_print_value(text, sizeof(text), ticks.value[k]);
        cairo_text_extents(cr, text, &extents);
        cairo_move_to(cr, left + ticks.distance[k] - extents.width / 2, top + height + 8 + extents.height);
        cairo_show_text(cr, text);
    };

    tick_count = calculate_ticks(max_freq, height, &ticks);
    for (k = 0; k < tick_count; k++)
    {
        x_line(cr, left + width, top + height - ticks.distance[k], TICK_LEN);
        if (k % 2 == 1)
            continue;
        str_print_value(text, sizeof(text), ticks.value[k]);
        cairo_text_extents(cr, text, &extents);
        cairo_move_to(cr, left + width + 12, top + height - ticks.distance[k] + extents.height / 4.5);
        cairo_show_text(cr, text);
    };

    cairo_set_font_size(cr, 1.0 * NORMAL_FONT_SIZE);

    /* Label X axis. */
    snprintf(text, sizeof(text), "Time (secs)");
    cairo_text_extents(cr, text, &extents);
    cairo_move_to(cr, left + (width - extents.width) / 2, cairo_image_surface_get_height(surface) - 8);
    cairo_show_text(cr, text);

    /* Label Y axis (rotated). */
    snprintf(text, sizeof(text), "Frequency (Hz)");
    cairo_text_extents(cr, text, &extents);

    cairo_get_font_matrix(cr, &matrix);
    cairo_matrix_rotate(&matrix, -0.5 * M_PI);
    cairo_set_font_matrix(cr, &matrix);

    cairo_move_to(cr, cairo_image_surface_get_width(surface) - 12, top + (height + extents.width) / 2);
    cairo_show_text(cr, text);

    cairo_destroy(cr);
} /* render_spect_border */

static void render_heat_border(cairo_surface_t * surface, double magfloor, const RECT *r)
{
    const char *decibels = "dB";
    char text[512];
    cairo_t * cr;
    cairo_text_extents_t extents;
    TICKS ticks;
    int k, tick_count;

    cr = cairo_create(surface);

    cairo_set_source_rgb(cr, 1.0, 1.0, 1.0);
    cairo_set_line_width(cr, BORDER_LINE_WIDTH);

    /* Border around actual spectrogram. */
    cairo_rectangle(cr, r->left, r->top, r->width, r->height);
    cairo_stroke(cr);

    cairo_select_font_face(cr, font_family, CAIRO_FONT_SLANT_NORMAL, CAIRO_FONT_WEIGHT_NORMAL);
    cairo_set_font_size(cr, 1.0 * NORMAL_FONT_SIZE);

    cairo_text_extents(cr, decibels, &extents);
    cairo_move_to(cr, r->left + (r->width - extents.width) / 2, r->top - 5);
    cairo_show_text(cr, decibels);

    tick_count = calculate_ticks(fabs(magfloor), r->height, &ticks);
    for (k = 0; k < tick_count; k++)
    {
        x_line(cr, r->left + r->width, r->top + ticks.distance[k], TICK_LEN);
        if (k % 2 == 1)
            continue;

        str_print_value(text, sizeof(text), -1.0 * ticks.value[k]);
        cairo_text_extents(cr, text, &extents);
        cairo_move_to(cr, r->left + r->width + 2 * TICK_LEN, r->top + ticks.distance[k] + extents.height / 4.5);
        cairo_show_text(cr, text);
    };

    cairo_destroy(cr);
} /* render_heat_border */

static void interp_spec(float * mag, int maglen, const double *spec, int speclen)
{
    int k, lastspec = 0;

    mag[0] = spec[0];

    for (k = 1; k < maglen; k++)
    {
        double sum = 0.0;
        int count = 0;

        do
        {
            sum += spec[lastspec];
            lastspec++;
            count++;
        }
        while (lastspec <= ceil((k * speclen) / maglen));

        mag[k] = sum / count;
    };
} /* interp_spec */

static void read_mono_audio(const RecordingSampleArray& samples, double* data, int datalen, int indx, int total)
{
    memset(data, 0, datalen * sizeof(data[0]));

    int start = ((uint64)indx * samples.size()) / total - datalen / 2;

    //std::cerr << "nsamples = " << samples.size() << ", datalen = " << datalen << ", indx = " << indx << ", total = " << total << ", start = " << start << std::endl;

    if (start < 0)
    {
        start = -start;
        data += start;
        datalen -= start;
        start = 0;
    }

    // prevent going off the edge for small durations
    if (size_t(start + datalen) >= samples.size())
        datalen = samples.size() - start;

    assert(size_t(start + datalen) <= samples.size());

    // convert s16 to double
    for (int i = 0; i < datalen; i++)
    {
        //int sample = samples[start + i];
        //sample += 32767;
        //data[i] = (sample < 0) ? (sample / 32767.0) : (sample / 32768.0);
        data[i] = samples[start + i];
    }
}

static void render_to_surface(int samplerate, const RecordingSampleArray& samples, const SpectrogramImageGenerator::OutputConfig& config, cairo_surface_t * surface)
{
    static double time_domain[10 * MAX_HEIGHT];
    static double freq_domain[10 * MAX_HEIGHT];
    static double single_mag_spec[5 * MAX_HEIGHT];
    static float mag_spec[MAX_WIDTH][MAX_HEIGHT];

    fftw_plan plan;
    double max_mag = 0.0;
    double spec_floor_db = -config.DynamicRange;
    int width, height, w, speclen;

    if (config.ShowBorder)
    {
        width = lrint(cairo_image_surface_get_width(surface) - LEFT_BORDER - RIGHT_BORDER);
        height = lrint(cairo_image_surface_get_height(surface) - TOP_BORDER - BOTTOM_BORDER);
    }
    else
    {
        width = config.ImageWidth;
        height = config.ImageHeight;
    }

    /*
    **	Choose a speclen value that is long enough to represent frequencies down
    **	to 20Hz, and then increase it slightly so it is a multiple of 0x40 so that
    **	FFTW calculations will be quicker.
    */
    speclen = height * (samplerate / 20 / height + 1);
    speclen += 0x40 - (speclen & 0x3f);

    if (2 * speclen > static_cast<int>(countof(time_domain)))
    {
        std::cerr << "render_to_surface: 2 * speclen > ARRAY_LEN (time_domain)" << std::endl;
        std::abort();
    }

    plan = fftw_plan_r2r_1d(2 * speclen, time_domain, freq_domain, FFTW_R2HC, FFTW_MEASURE | FFTW_PRESERVE_INPUT);
    if (plan == NULL)
    {
        std::cerr << "render_to_surface: create plan failed." << std::endl;
        std::abort();
    }

    for (w = 0; w < width; w++)
    {
        double single_max;

        read_mono_audio(samples, time_domain, 2 * speclen, w, width);

        apply_window(time_domain, 2 * speclen);

        fftw_execute(plan);

        single_max = calc_magnitude(freq_domain, 2 * speclen, single_mag_spec);
        max_mag = std::max(max_mag, single_max);

        interp_spec(mag_spec[w], height, single_mag_spec, speclen);
    }

    fftw_destroy_plan(plan);

    if (config.ShowBorder)
    {
        RECT heat_rect;
        double duration_in_seconds = samples.size() / static_cast<double>(samplerate);

        heat_rect.left = 12;
        heat_rect.top = TOP_BORDER + TOP_BORDER / 2;
        heat_rect.width = 12;
        heat_rect.height = height - TOP_BORDER / 2;

        render_spectrogram(surface, spec_floor_db, mag_spec, max_mag, LEFT_BORDER, TOP_BORDER, width, height);

        render_heat_map(surface, spec_floor_db, &heat_rect);

        render_spect_border(surface, LEFT_BORDER, width, duration_in_seconds, TOP_BORDER, height, 0.5 * samplerate);
        render_heat_border(surface, spec_floor_db, &heat_rect);
    }
    else
    {
        render_spectrogram(surface, spec_floor_db, mag_spec, max_mag, 0, 0, width, height);
    }
} /* render_to_surface */

static cairo_surface_t* render_cairo_surface(int samplerate, const RecordingSampleArray& samples, const SpectrogramImageGenerator::OutputConfig& config)
{
    cairo_surface_t *surface = nullptr;
    cairo_status_t status;

    /*
    **	CAIRO_FORMAT_RGB24 	 each pixel is a 32-bit quantity, with the upper 8 bits
    **	unused. Red, Green, and Blue are stored in the remaining 24 bits in that order.
    */

    surface = cairo_image_surface_create(CAIRO_FORMAT_RGB24, config.ImageWidth, config.ImageHeight);
    if (surface == nullptr || cairo_surface_status(surface) != CAIRO_STATUS_SUCCESS)
    {
        status = cairo_surface_status(surface);
        std::cerr << "Error while creating surface: " << cairo_status_to_string(status) << std::endl;
        return nullptr;
    }

    cairo_surface_flush(surface);

    render_to_surface(samplerate, samples, config, surface);

    return surface;

} /* render_cairo_surface */

static cairo_status_t wrap_cairo_write(void* closure, const unsigned char* data, unsigned int length)
{
    ByteArray* pData = reinterpret_cast<ByteArray*>(closure);

    size_t position = pData->size();
    pData->resize(position + length);
    std::memcpy(pData->data() + position, data, length);

    return CAIRO_STATUS_SUCCESS;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

bool SpectrogramImageGenerator::GenerateSpectrogramImage(uint32 inSampleRate, const RecordingSampleArray& inSamples, const OutputConfig& outputConfig, ByteArray* pOutputData)
{
    /*
    status = cairo_surface_write_to_png(surface, render->pngfilepath);
    if (status != CAIRO_STATUS_SUCCESS)
    printf("Error while creating PNG file : %s\n", cairo_status_to_string(status));

    cairo_surface_destroy(surface);
    */

    cairo_surface_t* surface = render_cairo_surface(inSampleRate, inSamples, outputConfig);

    pOutputData->clear();
    cairo_status_t encode_status = cairo_surface_write_to_png_stream(surface, wrap_cairo_write, pOutputData);
    if (encode_status != CAIRO_STATUS_SUCCESS)
    {
        std::cerr << "Error while writing png stream: " << cairo_status_to_string(encode_status) << std::endl;
        cairo_surface_destroy(surface);
        return false;
    }
    
    cairo_surface_destroy(surface);
    return true;
}
