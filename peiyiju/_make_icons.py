"""纯标准库生成 PWA 图标 PNG：绿色底 + 白色对话气泡 + 三个绿点。"""
import zlib, struct, os

GREEN = (124, 179, 66)
WHITE = (255, 255, 255)


def in_rect(x, y, x0, y0, x1, y1):
    return x0 <= x < x1 and y0 <= y < y1


def in_rounded(x, y, x0, y0, x1, y1, r):
    if not in_rect(x, y, x0, y0, x1, y1):
        return False
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    if (x < x0 + r or x > x1 - r) and (y < y0 + r or y > y1 - r):
        return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
    return True


def in_circle(x, y, cx, cy, r):
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def build(size, scale=1.0):
    """scale < 1 时图形整体缩小，给 maskable 留安全边距。"""
    s = size
    m = (1 - scale) / 2  # 每侧留白比例

    def P(v):
        return m * s + v * s * scale

    bx0, bx1 = P(0.219), P(0.781)
    by0, by1 = P(0.250), P(0.656)
    br = 0.086 * s * scale
    tail = [(P(0.266), P(0.610)), (P(0.430), P(0.610)), (P(0.266), P(0.742))]

    dots = [(P(0.383), P(0.453)), (P(0.500), P(0.453)), (P(0.617), P(0.453))]
    dr = 0.049 * s * scale

    rows = []
    for y in range(s):
        row = bytearray()
        for x in range(s):
            fx, fy = x + 0.5, y + 0.5
            color = GREEN
            if in_rounded(fx, fy, bx0, by0, bx1, by1, br) or point_in_tri(fx, fy, tail):
                color = WHITE
                for cx, cy in dots:
                    if in_circle(fx, fy, cx, cy, dr):
                        color = GREEN
                        break
            row += bytes(color)
        rows.append(bytes(row))
    return rows


def point_in_tri(px, py, tri):
    (x1, y1), (x2, y2), (x3, y3) = tri
    d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2)
    d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3)
    d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1)
    neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
    pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
    return not (neg and pos)


def write_png(path, size, rows):
    raw = b''.join(b'\x00' + r for r in rows)

    def chunk(tag, data):
        c = struct.pack('>I', len(data)) + tag + data
        return c + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)
    print(path, os.path.getsize(path), 'bytes')


here = os.path.dirname(os.path.abspath(__file__))
for sz in (192, 512):
    write_png(os.path.join(here, 'icon-%d.png' % sz), sz, build(sz))
write_png(os.path.join(here, 'icon-maskable.png'), 512, build(512, scale=0.72))
