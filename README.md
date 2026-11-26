# CMV website

Static site for CÔNG TY TNHH CHARGER MECHATRONIC (Vietnamese, Traditional Chinese, English, Korean), published with GitHub Pages from the `gh-pages` branch.

## How it is put together

| Path | What |
|---|---|
| `content/*.json` | All text. One entry per sentence with `vi`, `zh`, `en`, `ko`. Edit these (or use the editor below). |
| `content/images.json` | Picture slots. Change `image` to swap a picture everywhere it is used. |
| `content/company.json` | Phone numbers, email, tax code. Change `value`; the whole site follows. |
| `templates/` | Page layout. Text positions are marked like `⟦1a2b3c4d:e⟧`; do not edit those marks. |
| `static/` | Files copied as they are: styles, scripts, fonts, pictures, `robots.txt`, `sitemap.xml`. |
| `build.py` | Puts content into the templates and writes `_site/`. |
| `.github/workflows/build.yml` | Runs `build.py` on every change to `main` and publishes the result. |
| `.pages.yml` | Editor configuration for Pages CMS. |

## Editing without code

1. Open https://app.pagescms.org and sign in with the GitHub account that owns this repository.
2. Install the Pages CMS GitHub app on `cmv-site` when asked, then open the repository.
3. Pick a page on the left, open a sentence, change the text in any language, and save.
4. The site rebuilds by itself; the change is live in about two minutes.

An empty language field falls back to English, then Vietnamese.

## Building locally

```bash
pip install pillow
python3 build.py _site
```

## Notes

- `static/data/products.json` and `static/llms.txt` are not rebuilt from `content/`; product names changed in `content/` do not update them.
- Specification tables stay in English and live in `templates/`.
- Keep `static/google*.html` and the IndexNow key file: they prove site ownership to search engines.
