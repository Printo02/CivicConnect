import styles from "./Footer.module.css";
import {FaTwitter,FaFacebookSquare,FaYoutube,FaLinkedin,FaGithub} from "react-icons/fa";

function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.logoSection}>
            <h2 className={styles.logo}>CivicConnect</h2>
          </div>
          <div className={styles.links}>
            <div className={styles.column}>
              <h4>Pages</h4>
              <a href="/#">Home</a>
              <a href="/">About</a>
              <a href="/">Contact</a>
              <a href="/">Departments</a>
              <a href="/">Login</a>
              <a href="/">Registrations</a>
            </div>
            <div className={styles.column}>
              <h4>Support</h4>
              <a href="/">Help</a>
              <a href="/">Phone</a>
              <a href="/">Email</a>
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <div className={styles.left}>
            <span>© 2026 CivicConnect Inc.</span>
            <a href="/">Terms</a>
            <a href="/">Privacy</a>
          </div>
          <div className={styles.social}>
            <FaTwitter />
            <FaFacebookSquare />
            <FaYoutube />
            <FaLinkedin />
            <FaGithub />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;