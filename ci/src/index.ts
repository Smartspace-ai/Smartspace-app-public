import {
  dag,
  Container,
  Directory,
  Secret,
  object,
  func,
  check,
} from '@dagger.io/dagger';

const NODE_IMAGE = 'node:20-slim';
const WORK_DIR = '/work';
const DIST_DIR = '/work/dist/smartspace';
const GH_PACKAGES_REGISTRY = 'npm.pkg.github.com';
const GH_PACKAGES_SCOPE = '@smartspace-ai';

const REQUIRED_ENV_VARS = [
  'VITE_CLIENT_ID',
  'VITE_CLIENT_AUTHORITY',
  'VITE_CLIENT_SCOPES',
  'VITE_CHAT_API_URI',
  'VITE_TEAMS_USE_MSAL',
];

@object()
class WebPipeline {
  /**
   * Run lint, typecheck, test, and build in parallel.
   * Pass ghPackageToken to install from GitHub Packages (dev),
   * or omit it to install from npmjs.com (production/client).
   */
  @func()
  async qualityCheck(
    source: Directory,
    ghPackageToken?: Secret
  ): Promise<string> {
    const base = this.nodeContainer(source, ghPackageToken);

    const [lint, typecheck, test, build] = await Promise.all([
      base.withExec(['npm', 'run', '-s', 'lint:all']).stdout(),
      base.withExec(['npm', 'run', '-s', 'typecheck']).stdout(),
      base.withExec(['npm', 'run', '-s', 'test']).stdout(),
      base.withExec(['npm', 'run', '-s', 'build']).stdout(),
    ]);

    return [lint, typecheck, test, build].join('\n');
  }

  /**
   * Build the app and return the dist/smartspace directory.
   * Pass ghPackageToken to install from GitHub Packages (dev),
   * or omit it to install from npmjs.com (production/client).
   */
  @func()
  async build(source: Directory, ghPackageToken?: Secret): Promise<Directory> {
    const ctr = this.nodeContainer(source, ghPackageToken).withExec([
      'npm',
      'run',
      '-s',
      'build',
    ]);

    return ctr.directory(DIST_DIR);
  }

  /**
   * Validate that .env contains all required variables with non-empty values.
   */
  @func()
  @check()
  async checkEnv(source: Directory): Promise<string> {
    const checks = REQUIRED_ENV_VARS.map(
      (v) => `
      if ! grep -q "^${v}=" .env; then
        echo "FAIL: .env does not contain ${v}" && FAILED=1
      elif [ -z "$(grep "^${v}=" .env | cut -d'=' -f2-)" ]; then
        echo "FAIL: ${v} in .env is empty" && FAILED=1
      fi`
    ).join('');

    return dag
      .container()
      .from(NODE_IMAGE)
      .withDirectory(WORK_DIR, source)
      .withWorkdir(WORK_DIR)
      .withExec([
        'sh',
        '-c',
        `FAILED=0${checks}
      if [ "$FAILED" = "1" ]; then exit 1; fi
      echo "All required .env variables present."`,
      ])
      .stdout();
  }

  // ---------------------------------------------------------------------------
  // Checks (run with: dagger check)
  // ---------------------------------------------------------------------------

  @func()
  @check()
  async checkLint(source: Directory, ghPackageToken?: Secret): Promise<string> {
    return this.nodeContainer(source, ghPackageToken)
      .withExec(['npm', 'run', '-s', 'lint:all'])
      .stdout();
  }

  @func()
  @check()
  async checkTypecheck(
    source: Directory,
    ghPackageToken?: Secret
  ): Promise<string> {
    return this.nodeContainer(source, ghPackageToken)
      .withExec(['npm', 'run', '-s', 'typecheck'])
      .stdout();
  }

  @func()
  @check()
  async checkTests(
    source: Directory,
    ghPackageToken?: Secret
  ): Promise<string> {
    return this.nodeContainer(source, ghPackageToken)
      .withExec(['npm', 'run', '-s', 'test'])
      .stdout();
  }

  @func()
  @check()
  async checkBuild(
    source: Directory,
    ghPackageToken?: Secret
  ): Promise<Directory> {
    const ctr = this.nodeContainer(source, ghPackageToken).withExec([
      'npm',
      'run',
      '-s',
      'build',
    ]);

    const entries = await ctr.directory(DIST_DIR).entries();
    if (entries.length === 0) {
      throw new Error('Build produced an empty dist/smartspace directory');
    }

    return ctr.directory(DIST_DIR);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private nodeContainer(source: Directory, ghPackageToken?: Secret): Container {
    let ctr = dag
      .container()
      .from(NODE_IMAGE)
      .withDirectory(WORK_DIR, source)
      .withWorkdir(WORK_DIR)
      .withMountedCache('/root/.npm', dag.cacheVolume('npm-cache'));

    if (ghPackageToken) {
      ctr = ctr
        .withSecretVariable('NODE_AUTH_TOKEN', ghPackageToken)
        .withExec([
          'sh',
          '-c',
          `echo "//${GH_PACKAGES_REGISTRY}/:_authToken=\${NODE_AUTH_TOKEN}" > .npmrc` +
            ` && echo "${GH_PACKAGES_SCOPE}:registry=https://${GH_PACKAGES_REGISTRY}" >> .npmrc`,
        ]);
    } else {
      ctr = ctr.withExec([
        'sh',
        '-c',
        `echo "registry=https://registry.npmjs.org" > .npmrc`,
      ]);
    }

    return ctr.withExec(['npm', 'ci']);
  }
}
