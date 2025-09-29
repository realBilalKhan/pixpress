// utils/meme.js
import sharp from "sharp";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import { fileURLToPath } from "url";
import { access, constants } from "fs/promises";
import {
  validateInput,
  generateOutputPath,
  handleError,
  displayOutputLocation,
  initializePixpressDirectory,
} from "./helpers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const memeTemplates = {
  drake: {
    name: "Drake",
    description: "Drake pointing/rejecting meme format",
    templateImage: path.join(__dirname, "../assets/templates/drake.jpg"),
    textAreas: [
      {
        id: "reject",
        x: 670, // Move right
        y: 10, // Move down
        width: 500, // Make wider
        height: 200, // Make taller
        align: "center",
        valign: "middle",
      },
      {
        id: "approve",
        x: 670, // Move right
        y: 700, // Move down
        width: 500, // Make wider
        height: 200, // Make taller
        align: "center",
        valign: "middle",
      },
    ],
    defaultStyle: "modern",
    positions: ["Top text (reject)", "Bottom text (approve)"],
  },

  button: {
    name: "Two Buttons",
    description: "Sweating guy choosing between two buttons",
    templateImage: path.join(__dirname, "../assets/templates/button.jpg"),
    textAreas: [
      {
        id: "left-button",
        x: 25,
        y: 80,
        width: 120,
        height: 80,
        align: "center",
        valign: "middle",
        rotation: -15,
      },
      {
        id: "right-button",
        x: 200,
        y: 60,
        width: 120,
        height: 80,
        align: "center",
        valign: "middle",
        rotation: 15,
      },
    ],
    defaultStyle: "minimal",
    positions: ["Left button", "Right button"],
  },

  woman_cat: {
    name: "Woman Yelling at Cat",
    description: "Woman pointing and confused cat at dinner table",
    templateImage: path.join(__dirname, "../assets/templates/woman_cat.jpg"),
    textAreas: [
      {
        id: "woman",
        x: 50,
        y: 30,
        width: 230,
        height: 100,
        align: "center",
        valign: "top",
      },
      {
        id: "cat",
        x: 320,
        y: 30,
        width: 230,
        height: 100,
        align: "center",
        valign: "top",
      },
    ],
    defaultStyle: "twitter",
    positions: ["Woman (left)", "Cat (right)"],
  },

  expanding: {
    name: "Expanding Brain",
    description: "Brain expanding with increasingly enlightened ideas",
    templateImage: path.join(__dirname, "../assets/templates/expanding.jpg"),
    textAreas: [
      {
        id: "brain1",
        x: 200,
        y: 50,
        width: 300,
        height: 80,
        align: "left",
        valign: "middle",
      },
      {
        id: "brain2",
        x: 200,
        y: 150,
        width: 300,
        height: 80,
        align: "left",
        valign: "middle",
      },
      {
        id: "brain3",
        x: 200,
        y: 250,
        width: 300,
        height: 80,
        align: "left",
        valign: "middle",
      },
      {
        id: "brain4",
        x: 200,
        y: 350,
        width: 300,
        height: 80,
        align: "left",
        valign: "middle",
      },
    ],
    defaultStyle: "modern",
    positions: [
      "Brain 1 (basic)",
      "Brain 2 (better)",
      "Brain 3 (advanced)",
      "Brain 4 (enlightened)",
    ],
  },

  distracted: {
    name: "Distracted Boyfriend",
    description: "Guy looking at another girl while his girlfriend looks upset",
    templateImage: path.join(__dirname, "../assets/templates/distracted.jpg"),
    textAreas: [
      {
        id: "girlfriend",
        x: 50,
        y: 30,
        width: 150,
        height: 80,
        align: "center",
        valign: "top",
      },
      {
        id: "boyfriend",
        x: 200,
        y: 30,
        width: 150,
        height: 80,
        align: "center",
        valign: "top",
      },
      {
        id: "other-girl",
        x: 350,
        y: 30,
        width: 150,
        height: 80,
        align: "center",
        valign: "top",
      },
    ],
    defaultStyle: "twitter",
    positions: [
      "Girlfriend (left)",
      "Boyfriend (center)",
      "Other girl (right)",
    ],
  },

  spongebob: {
    name: "Mocking SpongeBob",
    description: "Alternating caps text for mocking tone",
    templateImage: path.join(__dirname, "../assets/templates/spongebob.jpg"),
    textAreas: [
      {
        id: "bottom",
        x: 0,
        y: -80,
        width: "100%",
        height: 80,
        align: "center",
        valign: "bottom",
      },
    ],
    defaultStyle: "impact",
    special: "alternating-caps",
    positions: ["Mocking text"],
  },

  change: {
    name: "Change My Mind",
    description: "Steven Crowder sitting at table with sign",
    templateImage: path.join(__dirname, "../assets/templates/change.jpg"),
    textAreas: [
      {
        id: "sign",
        x: 150,
        y: 200,
        width: 300,
        height: 100,
        align: "center",
        valign: "middle",
      },
    ],
    defaultStyle: "modern",
    positions: ["Sign text"],
  },

  stonks: {
    name: "Stonks",
    description: "Business man with arrow graph",
    templateImage: path.join(__dirname, "../assets/templates/stonks.jpg"),
    textAreas: [
      {
        id: "label",
        x: 0,
        y: -60,
        width: "100%",
        height: 60,
        align: "center",
        valign: "bottom",
      },
    ],
    defaultStyle: "impact",
    positions: ["Label text"],
  },

  butterfly: {
    name: "Is This a Pigeon?",
    description: "Anime guy mistaking butterfly for pigeon",
    templateImage: path.join(__dirname, "../assets/templates/butterfly.jpg"),
    textAreas: [
      {
        id: "butterfly",
        x: 100,
        y: 50,
        width: 150,
        height: 60,
        align: "center",
        valign: "top",
      },
      {
        id: "person",
        x: 300,
        y: 200,
        width: 150,
        height: 60,
        align: "center",
        valign: "middle",
      },
      {
        id: "caption",
        x: 0,
        y: -60,
        width: "100%",
        height: 60,
        align: "center",
        valign: "bottom",
      },
    ],
    defaultStyle: "twitter",
    positions: ["Butterfly label", "Person label", "Caption"],
  },

  classic: {
    name: "Classic Impact",
    description: "Traditional meme with top and bottom text",
    templateImage: null, // Use provided image
    textAreas: [
      {
        id: "top",
        x: 0,
        y: 20,
        width: "100%",
        height: 80,
        align: "center",
        valign: "top",
      },
      {
        id: "bottom",
        x: 0,
        y: -100,
        width: "100%",
        height: 80,
        align: "center",
        valign: "bottom",
      },
    ],
    defaultStyle: "impact",
    positions: ["Top text", "Bottom text"],
  },
};

