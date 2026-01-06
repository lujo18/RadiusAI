/**
 * TikTok Text Style Presets
 * Popular caption styles used on TikTok, optimized for Konva rendering
 */

export interface TiktokTextStyle {
  fontFamily: string;
  fontSize: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
  shadowOpacity?: number;
  fontStyle?: 'normal' | 'bold' | 'italic';
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
  letterSpacing?: number;
  lineHeight?: number;
  background?: {
    fill: string;
    padding: number;
    cornerRadius?: number;
    opacity?: number;
  };
}

export const TIKTOK_STYLES: Record<string, TiktokTextStyle> = {
  // ==================== CLASSIC STYLES ====================
  
  classic: {
    fontFamily: 'Proxima Nova, Inter, Arial',
    fontSize: 48,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 4,
    shadowColor: '#000000',
    shadowBlur: 6,
    shadowOffset: { x: 0, y: 2 },
    shadowOpacity: 0.5,
    fontStyle: 'bold',
    lineHeight: 1.3,
    background: {
      fill: 'rgba(0, 0, 0, 0.4)',
      padding: 12,
      cornerRadius: 12,
      opacity: 0.8,
    },
  },

  // ==================== BOLD & IMPACTFUL ====================

  boldImpact: {
    fontFamily: 'Impact, Arial Black, Arial',
    fontSize: 64,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 6,
    shadowColor: '#000000',
    shadowBlur: 10,
    shadowOffset: { x: 0, y: 4 },
    shadowOpacity: 0.7,
    fontStyle: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    lineHeight: 1.2,
  },

  punchyAllCaps: {
    fontFamily: 'Montserrat, Helvetica, Arial',
    fontSize: 56,
    fill: '#ffff00',
    stroke: '#ff0000',
    strokeWidth: 5,
    shadowColor: '#000000',
    shadowBlur: 8,
    shadowOffset: { x: 2, y: 3 },
    shadowOpacity: 0.8,
    fontStyle: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 3,
    lineHeight: 1.25,
  },

  // ==================== CLEAN & MINIMAL ====================

  cleanMinimal: {
    fontFamily: 'Inter, Helvetica, Arial',
    fontSize: 44,
    fill: '#ffffff',
    shadowColor: '#000000',
    shadowBlur: 4,
    shadowOffset: { x: 0, y: 2 },
    shadowOpacity: 0.3,
    fontStyle: 'normal',
    lineHeight: 1.4,
  },

  modernSans: {
    fontFamily: 'Poppins, Inter, Arial',
    fontSize: 40,
    fill: '#f8f8f8',
    stroke: '#1a1a1a',
    strokeWidth: 2,
    shadowColor: '#000000',
    shadowBlur: 3,
    shadowOffset: { x: 1, y: 1 },
    shadowOpacity: 0.4,
    fontStyle: 'normal',
    lineHeight: 1.35,
    background: {
      fill: 'rgba(0, 0, 0, 0.25)',
      padding: 10,
      cornerRadius: 8,
      opacity: 0.7,
    },
  },

  // ==================== NEON & VIBRANT ====================

  neonGlow: {
    fontFamily: 'Montserrat, Arial',
    fontSize: 52,
    fill: '#00ffff',
    stroke: '#0088ff',
    strokeWidth: 2,
    shadowColor: '#00ffff',
    shadowBlur: 20,
    shadowOffset: { x: 0, y: 0 },
    shadowOpacity: 1,
    fontStyle: 'bold',
    lineHeight: 1.3,
  },

  hotPink: {
    fontFamily: 'Inter, Arial',
    fontSize: 50,
    fill: '#ff1493',
    stroke: '#ffffff',
    strokeWidth: 3,
    shadowColor: '#ff1493',
    shadowBlur: 15,
    shadowOffset: { x: 0, y: 0 },
    shadowOpacity: 0.8,
    fontStyle: 'bold',
    lineHeight: 1.3,
  },

  electricPurple: {
    fontFamily: 'Poppins, Arial',
    fontSize: 48,
    fill: '#a855f7',
    stroke: '#ffffff',
    strokeWidth: 3,
    shadowColor: '#a855f7',
    shadowBlur: 18,
    shadowOffset: { x: 0, y: 0 },
    shadowOpacity: 0.9,
    fontStyle: 'bold',
    lineHeight: 1.3,
  },

  // ==================== RETRO & VINTAGE ====================

  retro: {
    fontFamily: 'Georgia, Times New Roman, serif',
    fontSize: 46,
    fill: '#ffd700',
    stroke: '#8b4513',
    strokeWidth: 4,
    shadowColor: '#654321',
    shadowBlur: 8,
    shadowOffset: { x: 3, y: 3 },
    shadowOpacity: 0.6,
    fontStyle: 'bold',
    lineHeight: 1.4,
    background: {
      fill: 'rgba(139, 69, 19, 0.5)',
      padding: 14,
      cornerRadius: 10,
      opacity: 0.8,
    },
  },

  vintage: {
    fontFamily: 'Courier New, monospace',
    fontSize: 42,
    fill: '#f4e4c1',
    stroke: '#3e2723',
    strokeWidth: 3,
    shadowColor: '#1a1a1a',
    shadowBlur: 6,
    shadowOffset: { x: 2, y: 2 },
    shadowOpacity: 0.5,
    fontStyle: 'bold',
    lineHeight: 1.35,
  },

  // ==================== DRAMATIC & HIGH CONTRAST ====================

  dramatic: {
    fontFamily: 'Impact, Arial Black, Arial',
    fontSize: 68,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 8,
    shadowColor: '#000000',
    shadowBlur: 12,
    shadowOffset: { x: 0, y: 5 },
    shadowOpacity: 0.9,
    fontStyle: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 4,
    lineHeight: 1.2,
  },

  highContrast: {
    fontFamily: 'Montserrat, Arial',
    fontSize: 58,
    fill: '#000000',
    stroke: '#ffffff',
    strokeWidth: 5,
    shadowColor: '#ffffff',
    shadowBlur: 10,
    shadowOffset: { x: 0, y: 0 },
    shadowOpacity: 0.8,
    fontStyle: 'bold',
    lineHeight: 1.25,
  },

  // ==================== SOFT & FRIENDLY ====================

  softBubble: {
    fontFamily: 'Poppins, Comic Sans MS, Arial',
    fontSize: 44,
    fill: '#ffb6c1',
    stroke: '#ffffff',
    strokeWidth: 4,
    shadowColor: '#ff69b4',
    shadowBlur: 12,
    shadowOffset: { x: 0, y: 2 },
    shadowOpacity: 0.6,
    fontStyle: 'bold',
    lineHeight: 1.4,
    background: {
      fill: 'rgba(255, 255, 255, 0.6)',
      padding: 16,
      cornerRadius: 20,
      opacity: 0.9,
    },
  },

  pastelDream: {
    fontFamily: 'Poppins, Arial',
    fontSize: 46,
    fill: '#e0bbff',
    stroke: '#ffffff',
    strokeWidth: 3,
    shadowColor: '#c084fc',
    shadowBlur: 10,
    shadowOffset: { x: 0, y: 2 },
    shadowOpacity: 0.5,
    fontStyle: 'bold',
    lineHeight: 1.35,
    background: {
      fill: 'rgba(255, 255, 255, 0.4)',
      padding: 12,
      cornerRadius: 16,
      opacity: 0.8,
    },
  },

  // ==================== TRENDY & MODERN ====================

  trendyGradient: {
    fontFamily: 'Inter, Arial',
    fontSize: 50,
    fill: '#ffffff',
    stroke: '#ff00ff',
    strokeWidth: 3,
    shadowColor: '#00ffff',
    shadowBlur: 16,
    shadowOffset: { x: 0, y: 0 },
    shadowOpacity: 0.7,
    fontStyle: 'bold',
    lineHeight: 1.3,
  },

  tikTokOfficial: {
    fontFamily: 'Proxima Nova, Inter, Arial',
    fontSize: 48,
    fill: '#ffffff',
    stroke: '#000000',
    strokeWidth: 5,
    shadowColor: '#fe2c55', // TikTok pink
    shadowBlur: 14,
    shadowOffset: { x: 0, y: 0 },
    shadowOpacity: 0.8,
    fontStyle: 'bold',
    lineHeight: 1.3,
  },

  // ==================== SUBTLE & PROFESSIONAL ====================

  subtle: {
    fontFamily: 'Inter, Helvetica, Arial',
    fontSize: 40,
    fill: '#f5f5f5',
    shadowColor: '#000000',
    shadowBlur: 3,
    shadowOffset: { x: 1, y: 1 },
    shadowOpacity: 0.25,
    fontStyle: 'normal',
    lineHeight: 1.4,
    background: {
      fill: 'rgba(0, 0, 0, 0.15)',
      padding: 8,
      cornerRadius: 6,
      opacity: 0.6,
    },
  },

  professional: {
    fontFamily: 'Montserrat, Arial',
    fontSize: 42,
    fill: '#ffffff',
    stroke: '#2c3e50',
    strokeWidth: 2,
    shadowColor: '#000000',
    shadowBlur: 4,
    shadowOffset: { x: 0, y: 2 },
    shadowOpacity: 0.35,
    fontStyle: 'normal',
    lineHeight: 1.4,
  },
};

