# -*- mode: python ; coding: utf-8 -*-
from pathlib import Path
from PyInstaller.utils.hooks import collect_all, copy_metadata, get_package_paths

datas = []
binaries = []
hiddenimports = []
tmp_ret = collect_all('playwright')
datas += tmp_ret[0]; binaries += tmp_ret[1]; hiddenimports += tmp_ret[2]

# Playwright launches its bundled Node driver as a child process. When the
# extension-less `driver/node` file is collected as ordinary data, a frozen,
# quarantined macOS app can fail before the protocol connection is created and
# surface the misleading `_playwright` AttributeError. Collect it explicitly as
# an executable binary so PyInstaller preserves and signs it as nested code.
_, playwright_dir = get_package_paths('playwright')
driver_node = Path(playwright_dir) / 'driver' / 'node'
datas = [item for item in datas if Path(item[0]).resolve() != driver_node.resolve()]
binaries.append((str(driver_node), 'playwright/driver'))
datas += copy_metadata('playwright')

greenlet_ret = collect_all('greenlet')
datas += greenlet_ret[0]; binaries += greenlet_ret[1]; hiddenimports += greenlet_ret[2]
hiddenimports += [
    'playwright._impl._driver',
    'playwright._impl._transport',
    'greenlet',
    'greenlet._greenlet',
]


a = Analysis(
    ['../bot.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='CheckAppRunner',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    upx_exclude=[],
    name='CheckAppRunner',
)
