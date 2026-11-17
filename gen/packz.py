"""Compact transport format for a mesh pack.

  python gen/packz.py pack   out/meshes.bin  dist/meshes.pack
  python gen/packz.py unpack dist/meshes.pack out/meshes.bin

A .pack is a gzip stream of: 'CRN2', u32 header length, header JSON, then five byte streams.
Compared with the plain pack it reorders vertices by first use, stores indices as distances
behind the newest vertex, positions as 12-bit deltas in byte planes, and normals and colours
as per-channel deltas. That halves the download. Positions lose precision below 1/4096 of each
mesh's bounding box (well under a millimetre), so unpack gives back an equivalent pack, not the same bytes.
"""
import gzip, json, struct, sys
import numpy as np

QB = 12
STREAMS = ('idx', 'plo', 'phi', 'nrm', 'col')
DROP = ('p', 'n', 'c', 'i', 'i16')


def read_plain(path):
    b = open(path, 'rb').read()
    assert b[:4] == b'CARN', 'not a plain mesh pack'
    hl = struct.unpack('<I', b[4:8])[0]
    return json.loads(b[8:8 + hl]), b[8 + hl:]


def pack(src, dst):
    h, blob = read_plain(src)
    S = {k: [] for k in STREAMS}
    metas = []
    for m in h['meshes']:
        nv, ni = m['nv'], m['ni']
        q = np.frombuffer(blob, np.uint16, nv * 3, m['p']).reshape(nv, 3)
        n = np.frombuffer(blob, np.int8, nv * 4, m['n']).reshape(nv, 4)[:, :3]
        c = np.frombuffer(blob, np.uint8, nv * 4, m['c']).reshape(nv, 4)
        idx = np.frombuffer(blob, np.uint16 if m['i16'] else np.uint32, ni, m['i']).astype(np.int64)
        first = np.full(nv, ni, np.int64); np.minimum.at(first, idx, np.arange(ni))
        order = np.argsort(first, kind='stable')
        remap = np.empty(nv, np.int64); remap[order] = np.arange(nv)
        idx = remap[idx]; q, n, c = q[order], n[order], c[order]
        nxt = np.concatenate([[0], np.maximum.accumulate(idx)[:-1] + 1])
        v = nxt - idx                                    # 0: the next unseen vertex
        assert v.min() >= 0 and v.max() < 1 << 21
        by = np.stack([(v & 127) | np.where(v > 127, 128, 0), ((v >> 7) & 127) | np.where(v > 16383, 128, 0), v >> 14], 1).astype(np.uint8)
        S['idx'].append(by[np.stack([np.ones(ni, bool), v > 127, v > 16383], 1)].tobytes())
        qq = np.round(q.astype(np.float64) * ((1 << QB) - 1) / 65535).astype(np.int32)
        d = np.diff(qq, axis=0, prepend=0); z = ((d << 1) ^ (d >> 31)).astype(np.uint32)
        S['plo'].append((z & 255).astype(np.uint8).T.tobytes()); S['phi'].append((z >> 8).astype(np.uint8).T.tobytes())
        S['nrm'].append(np.diff(n.astype(np.int16), axis=0, prepend=0).astype(np.uint8).T.tobytes())
        S['col'].append(np.diff(c.astype(np.int16), axis=0, prepend=0).astype(np.uint8).T.tobytes())
        metas.append({k: x for k, x in m.items() if k not in DROP})
    streams = {k: b''.join(v) for k, v in S.items()}
    head = json.dumps(dict(meshes=metas, extra=h.get('extra', {}), qb=QB, streams={k: len(streams[k]) for k in STREAMS}), separators=(',', ':')).encode()
    head += b' ' * ((-(8 + len(head))) % 4)
    raw = b'CRN2' + struct.pack('<I', len(head)) + head + b''.join(streams[k] for k in STREAMS)
    out = gzip.compress(raw, 9, mtime=0)
    open(dst, 'wb').write(out)
    return len(out)


def unpack(src, dst):
    b = gzip.decompress(open(src, 'rb').read())
    assert b[:4] == b'CRN2'
    hl = struct.unpack('<I', b[4:8])[0]
    h = json.loads(b[8:8 + hl]); qb = h['qb']
    off = 8 + hl; st = {}
    for k in STREAMS:
        st[k] = np.frombuffer(b, np.uint8, h['streams'][k], off); off += h['streams'][k]
    pos = {k: 0 for k in STREAMS}
    blobs = []; size = 0; entries = []

    def add(arr):
        nonlocal size
        o = size; x = arr.tobytes(); blobs.append(x); size += len(x)
        pad = (-size) % 4
        if pad: blobs.append(b'\0' * pad); size += pad
        return o
    for m in h['meshes']:
        nv, ni = m['nv'], m['ni']
        idx = np.empty(ni, np.int64); s = st['idx']; p = pos['idx']; nxt = 0
        for k in range(ni):                               # varints are sequential by nature
            v = int(s[p]); p += 1
            if v > 127:
                x = int(s[p]); p += 1; v = (v & 127) | ((x & 127) << 7)
                if x > 127: v |= int(s[p]) << 14; p += 1
            idx[k] = nxt - v
            if v == 0: nxt += 1
        pos['idx'] = p
        lo = st['plo'][pos['plo']:pos['plo'] + 3 * nv].reshape(3, nv).T.astype(np.uint32); pos['plo'] += 3 * nv
        hi = st['phi'][pos['phi']:pos['phi'] + 3 * nv].reshape(3, nv).T.astype(np.uint32); pos['phi'] += 3 * nv
        z = lo | (hi << 8); d = (z >> 1).astype(np.int32) ^ -(z & 1).astype(np.int32)
        q = np.round(np.cumsum(d, axis=0) * 65535 / ((1 << qb) - 1)).astype(np.uint16)
        n = np.cumsum(st['nrm'][pos['nrm']:pos['nrm'] + 3 * nv].reshape(3, nv).T.astype(np.int64), axis=0).astype(np.uint8).view(np.int8); pos['nrm'] += 3 * nv
        c = np.cumsum(st['col'][pos['col']:pos['col'] + 4 * nv].reshape(4, nv).T.astype(np.int64), axis=0).astype(np.uint8); pos['col'] += 4 * nv
        e = dict(m); i16 = nv <= 65535
        e['p'] = add(q); e['n'] = add(np.concatenate([n, np.zeros((nv, 1), np.int8)], 1)); e['c'] = add(c)
        e['i'] = add(idx.astype(np.uint16 if i16 else np.uint32)); e['i16'] = bool(i16)
        entries.append(e)
    head = json.dumps(dict(meshes=entries, extra=h.get('extra', {})), separators=(',', ':')).encode()
    head += b' ' * ((-(8 + len(head))) % 4)
    open(dst, 'wb').write(b'CARN' + struct.pack('<I', len(head)) + head + b''.join(blobs))


if __name__ == '__main__':
    if len(sys.argv) == 4 and sys.argv[1] == 'pack':
        print(sys.argv[3], pack(sys.argv[2], sys.argv[3]), 'bytes')
    elif len(sys.argv) == 4 and sys.argv[1] == 'unpack':
        unpack(sys.argv[2], sys.argv[3]); print('wrote', sys.argv[3])
    else:
        print(__doc__)
