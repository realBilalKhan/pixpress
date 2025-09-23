// utils/interactive.js
import inquirer from "inquirer";
import chalk from "chalk";
import pkg from "fs-extra";
const { access, constants } = pkg;
import { resizeCommand } from "./resize.js";
import { convertCommand } from "./convert.js";
import { presetCommand } from "./preset.js";
import { watermarkCommand } from "./watermark.js";

// Helper function to validate file existence
async function validateFilePath(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return "File not found. Please enter a valid file path.";
  }
}

// Helper function to validate watermark file (only for watermark command)
async function validateWatermarkPath(filePath) {
  if (!filePath) return "Watermark file path is required.";
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return "Watermark file not found. Please enter a valid file path.";
  }
}

export async function startInteractiveMode() {
  console.log(chalk.cyan.bold("\n🎨 Welcome to PixPress Interactive Mode!"));
  console.log(chalk.gray("Let's process your image step by step.\n"));

  try {
    // Step 1: Choose operation
    const { operation } = await inquirer.prompt([
      {
        type: "list",
        name: "operation",
        message: "What would you like to do?",
        choices: [
          {
            name: "📏 Resize - Change image dimensions",
            value: "resize",
          },
          {
            name: "🔄 Convert - Change image format",
            value: "convert",
          },
          {
            name: "⚡ Preset - Apply quick presets",
            value: "preset",
          },
          {
            name: "💧 Watermark - Add watermark to image",
            value: "watermark",
          },
        ],
      },
    ]);

    // Step 2: Get input file
    const { inputFile } = await inquirer.prompt([
      {
        type: "input",
        name: "inputFile",
        message: "Enter the path to your input image:",
        validate: validateFilePath,
      },
    ]);

    // Step 3: Operation-specific questions
    let options = {};

    switch (operation) {
      case "resize":
        options = await getResizeOptions();
        break;
      case "convert":
        options = await getConvertOptions();
        break;
      case "preset":
        options = await getPresetOptions();
        break;
      case "watermark":
        options = await getWatermarkOptions();
        break;
    }

    // Step 4: Get output file (optional)
    const { outputFile } = await inquirer.prompt([
      {
        type: "input",
        name: "outputFile",
        message: "Output file path (leave empty for auto-generated):",
      },
    ]);

    if (outputFile) {
      options.output = outputFile;
    }

    console.log(chalk.yellow("\n🚀 Processing your image...\n"));

    // Execute the chosen command
    switch (operation) {
      case "resize":
        await resizeCommand(inputFile, options);
        break;
      case "convert":
        await convertCommand(inputFile, options);
        break;
      case "preset":
        await presetCommand(inputFile, options);
        break;
      case "watermark":
        await watermarkCommand(inputFile, options);
        break;
    }

    // Ask if they want to process another image
    const { continueProcessing } = await inquirer.prompt([
      {
        type: "confirm",
        name: "continueProcessing",
        message: "Would you like to process another image?",
        default: false,
      },
    ]);

    if (continueProcessing) {
      await startInteractiveMode();
    } else {
      console.log(
        chalk.green.bold("\n✨ Thanks for using PixPress! Goodbye!\n")
      );
    }
  } catch (error) {
    if (error.isTtyError) {
      console.error(
        chalk.red("Error: Interactive mode requires a TTY environment.")
      );
    } else {
      console.error(chalk.red(`Error: ${error.message}`));
    }
    process.exit(1);
  }
}

async function getResizeOptions() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "width",
      message: "Target width in pixels (leave empty to auto-calculate):",
      filter: (input) => (input ? parseInt(input) : null),
      validate: (input) => {
        if (input === null || input === "") return true;
        if (isNaN(input) || input <= 0) {
          return "Please enter a positive number or leave empty.";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "height",
      message: "Target height in pixels (leave empty to auto-calculate):",
      filter: (input) => (input ? parseInt(input) : null),
      validate: (input) => {
        if (input === null || input === "") return true;
        if (isNaN(input) || input <= 0) {
          return "Please enter a positive number or leave empty.";
        }
        return true;
      },
    },
    {
      type: "list",
      name: "fit",
      message: "How should the image be resized?",
      choices: [
        { name: "Cover - Fill dimensions, crop if needed", value: "cover" },
        { name: "Contain - Fit within dimensions", value: "contain" },
        { name: "Fill - Stretch to exact dimensions", value: "fill" },
        { name: "Inside - Resize only if larger", value: "inside" },
        { name: "Outside - Resize to cover, may exceed", value: "outside" },
      ],
      default: "cover",
    },
    {
      type: "input",
      name: "quality",
      message: "JPEG quality (1-100):",
      default: "80",
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 1 || num > 100) {
          return "Please enter a number between 1 and 100.";
        }
        return true;
      },
    },
  ]);

  // Validate at least one dimension is provided
  if (!answers.width && !answers.height) {
    console.log(chalk.yellow("⚠ At least width or height must be specified."));
    return getResizeOptions();
  }

  return answers;
}

async function getConvertOptions() {
  return await inquirer.prompt([
    {
      type: "list",
      name: "format",
      message: "Select output format:",
      choices: [
        { name: "JPEG - Good compression, no transparency", value: "jpg" },
        { name: "PNG - Lossless, supports transparency", value: "png" },
        { name: "WebP - Modern format, great compression", value: "webp" },
        {
          name: "AVIF - Next-gen format, excellent compression",
          value: "avif",
        },
        { name: "TIFF - High quality, large files", value: "tiff" },
        { name: "GIF - Animated images, limited colors", value: "gif" },
        { name: "BMP - Uncompressed, large files", value: "bmp" },
      ],
    },
    {
      type: "input",
      name: "quality",
      message: "Quality (1-100, for JPEG/WebP/AVIF):",
      default: "80",
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 1 || num > 100) {
          return "Please enter a number between 1 and 100.";
        }
        return true;
      },
    },
  ]);
}

async function getPresetOptions() {
  return await inquirer.prompt([
    {
      type: "list",
      name: "preset",
      message: "Choose a preset:",
      choices: [
        { name: "Thumbnail - 150x150 for previews", value: "thumbnail" },
        { name: "Avatar - 128x128 for profile pictures", value: "avatar" },
        { name: "Banner - 1200x400 for headers", value: "banner" },
        { name: "Social - 1080x1080 for social media", value: "social" },
        { name: "Compress - Reduce file size for web", value: "compress" },
      ],
    },
  ]);
}

async function getWatermarkOptions() {
  return await inquirer.prompt([
    {
      type: "input",
      name: "watermark",
      message: "Path to watermark image:",
      validate: validateWatermarkPath,
    },
    {
      type: "list",
      name: "position",
      message: "Watermark position:",
      choices: [
        { name: "Top Left", value: "top-left" },
        { name: "Top Right", value: "top-right" },
        { name: "Bottom Left", value: "bottom-left" },
        { name: "Bottom Right", value: "bottom-right" },
        { name: "Center", value: "center" },
      ],
      default: "bottom-right",
    },
    {
      type: "input",
      name: "size",
      message: "Watermark size as percentage (10-50):",
      default: "20",
      validate: (input) => {
        const num = parseInt(input);
        if (isNaN(num) || num < 10 || num > 50) {
          return "Please enter a number between 10 and 50.";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "opacity",
      message: "Watermark opacity (0.1-1.0):",
      default: "0.8",
      validate: (input) => {
        const num = parseFloat(input);
        if (isNaN(num) || num < 0.1 || num > 1.0) {
          return "Please enter a number between 0.1 and 1.0.";
        }
        return true;
      },
    },
  ]);
}
