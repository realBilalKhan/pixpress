<h1 align="center">Pixpress</h1>

<p align="center">
  <i>Modern image processing that scales from single files to batch operations</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D14.0.0-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js Version">
  <a href="https://www.npmjs.com/package/pixpress">
    <img src="https://img.shields.io/npm/v/pixpress?style=flat&logo=npm&logoColor=white&color=cb3837" alt="npm Version">
  </a>
  <a href="https://github.com/realBilalKhan/pixpress/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT">
  </a>
</p>

<p align="center">
  <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/142b06145c01b8d280f54b600c3e52cae1a9a8ef_a_20250929_133644_126d4c.jpg" alt="Demo Screenshot">
</p>

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Command Reference](#command-reference)
  - [Analyze Images](#analyze-images)
  - [Resize Images](#resize-images)
  - [Convert Formats](#convert-formats)
  - [Rotate & Flip Images](#rotate--flip-images)
  - [Apply Color Filters & Effects](#apply-color-filters--effects)
  - [Create Viral Memes](#create-viral-memes)
  - [Create Photo Collages](#create-photo-collages)
  - [Apply Presets](#apply-presets)
  - [Add Watermarks](#add-watermarks)
  - [Batch Processing](#batch-processing)
  - [HEIC/HEIF Processing](#heicheif-processing)
- [Global Options](#global-options)
- [Output Directory](#output-directory)
- [Requirements](#requirements)

## Features

- **Info** - Analyze image properties, metadata, and color distribution
- **Resize** - Scale images to any dimensions
- **Convert** - Change image formats (JPG, PNG, WebP, TIFF, GIF, BMP, AVIF)
- **Rotate** - Rotate and flip images with precise control
- **Filters** - Apply color filters and artistic effects
- **Meme** - Create viral memes with text overlays and templates
- **Collage** - Create photo collages with multiple layout options
- **Preset** - Quick presets for common use cases
- **Watermark** - Add watermarks with customizable positioning
- **Batch Processing** - Process entire folders of images at once
- **HEIC/HEIF Support** - Smart processing for iOS and macOS image formats

## Quick Start

```bash
# Installation
npm install -g pixpress

# Interactive Mode (Recommended for Beginners)
pixpress

# Or use specific commands directly
pixpress info photo.jpg
pixpress resize IMG_1234.heic --width 800
pixpress convert IMG_5678.heic --format jpg
pixpress meme --template drake --text "Old way" "New way"
pixpress collage ./vacation-photos --layout grid
```

## Command Reference

### Analyze Images

Get comprehensive information about your images including format, dimensions, compression, color analysis, and optimization recommendations.

```bash
# Basic image analysis
pixpress info image.jpg

# Detailed analysis with histogram visualization
pixpress info image.jpg --verbose
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

# Apply filter during conversion
pixpress convert input.jpg -f jpg --filter vintage
```

- **Supported input formats:** `jpg`, `jpeg`, `png`, `webp`, `tiff`, `gif`, `bmp`, `avif`, `heic`, `heif`
- **Supported output formats:** `jpg`, `png`, `webp`, `tiff`, `gif`, `bmp`, `avif`

### Rotate & Flip Images

Transform images with precise rotation and flipping controls.

```bash
# Rotate 90 degrees clockwise
pixpress rotate input.jpg --angle 90

# Rotate counter-clockwise
pixpress rotate input.jpg --angle -90

# Flip horizontally (mirror)
pixpress rotate input.jpg --flip-h

# Flip vertically (upside-down)
pixpress rotate input.jpg --flip-v

# Combine rotation and flip
pixpress rotate input.jpg --angle 180 --flip-h

# Custom angle with quality setting
pixpress rotate input.jpg -a 45 -q 90 -o rotated.jpg

# Custom background for exposed areas
pixpress rotate input.jpg --angle 30 --background "#FF000000"
```

#### Rotation Options:

- `--angle <degrees>` - Rotation angle (-360 to 360 degrees)
- `--flip-h, --horizontal` - Flip horizontally (mirror effect)
- `--flip-v, --vertical` - Flip vertically
- `--background <color>` - Background color for exposed areas (default: transparent)
- `--quality <1-100>` - Output quality for JPEG/WebP

### Apply Color Filters & Effects

Transform your images with artistic color filters and effects.

```bash
# Apply black and white filter
pixpress filters input.jpg --filter grayscale

# Apply sepia tone effect
pixpress filters input.jpg --filter sepia

# Apply vintage film look
pixpress filters input.jpg --filter vintage

# Custom output path and quality
pixpress filters input.jpg -f cool -o cool_photo.jpg -q 90

# List all available filters
pixpress filters --list
```

**Available filters:** `grayscale`, `sepia`, `negative`, `cool`, `warm`, `vintage`, `polaroid`, `dramatic`, `soft`, `dark`, `bright`, `vivid`, `muted`, `noir`, `retro`, `cyberpunk`

### Create Viral Memes

Generate memes with text overlays using popular templates or your own images.

```bash
# Use built-in Drake template (no image needed)
pixpress meme --template drake --text "Writing documentation" "Using PixPress"

# Create classic top/bottom text meme with your image
pixpress meme funny.jpg --text "When you finally" "Fix that bug"

# Use Mocking SpongeBob template (auto-alternating caps)
pixpress meme --template spongebob --text "nObOdY uSeS cLi ToOlS"

# Create Woman Yelling at Cat meme
pixpress meme --template woman_cat --text "Me explaining my code" "The code"

# Apply deep fry filter for extra spice
pixpress meme photo.jpg --text "BOTTOM TEXT" --filter deepfry

# Change text style
pixpress meme photo.jpg --text "Modern meme" --style modern


# List all available templates
pixpress meme --list-templates

# List all text styles
pixpress meme --list-styles

# Get viral meme tips
pixpress meme --tips
```

#### Meme Options:

- `template <name>` - Use a predefined meme template
- `text <text...>` - Text to add (multiple for different areas)
- `style <style>` - Text style (default: impact)
- `filter <filter>` - Special effect filter
- `quality <1-100>` - Output quality (default: 85)

### Create Photo Collages

Combine multiple images into beautiful collages with various layout options.

```bash
# Create a 3x3 photo grid from folder
pixpress collage ./vacation-photos --layout grid --cols 3

# Create polaroid-style scattered layout
pixpress collage img1.jpg,img2.jpg,img3.jpg --layout polaroid

# Create horizontal filmstrip with shuffle
pixpress collage ./photos --layout filmstrip --shuffle

# Magazine-style layout with custom dimensions
pixpress collage ./portraits --layout magazine --width 1200 --height 800

# Vertical photo strip
pixpress collage ./memories --layout strip --direction vertical

# Custom spacing and background
pixpress collage ./family --layout grid --spacing 20 --background "#F0F0F0"

# List available layouts
pixpress collage --list-layouts
```

**Available layouts:** `grid` (equal-sized cells), `strip` (horizontal/vertical), `polaroid` (scattered with rotation), `mosaic` (irregular sizes), `filmstrip` (vintage perforations), `magazine` (featured image + grid)

#### Collage Options:

- `--layout <name>` - Layout type (required)
- `--width <pixels>` - Canvas width (default: 1920)
- `--height <pixels>` - Canvas height (default: 1080)
- `--spacing <pixels>` - Space between images (default: 10)
- `--background <color>` - Background color (hex, RGB, or name)
- `--format <format>` - Output format: jpg, png, webp (default: jpg)
- `--quality <1-100>` - JPEG/WebP quality (default: 85)
- `--shuffle` - Randomly shuffle input images
- `--max-files <number>` - Limit number of images to use
- `--cols <number>` - Grid columns (grid layout only)
- `--direction <direction>` - Strip direction: horizontal/vertical
- `--fit <mode>` - Image fit mode: cover, contain, fill

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

- `top-left`, `top-right`, `bottom-left`, `bottom-right` (default), `center`

#### Watermark Options:

- `--size` - Watermark size as percentage (10-50%)
- `--opacity` - Transparency (0.1-1.0)

### Batch Processing

Process entire folders of images with a single command. All operations support batch processing.

```bash
# Convert all HEIC files to JPG
pixpress batch convert ./photos --format jpg --include "*.heic,*.heif"

# Resize all images
pixpress batch resize ./photos --width 800 --height 600

# Convert all images to WebP
pixpress batch convert ./images --format webp --quality 80

# Apply color filter to all images
pixpress batch filters ./photos --filter vintage

# Create memes from all images in folder
pixpress batch meme ./templates --text "YOUR TEXT HERE"

# Create collages from subfolders
pixpress batch collage ./events --layout grid --cols 3

# Apply preset to all images
pixpress batch preset ./gallery --preset thumbnail

# Add watermark to all images
pixpress batch watermark ./photos --watermark logo.png

# Rotate all images 90 degrees
pixpress batch rotate ./photos --angle 90
```

#### Advanced Batch Options

```bash
# Process folders recursively
pixpress batch resize ./photos --recursive --width 1200

# Custom output folder
pixpress batch convert ./images --format jpg --output ./converted

# Include only HEIC files
pixpress batch convert ./mixed --format jpg --include "*.heic,*.heif"

# Exclude certain patterns
pixpress batch resize ./photos --width 800 --exclude "*_thumb.*,*_small.*"

# Preview what will be processed (dry run)
pixpress batch convert ./images --format webp --dry-run

# Show detailed progress for each file
pixpress batch preset ./gallery --preset social --verbose

# Batch create memes with template
pixpress batch meme ./photos --template classic --text "WHEN YOU" "BATCH PROCESS"
```

#### Batch Processing Options:

- `-r, --recursive` - Process subfolders recursively
- `-o, --output <folder>` - Output folder (default: ./processed)
- `--include <pattern>` - File patterns to include (e.g., .jpg,.png)
- `--exclude <pattern>` - File patterns to exclude
- `--dry-run` - Preview without processing
- `-v, --verbose` - Show detailed progress

**Default include patterns:** `*.jpg,*.jpeg,*.png,*.webp,*.tiff,*.gif,*.bmp,*.heic,*.heif`

### HEIC/HEIF Processing

Pixpress handles HEIC/HEIF smartly with built-in fallback:

1. Tries Sharp’s native HEIF decoder first (fastest)
2. If that fails, it automatically falls back the `heic-convert` library
3. No extra setup needed — `heic-convert` is bundled as an optional dependency

**Optional Performance Improvements:**

```bash
# For better native HEIF performance (macOS)
brew install libheif

# For better native HEIF performance (Ubuntu/Debian)
sudo apt install libheif-dev
```

## Global Options

All commands support these options:

- `-o, --output <path>` - Custom output file path
- `-q, --quality <1-100>` - JPEG/WebP quality (default: 80)

## Output Directory

Pixpress saves all processed images to a dedicated folder on your system:

- **Windows**: `Documents/Pixpress/`
- **macOS**: `Pictures/Pixpress/`
- **Linux**: `Pictures/Pixpress/`

Images are automatically organized by operation type:

- `resized/` - Resized images
- `converted/` - Format conversions
- `filtered/` - Images with filters applied
- `memes/` - Created memes
- `collages/` - Photo collages
- And more...

Each file is saved with a unique timestamp to prevent overwrites:
`yourimage_operation_20250128_143025_a3f.jpg`

## Requirements

- Node.js >= 14.0.0
- Supported on Windows, macOS, and Linux

<p align="center">
  <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/770cb534aa0eca629f1a242c48857ea21547cc5c_meme_meme_20250929_123057_e1a00c.jpg" alt="Meme generated with Pixpress">
</p>
