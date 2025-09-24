// utils/interactive.js
import inquirer from "inquirer";
import chalk from "chalk";
import pkg from "fs-extra";
const { access, constants, stat } = pkg;
import { resizeCommand } from "./resize.js";
import { convertCommand } from "./convert.js";
import { presetCommand } from "./preset.js";
import { watermarkCommand } from "./watermark.js";
import { infoCommand } from "./info.js";
import { batchCommand } from "./batch.js";
import { filtersCommand, getAvailableFilters } from "./filters.js";

// Helper function to validate file existence
async function validateFilePath(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return "File not found. Please enter a valid file path.";
  }
}

// Helper function to validate folder existence
async function validateFolderPath(folderPath) {
  try {
    await access(folderPath, constants.F_OK);
    const stats = await stat(folderPath);
    if (!stats.isDirectory()) {
      return "Path is not a directory. Please enter a valid folder path.";
    }
    return true;
  } catch {
    return "Folder not found. Please enter a valid folder path.";
  }
}

// Helper function to validate watermark file
async function validateWatermarkPath(filePath) {
  if (!filePath) return "Watermark file path is required.";
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return "Watermark file not found. Please enter a valid file path.";
  }
}

// Helper function to get preset options
async function getPresetOptions() {
  const presets = {
    thumbnail: "150x150 thumbnail",
    avatar: "128x128 avatar",
    banner: "1200x400 banner",
    social: "1080x1080 social media post",
    compress: "High compression for web",
  };

  const { preset } = await inquirer.prompt([
    {
      type: "list",
      name: "preset",
      message: "Choose a preset:",
      choices: Object.entries(presets).map(([key, description]) => ({
        name: `${key} - ${description}`,
        value: key,
      })),
    },
  ]);

  return { preset };
}

// Helper function to get filter options
async function getFilterOptions() {
  const availableFilters = getAvailableFilters();
  const choices = [];

  Object.entries(availableFilters).forEach(([category, filters]) => {
    choices.push(
      new inquirer.Separator(
        chalk.cyan(
          `--- ${category.charAt(0).toUpperCase() + category.slice(1)} ---`
        )
      )
    );
    filters.forEach((filter) => {
      const aliases =
        filter.aliases.length > 0 ? ` (${filter.aliases.join(", ")})` : "";
      choices.push({
        name: `${filter.name}${aliases} - ${filter.description}`,
        value: filter.name,
      });
    });
  });

  const { filter } = await inquirer.prompt([
    {
      type: "list",
      name: "filter",
      message: "Choose a color filter or effect:",
      choices: choices,
      pageSize: 20,
    },
  ]);

  return { filter };
}

// Helper function to get resize options
async function getResizeOptions() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "width",
      message: "Enter width (leave empty to auto-calculate):",
      validate: (input) => {
        if (!input) return true; // Allow empty
        const num = parseInt(input);
        return num > 0 || "Width must be a positive number";
      },
    },
    {
      type: "input",
      name: "height",
      message: "Enter height (leave empty to auto-calculate):",
      validate: (input) => {
        if (!input) return true; // Allow empty
        const num = parseInt(input);
        return num > 0 || "Height must be a positive number";
      },
    },
    {
      type: "list",
      name: "fit",
      message: "Choose fit mode:",
      choices: [
        { name: "cover - Crop to fit exactly", value: "cover" },
        { name: "contain - Fit inside dimensions", value: "contain" },
        { name: "fill - Stretch to fit", value: "fill" },
        { name: "inside - Shrink to fit inside", value: "inside" },
        { name: "outside - Grow to fit outside", value: "outside" },
      ],
      default: "cover",
    },
    {
      type: "input",
      name: "quality",
      message: "JPEG quality (1-100, default 80):",
      default: "80",
      validate: (input) => {
        const num = parseInt(input);
        return (num >= 1 && num <= 100) || "Quality must be between 1 and 100";
      },
    },
  ]);

  // Filter out empty values
  const options = {};
  if (answers.width) options.width = answers.width;
  if (answers.height) options.height = answers.height;
  options.fit = answers.fit;
  options.quality = answers.quality;

  return options;
}

