// utils/rotate.js
import sharp from "sharp";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import { validateInput, generateOutputPath, handleError } from "./helpers.js";

export async function rotateCommand(input, options) {
  const spinner = ora("Rotating/flipping image...").start();

  try {
    await validateInput(input);

    const angle = options.angle ? parseInt(options.angle) : 0;
    const flipHorizontal = options.flipH || options.horizontal;
    const flipVertical = options.flipV || options.vertical;

    // Validate rotation angle
    if (angle && (angle < -360 || angle > 360)) {
      throw new Error("Rotation angle must be between -360 and 360 degrees");
    }

    // Check if any transformation is specified
    if (!angle && !flipHorizontal && !flipVertical) {
      throw new Error(
        "Please specify at least one transformation: --angle, --flip-h, or --flip-v"
      );
    }

    // Generate appropriate suffix for output filename
    let suffix = "";
    if (angle) suffix += `_rot${angle}`;
    if (flipHorizontal) suffix += "_flipH";
    if (flipVertical) suffix += "_flipV";

    const outputPath = options.output || generateOutputPath(input, suffix);

    const metadata = await sharp(input).metadata();

    // Build operation description
    const operations = [];
    if (angle) operations.push(`rotate ${angle}°`);
    if (flipHorizontal) operations.push("flip horizontally");
    if (flipVertical) operations.push("flip vertically");

    spinner.text = `Applying transformations: ${operations.join(", ")}`;

    let pipeline = sharp(input);

    // Apply transformations in order: flip first, then rotate
    if (flipHorizontal) {
      pipeline = pipeline.flop();
    }

    if (flipVertical) {
      pipeline = pipeline.flip();
    }

    if (angle && angle !== 0) {
      // Use a background color for areas exposed by rotation
      pipeline = pipeline.rotate(angle, {
        background: options.background || { r: 255, g: 255, b: 255, alpha: 0 },
      });
    }

    // Preserve original format and quality
    const outputExt = outputPath.split(".").pop().toLowerCase();

    switch (outputExt) {
      case "jpg":
      case "jpeg":
        pipeline = pipeline.jpeg({
          quality: parseInt(options.quality || 85),
          progressive: true,
        });
        break;
      case "png":
        pipeline = pipeline.png({
          progressive: true,
          compressionLevel: 6,
        });
        break;
      case "webp":
        pipeline = pipeline.webp({
          quality: parseInt(options.quality || 85),
          effort: 4,
        });
        break;
    }

    await pipeline.toFile(outputPath);

    // Get final metadata and file sizes
    const finalMetadata = await sharp(outputPath).metadata();
    const inputSize = (await fs.stat(input)).size;
    const outputSize = (await fs.stat(outputPath)).size;

    spinner.succeed(
      chalk.green("✓ Image transformation completed successfully!") +
        chalk.dim(`\n  Transformations: ${operations.join(", ")}`) +
        chalk.dim(
          `\n  Input: ${metadata.width}x${
            metadata.height
          } ${metadata.format?.toUpperCase()}`
        ) +
        chalk.dim(
          `\n  Output: ${finalMetadata.width}x${finalMetadata.height}`
        ) +
        chalk.dim(`\n  Size: ${inputSize} bytes → ${outputSize} bytes`) +
        chalk.dim(`\n  Saved to: ${outputPath}`)
    );
  } catch (error) {
    handleError(spinner, error);
  }
}

// Get available rotation presets for interactive mode
export function getRotationPresets() {
  return {
    common: [
      { name: "90", description: "Rotate 90° clockwise" },
      { name: "180", description: "Rotate 180° (upside down)" },
      {
        name: "270",
        description: "Rotate 270° clockwise (90° counter-clockwise)",
      },
      { name: "-90", description: "Rotate 90° counter-clockwise" },
    ],
    flip: [
      { name: "flip-h", description: "Flip horizontally (mirror)" },
      { name: "flip-v", description: "Flip vertically" },
      {
        name: "flip-both",
        description: "Flip both horizontally and vertically",
      },
    ],
    custom: [{ name: "custom", description: "Custom angle (-360° to 360°)" }],
  };
}
