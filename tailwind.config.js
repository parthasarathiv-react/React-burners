/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                'ot-bg': {
                    top: '#010a25',
                    mid: '#021e3b',
                    bottom: '#01112c',
                },
                'ot-surface': {
                    top: '#203250',
                    bottom: '#03132e',
                    elev: {
                        top: '#234f7d',
                        bottom: '#0e2e54',
                    },
                    button: {
                        top: '#425679',
                        bottom: '#03132e',
                    }
                },
                'ot-action': {
                    top: '#5fa6ff',
                    bottom: '#3e80d5',
                    hover: {
                        top: '#74b3ff',
                        bottom: '#4f91e4',
                    }
                },
                'ot-border': 'rgba(139, 175, 229, 0.35)',
                'ot-text-muted': '#a7bedf',
            },
            borderRadius: {
                lg: `var(--radius)`,
                md: `calc(var(--radius) - 2px)`,
                sm: `calc(var(--radius) - 4px)`,
            },
            fontFamily: {
                baijam: ['"Bai Jamjuree"', 'sans-serif'],
            },
            backgroundImage: {
                'ot-gradient-main': 'linear-gradient(to bottom, #010a25, #021e3b, #01112c)',
                'ot-gradient-surface': 'linear-gradient(to bottom, #203250, #03132e)',
                'ot-gradient-button': 'linear-gradient(to bottom, #425679, #03132e)',
                'ot-gradient-elev': 'linear-gradient(to bottom, #234f7d, #0e2e54)',
                'ot-gradient-action': 'linear-gradient(to bottom, #5fa6ff, #3e80d5)',
                'ot-gradient-action-hover': 'linear-gradient(to bottom, #74b3ff, #4f91e4)',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}

