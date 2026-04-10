import { PACIFICA_API_ENDPOINTS } from '@/lib/constants'

/**
 * Proxies GET /api/v1/orders?account=...
 * @see https://pacifica.gitbook.io/docs/api-documentation/api/rest-api/orders/get-open-orders
 */
export async function GET(request: Request) {
  const account = new URL(request.url).searchParams.get('account')
  if (!account) {
    return Response.json({ error: 'account is required' }, { status: 400 })
  }

  const url = `${PACIFICA_API_ENDPOINTS.GET_OPEN_ORDERS}?${new URLSearchParams({ account })}`
  const res = await fetch(url, {
    headers: { Accept: '*/*' },
    cache: 'no-store',
  })

  const text = await res.text()
  try {
    const data = JSON.parse(text) as unknown
    return Response.json(data, { status: res.status })
  } catch {
    return new Response(text, { status: res.status })
  }
}
