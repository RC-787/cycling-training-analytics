// Check if the renderer and main bundles are built
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';

const mainPath = path.join(__dirname, '../../src/main.prod.js');
const mainRendererPath = path.join(
  __dirname, '../../src/dist/main.renderer.prod.js'
);
const backgroundProcessPath = path.join(
  __dirname, '../../src/dist/backgroundProcess.renderer.prod.js'
);

if (!fs.existsSync(mainPath)) {
  throw new Error(
    chalk.whiteBright.bgRed.bold(
      'The main process is not built yet. Build it by running "yarn build-main"'
    )
  );
}

if (!fs.existsSync(mainRendererPath)) {
  throw new Error(
    chalk.whiteBright.bgRed.bold(
      'The main renderer process is not built yet. Build it by running "yarn build-renderer"'
    )
  );
}

if (!fs.existsSync(backgroundProcessPath)) {
  throw new Error(
    chalk.whiteBright.bgRed.bold(
      'The background renderer process is not built yet. Build it by running "yarn build-renderer"'
    )
  );
}
