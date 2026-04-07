import {
  dag,
  Container,
  Directory,
  object,
  func,
  check,
} from '@dagger.io/dagger';

const NODE_IMAGE = 'node:20-slim';
const WORK_DIR = '/work';
const DIST_DIR = '/work/dist/smartspace';

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
   */
  @func()
  async qualityCheck(source: Directory): Promise<string> {
    const base = this.nodeContainer(source);

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
   */
  @func()
  async build(source: Directory): Promise<Directory> {
    const ctr = this.nodeContainer(source).withExec([
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
  async checkLint(source: Directory): Promise<string> {
    return this.nodeContainer(source)
      .withExec(['npm', 'run', '-s', 'lint:all'])
      .stdout();
  }

  @func()
  @check()
  async checkTypecheck(source: Directory): Promise<string> {
    return this.nodeContainer(source)
      .withExec(['npm', 'run', '-s', 'typecheck'])
      .stdout();
  }

  @func()
  @check()
  async checkTests(source: Directory): Promise<string> {
    return this.nodeContainer(source)
      .withExec(['npm', 'run', '-s', 'test'])
      .stdout();
  }

  @func()
  @check()
  async checkBuild(source: Directory): Promise<Directory> {
    const ctr = this.nodeContainer(source).withExec([
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

  private nodeContainer(source: Directory): Container {
    return dag
      .container()
      .from(NODE_IMAGE)
      .withDirectory(WORK_DIR, source)
      .withWorkdir(WORK_DIR)
      .withMountedCache('/root/.npm', dag.cacheVolume('npm-cache'))
      .withExec(['npm', 'ci']);
  }
}
