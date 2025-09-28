// utils/helpers.js
import pkg from "fs-extra";
const { access, constants, stat, ensureDir } = pkg;
import { extname, parse, join } from "path";
import chalk from "chalk";
import os from "os";
import crypto from "crypto";

// Get the Pixpress output directory for the current platform
export function getPixpressDirectory() {
  const platform = os.platform();
  const homeDir = os.homedir();

  let pixpressDir;

  // Use platform-appropriate directory
  if (platform === "win32") {
    // Windows: Use Documents folder
    pixpressDir = join(homeDir, "Documents", "Pixpress");
  } else if (platform === "darwin") {
    // macOS: Use Pictures folder
    pixpressDir = join(homeDir, "Pictures", "Pixpress");
  } else {
    // Linux and others: Use Pictures folder or home if Pictures doesn't exist
    pixpressDir = join(homeDir, "Pictures", "Pixpress");
  }

  return pixpressDir;
}

// Create a subdirectory for specific operation types
export async function getOperationDirectory(operation) {
  const pixpressDir = getPixpressDirectory();
  const operationDir = join(pixpressDir, operation);

  // Ensure the directory exists
  await ensureDir(operationDir);

  return operationDir;
}

// Generate a unique filename with timestamp and random suffix
export function generateUniqueFilename(
  originalName,
  suffix = "",
  newExtension = null
) {
  const parsed = parse(originalName);
  const extension = newExtension || parsed.ext;

  // Create timestamp in format: YYYYMMDD_HHMMSS
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    "_" +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");

  // Add a short random string to ensure uniqueness even for batch operations
  const randomStr = crypto.randomBytes(3).toString("hex");

  // Construct the filename: originalname_suffix_timestamp_random.ext
  const safeName = parsed.name.replace(/[^a-zA-Z0-9-_]/g, "_"); // Make filename safe
  const uniqueName = `${safeName}${suffix}_${timestamp}_${randomStr}${extension}`;

  return uniqueName;
}

// Create output path with proper directory structure
export async function generateOutputPath(
  inputPath,
  operation = "processed",
  suffix = "",
  newExtension = null,
  customOutputPath = null
) {
  // If user provided a custom output path, use it
  if (customOutputPath) {
    // If it's just a filename, put it in the operation directory
    if (!customOutputPath.includes("/") && !customOutputPath.includes("\\")) {
      const operationDir = await getOperationDirectory(operation);
      return join(operationDir, customOutputPath);
    }
    // Otherwise use the full custom path
    return customOutputPath;
  }

  // Generate unique filename
  const uniqueFilename = generateUniqueFilename(
    inputPath,
    suffix,
    newExtension
  );

  // Get operation-specific directory
  const operationDir = await getOperationDirectory(operation);

  // Return full path
  return join(operationDir, uniqueFilename);
}

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
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);

  return `${size} ${sizes[i]}`;
}

// Centralized list of supported formats for consistency
export function getSupportedFormats() {
  return {
    input: ["jpg", "jpeg", "png", "webp", "tiff", "tif", "gif", "bmp", "avif"],
    output: ["jpg", "jpeg", "png", "webp", "tiff", "gif", "bmp", "avif"],
  };
}

// Display the output location to user
export function displayOutputLocation(outputPath) {
  const pixpressDir = getPixpressDirectory();
  const relativePath = outputPath.replace(pixpressDir, "Pixpress");

  console.log(chalk.green(`✓ Image saved to: ${relativePath}`));
  console.log(chalk.dim(`  Full path: ${outputPath}`));
}

// Initialize Pixpress directory structure on first run
export async function initializePixpressDirectory() {
  const pixpressDir = getPixpressDirectory();

  try {
    await ensureDir(pixpressDir);

    // Create subdirectories for each operation
    const operations = [
      "resized",
      "converted",
      "rotated",
      "filtered",
      "memes",
      "collages",
      "watermarked",
      "presets",
      "batch",
    ];

    for (const op of operations) {
      await ensureDir(join(pixpressDir, op));
    }

    // Check if this is first run
    const configPath = join(pixpressDir, ".pixpress_config");
    try {
      await access(configPath, constants.F_OK);
    } catch {
      // First run, create config file
      await pkg.writeJson(configPath, {
        version: "1.0.0",
        createdAt: new Date().toISOString(),
        platform: os.platform(),
      });

      console.log(chalk.cyan.bold("\n🎉 Welcome to Pixpress!"));
      console.log(chalk.white(`Your processed images will be saved in:`));
      console.log(chalk.green(`  ${pixpressDir}\n`));
    }
  } catch (error) {
    console.error(
      chalk.red(`Failed to initialize Pixpress directory: ${error.message}`)
    );
  }
}
