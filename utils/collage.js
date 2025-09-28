// utils/collage.js
import sharp from "sharp";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import {
  handleError,
  formatFileSize,
  getSupportedFormats,
  generateOutputPath,
  displayOutputLocation,
  initializePixpressDirectory,
} from "./helpers.js";

// Predefined collage layouts
const layouts = {
  grid: {
    name: "grid",
    description: "Equal-sized grid layout (2x2, 3x3, etc.)",
    requiresCount: true,
    minImages: 4,
    maxImages: 25,
  },
  strip: {
    name: "strip",
    description: "Horizontal or vertical strip of images",
    requiresCount: false,
    minImages: 2,
    maxImages: 10,
  },
  polaroid: {
    name: "polaroid",
    description: "Scattered polaroid-style photos with rotation",
    requiresCount: false,
    minImages: 2,
    maxImages: 12,
  },
  mosaic: {
    name: "mosaic",
    description: "Irregular mosaic layout with varying sizes",
    requiresCount: false,
    minImages: 3,
    maxImages: 20,
  },
  filmstrip: {
    name: "filmstrip",
    description: "Classic film strip layout with perforations",
    requiresCount: false,
    minImages: 3,
    maxImages: 8,
  },
  magazine: {
    name: "magazine",
    description: "Magazine-style layout with featured image",
    requiresCount: false,
    minImages: 3,
    maxImages: 8,
  },
};

export async function collageCommand(inputPattern, options) {
  await initializePixpressDirectory();

  const spinner = ora("Creating collage...").start();

  try {
    // Parse and validate inputs
    const imageFiles = await findImageFiles(inputPattern, options);
    const layout = layouts[options.layout?.toLowerCase()];

    if (!layout) {
      const availableLayouts = Object.keys(layouts).join(", ");
      throw new Error(
        `Unknown layout: ${options.layout}. Available: ${availableLayouts}`
      );
    }

    if (imageFiles.length < layout.minImages) {
      throw new Error(
        `Layout '${layout.name}' requires at least ${layout.minImages} images. Found ${imageFiles.length}.`
      );
    }

    if (imageFiles.length > layout.maxImages) {
      throw new Error(
        `Layout '${layout.name}' supports maximum ${layout.maxImages} images. Found ${imageFiles.length}.`
      );
    }

    spinner.text = `Creating ${layout.name} collage with ${imageFiles.length} images`;

    // Parse dimensions
    const width = parseInt(options.width || 1920);
    const height = parseInt(options.height || 1080);
    const spacing = parseInt(options.spacing || 10);
    const quality = parseInt(options.quality || 85);

    // Validate dimensions
    if (width < 200 || width > 8000 || height < 200 || height > 8000) {
      throw new Error(
        "Canvas dimensions must be between 200x200 and 8000x8000 pixels"
      );
    }

    // Generate output path
    const outputPath = await generateOutputPath(
      inputPattern,
      "collages",
      `_${layout.name}_collage`,
      `.${options.format || "jpg"}`,
      options.output
    );

    let collageSharp;

    switch (layout.name) {
      case "grid":
        collageSharp = await createGridLayout(
          imageFiles,
          width,
          height,
          spacing,
          options
        );
        break;
      case "strip":
        collageSharp = await createStripLayout(
          imageFiles,
          width,
          height,
          spacing,
          options
        );
        break;
      case "polaroid":
        collageSharp = await createPolaroidLayout(
          imageFiles,
          width,
          height,
          spacing,
          options
        );
        break;
      case "mosaic":
        collageSharp = await createMosaicLayout(
          imageFiles,
          width,
          height,
          spacing,
          options
        );
        break;
      case "filmstrip":
        collageSharp = await createFilmstripLayout(
          imageFiles,
          width,
          height,
          spacing,
          options
        );
        break;
      case "magazine":
        collageSharp = await createMagazineLayout(
          imageFiles,
          width,
          height,
          spacing,
          options
        );
        break;
      default:
        throw new Error(`Layout implementation not found: ${layout.name}`);
    }

    spinner.text = "Saving collage...";

    // Apply final format and quality settings directly to the Sharp instance
    const outputFormat = options.format?.toLowerCase() || "jpg";

    switch (outputFormat) {
      case "jpg":
      case "jpeg":
        collageSharp = collageSharp.jpeg({ quality, progressive: true });
        break;
      case "png":
        collageSharp = collageSharp.png({ compressionLevel: 6 });
        break;
      case "webp":
        collageSharp = collageSharp.webp({ quality, effort: 4 });
        break;
      default:
        throw new Error(`Unsupported output format: ${outputFormat}`);
    }

    await collageSharp.toFile(outputPath);

    const outputSize = (await fs.stat(outputPath)).size;
    const outputMeta = await sharp(outputPath).metadata();

    spinner.succeed(
      chalk.green("✓ Collage created successfully!") +
        chalk.dim(`\n  Layout: ${layout.name} (${layout.description})`) +
        chalk.dim(`\n  Images: ${imageFiles.length} combined`) +
        chalk.dim(
          `\n  Canvas: ${outputMeta.width}x${outputMeta.height} pixels`
        ) +
        chalk.dim(`\n  Format: ${outputFormat.toUpperCase()}`) +
        chalk.dim(`\n  Size: ${formatFileSize(outputSize)}`)
    );

    displayOutputLocation(outputPath);
  } catch (error) {
    handleError(spinner, error);
  }
}

