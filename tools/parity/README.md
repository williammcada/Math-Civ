# Engine parity tools

Used on 13 Oct 2026 to prove that the TypeScript source in this repository reproduces the shipped `PLAY-SEKIGAHARA-0.3.1.html` rules engine.

```sh
python3 tools/parity/extract-shipped-engine.py PLAY-SEKIGAHARA-0.3.1.html .parity/shipped-engine.cjs
npx esbuild tools/parity/source-entry.ts --bundle --platform=node --format=cjs --outfile=.parity/source-engine.cjs
node tools/parity/fuzz.cjs 60 4000
```

`fuzz.cjs` chooses commands that are legal on the shipped engine (orders with right, wrong and fraction answers, hints, adviser, unchecked plans, cancels, crises with emergency substitution, convoy, provisioning, war chest, all four tactical plans with both reserve entries, deployment, every battle action, council and withdrawal). It replays each command on the source engine and compares the complete game state and any rule-violation message after every step. Any difference is printed with the command that caused it.

The extractor relies on the minified names in the v0.3.1 bundle; it does not apply to later builds.