/**
 * Get a TikTok text style by name
 */
export function getTiktokStyle(styleName: string): TiktokTextStyle | undefined {
  return TIKTOK_STYLES[styleName];
}

/**
 * Get all available TikTok style names
 */
export function getTiktokStyleNames(): string[] {
  return Object.keys(TIKTOK_STYLES);
}

/**
 * Apply TikTok style to Konva Text properties
 * This converts the TiktokTextStyle to Konva-compatible properties
 */
export function applyTiktokStyleToKonva(
  style: TiktokTextStyle
): Record<string, any> {
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    shadowColor: style.shadowColor,
    shadowBlur: style.shadowBlur,
    shadowOffsetX: style.shadowOffset?.x,
    shadowOffsetY: style.shadowOffset?.y,
    shadowOpacity: style.shadowOpacity,
    fontStyle: style.fontStyle,
    letterSpacing: style.letterSpacing,
    lineHeight: style.lineHeight,
  };
}

/**
 * Style categories for organizing presets in the UI
 */
export const STYLE_CATEGORIES = {
  classic: ['classic'],
  bold: ['boldImpact', 'punchyAllCaps', 'dramatic', 'highContrast'],
  clean: ['cleanMinimal', 'modernSans', 'subtle', 'professional'],
  vibrant: ['neonGlow', 'hotPink', 'electricPurple', 'trendyGradient'],
  retro: ['retro', 'vintage'],
  soft: ['softBubble', 'pastelDream'],
  trendy: ['tikTokOfficial', 'trendyGradient'],
} as const;

export default TIKTOK_STYLES;
