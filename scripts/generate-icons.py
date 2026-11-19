"""Generate anti-aliased RGBA PNG icons and Edge store logo using Python stdlib only."""

import math
import os
import struct
import zlib


def sd_rounded_box(px, py, bx, by, r):
    qx = abs(px) - bx + r
    qy = abs(py) - by + r
    return math.hypot(max(qx, 0.0), max(qy, 0.0)) + min(max(qx, qy), 0.0) - r


def sd_circle(px, py, cx, cy, r):
    return math.hypot(px - cx, py - cy) - r


def sd_padlock_shackle(px, py):
    # Top arch centered at (0, -0.07)
    cx, cy = 0.0, -0.07
    outer_r = 0.155
    inner_r = 0.09
    mid_r = (outer_r + inner_r) * 0.5
    half_t = (outer_r - inner_r) * 0.5

    if py <= cy:
        return abs(math.hypot(px - cx, py - cy) - mid_r) - half_t
    # Vertical legs from y = -0.07 down to y = 0.02
    leg_center_y = -0.025
    leg_half_h = 0.045
    leg_x = abs(px) - mid_r
    leg_y = abs(py - leg_center_y) - leg_half_h
    return math.hypot(max(leg_x, 0.0), max(leg_y, 0.0)) + min(max(leg_x, leg_y), 0.0) - half_t


def blend(dst, src, cov):
    if cov <= 0.0:
        return dst
    if cov >= 1.0:
        return src
    inv = 1.0 - cov
    return (
        dst[0] * inv + src[0] * cov,
        dst[1] * inv + src[1] * cov,
        dst[2] * inv + src[2] * cov,
        dst[3] * inv + src[3] * cov,
    )


def coverage_from_sd(sd, aa):
    return max(0.0, min(1.0, 0.5 - sd / aa))


def sample_pixel(nx, ny, aa):
    bg_color = (15.0, 23.0, 42.0, 255.0)       # #0f172a
    border_color = (30.0, 41.0, 59.0, 255.0)   # #1e293b
    badge_color = (239.0, 68.0, 68.0, 255.0)   # #ef4444
    white_color = (248.0, 250.0, 252.0, 255.0) # #f8fafc

    # Outer rounded square background
    sd_outer = sd_rounded_box(nx, ny, 0.90, 0.90, 0.24)
    outer_cov = coverage_from_sd(sd_outer, aa)
    if outer_cov <= 0.0:
        return (0.0, 0.0, 0.0, 0.0)

    # Border ring (outer edge to inner edge)
    sd_inner = sd_rounded_box(nx, ny, 0.84, 0.84, 0.20)
    inner_cov = coverage_from_sd(sd_inner, aa)

    col = blend(border_color, bg_color, inner_cov)

    # Centered YouTube-style rounded play-badge
    sd_badge = sd_rounded_box(nx, ny, 0.64, 0.46, 0.15)
    badge_cov = coverage_from_sd(sd_badge, aa)
    col = blend(col, badge_color, badge_cov)

    # White padlock silhouette (body + shackle)
    sd_body = sd_rounded_box(nx, ny - 0.12, 0.21, 0.165, 0.045)
    sd_shackle = sd_padlock_shackle(nx, ny)
    sd_lock = min(sd_body, sd_shackle)

    # Keyhole cutout in badge color
    sd_key_dot = sd_circle(nx, ny, 0.0, 0.095, 0.042)
    sd_key_stem = sd_rounded_box(nx, ny - 0.145, 0.022, 0.05, 0.01)
    sd_keyhole = min(sd_key_dot, sd_key_stem)

    lock_cov = coverage_from_sd(sd_lock, aa)
    key_cov = coverage_from_sd(sd_keyhole, aa)
    net_lock_cov = max(0.0, lock_cov - key_cov)

    col = blend(col, white_color, net_lock_cov)

    # Apply outer alpha mask
    return (col[0], col[1], col[2], col[3] * outer_cov)


def write_png(path, width, height, rgba_bytes):
    def chunk(tag, data):
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    raw_rows = bytearray()
    stride = width * 4
    for y in range(height):
        raw_rows.append(0)  # Filter type 0 (None)
        start = y * stride
        raw_rows.extend(rgba_bytes[start : start + stride])

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw_rows), 9)
    png_data = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", idat)
        + chunk(b"IEND", b"")
    )

    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(png_data)


def render_icon(size, out_path):
    ss = 4 if size <= 48 else 2
    aa = 1.4 / size
    buf = bytearray(size * size * 4)
    inv_ss2 = 1.0 / (ss * ss)

    idx = 0
    for y in range(size):
        for x in range(size):
            r_acc = 0.0
            g_acc = 0.0
            b_acc = 0.0
            a_acc = 0.0
            for sy in range(ss):
                py = ((y + (sy + 0.5) / ss) / size) * 2.0 - 1.0
                for sx in range(ss):
                    px = ((x + (sx + 0.5) / ss) / size) * 2.0 - 1.0
                    r, g, b, a = sample_pixel(px, py, aa)
                    r_acc += r
                    g_acc += g
                    b_acc += b
                    a_acc += a

            buf[idx] = max(0, min(255, int(round(r_acc * inv_ss2))))
            buf[idx + 1] = max(0, min(255, int(round(g_acc * inv_ss2))))
            buf[idx + 2] = max(0, min(255, int(round(b_acc * inv_ss2))))
            buf[idx + 3] = max(0, min(255, int(round(a_acc * inv_ss2))))
            idx += 4

    write_png(out_path, size, size, buf)
    print(f"Generated {out_path} ({size}x{size})")


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    targets = [
        (16, os.path.join(root, "extension", "icons", "icon16.png")),
        (32, os.path.join(root, "extension", "icons", "icon32.png")),
        (48, os.path.join(root, "extension", "icons", "icon48.png")),
        (128, os.path.join(root, "extension", "icons", "icon128.png")),
        (300, os.path.join(root, "store-assets", "logo-300x300.png")),
    ]
    for size, path in targets:
        render_icon(size, path)


if __name__ == "__main__":
    main()
