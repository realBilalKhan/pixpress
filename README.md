<h1 align="center">Chess Arena</h1>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D14.0.0-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js Version">
  <img src="https://img.shields.io/npm/v/chess-arena?style=flat&logo=npm&logoColor=white&color=cb3837" alt="npm Version">
</p>

## Features

- Resize - Scale images to any dimensions
- Convert - Change image formats (JPG, PNG, WebP, TIFF, GIF, BMP, AVIF)
- Preset - Quick presets for common use cases
- Watermark - Add watermarks with customizable positioning

## Installation

```bash
npm install -g pixpress
```

## Usage

### Resize Images

```bash
# Resize to specific width (height auto-calculated)
pixpress resize input.jpg --width 800

# Resize to specific height (width auto-calculated)
pixpress resize input.jpg --height 600

# Resize to exact dimensions
pixpress resize input.jpg --width 800 --height 600

# Custom output path and quality
pixpress resize input.jpg -w 800 -h 600 -o resized.jpg -q 90

# Different fit modes
pixpress resize input.jpg -w 800 -h 600 --fit contain
```

#### Fit modes:

- `cover` (default) - Crop to fill dimensions
- `contain` - Fit within dimensions (may have letterboxing)
- `fill` - Stretch to exact dimensions
- `inside` - Fit within dimensions, no enlargement
- `outside` - Ensure image covers dimensions

### Convert Formats

```bash
# Convert to WebP
pixpress convert input.jpg --format webp

# Convert with custom quality
pixpress convert input.png -f jpg -q 85

# Convert with custom output path
pixpress convert input.jpg -f png -o converted.png
```

Supported formats: jpg, png, webp, tiff, gif, bmp, avif

### Apply Presets

```bash
# Create a thumbnail
pixpress preset input.jpg --preset thumbnail

# Create an avatar
pixpress preset input.jpg --preset avatar

# Create a banner
pixpress preset input.jpg --preset banner

# Social media post
pixpress preset input.jpg --preset social

# Compress for web
pixpress preset input.jpg --preset compress
```

#### Available presets:

- `thumbnail` - 150x150 thumbnail
- `avatar` - 128x128 avatar
- `banner` - 1200x400 banner
- `social` - 1080x1080 social media post
- `compress` - High compression for web

### Add Watermarks

```bash
# Add watermark to bottom-right
pixpress watermark input.jpg --watermark logo.png

# Custom position and size
pixpress watermark input.jpg -w logo.png --position top-left --size 15

# Custom opacity and output
pixpress watermark input.jpg -w logo.png -p center --opacity 0.5 -o watermarked.jpg
```

#### Watermark positions:

- `top-left`
- `top-right`
- `bottom-left`
- `bottom-right (default)`
- `center`

#### Options:

- `--size` - Watermark size as percentage (10-50%)
- `--opacity` - Transparency (0.1-1.0)

## Requirements

- Node.js >= 14.0.0
- Supported on Windows, macOS, and Linux
