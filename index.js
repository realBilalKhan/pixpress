#!/usr/bin/env node

import { Command } from "commander";
import boxen from "boxen";
import chalk from "chalk";
import { resizeCommand } from "./utils/resize.js";
import { convertCommand } from "./utils/convert.js";
import { presetCommand } from "./utils/preset.js";
import { watermarkCommand } from "./utils/watermark.js";
import { rotateCommand } from "./utils/rotate.js";
import { infoCommand } from "./utils/info.js";
import { batchCommand } from "./utils/batch.js";
import { filtersCommand, listFilters } from "./utils/filters.js";
import { collageCommand, listLayouts } from "./utils/collage.js";
import { startInteractiveMode } from "./utils/interactive.js";

const program = new Command();

program
  .name("pixpress")
  .description("A beginner-friendly CLI tool for image manipulation")
  .version("1.0.0");

const content = `${chalk.bold.magenta("PixPress")}\nImage Magic Made Easy`;

const banner = boxen(content, {
  padding: 1,
  margin: 1,
  borderStyle: "round",
  borderColor: "cyan",
  align: "center",
  float: "center",
});

console.log(banner);

// Info command
program
  .command("info <input>")
  .description("Display detailed image information and metadata")
  .option("-v, --verbose", "Show additional technical details")
  .action(infoCommand);

// Resize command
program
  .command("resize <input>")
  .description("Resize an image")
  .option("-w, --width <width>", "Target width in pixels")
  .option("-h, --height <height>", "Target height in pixels")
  .option("-o, --output <output>", "Output file path")
  .option("-q, --quality <quality>", "JPEG quality (1-100)", "80")
  .option(
    "--fit <fit>",
    "Resize fit mode: cover, contain, fill, inside, outside",
    "cover"
  )
  .action(resizeCommand);

// Convert command
program
  .command("convert <input>")
  .description("Convert image format")
  .requiredOption(
    "-f, --format <format>",
    "Output format: jpg, png, webp, tiff, gif, bmp"
  )
  .option("-o, --output <output>", "Output file path")
  .option("-q, --quality <quality>", "Quality (1-100 for JPEG/WebP)", "80")
  .option("--filter <filter>", "Apply color filter during conversion")
  .action(convertCommand);

// Rotate command
program
  .command("rotate <input>")
  .description("Rotate and flip images")
  .option("-a, --angle <angle>", "Rotation angle in degrees (-360 to 360)")
  .option("--flip-h, --horizontal", "Flip horizontally (mirror)")
  .option("--flip-v, --vertical", "Flip vertically")
  .option("-o, --output <output>", "Output file path")
  .option("-q, --quality <quality>", "Quality (1-100 for JPEG/WebP)", "85")
  .option(
    "--background <color>",
    "Background color for exposed areas (hex or rgba)",
    "#FFFFFF00"
  )
  .action((input, options) => {
    if (
      !options.angle &&
      !options.flipH &&
      !options.horizontal &&
      !options.flipV &&
      !options.vertical
    ) {
      console.error(
        chalk.red("Error: At least one transformation is required")
      );
      console.log(chalk.dim("Usage: pixpress rotate <input> [options]"));
      console.log(chalk.dim("Options: --angle <degrees>, --flip-h, --flip-v"));
      process.exit(1);
    }
    rotateCommand(input, options);
  });

// Filters command
program
  .command("filters [input]")
  .description("Apply color filters and effects to images")
  .option("-f, --filter <filter>", "Color filter to apply")
  .option("-o, --output <output>", "Output file path")
  .option("-q, --quality <quality>", "Quality (1-100 for JPEG/WebP)", "85")
  .option("-l, --list", "List all available filters")
  .action((input, options) => {
    if (options.list) {
      listFilters();
      return;
    }

    if (!input) {
      console.error(chalk.red("Error: Input image path is required"));
      console.log(
        chalk.dim("Usage: pixpress filters <input> --filter <filter-name>")
      );
      console.log(chalk.dim("Use --list to see available filters"));
      process.exit(1);
    }

    if (!options.filter) {
      console.error(chalk.red("Error: Filter is required"));
      console.log(
        chalk.dim("Usage: pixpress filters <input> --filter <filter-name>")
      );
      console.log(chalk.dim("Use --list to see available filters"));
      process.exit(1);
    }

    filtersCommand(input, options);
  });

