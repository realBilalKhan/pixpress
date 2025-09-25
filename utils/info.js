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

    // Get histogram data for color analysis
    spinner.text = "Analyzing color distribution...";
    const histogramData = await getHistogramData(input, metadata);

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

    // Color Analysis Section
    if (histogramData) {
      displayColorAnalysis(histogramData, metadata, options.verbose);
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

    // Color-based recommendations from histogram analysis
    if (histogramData) {
      displayColorRecommendations(histogramData, metadata);
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

// Generate comprehensive histogram data
async function getHistogramData(input, metadata) {
  try {
    const image = sharp(input);

    // Get basic statistics
    const stats = await image.stats();

    // Generate histograms for each channel
    const histogramPromises = [];

    // For grayscale images
    if (metadata.channels === 1) {
      histogramPromises.push(
        image
          .greyscale()
          .raw()
          .toBuffer({ resolveWithObject: true })
          .then(({ data, info }) => generateHistogramFromBuffer(data, 1))
      );
    } else {
      // For RGB images, extract each channel
      for (let i = 0; i < Math.min(3, metadata.channels); i++) {
        histogramPromises.push(
          image
            .extractChannel(i)
            .raw()
            .toBuffer({ resolveWithObject: true })
            .then(({ data, info }) => generateHistogramFromBuffer(data, 1))
        );
      }
    }

    const histograms = await Promise.all(histogramPromises);

    return {
      stats,
      histograms,
      channels: metadata.channels,
      isGrayscale: metadata.channels === 1,
    };
  } catch (error) {
    console.log(chalk.dim("   Note: Could not generate histogram data"));
    return null;
  }
}

// Generate histogram from raw buffer data
function generateHistogramFromBuffer(buffer, channels) {
  const histogram = new Array(256).fill(0);
  const totalPixels = buffer.length / channels;

  for (let i = 0; i < buffer.length; i += channels) {
    const value = buffer[i];
    histogram[value]++;
  }

  // Convert to percentages
  const percentages = histogram.map((count) => (count / totalPixels) * 100);

  // Find peaks and statistics
  const max = Math.max(...histogram);
  const maxIndex = histogram.indexOf(max);
  const mean =
    histogram.reduce((sum, count, index) => sum + index * count, 0) /
    totalPixels;

  return {
    histogram,
    percentages,
    max,
    maxIndex,
    mean: mean.toFixed(1),
    totalPixels,
  };
}

// Display color analysis section
function displayColorAnalysis(histogramData, metadata, verbose = false) {
  console.log(chalk.white.bold("\n🌈 Color Analysis:"));

  const { stats, histograms, isGrayscale } = histogramData;

  // Overall image statistics
  if (stats && stats.channels) {
    stats.channels.forEach((channel, index) => {
      const channelName = isGrayscale
        ? "Luminance"
        : ["Red", "Green", "Blue"][index] || `Channel ${index + 1}`;

      console.log(chalk.dim(`   ${channelName} channel:`));
      console.log(
        chalk.dim(
          `     • Min: ${channel.min} | Max: ${
            channel.max
          } | Mean: ${channel.mean.toFixed(1)}`
        )
      );
      console.log(
        chalk.dim(
          `     • Std Dev: ${channel.stdev.toFixed(1)} | Median: ${
            channel.median || "N/A"
          }`
        )
      );
    });
  }

  // Brightness analysis
  const brightness = calculateBrightness(stats);
  const brightnessDesc = getBrightnessDescription(brightness);
  console.log(
    chalk.dim(
      `   Overall brightness: ${brightness.toFixed(1)}/255 (${brightnessDesc})`
    )
  );

  // Contrast analysis
  const contrast = calculateContrast(stats);
  const contrastDesc = getContrastDescription(contrast);
  console.log(
    chalk.dim(`   Contrast level: ${contrast.toFixed(1)} (${contrastDesc})`)
  );

  // Color distribution
  if (!isGrayscale && histograms.length >= 3) {
    const dominantColors = analyzeDominantColors(histograms);
    console.log(chalk.dim(`   Color characteristics: ${dominantColors}`));
  }

  // Histogram visualization (if verbose)
  if (verbose) {
    displayHistogramVisualization(histograms, isGrayscale);
  }

  // Tonal distribution
  const tonalAnalysis = analyzeTonalDistribution(histograms, isGrayscale);
  console.log(chalk.dim(`   Tonal distribution: ${tonalAnalysis}`));
}

// Calculate overall image brightness
function calculateBrightness(stats) {
  if (!stats || !stats.channels) return 128;

  if (stats.channels.length === 1) {
    return stats.channels[0].mean;
  }

  // Use luminance formula for RGB: 0.299*R + 0.587*G + 0.114*B
  const r = stats.channels[0]?.mean || 0;
  const g = stats.channels[1]?.mean || 0;
  const b = stats.channels[2]?.mean || 0;

  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Calculate image contrast
function calculateContrast(stats) {
  if (!stats || !stats.channels) return 0;

  // Use standard deviation as a measure of contrast
  const totalStdev = stats.channels.reduce(
    (sum, channel) => sum + (channel.stdev || 0),
    0
  );
  return totalStdev / stats.channels.length;
}

// Get brightness description
function getBrightnessDescription(brightness) {
  if (brightness < 51) return "Very dark";
  if (brightness < 102) return "Dark";
  if (brightness < 153) return "Medium";
  if (brightness < 204) return "Bright";
  return "Very bright";
}

// Get contrast description
function getContrastDescription(contrast) {
  if (contrast < 20) return "Very low";
  if (contrast < 40) return "Low";
  if (contrast < 60) return "Medium";
  if (contrast < 80) return "High";
  return "Very high";
}

// Analyze dominant colors
function analyzeDominantColors(histograms) {
  if (histograms.length < 3) return "Cannot analyze";

  const [red, green, blue] = histograms;
  const redMean = parseFloat(red.mean);
  const greenMean = parseFloat(green.mean);
  const blueMean = parseFloat(blue.mean);

  // Find dominant channel
  const max = Math.max(redMean, greenMean, blueMean);
  const min = Math.min(redMean, greenMean, blueMean);
  const diff = max - min;

  if (diff < 15) {
    return "Neutral/balanced colors";
  } else if (redMean === max) {
    return diff > 30 ? "Strong red tones" : "Warm red tones";
  } else if (greenMean === max) {
    return diff > 30 ? "Strong green tones" : "Natural green tones";
  } else {
    return diff > 30 ? "Strong blue tones" : "Cool blue tones";
  }
}

// Analyze tonal distribution
function analyzeTonalDistribution(histograms, isGrayscale) {
  if (!histograms || histograms.length === 0) return "Cannot analyze";

  // Use first histogram (luminance for grayscale, red for RGB)
  const histogram = histograms[0].percentages;

  // Calculate distribution in shadows (0-85), midtones (85-170), highlights (170-255)
  const shadows = histogram.slice(0, 85).reduce((sum, val) => sum + val, 0);
  const midtones = histogram.slice(85, 170).reduce((sum, val) => sum + val, 0);
  const highlights = histogram
    .slice(170, 255)
    .reduce((sum, val) => sum + val, 0);

  const dominant = Math.max(shadows, midtones, highlights);

  if (dominant === shadows) {
    return `Shadow-heavy (${shadows.toFixed(1)}% shadows, ${midtones.toFixed(
      1
    )}% midtones, ${highlights.toFixed(1)}% highlights)`;
  } else if (dominant === highlights) {
    return `Highlight-heavy (${shadows.toFixed(1)}% shadows, ${midtones.toFixed(
      1
    )}% midtones, ${highlights.toFixed(1)}% highlights)`;
  } else {
    return `Balanced exposure (${shadows.toFixed(
      1
    )}% shadows, ${midtones.toFixed(1)}% midtones, ${highlights.toFixed(
      1
    )}% highlights)`;
  }
}

// Display ASCII histogram visualization
function displayHistogramVisualization(histograms, isGrayscale) {
  console.log(chalk.white.bold("\n📊 Histogram Visualization:"));

  const channelNames = isGrayscale ? ["Luminance"] : ["Red", "Green", "Blue"];
  const colors = isGrayscale
    ? [chalk.gray]
    : [chalk.red, chalk.green, chalk.blue];

  histograms.forEach((histogram, index) => {
    if (index >= channelNames.length) return;

    console.log(chalk.dim(`\n   ${channelNames[index]} Channel:`));

    // Create simplified histogram with 10 bins
    const simplifiedBins = 10;
    const binSize = 256 / simplifiedBins;
    const bins = new Array(simplifiedBins).fill(0);

    for (let i = 0; i < 256; i++) {
      const binIndex = Math.floor(i / binSize);
      if (binIndex < simplifiedBins) {
        bins[binIndex] += histogram.percentages[i];
      }
    }

    const maxBin = Math.max(...bins);
    const scale = 40; // Max bar length

    bins.forEach((value, binIndex) => {
      const barLength = Math.round((value / maxBin) * scale);
      const bar = "█".repeat(Math.max(1, barLength));
      const coloredBar = colors[index] ? colors[index](bar) : bar;
      const range = `${Math.round(binIndex * binSize)}-${Math.round(
        (binIndex + 1) * binSize - 1
      )}`;
      console.log(
        chalk.dim(
          `     ${range.padStart(7)}: ${coloredBar} ${value.toFixed(1)}%`
        )
      );
    });
  });
}

// Display color-based recommendations
function displayColorRecommendations(histogramData, metadata) {
  const { stats } = histogramData;

  if (!stats || !stats.channels) return;

  // Check for potential issues and make recommendations
  const brightness = calculateBrightness(stats);
  const contrast = calculateContrast(stats);

  if (brightness < 30) {
    console.log(
      chalk.yellow(`   • Image appears very dark - consider brightening`)
    );
  } else if (brightness > 225) {
    console.log(
      chalk.yellow(
        `   • Image appears overexposed - may benefit from darkening`
      )
    );
  }

  if (contrast < 20) {
    console.log(
      chalk.yellow(`   • Low contrast detected - consider increasing contrast`)
    );
  } else if (contrast > 80) {
    console.log(chalk.yellow(`   • Very high contrast - may appear harsh`));
  }

  // Check for clipping
  const hasClipping = stats.channels.some(
    (channel) =>
      (channel.min === 0 && channel.max === 255) || channel.min === channel.max
  );

  if (hasClipping) {
    console.log(
      chalk.yellow(
        `   • Potential clipping detected - check shadows/highlights`
      )
    );
  }
}

// Helper function to calculate GCD
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