// Find image files from input pattern (folder, glob, or file list)
async function findImageFiles(inputPattern, options) {
  const files = [];
  const supportedExtensions = getSupportedFormats().input.map(
    (ext) => `.${ext}`
  );

  // Check if input is a folder
  if (await fs.pathExists(inputPattern)) {
    const stats = await fs.stat(inputPattern);

    if (stats.isDirectory()) {
      // Scan directory for images
      const entries = await fs.readdir(inputPattern);

      for (const entry of entries) {
        const fullPath = path.join(inputPattern, entry);
        const entryStats = await fs.stat(fullPath);

        if (entryStats.isFile()) {
          // Skip hidden files and system files
          if (entry.startsWith(".")) {
            continue;
          }

          const ext = path.extname(entry).toLowerCase();
          if (supportedExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } else {
      files.push(inputPattern);
    }
  } else {
    const fileList = inputPattern.split(",").map((f) => f.trim());

    for (const file of fileList) {
      if (await fs.pathExists(file)) {
        files.push(file);
      } else {
        console.warn(chalk.yellow(`⚠ File not found: ${file}`));
      }
    }
  }

  if (files.length === 0) {
    throw new Error("No valid image files found");
  }

  // Limit number of files if specified
  const maxFiles = parseInt(options.maxFiles || files.length);
  const selectedFiles = files.slice(0, maxFiles);

  // Shuffle if requested
  if (options.shuffle) {
    for (let i = selectedFiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedFiles[i], selectedFiles[j]] = [
        selectedFiles[j],
        selectedFiles[i],
      ];
    }
  }

  return selectedFiles.sort((a, b) =>
    path.basename(a).localeCompare(path.basename(b))
  );
}

// Generate appropriate output filename
function generateCollageOutputPath(inputPattern, layoutName, format = "jpg") {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const basename = path.basename(inputPattern, path.extname(inputPattern));
  const filename = `${basename}_${layoutName}_collage_${timestamp}.${format}`;

  return path.join(process.cwd(), filename);
}

// Create grid layout
async function createGridLayout(
  imageFiles,
  canvasWidth,
  canvasHeight,
  spacing,
  options
) {
  const imageCount = imageFiles.length;
  const cols = parseInt(options.cols || Math.ceil(Math.sqrt(imageCount)));
  const rows = Math.ceil(imageCount / cols);

  // Calculate cell dimensions
  const totalHorizontalSpacing = spacing * (cols + 1);
  const totalVerticalSpacing = spacing * (rows + 1);

  const cellWidth = Math.floor((canvasWidth - totalHorizontalSpacing) / cols);
  const cellHeight = Math.floor((canvasHeight - totalVerticalSpacing) / rows);

  if (cellWidth < 50 || cellHeight < 50) {
    throw new Error(
      "Canvas too small for grid layout. Increase canvas size or reduce number of images."
    );
  }

  const backgroundColor = parseColor(options.background || "#FFFFFF");
  const compositeImages = [];

  // Process images in batches
  for (let i = 0; i < imageFiles.length; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    const left = spacing + col * (cellWidth + spacing);
    const top = spacing + row * (cellHeight + spacing);

    try {
      // Resize and position image
      const imageBuffer = await sharp(imageFiles[i])
        .resize(cellWidth, cellHeight, {
          fit: options.fit || "cover",
          position: "center",
        })
        .png() // Convert to PNG buffer to avoid format issues
        .toBuffer();

      compositeImages.push({
        input: imageBuffer,
        left: left,
        top: top,
      });
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠ Skipping corrupted image: ${imageFiles[i]}`)
      );
      continue;
    }
  }

  if (compositeImages.length === 0) {
    throw new Error("No valid images could be processed");
  }

  // Create base canvas and composite images
  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4, // Use 4 channels for RGBA
      background: { ...backgroundColor, alpha: 1 },
    },
  }).composite(compositeImages);
}

// Create horizontal or vertical strip layout
async function createStripLayout(
  imageFiles,
  canvasWidth,
  canvasHeight,
  spacing,
  options
) {
  const isVertical = options.direction === "vertical";
  const backgroundColor = parseColor(options.background || "#FFFFFF");

  const imageCount = imageFiles.length;
  let imageWidth, imageHeight;

  if (isVertical) {
    imageWidth = canvasWidth - 2 * spacing;
    imageHeight = Math.floor(
      (canvasHeight - spacing * (imageCount + 1)) / imageCount
    );
  } else {
    imageWidth = Math.floor(
      (canvasWidth - spacing * (imageCount + 1)) / imageCount
    );
    imageHeight = canvasHeight - 2 * spacing;
  }

  // Ensure minimum image size
  if (imageWidth < 50 || imageHeight < 50) {
    throw new Error(
      "Canvas too small for strip layout. Increase canvas size or reduce number of images."
    );
  }

  const compositeImages = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const left = isVertical ? spacing : spacing + i * (imageWidth + spacing);
    const top = isVertical ? spacing + i * (imageHeight + spacing) : spacing;

    try {
      const imageBuffer = await sharp(imageFiles[i])
        .resize(imageWidth, imageHeight, {
          fit: options.fit || "cover",
          position: "center",
        })
        .png()
        .toBuffer();

      compositeImages.push({
        input: imageBuffer,
        left: left,
        top: top,
      });
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠ Skipping corrupted image: ${imageFiles[i]}`)
      );
      continue;
    }
  }

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { ...backgroundColor, alpha: 1 },
    },
  }).composite(compositeImages);
}

