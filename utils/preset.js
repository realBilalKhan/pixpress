// utils/preset.js
import sharp from "sharp";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import { validateInput, generateOutputPath, handleError } from "./helpers.js";

// Predefined image configurations for common use cases
const presets = {
  thumbnail: {
    width: 150,
    height: 150,
    fit: "cover",
    quality: 85,
    description: "150x150 thumbnail",
  },
  avatar: {
    width: 128,
    height: 128,
    fit: "cover",
    quality: 90,
    description: "128x128 avatar",
  },
  banner: {
    width: 1200,
    height: 400,
    fit: "cover",
    quality: 85,
    description: "1200x400 banner",
  },
  social: {
    width: 1080,
    height: 1080,
    fit: "cover",
    quality: 85,
    description: "1080x1080 social media post",
  },
  compress: {
    quality: 60,
    progressive: true,
    description: "High compression for web",
  },
};

export async function presetCommand(input, options) {
  const spinner = ora("Applying preset...").start();

  try {
    await validateInput(input);

    const presetName = options.preset.toLowerCase();
    const preset = presets[presetName];

    if (!preset) {
      const availablePresets = Object.keys(presets).join(", ");
      throw new Error(
        `Unknown preset: ${presetName}. Available: ${availablePresets}`
      );
    }

    const outputPath =
      options.output || generateOutputPath(input, `_${presetName}`);

    const metadata = await sharp(input).metadata();
    spinner.text = `Applying ${presetName} preset (${preset.description})`;

    let pipeline = sharp(input);

    // Apply resize if the preset specifies dimensions
    if (preset.width || preset.height) {
      pipeline = pipeline.resize({
        width: preset.width,
        height: preset.height,
        fit: preset.fit || "cover",
        withoutEnlargement: false, // Allow upscaling for consistent sizing
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
          mozjpeg: true, // Use mozjpeg encoder for better compression
        });
      }
    }

    await pipeline.toFile(outputPath);

    // Show before/after stats to user
    const finalMetadata = await sharp(outputPath).metadata();
    const inputSize = (await fs.stat(input)).size;
    const outputSize = (await fs.stat(outputPath)).size;
    const savings = (((inputSize - outputSize) / inputSize) * 100).toFixed(1);

    spinner.succeed(
      chalk.green(`✓ Preset applied successfully!`) +
        chalk.dim(`\n  Preset: ${presetName} (${preset.description})`) +
        chalk.dim(
          `\n  Dimensions: ${metadata.width}x${metadata.height} → ${finalMetadata.width}x${finalMetadata.height}`
        ) +
        chalk.dim(
          `\n  Size: ${inputSize} bytes → ${outputSize} bytes (${
            savings > 0 ? "-" + savings : "+" + Math.abs(savings)
          }%)`
        ) +
        chalk.dim(`\n  Saved to: ${outputPath}`)
    );
  } catch (error) {
    handleError(spinner, error);
  }
}