const textStyles = {
  impact: {
    font: "Impact",
    fontSize: 42,
    strokeWidth: 4,
    strokeColor: "black",
    fillColor: "white",
    uppercase: true,
    fontWeight: "bold",
  },
  modern: {
    font: "Arial",
    fontSize: 36,
    strokeWidth: 0,
    fillColor: "white",
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 12,
    borderRadius: 6,
  },
  twitter: {
    font: "Helvetica",
    fontSize: 24,
    strokeWidth: 0,
    fillColor: "black",
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 10,
    borderRadius: 4,
  },
  minimal: {
    font: "Arial",
    fontSize: 20,
    strokeWidth: 0,
    fillColor: "white",
    dropShadow: {
      offsetX: 2,
      offsetY: 2,
      blur: 4,
      color: "rgba(0,0,0,0.8)",
    },
  },
  bold: {
    font: "Arial Black",
    fontSize: 42,
    strokeWidth: 4,
    strokeColor: "black",
    fillColor: "yellow",
    uppercase: true,
    fontWeight: "bold",
  },
  reddit: {
    font: "Arial",
    fontSize: 24,
    strokeWidth: 0,
    fillColor: "white",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 8,
    borderRadius: 4,
  },
};

export async function memeCommand(input, options) {
  await initializePixpressDirectory();

  const spinner = ora("Creating your meme...").start();

  try {
    const texts = options.text
      ? Array.isArray(options.text)
        ? options.text
        : [options.text]
      : [];

    const outputPath = await generateOutputPath(
      input || "meme",
      "memes",
      "_meme",
      ".jpg",
      options.output
    );

    let image;
    let metadata;

    spinner.text = "Applying meme magic...";

    // Check if using a template
    if (options.template && memeTemplates[options.template]) {
      const template = memeTemplates[options.template];

      if (template.templateImage && template.name !== "Classic Impact") {
        try {
          await access(template.templateImage, constants.F_OK);
          image = sharp(template.templateImage);
          spinner.text = `Using ${template.name} template...`;
        } catch (error) {
          // If template image not found, fall back to requiring input
          if (!input) {
            throw new Error(
              `Template image not found. Please ensure template assets exist.`
            );
          }
          spinner.text = "Template image not found, using your image...";
          await validateInput(input);
          image = sharp(input);
        }
      } else {
        if (!input) {
          throw new Error("Input image is required for classic meme format.");
        }
        await validateInput(input);
        image = sharp(input);
      }

      // Validate text count
      if (texts.length === 0) {
        throw new Error(
          `No text provided. The ${template.name} template requires ${template.textAreas.length} text input(s).`
        );
      }

      metadata = await image.metadata();

      // Apply template-specific text positioning
      image = await applyTemplateText(
        image,
        texts,
        template,
        options,
        metadata
      );
    } else {
      if (!input) {
        throw new Error(
          "Input image is required when not using a predefined template."
        );
      }
      await validateInput(input);
      image = sharp(input);
      metadata = await image.metadata();

      if (texts.length === 0) {
        throw new Error("No text provided for meme. Use --text option.");
      }

      const style = textStyles[options.style || "impact"];
      image = await applyClassicMemeText(image, texts, style, metadata);
    }

    // Apply filters for extra effect
    if (options.filter) {
      image = applyMemeFilter(image, options.filter);
    }

    // Save the meme
    await image
      .jpeg({ quality: parseInt(options.quality || 85), progressive: true })
      .toFile(outputPath);

    spinner.succeed(
      chalk.green("✓ Meme created successfully!") +
        chalk.dim(`\n  Template: ${options.template || "classic"}`) +
        chalk.dim(`\n  Style: ${options.style || "impact"}`)
    );

    displayOutputLocation(outputPath);
  } catch (error) {
    handleError(spinner, error);
  }
}

