#!/usr/bin/env node

import { Command } from "commander";
import boxen from "boxen";
import chalk from "chalk";
import { resizeCommand } from "./utils/resize.js";
import { convertCommand } from "./utils/convert.js";
import { presetCommand } from "./utils/preset.js";
import { watermarkCommand } from "./utils/watermark.js";
import { infoCommand } from "./utils/info.js";
import { batchCommand } from "./utils/batch.js";
import { filtersCommand, listFilters } from "./utils/filters.js";
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

  ${chalk.dim("# Batch apply sepia filter to all images")}
  pixpress batch filters ./photos --filter sepia

  ${chalk.dim("# Interactive mode (guided process)")}
  pixpress interactive

${chalk.cyan("Available Operations:")}
  ${chalk.dim(
    "info, resize, convert, filters, preset, watermark, batch, interactive"
  )}

${chalk.cyan("Popular Color Filters:")}
  ${chalk.dim("grayscale, sepia, vintage, cool, warm, dramatic, soft, vivid")}
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
