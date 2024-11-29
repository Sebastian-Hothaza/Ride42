export default async function fetchLogs(APIServer) {
    let logs;
    try {
        const response = await fetch(APIServer + 'logs', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        })
        if (response.ok) {
            logs = await response.json();
        } else {
            return data.msg.join('\n')
        }
    } catch (err) {
        console.error(err.message)
        return err.message;
    }

    let output = '';
    logs.forEach((logEntry) => {
        const isoDate = logEntry.timestamp;
        const date = new Date(isoDate);
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const niceDate = date.toLocaleDateString('en-US', options);
        output += `${niceDate}: [${logEntry.level}]: ${logEntry.message}\n`
    })

    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'log_dump.txt';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url); // avoid potential memory leaks.
}
