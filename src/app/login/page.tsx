import { getShopName } from '@/actions/settings'
import LoginClient from './LoginClient'

export default async function LoginPage() {
  const shopName = await getShopName()
  return <LoginClient shopName={shopName} />
}
