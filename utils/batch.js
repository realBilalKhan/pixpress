// utils/batch.js
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import ora from "ora";
import { minimatch } from "minimatch";
import { resizeCommand } from "./resize.js";
import { convertCommand } from "./convert.js";
import { presetCommand } from "./preset.js";
import { watermarkCommand } from "./watermark.js";
import { infoCommand } from "./info.js";
import { getSupportedFormats, formatFileSize } from "./helpers.js";

const supportedOperations = [
  "resize",
  "convert",
  "preset",
  "watermark",
  "info",
];

export async function batchCommand(operation, folder, options = {}) {
  const spinner = ora("Scanning folder for images...").start();

  try {
    // Validate operation
    if (!supportedOperations.includes(operation)) {
      throw new Error(
        `Unsupported operation: ${operation}. Supported: ${supportedOperations.join(
          ", "
        )}`
      );
    }

    // Validate folder exists
    if (!(await fs.pathExists(folder))) {
      throw new Error(`Folder not found: ${folder}`);
    }

    const folderStats = await fs.stat(folder);
    if (!folderStats.isDirectory()) {
      throw new Error(`Path is not a directory: ${folder}`);
    }

    // Validate operation-specific requirements
    validateOperationOptions(operation, options);

    // Set up output directory
    const outputDir = options.output || path.join(process.cwd(), "processed");
    if (!options.dryRun) {
      await fs.ensureDir(outputDir);
    }

    // Find all image files
    const imageFiles = await findImageFiles(folder, options);

    if (imageFiles.length === 0) {
      spinner.warn(
        chalk.yellow("No image files found in the specified folder")
      );
      return;
    }

    spinner.text = `Found ${imageFiles.length} image(s) to process`;

    // Show dry run results
    if (options.dryRun) {
      spinner.info(chalk.cyan(`🔍 Dry run - showing what would be processed:`));
      displayDryRunResults(imageFiles, operation, options, outputDir);
      return;
    }

    spinner.text = `Processing ${imageFiles.length} image(s)...`;

    // Process images
    const results = await processBatch(
      imageFiles,
      operation,
      options,
      outputDir
    );

    // Show final results
    displayBatchResults(spinner, results, operation);
  } catch (error) {
    spinner.fail(chalk.red("✗ Batch processing failed"));
    console.error(chalk.red(`Error: ${error.message}`));

    if (process.env.DEBUG) {
      console.error(chalk.dim("\nDebug info:"));
      console.error(chalk.dim(error.stack));
    }

    process.exit(1);
  }
}

async function validateOperationOptions(operation, options) {
  switch (operation) {
    case "resize":
      if (!options.width && !options.height) {
        throw new Error("Resize operation requires --width and/or --height");
      }
      break;
    case "convert":
      if (!options.format) {
        throw new Error("Convert operation requires --format");
      }
      const supportedFormats = getSupportedFormats().output;
      if (!supportedFormats.includes(options.format.toLowerCase())) {
        throw new Error(
          `Unsupported format: ${
            options.format
          }. Supported: ${supportedFormats.join(", ")}`
        );
      }
      break;
    case "preset":
      if (!options.preset) {
        throw new Error("Preset operation requires --preset");
      }
      const availablePresets = [
        "thumbnail",
        "avatar",
        "banner",
        "social",
        "compress",
      ];
      if (!availablePresets.includes(options.preset.toLowerCase())) {
        throw new Error(
          `Unknown preset: ${
            options.preset
          }. Available: ${availablePresets.join(", ")}`
        );
      }
      break;
    case "watermark":
      if (!options.watermark) {
        throw new Error("Watermark operation requires --watermark");
      }
      if (!(await fs.pathExists(options.watermark))) {
        throw new Error(`Watermark file not found: ${options.watermark}`);
      }
      break;
    case "info":
      // Info doesn't require additional options
      break;
  }
}

