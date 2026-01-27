// src/lib/services/url-analyzer.ts
// Production-grade URL analyzer that extracts site content, colors, and screenshots
//
// PRODUCTION SETUP:
// 1. Add playwright-core as a production dependency:
//    npm install playwright-core
//
// 2. Set BROWSERLESS_API_KEY environment variable for cloud browser service
//    Without this, falls back to local browser (dev only)
//
// 3. Ensure the 'video-bundles' storage bucket exists in Supabase with public access

import { chromium, type Browser, type Page } from 'playwright-core';
import Anthropic from '@anthropic-ai/sdk';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { validateUrlForSSRF } from './url-validator';
import type {
  SiteAnalysis,
  ColorPalette,
  SiteContent,
  SiteScreenshots,
} from '@/types/video-bundle';

// ============================================
// Anthropic Client (lazy-initialized for AI content extraction)
// ============================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) {
    return null;
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// ============================================
// Types
// ============================================

export interface UrlAnalyzerOptions {
  userId: string;
  bundleId?: string; // Optional - generated if not provided
  timeout?: number; // Default 30000ms
}

interface ExtractionResult<T> {
  success: boolean;
  data: T | null;
  error?: string;
}

// ============================================
// Constants
// ============================================

const DEFAULT_TIMEOUT = 30000;
const VIEWPORT = { width: 1920, height: 1080 };

// Selector patterns for content extraction (in priority order)
const SELECTORS = {
  headline: [
    'h1',
    '.hero h1',
    '[class*="hero"] h1',
    '.headline',
    '[class*="headline"]',
    'header h1',
    '.banner h1',
    '[class*="banner"] h1',
  ],
  subheadline: [
    '.hero h2',
    '[class*="hero"] h2',
    '.hero p',
    '[class*="hero"] p:first-of-type',
    '.subtitle',
    '.subheadline',
    '[class*="subtitle"]',
    '[class*="subheadline"]',
    '.tagline',
    'h1 + p',
    'h1 + h2',
  ],
  features: [
    '.features li',
    '[class*="feature"] li',
    '.features h3',
    '[class*="feature"] h3',
    '.benefits li',
    '[class*="benefit"] li',
    '[class*="feature-card"] h3',
    '[class*="feature-item"] h3',
    '.feature-title',
    '[class*="features"] .title',
  ],
  stats: [
    '[class*="stat"]',
    '.metric',
    '.number',
    '[class*="metric"]',
    '[class*="counter"]',
    '.stats-item',
    '[class*="kpi"]',
  ],
  cta: [
    'button[class*="primary"]',
    'a[class*="button"][class*="primary"]',
    '.hero button',
    '.hero a[class*="button"]',
    '[class*="hero"] button',
    '[class*="hero"] a[class*="cta"]',
    '.cta',
    'a[class*="cta"]',
    'button',
    'a[class*="button"]',
  ],
  logo: [
    'header img[alt*="logo" i]',
    'header img[src*="logo" i]',
    '.logo img',
    '[class*="logo"] img',
    'header svg[class*="logo"]',
    'nav img:first-of-type',
    'header a:first-of-type img',
    'img[alt*="logo" i]',
    'img[src*="logo" i]',
  ],
};

// Section selectors for targeted screenshots
const SECTION_SELECTORS = {
  hero: ['.hero', '[class*="hero"]', 'header + section', 'main > section:first-child'],
  features: ['.features', '[class*="features"]', '#features', '[id*="feature"]'],
  footer: ['footer', '[class*="footer"]', '#footer'],
};

// ============================================
// Logging
// ============================================

function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logData = data ? ` ${JSON.stringify(data)}` : '';
  console[level](`[UrlAnalyzer] [${timestamp}] ${message}${logData}`);
}

// ============================================
// Color Extraction
// ============================================

