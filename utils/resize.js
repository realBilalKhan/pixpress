// utils/resize.js
import sharp from "sharp";
import chalk from "chalk";
import ora from "ora";
import { extname } from "path";
import { validateInput, generateOutputPath, handleError } from "./helpers.js";

export async function resizeCommand(input, options) {
  const spinner = ora("Processing image...").start();

  try {
    // validateInput returns the processed input path (may be converted from HEIC)
    const processedInputPath = await validateInput(input);

    const width = options.width ? parseInt(options.width) : null;
    const height = options.height ? parseInt(options.height) : null;

    // Require at least one dimension to prevent no-op
    if (!width && !height) {
      throw new Error("Please specify at least width or height");
    }

    const outputPath = options.output || await generateOutputPath(input, "resized", "_resized");

    const metadata = await sharp(processedInputPath).metadata();
    spinner.text = `Resizing ${metadata.width}x${metadata.height} → ${
      width || "auto"
    }x${height || "auto"}`;

    let pipeline = sharp(processedInputPath);

    const resizeOptions = {
      width,
      height,
      fit: options.fit,
      withoutEnlargement: false, // Allow upscaling when requested
    };

    pipeline = pipeline.resize(resizeOptions);

    // Apply JPEG quality setting if output is JPEG
    const format = extname(outputPath).toLowerCase();
    if (format === ".jpg" || format === ".jpeg") {
      pipeline = pipeline.jpeg({ quality: parseInt(options.quality) });
    }

    await pipeline.toFile(outputPath);

    // Show detailed before/after comparison
    const finalMetadata = await sharp(outputPath).metadata();

    spinner.succeed(
      chalk.green("✓ Image resized successfully!") +
        chalk.dim(
          `\n  Input: ${metadata.width}x${metadata.height} (${
            (await sharp(processedInputPath).stats()).size
          } bytes)`
        ) +
        chalk.dim(
          `\n  Output: ${finalMetadata.width}x${finalMetadata.height} (${
            (await sharp(outputPath).stats()).size
          } bytes)`
        ) +
        chalk.dim(`\n  Saved to: ${outputPath}`)
    );
  } catch (error) {
    handleError(spinner, error);
  }
}
