const defaultTheme = require('tailwindcss/defaultTheme');
module.exports = {
    theme: {
        extend: {
            colors: {
                primary: defaultTheme.colors.teal,
            }
        },
    },
    variants: {},
    plugins: [require('@tailwindcss/ui')],
};