async function extractColors(page: Page): Promise<ExtractionResult<ColorPalette>> {
  try {
    const colors = await page.evaluate(() => {
      // Helper to convert rgb/rgba to hex
      function rgbToHex(rgb: string): string {
        // Handle rgba and rgb formats
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return rgb; // Return as-is if not rgb format

        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);

        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
      }

      // Helper to check if color is valid (not transparent/inherit)
      function isValidColor(color: string): boolean {
        if (!color) return false;
        if (color === 'transparent' || color === 'inherit' || color === 'initial') return false;
        if (color.includes('rgba') && color.match(/rgba\([^)]+,\s*0\)/)) return false;
        return true;
      }

      // Get background color from body or html
      const bodyStyle = getComputedStyle(document.body);
      const htmlStyle = getComputedStyle(document.documentElement);
      let bgColor = bodyStyle.backgroundColor;
      if (!isValidColor(bgColor) || bgColor === 'rgba(0, 0, 0, 0)') {
        bgColor = htmlStyle.backgroundColor;
      }
      if (!isValidColor(bgColor) || bgColor === 'rgba(0, 0, 0, 0)') {
        bgColor = '#ffffff'; // Default to white
      }

      // Get text color from body
      let textColor = bodyStyle.color;
      if (!isValidColor(textColor)) {
        textColor = '#000000'; // Default to black
      }

      // Find primary color from header/nav or first prominent element
      let primaryColor = '#3b82f6'; // Default blue
      const header = document.querySelector('header, nav, [class*="header"], [class*="nav"]');
      if (header) {
        const headerStyle = getComputedStyle(header);
        if (isValidColor(headerStyle.backgroundColor) && headerStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          primaryColor = headerStyle.backgroundColor;
        }
      }

      // Find accent color from buttons or links
      let accentColor = '#10b981'; // Default green
      const buttons = document.querySelectorAll('button, a[class*="button"], [class*="btn"]');
      for (const btn of buttons) {
        const btnStyle = getComputedStyle(btn);
        if (isValidColor(btnStyle.backgroundColor) && btnStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          accentColor = btnStyle.backgroundColor;
          break;
        }
      }

      // Find secondary color from section backgrounds or cards
      let secondaryColor = '#f3f4f6'; // Default light gray
      const sections = document.querySelectorAll('section, [class*="section"], .card, [class*="card"]');
      for (const section of sections) {
        const sectionStyle = getComputedStyle(section);
        const bg = sectionStyle.backgroundColor;
        if (isValidColor(bg) && bg !== 'rgba(0, 0, 0, 0)' && bg !== bgColor) {
          secondaryColor = bg;
          break;
        }
      }

      return {
        primary: rgbToHex(primaryColor),
        secondary: rgbToHex(secondaryColor),
        accent: rgbToHex(accentColor),
        background: rgbToHex(bgColor),
        text: rgbToHex(textColor),
      };
    });

    return { success: true, data: colors };
  } catch (error) {
    log('error', 'Failed to extract colors', { error: String(error) });
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error extracting colors',
    };
  }
}

// ============================================
// Content Extraction
// ============================================

async function extractContent(page: Page): Promise<ExtractionResult<SiteContent>> {
  try {
    const content = await page.evaluate((selectors) => {
      // Helper to get text from first matching selector
      function getFirstText(selectorList: string[]): string | null {
        for (const selector of selectorList) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent?.trim();
            if (text && text.length > 0 && text.length < 500) {
              return text;
            }
          }
        }
        return null;
      }

      // Helper to get multiple texts from selectors
      function getMultipleTexts(selectorList: string[], limit: number = 5): string[] {
        const texts: string[] = [];
        const seen = new Set<string>();

        for (const selector of selectorList) {
          const elements = document.querySelectorAll(selector);
          for (const el of elements) {
            const text = el.textContent?.trim();
            if (text && text.length > 0 && text.length < 200 && !seen.has(text)) {
              seen.add(text);
              texts.push(text);
              if (texts.length >= limit) break;
            }
          }
          if (texts.length >= limit) break;
        }

        return texts;
      }

      // Extract headline
      const headline = getFirstText(selectors.headline) || 'Welcome';

      // Extract subheadline
      const subheadline = getFirstText(selectors.subheadline);

      // Extract features (up to 5)
      const features = getMultipleTexts(selectors.features, 5);

      // Extract stats (up to 4)
      const stats = getMultipleTexts(selectors.stats, 4);

      // Extract CTA text
      const cta = getFirstText(selectors.cta) || 'Get Started';

      return {
        headline,
        subheadline,
        features,
        stats,
        cta,
      };
    }, SELECTORS);

    return { success: true, data: content };
  } catch (error) {
    log('error', 'Failed to extract content', { error: String(error) });
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error extracting content',
    };
  }
}

// ============================================
// AI-Powered Content Extraction
// ============================================

const CONTENT_EXTRACTION_PROMPT = `Analyze this website screenshot and extract content for a 30-second promotional video.

Return ONLY valid JSON (no markdown fencing, no explanation):
{
  "headline": "Main value proposition - punchy, under 10 words",
  "subheadline": "Supporting tagline, one sentence, or null if none visible",
  "features": ["Feature 1 - short benefit phrase", "Feature 2", "Feature 3"],
  "stats": ["10K+ users", "99.9% uptime", "4.9 rating"],
  "cta": "Call-to-action button text"
}

Rules:
1. Extract the MARKETING message, not UI labels or navigation text
2. Features should be benefits/value props (3-5 items max)
3. Stats should be impressive metrics WITH their labels (e.g., "10K+ users" not just "10K+")
4. If no clear stats are visible, return empty array []
5. Be compelling and concise - this is for a video ad
6. Headline should capture the core value proposition, not just the company name`;

