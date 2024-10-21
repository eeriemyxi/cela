#!/usr/bin/fish

set TARGETS \
    x86_64-unknown-linux-gnu \
    aarch64-unknown-linux-gnu \
    x86_64-apple-darwin \
    aarch64-apple-darwin \
    x86_64-pc-windows-msvc 
set TARGET_EXTENSIONS .bin .bin .bin .bin ""
set NAME cela

mkdir -p bin

for i in (seq 1 (count $TARGETS))
    deno compile --no-check --target=$TARGETS[$i] --allow-net --allow-run --output ./bin/$TARGETS[$i]-$NAME$TARGET_EXTENSIONS[$i] src/main.ts
end
