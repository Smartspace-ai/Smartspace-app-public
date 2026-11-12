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

@object()
class WebPipeline {
  /**
   * Run lint, typecheck, test, and build in parallel.
   */
  @func()
  async qualityCheck(source: Directory): Promise<string> {
    const base = this.nodeContainer(source);

    const [lint, typecheck, test, build] = await Promise.all([
      base.withExec(['pnpm', 'run', '-s', 'lint:all']).stdout(),
      base.withExec(['pnpm', 'run', '-s', 'typecheck']).stdout(),
      base.withExec(['pnpm', 'run', '-s', 'test']).stdout(),
      base.withExec(['pnpm', 'run', '-s', 'build']).stdout(),
    ]);

    return [lint, typecheck, test, build].join('\n');
  }

  /**
   * Build the app and return the dist/smartspace directory.
   */
  @func()
  async build(source: Directory): Promise<Directory> {
    const ctr = this.nodeContainer(source).withExec([
      'pnpm',
      'run',
      '-s',
      'build',
    ]);

    return ctr.directory(DIST_DIR);
  }

  // ---------------------------------------------------------------------------
  // Checks (run with: dagger check)
  // ---------------------------------------------------------------------------

  @func()
  @check()
  async checkLint(source: Directory): Promise<string> {
    return this.nodeContainer(source)
      .withExec(['pnpm', 'run', '-s', 'lint:all'])
      .stdout();
  }

  @func()
  @check()
  async checkTypecheck(source: Directory): Promise<string> {
    return this.nodeContainer(source)
      .withExec(['pnpm', 'run', '-s', 'typecheck'])
      .stdout();
  }

  @func()
  @check()
  async checkTests(source: Directory): Promise<string> {
    return this.nodeContainer(source)
      .withExec(['pnpm', 'run', '-s', 'test'])
      .stdout();
  }

  @func()
  @check()
  async checkBuild(source: Directory): Promise<Directory> {
    const ctr = this.nodeContainer(source).withExec([
      'pnpm',
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
      .withMountedCache('/pnpm-store', dag.cacheVolume('pnpm-store'))
      .withEnvVariable('COREPACK_ENABLE_DOWNLOAD_PROMPT', '0')
      .withExec(['corepack', 'enable'])
      .withExec(['pnpm', 'config', 'set', 'store-dir', '/pnpm-store'])
      .withExec(['pnpm', 'install', '--frozen-lockfile']);
  }
}
