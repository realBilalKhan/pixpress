// utils/info.js
import sharp from "sharp";
import chalk from "chalk";
import ora from "ora";
import fs from "fs-extra";
import { validateInput, handleError, formatFileSize } from "./helpers.js";

export async function infoCommand(input, options = {}) {
  const spinner = ora("Reading image information...").start();

  try {
    await validateInput(input);

    const metadata = await sharp(input).metadata();
    const stats = await fs.stat(input);

    spinner.stop();

    // Display comprehensive image information
    console.log(chalk.cyan.bold("\n📊 Image Information"));
    console.log(chalk.gray("─".repeat(50)));

    // File Information Section
    console.log(chalk.white.bold("📁 File Details:"));
    console.log(chalk.dim(`   Path: ${input}`));
    console.log(
      chalk.dim(
        `   Size: ${formatFileSize(
          stats.size
        )} (${stats.size.toLocaleString()} bytes)`
      )
    );
    console.log(
      chalk.dim(
        `   Created: ${stats.birthtime.toLocaleDateString()} ${stats.birthtime.toLocaleTimeString()}`
      )
    );
    console.log(
      chalk.dim(
        `   Modified: ${stats.mtime.toLocaleDateString()} ${stats.mtime.toLocaleTimeString()}`
      )
    );

    // Image Properties Section
    console.log(chalk.white.bold("\n🖼️  Image Properties:"));
    console.log(
      chalk.dim(`   Format: ${metadata.format?.toUpperCase() || "Unknown"}`)
    );
    console.log(
      chalk.dim(
        `   Dimensions: ${metadata.width?.toLocaleString()} × ${metadata.height?.toLocaleString()} pixels`
      )
    );

    if (metadata.width && metadata.height) {
      const megapixels = ((metadata.width * metadata.height) / 1000000).toFixed(
        2
      );
      console.log(chalk.dim(`   Resolution: ${megapixels} megapixels`));

      const gcd = getGCD(metadata.width, metadata.height);
      const aspectWidth = metadata.width / gcd;
      const aspectHeight = metadata.height / gcd;
      console.log(chalk.dim(`   Aspect ratio: ${aspectWidth}:${aspectHeight}`));

      const aspectName = getAspectRatioName(aspectWidth, aspectHeight);
      if (aspectName) {
        console.log(chalk.dim(`   Common name: ${aspectName}`));
      }
    }

    console.log(
      chalk.dim(
        `   Channels: ${metadata.channels} (${getChannelDescription(
          metadata.channels
        )})`
      )
    );
    console.log(
      chalk.dim(`   Bit depth: ${metadata.depth || "Unknown"} bits per channel`)
    );
    console.log(chalk.dim(`   Color space: ${metadata.space || "Unknown"}`));

    if (metadata.density) {
      console.log(chalk.dim(`   DPI: ${metadata.density}`));
    }

    if (metadata.hasAlpha) {
      console.log(
        chalk.dim(
          `   Transparency: ${chalk.green("Yes")} (alpha channel present)`
        )
      );
    } else {
      console.log(chalk.dim(`   Transparency: ${chalk.red("No")}`));
    }

    // Orientation handling
    if (metadata.orientation && metadata.orientation !== 1) {
      console.log(
        chalk.dim(
          `   EXIF Orientation: ${
            metadata.orientation
          } (${getOrientationDescription(metadata.orientation)})`
        )
      );
    }

    // Compression and Quality Information
    console.log(chalk.white.bold("\n📊 Compression Details:"));

    if (metadata.width && metadata.height) {
      const uncompressedSize =
        metadata.width * metadata.height * (metadata.channels || 3);
      const compressionRatio = (
        ((uncompressedSize - stats.size) / uncompressedSize) *
        100
      ).toFixed(1);
      console.log(chalk.dim(`   Compression ratio: ${compressionRatio}%`));
      console.log(
        chalk.dim(`   Uncompressed size: ${formatFileSize(uncompressedSize)}`)
      );

      // Bytes per pixel
      const bytesPerPixel = (
        stats.size /
        (metadata.width * metadata.height)
      ).toFixed(2);
      console.log(chalk.dim(`   Bytes per pixel: ${bytesPerPixel}`));
    }

    // Format-specific information
    if (metadata.format === "jpeg") {
      console.log(
        chalk.dim(`   Format notes: Lossy compression, no transparency support`)
      );
    } else if (metadata.format === "png") {
      console.log(
        chalk.dim(
          `   Format notes: Lossless compression, supports transparency`
        )
      );
    } else if (metadata.format === "webp") {
      console.log(
        chalk.dim(`   Format notes: Modern format, excellent compression`)
      );
    } else if (metadata.format === "gif") {
      console.log(
        chalk.dim(`   Format notes: Supports animation, limited to 256 colors`)
      );
    }

    // EXIF Information
    if (metadata.exif && metadata.exif.length > 0) {
      console.log(chalk.white.bold("\n📷 EXIF Data:"));
      console.log(
        chalk.dim(`   EXIF data present (${metadata.exif.length} bytes)`)
      );

      try {
        const image = sharp(input);
        const exifData = await image.metadata();

        if (exifData.orientation) {
          console.log(
            chalk.dim(
              `   Camera orientation: ${getOrientationDescription(
                exifData.orientation
              )}`
            )
          );
        }
      } catch (e) {
        console.log(
          chalk.dim(`   EXIF data present but detailed parsing not available`)
        );
      }
    }

    // Color Profile Information
    if (metadata.icc && metadata.icc.length > 0) {
      console.log(chalk.white.bold("\n🎨 Color Profile:"));
      console.log(
        chalk.dim(`   ICC profile present (${metadata.icc.length} bytes)`)
      );
      console.log(chalk.dim(`   Color management: Enabled`));
    } else {
      console.log(chalk.white.bold("\n🎨 Color Profile:"));
      console.log(chalk.dim(`   ICC profile: Not present`));
      console.log(chalk.dim(`   Color management: Basic (sRGB assumed)`));
    }

    // Usage Recommendations
    console.log(chalk.white.bold("\n💡 Usage Recommendations:"));

    if (metadata.width && metadata.height) {
      // Size recommendations
      if (metadata.width > 4000 || metadata.height > 4000) {
        console.log(
          chalk.yellow(
            `   • Very high resolution - consider resizing for web use`
          )
        );
      } else if (metadata.width < 500 && metadata.height < 500) {
        console.log(
          chalk.yellow(
            `   • Low resolution - may appear pixelated when enlarged`
          )
        );
      }

      // Format recommendations
      if (metadata.format === "bmp" || metadata.format === "tiff") {
        console.log(
          chalk.yellow(
            `   • Consider converting to PNG or JPEG for smaller file size`
          )
        );
      }

      if (
        metadata.format === "png" &&
        !metadata.hasAlpha &&
        stats.size > 500000
      ) {
        console.log(
          chalk.yellow(
            `   • Large PNG without transparency - JPEG might be more efficient`
          )
        );
      }

      if (metadata.format === "gif" && metadata.channels > 1) {
        console.log(
          chalk.yellow(`   • Static GIF - PNG or JPEG would be more efficient`)
        );
      }
    }

    // Web usage info
    const isWebFriendly = ["jpeg", "jpg", "png", "webp", "gif"].includes(
      metadata.format?.toLowerCase()
    );
    if (isWebFriendly) {
      console.log(chalk.green(`   • Format is web-friendly`));
    } else {
      console.log(
        chalk.yellow(
          `   • Consider converting to JPEG, PNG, or WebP for web use`
        )
      );
    }

    console.log("");
  } catch (error) {
    handleError(spinner, error);
  }
}

