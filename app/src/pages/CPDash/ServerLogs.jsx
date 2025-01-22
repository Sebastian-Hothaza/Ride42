import { useEffect, useState, Fragment } from "react";
import styles from './stylesheets/ServerLogs.module.css'

const ServerLogs = ({ APIServer }) => {
    const [logs, setLogs] = useState([]);
    const [levelFilter, setLevelFilter] = useState([]);
    const [logLevels, setLogLevels] = useState([]); // Tracks all existing log levels

    // Load in logs
    useEffect(() => {
        async function fetchLogs() {
            try {
                const response = await fetch(APIServer + 'logs', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-type': 'application/json; charset=UTF-8',
                    },
                });
                if (response.ok) {
                    const logData = await response.json();
                    let levelsArray = ['info', 'warn', 'error'];
                    // Augment each log object to have a 'prettyDate' param
                    logData.forEach((logEntry) => {
                        const isoDate = logEntry.timestamp;
                        const date = new Date(isoDate);
                        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
                        logEntry.prettyDate = date.toLocaleDateString('en-US', options);
                        // Update Levels Array to include any levels missed
                        if (!levelsArray.includes(logEntry.level)) levelsArray.push(logEntry.level);
                    });
                    setLogLevels(levelsArray);
                    setLogs(logData);
                    setLevelFilter(levelsArray); // Set all levels as default filters
                } else {
                    const data = await response.json();
                    console.error(data.msg.join('\n'));
                    return data.msg.join('\n');
                }
            } catch (err) {
                console.error(err.message);
                return err.message;
            }
        }

        fetchLogs();
    }, [APIServer]);

    useEffect(() => {
        const logWindow = document.getElementById(styles.logWindow);
        if (logWindow) {
            logWindow.scrollTop = logWindow.scrollHeight;
        }
    }, [logs]);

    function handleCheckboxChange(level) {
        setLevelFilter((prevFilters) =>
            prevFilters.includes(level)
                ? prevFilters.filter((f) => f !== level)
                : [...prevFilters, level]
        );
    }

    const filteredLogs = levelFilter.length === 0
        ? [] // Show no logs if no level is selected
        : logs.filter((logEntry) => levelFilter.includes(logEntry.level));

    return (
        <>
            <h1>Server Logs</h1>
            <div className={styles.checkboxContainer}>
                <h2>Apply Filters</h2>
                {logLevels.map((level) => (
                    <label key={level}> <input type="checkbox" value={level} checked={levelFilter.includes(level)} onChange={() => handleCheckboxChange(level)} /> {level}</label>
                ))}
            </div>
            <div id={styles.logWindow}>
                {filteredLogs.length > 0 ?
                    filteredLogs.map((logEntry) => (
                        <Fragment key={logEntry._id}>
                            <div>{logEntry.prettyDate}: </div>
                            <div className={styles[logEntry.level]}>[{logEntry.level}]: </div>
                            <div>{logEntry.message}</div>
                        </Fragment>
                    )):<div>No logs to display</div>
                }
            </div>
        </>
    );
};

export default ServerLogs;
