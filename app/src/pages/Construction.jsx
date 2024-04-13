import styles from './stylesheets/Construction.module.css'

const Construction = () => {
    return (
        <div id={styles.main}>
            <div className={styles.banner}>
                <div className={styles.banner}>! Under Construction !</div>
                <div className={styles.banner}><i>Check back soon!</i></div>
            </div>
            <a href="mailto:info@ride42.ca" target="_blank" id={styles.email}>Need help now? Contact Us 📧</a>
        </div>
    );
};

export default Construction;