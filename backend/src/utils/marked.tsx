import { marked as m } from "marked";
import type { FC } from "hono/jsx";

const Layout: FC = (props) => {
    return (
        <html style={{ "background-color": "#0d1117", }}>
            <head>
                <meta charset="UTF-8" />
                <title>Coffli</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.8.1/github-markdown.min.css" />
                <link href="https://cdn.jsdelivr.net/npm/prism-themes@1.9.0/themes/prism-one-dark.min.css" rel="stylesheet" />
            </head>
            <body class="markdown-body" style={{
                "max-width": "50rem",
                "margin": "0 auto !important",
                "padding": "2rem",
            }} dangerouslySetInnerHTML={{ __html: props.children }}>
            </body>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.30.0/components/prism-core.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.30.0/plugins/autoloader/prism-autoloader.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.30.0/plugins/normalize-whitespace/prism-normalize-whitespace.min.js"></script>
        </html>
    );
};

export default function marked(md: string): string {
    return (
        <Layout>{m.parse(md.trim())}</Layout>
    ).toString();
}