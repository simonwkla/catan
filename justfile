# Catan workspace tasks

[group('lint')]
fmt:
    pnpm run fmt
    # run cargo fmt
    cargo fmt --manifest-path artifact/tile-builder/Cargo.toml

[group('lint')]
lint:
    pnpm run lint

[group('lint')]
lint-fix:
    pnpm run fmt
    pnpm run lint:fix-unsafe
    pnpm run lint

[group('lint')]
typecheck:
    pnpm run typecheck

[group('test')]
test-ci:
    pnpm --filter './artifact/catan' run test:ci

[group('dev')]
start:
    docker compose up --build -d

# build tile-builder and copy the binary into the extension's bin directory
[group('build')]
build-tb:
    cargo build --release --manifest-path artifact/tile-builder/Cargo.toml
    mkdir -p artifact/tile-builder-extension/bin
    cp artifact/tile-builder/target/release/tile-builder artifact/tile-builder-extension/bin/

[group('build')]
build-tb-ext: build-tb
    pnpm --filter './artifact/tile-builder-extension' run compile:release
    pnpm --filter './artifact/tile-builder-extension' run package

install-tb-ext: build-tb-ext
    cursor --install-extension ./artifact/tile-builder-extension/out/tile-builder-ext.vsix

[group('assets')]
build-assets:
    rm -rf assets/isle-of-lore/tiles
    cargo run --release --manifest-path artifact/tile-builder/Cargo.toml -- --config assets/isle-of-lore/tile-builder-config.json

# nuke node_modules, pnpm store and tsconfig build info files
[group('nuke')]
nuke-pnpm:
    find . -name "node_modules" -type d -exec rm -rf {} +
    rm -rf ./.pnpm-store/
    find . -name "tsconfig.tsbuildinfo" -type f -exec rm -rf {} +

# nuke the docker compose stack
[group('nuke')]
nuke-docker:
    docker compose rm -f -s -v

# nuke the docker compose stack and remove all node_modules
[group('nuke')]
nuke: nuke-pnpm nuke-docker
