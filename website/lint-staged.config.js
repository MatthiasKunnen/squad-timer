function mapFilenames(filenames) {
    return filenames.map(filename => `"${filename}"`).join(' ');
}

module.exports = {
    '**/*.scss': (filenames) => [
        `yarn run lint:css --fix ${mapFilenames(filenames)}`,
    ],
    '**/*.ts': (filenames) => [
        `yarn run lint:ts --fix --cache ${mapFilenames(filenames)}`,
        `yarn run compile:ts`,
    ],
};
