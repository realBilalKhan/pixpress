// utils/convert.js
import sharp from "sharp";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import {
  validateInput,
  generateOutputPath,
  handleError,
  displayOutputLocation,
  initializePixpressDirectory,
} from "./helpers.js";

export async function convertCommand(input, options) {
  await initializePixpressDirectory();

  const spinner = ora("Converting image...").start();

  try {
    await validateInput(input);

    const format = options.format.toLowerCase();
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

    if (!supportedFormats.includes(format)) {
      throw new Error(
        `Unsupported format: ${format}. Supported: ${supportedFormats.join(
          ", "
        )}`
      );
    }

    const outputPath = await generateOutputPath(
      input,
      "converted",
      "",
      `.${format}`,
      options.output
    );

    const metadata = await sharp(input).metadata();
    spinner.text = `Converting ${metadata.format} → ${format.toUpperCase()}`;

    let pipeline = sharp(input);

    // Apply color filters/effects if specified
    if (options.filter) {
      pipeline = applyColorFilter(pipeline, options.filter, options);
      spinner.text = `Applying ${
        options.filter
      } filter and converting to ${format.toUpperCase()}`;
    }

    // Apply format-specific optimizations
    switch (format) {
      case "jpg":
      case "jpeg":
        pipeline = pipeline.jpeg({
          quality: parseInt(options.quality),
          progressive: true,
        });
        break;
      case "png":
        pipeline = pipeline.png({
          progressive: true,
          compressionLevel: 6,
        });
        break;
      case "webp":
        pipeline = pipeline.webp({
          quality: parseInt(options.quality),
          effort: 4,
        });
        break;
      case "tiff":
        pipeline = pipeline.tiff({
          quality: parseInt(options.quality),
        });
        break;
      case "gif":
        pipeline = pipeline.gif();
        break;
      case "bmp":
        pipeline = pipeline.bmp();
        break;
      case "avif":
        pipeline = pipeline.avif({
          quality: parseInt(options.quality),
        });
        break;
    }

    await pipeline.toFile(outputPath);

    const inputSize = (await fs.stat(input)).size;
    const outputSize = (await fs.stat(outputPath)).size;
    const savings = (((inputSize - outputSize) / inputSize) * 100).toFixed(1);

    const filterText = options.filter ? ` with ${options.filter} filter` : "";

    spinner.succeed(
      chalk.green("✓ Image converted successfully!") +
        chalk.dim(
          `\n  Format: ${metadata.format.toUpperCase()} → ${format.toUpperCase()}${filterText}`
        ) +
        chalk.dim(
          `\n  Size: ${inputSize} bytes → ${outputSize} bytes (${
            savings > 0 ? "-" + savings : "+" + Math.abs(savings)
          }%)`
        )
    );

    displayOutputLocation(outputPath);
  } catch (error) {
    handleError(spinner, error);
  }
}

// Apply color filters and effects to the Sharp pipeline
function applyColorFilter(pipeline, filterName, options = {}) {
  switch (filterName.toLowerCase()) {
    case "grayscale":
    case "greyscale":
    case "bw":
    case "black-white":
      return pipeline.grayscale();

    case "sepia":
      // Create sepia effect using color matrix
      return pipeline.recomb([
        [0.393, 0.769, 0.189],
        [0.349, 0.686, 0.168],
        [0.272, 0.534, 0.131],
      ]);

    case "vintage":
      // Vintage effect: slight sepia + reduced saturation + vignette
      return pipeline
        .modulate({
          saturation: 0.8,
          brightness: 1.1,
          hue: 20,
        })
        .tint({ r: 255, g: 240, b: 220 });

    case "cool":
    case "blue":
      // Cool blue tint
      return pipeline.tint({ r: 200, g: 220, b: 255 });

    case "warm":
    case "orange":
      // Warm orange tint
      return pipeline.tint({ r: 255, g: 220, b: 180 });

    case "dramatic":
    case "high-contrast":
      // High contrast with increased saturation
      return pipeline
        .normalize()
        .modulate({ saturation: 1.3, brightness: 1.1 });

    case "soft":
    case "dreamy":
      // Soft, dreamy effect
      return pipeline.modulate({ saturation: 0.9, brightness: 1.2 }).blur(0.5);

    case "vivid":
    case "saturated":
      // Highly saturated colors
      return pipeline.modulate({ saturation: 1.5 });

    case "muted":
    case "desaturated":
      // Reduced saturation
      return pipeline.modulate({ saturation: 0.6 });

    case "bright":
      // Increased brightness
      return pipeline.modulate({ brightness: 1.3 });

    case "dark":
    case "moody":
      // Darker, moody effect
      return pipeline.modulate({ brightness: 0.8, saturation: 1.1 });

    case "negative":
    case "invert":
      // Color negative/invert
      return pipeline.negate();

    case "polaroid":
      // Polaroid-style effect
      return pipeline
        .modulate({ saturation: 0.9, brightness: 1.1 })
        .tint({ r: 255, g: 250, b: 240 })
        .gamma(1.2);

    case "noir":
    case "film-noir":
      // Film noir effect: high contrast B&W
      return pipeline
        .grayscale()
        .normalize()
        .modulate({ brightness: 0.9 })
        .gamma(1.4);

    case "retro":
    case "70s":
      // Retro 70s look
      return pipeline
        .modulate({ saturation: 1.2, hue: 15 })
        .tint({ r: 255, g: 245, b: 230 });

    case "cyberpunk":
    case "neon":
      // Cyberpunk neon effect
      return pipeline
        .modulate({ saturation: 1.4 })
        .tint({ r: 255, g: 0, b: 128 });

    default:
      throw new Error(
        `Unknown filter: ${filterName}. Available filters: grayscale, sepia, vintage, cool, warm, dramatic, soft, vivid, muted, bright, dark, negative, polaroid, noir, retro, cyberpunk`
      );
  }
}

// Get list of available color filters
export function getAvailableFilters() {
  return {
    basic: [
      {
        name: "grayscale",
        aliases: ["bw", "black-white"],
        description: "Convert to black and white",
      },
      { name: "sepia", aliases: [], description: "Classic sepia tone effect" },
      {
        name: "negative",
        aliases: ["invert"],
        description: "Color negative/invert",
      },
    ],
    tones: [
      { name: "cool", aliases: ["blue"], description: "Cool blue tint" },
      { name: "warm", aliases: ["orange"], description: "Warm orange tint" },
      { name: "vintage", aliases: [], description: "Vintage film look" },
      {
        name: "polaroid",
        aliases: [],
        description: "Polaroid instant photo style",
      },
    ],
    mood: [
      {
        name: "dramatic",
        aliases: ["high-contrast"],
        description: "High contrast and saturation",
      },
      {
        name: "soft",
        aliases: ["dreamy"],
        description: "Soft, dreamy effect with slight blur",
      },
      {
        name: "dark",
        aliases: ["moody"],
        description: "Dark, moody atmosphere",
      },
      { name: "bright", aliases: [], description: "Increased brightness" },
    ],
    saturation: [
      {
        name: "vivid",
        aliases: ["saturated"],
        description: "Highly saturated colors",
      },
      {
        name: "muted",
        aliases: ["desaturated"],
        description: "Reduced color saturation",
      },
    ],
    styles: [
      {
        name: "noir",
        aliases: ["film-noir"],
        description: "Film noir high contrast B&W",
      },
      { name: "retro", aliases: ["70s"], description: "Retro 1970s look" },
      {
        name: "cyberpunk",
        aliases: ["neon"],
        description: "Cyberpunk neon effect",
      },
    ],
  };
}
