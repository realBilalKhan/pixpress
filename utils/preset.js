// utils/preset.js
import sharp from "sharp";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import path from "path";
import {
  validateInput,
  generateOutputPath,
  handleError,
  displayOutputLocation,
  initializePixpressDirectory,
} from "./helpers.js";

// Predefined image configurations for common use cases
const presets = {
  thumbnail: {
    width: 150,
    height: 150,
    fit: "cover",
    quality: 85,
    description: "150x150 thumbnail",
    defaultFormat: "jpg",
  },
  avatar: {
    width: 128,
    height: 128,
    fit: "cover",
    quality: 90,
    description: "128x128 avatar",
    defaultFormat: "png", // PNG for potential transparency
  },
  banner: {
    width: 1200,
    height: 400,
    fit: "cover",
    quality: 85,
    description: "1200x400 banner",
    defaultFormat: "jpg",
  },
  social: {
    width: 1080,
    height: 1080,
    fit: "cover",
    quality: 85,
    description: "1080x1080 social media post",
    defaultFormat: "jpg",
  },
  compress: {
    quality: 60,
    progressive: true,
    description: "High compression for web",
    defaultFormat: "jpg",
  },
};

export async function presetCommand(input, options) {
  await initializePixpressDirectory();

  const spinner = ora("Applying preset...").start();

  try {
    const processedInputPath = await validateInput(input);

    const presetName = options.preset.toLowerCase();
    const preset = presets[presetName];

    if (!preset) {
      const availablePresets = Object.keys(presets).join(", ");
      throw new Error(
        `Unknown preset: ${presetName}. Available: ${availablePresets}`
      );
    }

    // Check if input is HEIC/HEIF and handle appropriately
    const inputExt = path.extname(input).toLowerCase();
    const isHeicInput = inputExt === ".heic" || inputExt === ".heif";

    // For HEIC inputs, use preset's default format instead of preserving original
    const outputExtension = isHeicInput ? `.${preset.defaultFormat}` : null; // null preserves original format

    const outputPath = await generateOutputPath(
      input,
      "presets",
      `_${presetName}`,
      outputExtension,
      options.output
    );

    const metadata = await sharp(processedInputPath).metadata();

    if (isHeicInput) {
      spinner.text = `Converting HEIC/HEIF and applying ${presetName} preset (${preset.description})`;
    } else {
      spinner.text = `Applying ${presetName} preset (${preset.description})`;
    }

    let pipeline = sharp(processedInputPath);

    // Apply resize if the preset specifies dimensions
    if (preset.width || preset.height) {
      pipeline = pipeline.resize({
        width: preset.width,
        height: preset.height,
        fit: preset.fit || "cover",
        withoutEnlargement: false,
      });
    }

    // Determine output format from file extension
    const outputFormat = outputPath.split(".").pop().toLowerCase();

    // Apply format-specific optimizations
    switch (outputFormat) {
      case "jpg":
      case "jpeg":
        pipeline = pipeline.jpeg({
          quality: preset.quality || 80,
          progressive: preset.progressive || false,
        });
        break;
      case "png":
        pipeline = pipeline.png({
          progressive: preset.progressive || false,
          compressionLevel: 6,
        });
        break;
      case "webp":
        pipeline = pipeline.webp({
          quality: preset.quality || 80,
          effort: 4,
        });
        break;
    }

    // Special handling for compression preset
    if (presetName === "compress") {
      if (outputFormat === "png") {
        pipeline = pipeline.png({ compressionLevel: 9 });
      } else {
        pipeline = pipeline.jpeg({
          quality: preset.quality,
          progressive: preset.progressive,
          mozjpeg: true,
        });
      }
    }

    await pipeline.toFile(outputPath);

    // Show before/after stats to user
    const finalMetadata = await sharp(outputPath).metadata();
    const inputSize = (await fs.stat(processedInputPath)).size;
    const outputSize = (await fs.stat(outputPath)).size;
    const savings = (((inputSize - outputSize) / inputSize) * 100).toFixed(1);

    const inputFormatText = isHeicInput
      ? "HEIC/HEIF"
      : metadata.format?.toUpperCase() || "Unknown";

    spinner.succeed(
      chalk.green(`✓ Preset applied successfully!`) +
        chalk.dim(`\n  Preset: ${presetName} (${preset.description})`) +
        chalk.dim(
          `\n  Dimensions: ${metadata.width}x${metadata.height} → ${finalMetadata.width}x${finalMetadata.height}`
        ) +
        chalk.dim(
          `\n  Format: ${inputFormatText} → ${outputFormat.toUpperCase()}`
        ) +
        chalk.dim(
          `\n  Size: ${inputSize} bytes → ${outputSize} bytes (${
            savings > 0 ? "-" + savings : "+" + Math.abs(savings)
          }%)`
        )
    );

    displayOutputLocation(outputPath);
  } catch (error) {
    handleError(spinner, error);
  }
}
