#!/usr/bin/env node

import { Command } from "commander";
import sharp from "sharp";
import fs from "fs";

const program = new Command();

program
  .name("pixpress")
  .description("Simple image manipulation tool")
  .version("0.1.0");

// Resize command
program
  .command("resize <input>")
  .description("Resize an image")
  .option("-w, --width <width>", "width in pixels")
  .option("-h, --height <height>", "height in pixels")
  .option("-o, --output <output>", "output file")
  .action(async (input, options) => {
    try {
      if (!fs.existsSync(input)) {
        console.error("File not found:", input);
        process.exit(1);
      }

      const width = options.width ? parseInt(options.width) : null;
      const height = options.height ? parseInt(options.height) : null;

      if (!width && !height) {
        console.error("Please specify width or height");
        process.exit(1);
      }

      const output =
        options.output || input.replace(/(\.[^.]+)$/, "_resized$1");

      console.log("Resizing image...");

      await sharp(input).resize(width, height).toFile(output);

      console.log("✓ Resized successfully:", output);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

// Convert command
program
  .command("convert <input>")
  .description("Convert image format")
  .requiredOption("-f, --format <format>", "output format (jpg, png, webp)")
  .option("-o, --output <output>", "output file")
  .action(async (input, options) => {
    try {
      if (!fs.existsSync(input)) {
        console.error("File not found:", input);
        process.exit(1);
      }

      const format = options.format.toLowerCase();
      const validFormats = ["jpg", "jpeg", "png", "webp"];

      if (!validFormats.includes(format)) {
        console.error("Unsupported format. Use: jpg, png, webp");
        process.exit(1);
      }

      const ext = format === "jpg" ? "jpeg" : format;
      const output = options.output || input.replace(/\.[^.]+$/, `.${format}`);

      console.log(`Converting to ${format.toUpperCase()}...`);

      let pipeline = sharp(input);

      if (format === "jpg" || format === "jpeg") {
        pipeline = pipeline.jpeg({ quality: 80 });
      } else if (format === "png") {
        pipeline = pipeline.png();
      } else if (format === "webp") {
        pipeline = pipeline.webp({ quality: 80 });
      }

      await pipeline.toFile(output);

      console.log("✓ Converted successfully:", output);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

// Thumbnail command
program
  .command("thumbnail <input>")
  .description("Create a thumbnail")
  .option("-s, --size <size>", "thumbnail size", "150")
  .option("-o, --output <output>", "output file")
  .action(async (input, options) => {
    try {
      if (!fs.existsSync(input)) {
        console.error("File not found:", input);
        process.exit(1);
      }

      const size = parseInt(options.size);
      const output = options.output || input.replace(/(\.[^.]+)$/, "_thumb$1");

      console.log("Creating thumbnail...");

      await sharp(input)
        .resize(size, size, { fit: "cover" })
        .jpeg({ quality: 85 })
        .toFile(output);

      console.log("✓ Thumbnail created:", output);
    } catch (error) {
      console.error("Error:", error.message);
    }
  });

// Show help if no command
if (process.argv.length === 2) {
  program.help();
}

program.parse();
