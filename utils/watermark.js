import sharp from "sharp";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import { validateInput, generateOutputPath, handleError } from "./helpers.js";

export async function watermarkCommand(input, options) {
  const spinner = ora("Adding watermark...").start();

  try {
    // Validate both the main image and the watermark image
    await validateInput(input);
    await validateInput(options.watermark);

    const position = options.position.toLowerCase();
    const validPositions = [
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
      "center",
    ];

    if (!validPositions.includes(position)) {
      throw new Error(
        `Invalid position: ${position}. Valid positions: ${validPositions.join(
          ", "
        )}`
      );
    }

    const size = parseInt(options.size);
    const opacity = parseFloat(options.opacity);

    // Validate size and opacity ranges to prevent weird results
    if (size < 10 || size > 50) {
      throw new Error("Watermark size must be between 10-50%");
    }

    if (opacity < 0.1 || opacity > 1.0) {
      throw new Error("Opacity must be between 0.1-1.0");
    }

    const outputPath =
      options.output || generateOutputPath(input, "_watermarked");

    const baseMetadata = await sharp(input).metadata();
    const watermarkMetadata = await sharp(options.watermark).metadata();

    spinner.text = `Adding watermark (${position}, ${size}%, ${Math.round(
      opacity * 100
    )}% opacity)`;

    // Calculate watermark dimensions while preserving aspect ratio
    const watermarkWidth = Math.round(baseMetadata.width * (size / 100));
    const watermarkHeight = Math.round(
      watermarkWidth * (watermarkMetadata.height / watermarkMetadata.width)
    );

    // Resize watermark and convert to PNG for transparency support
    let watermarkBuffer = await sharp(options.watermark)
      .resize(watermarkWidth, watermarkHeight)
      .png()
      .toBuffer();

    // Apply opacity by blending with transparent layer
    if (opacity < 1.0) {
      watermarkBuffer = await sharp(watermarkBuffer)
        .composite([
          {
            input: Buffer.from([255, 255, 255, Math.round(255 * opacity)]),
            raw: { width: 1, height: 1, channels: 4 },
            tile: true,
            blend: "dest-in", // Multiply alpha channel
          },
        ])
        .png()
        .toBuffer();
    }

    // Calculate positioning with margin for better appearance
    let left, top;
    const margin = 20;

    switch (position) {
      case "top-left":
        left = margin;
        top = margin;
        break;
      case "top-right":
        left = baseMetadata.width - watermarkWidth - margin;
        top = margin;
        break;
      case "bottom-left":
        left = margin;
        top = baseMetadata.height - watermarkHeight - margin;
        break;
      case "bottom-right":
        left = baseMetadata.width - watermarkWidth - margin;
        top = baseMetadata.height - watermarkHeight - margin;
        break;
      case "center":
        left = Math.round((baseMetadata.width - watermarkWidth) / 2);
        top = Math.round((baseMetadata.height - watermarkHeight) / 2);
        break;
    }

    // Composite watermark onto the base image
    await sharp(input)
      .composite([
        {
          input: watermarkBuffer,
          left: left,
          top: top,
        },
      ])
      .toFile(outputPath);

    // Show detailed results to user
    const inputSize = (await fs.stat(input)).size;
    const outputSize = (await fs.stat(outputPath)).size;

    spinner.succeed(
      chalk.green(`✓ Watermark added successfully!`) +
        chalk.dim(`\n  Position: ${position}`) +
        chalk.dim(
          `\n  Watermark size: ${watermarkWidth}x${watermarkHeight} (${size}%)`
        ) +
        chalk.dim(`\n  Opacity: ${Math.round(opacity * 100)}%`) +
        chalk.dim(`\n  File size: ${inputSize} bytes → ${outputSize} bytes`) +
        chalk.dim(`\n  Saved to: ${outputPath}`)
    );
  } catch (error) {
    handleError(spinner, error);
  }
}