async function findImageFiles(folder, options) {
  const files = [];
  const supportedExtensions = getSupportedFormats().input.map(
    (ext) => `.${ext}`
  );

  // Parse include patterns
  const includePatterns = options.include
    ? options.include.split(",").map((p) => p.trim())
    : supportedExtensions.map((ext) => `*${ext}`);

  // Parse exclude patterns
  const excludePatterns = options.exclude
    ? options.exclude.split(",").map((p) => p.trim())
    : [];

  async function scanDirectory(dir, currentDepth = 0) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory() && (options.recursive || currentDepth === 0)) {
        if (options.recursive) {
          await scanDirectory(fullPath, currentDepth + 1);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();

        // Check if file matches supported image extensions
        if (supportedExtensions.includes(ext)) {
          const relativePath = path.relative(folder, fullPath);

          // Check include patterns
          const matchesInclude = includePatterns.some(
            (pattern) =>
              minimatch(entry.name, pattern, { nocase: true }) ||
              minimatch(relativePath, pattern, { nocase: true })
          );

          // Check exclude patterns
          const matchesExclude = excludePatterns.some(
            (pattern) =>
              minimatch(entry.name, pattern, { nocase: true }) ||
              minimatch(relativePath, pattern, { nocase: true })
          );

          if (matchesInclude && !matchesExclude) {
            files.push({
              path: fullPath,
              name: entry.name,
              relativePath: relativePath,
              dir: path.dirname(fullPath),
            });
          }
        }
      }
    }
  }

  await scanDirectory(folder);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function displayDryRunResults(imageFiles, operation, options, outputDir) {
  console.log(chalk.white.bold(`\n📋 Batch ${operation} operation preview:`));
  console.log(chalk.gray("─".repeat(60)));

  console.log(chalk.dim(`Operation: ${operation}`));
  console.log(chalk.dim(`Input folder: ${path.resolve(process.cwd())}`));
  console.log(chalk.dim(`Output folder: ${outputDir}`));
  console.log(chalk.dim(`Files to process: ${imageFiles.length}`));

  if (options.recursive) {
    console.log(chalk.dim(`Mode: Recursive`));
  }

  // Show operation-specific settings
  console.log(chalk.dim(`\nOperation settings:`));
  switch (operation) {
    case "resize":
      console.log(
        chalk.dim(
          `  • Dimensions: ${options.width || "auto"} x ${
            options.height || "auto"
          }`
        )
      );
      console.log(chalk.dim(`  • Fit mode: ${options.fit || "cover"}`));
      console.log(chalk.dim(`  • Quality: ${options.quality}%`));
      break;
    case "convert":
      console.log(
        chalk.dim(`  • Target format: ${options.format.toUpperCase()}`)
      );
      console.log(chalk.dim(`  • Quality: ${options.quality}%`));
      break;
    case "preset":
      console.log(chalk.dim(`  • Preset: ${options.preset}`));
      break;
    case "watermark":
      console.log(chalk.dim(`  • Watermark: ${options.watermark}`));
      console.log(chalk.dim(`  • Position: ${options.position}`));
      console.log(chalk.dim(`  • Size: ${options.size}%`));
      console.log(chalk.dim(`  • Opacity: ${options.opacity}`));
      break;
  }

  console.log(chalk.white.bold(`\n📁 Files to be processed:`));

  // Show first 10 files and summary if more
  const displayFiles = imageFiles.slice(0, 10);
  displayFiles.forEach((file, index) => {
    console.log(chalk.dim(`  ${index + 1}. ${file.relativePath}`));
  });

  if (imageFiles.length > 10) {
    console.log(chalk.dim(`  ... and ${imageFiles.length - 10} more files`));
  }

  console.log(
    chalk.green(`\n✅ Run without --dry-run to execute the batch operation`)
  );
}

