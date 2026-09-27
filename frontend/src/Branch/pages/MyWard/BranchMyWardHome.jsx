import MyWardSidebar from '../../components/MyWardSidebar'
import Styles from './MyWard.module.css'
export default function BranchMyWardHome() {
  return <div className={Styles.page}>
    <MyWardSidebar />
  <main className={Styles.content}>
    <div className={Styles.header}>
      <h1>My Ward</h1>
    <p>Branch communication with citizens in your locality.</p>
    </div>
    <div className={Styles.card}>
      <div className={Styles.title}>Branch MyWard</div>
      <div className={Styles.body}>Publish alerts, service notices, scheduled work and action updates.</div>
    </div>
  </main>
  </div>
}
