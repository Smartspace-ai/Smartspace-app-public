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
   * Run lint, typecheck, and test in parallel, then build.
   * Pass ghPackageToken to install from GitHub Packages (dev),
   * or omit it to install from npmjs.com (production/client).
   */
  @func()
  async qualityCheck(
    source: Directory,
    ghPackageToken?: Secret
  ): Promise<string> {
    const base = this.nodeContainer(source, ghPackageToken);

    const [lint, typecheck, test] = await Promise.all([
      base.withExec(['npm', 'run', '-s', 'lint:all']).stdout(),
      base.withExec(['npm', 'run', '-s', 'typecheck']).stdout(),
      base.withExec(['npm', 'run', '-s', 'test']).stdout(),
    ]);

    const build = await base.withExec(['npm', 'run', '-s', 'build']).stdout();

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

    return ctr.directory('/work/dist/smartspace');
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
      .withDirectory('/work', source)
      .withWorkdir('/work')
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

    const entries = await ctr.directory('/work/dist/smartspace').entries();
    if (entries.length === 0) {
      throw new Error('Build produced an empty dist/smartspace directory');
    }

    return ctr.directory('/work/dist/smartspace');
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private nodeContainer(source: Directory, ghPackageToken?: Secret): Container {
    let ctr = dag
      .container()
      .from(NODE_IMAGE)
      .withDirectory('/work', source)
      .withWorkdir('/work')
      .withMountedCache('/root/.npm', dag.cacheVolume('npm-cache'));

    if (ghPackageToken) {
      ctr = ctr
        .withSecretVariable('NODE_AUTH_TOKEN', ghPackageToken)
        .withExec([
          'sh',
          '-c',
          'echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" > /root/.npmrc && echo "@smartspace-ai:registry=https://npm.pkg.github.com" >> /root/.npmrc',
        ]);
    }

    return ctr.withExec(['npm', 'ci']);
  }
}