async function extractContentWithAI(
  screenshotBase64: string,
  url: string
): Promise<ExtractionResult<SiteContent>> {
  // Get lazy-initialized client
  const anthropic = getAnthropicClient();
  if (!anthropic) {
    log('warn', 'ANTHROPIC_API_KEY not set, skipping AI extraction');
    return { success: false, data: null, error: 'API key not configured' };
  }

  try {
    log('info', 'Extracting content with AI', { url });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshotBase64,
              },
            },
            {
              type: 'text',
              text: CONTENT_EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    const rawResponse = textContent.text;
    log('info', 'AI extraction raw response', { preview: rawResponse.substring(0, 200) });

    // Parse JSON response (handle potential markdown fencing)
    let parsed: {
      headline?: string;
      subheadline?: string | null;
      features?: string[];
      stats?: string[];
      cta?: string;
    };

    try {
      // Try to extract JSON from the response (in case it includes markdown)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON object found in response');
      }
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      log('error', 'Failed to parse AI response JSON', { error: String(parseError), raw: rawResponse });
      return { success: false, data: null, error: 'Failed to parse AI response' };
    }

    // Validate and transform to SiteContent
    const content: SiteContent = {
      headline: parsed.headline || 'Welcome',
      subheadline: parsed.subheadline || null,
      features: Array.isArray(parsed.features) ? parsed.features.slice(0, 5) : [],
      stats: Array.isArray(parsed.stats) ? parsed.stats.slice(0, 4) : [],
      cta: parsed.cta || 'Get Started',
    };

    log('info', 'AI content extraction successful', {
      headline: content.headline,
      featureCount: content.features.length,
      statCount: content.stats.length,
    });

    return { success: true, data: content };
  } catch (error) {
    // SDK already retried 429/5xx - if we're here, it's a real failure
    if (error instanceof Anthropic.RateLimitError) {
      log('warn', 'Rate limit exceeded after retries', { error: error.message });
    } else if (error instanceof Anthropic.BadRequestError) {
      log('warn', 'Bad request - possibly image too large', { error: error.message });
    } else if (error instanceof Anthropic.APIError) {
      log('warn', 'Anthropic API error', { status: error.status, message: error.message });
    } else {
      log('error', 'AI content extraction failed', { error: String(error) });
    }

    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'AI extraction failed',
    };
  }
}

// ============================================
// Logo Extraction
// ============================================

async function extractLogoUrl(page: Page): Promise<ExtractionResult<string>> {
  try {
    const logoUrl = await page.evaluate((selectors) => {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          // Handle img elements
          if (element.tagName === 'IMG') {
            const src = (element as HTMLImageElement).src;
            if (src && !src.includes('data:') && !src.includes('placeholder')) {
              return src;
            }
          }
          // Handle SVG elements - can't get URL, but note it exists
          if (element.tagName === 'SVG') {
            return null; // SVG is inline, would need different handling
          }
        }
      }
      return null;
    }, SELECTORS.logo);

    return { success: true, data: logoUrl };
  } catch (error) {
    log('error', 'Failed to extract logo', { error: String(error) });
    return { success: false, data: null, error: String(error) };
  }
}

// ============================================
// Site Type Detection
// ============================================

