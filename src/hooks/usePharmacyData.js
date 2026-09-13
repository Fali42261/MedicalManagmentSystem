import { useContext } from 'react'
import { PharmacyDataContext } from '../context/pharmacyData.context'

export function usePharmacyData() {
  const context = useContext(PharmacyDataContext)
  if (!context) throw new Error('usePharmacyData must be used inside PharmacyDataProvider')
  return context
}
