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

@object()
class WebPipeline {
  /**
   * Run the full quality gate: lint, typecheck, test, build.
   */
  @func()
  async qualityCheck(
    source: Directory,
    ghPackageToken: Secret
  ): Promise<string> {
    const ctr = this.nodeContainer(source, ghPackageToken)
      .withExec(['npm', 'run', '-s', 'lint:all'])
      .withExec(['npm', 'run', '-s', 'typecheck'])
      .withExec(['npm', 'run', '-s', 'test'])
      .withExec(['npm', 'run', '-s', 'build']);

    return ctr.stdout();
  }

  /**
   * Build the app and return the dist/smartspace directory.
   */
  @func()
  async build(source: Directory, ghPackageToken: Secret): Promise<Directory> {
    const ctr = this.nodeContainer(source, ghPackageToken).withExec([
      'npm',
      'run',
      '-s',
      'build',
    ]);

    return ctr.directory('/work/dist/smartspace');
  }

  // ---------------------------------------------------------------------------
  // Checks (run with: dagger check)
  // ---------------------------------------------------------------------------

  @func()
  @check()
  async checkLint(source: Directory, ghPackageToken: Secret): Promise<string> {
    return this.nodeContainer(source, ghPackageToken)
      .withExec(['npm', 'run', '-s', 'lint:all'])
      .stdout();
  }

  @func()
  @check()
  async checkTypecheck(
    source: Directory,
    ghPackageToken: Secret
  ): Promise<string> {
    return this.nodeContainer(source, ghPackageToken)
      .withExec(['npm', 'run', '-s', 'typecheck'])
      .stdout();
  }

  @func()
  @check()
  async checkTests(source: Directory, ghPackageToken: Secret): Promise<string> {
    return this.nodeContainer(source, ghPackageToken)
      .withExec(['npm', 'run', '-s', 'test'])
      .stdout();
  }

  @func()
  @check()
  async checkBuild(
    source: Directory,
    ghPackageToken: Secret
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

  private nodeContainer(source: Directory, ghPackageToken: Secret): Container {
    return dag
      .container()
      .from(NODE_IMAGE)
      .withDirectory('/work', source)
      .withWorkdir('/work')
      .withMountedCache('/root/.npm', dag.cacheVolume('npm-cache'))
      .withSecretVariable('NODE_AUTH_TOKEN', ghPackageToken)
      .withExec([
        'sh',
        '-c',
        'echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" > /root/.npmrc && echo "@smartspace-ai:registry=https://npm.pkg.github.com" >> /root/.npmrc',
      ])
      .withExec(['npm', 'ci']);
  }
}