async function processBatch(imageFiles, operation, options, outputDir) {
  const results = {
    successful: 0,
    failed: 0,
    errors: [],
    totalInputSize: 0,
    totalOutputSize: 0,
  };

  let processed = 0;
  const total = imageFiles.length;

  for (const file of imageFiles) {
    try {
      processed++;
      const progress = `(${processed}/${total})`;

      // Calculate input file size
      const inputStats = await fs.stat(file.path);
      results.totalInputSize += inputStats.size;

      // Prepare output path maintaining folder structure
      const relativeDir = path.relative(process.cwd(), file.dir);
      const outputFileDir = path.join(outputDir, relativeDir);
      await fs.ensureDir(outputFileDir);

      // Create operation-specific options for this file
      const fileOptions = { ...options };

      if (operation !== "info") {
        // Generate appropriate output path
        let outputFileName = file.name;
        const baseName = path.parse(file.name).name;
        const currentExt = path.parse(file.name).ext;

        switch (operation) {
          case "resize":
            outputFileName = `${baseName}_resized${currentExt}`;
            break;
          case "convert":
            outputFileName = `${baseName}.${options.format}`;
            break;
          case "preset":
            outputFileName = `${baseName}_${options.preset}${currentExt}`;
            break;
          case "watermark":
            outputFileName = `${baseName}_watermarked${currentExt}`;
            break;
        }

        fileOptions.output = path.join(outputFileDir, outputFileName);
      }

      if (options.verbose) {
        console.log(chalk.cyan(`${progress} Processing: ${file.relativePath}`));
      }

      await executeOperation(operation, file.path, fileOptions);

      // Calculate output file size for non-info operations
      if (operation !== "info" && fileOptions.output) {
        const outputStats = await fs.stat(fileOptions.output);
        results.totalOutputSize += outputStats.size;
      }

      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        file: file.relativePath,
        error: error.message,
      });

      if (options.verbose) {
        console.log(
          chalk.red(
            `${progress} Failed: ${file.relativePath} - ${error.message}`
          )
        );
      }
    }
  }

  return results;
}

async function executeOperation(operation, inputPath, options) {
  // Temporarily suppress console output for batch operations
  const originalLog = console.log;
  const originalError = console.error;

  console.log = () => {};
  console.error = () => {};

  try {
    switch (operation) {
      case "resize":
        await resizeCommand(inputPath, options);
        break;
      case "convert":
        await convertCommand(inputPath, options);
        break;
      case "preset":
        await presetCommand(inputPath, options);
        break;
      case "watermark":
        await watermarkCommand(inputPath, options);
        break;
      case "info":
        await infoCommand(inputPath, options);
        break;
    }
  } finally {
    // Restore console functions
    console.log = originalLog;
    console.error = originalError;
  }
}

function displayBatchResults(spinner, results, operation) {
  if (results.failed === 0) {
    spinner.succeed(
      chalk.green(`✓ Batch ${operation} completed successfully!`)
    );
  } else {
    spinner.warn(
      chalk.yellow(`⚠ Batch ${operation} completed with some errors`)
    );
  }

  console.log(chalk.white.bold("\n📊 Processing Summary:"));
  console.log(chalk.gray("─".repeat(40)));
  console.log(chalk.green(`  ✓ Successful: ${results.successful}`));

  if (results.failed > 0) {
    console.log(chalk.red(`  ✗ Failed: ${results.failed}`));
  }

  // Show size comparison for operations that modify files
  if (operation !== "info" && results.totalInputSize > 0) {
    const savings =
      results.totalOutputSize > 0
        ? (
            ((results.totalInputSize - results.totalOutputSize) /
              results.totalInputSize) *
            100
          ).toFixed(1)
        : 0;

    console.log(
      chalk.dim(`  📁 Input size: ${formatFileSize(results.totalInputSize)}`)
    );
    console.log(
      chalk.dim(`  📁 Output size: ${formatFileSize(results.totalOutputSize)}`)
    );

    if (savings > 0) {
      console.log(
        chalk.green(
          `  💾 Space saved: ${savings}% (${formatFileSize(
            results.totalInputSize - results.totalOutputSize
          )})`
        )
      );
    } else if (savings < 0) {
      console.log(chalk.yellow(`  📈 Size increase: ${Math.abs(savings)}%`));
    }
  }

  // Show errors if any
  if (results.errors.length > 0) {
    console.log(chalk.red.bold(`\n❌ Errors encountered:`));
    results.errors.slice(0, 5).forEach((error, index) => {
      console.log(chalk.red(`  ${index + 1}. ${error.file}: ${error.error}`));
    });

    if (results.errors.length > 5) {
      console.log(
        chalk.red(`  ... and ${results.errors.length - 5} more errors`)
      );
    }
  }

  console.log("");
}
