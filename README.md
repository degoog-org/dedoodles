# dedoodles

Community made logos for [degoog](https://github.com/degoog-org/degoog).

On days that have a logo, degoog shows it in place of its usual logo, and clicking it searches for whatever the logo celebrates. Totally not inspired by any major corporations.

## How to add a logo

1. Fork this repository.
2. Copy `logos/_template` to `logos/yyyymmdd/your-logo-name/`, for example `logos/20270925/comic-book-day/`.
3. Add your image as `image.png`, `image.jpg`, `image.webp` or `image.avif`, and set the same name in `logo.json`.
4. Fill in `logo.json`:
   - `query` is what degoog searches when someone clicks the logo.
   - `title` is shown as the tooltip, `en-US` is required and you can add more languages.
   - `authors` lists everyone who made it, a link is optional.
5. Fill in `README.md` with what the logo is about, who made it and credit links for anything you used or got inspired by.
6. Run `bun scripts/validate.ts` if you have [bun](https://bun.sh) installed, otherwise the PR checks will tell you what is wrong.
7. Open a pull request.

More than one logo can share a date, just give each one its own folder. Degoog picks one of them at random.

## Rules

- **NO AI**
  - Whilst some Degoog features and bugfixes have been dealt with AI and the coding world is going toward a very agentic state, we still absolutely despise image generation proposed as "AI Art". LLMs are token predictors, there's nothing creative about them, this is a place for the community to share their creativity. Anything blatantly done with AI will be automatically rejected.
- Images must be under 1 MB.
- Only submit work you made or have permission to share.
- No NSFW.
- Do not edit `manifest.json`, it is rebuilt automatically when a pull request is merged.

## How degoog uses this

`manifest.json` lists every logo by date, along with the commit the images should be downloaded from.
Degoog fetches it once a day, and only downloads an image when today has a logo.