async function detectSiteType(page: Page, url: string): Promise<'tech' | 'ecommerce' | 'enterprise' | 'other'> {
  try {
    const indicators = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const html = document.documentElement.outerHTML.toLowerCase();

      return {
        // Tech indicators
        hasTechTerms: /\b(api|developer|sdk|integration|platform|saas|cloud|deploy|github)\b/.test(text),
        hasCodeBlocks: document.querySelectorAll('pre, code, [class*="code"]').length > 0,
        hasTechStack: /\b(react|vue|angular|node|python|javascript|typescript)\b/.test(text),

        // Ecommerce indicators
        hasCart: /\b(cart|checkout|add to cart|buy now|shop|store)\b/.test(text),
        hasPricing: /\$\d+|€\d+|£\d+|\d+\s*(usd|eur|gbp)/i.test(text),
        hasProducts: document.querySelectorAll('[class*="product"], [class*="item"], .price').length > 3,

        // Enterprise indicators
        hasEnterprise: /\b(enterprise|solutions|business|contact sales|demo|roi|compliance)\b/.test(text),
        hasTestimonials: document.querySelectorAll('[class*="testimonial"], [class*="review"], [class*="client"]').length > 0,
        hasLogos: document.querySelectorAll('[class*="logo-grid"], [class*="client-logo"], [class*="partner"]').length > 0,
      };
    });

    // Score each category
    let techScore = 0;
    let ecommerceScore = 0;
    let enterpriseScore = 0;

    if (indicators.hasTechTerms) techScore += 2;
    if (indicators.hasCodeBlocks) techScore += 3;
    if (indicators.hasTechStack) techScore += 2;

    if (indicators.hasCart) ecommerceScore += 3;
    if (indicators.hasPricing) ecommerceScore += 2;
    if (indicators.hasProducts) ecommerceScore += 2;

    if (indicators.hasEnterprise) enterpriseScore += 2;
    if (indicators.hasTestimonials) enterpriseScore += 2;
    if (indicators.hasLogos) enterpriseScore += 2;

    // Check URL patterns
    if (/\.io|\.dev|\.tech|github|gitlab/i.test(url)) techScore += 2;
    if (/shop|store|cart|product/i.test(url)) ecommerceScore += 2;

    // Determine type
    const maxScore = Math.max(techScore, ecommerceScore, enterpriseScore);
    if (maxScore < 3) return 'other';
    if (techScore === maxScore) return 'tech';
    if (ecommerceScore === maxScore) return 'ecommerce';
    if (enterpriseScore === maxScore) return 'enterprise';

    return 'other';
  } catch (error) {
    log('warn', 'Failed to detect site type, defaulting to other', { error: String(error) });
    return 'other';
  }
}

// ============================================
// Screenshot Capture & Upload
// ============================================

async function captureAndUploadScreenshots(
  page: Page,
  userId: string,
  bundleId: string
): Promise<ExtractionResult<SiteScreenshots>> {
  const supabase = createServiceRoleClient();
  const basePath = `video-bundles/${userId}/${bundleId}`;
  const screenshots: SiteScreenshots = { full: '', sections: [] };

  try {
    // Capture full page screenshot
    log('info', 'Capturing full page screenshot');
    const fullScreenshot = await page.screenshot({
      type: 'png',
      fullPage: true,
    });

    const fullPath = `${basePath}/full.png`;
    const { error: fullUploadError } = await supabase.storage
      .from('video-bundles')
      .upload(fullPath, fullScreenshot, {
        contentType: 'image/png',
        upsert: true,
      });

    if (fullUploadError) {
      log('error', 'Failed to upload full screenshot', { error: fullUploadError.message });
      return { success: false, data: null, error: fullUploadError.message };
    }

    const { data: fullUrlData } = supabase.storage
      .from('video-bundles')
      .getPublicUrl(fullPath);
    screenshots.full = fullUrlData.publicUrl;

    // Capture section screenshots
    log('info', 'Capturing section screenshots');
    const sectionNames = ['hero', 'features', 'footer'] as const;

    for (const sectionName of sectionNames) {
      const selectors = SECTION_SELECTORS[sectionName];

      for (const selector of selectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const boundingBox = await element.boundingBox();
            if (boundingBox && boundingBox.height > 50) {
              const sectionScreenshot = await element.screenshot({ type: 'png' });
              const sectionPath = `${basePath}/${sectionName}.png`;

              const { error: sectionUploadError } = await supabase.storage
                .from('video-bundles')
                .upload(sectionPath, sectionScreenshot, {
                  contentType: 'image/png',
                  upsert: true,
                });

              if (!sectionUploadError) {
                const { data: sectionUrlData } = supabase.storage
                  .from('video-bundles')
                  .getPublicUrl(sectionPath);
                screenshots.sections.push(sectionUrlData.publicUrl);
                log('info', `Captured ${sectionName} section`);
              }
              break; // Found and captured, move to next section
            }
          }
        } catch {
          // Selector not found or screenshot failed, try next
          continue;
        }
      }
    }

    return { success: true, data: screenshots };
  } catch (error) {
    log('error', 'Failed to capture screenshots', { error: String(error) });
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown screenshot error',
    };
  }
}

// ============================================
// Main Analysis Function
// ============================================

