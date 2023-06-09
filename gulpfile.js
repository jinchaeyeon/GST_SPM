const {
  kendoSassBuild,
} = require("@progress/kendo-theme-tasks/src/build/kendo-build");
const nodeSass = require("node-sass");
const { series } = require("gulp");

const themes = ["light", "dark"];

function buildStyles(cb) {
  themes.forEach((theme) => {
    kendoSassBuild({
      file: `./src/sass/${theme}-theme.scss`,
      output: {
        path: "./public",
      },
      sassOptions: {
        implementation: nodeSass,
        outputStyle: "compressed",
      },
    });
    cb();
  });
}
exports.sass = series(buildStyles);