// Create polaroid-style scattered layout
async function createPolaroidLayout(
  imageFiles,
  canvasWidth,
  canvasHeight,
  spacing,
  options
) {
  const backgroundColor = parseColor(options.background || "#F5F5F5");

  // Calculate polaroid size based on canvas and number of images
  const baseSize =
    Math.min(canvasWidth, canvasHeight) /
    Math.ceil(Math.sqrt(imageFiles.length));
  const polaroidSize = Math.max(150, Math.min(300, Math.floor(baseSize * 0.8)));

  const compositeImages = [];
  const usedPositions = []; // Track positions to avoid overlap

  for (let i = 0; i < imageFiles.length; i++) {
    let position = generateNonOverlappingPosition(
      canvasWidth,
      canvasHeight,
      polaroidSize,
      usedPositions,
      50 // margin
    );

    try {
      // Create polaroid effect
      const imageSize = Math.floor(polaroidSize * 0.75);
      const border = Math.floor((polaroidSize - imageSize) / 2);
      const bottomBorder = border * 2;

      const polaroidImage = await sharp(imageFiles[i])
        .resize(imageSize, imageSize, { fit: "cover", position: "center" })
        .extend({
          top: border,
          bottom: bottomBorder,
          left: border,
          right: border,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        // Add slight rotation for scattered effect
        .rotate(Math.random() * 30 - 15, {
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      compositeImages.push({
        input: polaroidImage,
        left: position.x,
        top: position.y,
      });

      usedPositions.push(position);
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠ Skipping corrupted image: ${imageFiles[i]}`)
      );
      continue;
    }
  }

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { ...backgroundColor, alpha: 1 },
    },
  }).composite(compositeImages);
}

// Helper function to generate non-overlapping positions
function generateNonOverlappingPosition(
  canvasWidth,
  canvasHeight,
  size,
  usedPositions,
  margin
) {
  const maxAttempts = 100;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const x = margin + Math.random() * (canvasWidth - size - 2 * margin);
    const y = margin + Math.random() * (canvasHeight - size - 2 * margin);

    const overlaps = usedPositions.some(
      (pos) =>
        Math.abs(x - pos.x) < size + 20 && Math.abs(y - pos.y) < size + 20
    );

    if (!overlaps) {
      return { x: Math.round(x), y: Math.round(y) };
    }

    attempts++;
  }

  // Fallback: use grid positioning if no non-overlapping position found
  const gridCols = Math.ceil(Math.sqrt(usedPositions.length + 1));
  const gridIndex = usedPositions.length;
  const gridX = (gridIndex % gridCols) * (size + 20) + margin;
  const gridY = Math.floor(gridIndex / gridCols) * (size + 20) + margin;

  return { x: gridX, y: gridY };
}

// Create mosaic layout with irregular sizes
async function createMosaicLayout(
  imageFiles,
  canvasWidth,
  canvasHeight,
  spacing,
  options
) {
  const backgroundColor = parseColor(options.background || "#FFFFFF");
  const compositeImages = [];

  const patterns = generateMosaicPattern(
    imageFiles.length,
    canvasWidth,
    canvasHeight
  );

  for (let i = 0; i < Math.min(imageFiles.length, patterns.length); i++) {
    const pattern = patterns[i];

    const width = Math.max(100, Math.floor(canvasWidth * pattern.width));
    const height = Math.max(100, Math.floor(canvasHeight * pattern.height));
    const left = Math.max(
      0,
      Math.min(canvasWidth - width, Math.floor(canvasWidth * pattern.x))
    );
    const top = Math.max(
      0,
      Math.min(canvasHeight - height, Math.floor(canvasHeight * pattern.y))
    );

    try {
      const imageBuffer = await sharp(imageFiles[i])
        .resize(width, height, { fit: "cover", position: "center" })
        .png()
        .toBuffer();

      compositeImages.push({
        input: imageBuffer,
        left: left,
        top: top,
      });
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠ Skipping corrupted image: ${imageFiles[i]}`)
      );
      continue;
    }
  }

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { ...backgroundColor, alpha: 1 },
    },
  }).composite(compositeImages);
}

