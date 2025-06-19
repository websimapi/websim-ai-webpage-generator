const GeneratedPageView = ({ page, onClose }) => {
    const iframeContent = `
        <html>
            <head>
                <style>${page.css}</style>
            </head>
            <body>
                ${page.html}
                <script>${page.js}<\/script>
            </body>
        </html>
    `;

    return React.createElement('div', {
        className: 'generated-page-view'
    }, [
        React.createElement('button', {
            key: 'close-btn',
            className: 'close-button',
            onClick: onClose
        }, React.createElement('i', { className: 'fas fa-times' })),
        React.createElement('iframe', {
            key: 'iframe',
            className: 'generated-page-iframe',
            srcDoc: iframeContent,
            sandbox: 'allow-scripts allow-forms allow-same-origin'
        })
    ]);
};