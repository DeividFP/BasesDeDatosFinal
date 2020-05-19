const Handlebars = {};

Handlebars.registerHelper("upC", (text) => {
    return String.toUpperCase(text);
})

module.exports = Handlebars;