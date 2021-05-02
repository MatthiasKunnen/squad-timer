function mapFilenames(filenames) {
    return filenames.map(filename => `"${filename}"`).join(' ');
}

module.exports = {
    '**/*.scss': (filenames) => [
        `stylelint --syntax scss --fix ${mapFilenames(filenames)}`,
    ],
    '**/*.ts': (filenames) => [
        `eslint --fix --cache ${mapFilenames(filenames)}`,
        `yarn run compile:ts`,
    ],
};
