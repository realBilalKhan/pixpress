// utils/filters.js
import sharp from "sharp";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import { validateInput, generateOutputPath, handleError } from "./helpers.js";

export async function filtersCommand(input, options) {
  const spinner = ora("Applying color filter...").start();

  try {
    await validateInput(input);

    const filterName = options.filter.toLowerCase();
    const availableFilters = getAllFilterNames();

    if (!availableFilters.includes(filterName)) {
      throw new Error(
        `Unknown filter: ${filterName}. Use 'pixpress filters --list' to see available filters.`
      );
    }

    const outputPath =
      options.output || generateOutputPath(input, `_${filterName}`);

    const metadata = await sharp(input).metadata();
    spinner.text = `Applying ${filterName} filter to ${metadata.width}x${metadata.height} image`;

    let pipeline = sharp(input);

    // Apply the selected filter
    pipeline = applyColorFilter(pipeline, filterName, options);

    // Preserve original format
    const inputFormat = metadata.format;
    const outputExt = outputPath.split(".").pop().toLowerCase();

    // Apply format-specific optimizations based on output format
    if (outputExt === "jpg" || outputExt === "jpeg") {
      pipeline = pipeline.jpeg({
        quality: parseInt(options.quality || 85),
        progressive: true,
      });
    } else if (outputExt === "png") {
      pipeline = pipeline.png({
        progressive: true,
        compressionLevel: 6,
      });
    } else if (outputExt === "webp") {
      pipeline = pipeline.webp({
        quality: parseInt(options.quality || 85),
        effort: 4,
      });
    }

    await pipeline.toFile(outputPath);

    // Show results
    const inputSize = (await fs.stat(input)).size;
    const outputSize = (await fs.stat(outputPath)).size;
    const filterInfo = getFilterDescription(filterName);

    spinner.succeed(
      chalk.green("✓ Color filter applied successfully!") +
        chalk.dim(`\n  Filter: ${filterName} - ${filterInfo.description}`) +
        chalk.dim(
          `\n  Input: ${metadata.width}x${
            metadata.height
          } ${inputFormat?.toUpperCase()}`
        ) +
        chalk.dim(`\n  Size: ${inputSize} bytes → ${outputSize} bytes`) +
        chalk.dim(`\n  Saved to: ${outputPath}`)
    );
  } catch (error) {
    handleError(spinner, error);
  }
}

// List all available filters
export function listFilters() {
  const filters = getAvailableFilters();

  console.log(chalk.cyan.bold("\n🎨 Available Color Filters & Effects\n"));

  Object.entries(filters).forEach(([category, filterList]) => {
    console.log(
      chalk.white.bold(
        `${getCategoryIcon(category)} ${
          category.charAt(0).toUpperCase() + category.slice(1)
        }:`
      )
    );

    filterList.forEach((filter) => {
      const aliases =
        filter.aliases.length > 0
          ? chalk.dim(` (aliases: ${filter.aliases.join(", ")})`)
          : "";
      console.log(
        chalk.dim(
          `  • ${chalk.cyan(filter.name)}${aliases} - ${filter.description}`
        )
      );
    });

    console.log("");
  });

  console.log(chalk.yellow("💡 Usage examples:"));
  console.log(chalk.dim("  pixpress filters image.jpg --filter grayscale"));
  console.log(
    chalk.dim(
      "  pixpress filters photo.png --filter vintage --output vintage_photo.jpg"
    )
  );
  console.log(chalk.dim("  pixpress batch filters ./photos --filter sepia"));
  console.log("");
}

