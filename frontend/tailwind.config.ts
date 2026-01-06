import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		borderColor: {
  			DEFAULT: 'oklch(var(--border))'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				'10': 'oklch(var(--muted) / 0.1)',
  				'20': 'oklch(var(--muted) / 0.2)',
  				'50': 'oklch(var(--muted) / 0.5)',
  				'70': 'oklch(var(--muted) / 0.7)',
  				'80': 'oklch(var(--muted) / 0.8)',
  				'90': 'oklch(var(--muted) / 0.9)',
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				'50': 'oklch(var(--accent) / 0.5)',
  				'70': 'oklch(var(--accent) / 0.7)',
  				'90': 'oklch(var(--accent) / 0.9)',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			sidebar: {
  				DEFAULT: 'oklch(var(--sidebar))',
  				foreground: 'oklch(var(--sidebar-foreground))',
  				primary: 'oklch(var(--sidebar-primary))',
  				'primary-foreground': 'oklch(var(--sidebar-primary-foreground))',
  				accent: 'oklch(var(--sidebar-accent))',
  				'accent-foreground': 'oklch(var(--sidebar-accent-foreground))',
  				border: 'oklch(var(--sidebar-border))',
  				ring: 'oklch(var(--sidebar-ring))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		border: {
  			DEFAULT: 'oklch(var(--border))'
  		},
  		backdropBlur: {
  			xs: '2px',
  			sm: '4px',
  			DEFAULT: '8px',
  			md: '12px',
  			lg: '16px',
  			xl: '24px',
  			'2xl': '40px',
  			'3xl': '64px'
  		},
  		borderRadius: {
  			card: '16px',
  			button: '10px',
  			input: '12px',
  			modal: '20px',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			glass: '0 8px 32px 0 oklch(var(--foreground) / 0.15)',
  			'glass-sm': '0 4px 16px 0 oklch(var(--foreground) / 0.1)',
  			'glass-lg': '0 12px 48px 0 oklch(var(--foreground) / 0.2)',
  			card: '0 4px 6px -1px oklch(var(--foreground) / 0.1), 0 2px 4px -1px oklch(var(--foreground) / 0.06)',
  			'card-hover': '0 10px 15px -3px oklch(var(--foreground) / 0.15), 0 4px 6px -2px oklch(var(--foreground) / 0.1)',
  			'inner-glow': 'inset 0 2px 4px 0 oklch(var(--background) / 0.06)'
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
  			'glass-gradient': 'linear-gradient(135deg, oklch(var(--muted) / 0.1) 0%, oklch(var(--muted) / 0.05) 100%)',
  			'dark-gradient': 'linear-gradient(180deg, oklch(var(--background)), oklch(var(--card)))'
  		},
  		fontFamily: {
  			main: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			display: [
  				'Plus Jakarta Sans',
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			'display-lg': [
  				'3.5rem',
  				{
  					lineHeight: '1.1',
  					fontWeight: '700'
  				}
  			],
  			display: [
  				'3rem',
  				{
  					lineHeight: '1.2',
  					fontWeight: '700'
  				}
  			],
  			'display-sm': [
  				'2.5rem',
  				{
  					lineHeight: '1.2',
  					fontWeight: '600'
  				}
  			]
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-in-out',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'slide-down': 'slideDown 0.3s ease-out',
  			'scale-in': 'scaleIn 0.2s ease-out',
  			glow: 'glow 2s ease-in-out infinite',
  			'spin-slow': 'spin 3s linear infinite'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			slideDown: {
  				'0%': {
  					transform: 'translateY(-10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					transform: 'scale(0.95)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
  			glow: {
  				'0%, 100%': {
  					opacity: '1'
  				},
  				'50%': {
  					opacity: '0.5'
  				}
  			}
  		}
  	}
  },
  plugins: [
    // Custom plugin for glassmorphism components
    function ({ addComponents }: any) {
      addComponents({
        ".glass-card": {
          backgroundColor: "oklch(var(--muted) / 0.1)",
          backdropFilter: "blur(12px)",
          borderWidth: "1px",
          borderColor: "oklch(var(--border))",
          boxShadow: "0 8px 32px 0 oklch(var(--foreground) / 0.1)",
          borderRadius: "var(--radius)",
        },
        ".glass-card-hover": {
          backgroundColor: "oklch(var(--muted) / 0.1)",
          backdropFilter: "blur(12px)",
          borderWidth: "1px",
          borderColor: "oklch(var(--border))",
          boxShadow: "0 8px 32px 0 oklch(var(--foreground) / 0.1)",
          borderRadius: "var(--radius)",
          transition: "all 300ms",
          "&:hover": {
            backgroundColor: "oklch(var(--muted) / 0.2)",
            borderColor: "oklch(var(--muted) / 0.2)",
          },
        },
        ".dark-card": {
          "@apply bg-background border rounded-card shadow-card":
            {},
        },
        ".dark-card-hover": {
          "@apply dark-card hover:bg-background hover:shadow-card-hover transition-all duration-300":
            {},
        },
        ".stat-card": {
          backgroundColor: "oklch(var(--muted) / 0.1)",
          backdropFilter: "blur(12px)",
          borderWidth: "1px",
          borderColor: "oklch(var(--border))",
          boxShadow: "0 8px 32px 0 oklch(var(--foreground) / 0.1)",
          borderRadius: "var(--radius)",
          padding: "1.5rem",
          transition: "all 300ms",
          "&:hover": {
            backgroundColor: "oklch(var(--muted) / 0.2)",
          },
        },
        ".btn-primary": {
          "@apply bg-primary text-primary-foreground font-medium px-6 py-2.5 rounded-button transition-all duration-200 shadow-lg":
            {},
          "&:hover": {
            backgroundColor: "color-mix(in oklch, oklch(var(--primary)) 80%, transparent)",
            boxShadow: "0 10px 15px -3px color-mix(in oklch, oklch(var(--primary)) 50%, transparent)",
          },
        },
        ".btn-secondary": {
          "@apply text-foreground font-medium rounded-button transition-all duration-200":
            {},
          backgroundColor: "oklch(var(--muted) / 0.1)",
          borderWidth: "1px",
          borderColor: "oklch(var(--muted) / 0.2)",
          backdropFilter: "blur(12px)",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
          paddingTop: "0.625rem",
          paddingBottom: "0.625rem",
          "&:hover": {
            backgroundColor: "oklch(var(--muted) / 0.2)",
          },
        },
        ".btn-ghost": {
          "@apply bg-transparent text-muted font-medium rounded-button transition-all duration-200":
            {},
          paddingLeft: "1rem",
          paddingRight: "1rem",
          paddingTop: "0.5rem",
          paddingBottom: "0.5rem",
          "&:hover": {
            backgroundColor: "oklch(var(--muted) / 0.1)",
            color: "oklch(var(--foreground))",
          },
        },
        ".input-field": {
          "@apply bg-background rounded-input text-foreground transition-all":
            {},
          borderWidth: "1px",
          borderColor: "oklch(var(--muted) / 0.2)",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          paddingTop: "0.625rem",
          paddingBottom: "0.625rem",
          "&::placeholder": {
            color: "oklch(var(--muted))",
          },
          "&:focus": {
            borderColor: "oklch(var(--accent))",
          },
          "--tw-ring-color": "oklch(var(--accent) / 0.5)",
        },
        ".sidebar-item": {
          "@apply flex items-center gap-3 rounded-button transition-all duration-200 cursor-pointer":
            {},
          paddingLeft: "1rem",
          paddingRight: "1rem",
          paddingTop: "0.75rem",
          paddingBottom: "0.75rem",
          color: "oklch(var(--foreground) / 0.5)",
          "&:hover": {
            color: "oklch(var(--foreground))",
            backgroundColor: "oklch(var(--muted) / 0.1)",
          },
        },
        ".sidebar-item-active": {
          "@apply sidebar-item text-primary border":
            {},
          backgroundColor: "color-mix(in oklch, oklch(var(--primary)) 10%, transparent)",
          borderColor: "color-mix(in oklch, oklch(var(--primary)) 20%, transparent)",
        },
        ".metric-positive": {
          "@apply text-primary flex items-center gap-1": {},
        },
        ".metric-negative": {
          "@apply text-destructive flex items-center gap-1": {},
        },
        ".badge": {
          "@apply inline-flex items-center px-3 py-1 rounded-full text-xs font-medium":
            {},
        },
        ".badge-blue": {
          "@apply badge text-primary border":
            {},
          backgroundColor: "oklch(var(--primary) / 0.1)",
        },
        ".badge-green": {
          "@apply badge text-primary border":
            {},
          backgroundColor: "oklch(var(--primary) / 0.1)",
        },
        ".badge-orange": {
          "@apply badge text-accent border":
            {},
          backgroundColor: "oklch(var(--accent) / 0.1)",
        },
        ".badge-purple": {
          "@apply badge text-secondary border":
            {},
          backgroundColor: "oklch(var(--secondary) / 0.1)",
        },
        ".gradient-text": {
          "@apply bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent":
            {},
        },
        ".chart-container": {
          "@apply glass-card p-6": {},
        },
        ".table-row": {
          "@apply transition-colors border-b":
            {},
          "&:hover": {
            backgroundColor: "oklch(var(--muted) / 0.1)",
          },
        },
      });
    },
    require("tailwindcss-animate"),
  ],
};
export default config;
