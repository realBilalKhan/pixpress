<h1 align="center">Pixpress</h1>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D14.0.0-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js Version">
  <img src="https://img.shields.io/npm/v/chess-arena?style=flat&logo=npm&logoColor=white&color=cb3837" alt="npm Version">
</p>

## Features

- Info - Analyze image properties and metadata
- Resize - Scale images to any dimensions
- Convert - Change image formats (JPG, PNG, WebP, TIFF, GIF, BMP, AVIF)
- Preset - Quick presets for common use cases
- Watermark - Add watermarks with customizable positioning

## Quick Start

```bash
# Installation
npm install -g pixpress

# Interactive Mode (Recommended for Beginners)
pixpress
```

## Command Reference

### Analyze Images

Get detailed information about your images including format, dimensions, compression, and optimization recommendations.

```bash
pixpress info image.jpg
```

### Resize Images

Scale images to specific dimensions with various fit modes.

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

Change image formats with optimized settings for each format.

```bash
# Convert to WebP
pixpress convert input.jpg --format webp

# Convert with custom quality
pixpress convert input.png -f jpg -q 85

# Convert with custom output path
pixpress convert input.jpg -f png -o converted.png
```

Supported formats: `jpg`, `png`, `webp`, `tiff`, `gif`, `bmp`, `avif`

### Apply Presets

Quick transformations for common use cases.

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

Protect your images with customizable watermarks.

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
- `bottom-right` (default)
- `center`

#### Watermark Options:

- `--size` - Watermark size as percentage (10-50%)
- `--opacity` - Transparency (0.1-1.0)

### Global Options

All commands support these options:

- `-o, --output <path>` - Custom output file path
- `-q, --quality <1-100>` - JPEG/WebP quality (default: 80)

## Requirements

- Node.js >= 14.0.0
- Supported on Windows, macOS, and Linux