// Collage command
program
  .command("collage [input]")
  .description("Create photo collages and montages from multiple images")
  .option(
    "-l, --layout <layout>",
    "Layout type: grid, strip, polaroid, mosaic, filmstrip, magazine"
  )
  .option("-w, --width <width>", "Canvas width in pixels", "1920")
  .option("-h, --height <height>", "Canvas height in pixels", "1080")
  .option("-o, --output <output>", "Output file path")
  .option("-f, --format <format>", "Output format: jpg, png, webp", "jpg")
  .option("-q, --quality <quality>", "JPEG/WebP quality (1-100)", "85")
  .option("-s, --spacing <spacing>", "Spacing between images in pixels", "10")
  .option(
    "--background <color>",
    "Background color (hex, rgb, or name)",
    "#FFFFFF"
  )
  // Grid layout options
  .option("--cols <cols>", "Number of columns for grid layout")
  .option("--fit <fit>", "Image fit mode: cover, contain, fill", "cover")
  // Strip layout options
  .option(
    "--direction <direction>",
    "Strip direction: horizontal, vertical",
    "horizontal"
  )
  // General options
  .option("--shuffle", "Randomly shuffle input images")
  .option("--max-files <max>", "Maximum number of images to use")
  .option("--list-layouts", "List all available layouts")
  .action((input, options) => {
    if (options.listLayouts) {
      listLayouts();
      return;
    }

    if (!input) {
      console.error(chalk.red("Error: Input image path or folder is required"));
      console.log(
        chalk.dim("Usage: pixpress collage <input> --layout <layout>")
      );
      console.log(chalk.dim("Use --list-layouts to see available options"));
      process.exit(1);
    }

    if (!options.layout) {
      console.error(chalk.red("Error: Layout is required"));
      console.log(
        chalk.dim("Usage: pixpress collage <input> --layout <layout>")
      );
      console.log(chalk.dim("Use --list-layouts to see available options"));
      process.exit(1);
    }

    collageCommand(input, options);
  });

// Preset command
program
  .command("preset <input>")
  .description("Apply image presets")
  .requiredOption(
    "-p, --preset <preset>",
    "Preset name: thumbnail, avatar, banner, social, compress"
  )
  .option("-o, --output <output>", "Output file path")
  .action(presetCommand);

// Watermark command
program
  .command("watermark <input>")
  .description("Add watermark to image")
  .requiredOption("-w, --watermark <watermark>", "Watermark image path")
  .option("-o, --output <output>", "Output file path")
  .option(
    "-p, --position <position>",
    "Position: top-left, top-right, bottom-left, bottom-right, center",
    "bottom-right"
  )
  .option("-s, --size <size>", "Watermark size as percentage (10-50)", "20")
  .option("--opacity <opacity>", "Watermark opacity (0.1-1.0)", "0.8")
  .action(watermarkCommand);

// Batch processing command
program
  .command("batch <operation> <folder>")
  .description("Batch process all images in a folder")
  .option("-o, --output <output>", "Output folder (default: ./processed)")
  .option("-r, --recursive", "Process subfolders recursively")
  .option(
    "--include <pattern>",
    "File pattern to include (e.g., *.jpg,*.png)",
    "*.jpg,*.jpeg,*.png,*.webp,*.tiff,*.gif,*.bmp"
  )
  .option("--exclude <pattern>", "File pattern to exclude")
  .option("--dry-run", "Show what would be processed without doing it")
  .option("-v, --verbose", "Show detailed progress")
  // Resize options
  .option("-w, --width <width>", "Target width in pixels (for resize)")
  .option("-h, --height <height>", "Target height in pixels (for resize)")
  .option("--fit <fit>", "Resize fit mode (for resize)", "cover")
  // Convert options
  .option("-f, --format <format>", "Output format (for convert)")
  .option("-q, --quality <quality>", "Quality 1-100 (for convert/resize)", "80")
  // Filter options
  .option("--filter <filter>", "Color filter to apply (for filters)")
  // Preset options
  .option("-p, --preset <preset>", "Preset name (for preset)")
  // Watermark options
  .option("--watermark <watermark>", "Watermark image path (for watermark)")
  .option(
    "--position <position>",
    "Watermark position (for watermark)",
    "bottom-right"
  )
  .option(
    "-s, --size <size>",
    "Watermark size percentage (for watermark)",
    "20"
  )
  .option("--opacity <opacity>", "Watermark opacity (for watermark)", "0.8")
  // Rotate options
  .option("-a, --angle <angle>", "Rotation angle in degrees (for rotate)")
  .option("--flip-h, --horizontal", "Flip horizontally (for rotate)")
  .option("--flip-v, --vertical", "Flip vertically (for rotate)")
  .option(
    "--background <color>",
    "Background color for rotation (for rotate)",
    "#FFFFFF00"
  )
  // Collage options
  .option("--layout <layout>", "Collage layout (for collage)")
  .option("--cols <cols>", "Grid columns (for collage)")
  .option("--direction <direction>", "Strip direction (for collage)")
  .option("--shuffle", "Shuffle images (for collage)")
  .action(batchCommand);

