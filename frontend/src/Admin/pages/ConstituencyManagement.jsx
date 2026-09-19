import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FaMapMarkedAlt,FaLandmark,FaBuilding,FaCity,FaUniversity,FaArrowRight } from 'react-icons/fa'
import AdminLayout from '../components/dashboard/AdminLayout'
import Styles from './AddConstitunency.module.css'


// ===================  GOVERNMENT TYPES =================== //

const GOV_BODY_CARDS = [
  {
    typeValue: 'GRAMA_PANCHAYAT',
    slug: 'grama-panchayat',
    title: 'Grama Panchayat',
    description: 'Manage Grama Panchayats and their wards.',
    icon: FaMapMarkedAlt,
  },

  {
    typeValue: 'BLOCK_PANCHAYAT',
    slug: 'block-panchayat',
    title: 'Block Panchayat',
    description: 'Manage Block Panchayats and their wards.',
    icon: FaLandmark,
  },

  {
    typeValue: 'DISTRICT_PANCHAYAT',
    slug: 'district-panchayat',
    title: 'District Panchayat',
    description: 'Manage District Panchayats and their wards.',
    icon: FaUniversity,
  },

  {
    typeValue: 'MUNICIPALITY',
    slug: 'municipality',
    title: 'Municipality',
    description: 'Manage Municipalities and their wards.',
    icon: FaBuilding,
  },

  {
    typeValue: 'CORPORATION',
    slug: 'corporation',
    title: 'Corporation',
    description: 'Manage Corporations and their wards.',
    icon: FaCity,
  },

  {
    typeValue: 'LEGISLATIVE_ASSEMBLY',
    slug: 'niyama-sabha',
    title: 'Niyama Sabha',
    description: 'Manage Legislative Assembly constituencies.',
    icon: FaLandmark,
  },

  {
    typeValue: 'LOK_SABHA',
    slug: 'lok-sabha',
    title: 'Lok Sabha',
    description: 'Manage Lok Sabha constituencies.',
    icon: FaUniversity,
  },
]


export default function ConstituencyManagement() {
  const navigate = useNavigate()
  const handleOpenGovernment = (government) => {
    navigate(`/admin/constituencies/${government.slug}`)}
  return (
    <AdminLayout title="Constituency Management">
      <div className={Styles.managementPage}>
        {/* =================== PAGE HEADER =================== */}
        <div className={Styles.managementHeader}>
          <div>
            <h1 className={Styles.managementTitle}>Constituency Management</h1>
            <p className={Styles.managementSubtitle}>Manage local, state and national government constituencies.</p>
          </div>
        </div>

        {/* =================== GOVERNMENT CARDS =================== */}
        <div className={Styles.govGrid}>
          {GOV_BODY_CARDS.map((government) => {
            const Icon = government.icon
            return (
              <div key={government.typeValue} className={Styles.govCard}>
                <div className={Styles.govCardIcon}>
                  <Icon />
                </div>

                <div className={Styles.govCardContent}>
                  {/* <h3>{government.title}</h3> */}
                  <p>{government.description}</p>
                </div>
                <button type="button" className={Styles.govViewBtn} 
                  onClick={() => handleOpenGovernment(government)}>View
                  <FaArrowRight />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}