async function applyTemplateText(image, texts, template, options, metadata) {
  const { width, height } = metadata;
  const style = textStyles[options.style || template.defaultStyle];

  // Handle special text processing
  let processedTexts = [...texts];
  if (template.special === "alternating-caps" && texts[0]) {
    processedTexts[0] = toAlternatingCaps(texts[0]);
  }

  // Create text overlays for each defined area
  const textOverlays = [];
  const maxTexts = Math.min(processedTexts.length, template.textAreas.length);

  for (let i = 0; i < maxTexts; i++) {
    const text = processedTexts[i];
    const area = template.textAreas[i];

    if (!text || text.trim() === "") continue;

    try {
      const textOverlay = await createTextOverlay(
        text,
        area,
        style,
        width,
        height
      );

      textOverlays.push({
        input: textOverlay,
        left: 0,
        top: 0,
      });
    } catch (error) {
      console.warn(
        chalk.yellow(
          `Warning: Failed to create text overlay for area ${i}: ${error.message}`
        )
      );
    }
  }

  if (textOverlays.length > 0) {
    return image.composite(textOverlays);
  }

  return image;
}

async function createTextOverlay(text, area, style, imageWidth, imageHeight) {
  // Calculate absolute positions and dimensions
  const x = area.x;
  const y = area.y < 0 ? imageHeight + area.y : area.y;
  const width = area.width === "100%" ? imageWidth : area.width;
  const height = area.height;

  // Wrap text to fit area
  const lines = wrapTextToFit(text, width, style);
  const lineHeight = style.fontSize * 1.2;
  const totalTextHeight = lines.length * lineHeight;

  // Calculate starting Y position based on vertical alignment
  let startY;
  switch (area.valign) {
    case "top":
      startY = style.fontSize;
      break;
    case "bottom":
      startY = height - totalTextHeight + style.fontSize;
      break;
    case "middle":
    default:
      startY = (height - totalTextHeight) / 2 + style.fontSize;
      break;
  }

  // Create SVG for the text
  const svgElements = [];

  lines.forEach((line, index) => {
    const lineY = startY + index * lineHeight;
    let textX;

    switch (area.align) {
      case "left":
        textX = 20;
        break;
      case "right":
        textX = width - 20;
        break;
      case "center":
      default:
        textX = width / 2;
        break;
    }

    svgElements.push(createStyledTextElement(line, textX, lineY, style, area));
  });

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="drop-shadow">
          <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.8"/>
        </filter>
      </defs>
      ${svgElements.join("")}
    </svg>
  `;

  // Create the overlay
  const overlay = await sharp(Buffer.from(svg)).png().toBuffer();

  const canvas = sharp({
    create: {
      width: imageWidth,
      height: imageHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  return canvas
    .composite([
      {
        input: overlay,
        left: Math.max(0, x),
        top: Math.max(0, y),
      },
    ])
    .png()
    .toBuffer();
}

function createStyledTextElement(text, x, y, style, area) {
  const processedText = style.uppercase ? text.toUpperCase() : text;
  const rotation = area.rotation ? `rotate(${area.rotation} ${x} ${y})` : "";

  let element = "";

  // Add background if specified
  if (style.backgroundColor) {
    const padding = style.padding || 0;
    const textWidth = estimateTextWidth(processedText, style);
    const bgX = x - textWidth / 2 - padding;
    const bgY = y - style.fontSize + 5 - padding;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = style.fontSize + padding * 2;
    const radius = style.borderRadius || 0;

    element += `
      <rect x="${bgX}" y="${bgY}" 
            width="${bgWidth}" height="${bgHeight}"
            fill="${style.backgroundColor}" 
            rx="${radius}" ry="${radius}"/>
    `;
  }

  // Add drop shadow if specified
  if (style.dropShadow) {
    const shadow = style.dropShadow;
    element += `
      <text x="${x + shadow.offsetX}" y="${y + shadow.offsetY}" 
            font-family="${style.font}" 
            font-size="${style.fontSize}px"
            font-weight="${style.fontWeight || "normal"}"
            text-anchor="${getTextAnchor(area.align)}"
            fill="${shadow.color}"
            transform="${rotation}">
        ${escapeXml(processedText)}
      </text>
    `;
  }

  // Add main text with stroke
  if (style.strokeWidth > 0) {
    element += `
      <text x="${x}" y="${y}" 
            font-family="${style.font}" 
            font-size="${style.fontSize}px"
            font-weight="${style.fontWeight || "bold"}"
            text-anchor="${getTextAnchor(area.align)}"
            stroke="${style.strokeColor}" 
            stroke-width="${style.strokeWidth}"
            fill="${style.fillColor}"
            stroke-linejoin="round"
            stroke-linecap="round"
            paint-order="stroke fill"
            transform="${rotation}">
        ${escapeXml(processedText)}
      </text>
    `;
  } else {
    // Simple text without stroke
    element += `
      <text x="${x}" y="${y}" 
            font-family="${style.font}" 
            font-size="${style.fontSize}px"
            font-weight="${style.fontWeight || "normal"}"
            text-anchor="${getTextAnchor(area.align)}"
            fill="${style.fillColor}"
            transform="${rotation}"
            ${style.dropShadow ? 'filter="url(#drop-shadow)"' : ""}>
        ${escapeXml(processedText)}
      </text>
    `;
  }

  return element;
}

function getTextAnchor(align) {
  switch (align) {
    case "left":
      return "start";
    case "right":
      return "end";
    case "center":
    default:
      return "middle";
  }
}

function wrapTextToFit(text, maxWidth, style) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const estimatedWidth = estimateTextWidth(testLine, style);

    if (estimatedWidth <= maxWidth - 40) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text]; // Fallback to original text if wrapping fails
}

function estimateTextWidth(text, style) {
  return text.length * style.fontSize * 0.6;
}

async function applyClassicMemeText(image, texts, style, metadata) {
  const { width, height } = metadata;

  // Create text overlays for top/bottom format
  const textOverlays = [];

  if (texts[0]) {
    // Top text
    const topOverlay = await createClassicTextOverlay(
      texts[0],
      width,
      height,
      style,
      "top"
    );
    textOverlays.push({
      input: topOverlay,
      left: 0,
      top: 0,
    });
  }

  if (texts[1]) {
    // Bottom text
    const bottomOverlay = await createClassicTextOverlay(
      texts[1],
      width,
      height,
      style,
      "bottom"
    );
    textOverlays.push({
      input: bottomOverlay,
      left: 0,
      top: 0,
    });
  }

  if (textOverlays.length > 0) {
    return image.composite(textOverlays);
  }

  return image;
}

async function createClassicTextOverlay(text, width, height, style, position) {
  const processedText = style.uppercase ? text.toUpperCase() : text;
  const lines = wrapText(processedText, 30); // Wrap long text
  const lineHeight = style.fontSize * 1.2;

  // Calculate Y position based on position type
  let baseY;
  if (position === "top") {
    baseY = style.fontSize + 20;
  } else {
    baseY = height - lineHeight * lines.length - 20;
  }

  let svgElements = [];

  lines.forEach((line, index) => {
    const lineY = baseY + index * lineHeight;
    const x = width / 2;

    if (style.strokeWidth > 0) {
      // Text with stroke
      svgElements.push(`
        <text x="${x}" y="${lineY}" 
              font-family="${style.font || "Impact"}" 
              font-size="${style.fontSize}px" 
              font-weight="bold"
              text-anchor="middle"
              stroke="${style.strokeColor}" 
              stroke-width="${style.strokeWidth}"
              fill="${style.fillColor}"
              stroke-linejoin="round"
              stroke-linecap="round"
              paint-order="stroke fill">
          ${escapeXml(line)}
        </text>`);
    } else if (style.backgroundColor) {
      // Text with background
      const padding = style.padding || 10;
      const textWidth = estimateTextWidth(line, style);
      const bgX = x - textWidth / 2 - padding;
      const bgY = lineY - style.fontSize + 5 - padding;
      const bgWidth = textWidth + padding * 2;
      const bgHeight = style.fontSize + padding * 2;

      svgElements.push(`
        <rect x="${bgX}" y="${bgY}" 
              width="${bgWidth}" height="${bgHeight}"
              fill="${style.backgroundColor}" 
              rx="4" ry="4"/>
        <text x="${x}" y="${lineY}" 
              font-family="${style.font || "Arial"}" 
              font-size="${style.fontSize}px"
              font-weight="bold"
              text-anchor="middle"
              fill="${style.fillColor}">
          ${escapeXml(line)}
        </text>`);
    } else {
      // Simple text
      svgElements.push(`
        <text x="${x}" y="${lineY}" 
              font-family="${style.font || "Arial"}" 
              font-size="${style.fontSize}px"
              font-weight="bold"
              text-anchor="middle"
              fill="${style.fillColor}">
          ${escapeXml(line)}
        </text>`);
    }
  });

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${svgElements.join("")}
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

function wrapText(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxChars) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text]; // Fallback
}

function toAlternatingCaps(text) {
  return text
    .split("")
    .map((char, index) =>
      index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
    )
    .join("");
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function applyMemeFilter(image, filterName) {
  switch (filterName.toLowerCase()) {
    case "deepfry":
      // Deep fried meme effect
      return image
        .modulate({ saturation: 2.0, brightness: 1.3 })
        .blur(0.5)
        .sharpen(3)
        .gamma(0.8);

    case "vintage":
      return image
        .modulate({ saturation: 0.8, hue: 20 })
        .tint({ r: 255, g: 240, b: 220 });

    case "cursed":
      // Cursed effect
      return image
        .modulate({ brightness: 0.7, saturation: 1.5, hue: 180 })
        .blur(1.5);

    case "radial":
      // Radial blur effect
      return image.blur(2);

    case "glitch":
      // Simple glitch effect
      return image.modulate({ hue: 30 }).sharpen(5);

    default:
      return image;
  }
}

export function getAvailableMemeTemplates() {
  const templates = {};
  Object.entries(memeTemplates).forEach(([key, template]) => {
    templates[key] = {
      ...template,
      textAreaCount: template.textAreas.length,
    };
  });
  return templates;
}

export function getAvailableTextStyles() {
  return textStyles;
}

export function getMemeFilters() {
  return [
    {
      name: "deepfry",
      description: "Deep fried meme effect - oversaturated and crispy",
    },
    { name: "vintage", description: "Vintage filter for nostalgic vibes" },
    { name: "cursed", description: "Cursed/distorted effect for chaos energy" },
    { name: "radial", description: "Radial blur for speed/motion effect" },
    { name: "glitch", description: "Glitch effect for tech/error aesthetic" },
  ];
}

export function getViralTips() {
  return [
    "🔥 Keep text short and punchy - less is more!",
    "😂 Reference current events or trending topics",
    "💯 Use relatable situations everyone understands",
    "⚡ Timing is everything - post when your audience is active",
    "🎯 Know your platform - what works on Reddit might not work on Instagram",
    "🔄 Iterate on successful formats but add your own twist",
    "📱 Optimize for mobile viewing - most memes are viewed on phones",
    "🎨 Contrast is key - make sure text is readable",
    "💬 Leave room for discussion - controversial takes get engagement",
    "🚀 Be first or be better - speed matters for trending topics",
  ];
}
