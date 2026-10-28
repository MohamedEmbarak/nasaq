"""Rebuild editable Nasaq SVG artwork and outlined typographic lockups.

Requires Python fontTools and system HarfBuzz. Font files are read, never modified.
This script does not access the network or write outside brand/.
"""
from pathlib import Path
import ctypes as C
import ctypes.util
import io
import json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'assets'
OUT.mkdir(exist_ok=True)
COLORS = {'primary': '#006A64', 'mint': '#C8E7DD', 'ivory': '#F7F5EE', 'ink': '#142D30'}


def svg(width, height, title, content, description='Outlined Arabic Nasaq wordmark in Aref Ruqaa Bold. No font dependency.'):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc">
<title id="title">{title}</title><desc id="desc">{description}</desc>
{content}
</svg>\n'''


hb = C.CDLL(ctypes.util.find_library('harfbuzz'))
class GlyphInfo(C.Structure):
    _fields_ = [('codepoint', C.c_uint32), ('mask', C.c_uint32), ('cluster', C.c_uint32), ('var1', C.c_uint32), ('var2', C.c_uint32)]
class GlyphPosition(C.Structure):
    _fields_ = [('x_advance', C.c_int32), ('y_advance', C.c_int32), ('x_offset', C.c_int32), ('y_offset', C.c_int32), ('var', C.c_uint32)]


def binding(name, args, result):
    fn = getattr(hb, name)
    fn.argtypes, fn.restype = args, result
    return fn


blob_create = binding('hb_blob_create', [C.c_void_p, C.c_uint, C.c_int, C.c_void_p, C.c_void_p], C.c_void_p)
face_create = binding('hb_face_create', [C.c_void_p, C.c_uint], C.c_void_p)
font_create = binding('hb_font_create', [C.c_void_p], C.c_void_p)
font_funcs = binding('hb_ot_font_set_funcs', [C.c_void_p], None)
font_scale = binding('hb_font_set_scale', [C.c_void_p, C.c_int, C.c_int], None)
buffer_create = binding('hb_buffer_create', [], C.c_void_p)
buffer_add = binding('hb_buffer_add_utf8', [C.c_void_p, C.c_char_p, C.c_int, C.c_uint, C.c_int], None)
buffer_guess = binding('hb_buffer_guess_segment_properties', [C.c_void_p], None)
shape = binding('hb_shape', [C.c_void_p, C.c_void_p, C.c_void_p, C.c_uint], None)
get_info = binding('hb_buffer_get_glyph_infos', [C.c_void_p, C.POINTER(C.c_uint)], C.POINTER(GlyphInfo))
get_pos = binding('hb_buffer_get_glyph_positions', [C.c_void_p, C.POINTER(C.c_uint)], C.POINTER(GlyphPosition))
for obj in ['blob', 'face', 'font', 'buffer']:
    binding('hb_' + obj + '_destroy', [C.c_void_p], None)


def outlined(text, font_path, weight=None):
    font = TTFont(font_path)
    if weight is not None and 'fvar' in font:
        axes = {axis.axisTag: axis.defaultValue for axis in font['fvar'].axes}
        axes['wght'] = weight
        font = instantiateVariableFont(font, axes, inplace=False)
    stream = io.BytesIO()
    font.save(stream)
    data = stream.getvalue()
    raw = C.create_string_buffer(data)
    blob = blob_create(raw, len(data), 0, None, None)
    face = face_create(blob, 0)
    hfont = font_create(face)
    font_funcs(hfont)
    em = font['head'].unitsPerEm
    font_scale(hfont, em, em)
    buf = buffer_create()
    utf8 = text.encode('utf-8')
    buffer_add(buf, utf8, len(utf8), 0, len(utf8))
    buffer_guess(buf)
    shape(hfont, buf, None, 0)
    count = C.c_uint()
    infos, pos = get_info(buf, C.byref(count)), get_pos(buf, C.byref(count))
    glyphs, order = font.getGlyphSet(), font.getGlyphOrder()
    path_pen, bounds_pen = SVGPathPen(glyphs), BoundsPen(glyphs)
    cursor = 0
    for i in range(count.value):
        assert infos[i].codepoint != 0, 'Font lacks a required glyph'
        transform = (1, 0, 0, 1, cursor + pos[i].x_offset, pos[i].y_offset)
        glyph = glyphs[order[infos[i].codepoint]]
        glyph.draw(TransformPen(path_pen, transform))
        glyph.draw(TransformPen(bounds_pen, transform))
        cursor += pos[i].x_advance
    for obj, handle in [('buffer', buf), ('font', hfont), ('face', face), ('blob', blob)]:
        getattr(hb, 'hb_' + obj + '_destroy')(handle)
    return path_pen.getCommands(), bounds_pen.bounds


# Aref Ruqaa is an offline artwork input only. Every distributed wordmark is
# outlined; applications never load or depend on this font.
ar = outlined('نسق', ROOT/'third-party/arefruqaa/ArefRuqaa-Bold.ttf')


def placed(item, left, top, width, color):
    path, (xmin, ymin, xmax, ymax) = item
    scale = width / (xmax - xmin)
    return f'<path fill="{color}" transform="translate({left-xmin*scale:.5f} {top+ymax*scale:.5f}) scale({scale:.7f} {-scale:.7f})" d="{path}"/>'


variants = {'': '#006A64', '-reverse': '#F7F5EE', '-mono': '#142D30', '-white': '#FFFFFF'}
# Historical filenames remain aliases, containing exactly the same Arabic-only
# artwork. There is no separate symbol, Latin name or bilingual lockup anymore.
aliases = ['nasaq-symbol', 'nasaq-lockup-ar', 'nasaq-lockup-en', 'nasaq-lockup-bilingual']
for suffix, color in variants.items():
    artwork = svg(144, 112, 'نسق', placed(ar, 16, 10, 112, color))
    (OUT/f'nasaq-wordmark{suffix}.svg').write_text(artwork, encoding='utf-8')
    for alias in aliases:
        (OUT/f'{alias}{suffix}.svg').write_text(artwork, encoding='utf-8')

favicon = '<rect width="96" height="96" rx="20" fill="#006A64"/><g transform="translate(0 10.666667) scale(.6666667)">' + placed(ar, 16, 10, 112, '#F7F5EE') + '</g>'
(OUT/'favicon.svg').write_text(svg(96, 96, 'نسق', favicon), encoding='utf-8')
pattern = '<defs><pattern id="wordmark-repeat" width="144" height="128" patternUnits="userSpaceOnUse">' + placed(ar, 24, 20, 96, '#C8E7DD') + '</pattern></defs><rect width="768" height="384" fill="#F7F5EE"/><rect width="768" height="384" fill="url(#wordmark-repeat)"/>'
(OUT/'nasaq-pattern.svg').write_text(svg(768,384,'نسق',pattern,'Quiet repeating Arabic wordmark pattern.'),encoding='utf-8')
source = '<g id="arabic-wordmark">' + placed(ar, 16, 10, 112, COLORS['primary']) + '</g>'
(ROOT/'editable-wordmark.svg').write_text(svg(144,112,'نسق',source,'Editable outlined Arabic lettering. No installed font or network request required.'),encoding='utf-8')
print('Generated Arabic-only wordmarks, compatibility aliases, favicon, pattern and editable outline source.')