// Helper function to calculate Greatest Common Divisor
function getGCD(a, b) {
  return b === 0 ? a : getGCD(b, a % b);
}

// Helper function to describe color channels
function getChannelDescription(channels) {
  switch (channels) {
    case 1:
      return "Grayscale";
    case 2:
      return "Grayscale + Alpha";
    case 3:
      return "RGB";
    case 4:
      return "RGBA or CMYK";
    default:
      return `${channels} channels`;
  }
}

// Helper function to get common aspect ratio names
function getAspectRatioName(width, height) {
  const ratio = width / height;
  const tolerance = 0.02;

  const commonRatios = [
    { ratio: 1, name: "Square (1:1)" },
    { ratio: 4 / 3, name: "Traditional TV (4:3)" },
    { ratio: 3 / 2, name: "35mm Film (3:2)" },
    { ratio: 16 / 10, name: "Widescreen (16:10)" },
    { ratio: 16 / 9, name: "HD Video (16:9)" },
    { ratio: 21 / 9, name: "Ultra-wide (21:9)" },
    { ratio: 2 / 1, name: "Panoramic (2:1)" },
  ];

  for (const common of commonRatios) {
    if (Math.abs(ratio - common.ratio) < tolerance) {
      return common.name;
    }
  }

  return null;
}

// Helper function to describe EXIF orientation
function getOrientationDescription(orientation) {
  const orientations = {
    1: "Normal",
    2: "Flipped horizontally",
    3: "Rotated 180°",
    4: "Flipped vertically",
    5: "Rotated 90° CCW and flipped",
    6: "Rotated 90° CW",
    7: "Rotated 90° CW and flipped",
    8: "Rotated 90° CCW",
  };

  return orientations[orientation] || `Unknown (${orientation})`;
}