// Helper function to get convert options
async function getConvertOptions() {
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

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "format",
      message: "Choose output format:",
      choices: supportedFormats.map((format) => ({
        name: format.toUpperCase(),
        value: format,
      })),
    },
    {
      type: "input",
      name: "quality",
      message: "Quality (1-100, default 80):",
      default: "80",
      validate: (input) => {
        const num = parseInt(input);
        return (num >= 1 && num <= 100) || "Quality must be between 1 and 100";
      },
    },
    {
      type: "confirm",
      name: "applyFilter",
      message: "Would you like to apply a color filter during conversion?",
      default: false,
    },
  ]);

  // If user wants to apply a filter, get filter options
  if (answers.applyFilter) {
    const filterOptions = await getFilterOptions();
    answers.filter = filterOptions.filter;
  }

  return answers;
}

// Helper function to get watermark options
async function getWatermarkOptions() {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "watermark",
      message: "Enter path to watermark image:",
      validate: validateWatermarkPath,
    },
    {
      type: "list",
      name: "position",
      message: "Choose watermark position:",
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
      message: "Watermark size as percentage of image width (10-50):",
      default: "20",
      validate: (input) => {
        const num = parseInt(input);
        return (num >= 10 && num <= 50) || "Size must be between 10 and 50";
      },
    },
    {
      type: "input",
      name: "opacity",
      message: "Watermark opacity (0.1-1.0):",
      default: "0.5",
      validate: (input) => {
        const num = parseFloat(input);
        return (
          (num >= 0.1 && num <= 1.0) || "Opacity must be between 0.1 and 1.0"
        );
      },
    },
  ]);

  return answers;
}

