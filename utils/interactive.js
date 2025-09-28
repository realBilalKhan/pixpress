// utils/interactive.js
import inquirer from "inquirer";
import chalk from "chalk";
import pkg from "fs-extra";
const { access, constants, stat } = pkg;
import { resizeCommand } from "./resize.js";
import { convertCommand } from "./convert.js";
import { presetCommand } from "./preset.js";
import { watermarkCommand } from "./watermark.js";
import { rotateCommand, getRotationPresets } from "./rotate.js";
import { infoCommand } from "./info.js";
import { batchCommand } from "./batch.js";
import { filtersCommand, getAvailableFilters } from "./filters.js";
import { collageCommand, getAvailableLayouts } from "./collage.js";
import {
  memeCommand,
  getAvailableMemeTemplates,
  getMemeFilters,
} from "./meme.js";

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

// Helper function to validate collage input (folder or comma-separated files)
async function validateCollageInput(input) {
  if (!input) return "Input is required for collage creation.";

  // Check if it's a folder
  try {
    await access(input, constants.F_OK);
    const stats = await stat(input);
    if (stats.isDirectory()) {
      return true; // Valid folder
    }
    if (stats.isFile()) {
      return true; // Valid single file (will be part of comma-separated list)
    }
  } catch {
    // Not a valid path, check if it's comma-separated file list
    if (input.includes(",")) {
      const files = input.split(",").map((f) => f.trim());
      for (const file of files) {
        try {
          await access(file, constants.F_OK);
        } catch {
          return `File not found: ${file}`;
        }
      }
      return true; // All files in the list exist
    }
    return "Input folder or files not found. Please enter a valid folder path or comma-separated file list.";
  }
  return true;
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

// Helper function to get collage options
async function getCollageOptions() {
  const availableLayouts = getAvailableLayouts();
  const choices = [];

  // Add layout choices
  Object.entries(availableLayouts).forEach(([key, layout]) => {
    choices.push({
      name: `${layout.name} - ${layout.description} (${layout.minImages}-${layout.maxImages} images)`,
      value: key,
    });
  });

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "layout",
      message: "Choose collage layout:",
      choices: choices,
      pageSize: 10,
    },
    {
      type: "input",
      name: "width",
      message: "Canvas width in pixels (default 1920):",
      default: "1920",
      validate: (input) => {
        const num = parseInt(input);
        return (
          (num >= 200 && num <= 8000) ||
          "Width must be between 200 and 8000 pixels"
        );
      },
    },
    {
      type: "input",
      name: "height",
      message: "Canvas height in pixels (default 1080):",
      default: "1080",
      validate: (input) => {
        const num = parseInt(input);
        return (
          (num >= 200 && num <= 8000) ||
          "Height must be between 200 and 8000 pixels"
        );
      },
    },
    {
      type: "list",
      name: "format",
      message: "Output format:",
      choices: [
        { name: "JPG", value: "jpg" },
        { name: "PNG", value: "png" },
        { name: "WebP", value: "webp" },
      ],
      default: "jpg",
    },
    {
      type: "input",
      name: "quality",
      message: "Quality (1-100, default 85):",
      default: "85",
      validate: (input) => {
        const num = parseInt(input);
        return (num >= 1 && num <= 100) || "Quality must be between 1 and 100";
      },
    },
    {
      type: "input",
      name: "spacing",
      message: "Spacing between images in pixels (default 10):",
      default: "10",
      validate: (input) => {
        const num = parseInt(input);
        return (
          (num >= 0 && num <= 100) || "Spacing must be between 0 and 100 pixels"
        );
      },
    },
    {
      type: "input",
      name: "background",
      message: "Background color (hex, rgb, or name, default #FFFFFF):",
      default: "#FFFFFF",
    },
  ]);

  // Layout-specific options
  if (answers.layout === "grid") {
    const gridOptions = await inquirer.prompt([
      {
        type: "input",
        name: "cols",
        message: "Number of columns (leave empty for auto-calculate):",
        validate: (input) => {
          if (!input) return true;
          const num = parseInt(input);
          return num > 0 || "Columns must be a positive number";
        },
      },
      {
        type: "list",
        name: "fit",
        message: "Image fit mode:",
        choices: [
          { name: "cover - Crop to fit exactly", value: "cover" },
          { name: "contain - Fit inside cell", value: "contain" },
          { name: "fill - Stretch to fit", value: "fill" },
        ],
        default: "cover",
      },
    ]);
    Object.assign(answers, gridOptions);
  } else if (answers.layout === "strip") {
    const stripOptions = await inquirer.prompt([
      {
        type: "list",
        name: "direction",
        message: "Strip direction:",
        choices: [
          { name: "Horizontal", value: "horizontal" },
          { name: "Vertical", value: "vertical" },
        ],
        default: "horizontal",
      },
      {
        type: "list",
        name: "fit",
        message: "Image fit mode:",
        choices: [
          { name: "cover - Crop to fit exactly", value: "cover" },
          { name: "contain - Fit inside strip", value: "contain" },
          { name: "fill - Stretch to fit", value: "fill" },
        ],
        default: "cover",
      },
    ]);
    Object.assign(answers, stripOptions);
  }

  // General options for all layouts
  const generalOptions = await inquirer.prompt([
    {
      type: "confirm",
      name: "shuffle",
      message: "Randomly shuffle images?",
      default: false,
    },
    {
      type: "input",
      name: "maxFiles",
      message: "Maximum number of images to use (leave empty for all):",
      validate: (input) => {
        if (!input) return true;
        const num = parseInt(input);
        return num > 0 || "Must be a positive number";
      },
    },
  ]);

  Object.assign(answers, generalOptions);
  return answers;
}

