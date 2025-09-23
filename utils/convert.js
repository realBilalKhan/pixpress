// utils/convert.js
import sharp from "sharp";
import chalk from "chalk";
import ora from "ora";
import { validateInput, generateOutputPath, handleError } from "./helpers.js";
import fs from "fs-extra";

export async function convertCommand(input, options) {
  const spinner = ora("Converting image...").start();

  try {
    await validateInput(input);

    const format = options.format.toLowerCase();
    // List of image formats we can convert to
    const supportedFormats = [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "tiff",
      "gif",
      "bmp",
      "avif",
    ];

    if (!supportedFormats.includes(format)) {
      throw new Error(
        `Unsupported format: ${format}. Supported: ${supportedFormats.join(
          ", "
        )}`
      );
    }

    const outputPath =
      options.output || generateOutputPath(input, "", `.${format}`);

    // Get original image info to show progress
    const metadata = await sharp(input).metadata();
    spinner.text = `Converting ${metadata.format} → ${format.toUpperCase()}`;

    let pipeline = sharp(input);

    // Apply format-specific optimizations
    switch (format) {
      case "jpg":
      case "jpeg":
        pipeline = pipeline.jpeg({
          quality: parseInt(options.quality),
          progressive: true, // Loads gradually for better UX
        });
        break;
      case "png":
        pipeline = pipeline.png({
          progressive: true,
          compressionLevel: 6, // Balanced compression
        });
        break;
      case "webp":
        pipeline = pipeline.webp({
          quality: parseInt(options.quality),
          effort: 4, // Moderate compression effort
        });
        break;
      case "tiff":
        pipeline = pipeline.tiff({
          quality: parseInt(options.quality),
        });
        break;
      case "gif":
        pipeline = pipeline.gif();
        break;
      case "bmp":
        pipeline = pipeline.bmp();
        break;
      case "avif":
        pipeline = pipeline.avif({
          quality: parseInt(options.quality),
        });
        break;
    }

    await pipeline.toFile(outputPath);

    // Calculate file size difference to show savings
    const inputSize = (await fs.stat(input)).size;
    const outputSize = (await fs.stat(outputPath)).size;
    const savings = (((inputSize - outputSize) / inputSize) * 100).toFixed(1);

    spinner.succeed(
      chalk.green("✓ Image converted successfully!") +
        chalk.dim(
          `\n  Format: ${metadata.format.toUpperCase()} → ${format.toUpperCase()}`
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