export async function analyzeUrl(
  url: string,
  options: UrlAnalyzerOptions
): Promise<SiteAnalysis> {
  const { userId, bundleId = crypto.randomUUID(), timeout = DEFAULT_TIMEOUT } = options;

  log('info', 'Starting URL analysis', { url, userId, bundleId });

  let browser: Browser | null = null;

  // Default values for partial failures
  const defaultColors: ColorPalette = {
    primary: '#3b82f6',
    secondary: '#f3f4f6',
    accent: '#10b981',
    background: '#ffffff',
    text: '#1f2937',
  };

  const defaultContent: SiteContent = {
    headline: 'Welcome',
    subheadline: null,
    features: [],
    stats: [],
    cta: 'Get Started',
  };

  const defaultScreenshots: SiteScreenshots = {
    full: '',
    sections: [],
  };

  try {
    // Validate URL (SEC-004 SSRF protection)
    const urlValidation = validateUrlForSSRF(url);
    if (!urlValidation.valid) {
      throw new Error(`URL validation failed: ${urlValidation.error}`);
    }

    // Use sanitized URL
    const parsedUrl = new URL(urlValidation.sanitizedUrl!);

    // Connect to browser (Browserless.io in production, local in development)
    const browserlessToken = process.env.BROWSERLESS_API_KEY;

    if (browserlessToken) {
      log('info', 'Connecting to Browserless.io via CDP');
      // Use CDP connection method which is more version-tolerant than native Playwright protocol
      browser = await chromium.connectOverCDP(
        `wss://production-sfo.browserless.io?token=${browserlessToken}`
      );
    } else {
      log('info', 'Launching local browser (no BROWSERLESS_API_KEY)');
      browser = await chromium.launch({
        headless: true,
      });
    }

    const context = await browser.newContext({
      viewport: VIEWPORT,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();

    // Set timeout for navigation
    page.setDefaultTimeout(timeout);

    // Navigate to URL
    log('info', 'Navigating to URL', { url: parsedUrl.href });
    await page.goto(parsedUrl.href, {
      waitUntil: 'networkidle',
      timeout,
    });

    // Wait a bit for any lazy-loaded content
    await page.waitForTimeout(1000);

    // Capture viewport screenshot first (needed for AI content extraction)
    log('info', 'Capturing viewport screenshot for AI analysis');
    const viewportScreenshot = await page.screenshot({
      type: 'png',
      fullPage: false, // Viewport only - keeps image size reasonable for AI
    });
    const viewportBase64 = viewportScreenshot.toString('base64');

    // Run CSS extractions in parallel (colors, logo, site type, screenshots)
    log('info', 'Extracting page data (CSS + AI hybrid)');
    const [colorsResult, logoResult, siteType, screenshotsResult] = await Promise.all([
      extractColors(page),
      extractLogoUrl(page),
      detectSiteType(page, url),
      captureAndUploadScreenshots(page, userId, bundleId),
    ]);

    // AI content extraction (primary) with CSS fallback
    log('info', 'Attempting AI content extraction');
    let contentResult = await extractContentWithAI(viewportBase64, url);

    // Fall back to CSS extraction if AI fails
    if (!contentResult.success || !contentResult.data) {
      log('info', 'AI extraction failed, falling back to CSS extraction');
      contentResult = await extractContent(page);
    }

    // Log any partial failures
    if (!colorsResult.success) {
      log('warn', 'Color extraction failed, using defaults', { error: colorsResult.error });
    }
    if (!contentResult.success) {
      log('warn', 'Content extraction failed, using defaults', { error: contentResult.error });
    }
    if (!logoResult.success) {
      log('warn', 'Logo extraction failed', { error: logoResult.error });
    }
    if (!screenshotsResult.success) {
      log('warn', 'Screenshot capture failed', { error: screenshotsResult.error });
    }

    // Assemble result with fallbacks
    const analysis: SiteAnalysis = {
      screenshots: screenshotsResult.data || defaultScreenshots,
      colors: colorsResult.data || defaultColors,
      content: contentResult.data || defaultContent,
      logoUrl: logoResult.data || null,
      siteType,
    };

    log('info', 'URL analysis complete', {
      siteType,
      hasLogo: !!analysis.logoUrl,
      featureCount: analysis.content.features.length,
      statCount: analysis.content.stats.length,
      sectionCount: analysis.screenshots.sections.length,
    });

    return analysis;
  } catch (error) {
    log('error', 'URL analysis failed', {
      url,
      error: error instanceof Error ? error.message : String(error),
    });

    // Return partial result with what we have
    return {
      screenshots: defaultScreenshots,
      colors: defaultColors,
      content: defaultContent,
      logoUrl: null,
      siteType: 'other',
    };
  } finally {
    // Always close browser to prevent leaks
    if (browser) {
      log('info', 'Closing browser');
      await browser.close();
    }
  }
}

// ============================================
// Convenience Exports
// ============================================

export type { SiteAnalysis, ColorPalette, SiteContent, SiteScreenshots };