function getCategoryIcon(category) {
  const icons = {
    basic: "⚫",
    tones: "🌡️",
    mood: "🎭",
    saturation: "🌈",
    styles: "🎬",
  };
  return icons[category] || "🎨";
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
      return pipeline.recomb([
        [0.393, 0.769, 0.189],
        [0.349, 0.686, 0.168],
        [0.272, 0.534, 0.131],
      ]);

    case "vintage":
      return pipeline
        .modulate({
          saturation: 0.8,
          brightness: 1.05,
          hue: 15,
        })
        .tint({ r: 255, g: 240, b: 220 });

    case "cool":
    case "blue":
      return pipeline.tint({ r: 200, g: 220, b: 255 });

    case "warm":
    case "orange":
      return pipeline.tint({ r: 255, g: 220, b: 180 });

    case "dramatic":
    case "high-contrast":
      return pipeline
        .normalize()
        .modulate({ saturation: 1.3, brightness: 1.05 });

    case "soft":
    case "dreamy":
      return pipeline.modulate({ saturation: 0.9, brightness: 1.15 }).blur(0.3);

    case "vivid":
    case "saturated":
      return pipeline.modulate({ saturation: 1.4 });

    case "muted":
    case "desaturated":
      return pipeline.modulate({ saturation: 0.6 });

    case "bright":
      return pipeline.modulate({ brightness: 1.25 });

    case "dark":
    case "moody":
      return pipeline.modulate({ brightness: 0.8, saturation: 1.15 });

    case "negative":
    case "invert":
      return pipeline.negate();

    case "polaroid":
      return pipeline
        .modulate({ saturation: 0.85, brightness: 1.1 })
        .tint({ r: 255, g: 250, b: 240 })
        .gamma(1.1);

    case "noir":
    case "film-noir":
      return pipeline
        .grayscale()
        .normalize()
        .modulate({ brightness: 0.85 })
        .gamma(1.3);

    case "retro":
    case "70s":
      return pipeline
        .modulate({ saturation: 1.1, hue: 10 })
        .tint({ r: 255, g: 245, b: 230 });

    case "cyberpunk":
    case "neon":
      return pipeline
        .modulate({ saturation: 1.3, brightness: 1.1 })
        .tint({ r: 255, g: 100, b: 200 });

    default:
      throw new Error(`Unknown filter: ${filterName}`);
  }
}

// Get list of available color filters organized by category
export function getAvailableFilters() {
  return {
    basic: [
      {
        name: "grayscale",
        aliases: ["bw", "black-white", "greyscale"],
        description: "Convert to black and white",
      },
      { name: "sepia", aliases: [], description: "Classic sepia tone effect" },
      {
        name: "negative",
        aliases: ["invert"],
        description: "Color negative/invert effect",
      },
    ],
    tones: [
      { name: "cool", aliases: ["blue"], description: "Cool blue tint" },
      { name: "warm", aliases: ["orange"], description: "Warm orange tint" },
      {
        name: "vintage",
        aliases: [],
        description: "Vintage film look with warm tones",
      },
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
        description: "High contrast and enhanced saturation",
      },
      {
        name: "soft",
        aliases: ["dreamy"],
        description: "Soft, dreamy effect with subtle blur",
      },
      {
        name: "dark",
        aliases: ["moody"],
        description: "Dark, moody atmosphere",
      },
      {
        name: "bright",
        aliases: [],
        description: "Increased brightness and luminosity",
      },
    ],
    saturation: [
      {
        name: "vivid",
        aliases: ["saturated"],
        description: "Highly saturated, vibrant colors",
      },
      {
        name: "muted",
        aliases: ["desaturated"],
        description: "Reduced color saturation for subtle look",
      },
    ],
    styles: [
      {
        name: "noir",
        aliases: ["film-noir"],
        description: "Film noir high contrast black & white",
      },
      {
        name: "retro",
        aliases: ["70s"],
        description: "Retro 1970s warm color palette",
      },
      {
        name: "cyberpunk",
        aliases: ["neon"],
        description: "Cyberpunk neon magenta effect",
      },
    ],
  };
}

// Get all filter names for validation
function getAllFilterNames() {
  const filters = getAvailableFilters();
  const names = [];

  Object.values(filters).forEach((category) => {
    category.forEach((filter) => {
      names.push(filter.name);
      names.push(...filter.aliases);
    });
  });

  return names;
}

// Get description for a specific filter
function getFilterDescription(filterName) {
  const filters = getAvailableFilters();

  for (const category of Object.values(filters)) {
    for (const filter of category) {
      if (filter.name === filterName || filter.aliases.includes(filterName)) {
        return filter;
      }
    }
  }

  return { description: "Unknown filter" };
}