// Generate dynamic mosaic patterns based on image count
function generateMosaicPattern(imageCount, canvasWidth, canvasHeight) {
  const patterns = [];
  const aspectRatio = canvasWidth / canvasHeight;

  // Generate patterns dynamically based on image count
  for (let i = 0; i < imageCount; i++) {
    const baseWidth = 0.2 + Math.random() * 0.3; // 20-50% width
    const baseHeight = 0.2 + Math.random() * 0.3; // 20-50% height

    const width = aspectRatio > 1 ? baseWidth : baseWidth * aspectRatio;
    const height = aspectRatio < 1 ? baseHeight : baseHeight / aspectRatio;

    const x = Math.random() * (1 - width);
    const y = Math.random() * (1 - height);

    patterns.push({ width, height, x, y });
  }

  return patterns;
}

// Create filmstrip layout
async function createFilmstripLayout(
  imageFiles,
  canvasWidth,
  canvasHeight,
  spacing,
  options
) {
  const backgroundColor = parseColor(options.background || "#1a1a1a");
  const perforationColor = { r: 255, g: 255, b: 255, alpha: 1 };

  // Filmstrip dimensions with proper proportions
  const stripHeight = Math.floor(canvasHeight * 0.6);
  const perfHeight = Math.floor(stripHeight * 0.15);
  const frameAreaHeight = stripHeight - 2 * perfHeight;

  const totalFrameWidth = canvasWidth - 2 * spacing;
  const frameSpacing = Math.floor(totalFrameWidth * 0.02);
  const totalSpacing = frameSpacing * (imageFiles.length - 1);
  const frameWidth = Math.floor(
    (totalFrameWidth - totalSpacing) / imageFiles.length
  );
  const frameHeight = Math.floor(frameAreaHeight * 0.85);

  const stripTop = Math.floor((canvasHeight - stripHeight) / 2);
  const frameTop =
    stripTop + perfHeight + Math.floor((frameAreaHeight - frameHeight) / 2);

  const compositeImages = [];

  // Create filmstrip background
  const filmstripBg = await sharp({
    create: {
      width: canvasWidth,
      height: stripHeight,
      channels: 4,
      background: backgroundColor,
    },
  })
    .png()
    .toBuffer();

  compositeImages.push({
    input: filmstripBg,
    left: 0,
    top: stripTop,
  });

  // Add perforations
  const perfWidth = 15;
  const perfSpacing = 30;

  for (let x = perfSpacing; x < canvasWidth - perfWidth; x += perfSpacing) {
    // Top perforations
    const perforation = await sharp({
      create: {
        width: perfWidth,
        height: perfHeight,
        channels: 4,
        background: perforationColor,
      },
    })
      .png()
      .toBuffer();

    compositeImages.push({
      input: perforation,
      left: x,
      top: stripTop,
    });

    // Bottom perforations
    compositeImages.push({
      input: perforation,
      left: x,
      top: stripTop + stripHeight - perfHeight,
    });
  }

  // Add images
  for (let i = 0; i < imageFiles.length; i++) {
    const left = spacing + i * (frameWidth + frameSpacing);

    try {
      const imageBuffer = await sharp(imageFiles[i])
        .resize(frameWidth, frameHeight, { fit: "cover", position: "center" })
        .png()
        .toBuffer();

      compositeImages.push({
        input: imageBuffer,
        left: left,
        top: frameTop,
      });
    } catch (error) {
      console.warn(
        chalk.yellow(`⚠ Skipping corrupted image: ${imageFiles[i]}`)
      );
      continue;
    }
  }

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: parseColor("#404040"),
    },
  }).composite(compositeImages);
}

