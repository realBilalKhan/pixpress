import pkg from "fs-extra";
const { access, constants, stat } = pkg;
import { extname, parse, join } from "path";
import chalk from "chalk";

// Check if file exists and is actually an image
export async function validateInput(filePath) {
  try {
    await access(filePath, constants.F_OK);
    const stats = await stat(filePath);

    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${filePath}`);
    }

    const ext = extname(filePath).toLowerCase();
    // Common image file extensions
    const imageExts = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".tiff",
      ".tif",
      ".gif",
      ".bmp",
      ".avif",
    ];

    // Warn if the file extension is not a common image type
    if (!imageExts.includes(ext)) {
      console.log(
        chalk.yellow(`⚠ Warning: ${filePath} may not be an image file`)
      );
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`File not found: ${filePath}`);
    } else if (error.code === "EACCES") {
      throw new Error(`Permission denied: ${filePath}`);
    }
    throw error;
  }
}

// Create output filename by modifying the input path
export function generateOutputPath(
  inputPath,
  suffix = "",
  newExtension = null
) {
  const parsed = parse(inputPath);
  const extension = newExtension || parsed.ext;

  return join(parsed.dir, `${parsed.name}${suffix}${extension}`);
}

// Show user-friendly error messages and exit
export function handleError(spinner, error) {
  spinner.fail(chalk.red("✗ Operation failed"));

  if (error.message.includes("Input file contains unsupported image format")) {
    console.error(
      chalk.red(
        "Error: Unsupported image format. Please use JPG, PNG, WebP, TIFF, GIF, or BMP."
      )
    );
  } else if (error.message.includes("ENOENT")) {
    console.error(
      chalk.red("Error: File not found. Please check the file path.")
    );
  } else if (error.message.includes("EACCES")) {
    console.error(
      chalk.red("Error: Permission denied. Please check file permissions.")
    );
  } else {
    console.error(chalk.red(`Error: ${error.message}`));
  }

  // Show full stack trace only when debugging
  if (process.env.DEBUG) {
    console.error(chalk.dim("\nDebug info:"));
    console.error(chalk.dim(error.stack));
  }

  process.exit(1);
}

// Format bytes as human-readable string
export function formatFileSize(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

// Centralized list of supported formats for consistency
export function getSupportedFormats() {
  return {
    input: ["jpg", "jpeg", "png", "webp", "tiff", "tif", "gif", "bmp", "avif"],
    output: ["jpg", "jpeg", "png", "webp", "tiff", "gif", "bmp", "avif"],
  };
}
