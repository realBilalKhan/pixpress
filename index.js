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
  .action(convertCommand);

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
