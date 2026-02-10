import Layout from '@renderer/src/layouts/index.vue'

export default [
  {
    path: '/',
    name: 'Root',
    redirect: '/dashboard',
    component: Layout,
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@renderer/src/pages/dashboard/index.vue'),
        meta: {
          title: '仪表盘',
          icon: 'LayoutDashboard'
        }
      }
    ]
  },
  {
    path: '/payment',
    name: 'Payment',
    redirect: '/payment/refund',
    component: Layout,
    meta: {
      title: '退款',
      icon: 'CreditCard'
    },
    children: [
      {
        path: 'refund',
        name: 'Refund',
        component: () => import('@renderer/src/pages/payment/refund/index.vue'),
        meta: {
          title: '退款',
          icon: 'CreditCard'
        }
      }
    ]
  }
]