export async function startInteractiveMode() {
  console.log(chalk.cyan.bold("\n🎨 Welcome to PixPress Interactive Mode!"));
  console.log(chalk.gray("Let's process your image(s) step by step.\n"));

  try {
    // Step 1: Choose processing mode
    const { processingMode } = await inquirer.prompt([
      {
        type: "list",
        name: "processingMode",
        message: "How would you like to process images?",
        choices: [
          {
            name: "🖼️  Single Image - Process one image file",
            value: "single",
          },
          {
            name: "📁 Batch Processing - Process all images in a folder",
            value: "batch",
          },
        ],
      },
    ]);

    if (processingMode === "single") {
      await processSingleImage();
    } else {
      await processBatchImages();
    }

    // Ask if they want to process more
    const { continueProcessing } = await inquirer.prompt([
      {
        type: "confirm",
        name: "continueProcessing",
        message: "Would you like to process more images?",
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

async function processSingleImage() {
  // Step 1: Choose operation
  const { operation } = await inquirer.prompt([
    {
      type: "list",
      name: "operation",
      message: "What would you like to do?",
      choices: [
        {
          name: "📊 Info - View detailed image information",
          value: "info",
        },
        {
          name: "📏 Resize - Change image dimensions",
          value: "resize",
        },
        {
          name: "🔄 Convert - Change image format",
          value: "convert",
        },
        {
          name: "🎨 Filters - Apply color filters and effects",
          value: "filters",
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

  // Step 3: Operation-specific questions (skip for info command)
  let options = {};

  if (operation !== "info") {
    switch (operation) {
      case "resize":
        options = await getResizeOptions();
        break;
      case "convert":
        options = await getConvertOptions();
        break;
      case "filters":
        options = await getFilterOptions();
        break;
      case "preset":
        options = await getPresetOptions();
        break;
      case "watermark":
        options = await getWatermarkOptions();
        break;
    }

    // Step 4: Get output file (optional, not needed for info)
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
  } else {
    console.log(chalk.yellow("\n📊 Analyzing your image...\n"));
  }

  // Execute the chosen command
  switch (operation) {
    case "info":
      await infoCommand(inputFile, options);
      break;
    case "resize":
      await resizeCommand(inputFile, options);
      break;
    case "convert":
      await convertCommand(inputFile, options);
      break;
    case "filters":
      await filtersCommand(inputFile, options);
      break;
    case "preset":
      await presetCommand(inputFile, options);
      break;
    case "watermark":
      await watermarkCommand(inputFile, options);
      break;
  }
}

async function processBatchImages() {
  console.log(chalk.cyan("📁 Setting up batch processing...\n"));

  // Step 1: Choose operation
  const { operation } = await inquirer.prompt([
    {
      type: "list",
      name: "operation",
      message: "What operation would you like to apply to all images?",
      choices: [
        {
          name: "📊 Info - Analyze all images and show summary",
          value: "info",
        },
        {
          name: "📏 Resize - Resize all images to specified dimensions",
          value: "resize",
        },
        {
          name: "🔄 Convert - Convert all images to a different format",
          value: "convert",
        },
        {
          name: "🎨 Filters - Apply color filters and effects to all images",
          value: "filters",
        },
        {
          name: "⚡ Preset - Apply the same preset to all images",
          value: "preset",
        },
        {
          name: "💧 Watermark - Add the same watermark to all images",
          value: "watermark",
        },
      ],
    },
  ]);

  // Step 2: Get input folder
  const { inputFolder } = await inquirer.prompt([
    {
      type: "input",
      name: "inputFolder",
      message: "Enter the path to your input folder:",
      validate: validateFolderPath,
    },
  ]);

  // Step 3: Folder scanning options
  const folderOptions = await inquirer.prompt([
    {
      type: "confirm",
      name: "recursive",
      message: "Process subfolders recursively?",
      default: false,
    },
    {
      type: "input",
      name: "include",
      message: "File patterns to include (e.g., *.jpg,*.png):",
      default: "*.jpg,*.jpeg,*.png,*.webp,*.tiff,*.gif,*.bmp",
    },
    {
      type: "input",
      name: "exclude",
      message: "File patterns to exclude (leave empty for none):",
    },
  ]);

  // Step 4: Operation-specific options
  let operationOptions = {};

  switch (operation) {
    case "resize":
      operationOptions = await getResizeOptions();
      break;
    case "convert":
      operationOptions = await getConvertOptions();
      break;
    case "filters":
      operationOptions = await getFilterOptions();
      break;
    case "preset":
      operationOptions = await getPresetOptions();
      break;
    case "watermark":
      operationOptions = await getWatermarkOptions();
      break;
    case "info":
      // Info doesn't need additional options
      break;
  }

  // Step 5: Output options (not needed for info)
  let outputOptions = {};

  if (operation !== "info") {
    outputOptions = await inquirer.prompt([
      {
        type: "input",
        name: "output",
        message: "Output folder (leave empty for ./processed):",
        default: "./processed",
      },
      {
        type: "confirm",
        name: "verbose",
        message: "Show detailed progress for each file?",
        default: true,
      },
    ]);
  }

  // Step 6: Show preview and confirm
  const { confirmProcessing } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmProcessing",
      message: "Run a preview first to see what will be processed?",
      default: true,
    },
  ]);

  // Combine all options
  const batchOptions = {
    ...folderOptions,
    ...operationOptions,
    ...outputOptions,
  };

  if (confirmProcessing) {
    // Run dry run first
    console.log(chalk.yellow("\n🔍 Running preview...\n"));
    await batchCommand(operation, inputFolder, {
      ...batchOptions,
      dryRun: true,
    });

    const { proceedWithProcessing } = await inquirer.prompt([
      {
        type: "confirm",
        name: "proceedWithProcessing",
        message: "Proceed with the batch processing?",
        default: true,
      },
    ]);

    if (!proceedWithProcessing) {
      console.log(chalk.yellow("Batch processing cancelled."));
      return;
    }
  }

  console.log(chalk.yellow("\n🚀 Starting batch processing...\n"));

  // Execute batch processing
  await batchCommand(operation, inputFolder, batchOptions);
}
