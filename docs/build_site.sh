#!/usr/bin/env bash
# build_site.sh — 同步 README.md → site/index.html，并把 markdown 转 html
# 用法：bash docs/build_site.sh

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DOCS="$REPO/docs"

echo "Building GitHub Pages site..."

# 同步根 README 到 docs/index.html
cp "$REPO/README.md" "$DOCS/index.md"

# 用 pandoc 把 README + 每个 prompt + 教程 转成 html
which pandoc > /dev/null || { echo "❌ pandoc not found"; exit 1; }

# 索引页：已经在 docs/index.html 手写，跳过

# 每个 prompt 文件生成对应 html（放 docs/prompts/<dir>/<name>.html）
for src in $(find "$REPO/prompts" -name "*.md"); do
    rel="${src#$REPO/prompts/}"     # general/self-reflect.md
    name="${rel%.md}"               # general/self-reflect
    out="$DOCS/prompts/${name}.html"
    mkdir -p "$(dirname "$out")"
    # pandoc 转 markdown → html，模板自定义
    pandoc "$src" \
        --from markdown --to html5 \
        --standalone \
        --template "$DOCS/template.html" \
        --metadata title="$(basename "$name" | sed 's/-/ /g')" \
        --css "../style.css" \
        --output "$out"
    echo "  ✓ prompts/${name}.html"
done

# 教程生成
for src in $(find "$REPO/tutorials" -name "*.md"); do
    rel="${src#$REPO/tutorials/}"
    name="${rel%.md}"
    out="$DOCS/tutorials/${name}.html"
    mkdir -p "$(dirname "$out")"
    # 教程页是手写 html（已经存好了），跳过
done

echo ""
echo "✅ Build complete:"
echo "   docs/index.html       (site landing)"
echo "   docs/style.css        (shared CSS)"
ls -1 "$DOCS/prompts" 2>/dev/null | head -10
echo ""
echo "Visit: file://$DOCS/index.html"