// Helper function to get rotation options
async function getRotateOptions() {
  const rotationPresets = getRotationPresets();
  const choices = [];

  // Add common rotations
  choices.push(new inquirer.Separator(chalk.cyan("--- Common Rotations ---")));
  rotationPresets.common.forEach((preset) => {
    choices.push({
      name: `${preset.name}° - ${preset.description}`,
      value: { type: "angle", angle: preset.name },
    });
  });

  // Add flip options
  choices.push(new inquirer.Separator(chalk.cyan("--- Flip Operations ---")));
  rotationPresets.flip.forEach((preset) => {
    choices.push({
      name: preset.description,
      value: { type: "flip", operation: preset.name },
    });
  });

  // Add custom angle option
  choices.push(new inquirer.Separator(chalk.cyan("--- Custom ---")));
  choices.push({
    name: "Custom angle (-360° to 360°)",
    value: { type: "custom" },
  });

  const { transformationType } = await inquirer.prompt([
    {
      type: "list",
      name: "transformationType",
      message: "Choose rotation/flip operation:",
      choices: choices,
      pageSize: 15,
    },
  ]);

  const options = {};

  if (transformationType.type === "angle") {
    options.angle = transformationType.angle;
  } else if (transformationType.type === "flip") {
    switch (transformationType.operation) {
      case "flip-h":
        options.flipH = true;
        break;
      case "flip-v":
        options.flipV = true;
        break;
      case "flip-both":
        options.flipH = true;
        options.flipV = true;
        break;
    }
  } else if (transformationType.type === "custom") {
    const { customAngle } = await inquirer.prompt([
      {
        type: "input",
        name: "customAngle",
        message: "Enter rotation angle (-360 to 360 degrees):",
        validate: (input) => {
          const num = parseInt(input);
          return (
            (num >= -360 && num <= 360) ||
            "Angle must be between -360 and 360 degrees"
          );
        },
      },
    ]);
    options.angle = customAngle;
  }

  // Ask if they want to combine with flip operations
  if (options.angle && !options.flipH && !options.flipV) {
    const { addFlip } = await inquirer.prompt([
      {
        type: "confirm",
        name: "addFlip",
        message: "Would you like to add flip operations as well?",
        default: false,
      },
    ]);

    if (addFlip) {
      const flipOptions = await inquirer.prompt([
        {
          type: "checkbox",
          name: "flips",
          message: "Select flip operations:",
          choices: [
            { name: "Flip horizontally (mirror)", value: "horizontal" },
            { name: "Flip vertically", value: "vertical" },
          ],
        },
      ]);

      if (flipOptions.flips.includes("horizontal")) {
        options.flipH = true;
      }
      if (flipOptions.flips.includes("vertical")) {
        options.flipV = true;
      }
    }
  }

  // Quality setting
  const { quality } = await inquirer.prompt([
    {
      type: "input",
      name: "quality",
      message: "Image quality (1-100, default 85):",
      default: "85",
      validate: (input) => {
        const num = parseInt(input);
        return (num >= 1 && num <= 100) || "Quality must be between 1 and 100";
      },
    },
  ]);

  options.quality = parseInt(quality);

  return options;
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
  if (answers.width) options.width = parseInt(answers.width);
  if (answers.height) options.height = parseInt(answers.height);
  options.fit = answers.fit;
  options.quality = parseInt(answers.quality);

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

  answers.quality = parseInt(answers.quality);

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

  answers.size = parseInt(answers.size);
  answers.opacity = parseFloat(answers.opacity);

  return answers;
}

