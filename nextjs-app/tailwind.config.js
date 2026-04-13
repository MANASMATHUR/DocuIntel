/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: 'var(--primary)',
                'primary-dark': 'var(--primary-dark)',
                'primary-light': 'var(--primary-light)',
                accent: 'var(--accent)',
                'accent-light': 'var(--accent-light)',
                'accent-dark': 'var(--accent-dark)',
                success: 'var(--success)',
                'success-light': 'var(--success-light)',
                'risk-high': 'var(--risk-high)',
                'risk-medium': 'var(--risk-medium)',
                'risk-low': 'var(--risk-low)',
                danger: 'var(--risk-high)',
                bg: 'var(--bg)',
                'bg-surface': 'var(--bg-surface)',
                'bg-subtle': 'var(--bg-subtle)',
                'bg-hover': 'var(--bg-hover)',
                text: 'var(--text)',
                'text-secondary': 'var(--text-secondary)',
                'text-dim': 'var(--text-dim)',
                'text-inverse': 'var(--text-inverse)',
                border: 'var(--border)',
                'border-strong': 'var(--border-strong)',
                divider: 'var(--divider)',
            },
            gridTemplateColumns: {
                '16': 'repeat(16, minmax(0, 1fr))',
                '24': 'repeat(24, minmax(0, 1fr))',
            }
        },
    },
    plugins: [],
}
