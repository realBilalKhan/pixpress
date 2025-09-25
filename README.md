<h1 align="center">Pixpress</h1>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D14.0.0-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js Version">
  <img src="https://img.shields.io/npm/v/chess-arena?style=flat&logo=npm&logoColor=white&color=cb3837" alt="npm Version">
</p>

## Features

- **Info** - Analyze image properties, metadata, and color distribution
- **Resize** - Scale images to any dimensions
- **Convert** - Change image formats (JPG, PNG, WebP, TIFF, GIF, BMP, AVIF)
- **Rotate** - Rotate and flip images with precise control
- **Filters** - Apply color filters and artistic effects
- **Preset** - Quick presets for common use cases
- **Watermark** - Add watermarks with customizable positioning
- **Batch Processing** - Process entire folders of images at once

## Quick Start

```bash
# Installation
npm install -g pixpress

# Interactive Mode (Recommended for Beginners)
pixpress
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
```

Supported formats: `jpg`, `png`, `webp`, `tiff`, `gif`, `bmp`, `avif`

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

### Batch Processing

Process entire folders of images with a single command. All operations support batch processing.

```bash
# Resize all images in a folder
pixpress batch resize ./photos --width 800 --height 600

# Convert all images to WebP
pixpress batch convert ./images --format webp --quality 80

# Apply color filter to all images
pixpress batch filters ./photos --filter vintage

# Apply preset to all images
pixpress batch preset ./gallery --preset thumbnail

# Add watermark to all images
pixpress batch watermark ./photos --watermark logo.png

# Analyze all images in a folder with detailed color analysis
pixpress batch info ./images --verbose
```

#### Advanced Batch Options

```bash
# Process folders recursively
pixpress batch resize ./photos --recursive --width 1200

# Custom output folder
pixpress batch convert ./images --format jpg --output ./converted

# Include only specific file types
pixpress batch convert ./mixed --format webp --include "*.png,*.tiff"

# Exclude certain patterns
pixress batch resize ./photos --width 800 --exclude "*_thumb.*,*_small.*"

# Preview what will be processed (dry run)
pixpress batch convert ./images --format webp --dry-run

# Show detailed progress for each file
pixpress batch preset ./gallery --preset social --verbose
```

#### Batch Processing Options:

- `-r, --recursive` - Process subfolders recursively
- `-o, --output <folder>` - Output folder (default: ./processed)
- `--include <pattern>` - File patterns to include (e.g., .jpg,.png)
- `--exclude <pattern>` - File patterns to exclude
- `--dry-run` - Preview without processing
- `-v, --verbose` - Show detailed progress

## Global Options

All commands support these options:

- `-o, --output <path>` - Custom output file path
- `-q, --quality <1-100>` - JPEG/WebP quality (default: 80)

## Requirements

- Node.js >= 14.0.0
- Supported on Windows, macOS, and Linux