// Interactive command
program
  .command("interactive")
  .alias("i")
  .description("Start interactive mode")
  .action(startInteractiveMode);

// Configure help display settings
program.configureHelp({
  sortSubcommands: true,
  helpWidth: 80,
});

// Add custom help text
program.addHelpText(
  "after",
  `
${chalk.yellow("Examples:")}
  ${chalk.dim("# View image information")}
  pixpress info photo.jpg

  ${chalk.dim("# Resize image to 800x600")}
  pixpress resize photo.jpg -w 800 -h 600

  ${chalk.dim("# Convert to WebP format")}
  pixpress convert photo.jpg -f webp

  ${chalk.dim("# Rotate image 90 degrees clockwise")}
  pixpress rotate photo.jpg --angle 90

  ${chalk.dim("# Flip image horizontally")}
  pixpress rotate photo.jpg --flip-h

  ${chalk.dim("# Rotate and flip in one command")}
  pixpress rotate photo.jpg --angle 180 --flip-v

  ${chalk.dim("# Apply black and white filter")}
  pixpress filters photo.jpg --filter grayscale

  ${chalk.dim("# List available color filters")}
  pixpress filters --list

  ${chalk.dim("# Apply vintage filter during format conversion")}
  pixpress convert photo.jpg -f jpg --filter vintage

  ${chalk.dim("# Apply thumbnail preset")}
  pixpress preset photo.jpg -p thumbnail

  ${chalk.dim("# Add watermark")}
  pixpress watermark photo.jpg -w logo.png

  ${chalk.dim("# Create a 3x3 photo grid")}
  pixpress collage ./vacation-photos --layout grid --cols 3

  ${chalk.dim("# Create polaroid-style scattered layout")}
  pixpress collage img1.jpg,img2.jpg,img3.jpg --layout polaroid

  ${chalk.dim("# Create horizontal filmstrip from folder")}
  pixpress collage ./photos --layout filmstrip --shuffle

  ${chalk.dim("# Create magazine-style layout with custom size")}
  pixpress collage ./portraits --layout magazine --width 1200 --height 800

  ${chalk.dim("# List available collage layouts")}
  pixpress collage --list-layouts

  ${chalk.dim("# Batch rotate all images 90 degrees")}
  pixpress batch rotate ./photos --angle 90

  ${chalk.dim("# Batch apply sepia filter to all images")}
  pixpress batch filters ./photos --filter sepia

  ${chalk.dim("# Interactive mode (guided process)")}
  pixpress interactive

${chalk.cyan("Available Operations:")}
  ${chalk.dim(
    "info, resize, convert, rotate, filters, preset, watermark, collage, batch, interactive"
  )}

${chalk.cyan("Popular Color Filters:")}
  ${chalk.dim("grayscale, sepia, vintage, cool, warm, dramatic, soft, vivid")}

${chalk.cyan("Common Rotations:")}
  ${chalk.dim("90° (clockwise), -90° (counter-clockwise), 180° (upside-down)")}

${chalk.cyan("Collage Layouts:")}
  ${chalk.dim("grid, strip, polaroid, mosaic, filmstrip, magazine")}
`
);

// Check if no arguments provided or only the script name
if (process.argv.length === 2) {
  console.log(
    chalk.blue("💡 No command specified. Starting interactive mode...\n")
  );
  startInteractiveMode();
} else {
  // Parse command line arguments normally
  program.parse();
}
