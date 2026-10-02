# skill-sheet

Build a Japanese resume (履歴書) and an engineer skill sheet (職務経歴書).

- 履歴書 in the MHLW sample layout, A4 × 2
- 職務経歴書 with projects, tech stack, phases and skill levels
- A4 preview, PDF via the browser's print dialog
- JSON export / import, Markdown export
- Draft skills and personal projects from a public GitHub account
- 西暦 / 和暦

## Web

<https://sena10x.github.io/skill-sheet/>

Fill in the form, check the preview, click **PDF保存・印刷** and choose
"Save as PDF" (A4, default margins, 100% scale).

## Development

```sh
npm install
npm run dev
npm test
npm run lint
npm run build
```

## Privacy

Everything you enter, including the photo, stays in your browser and is saved
to its localStorage so it survives a reload. **すべて消去** removes it.

The only network request with your input is the optional GitHub draft, which
sends the username you type to `api.github.com` to list that account's public
repositories.

## Analytics

The web app uses Google Analytics for basic anonymous usage metrics: page
visits, which sheet is opened, and which export or import is used. Names,
contact details, text, photos and GitHub usernames are never sent.

## License

MIT
