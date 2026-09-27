import MyWardSidebar from '../../components/MyWardSidebar'
import Styles from '../../components/module.css/MyWard.module.css' 
export default function RepresentativeMyWardHome() {
  return <div className={Styles.page}>
    <MyWardSidebar />
    <main className={Styles.content}>
    <div className={Styles.header}>
      <h1>My Ward</h1>
      <p>Representative communication with citizens in the constituency.</p>
      </div>
    <div className={Styles.card}>
      <div className={Styles.title}>Representative MyWard</div>
      <div className={Styles.body}>
        Publish alerts, constituency updates and public action notices.
        </div>
    </div>
  </main>
  </div>
}