export async function startInteractiveMode() {
  console.log();

  try {
    // Step 1: Choose processing mode
    const { processingMode } = await inquirer.prompt([
      {
        type: "list",
        name: "processingMode",
        message: "How would you like to process images?\n",
        choices: [
          {
            name: "🖼️  Single Image - Process one image file",
            value: "single",
          },
          {
            name: "🎨  Collage - Create photo collages from multiple images",
            value: "collage",
          },
          {
            name: "📁 Batch Processing - Process all images in a folder",
            value: "batch",
          },
          {
            name: "❌ Exit",
            value: "exit",
          },
        ],
      },
    ]);

    if (processingMode === "exit") {
      console.log(chalk.green.bold("\n✨ Thanks for using Pixpress!\n"));
      return;
    }

    if (processingMode === "single") {
      await processSingleImage();
    } else if (processingMode === "collage") {
      await processCollage();
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
      console.log(chalk.green.bold("\n✨ Thanks for using Pixpress!\n"));
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

async function processCollage() {
  console.log(chalk.cyan("🎨 Setting up collage creation...\n"));

  // Step 1: Get input source
  const { inputSource } = await inquirer.prompt([
    {
      type: "list",
      name: "inputSource",
      message: "Where are your images located?",
      choices: [
        {
          name: "📁 Folder - Use all images in a folder",
          value: "folder",
        },
        {
          name: "📋 File List - Specify individual image files",
          value: "files",
        },
      ],
    },
  ]);

  let inputPath;

  if (inputSource === "folder") {
    const { folderPath } = await inquirer.prompt([
      {
        type: "input",
        name: "folderPath",
        message: "Enter the path to your image folder:",
        validate: validateFolderPath,
      },
    ]);
    inputPath = folderPath;
  } else {
    const { fileList } = await inquirer.prompt([
      {
        type: "input",
        name: "fileList",
        message: "Enter comma-separated image file paths:",
        validate: validateCollageInput,
      },
    ]);
    inputPath = fileList;
  }

  // Step 2: Get collage options
  const collageOptions = await getCollageOptions();

  // Step 3: Get output path
  const { outputFile } = await inquirer.prompt([
    {
      type: "input",
      name: "outputFile",
      message: "Output file path (leave empty for auto-generated):",
    },
  ]);

  if (outputFile) {
    collageOptions.output = outputFile;
  }

  console.log(chalk.yellow("\n🚀 Creating your collage...\n"));

  // Execute collage creation
  await collageCommand(inputPath, collageOptions);
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
          name: "🔄 Rotate - Rotate and flip images",
          value: "rotate",
        },
        {
          name: "🎨 Filters - Apply color filters and effects",
          value: "filters",
        },
        {
          name: "😂 Meme - Create viral memes with text",
          value: "meme",
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

  let inputFile = null;
  let options = {};

  // Step 2: For meme, check if input is needed first
  if (operation === "meme") {
    // Get meme options first to determine if we need an input image
    options = await getMemeOptions();

    // Only ask for input file if needed
    if (options.needsInputImage !== false) {
      const { input } = await inquirer.prompt([
        {
          type: "input",
          name: "input",
          message: "Enter the path to your input image:",
          validate: validateFilePath,
        },
      ]);
      inputFile = input;
    } else {
      console.log(chalk.green("✓ Using built-in template image"));
    }
  } else {
    // Step 2: Get input file for all other operations
    const { input } = await inquirer.prompt([
      {
        type: "input",
        name: "input",
        message: "Enter the path to your input image:",
        validate: validateFilePath,
      },
    ]);
    inputFile = input;

    // Step 3: Operation-specific questions (except meme which we already handled)
    if (operation !== "info") {
      switch (operation) {
        case "resize":
          options = await getResizeOptions();
          break;
        case "convert":
          options = await getConvertOptions();
          break;
        case "rotate":
          options = await getRotateOptions();
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
    }
  }

  // Step 4: Get output file for operations that need it
  if (operation !== "info") {
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
    case "rotate":
      await rotateCommand(inputFile, options);
      break;
    case "filters":
      await filtersCommand(inputFile, options);
      break;
    case "meme":
      await memeCommand(inputFile, options);
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
          name: "🔄 Rotate - Rotate/flip all images the same way",
          value: "rotate",
        },
        {
          name: "🎨 Filters - Apply color filters and effects to all images",
          value: "filters",
        },
        {
          name: "😂 Meme - Add the same text to all images",
          value: "meme",
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
    case "rotate":
      operationOptions = await getRotateOptions();
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
    case "meme":
      operationOptions = await getMemeOptions();
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

// Helper function to get meme options
async function getMemeOptions() {
  const { memeType } = await inquirer.prompt([
    {
      type: "list",
      name: "memeType",
      message: "What type of meme do you want to create?",
      choices: [
        {
          name: "🎭 Classic Top/Bottom Text (needs your image)",
          value: "classic",
        },
        {
          name: "🔥 Popular Template (Drake, SpongeBob, etc.)",
          value: "template",
        },
        {
          name: "✨ Custom Text Placement (needs your image)",
          value: "custom",
        },
        { name: "💡 Get Suggestions", value: "suggestions" },
      ],
    },
  ]);

  let options = {};

  if (memeType === "suggestions") {
    console.log(chalk.cyan("\n💡 Meme Creation Tips:"));
    console.log(chalk.white("1. Keep text short and punchy"));
    console.log(chalk.white("2. Reference current trends"));
    console.log(chalk.white("3. Use relatable situations"));
    console.log(chalk.white("4. High contrast text is more readable"));
    console.log(
      chalk.white("5. Test different templates to find what works\n")
    );

    return getMemeOptions(); // Recursively call to let them choose after tips
  }

  // Get text style
  const { style } = await inquirer.prompt([
    {
      type: "list",
      name: "style",
      message: "Choose text style:",
      choices: [
        {
          name: "Impact - Classic meme font (white with black outline)",
          value: "impact",
        },
        {
          name: "Modern - Clean with background (Twitter style)",
          value: "modern",
        },
        { name: "Twitter - Black text on white background", value: "twitter" },
        { name: "Minimal - Simple white text with shadow", value: "minimal" },
        { name: "Bold - Yellow text with thick black outline", value: "bold" },
        {
          name: "Reddit - White text with dark background box",
          value: "reddit",
        },
      ],
      default: "impact",
    },
  ]);
  options.style = style;

  if (memeType === "template") {
    const templates = getAvailableMemeTemplates();
    const templateChoices = Object.entries(templates).map(([key, template]) => {
      const hasBuiltInImage = template.templateImage && key !== "classic";
      const imageNote = hasBuiltInImage ? " ✓" : " (needs your image)";
      const textCount = template.textAreaCount || template.textAreas.length;
      return {
        name: `${template.name} - ${template.description} (${textCount} text areas)${imageNote}`,
        value: key,
      };
    });

    const { template } = await inquirer.prompt([
      {
        type: "list",
        name: "template",
        message: "Choose meme template:",
        choices: templateChoices,
        pageSize: 10,
      },
    ]);
    options.template = template;

    // Get appropriate number of text inputs for the template
    const selectedTemplate = templates[template];
    const texts = [];
    const textAreaCount =
      selectedTemplate.textAreaCount || selectedTemplate.textAreas.length;

    for (let i = 0; i < textAreaCount; i++) {
      const position = selectedTemplate.positions
        ? selectedTemplate.positions[i]
        : `Text ${i + 1}`;
      const { text } = await inquirer.prompt([
        {
          type: "input",
          name: "text",
          message: `Enter text for ${position}:`,
          validate: (input) => input.length > 0 || "Text cannot be empty",
        },
      ]);
      texts.push(text);
    }
    options.text = texts;

    // Store whether this template needs an input image
    options.needsInputImage =
      !selectedTemplate.templateImage || template === "classic";
  } else if (memeType === "classic") {
    const { topText } = await inquirer.prompt([
      {
        type: "input",
        name: "topText",
        message: "Enter top text (leave empty for none):",
      },
    ]);

    const { bottomText } = await inquirer.prompt([
      {
        type: "input",
        name: "bottomText",
        message: "Enter bottom text (leave empty for none):",
      },
    ]);

    const texts = [];
    if (topText) texts.push(topText);
    if (bottomText) texts.push(bottomText);

    if (texts.length === 0) {
      console.error(chalk.red("At least one text field is required!"));
      return getMemeOptions();
    }

    options.text = texts;
    options.needsInputImage = true; // Classic always needs input
  } else if (memeType === "custom") {
    const { textCount } = await inquirer.prompt([
      {
        type: "input",
        name: "textCount",
        message: "How many text areas do you want? (1-4):",
        validate: (input) => {
          const num = parseInt(input);
          return (
            (num >= 1 && num <= 4) || "Please enter a number between 1 and 4"
          );
        },
      },
    ]);

    const texts = [];
    for (let i = 0; i < parseInt(textCount); i++) {
      const { text } = await inquirer.prompt([
        {
          type: "input",
          name: "text",
          message: `Enter text #${i + 1}:`,
          validate: (input) => input.length > 0 || "Text cannot be empty",
        },
      ]);
      texts.push(text);
    }
    options.text = texts;
    options.needsInputImage = true; // Custom always needs input
  }

  // Ask about filters
  const { addFilter } = await inquirer.prompt([
    {
      type: "confirm",
      name: "addFilter",
      message: "Would you like to add a special effect filter?",
      default: false,
    },
  ]);

  if (addFilter) {
    const filters = getMemeFilters();
    const filterChoices = filters.map((filter) => ({
      name: `${filter.name} - ${filter.description}`,
      value: filter.name,
    }));
    filterChoices.unshift({ name: "None", value: null });

    const { filter } = await inquirer.prompt([
      {
        type: "list",
        name: "filter",
        message: "Choose filter effect:",
        choices: filterChoices,
      },
    ]);

    if (filter) {
      options.filter = filter;
    }
  }

  // Social media caption
  const { addCaption } = await inquirer.prompt([
    {
      type: "confirm",
      name: "addCaption",
      message: "Would you like to add a social media caption?",
      default: false,
    },
  ]);

  if (addCaption) {
    const { caption } = await inquirer.prompt([
      {
        type: "input",
        name: "caption",
        message: "Enter social media caption:",
      },
    ]);
    options.caption = caption;
  }

  // Quality settings
  const { quality } = await inquirer.prompt([
    {
      type: "input",
      name: "quality",
      message: "JPEG quality (1-100, default 85):",
      default: "85",
      validate: (input) => {
        const num = parseInt(input);
        return (num >= 1 && num <= 100) || "Quality must be between 1 and 100";
      },
    },
  ]);
  options.quality = quality;

  // Watermark option
  const { watermark } = await inquirer.prompt([
    {
      type: "confirm",
      name: "watermark",
      message: "Add watermark to meme?",
      default: true,
    },
  ]);

  if (!watermark) {
    options.watermark = false;
  }

  return options;
}