// Create magazine-style layout
async function createMagazineLayout(
  imageFiles,
  canvasWidth,
  canvasHeight,
  spacing,
  options
) {
  const backgroundColor = parseColor(options.background || "#FFFFFF");
  const compositeImages = [];

  // Main featured image
  const mainWidth = Math.floor(canvasWidth * 0.55);
  const mainHeight = Math.floor(canvasHeight * 0.8);

  try {
    const mainImage = await sharp(imageFiles[0])
      .resize(mainWidth, mainHeight, { fit: "cover", position: "center" })
      .png()
      .toBuffer();

    compositeImages.push({
      input: mainImage,
      left: spacing,
      top: Math.floor((canvasHeight - mainHeight) / 2),
    });
  } catch (error) {
    console.warn(
      chalk.yellow(`⚠ Skipping corrupted main image: ${imageFiles[0]}`)
    );
  }

  // Secondary images
  if (imageFiles.length > 1) {
    const secondaryAreaWidth = canvasWidth - mainWidth - 3 * spacing;
    const secondaryImages = imageFiles.slice(1);

    // Arrange secondary images in a grid
    const cols = Math.min(2, secondaryImages.length);
    const rows = Math.ceil(secondaryImages.length / cols);

    const secondaryWidth = Math.floor(
      (secondaryAreaWidth - spacing * (cols - 1)) / cols
    );
    const secondaryHeight = Math.floor(
      (mainHeight - spacing * (rows - 1)) / rows
    );

    for (let i = 0; i < secondaryImages.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const left = mainWidth + 2 * spacing + col * (secondaryWidth + spacing);
      const top =
        Math.floor((canvasHeight - mainHeight) / 2) +
        row * (secondaryHeight + spacing);

      try {
        const imageBuffer = await sharp(secondaryImages[i])
          .resize(secondaryWidth, secondaryHeight, {
            fit: "cover",
            position: "center",
          })
          .png()
          .toBuffer();

        compositeImages.push({
          input: imageBuffer,
          left: left,
          top: top,
        });
      } catch (error) {
        console.warn(
          chalk.yellow(`⚠ Skipping corrupted image: ${secondaryImages[i]}`)
        );
        continue;
      }
    }
  }

  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { ...backgroundColor, alpha: 1 },
    },
  }).composite(compositeImages);
}

// Parse color string
function parseColor(colorStr) {
  const color = colorStr.toLowerCase().trim();

  // Named colors
  const namedColors = {
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
    gray: { r: 128, g: 128, b: 128 },
    grey: { r: 128, g: 128, b: 128 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 255, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    yellow: { r: 255, g: 255, b: 0 },
    magenta: { r: 255, g: 0, b: 255 },
    cyan: { r: 0, g: 255, b: 255 },
  };

  if (namedColors[color]) {
    return namedColors[color];
  }

  // Hex colors
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      // Short hex format
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
      };
    } else if (hex.length === 6) {
      // Full hex format
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
      };
    }
  }

  // RGB format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: Math.min(255, Math.max(0, parseInt(rgbMatch[1]))),
      g: Math.min(255, Math.max(0, parseInt(rgbMatch[2]))),
      b: Math.min(255, Math.max(0, parseInt(rgbMatch[3]))),
    };
  }

  // Default to white if parsing fails
  return { r: 255, g: 255, b: 255 };
}

// List available layouts for CLI help
export function listLayouts() {
  console.log(chalk.cyan.bold("\n🖼️  Available Collage Layouts\n"));

  Object.entries(layouts).forEach(([key, layout]) => {
    console.log(
      chalk.white.bold(`${layout.name}:`) +
        chalk.dim(` ${layout.description}`) +
        chalk.dim(`\n  Images: ${layout.minImages}-${layout.maxImages}`)
    );
    console.log("");
  });

  console.log(chalk.yellow("💡 Usage examples:"));
  console.log(
    chalk.dim(
      "  pixpress collage ./photos --layout grid --width 1920 --height 1080"
    )
  );
  console.log(
    chalk.dim("  pixpress collage img1.jpg,img2.jpg,img3.jpg --layout polaroid")
  );
  console.log(
    chalk.dim("  pixpress collage ./vacation --layout filmstrip --shuffle")
  );
  console.log("");
}

// Get available layouts
export function getAvailableLayouts() {
  return layouts;
}
