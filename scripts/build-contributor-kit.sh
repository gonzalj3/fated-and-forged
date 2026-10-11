#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "$0")/.." && pwd)"
output_dir="$project_root/public/contributor-kit"
output_file="$output_dir/fated-and-forged-source.tar.gz"
staging_dir="$(mktemp -d)"

cleanup() {
  rm -rf "$staging_dir"
}
trap cleanup EXIT

mkdir -p "$output_dir"

tar \
  --exclude='./.git' \
  --exclude='./.next' \
  --exclude='./.vercel' \
  --exclude='./node_modules' \
  --exclude='./public/contributor-kit' \
  --exclude='./.env' \
  --exclude='./.env.*' \
  --exclude='./*.log' \
  -czf "$staging_dir/fated-and-forged-source.tar.gz" \
  -C "$project_root" .

mv "$staging_dir/fated-and-forged-source.tar.gz" "$output_file"
echo "Created $output_file"
